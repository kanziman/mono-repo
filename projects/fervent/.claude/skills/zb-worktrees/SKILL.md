---
name: zb-worktrees
description: 기능 작업 시작 전 격리된 워크스페이스(git worktree)를 설정하는 스킬. "워크트리 만들어줘", "격리 환경 설정", "worktree 시작", "새 브랜치로 작업 시작" 요청 시 사용.
---

# zb-worktrees

격리된 워크스페이스를 설정한다. 네이티브 도구를 우선 사용하고, 없을 경우 git worktree로 대체한다.

**핵심 원칙:** 기존 격리 환경 먼저 감지. 네이티브 도구 우선. git 직접 사용은 최후 수단. 하네스와 싸우지 않는다.

**시작 선언:** `"I'm using the zb-worktrees skill to set up an isolated workspace."`

---

## 🛠️ 핵심 체크리스트

1. `[ ]` **Step 0 — 기존 격리 감지**: 이미 워크트리 안에 있는지 확인
2. `[ ]` **Step 1 — 격리 워크스페이스 생성**: 네이티브 도구(1a) → git fallback(1b) 순서
3. `[ ]` **Step 2 — 프로젝트 셋업**: 의존성 자동 감지 및 설치
4. `[ ]` **Step 3 — 베이스라인 검증**: 테스트 실행으로 클린 상태 확인

---

## Step 0: 기존 격리 감지

**무엇을 만들기 전에, 이미 격리된 워크스페이스에 있는지 확인한다.**

```bash
GIT_DIR=$(cd "$(git rev-parse --git-dir)" 2>/dev/null && pwd -P)
GIT_COMMON=$(cd "$(git rev-parse --git-common-dir)" 2>/dev/null && pwd -P)
BRANCH=$(git branch --show-current)
```

**서브모듈 오탐 방지:** `GIT_DIR != GIT_COMMON`은 서브모듈 안에서도 참이다. 워크트리로 결론 내리기 전에 서브모듈인지 확인한다:

```bash
# 결과가 있으면 서브모듈 → 일반 저장소로 취급
git rev-parse --show-superproject-working-tree 2>/dev/null
```

**`GIT_DIR != GIT_COMMON`이고 서브모듈이 아닌 경우:** 이미 linked worktree 안에 있다. Step 3(프로젝트 셋업)으로 건너뛴다. 워크트리를 추가로 만들지 않는다.

상태 보고:
- 브랜치 있음: `"이미 <path>의 격리된 워크스페이스에 있습니다. 브랜치: <name>"`
- Detached HEAD: `"이미 <path>에 있습니다 (detached HEAD, 외부 관리). 브랜치는 완료 시점에 생성 필요."`

**`GIT_DIR == GIT_COMMON`인 경우 (또는 서브모듈):** 일반 저장소 체크아웃 상태.

사용자에게 동의 없이 워크트리를 생성하지 않는다:

> "격리된 워크트리를 설정할까요? 현재 브랜치를 변경으로부터 보호합니다."

사용자가 거절하면 Step 3으로 건너뛰어 현재 디렉토리에서 작업한다.

---

## Step 1: 격리 워크스페이스 생성

**두 가지 방법이 있다. 이 순서대로 시도한다.**

### 1a. 네이티브 도구 (우선)

`EnterWorktree`, `/worktree` 명령어, `--worktree` 플래그 같은 네이티브 워크트리 도구가 있으면 그것을 사용하고 Step 2로 건너뛴다.

네이티브 도구는 디렉토리 배치, 브랜치 생성, 정리를 자동으로 처리한다. 네이티브 도구가 있는데 `git worktree add`를 쓰면 하네스가 인식하지 못하는 phantom 상태가 생긴다.

**1b로 진행하는 조건:** 네이티브 워크트리 도구가 없는 경우에만.

### 1b. git worktree Fallback

네이티브 도구가 없을 때만 사용한다.

#### 디렉토리 선택 우선순위

1. **사용자가 명시한 디렉토리 선호** → 그것을 사용
2. **기존 프로젝트-로컬 디렉토리 확인:**
   ```bash
   ls -d .worktrees 2>/dev/null   # 우선
   ls -d worktrees 2>/dev/null    # 대안
   ```
   있으면 사용. 둘 다 있으면 `.worktrees/` 사용.
3. **기존 글로벌 디렉토리 확인:**
   ```bash
   project=$(basename "$(git rev-parse --show-toplevel)")
   ls -d ~/.config/superpowers/worktrees/$project 2>/dev/null
   ```
   있으면 사용 (레거시 경로 하위호환).
4. **위 모두 없으면:** 프로젝트 루트의 `.worktrees/`를 기본값으로 사용.

#### 안전 검증 (프로젝트-로컬 디렉토리만)

