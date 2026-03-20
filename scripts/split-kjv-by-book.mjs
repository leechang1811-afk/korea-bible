#!/usr/bin/env node
/**
 * kjv.json을 책별 JSON으로 분할 (public/bible/books/)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const kjvPath = path.join(__dirname, '../public/bible/kjv.json');
const outDir = path.join(__dirname, '../public/bible/books');

const kjv = JSON.parse(fs.readFileSync(kjvPath, 'utf8'));
const byBook = {};
for (const k of Object.keys(kjv)) {
  const book = k.split(',')[0];
  if (!byBook[book]) byBook[book] = {};
  byBook[book][k] = kjv[k];
}

fs.mkdirSync(outDir, { recursive: true });
for (const [book, data] of Object.entries(byBook)) {
  fs.writeFileSync(path.join(outDir, `${book}.json`), JSON.stringify(data));
}
console.log(`Created ${Object.keys(byBook).length} book files in ${outDir}`);
