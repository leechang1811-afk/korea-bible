# Supabase 연동 설정

## 0. bible_completed_days 테이블 (1일1독 완료 체크)

1일1독 완료 체크 데이터 동기화를 위해 `bible_completed_days` 테이블이 필요합니다.
자세한 SQL은 `docs/SUPABASE_COMPLETED_DAYS.md`를 참고하세요.

## 1. 환경 변수

프로젝트 루트에 `.env` 파일 생성:

```
VITE_SUPABASE_URL=https://dtqnkbupceuyutsanimk.supabase.co
VITE_SUPABASE_ANON_KEY=여기에_anon_key_붙여넣기
```

- Supabase 대시보드 → **Settings** → **API**
- **Project URL** → `VITE_SUPABASE_URL`
- **anon public** 키 → `VITE_SUPABASE_ANON_KEY`

## 2. 이메일 로그인 활성화

Supabase 대시보드 → **Authentication** → **Providers** → **Email**
- **Enable Email provider** 켜기
- (선택) **Confirm email** 끄면 바로 로그인 가능

## 3. Vercel 배포 시

Vercel 프로젝트 → **Settings** → **Environment Variables**에 추가:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
