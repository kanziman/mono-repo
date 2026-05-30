#!/usr/bin/env bash
# Run from projects/nsq/
# Starts dev server, waits for Ready, checks localhost:3000 returns 200, then kills.
set -e
PORT=3000
TIMEOUT=45  # Turbopack first-compile headroom

if lsof -ti ":$PORT" > /dev/null 2>&1; then
  echo "[smoke-test] FAIL: port $PORT is already in use"
  exit 1
fi

npm run dev > /tmp/nsq-smoke.log 2>&1 &
DEV_PID=$!

elapsed=0
while [ $elapsed -lt $TIMEOUT ]; do
  if grep -qE "Ready|started server on" /tmp/nsq-smoke.log 2>/dev/null; then
    break
  fi
  sleep 1
  elapsed=$((elapsed + 1))
done

if [ $elapsed -ge $TIMEOUT ]; then
  echo "[smoke-test] FAIL: dev server not ready within ${TIMEOUT}s"
  kill $DEV_PID 2>/dev/null
  echo "--- dev server log ---"
  cat /tmp/nsq-smoke.log
  exit 1
fi

HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$PORT" 2>/dev/null || echo "000")

kill $DEV_PID 2>/dev/null
wait $DEV_PID 2>/dev/null

if [ "$HTTP_STATUS" = "200" ]; then
  echo "[smoke-test] OK: dev server started and returned 200"
  exit 0
else
  echo "[smoke-test] FAIL: expected 200, got $HTTP_STATUS"
  echo "--- dev server log ---"
  cat /tmp/nsq-smoke.log
  exit 1
fi
