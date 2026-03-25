import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'bible-1day1read',
  brand: {
    displayName: '성경 1일1독',
    primaryColor: '#1B64F2',
    // 앱인토스 공통 네이티브 바 로고(HTTPS). Vercel 배포 후 동일 URL로 접근 가능해야 함.
    icon: 'https://korea-bible.vercel.app/brand-logo.png',
  },
  web: {
    host: 'localhost',
    port: 5173,
    commands: {
      dev: 'vite',
      build: 'vite build',
    },
  },
  outdir: 'dist',
  permissions: [],
  webViewProps: {
    type: 'game',
  },
});