**워크트리 생성 전에 반드시 .gitignore 확인:**

```bash
git check-ignore -q .worktrees 2>/dev/null || git check-ignore -q worktrees 2>/dev/null
```

**무시 설정이 없으면:** `.gitignore`에 추가 후 커밋하고 진행한다.

**이유:** 워크트리 내용이 실수로 저장소에 커밋되는 것을 방지한다.

글로벌 디렉토리(`~/.config/superpowers/worktrees/`)는 검증 불필요.

#### 워크트리 생성

```bash
project=$(basename "$(git rev-parse --show-toplevel)")

# 프로젝트-로컬: path="$LOCATION/$BRANCH_NAME"
# 글로벌: path="~/.config/superpowers/worktrees/$project/$BRANCH_NAME"

git worktree add "$path" -b "$BRANCH_NAME"
cd "$path"
```

**샌드박스 fallback:** `git worktree add`가 권한 오류로 실패하면 사용자에게 알리고 현재 디렉토리에서 작업을 계속한다.

---

## Step 2: 프로젝트 셋업

프로젝트 유형을 자동 감지하고 의존성을 설치한다:

```bash
if [ -f package.json ]; then npm install; fi
if [ -f Cargo.toml ]; then cargo build; fi
if [ -f requirements.txt ]; then pip install -r requirements.txt; fi
if [ -f pyproject.toml ]; then poetry install; fi
if [ -f go.mod ]; then go mod download; fi
```

---

## Step 3: 베이스라인 검증

테스트를 실행해 워크스페이스가 클린하게 시작하는지 확인한다:

```bash
# 프로젝트에 맞는 명령어 사용
npm test / cargo test / pytest / go test ./...
```

**테스트 실패 시:** 실패 내용을 보고하고, 진행할지 조사할지 사용자에게 묻는다.

**테스트 통과 시:** 준비 완료 보고.

```
워크트리 준비 완료: <full-path>
테스트 통과 (<N>개, 0 실패)
<feature-name> 구현 준비됨
```

---

## 빠른 참조

| 상황 | 행동 |
|------|------|
| 이미 linked worktree 안 | 생성 건너뜀 (Step 0) |
| 서브모듈 안 | 일반 저장소로 취급 (Step 0 guard) |
| 네이티브 워크트리 도구 있음 | 그것을 사용 (Step 1a) |
| 네이티브 도구 없음 | git worktree fallback (Step 1b) |
| `.worktrees/` 존재 | 사용 (ignore 검증) |
| `worktrees/` 존재 | 사용 (ignore 검증) |
| 둘 다 존재 | `.worktrees/` 사용 |
| 둘 다 없음 | 지시파일 확인 후 `.worktrees/` 기본값 |
| 글로벌 경로 존재 | 사용 (하위호환) |
| 디렉토리가 .gitignore에 없음 | .gitignore에 추가 + 커밋 |
| 생성 시 권한 오류 | 현재 디렉토리에서 작업 |
| 베이스라인 테스트 실패 | 실패 보고 + 진행 여부 확인 |
| package.json/Cargo.toml 없음 | 의존성 설치 건너뜀 |

---

## 흔한 실수

### 하네스(Harness)와 싸우기
- **문제:** 플랫폼이 이미 격리 환경을 제공하는데 `git worktree add` 직접 사용
- **해결:** Step 0에서 기존 격리 감지. Step 1a에서 네이티브 도구 우선.

### 감지 단계 건너뛰기
- **문제:** 기존 워크트리 안에 중첩 워크트리 생성
- **해결:** 무엇이든 만들기 전에 항상 Step 0 실행

### ignore 검증 건너뛰기
- **문제:** 워크트리 내용이 git 추적되어 저장소 오염
- **해결:** 프로젝트-로컬 워크트리 생성 전 반드시 `git check-ignore` 실행

### 네이티브 도구 있는데 git 직접 사용
- **문제:** `EnterWorktree`가 있는데 `git worktree add` 실행 → 하네스가 인식 못하는 phantom 상태 발생
- **해결:** Step 1a 확인이 최우선. 이것이 가장 흔한 실수.

### 실패 테스트 무시하고 진행
- **문제:** 신규 버그와 기존 버그를 구분할 수 없음
- **해결:** 실패 보고 후 명시적 허가 받고 진행

---

## 절대 하지 말 것

- Step 0에서 기존 격리 감지 후 워크트리 추가 생성
- `EnterWorktree` 같은 네이티브 도구가 있는데 `git worktree add` 사용 (1순위 금지)
- Step 1a를 건너뛰고 바로 Step 1b git 명령어 실행
- 프로젝트-로컬 디렉토리를 .gitignore 검증 없이 생성
- 베이스라인 테스트 검증 건너뛰기
- 테스트 실패 상태에서 사용자 확인 없이 진행
