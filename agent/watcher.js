import chokidar from 'chokidar';

export class Watcher {
  constructor({ claudeDir, idleTimeoutMs, onSessionIdle, logger }) {
    this.claudeDir = claudeDir;
    this.idleTimeoutMs = idleTimeoutMs;
    this.onSessionIdle = onSessionIdle;
    this.logger = logger;
    this.timers = new Map(); // path -> timeout
    this.inFlight = new Set(); // path currently being pushed
    this.watcher = null;
  }

  start() {
    this.watcher = chokidar.watch(`${this.claudeDir}/**/*.jsonl`, {
      ignoreInitial: true, // 데몬 시작 전 기존 세션은 건드리지 않음
      persistent: true,
      awaitWriteFinish: false,
      usePolling: false,
    });

    this.watcher
      .on('add', (path) => this._scheduleIdle(path, 'add'))
      .on('change', (path) => this._scheduleIdle(path, 'change'))
      .on('error', (err) => this.logger.warn(`[watcher] error: ${err.message}`));

    this.logger.info(`[watcher] watching ${this.claudeDir}/**/*.jsonl (idle=${this.idleTimeoutMs}ms)`);
  }

  _scheduleIdle(path, eventType) {
    if (this.inFlight.has(path)) {
      // 전송 중인 파일은 타이머 재설정만 하고 트리거하지 않음
      return;
    }
    const existing = this.timers.get(path);
    if (existing) clearTimeout(existing);

    const timer = setTimeout(async () => {
      this.timers.delete(path);
      if (this.inFlight.has(path)) return;
      this.inFlight.add(path);
      try {
        await this.onSessionIdle(path);
      } catch (err) {
        this.logger.warn(`[watcher] handler error for ${path}: ${err.message}`);
      } finally {
        this.inFlight.delete(path);
      }
    }, this.idleTimeoutMs);

    this.timers.set(path, timer);
    this.logger.debug?.(`[watcher] ${eventType} ${path} — timer reset`);
  }

  async stop() {
    for (const timer of this.timers.values()) clearTimeout(timer);
    this.timers.clear();
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
    }
    this.logger.info('[watcher] stopped');
  }

  async drain(timeoutMs = 30_000) {
    // 진행 중인 전송이 끝날 때까지 대기 (최대 timeoutMs)
    const start = Date.now();
    while (this.inFlight.size > 0 && Date.now() - start < timeoutMs) {
      await new Promise((r) => setTimeout(r, 200));
    }
  }
}
