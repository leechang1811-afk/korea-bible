import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'bible-1day1read',
  brand: {
    displayName: '성경 1일1독',
    primaryColor: '#1B64F2',
    icon: '',
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
