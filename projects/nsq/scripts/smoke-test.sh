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

HTML=$(curl -s -w "\n%{http_code}" "http://localhost:$PORT" 2>/dev/null || echo -e "\n000")
HTTP_STATUS=$(echo "$HTML" | tail -1)
HTML_BODY=$(echo "$HTML" | sed '$d')

kill $DEV_PID 2>/dev/null
wait $DEV_PID 2>/dev/null

if [ "$HTTP_STATUS" != "200" ]; then
  echo "[smoke-test] FAIL: expected 200, got $HTTP_STATUS"
  echo "--- dev server log ---"
  cat /tmp/nsq-smoke.log
  exit 1
fi

echo "[smoke-test] OK: dev server started and returned 200"

# next-themes ThemeProvider 주입 스크립트 확인
# next-themes는 FOUC 방지를 위해 <head>에 동기 스크립트를 삽입함.
# 이 스크립트가 없으면 ThemeProvider가 렌더링에서 빠진 것임.
if echo "$HTML_BODY" | grep -q "next-themes\|updateDOM\|localStorage.getItem"; then
  echo "[smoke-test] OK: next-themes script injected (dark mode provider active)"
else
  echo "[smoke-test] WARN: next-themes script not found — ThemeProvider may be missing or dark mode may not apply"
  echo "  → Visual check required: open http://localhost:$PORT and verify dark background"
fi

exit 0
