#!/usr/bin/env bash
# 보드트래커 요청 큐 감시 — Claude Code의 Monitor 도구로 실행한다.
# 2초마다 하트비트를 갱신하고, 새 요청 파일마다 한 줄을 출력한다.
# 출력 형식: REQUEST <id> <회사명> <연도>
set -u

RUNTIME_DIR="$(cd "$(dirname "$0")/.." && pwd)/.runtime"
PENDING_DIR="$RUNTIME_DIR/queue/pending"
mkdir -p "$PENDING_DIR"

declare -A seen=()

while true; do
  touch "$RUNTIME_DIR/heartbeat"
  for file in "$PENDING_DIR"/*.json; do
    [ -e "$file" ] || continue
    id="$(basename "$file" .json)"
    [ -n "${seen[$id]:-}" ] && continue
    seen[$id]=1
    corp="$(sed -n 's/^ *"corpName": "\(.*\)",$/\1/p' "$file")"
    year="$(sed -n 's/^ *"year": \([0-9]*\),$/\1/p' "$file")"
    echo "REQUEST $id $corp $year"
  done
  sleep 2
done
