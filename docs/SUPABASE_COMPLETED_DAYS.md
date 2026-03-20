# Supabase: bible_completed_days 테이블 생성

1일1독 완료 체크 데이터를 Supabase에 저장하려면 아래 테이블을 생성하세요.

## 1. SQL 실행 (Supabase 대시보드)

Supabase 대시보드 → **SQL Editor** → New query → 아래 SQL 붙여넣기 후 실행:

```sql
-- 1일1독 완료 체크 테이블
CREATE TABLE IF NOT EXISTS bible_completed_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_index INTEGER NOT NULL,
  date TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, day_index, date)
);

-- RLS 활성화
ALTER TABLE bible_completed_days ENABLE ROW LEVEL SECURITY;

-- 본인 데이터만 조회/삽입/삭제
CREATE POLICY "Users can read own completed days"
  ON bible_completed_days FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own completed days"
  ON bible_completed_days FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own completed days"
  ON bible_completed_days FOR DELETE
  USING (auth.uid() = user_id);

-- 인덱스 (조회 성능)
CREATE INDEX IF NOT EXISTS idx_bible_completed_days_user_id
  ON bible_completed_days(user_id);
```

## 2. (선택) bible_version 기본값

성경 버전(한국어/영어)을 동기화하려면 `bible_user_settings`에 컬럼을 추가할 수 있습니다:

```sql
-- 기존 테이블에 컬럼 추가 (이미 있다면 스킵)
ALTER TABLE bible_user_settings
  ADD COLUMN IF NOT EXISTS bible_version TEXT DEFAULT 'ko';
```

## 3. 확인

- **Table Editor**에서 `bible_completed_days` 테이블이 생성되었는지 확인
- RLS 정책이 적용되었는지 확인

## 4. 참고

- `CREATE TABLE IF NOT EXISTS`로 이미 테이블이 있으면 스킵됩니다.
- 정책이 이미 있으면 `CREATE POLICY`에서 에러가 날 수 있습니다. 그 경우 해당 정책만 수동으로 제거 후 다시 실행하세요.
- 테이블이 없어도 앱은 로컬에서 정상 동작하며, 로그인 후 동기화 시에만 completed_days가 Supabase에 저장됩니다.
