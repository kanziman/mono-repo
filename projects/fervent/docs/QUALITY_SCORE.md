# Code Quality Standards (Quality Score)

We score codebase domains and layers based on their adherence to code conventions, test coverage, and static analysis results.

## 🎯 Quality Scoring Rubric

* **Grade A (Excellent)**: Test coverage > 90%, zero linter warnings, zero code duplication, clear documentation.
* **Grade B (Good)**: Test coverage > 80%, zero linter errors (warnings allowed), documented APIs.
* **Grade C (Needs Improvement)**: Test coverage < 80%, contains linter errors/warnings. Needs technical debt resolution.

## 📏 General Quality Rules
1. **Lint Rules**: Linter checks must pass prior to merge. No warning-suppressing flags without explicit comments detailing why.
2. **Coverage Goal**: New code must have at least **85% unit test coverage**.
3. **Format**: All files must be formatted using the project's formatting tools (`prettier` or standard formatter).

## 🧪 테스트 작성 및 TDD 표준 (Test & TDD Standards)
모든 소스 코드 구현은 자율적 검증 가능성과 회귀 예방을 위해 철저한 테스트 규격을 따라야 합니다.

1. **테스트 주도 개발 (TDD) 준수**:
   - 모든 새로운 기능 개발 및 버그 수정은 코드 구현 전에 실패하는 테스트를 먼저 작성해야 합니다 (RED ➡️ GREEN ➡️ REFACTOR 주기 강제).
   - 구현 후 사후에 추가되는 테스트는 진정한 의미의 TDD로 불인정하며, Grade A 등급을 받을 수 없습니다.
2. **모킹 안티패턴(Mocking Anti-patterns) 방지**:
   - **실제 동작 검증**: 모크 객체 자체의 단순 호출 여부(`toHaveBeenCalled`)만 체크하는 테스트는 무효화됩니다. 반드시 모크 호출로 인한 실제 부수 효과(Side effects)나 상태 변경을 검증해야 합니다.
   - **모킹 경계 설정**: 네트워크 I/O, 파일 시스템 쓰기, 타이머 등 외부 경계 영역으로만 모킹 대상을 한정하십시오. 내부 비즈니스 로직이나 핵심 도메인 서비스는 실제 객체를 사용하여 통합 테스트해야 합니다.
   - **완전한 모크 데이터**: 외부 API 응답 모킹 시 일부 필드만 구성하는 부분 모킹(Partial Mock)을 금지합니다. 실 환경에서 수신하는 전체 데이터 구조를 온전히 구성해야 예기치 못한 하위 결함을 예방할 수 있습니다.
3. **프로덕션 코드 무오염**:
   - 테스트 목적의 헬퍼 메서드나 디버깅 코드를 프로덕션 클래스/파일 내부에 직접 추가하는 행위를 전면 금지합니다. 테스트 전용 유틸리티는 `tests/` 하위 또는 별도 테스트 헬퍼 모듈로 분리해야 합니다.

