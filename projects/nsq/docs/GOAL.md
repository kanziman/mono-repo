# NSQ Shadowing App — Goal & Scope Document

## 1. 핵심 목표 (Core Goal)

YouTube에서 "No Stupid Questions" 팟캐스트 영상의 오디오와 자막을 자동 추출하여, 문장 단위 반복 쉐도잉과 AI 튜터 채팅을 통해 영어 말하기 실력을 향상시키는 **개인용 로컬 웹앱**.

## 2. 대상 사용자 및 핵심 가치 (Target Users & Core Value)

- **대상**: 개인 사용자 (로컬 전용 도구, 멀티유저 미지원)
- **핵심 가치**:
  - YouTube URL 하나로 오디오 다운로드 + 자막 추출 + 한국어 번역을 자동 처리
  - 몰입 모드 / 문장 모드 두 가지 쉐도잉 방식 제공
  - Angela / Mike / General Tutor 페르소나 기반 AI 채팅으로 에피소드 내용 심화 학습

## 3. 핵심 기능 (Core Features)

1. **에피소드 임포트** — YouTube URL 입력 → yt-dlp로 오디오(MP3) + 자막(VTT) 자동 추출 → OpenRouter로 한국어 번역 배치 생성
2. **몰입 모드 (Immersion)** — 전체 세그먼트 세로 나열, 재생 위치 자동 스크롤, 번역 블러 토글
3. **문장 모드 (Sentence)** — 세그먼트 1개 집중, 원본 재생 + 마이크 녹음 + 내 녹음 재생
4. **단축키 지원** — Space / R / N / P / T / M 키로 빠른 조작
5. **AI 튜터 패널** — 에피소드 컨텍스트 주입, 3가지 페르소나, 퀵 액션 칩, SSE 스트리밍 응답

## 4. 검증된 가정 (Validated Assumptions)

- yt-dlp로 영어 자막(수동 우선, 없으면 자동 자막)과 MP3 오디오를 안정적으로 추출 가능
- 오디오·자막 파일은 `~/.shadowing/episodes/{videoId}/`에 로컬 저장하므로 별도 DB 불필요
- 번역 모델은 `google/gemini-flash-1.5`, AI 튜터 기본 모델은 `anthropic/claude-haiku-4-5` (`.env`로 변경 가능)
- 재생 위치는 localStorage에 저장하여 페이지 재진입 시 자동 재개
- 대화 히스토리는 세션 내 메모리에만 유지 (파일 저장 없음)

## 5. 예외 및 고려사항 (Edge Cases & Exceptions)

- yt-dlp 실행 실패 또는 자막 없는 영상: 단계별 오류 메시지 + 재시도 버튼 표시
- OpenRouter 번역 오류: 해당 청크 재시도 1회, 실패 시 빈 문자열로 저장
- 브라우저 MediaRecorder API 미지원 환경: 녹음 버튼 비활성화 처리 필요
- 모드 전환 시 번역 블러 상태 초기화

## 6. 범위 제외 (Out of Scope)

- 사용자 인증 / 멀티유저
- AI 발음 피드백 (점수, 억양 분석)
- 사전 팝업
- 모바일 최적화
- RSS 피드 자동 갱신

## 7. 미결정 사항 (Open Questions)

- 쉐도잉 녹음 파일을 로컬에 저장할지, 세션 내 Blob URL만 유지할지
- 퀵 액션 칩 문구 최종 확정 (현재 스펙: 이 표현 설명해줘 / 내 문장 교정해줘 / 이 주제로 토론하자)
- 임포트 진행 중 중단 시 부분 파일 정리 방식
