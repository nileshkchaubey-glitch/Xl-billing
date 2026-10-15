'use strict';
// Issue 19 authorizes only these four bounded JSONBin/UI/guide regions.
// Original A1a pins remain immutable. Candidate evidence is a separate contract.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {execFileSync} = require('node:child_process');
const BASE = 'ed583b697ea1ebdb6041c30f76fa4984c972f713';
const ORIGINAL = 'd5fbcd1a47a5bf6e8d2ec735b561f46108e3c905878ba301acd322040b52b70a';
const AUTHORIZATION = 'https://github.com/nileshkchaubey-glitch/Xl-billing/issues/19';
const MANIFEST = 'qa/plan-a2/runtime-revision.json';
const REGIONS = [
  ['jsonbin-entry-functions', '// FEATURE 6:', '// DOM INJECTION'],
  ['jsonbin-settings-card-and-wrapper', '  // 6. Add Cloud Sync section to Settings page', '  // 8. Run migrations'],
  ['github-storage-note', '          Your billing app will be available at', '        </p>'],
  ['github-sync-guide', '      <!-- Data sync -->', '      <!-- Quick links -->']
];
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
function split(source) {
  let normalized = source; const regions = {};
  for (const [name, begin, end] of REGIONS) {
    const start = normalized.indexOf(begin), finish = normalized.indexOf(end, start + begin.length);
    if (start < 0 || finish < start || normalized.indexOf(begin, start + begin.length) !== -1) throw new Error('ambiguous-revision-boundary');
    regions[name] = hash(normalized.slice(start, finish));
    normalized = normalized.slice(0, start) + '[APPROVED-A2-' + name + ']\n' + normalized.slice(finish);
  }
  return {regions, normalized: hash(normalized)};
}
function codecHashes(source) {
  return Object.fromEntries(['xl-complete-backup', 'xl-backup-import-guard'].map(id => {
    const pattern = new RegExp('<script id="' + id + '">([\\s\\S]*?)<\\/script>', 'g');
    const matches = Array.from(source.matchAll(pattern));
    if (matches.length !== 1) throw new Error('ambiguous-backup-codec');
    return [id, hash(matches[0][1])];
  }));
}
function validate(base, candidate, manifest) {
  if (manifest.schemaVersion !== 1 || manifest.authorization !== AUTHORIZATION || manifest.baseCommit !== BASE || manifest.originalIndexSha256 !== ORIGINAL || hash(base) !== ORIGINAL) throw new Error('unapproved-runtime-revision');
  if (hash(candidate) !== manifest.candidateIndexSha256) throw new Error('candidate-revision-hash-mismatch');
  const prior = split(base.toString('utf8')), current = split(candidate.toString('utf8'));
  if (prior.normalized !== current.normalized || manifest.unchangedOutsideRegionsSha256 !== prior.normalized) throw new Error('change-outside-approved-A2-regions');
  if (JSON.stringify(prior.regions) !== JSON.stringify(manifest.beforeRegions) || JSON.stringify(current.regions) !== JSON.stringify(manifest.afterRegions)) throw new Error('region-evidence-mismatch');
  const priorCodecs = codecHashes(base.toString('utf8')), currentCodecs = codecHashes(candidate.toString('utf8'));
  if (JSON.stringify(priorCodecs) !== JSON.stringify(currentCodecs) || JSON.stringify(priorCodecs) !== JSON.stringify(manifest.unchangedBackupCodecs)) throw new Error('backup-codec-changed');
  return {status: 'verified-authorized-A2-revision', authorization: AUTHORIZATION, baseCommit: BASE,
    originalIndexSha256: ORIGINAL, candidateIndexSha256: manifest.candidateIndexSha256, unchangedOutsideRegionsSha256: prior.normalized, unchangedBackupCodecs: priorCodecs};
}
// Separately requested delete-PIN fix. Keep the immutable A2 contract intact:
// only this exact dialog delta is projected back to the merged A3a source.
const PIN_FIX_BASE = 'beb42cfbb02069e818340ebecdef6b14499ddab5';
const PIN_FIX_HASH = 'f0cd7b156d5302362be3d22f66170aa8d026070b83947c39a51a31d5842e94b8';
function normalizePinFix(root, candidate) {
  if (hash(candidate) === '4e1e6bdb46d8a42a51e4c60da107514c2b3de7146ad4d3f862840af6e9e52d7d') return candidate;
  if (hash(candidate) !== PIN_FIX_HASH) throw new Error('unapproved-delete-pin-revision');
  const prior = execFileSync('git', ['--no-replace-objects', '-C', root, 'cat-file', 'blob', PIN_FIX_BASE + ':index.html'], {maxBuffer: 1024 * 1024}).toString('utf8');
  const current = candidate.toString('utf8');
  const begin = 'window.withDeletePin = ', end = '// OVERRIDE: delInvoice';
  function bounds(text) {
    const a = text.indexOf(begin), b = text.indexOf(end, a);
    if (a < 0 || b < a || text.indexOf(begin, a + begin.length) !== -1 || text.indexOf(end, b + end.length) !== -1) throw new Error('ambiguous-delete-pin-region');
    return [a, b];
  }
  const [a,b] = bounds(current), [c,d] = bounds(prior);
  const normalized = current.slice(0,a) + prior.slice(c,d) + current.slice(b);
  if (normalized !== prior || hash(prior) !== '4e1e6bdb46d8a42a51e4c60da107514c2b3de7146ad4d3f862840af6e9e52d7d') throw new Error('change-outside-delete-pin-dialog');
  return Buffer.from(normalized);
}
function verifyRuntimeRevision(root) {
  const base = execFileSync('git', ['--no-replace-objects', '-C', root, 'cat-file', 'blob', BASE + ':index.html'], {maxBuffer: 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe']});
  const candidate = fs.readFileSync(path.join(root, 'index.html'));
  const manifest = JSON.parse(fs.readFileSync(path.join(root, MANIFEST), 'utf8'));
  const normalized = normalizePinFix(root, candidate);
  const result = validate(base, normalized, manifest);
  return {...result, candidateIndexSha256: hash(candidate),
    ...(hash(normalized) !== hash(candidate) ? {additionalRevision: 'delete-pin-dialog-only'} : {})};
}
module.exports = {verifyRuntimeRevision, normalizePinFix, validate, split, codecHashes, hash, BASE, ORIGINAL, AUTHORIZATION, MANIFEST};
if (require.main === module) {
  try { console.log(JSON.stringify(verifyRuntimeRevision(path.resolve(__dirname, '../..')))); }
  catch { console.error('FAIL: authorized A2 runtime revision could not be verified. Original pins were not changed.'); process.exitCode = 1; }
}
