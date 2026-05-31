# Player Solid Dark Theme Design Document

Date: 2026-05-31

---

## 1. 목적 & 요구사항 (Goal & Requirements)

### 개요
NSQ Shadowing 플레이어 페이지(`/player/[videoId]`)의 UI가 기존 Next.js App Template의 투박한 스타일로 구성되어 있어, 대시보드 데모의 세련된 다크 무드 및 Montage 디자인 시스템 규격에 맞춰 개편이 필요함. 
비교 시안 검토 과정을 거쳐, 글래스모피즘(대안 A) 대신 시각적으로 뚜렷하고 안정감이 높은 **솔리드 다크 테마(대안 B)**로 디자인 방향을 확정하고 이를 적용함.

### 요구사항
- **일관된 다크 무드**: 배경색 `#0b0f19`를 기반으로, 플레이어의 주요 영역을 솔리드 다크 그레이 카드 레이아웃으로 감싸 명확한 경계 제공.
- **구조적 개선**:
  - **통합 헤더**: 타이틀, 플레이어 재생 제어 바, 진행도(progress), 모드 스위처를 하나의 컴팩트한 다크 헤더바로 통합.
  - **몰입 모드**: 세그먼트별로 독립적인 카드 형태(#111625)를 제공하고, 호버 및 재생 중인 상태를 명확히 구분.
  - **문장 모드**: 중앙 집중 카드 스타일을 개선하여 시인성을 높이고 오디오 녹음 컨트롤 패널을 통합.
  - **AI 튜터 패널**: 페르소나 선택 탭, 스트리밍 챗 버블 및 퀵 액션 칩을 솔리드 다크 스타일에 어울리도록 수정.
- **디자인 시스템 준수**: Montage Design System의 시맨틱 컬러 토큰 및 컴포넌트를 활용하여 하드코딩 스타일 지양.

---

## 2. 검증 및 피드백 (Evaluation & Feedback)

### 1차 사용자 피드백 반영
- 대안 A(글래스모피즘)와 대안 B(솔리드 다크) 비교 시안 검토 결과, 눈의 피로도가 적고 레이아웃 구분이 더 확실한 **대안 B (솔리드 다크 테마)**로 결정함.

### 자가 비판(Evaluator) 검토 및 대비책
1. **비활성 세그먼트 가시성 문제**: 
   - *이슈*: 어두운 테마에서 단순히 보더 선만 주면 화면 밝기가 낮을 때 카드 경계가 모호하여 "줄글 목록"처럼 보일 수 있음.
   - *대책*: 비활성 카드에는 확실히 다른 배경색(`#111625` / `bg-background-elevated-normal`)을 할당하고, 보더(`#1e293b` / `border-line-normal-normal`)를 명시하여 물리적으로 카드의 입체감을 보장함.
2. **이중 스크롤 레이아웃 꼬임**:
   - *이슈*: `h-screen`을 사용할 때 특정 모바일 브라우저나 헤더의 크기 변동으로 인해 화면 전체 스크롤바와 내부 스크롤바가 이중으로 나타나 레이아웃이 무너질 우려가 있음.
   - *대책*: 플레이어 루트에 `flex flex-col h-screen overflow-hidden`을 단단히 선언하여 외부 스크롤바의 생성을 완벽히 틀어막고, 세그먼트와 튜터 챗 등의 스크롤 영역에만 `overflow-y-auto`를 설정함.
3. **색상 하드코딩 지양**:
   - *이슈*: 비교 시안의 hex 색상을 직접 적용하면 향후 디자인 시스템의 테마 변경 사항이 누락될 수 있음.
   - *대책*: 구현 시 반드시 Montage 디자인 시스템의 시맨틱 토큰(`bg-background-elevated-normal`, `border-line-normal-normal`, `text-label-normal`)을 활용하여 CSS 변수 연동이 유지되도록 함.

---

## 3. 상세 설계 (Detailed Design)

### 변경 파일 목록

| 파일 | 변경 내용 |
|---|---|
| `src/app/player/[videoId]/page.tsx` | 헤더 바 디자인 개편 (솔리드 다크 배경, 재생 진행도 바 및 세그먼트 정보 인라인화) |
| `src/components/ImmersionMode.tsx` | 세그먼트 목록을 솔리드 다크 카드 스타일로 개편, 호버/액티브 가시성 향상 |
| `src/components/SentenceMode.tsx` | 중앙 집중 포커스 카드 개선 및 하단 마이크 녹음기 UI의 솔리드 다크 리디자인 |
| `src/components/TutorPanel.tsx` | 페르소나 버튼, 챗 말풍선, 퀵 액션 칩을 솔리드 다크 및 시맨틱 토큰 매핑에 맞게 개편 |

### 3-1. `page.tsx` 헤더 및 제어 컨트롤 바
- **헤더 배경**: `bg-background-elevated-normal` (Dark: `#222325` 또는 `#111625`급) + 실선 보더 `border-line-normal-normal`.
- **컨트롤러 영역**: 재생/일시정지 버튼, 이전/다음 버튼을 원형 디자인으로 구성.
- **오디오 진행도**: 캡슐 형태의 진행 바와 경과 시간/총 시간 및 재생 상태 뱃지를 깔끔히 정렬.

### 3-2. `ImmersionMode.tsx` 세그먼트 카드
- **일반 상태**: `bg-background-elevated-normal border border-line-normal-normal rounded-xl` 형태로 뚜렷한 카드로 표출.
- **재생 중 상태**: `bg-[#151d30]` 또는 `bg-primary-normal/8` 로 배경을 변경하고 왼쪽 경계선에 파란색 하이라이트 바(`border-l-4 border-primary-normal`) 추가.
- **한국어 번역 블러**: `blur-sm transition-all hover:blur-none` 적용 및 클릭 시 영구 번역 보기 지원.

### 3-3. `SentenceMode.tsx` 포커스 뷰
- **포커스 카드**: `bg-background-elevated-normal border border-line-normal-normal rounded-2xl p-8` 구조로 시각적 입체감 부여.
- **녹음 패널**: 녹음 시작/중지 버튼 디자인 시스템 적용, 녹음 완료 시 "내 녹음" 플레이어 바 노출.

### 3-4. `TutorPanel.tsx` 챗 패널
- **페르소나 탭**: 3개 탭에 솔리드 다크 버튼 디자인(`border border-line-solid-normal rounded-lg`)을 제공하여 활성 탭 강조.
- **메시지 버블**: AI 답변 버블은 `bg-background-elevated-normal border border-line-normal-normal`을 적용하여 솔리드 테마와의 비주얼 톤을 통일.

---

## 4. 예외 및 실패 대응 (Edge Cases & Fault Tolerance)

| 시나리오 | 대응 |
|---|---|
| 미디어 녹음기 권한 미허용 | MediaRecorder 사용 실패 감지 시 토스트 경고 알림 및 "녹음 시작" 버튼 비활성화 |
| 오디오 스트리밍 range request 실패 | Range request 실패 시 200 통째 파일 다운로드로 폴백 및 재생 상태 유지 |
| HMR 캐시 지연 또는 미작동 | 빌드 후 즉시 Playwright 로컬 통합 테스트(`npm run test:visual`)를 기동하여 레이아웃 및 찌그러짐 이슈 자동 검증 |
