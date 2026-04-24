#!/usr/bin/env bash
# Asktree 로컬 에이전트 설치 스크립트
#
# 사용법:
#   ./setup-asktree.sh --project-id <uuid> --token <agent-token> [--api-url <url>]
#
# 환경변수로도 전달 가능:
#   ASKTREE_PROJECT_ID=<uuid> ASKTREE_AGENT_TOKEN=<token> ./setup-asktree.sh

set -euo pipefail

# ─── 색상 ─────────────────────────────────────────────
if [[ -t 1 ]]; then
  C_RED=$'\033[31m'; C_GREEN=$'\033[32m'; C_YELLOW=$'\033[33m'; C_BLUE=$'\033[34m'; C_RESET=$'\033[0m'
else
  C_RED=''; C_GREEN=''; C_YELLOW=''; C_BLUE=''; C_RESET=''
fi
log()  { echo "${C_BLUE}▸${C_RESET} $*"; }
ok()   { echo "${C_GREEN}✓${C_RESET} $*"; }
warn() { echo "${C_YELLOW}!${C_RESET} $*" >&2; }
err()  { echo "${C_RED}✗${C_RESET} $*" >&2; }

# ─── 경로 ─────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AGENT_SRC="$SCRIPT_DIR/agent"
ASKTREE_HOME="$HOME/.asktree"
AGENT_DEST="$ASKTREE_HOME/agent"
CONFIG_PATH="$ASKTREE_HOME/config.env"
LOG_DIR="$ASKTREE_HOME/logs"
SERVICE_LABEL="com.asktree.agent"
LAUNCHD_PLIST="$HOME/Library/LaunchAgents/${SERVICE_LABEL}.plist"
SYSTEMD_UNIT="$HOME/.config/systemd/user/asktree-agent.service"

# ─── 인자 파싱 ────────────────────────────────────────
PROJECT_ID="${ASKTREE_PROJECT_ID:-}"
AGENT_TOKEN="${ASKTREE_AGENT_TOKEN:-}"
API_URL="${ASKTREE_API_URL:-http://localhost:3000}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --project-id) PROJECT_ID="$2"; shift 2 ;;
    --token)      AGENT_TOKEN="$2"; shift 2 ;;
    --api-url)    API_URL="$2"; shift 2 ;;
    -h|--help)
      cat <<EOF
Asktree 에이전트 설치 스크립트

사용법:
  $0 --project-id <uuid> --token <agent-token> [--api-url <url>]

옵션:
  --project-id  Asktree 프로젝트 UUID (필수)
  --token       에이전트 토큰 (필수)
  --api-url     Asktree API URL (기본: http://localhost:3000)
EOF
      exit 0 ;;
    *) err "Unknown option: $1"; exit 1 ;;
  esac
done

# ─── 누락 값 프롬프트 ─────────────────────────────────
if [[ -z "$PROJECT_ID" ]]; then
  read -rp "ASKTREE_PROJECT_ID: " PROJECT_ID
fi
if [[ -z "$AGENT_TOKEN" ]]; then
  read -rsp "ASKTREE_AGENT_TOKEN: " AGENT_TOKEN
  echo
fi
if [[ -z "$PROJECT_ID" || -z "$AGENT_TOKEN" ]]; then
  err "PROJECT_ID와 TOKEN은 필수입니다."
  exit 1
fi

# ─── 사전 체크 ────────────────────────────────────────
log "Node.js 버전 확인"
if ! command -v node >/dev/null 2>&1; then
  err "Node.js가 설치되어 있지 않습니다. Node 20 이상을 설치하세요."
  exit 1
fi
NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
if (( NODE_MAJOR < 20 )); then
  err "Node.js 20 이상이 필요합니다. (현재: $(node -v))"
  exit 1
fi
ok "Node.js $(node -v)"

if ! command -v npm >/dev/null 2>&1; then
  err "npm이 설치되어 있지 않습니다."
  exit 1
fi

if [[ ! -d "$AGENT_SRC" ]]; then
  err "에이전트 소스를 찾을 수 없습니다: $AGENT_SRC"
  exit 1
fi

