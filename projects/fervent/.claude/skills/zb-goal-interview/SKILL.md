---
name: zb-goal-interview
description: 새로운 프로젝트 기획 또는 기존 프로젝트에 새로운 피처(기능) 추가 시, 사용자와의 대화형 인터뷰를 통해 요구사항의 95% 이상 확신이 들 때까지 검증하고 기획 문서(Goal 또는 Product Spec)를 작성합니다.
---

# zb-goal-interview

이 스킬은 프로젝트 개발 초기 또는 기능 추가 전에 사용자와 대화하며 핵심 목적을 발굴하고, 가정을 검증하며, 예외 케이스를 도출하여 기획을 구체화하는 워크플로우를 정의합니다.

## 🛠️ 핵심 동작 규칙 (Core Guidelines)

1. **대화식 질문 수행 (Interactive Interviewing)**
   - 질문은 한 번에 **1개 또는 최대 2개**만 던져 사용자의 답변 피로도를 최소화합니다.
   - 사용자의 답변을 바탕으로 꼬리 질문을 이어가며 가정을 예의 바르게 검증합니다.
2. **이중 작동 모드 (Dual-Mode Elicitation)**
   - **모드 A. 프로젝트 초기 목표 설정 (Project Mode)**: 전체 프로젝트의 큰 틀과 방향을 잡을 때 실행합니다.
   - **모드 B. 피처 기획서 작성 (Feature Mode)**: 구체적인 단일 기능이나 컴포넌트 추가를 정의할 때 실행합니다.
3. **95% 확신 도달 후 문서 작성**:
   - 요구사항과 인수 조건에 대해 95% 이상 확정되면 문서를 작성하고 승인을 얻습니다.

---

## 📝 산출물 양식 및 템플릿 (Output Templates)

### [모드 A] 프로젝트 초기 목표 문서
* **저장 경로**: `docs/[프로젝트명]-goal.md` (예: `docs/blog-goal.md`)
* **문서 구조**:
  ```markdown
  # [프로젝트명] Goal & Scope Document
  
  ## 1. 핵심 목표 (Core Goal)
  - 해결하려는 문제와 최종 목적 요약 (한 문장)
  
  ## 2. 대상 사용자 및 핵심 가치 (Target Users & Core Value)
  - 주요 대상층과 그들이 얻는 핵심 효용
  
  ## 3. 검증된 가정 (Validated Assumptions)
  - 인터뷰를 통해 합의된 전제 조건 목록
  
  ## 4. 예외 및 고려사항 (Edge Cases & Exceptions)
  - 잠재적 실패 시나리오 및 예외 상황 대응책
  
  ## 5. 미결정 사항 (Open Questions)
  - 차후 기획 및 연구가 필요한 사항
  ```

### [모드 B] 피처 사양서 (Product Spec)
* **저장 경로**: `docs/product-specs/[피처명]-spec.md` (예: `docs/product-specs/chat-feature-spec.md`)
* **문서 구조**:
  ```markdown
  # [피처명] Product Specification
  
  ## 1. 개요 & 목적 (Overview & Goals)
  - 이 기능이 왜 필요한가? 비즈니스적/기술적 목표
  
  ## 2. 사용자 스토리 & 시나리오 (User Stories & Scenarios)
  - 사용자가 이 기능을 어떻게 사용하는지 시나리오별 흐름
  
  ## 3. 기능 요구사항 & 인수 조건 (Functional Requirements & Acceptance Criteria)
  - 반드시 동작해야 하는 세부 기능 리스트 (체크리스트 형식)
  
  ## 4. 예외 케이스 & 사용자 대응 (Edge Cases & Error Handling)
  - 네트워크 단절, 잘못된 사용자 입력, 제한 초과 등 예외 시나리오 및 처리 방법
  
  ## 5. UI/UX 요구사항 (UI/UX Guidelines)
  - 컴포넌트 동작 방식, 필요한 레이아웃, 시각적 컴패니언 연동 필요 여부
  ```

---

## 🔄 후속 프로세스 연동 (Next Steps)
기획서 작성이 완료되면 다음 스킬인 **`zb-brainstorming`**을 실행하여 기획 내용에 대한 기술적 구현 설계(How)에 돌입하도록 안내하십시오.
