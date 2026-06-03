# Web Design System (Based on Wanted Montage)

본 문서는 원티드(Wanted)의 **Montage Design System**을 기반으로 구축된 웹 디자인 시스템의 가이드라인 인덱스입니다.
일관된 사용자 경험(UX)과 효율적인 UI 개발을 위해 기존 단일 설계 명세 문서를 기초 토큰, 컴포넌트, 접근성 및 사용법 등 카테고리별로 개별 분리하여 관리합니다.

---

## 📚 디자인 시스템 명세 목록 (Documentation Map)

### 1. [Foundations (기초 파운데이션)](docs/foundations.md)
* **서체 (Typography)**: Pretendard 폰트 패밀리 및 Display/Title/Heading/Body 스케일
* **색상 (Color System)**: Atomic & Semantic 컬러 매핑 표 (Light / Dark 대응 명세)
* **간격 (Spacing)**: 8pt grid 기반 스페이싱 및 Tailwind `ds-*` 유틸리티 스펙
* 반응형 브레이크포인트, Z-Index, Opacity, 그림자(Elevation), 테두리 반경 명세

### 2. [Components (공통 UI 컴포넌트)](docs/components.md)
* **아이콘 (Icons)**: coolicons SVG 가이드 및 사이즈 명세
* **컴포넌트 스펙**: Button, Typography, Icon, Layout/Container, Navigation, Data Entry, Data Display, Feedback 컴포넌트 목록 및 API 명세

### 3. [Accessibility & Usage Guide (접근성 및 사용 가이드)](docs/accessibility-usage.md)
* **접근성 (Accessibility)**: WCAG AA 대비율 준수 가이드, 포커스 링 표준화, 최소 터치 영역, ARIA 레이블 등
* **적용 가이드 (Usage Guide)**: 폰트 CDN 연동, `next-themes` Provider 세팅 방법, CSS 변수 및 Tailwind CSS 결합 코드 예시

### 4. [Do & Don't Guidelines (권장 및 금지 사항)](docs/do.md)
* **[Do (권장 사항)](docs/do.md)**: 시맨틱 디자인 토큰 적극 활용 가이드, 공통 프리미티브 컴포넌트 재사용 원칙 등
* **[Don't (금지/지양 사항)](docs/dont.md)**: 하드코딩된 Tailwind 색상 클래스 방지, 인라인 스타일 지양, 중복 아토믹 컴포넌트 구현 차단 등

---

*최종 업데이트: 2026-06-03 (명세 문서 3분할 및 인덱스화)*
