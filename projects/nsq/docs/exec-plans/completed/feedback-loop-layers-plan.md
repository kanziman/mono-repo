# Plan: feedback-loop-layers

## 배경

이전 세션에서 폴더 리네임 후 mono-repo root 심링크가 파손되어 dev server module-not-found 오류가
사용자에게 직접 노출됐다. vitest 단위 테스트는 dev server를 띄우지 않으므로 이 클래스의 오류를
잡지 못한다. 두 레이어를 추가해 "설치 → 런타임" 전 구간을 자동으로 커버한다.

## 레이어 구조

```
npm install → [Layer 1: postinstall symlinks] → 환경 자가복구
zb-finish-branch → npm test → [Layer 2: smoke test] → 200 OK → 머지 옵션 제시
```

---

## Task 1: postinstall 심링크 스크립트 생성

**목표**: `npm install` 후 자동으로 mono-repo root에 peer-dep 심링크를 생성해
환경이 항상 올바른 상태를 유지하게 한다.

**생성/수정 파일**:
- `projects/nsq/scripts/setup-symlinks.sh` — 심링크 생성 스크립트 (신규)
- `projects/nsq/package.json` — `postinstall` 스크립트 추가 (수정)

**구현 요건**:

`scripts/setup-symlinks.sh` 내용:
```bash
#!/usr/bin/env bash
# projects/nsq/ 에서 실행되는 것을 전제로 함 (npm postinstall CWD)
set -e
NSQ="$(pwd)/node_modules"
MONO="$(pwd)/../../node_modules"

mkdir -p "$MONO"

for pkg in @radix-ui next-themes react-day-picker; do
  rm -f "$MONO/$pkg"
  ln -s "$NSQ/$pkg" "$MONO/$pkg"
done
echo "[setup-symlinks] mono-repo symlinks OK"
```

`package.json` `scripts` 블록에 추가:
```json
"postinstall": "bash scripts/setup-symlinks.sh"
```

**검증 절차**:
```bash
# projects/nsq/ 에서 실행
bash scripts/setup-symlinks.sh
ls -la ../../node_modules/@radix-ui
ls -la ../../node_modules/next-themes
ls -la ../../node_modules/react-day-picker
```
예상 출력: 3개 항목 모두 `../../node_modules/` 내 실제 nsq 경로를 가리키는 심링크로 표시됨.

**커밋**:
```
git commit -m "chore(nsq): add postinstall script to auto-create mono-repo symlinks"
```

---

## Task 2: dev server 스모크 테스트 스크립트 생성

**목표**: dev server를 백그라운드로 띄우고 "Ready" 출력 확인 + `localhost:3000` HTTP 200 응답을
검증하는 스크립트를 만든다. 심링크 파손·빌드 오류·런타임 크래시를 커밋 전에 감지한다.

**생성 파일**:
- `projects/nsq/scripts/smoke-test.sh` — dev server 스모크 테스트 (신규)

**구현 요건**:

```bash
#!/usr/bin/env bash
# Run from projects/nsq/
set -e
PORT=3000
TIMEOUT=45  # Turbopack 첫 컴파일 여유

npm run dev > /tmp/nsq-smoke.log 2>&1 &
DEV_PID=$!

elapsed=0
while [ $elapsed -lt $TIMEOUT ]; do
  if grep -qE "Ready|started server" /tmp/nsq-smoke.log 2>/dev/null; then
    break
  fi
  sleep 1
  elapsed=$((elapsed + 1))
done

if [ $elapsed -ge $TIMEOUT ]; then
  echo "[smoke-test] FAIL: dev server not ready within ${TIMEOUT}s"
  kill $DEV_PID 2>/dev/null
  cat /tmp/nsq-smoke.log
  exit 1
fi

HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$PORT" || echo "000")

kill $DEV_PID 2>/dev/null
wait $DEV_PID 2>/dev/null

if [ "$HTTP_STATUS" = "200" ]; then
  echo "[smoke-test] OK: dev server returned 200"
  exit 0
else
  echo "[smoke-test] FAIL: expected 200, got $HTTP_STATUS"
  cat /tmp/nsq-smoke.log
  exit 1
fi
```

**검증 절차**:
```bash
# projects/nsq/ 에서 실행 (포트 3000이 비어 있어야 함)
bash scripts/smoke-test.sh
```
예상 출력:
```
[smoke-test] OK: dev server returned 200
```
exit code 0.

**커밋**:
```
git commit -m "chore(nsq): add dev server smoke test script"
```

---

## Task 3: zb-finish-branch 스킬에 스모크 테스트 단계 추가

**목표**: `zb-finish-branch` 스킬의 "테스트 검증" 단계 직후에 dev server 스모크 테스트 단계를
삽입해, 에이전트가 `zb-finish-branch`를 호출할 때마다 런타임 검증을 자동 수행하게 한다.

**수정 파일**:
- `.claude/skills/zb-finish-branch/SKILL.md` — 체크리스트 항목 2번과 3번 사이에 `2-a` 추가

**구현 요건**:

기존 2번 항목 직후, 3번 항목 앞에 다음 텍스트를 삽입한다:

```markdown
2-a. `[ ]` **Dev Server 스모크 테스트** (프로젝트에 `scripts/smoke-test.sh` 존재 시):
   - `bash scripts/smoke-test.sh`를 실행합니다.
   - 성공(exit 0) 시 다음 단계로 진행합니다.
   - 실패(exit 1) 시 **즉시 중단**하고 로그를 사용자에게 보고합니다. 해결 전까지 머지/PR을 진행하지 않습니다.
   - `scripts/smoke-test.sh`가 없는 프로젝트에서는 이 단계를 건너뜁니다.
```

**검증 절차**:
```bash
grep -n "2-a" .claude/skills/zb-finish-branch/SKILL.md
```
예상 출력: `2-a` 항목이 포함된 줄 번호가 출력됨.

**커밋**:
```
git commit -m "chore(workflow): add smoke test gate to zb-finish-branch skill"
```

---

## 검증 순서 요약

| 단계 | 명령어 | 예상 결과 |
|------|--------|-----------|
| Task 1 심링크 검증 | `bash scripts/setup-symlinks.sh && ls -la ../../node_modules/next-themes` | 심링크 출력 |
| Task 2 스모크 검증 | `bash scripts/smoke-test.sh` | exit 0, "OK: dev server returned 200" |
| Task 3 스킬 검증 | `grep -n "2-a" .claude/skills/zb-finish-branch/SKILL.md` | 줄 번호 출력 |

## 완료 기준

- [ ] `npm install` 후 mono-repo 심링크 3개가 자동으로 생성됨
- [ ] `bash scripts/smoke-test.sh`가 45초 이내에 exit 0으로 종료됨
- [ ] `zb-finish-branch` 스킬 파일에 `2-a` 항목이 존재함
