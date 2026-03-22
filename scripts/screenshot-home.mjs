/**
 * 홈 화면 전체 스크린샷 추출 (636 x 1048 px)
 * 실행: npx puppeteer node scripts/screenshot-home.mjs
 */

import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(__dirname, '..', 'home-screenshot-636x1048.png');

async function main() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 636, height: 1048 });
  await page.goto('https://korea-bible.vercel.app/', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: outPath, fullPage: true });
  await browser.close();
  console.log('Saved:', outPath);
}

main().catch(console.error);
