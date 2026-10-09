import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
const root = resolve(import.meta.dirname, '..');
async function files(dir) { const result = []; for (const entry of await readdir(dir, { withFileTypes: true })) { if (entry.name.startsWith('.')) continue; const file = resolve(dir, entry.name); if (entry.isDirectory()) result.push(...await files(file)); else result.push(file); } return result; }
const all = await files(root);
for (const file of all.filter(file => file.endsWith('.js'))) {
  const checked = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (checked.status !== 0) { process.stderr.write(checked.stderr); process.exit(1); }
}
const source = await readFile(resolve(root, 'index.html'), 'utf8');
if (/on(?:click|input|change|focus|blur|keydown)\s*=/.test(source) || /<style[\s>]/i.test(source)) throw new Error('Inline handlers/styles must not return to the HTML shell.');
const modules = all.filter(file => file.includes('/src/') && file.endsWith('.js'));
for (const file of modules) {
  const text = await readFile(file, 'utf8');
  if (/window\.\w+\s*=|new Function\(|\beval\(/.test(text)) throw new Error('Global override or dynamic evaluation found: ' + file);
  for (const match of text.matchAll(/from ['"](\.[^'"]+)['"]/g)) await readFile(resolve(file, '..', match[1]));
}
const main = await readFile(resolve(root, 'src/main.js'), 'utf8');
const rendered = await Promise.all(modules.filter(file => file !== resolve(root, 'src/main.js')).map(file => readFile(file, 'utf8')));
const markup = source + rendered.join('');
const actions = new Set([...markup.matchAll(/data-action="([a-z][a-z-]+)"/g), ...markup.matchAll(/button\([^,\n]+,\s*['"]([a-z][a-z-]+)['"]/g)].map(match => match[1]));
for (const action of actions) if (!main.includes(`action === '${action}'`)) throw new Error('Missing action handler: ' + action);
process.stdout.write(`Syntax and module links checked: ${all.filter(file => file.endsWith('.js')).length} JavaScript files.\n`);
