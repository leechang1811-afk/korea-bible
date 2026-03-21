# Supabase 스키마

## 필요한 마이그레이션

### 1. bible_daily_verses - explanation 컬럼
받은 말씀에 한글 번역을 저장하려면:
```sql
ALTER TABLE bible_daily_verses ADD COLUMN IF NOT EXISTS explanation TEXT;
```

### 2. bible_completed_days - 변경 없음
진도율의 "읽은 구절 표시"는 `day_index`로 스케줄에서 조회하므로 **추가 컬럼 불필요**합니다.
