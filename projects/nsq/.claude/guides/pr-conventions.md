# Git 커밋 및 Pull Request 컨벤션 (PR Conventions)

에이전트가 코드를 완성하고 버전 관리를 수행할 때 준수해야 하는 가이드라인입니다.

## 📌 브랜치 네이밍 규칙
- 브랜치 명은 다음 패턴을 따릅니다: `<type>/[issue-number-]<short-description>`
  - 이슈 번호는 선택 사항입니다.
  - 예: `feat/123-oauth-login`
  - 예: `feat/nsq-shadowing`
  - 예: `fix/456-session-leak`

## 📝 커밋 메시지 규칙
Conventional Commits 명세에 맞추어 메시지를 작성합니다:
```text
<type>(<scope>): <subject>

<body>
```
- `feat`: 새로운 기능 추가
- `fix`: 버그 수정
- `docs`: 문서 수정
- `style`: 코드 포맷팅 (로직 변경 없음)
- `refactor`: 리팩토링
- `test`: 테스트 추가/수정
- `chore`: 빌드 설정, 의존성, 스크립트 등 프로덕션 코드 외 변경
- `perf`: 성능 개선

## 🔄 Pull Request 초안 작성
- 작업이 모두 성공하고 린트 및 테스트를 완료하면 다음 템플릿에 맞추어 PR 바디를 작성하여 제공합니다.
```markdown
## 변경 목적
- 이 변경사항이 필요한 이유를 기재합니다.

## 핵심 변경 내용
- 수정/생성된 핵심 모듈 및 로직을 요약합니다.

## 검증 결과
- 검증에 사용한 테스트 명령어 및 성공 로그를 기재합니다.
```
