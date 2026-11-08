import { readFileSync, writeFileSync, rmSync } from 'node:fs';
const manifest = JSON.parse(readFileSync('dist/.vite/manifest.json', 'utf8'));
const assets = new Set(['/favicon.svg']);
const visited = new Set();
function visit(key) {
  if (visited.has(key)) return;
  visited.add(key);
  const item = manifest[key];
  if (!item) throw new Error(`Manifest entry missing: ${key}`);
  assets.add('/' + item.file);
  for (const css of item.css ?? []) assets.add('/' + css);
  for (const child of [...(item.imports ?? []), ...(item.dynamicImports ?? [])]) visit(child);
}
visit('index.html');
const worker = readFileSync('server/worker.mjs', 'utf8').replace('/* PUBLIC_ASSETS */ []', JSON.stringify([...assets]));
writeFileSync('dist/_worker.js', worker);
// No exclusions: static simulator files must never bypass the authentication worker.
writeFileSync('dist/_routes.json', JSON.stringify({ version: 1, include: ['/*'], exclude: [] }));
rmSync('dist/.vite', { recursive: true });
