#!/usr/bin/env node
import { readFile, mkdir, appendFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { Watcher } from './watcher.js';
import { State } from './state.js';
import { collectSession } from './collector.js';
import { pushSession } from './sender.js';

const HOME = homedir();
const ASKTREE_HOME = join(HOME, '.asktree');
const CONFIG_PATH = join(ASKTREE_HOME, 'config.env');
const STATE_PATH = join(ASKTREE_HOME, 'state.json');
const LOG_PATH = join(ASKTREE_HOME, 'logs', 'agent.log');
const DEFAULT_CLAUDE_DIR = join(HOME, '.claude', 'projects');
const DEFAULT_IDLE_TIMEOUT_MS = 60_000;
const DEFAULT_API_URL = 'http://localhost:3000';

async function loadConfig() {
  let raw;
  try {
    raw = await readFile(CONFIG_PATH, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') {
      // 파일이 없으면 process.env만 사용
      raw = '';
    } else {
      throw err;
    }
  }

  const fromFile = parseEnvFile(raw);
  const merged = { ...fromFile, ...pickEnv() };

  const projectId = merged.ASKTREE_PROJECT_ID;
  const token = merged.ASKTREE_AGENT_TOKEN;
  const apiUrl = merged.ASKTREE_API_URL || DEFAULT_API_URL;
  const idleTimeoutMs = parseInt(merged.ASKTREE_IDLE_TIMEOUT_MS || '', 10) || DEFAULT_IDLE_TIMEOUT_MS;
  const claudeDir = merged.ASKTREE_CLAUDE_DIR || DEFAULT_CLAUDE_DIR;

  const missing = [];
  if (!projectId) missing.push('ASKTREE_PROJECT_ID');
  if (!token) missing.push('ASKTREE_AGENT_TOKEN');
  if (missing.length > 0) {
    throw new Error(
      `Missing required config: ${missing.join(', ')}. Set in ${CONFIG_PATH} or environment.`
    );
  }

  return { projectId, token, apiUrl, idleTimeoutMs, claudeDir };
}

function parseEnvFile(text) {
  const out = {};
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

function pickEnv() {
  const keys = [
    'ASKTREE_PROJECT_ID',
    'ASKTREE_AGENT_TOKEN',
    'ASKTREE_API_URL',
    'ASKTREE_IDLE_TIMEOUT_MS',
    'ASKTREE_CLAUDE_DIR',
  ];
  const out = {};
  for (const k of keys) {
    if (process.env[k]) out[k] = process.env[k];
  }
  return out;
}

function createLogger() {
  const write = async (level, msg) => {
    const line = `[${new Date().toISOString()}] [${level}] ${msg}\n`;
    process.stdout.write(line);
    try {
      await mkdir(join(ASKTREE_HOME, 'logs'), { recursive: true });
      await appendFile(LOG_PATH, line, 'utf8');
    } catch {
      // 로그 파일 쓰기 실패는 무시 (stdout으로는 출력됨)
    }
  };
  return {
    info: (m) => write('info', m),
    warn: (m) => write('warn', m),
    error: (m) => write('error', m),
  };
}

async function main() {
  const logger = createLogger();
  let config;
  try {
    config = await loadConfig();
  } catch (err) {
    await logger.error(err.message);
    process.exit(1);
  }

  await logger.info(
    `Asktree agent starting — project=${config.projectId} api=${config.apiUrl} idle=${config.idleTimeoutMs}ms`
  );

  const state = new State(STATE_PATH);
  await state.load();

  const watcher = new Watcher({
    claudeDir: config.claudeDir,
    idleTimeoutMs: config.idleTimeoutMs,
    logger,
    onSessionIdle: async (path) => {
      await logger.info(`session idle detected: ${path}`);
      const result = await collectSession(path);
      if (!result.ok) {
        await logger.warn(`collect skip (${result.reason}): ${path}`);
        return;
      }
      if (state.has(result.sessionId)) {
        await logger.info(`session ${result.sessionId} already pushed — skip`);
        return;
      }
      for (const w of result.warnings) await logger.warn(w);

      const pushResult = await pushSession({
        apiUrl: config.apiUrl,
        token: config.token,
        projectId: config.projectId,
        sessionResult: result,
      });

      if (pushResult.ok) {
        await state.markPushed(result.sessionId);
        await logger.info(
          `push ok (${pushResult.duplicate ? 'duplicate' : 'new'}) session=${pushResult.sessionId}`
        );
      } else {
        await logger.error(
          `push failed: status=${pushResult.status ?? 'n/a'} ${
            pushResult.error ?? JSON.stringify(pushResult.body ?? '')
          }`
        );
      }
    },
  });

  watcher.start();

  const shutdown = async (signal) => {
    await logger.info(`received ${signal} — shutting down`);
    await watcher.stop();
    await watcher.drain();
    await logger.info('shutdown complete');
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  console.error(`[fatal] ${err.stack ?? err.message}`);
  process.exit(1);
});
