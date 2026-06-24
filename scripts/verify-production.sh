#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SCRATCH="${GOAL_SCRATCH:-/var/folders/r1/bcp2p7hj5vs3nljwnbnv6h6m0000gn/T/grok-goal-ff522b85b1ba/implementer}"
PORT="${VERIFY_PORT:-3000}"
RUN_LABEL="${1:-run1}"

cd "$ROOT"
mkdir -p "$SCRATCH"

echo "=== build $RUN_LABEL ===" | tee -a "$SCRATCH/build-verify-$RUN_LABEL.log"
npm run build 2>&1 | tee -a "$SCRATCH/build-verify-$RUN_LABEL.log"

lsof -ti:"$PORT" | xargs kill -9 2>/dev/null || true
sleep 1

echo "=== start $RUN_LABEL ===" | tee -a "$SCRATCH/build-verify-$RUN_LABEL.log"
PORT="$PORT" npm run start 2>&1 | tee -a "$SCRATCH/build-verify-$RUN_LABEL.log" &
PID=$!
trap 'kill -9 $PID 2>/dev/null || true' EXIT

for i in $(seq 1 60); do
  if curl -sf "http://127.0.0.1:$PORT/" >/dev/null 2>&1; then
    echo "Ready on port $PORT" | tee -a "$SCRATCH/build-verify-$RUN_LABEL.log"
    break
  fi
  sleep 0.5
done

curl -sI "http://127.0.0.1:$PORT/" | tee -a "$SCRATCH/build-verify-$RUN_LABEL.log"
kill -9 $PID 2>/dev/null || true