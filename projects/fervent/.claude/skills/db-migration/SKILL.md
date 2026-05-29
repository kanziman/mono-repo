---
name: db-migration
description: 데이터베이스 마이그레이션 파일 작성, 검토, 롤백 전략 수립 시 참고하는 스킬. "마이그레이션", "migration", "스키마 변경", "ALTER TABLE", "CREATE TABLE", "컬럼 추가/삭제/변경", "인덱스 추가", "DB 마이그레이션 작성해줘" 등의 요청 시 반드시 이 스킬을 참고할 것.
---

# DB 마이그레이션 컨벤션

## 네이밍 규칙

파일명: `{YYYYMMDDHHMMSS}_{설명}.{확장자}`

예: `20260526143000_add_email_to_users.sql`

설명은 snake_case로 작성한다.

## 필수 구성 요소

모든 마이그레이션 파일에 반드시 `up`과 `down`을 함께 작성한다.

```sql
-- up
ALTER TABLE users ADD COLUMN email VARCHAR(255);

-- down
ALTER TABLE users DROP COLUMN email;
```

`down` 없이 `up`만 작성하는 것은 금지한다. 롤백이 구조적으로 불가능한 경우(데이터 삭제 등)에는 주석으로 이유를 명시한다.

## 제로 다운타임 패턴

컬럼 추가/변경 시 아래 3단계 배포 전략을 사용한다. 단계를 한 번에 합치면 대형 테이블에서 잠금(Lock)이 발생해 서비스 장애로 이어진다.

**1단계 — NULL 허용으로 컬럼 추가:**
```sql
ALTER TABLE users ADD COLUMN phone VARCHAR(20) NULL;
```

**2단계 — 데이터 백필 (애플리케이션 배포 후):**
```sql
UPDATE users SET phone = '' WHERE phone IS NULL;
```

**3단계 — NOT NULL 제약 추가:**
```sql
ALTER TABLE users ALTER COLUMN phone SET NOT NULL;
```

## 안전 규칙

- **컬럼 이름 변경**: 새 컬럼 추가 → 데이터 복사 → 구 컬럼 사용 중단 → 다음 배포에서 삭제 (3단계)
- **테이블 삭제**: 애플리케이션 코드에서 참조 제거 완전 확인 후에만 진행
- **인덱스 생성**: `CREATE INDEX CONCURRENTLY`를 사용해 잠금 없이 생성

## PR 제출 전 체크리스트

- [ ] `down` 마이그레이션 작성 완료
- [ ] 대형 테이블(10만 행 이상)에 잠금 유발 DDL 없음
- [ ] 기존 데이터 유실 가능성 없음
- [ ] 롤백 절차 PR 설명에 기재
