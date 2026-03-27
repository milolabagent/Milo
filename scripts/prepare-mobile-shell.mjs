import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const outDir = join(root, 'www');

const entries = [
  'index.html',
  'manifest.webmanifest',
  'service-worker.js',
  'favicon.svg',
  'icon.svg',
  'assets',
];

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

for (const entry of entries) {
  const source = join(root, entry);
  if (!existsSync(source)) continue;
  const target = join(outDir, entry);
  const stats = statSync(source);
  if (stats.isDirectory()) {
    cpSync(source, target, { recursive: true });
  } else {
    cpSync(source, target);
  }
}

const copied = readdirSync(outDir).sort();
console.log(`Prepared Capacitor web shell in ${outDir}`);
console.log(copied.join('\n'));
