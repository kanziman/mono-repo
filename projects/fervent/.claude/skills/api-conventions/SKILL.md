---
name: api-conventions
description: API 설계 및 구현에 관한 프로젝트 규칙
---
# REST API 개발 컨벤션
- 모든 URI는 복수형 명사를 사용하며 kebab-case를 준수합니다. (예: `/v1/user-profiles`)
- 에러 응답은 반드시 `{ "error": { "code": string, "message": string } }` 형식을 갖춰야 합니다.
- 데이터 생성 요청(POST)의 응답은 `201 Created`와 함께 생성된 리소스 오브젝트를 반환합니다.
- 대용량 조회의 경우 항상 `limit`와 `offset` 또는 커서 기반 페이징(Pagination) 처리를 기본 구현합니다.
