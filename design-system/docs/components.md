# Design System Components

이 문서는 웹 디자인 시스템에서 제공하는 공통 UI 컴포넌트 및 아이콘 명세를 다룹니다.
모든 컴포넌트는 Semantic 토큰을 상속하며, Light/Dark 테마에 자동으로 대응하도록 설계되었습니다.

---

## 1. 아이콘 (Icons)

**라이브러리**: [coolicons](https://coolicons.cool/) — 라인 스타일 SVG 아이콘

| 크기 | 용도 |
|---|---|
| `16×16px` | 인라인 텍스트 옆, caption 영역 |
| `20×20px` | 버튼 내 아이콘, 소형 리스트 |
| `24×24px` | 기본 UI 아이콘 (네비게이션, 카드) |
| `32×32px` | 강조 아이콘, 빈 상태(Empty State) |

**규칙**:
- `stroke-width: 2`, `stroke-linecap: round`, `stroke-linejoin: round` 통일
- 컬러는 `currentColor` 사용 (Semantic 토큰 상속)
- 아이콘 전용 버튼(`IconButton`)은 터치 영역 최소 `44×44px` 확보

---

## 2. 컴포넌트 목록 및 스펙 (Components Spec)

### 2.1. General

#### Button
| Prop | Options |
|---|---|
| `variant` | `solid` \| `outlined` |
| `color` | `primary` \| `assistive` \| `positive` \| `negative` |
| `size` | `small` \| `medium` \| `large` |
| `fullWidth` | boolean |
| `loading` | boolean |
| `disabled` | boolean |
| `leadingContent` / `trailingContent` | ReactNode (아이콘) |
| `iconOnly` | boolean |

- **TextButton**: 텍스트 전용 버튼
- **IconButton**: 아이콘 전용 버튼 (최소 44×44px 터치 영역)
- **AvatarButton**: 사용자 아바타를 클릭 가능한 버튼으로 래핑

#### Typography
Variant + Weight 조합으로 일관된 텍스트 스타일을 적용하는 래퍼 컴포넌트.

#### Icon
coolicons 라이브러리 기반 SVG 아이콘. `size` prop으로 16/20/24/32 지원.

---

### 2.2. Layout & Container

- **FlexBox / Grid / GridItem**: 레이아웃 구성용 래퍼
- **Card / CardList**: 정보 묶음 (`shadow.normal.small` 기본 적용)
- **Divider**: 콘텐츠 구분선 (`line.normal.normal`)
- **ScrollArea**: 커스텀 스크롤바 영역

---

### 2.3. Navigation

- **TopNavigation**: 상단 고정 앱바 (`shadow.spread`/iOS blur 지원)
- **BottomNavigation**: 모바일 하단 탭 바
- **Tab / SegmentedControl**: 뷰 전환
- **Pagination / PageCounter / PaginationDots**: 페이징 처리

---

### 2.4. Data Entry

- **TextField / TextArea**: 텍스트 입력 (상태: default / focus / error / disabled)
- **SearchField**: 검색창 (지우기 + 검색 아이콘)
- **Checkbox / RoundCheckbox / Radio / Switch**: 선택/토글
- **Select / SelectMultiple**: 드롭다운
- **DatePicker / DateRangePicker / TimePicker**: 날짜·시간 선택
- **Slider**: 범위 선택
- **Autocomplete**: 자동완성 인풋

---

### 2.5. Data Display

- **Avatar / AvatarGroup**: 프로필 이미지 (size: xs~xl, 원형)
- **Badge** (ContentBadge / PlayBadge / PushBadge): 알림, 상태 표시기
- **Chip**: 필터, 키워드 (`label1` 사이즈)
- **Accordion**: 접기/펼치기
- **Table**: 데이터 테이블 (헤더 고정 지원)
- **List / CardList**: 리스트 형태 데이터
- **Category**: 카테고리 태그
- **SectionHeader**: 섹션 구분 헤더
- **Thumbnail / ImageBase**: 이미지 표시

---

### 2.6. Feedback & Overlay

- **Alert / SectionMessage**: 인라인 알림 (positive / cautionary / negative)
- **Modal**: 전체 화면 오버레이 다이얼로그 (`zIndex: 1300`)
- **Popover / Popper**: 앵커 기반 오버레이
- **Toast / Snackbar**: 일시적 피드백 (자동 소멸)
- **Tooltip**: 호버 부가 설명
- **Loading / Skeleton**: 로딩 상태
- **ProgressIndicator / ProgressTracker / ProgressStepIndicator**: 진행 상태
- **AnimationPresence**: 컴포넌트 마운트/언마운트 애니메이션
