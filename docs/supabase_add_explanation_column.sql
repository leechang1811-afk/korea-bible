-- 받은 말씀에 한글 번역(explanation) 컬럼 추가
-- Supabase 사용 시 bible_daily_verses 테이블에 실행
ALTER TABLE bible_daily_verses ADD COLUMN IF NOT EXISTS explanation TEXT;