# ─── 파일 복사 ────────────────────────────────────────
log "에이전트를 $AGENT_DEST 에 설치"
mkdir -p "$AGENT_DEST" "$LOG_DIR"
cp "$AGENT_SRC"/*.js "$AGENT_DEST/"
cp "$AGENT_SRC"/package.json "$AGENT_DEST/"

log "의존성 설치 (npm install --production)"
(cd "$AGENT_DEST" && npm install --production --silent)
ok "의존성 설치 완료"

# ─── config.env ──────────────────────────────────────
log "$CONFIG_PATH 작성"
umask 077
cat > "$CONFIG_PATH" <<EOF
# Asktree 에이전트 설정 (자동 생성)
ASKTREE_PROJECT_ID=$PROJECT_ID
ASKTREE_AGENT_TOKEN=$AGENT_TOKEN
ASKTREE_API_URL=$API_URL
EOF
chmod 600 "$CONFIG_PATH"
ok "config.env 작성 완료 (권한 600)"

# ─── 서비스 등록 ─────────────────────────────────────
NODE_BIN="$(command -v node)"
OS="$(uname -s)"

install_launchd() {
  log "launchd 등록: $LAUNCHD_PLIST"
  mkdir -p "$(dirname "$LAUNCHD_PLIST")"
  cat > "$LAUNCHD_PLIST" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${SERVICE_LABEL}</string>
  <key>ProgramArguments</key>
  <array>
    <string>${NODE_BIN}</string>
    <string>${AGENT_DEST}/index.js</string>
  </array>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key>
    <string>/usr/local/bin:/usr/bin:/bin:/opt/homebrew/bin</string>
  </dict>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>${LOG_DIR}/launchd.out.log</string>
  <key>StandardErrorPath</key>
  <string>${LOG_DIR}/launchd.err.log</string>
</dict>
</plist>
EOF
  # 기존 서비스가 있으면 내리고 다시 로드
  launchctl unload "$LAUNCHD_PLIST" 2>/dev/null || true
  launchctl load "$LAUNCHD_PLIST"
  ok "launchd 서비스 등록/시작 완료"
}

install_systemd() {
  log "systemd --user 등록: $SYSTEMD_UNIT"
  mkdir -p "$(dirname "$SYSTEMD_UNIT")"
  cat > "$SYSTEMD_UNIT" <<EOF
[Unit]
Description=Asktree Local Agent
After=network-online.target

[Service]
Type=simple
ExecStart=${NODE_BIN} ${AGENT_DEST}/index.js
Restart=always
RestartSec=5
StandardOutput=append:${LOG_DIR}/systemd.out.log
StandardError=append:${LOG_DIR}/systemd.err.log

[Install]
WantedBy=default.target
EOF
  systemctl --user daemon-reload
  systemctl --user enable --now asktree-agent.service
  ok "systemd 서비스 등록/시작 완료"
}

case "$OS" in
  Darwin) install_launchd ;;
  Linux)
    if ! command -v systemctl >/dev/null 2>&1; then
      err "systemctl이 없어 서비스 등록을 건너뜁니다. 수동으로 'node $AGENT_DEST/index.js'를 실행하세요."
      exit 1
    fi
    install_systemd ;;
  *)
    warn "지원하지 않는 OS: $OS. 수동 실행: node $AGENT_DEST/index.js"
    exit 0 ;;
esac

# ─── 헬스체크 ────────────────────────────────────────
sleep 5
log "에이전트 상태 확인"
if pgrep -f "${AGENT_DEST}/index.js" >/dev/null 2>&1; then
  ok "에이전트 실행 중"
else
  warn "에이전트 프로세스를 찾지 못했습니다. 로그 확인:"
  echo "  - $LOG_DIR/agent.log"
  if [[ "$OS" == "Darwin" ]]; then
    echo "  - $LOG_DIR/launchd.err.log"
  else
    echo "  - $LOG_DIR/systemd.err.log"
    echo "  - systemctl --user status asktree-agent"
  fi
  exit 1
fi

echo
ok "설치 완료"
echo "   project_id: $PROJECT_ID"
echo "   api_url:    $API_URL"
echo "   agent dir:  $AGENT_DEST"
echo "   config:     $CONFIG_PATH"
echo "   logs:       $LOG_DIR/agent.log"
echo
echo "Claude Code에서 세션을 실행하면 종료 60초 후 자동으로 push됩니다."
