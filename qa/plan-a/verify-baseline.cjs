'use strict';

// This orchestrates reviewed synthetic QA. Node VM contexts in the original
// scripts are test doubles, not a sandbox for untrusted application code.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawn, spawnSync } = require('node:child_process');

const SOURCE_COMMIT = '3855c6ab21de64fdc9e28116fcd0f770304eef66';
const QA = [
  'qa/verify-backup-import.cjs',
  'qa/verify-complete-backup.cjs',
  'qa/verify-invoice-entry.cjs',
  'qa/verify-invoice-payment-safety.cjs',
  'qa/verify-pagination.cjs',
  'qa/verify-payment-ledger-pagination.cjs'
];
const ORIGINAL_FILES = [
  '.github/workflows/invoice-payment-safety.yml',
  '.github/workflows/legacy-backup-import.yml',
  '.github/workflows/pagination-regression.yml',
  '.github/workflows/payment-ledger-pagination.yml',
  '.github/workflows/verified-private-backup.yml',
  'index.html',
  'qa/SAFE_V4_RESTORE_README.md',
  'qa/STEP2_BACKUP_RESTORE.md',
  'qa/mobile.html',
  ...QA
].sort();
const NEW_FILES = [
  '.github/workflows/plan-a-baseline.yml',
  'docs/PLAN_A_IMPLEMENTATION.md',
  'docs/PLAN_A_RISK_TRACEABILITY.md',
  'docs/PLAN_A_TEST_MATRIX.md',
  'docs/PLAN_A_SOURCE_INVENTORY.md',
  'docs/PLAN_A_DIAGNOSTIC_CONTRACT.md',
  'docs/PLAN_A_A1A_VERIFICATION.md',
  'qa/plan-a/baseline-source.json',
  'qa/plan-a/verify-baseline.cjs',
  'qa/plan-a/verify-evidence-runner.cjs',
  'qa/plan-a/historical-fixtures.cjs',
  'qa/plan-a/verify-historical-fixtures.cjs'
].sort();
const A2_FILES = [
  '.github/workflows/plan-a-diagnostics.yml', '.github/workflows/plan-a-jsonbin.yml',
  'storage-diagnostics.html', 'qa/plan-a/verify-readonly-diagnostics.cjs', 'qa/plan-a/verify-diagnostics-browser.cjs',
  'docs/PLAN_A_A2_VERIFICATION.md', 'qa/plan-a2/runtime-revision.json',
  'qa/plan-a2/verify-runtime-revision.cjs', 'qa/plan-a2/verify-runtime-revision-tests.cjs',
  'qa/plan-a2/verify-jsonbin-quarantine.cjs', 'qa/plan-a2/verify-jsonbin-browser.cjs',
  'qa/plan-a2/verify-billing-browser.cjs'
];
// Only these fixed messages from the byte-pinned original scripts may appear
// in logs. Assertion diagnostics, stack traces and fixture values are omitted.
const PASS_LINES = [
  'PASS: v4 import preflight, empty-profile restore, existing data refusal, integrity, quota rollback, interrupted marker, optional audit.',
  'PASS: signed full export, exact-byte restore, backup corruption, quota rollback, old V4 compatibility and race refusal.',
  'PASS: parcel/open-box calculation, decimals, immediate totals, invalid inputs, legacy quantities, settings preservation.',
  'PASS: invoice edit preserves paid/payment history, receipt overpay/discount/cancel guards, accurate confirmed audit, and unchanged rejected writes.',
  'PASS: all four list pagers, 20-row boundaries, search reset, shared state, and stale page clamp.',
  'PASS: Payment Ledger 20-row pages, totals, discounts, date/search resets, clear filters, safe rendering and stray text cleanup.'
];
const SHA = /^[a-f0-9]{40}$/;
const sha256 = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const inside = (root, target) => {
  const rel = path.relative(root, target);
  return rel === '' || (!rel.startsWith('..' + path.sep) && rel !== '..' && !path.isAbsolute(rel));
};

function git(root, args, bytes = false) {
  const result = spawnSync('git', ['--no-replace-objects', '-c', 'core.fsmonitor=false', '-C', root, ...args], {
    encoding: bytes ? null : 'utf8', timeout: 10000, maxBuffer: 1024 * 1024,
    env: { PATH: process.env.PATH || '/usr/bin:/bin', LC_ALL: 'C', GIT_OPTIONAL_LOCKS: '0' }
  });
  if (result.error || result.status !== 0) throw new Error('git-provenance-unavailable');
  return result.stdout;
}

function provenance(root) {
  const actualHead = git(root, ['rev-parse', '--verify', 'HEAD']).trim();
  if (!SHA.test(actualHead)) throw new Error('invalid-actual-head');
  const raw = git(root, ['status', '--porcelain=v1', '-z', '--untracked-files=all']);
  const entries = raw.split('\0').filter(Boolean);
  // Do not persist filenames from unrelated local files. Rename records have a
  // second NUL-delimited path; only records with a porcelain status are counted.
  const statuses = entries.filter(entry => /^[ MADRCU?!]{2} /.test(entry));
  return {
    actualHead, dirty: raw.length > 0,
    trackedChanges: statuses.filter(entry => !entry.startsWith('?? ')).length,
    untrackedEntries: statuses.filter(entry => entry.startsWith('?? ')).length,
    statusSha256: sha256(raw)
  };
}

function hashes(root, files = [...ORIGINAL_FILES, ...NEW_FILES]) {
  const result = {};
  for (const file of files) {
    try {
      const full = path.join(root, file);
      if (!fs.lstatSync(full).isFile() || inside(root, fs.realpathSync(full)) === false) {
        result[file] = { status: 'nonregular', sha256: null };
      } else {
        result[file] = { status: 'present', sha256: sha256(fs.readFileSync(full)) };
      }
    } catch (error) {
      result[file] = { status: error.code === 'ENOENT' ? 'missing' : 'unreadable', sha256: null };
    }
  }
  return result;
}

function baselineManifest(root, sourceCommit) {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'qa/plan-a/baseline-source.json'), 'utf8'));
  if (manifest.schemaVersion !== 1 || manifest.sourceCommit !== sourceCommit ||
      manifest.algorithm !== 'sha256' || !Array.isArray(manifest.files) ||
      JSON.stringify(manifest.files.map(file => file.path).sort()) !== JSON.stringify(ORIGINAL_FILES) ||
      manifest.files.some(file => !/^[a-f0-9]{64}$/.test(file.sha256))) {
    throw new Error('invalid-baseline-manifest');
  }
  // The local manifest cannot authorize edited QA by changing its own hashes.
  // Bind every pin to the immutable Git object bytes, ignoring Git replacements.
  for (const file of manifest.files) {
    if (sha256(git(root, ['cat-file', 'blob', sourceCommit + ':' + file.path], true)) !== file.sha256) {
      throw new Error('manifest-does-not-match-source-commit');
    }
  }
  return manifest;
}

function evidenceDirectory(root, requested) {
  if (!requested || !path.isAbsolute(requested)) throw new Error('absolute-evidence-directory-required');
  let ancestor = path.resolve(requested);
  const tail = [];
  while (!fs.existsSync(ancestor)) {
    tail.unshift(path.basename(ancestor));
    const parent = path.dirname(ancestor);
    if (parent === ancestor) throw new Error('evidence-directory-unavailable');
    ancestor = parent;
  }
  if (inside(root, path.join(fs.realpathSync(ancestor), ...tail))) {
    throw new Error('evidence-directory-must-be-outside-repository');
  }
  fs.mkdirSync(requested, { recursive: true, mode: 0o700 });
  const resolved = fs.realpathSync(requested);
  if (inside(root, resolved)) throw new Error('evidence-directory-must-be-outside-repository');
  if (fs.readdirSync(resolved).length) throw new Error('evidence-directory-must-be-empty');
  return resolved;
}

function streamLog(stream, allowedLine) {
  const digest = crypto.createHash('sha256');
  let bytes = 0, sample = Buffer.alloc(0);
  stream.on('data', chunk => {
    digest.update(chunk);
    bytes += chunk.length;
    if (sample.length < 8192) sample = Buffer.concat([sample, chunk.subarray(0, 8192 - sample.length)]);
  });
  return () => ({
    bytes, sha256: digest.digest('hex'),
    retainedSummary: allowedLine && sample.toString('utf8').split(/\r?\n/).includes(allowedLine) ? allowedLine : null,
    diagnosticText: 'omitted', captureLimitBytes: 8192, truncated: bytes > 8192
  });
}

function runQa(root, file, timeoutMs, allowedLine) {
  return new Promise(resolve => {
    const started = Date.now();
    // Minimal child environment prevents inherited Node preload flags and
    // credentials. The byte-reviewed QA reads index.html and uses memory only.
    const child = spawn(process.execPath, [path.join(root, file)], {
      cwd: root, env: { TZ: 'UTC', LANG: 'C.UTF-8' }, stdio: ['ignore', 'pipe', 'pipe'],
      detached: process.platform !== 'win32'
    });
    const stdout = streamLog(child.stdout, allowedLine);
    const stderr = streamLog(child.stderr, null);
    let timedOut = false, spawnFailed = false;
    const timer = setTimeout(() => {
      timedOut = true;
      try {
        if (process.platform !== 'win32') process.kill(-child.pid, 'SIGKILL');
        else child.kill('SIGKILL');
      } catch { child.kill('SIGKILL'); }
    }, timeoutMs);
    child.once('error', () => { spawnFailed = true; });
    child.once('close', (exitCode, signal) => {
      clearTimeout(timer);
      resolve({
        path: file, status: timedOut ? 'timed_out' : spawnFailed || exitCode !== 0 ? 'failed' : 'passed',
        exitCode, signal, durationMs: Date.now() - started,
        log: { stdout: stdout(), stderr: stderr() }
      });
    });
  });
}

function characterizeFixtures(root) {
  const { generateFixture, summarizeFixture } = require(path.join(root, 'qa/plan-a/historical-fixtures.cjs'));
  return [0, 86, 500, 2000, 5000].map(scale => {
    const summary = summarizeFixture(generateFixture({ scale }));
    const counts = {};
    for (const group of ['items', 'parties', 'invoices', 'purchases', 'retail', 'audit']) {
      if (!Number.isSafeInteger(summary.counts[group]) || summary.counts[group] < 0) throw new Error('invalid-fixture-summary');
      counts[group] = summary.counts[group];
    }
    const numeric = {};
    for (const field of ['seed', 'utf8Bytes', 'serializedSnapshotUtf8Bytes', 'storedKeyCount', 'absentKeyCount', 'largePayloadChars']) {
      if (!Number.isSafeInteger(summary[field]) || summary[field] < 0) throw new Error('invalid-fixture-summary');
      numeric[field] = summary[field];
    }
    if (summary.scale !== scale || summary.storageShape !== 'present' || !/^[a-f0-9]{64}$/.test(summary.sha256)) throw new Error('invalid-fixture-summary');
    return { assessment: 'fixture-integrity-only', productionSafety: 'unverified', scale,
      storageShape: 'present', ...numeric, counts, sha256: summary.sha256 };
  });
}

// The second argument is a trusted-module test seam for temporary synthetic Git
// repositories. The CLI always uses SOURCE_COMMIT and exposes no override.
async function runBaseline(options = {}, sourceCommit = SOURCE_COMMIT) {
  const root = fs.realpathSync(options.repoRoot || path.resolve(__dirname, '../..'));
  const timeoutMs = options.timeoutMs === undefined ? 30000 : options.timeoutMs;
  if (!Number.isInteger(timeoutMs) || timeoutMs < 50 || timeoutMs > 120000) throw new Error('invalid-timeout-ms');
  const directory = options.stdout ? null : evidenceDirectory(root, options.evidenceDir);
  const sourceFiles = [...ORIGINAL_FILES, ...NEW_FILES, ...(options.runtimeRevision !== undefined ? A2_FILES : [])];
  const report = {
    schemaVersion: 1, scope: 'A1a synthetic baseline; no browser or native runtime validation',
    sourceCommit: SHA.test(sourceCommit) ? sourceCommit : null, startedAt: new Date().toISOString(),
    nodeVersion: process.version, timeoutMs, status: 'failed',
    provenance: { expectedHead: SHA.test(options.expectedHead || '') ? options.expectedHead : null,
      githubSha: SHA.test(options.githubSha || '') ? options.githubSha : null,
      expectedHeadProvided: options.expectedHead !== undefined, githubShaProvided: options.githubSha !== undefined,
      allowDirty: options.allowDirty === true, before: null, after: null },
    hashes: { before: null, after: null }, failures: [], runtimeRevision: null,
    originalBaseline: {manifestRetained: true, indexBytesPreserved: null, other14FilesPreserved: null},
    tests: QA.map(file => ({ path: file, status: 'notrun', reason: 'preflight-not-complete' })),
    fixtureCharacterization: { status: 'notrun', summaries: [] },
    knownRisks: [
      { id: 'R1-04', status: 'static-risk', detail: 'Current storage read/parse errors default to empty values; this baseline does not repair or accept that behavior.' },
      { id: 'R1-03', status: 'static-risk', detail: 'Current V5/V13/V14/V15 startup migrations write immediately; the synthetic baseline does not execute full startup.' },
      { id: 'R1-05', status: 'static-risk', detail: 'Invoice, counter and audit writes are sequential and lack a business transaction journal.' },
      { id: 'A-TAB-02', status: 'static-risk', detail: 'Older noncooperating writers limit localStorage transaction guarantees.' },
      { id: 'synthetic-coverage', status: 'static-risk', detail: 'Hand-built DOM and storage doubles do not establish real browser behavior or production data safety.' },
      { id: 'extracted-code', status: 'static-risk', detail: 'The original QA executes selected code in Node VM contexts; it does not run the full application startup.' },
      { id: 'diagnostic-privacy', status: 'limitation', detail: 'Raw child diagnostics are discarded; failures retain exit status and output digests rather than fixture values.' }
    ],
    notRun: [
      { id: 'historical-fixture-harness', status: 'notrun', reason: 'Separate synthetic harness; its source hashes are recorded here.' },
      { id: 'evidence-runner-harness', status: 'notrun', reason: 'Separate synthetic runner self-tests; their source hashes are recorded here.' },
      { id: 'future-plan-a-implementation', status: 'notrun', reason: 'Later implementation phases are outside A1a.' },
      { id: 'browser-runtime', status: 'notrun', reason: 'Browser execution is outside this synthetic baseline.' },
      { id: 'native-runtime', status: 'notrun', reason: 'Android, WebView and native bridge execution are outside this synthetic baseline.' }
    ]
  };
  const fail = (code, file) => report.failures.push(file ? { code, path: file } : { code });
  let manifest, revision;
  const expectedHash = file => file.path === 'index.html' && revision ? revision.candidateIndexSha256 : file.sha256;
  try {
    report.provenance.before = provenance(root);
    report.hashes.before = hashes(root, sourceFiles);
    if (Number(process.versions.node.split('.')[0]) < 22) fail('node-22-or-newer-required');
    if (!SHA.test(sourceCommit)) fail('invalid-source-commit');
    if (options.expectedHead !== undefined && options.expectedHead !== null &&
        (!SHA.test(options.expectedHead) || options.expectedHead !== report.provenance.before.actualHead)) {
      fail('expected-head-mismatch');
    }
    if (options.githubSha !== undefined && !SHA.test(options.githubSha)) fail('invalid-github-sha');
    // GitHub pull_request GITHUB_SHA may identify a synthetic merge; it is event
    // provenance only. --expected-head binds the actual checked-out commit.
    if (report.provenance.before.dirty && !options.allowDirty) fail('dirty-working-tree');
    try {
      if (!SHA.test(sourceCommit)) throw new Error('invalid-source-commit');
      if (report.hashes.before['qa/plan-a/baseline-source.json'].status !== 'present') throw new Error('source-unavailable');
      manifest = baselineManifest(root, sourceCommit);
    } catch { fail('invalid-baseline-manifest'); }
    if (options.runtimeRevision !== undefined) {
      try {
        if (options.runtimeRevision !== 'qa/plan-a2/runtime-revision.json' || sourceCommit !== SOURCE_COMMIT) throw new Error('unapproved-runtime-revision');
        revision = require('../plan-a2/verify-runtime-revision.cjs').verifyRuntimeRevision(root);
        report.runtimeRevision = revision;
        report.scope = 'A1a synthetic QA on explicitly authorized A2 runtime; no browser/native checks in this runner';
      } catch { fail('invalid-authorized-runtime-revision'); }
    }
    if (manifest) {
      report.originalBaseline.indexBytesPreserved = report.hashes.before['index.html'].sha256 === manifest.files.find(file => file.path === 'index.html').sha256;
      report.originalBaseline.other14FilesPreserved = manifest.files.filter(file => file.path !== 'index.html').every(file => report.hashes.before[file.path].sha256 === file.sha256);
      for (const file of manifest.files) {
        if (report.hashes.before[file.path].sha256 !== expectedHash(file)) fail('baseline-hash-mismatch', file.path);
      }
    }
    for (const file of [...NEW_FILES, ...(options.runtimeRevision !== undefined ? A2_FILES : [])]) {
      if (report.hashes.before[file].status !== 'present') fail('source-unavailable', file);
    }
    if (report.failures.length === 0) {
      report.fixtureCharacterization = { status: 'characterized', summaries: characterizeFixtures(root) };
      for (let index = 0; index < QA.length; index++) {
        const current = hashes(root, sourceFiles);
        const changed = manifest.files.filter(file => current[file.path].sha256 !== expectedHash(file));
        if (changed.length) {
          for (const file of changed) fail('baseline-hash-mismatch-before-test', file.path);
          for (let pending = index; pending < QA.length; pending++) report.tests[pending].reason = 'baseline-changed';
          break;
        }
        report.tests[index] = await runQa(root, QA[index], timeoutMs, PASS_LINES[index]);
        if (report.tests[index].status !== 'passed') fail('qa-' + report.tests[index].status, QA[index]);
      }
    }
  } catch { fail('preflight-or-run-unavailable'); }
  // Preserve evidence even if a test fails or provenance does not match.
  try {
    report.provenance.after = provenance(root);
    report.hashes.after = hashes(root, sourceFiles);
    if (report.provenance.before && report.provenance.after.actualHead !== report.provenance.before.actualHead) fail('head-changed-during-run');
    if (report.provenance.after.dirty && !options.allowDirty && !report.failures.some(row => row.code === 'dirty-working-tree')) fail('dirty-working-tree-after-run');
    if (report.hashes.before) {
      for (const file of sourceFiles) {
        if (JSON.stringify(report.hashes.before[file]) !== JSON.stringify(report.hashes.after[file])) fail('source-changed-during-run', file);
      }
    }
    if (manifest) {
      for (const file of manifest.files) {
        if (report.hashes.after[file.path].sha256 !== expectedHash(file)) fail('baseline-hash-mismatch-after-run', file.path);
      }
    }
  } catch { fail('postflight-unavailable'); }
  report.status = report.failures.length ? 'failed' : 'passed';
  report.completedAt = new Date().toISOString();
  if (directory) {
    const logDir = path.join(directory, 'logs');
    fs.mkdirSync(logDir, { recursive: true, mode: 0o700 });
    for (const test of report.tests.filter(test => test.log)) {
      fs.writeFileSync(path.join(logDir, path.basename(test.path) + '.json'), JSON.stringify(test.log, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
    }
    fs.writeFileSync(path.join(directory, 'summary.json'), JSON.stringify(report, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
  }
  return report;
}

function parseArgs(args) {
  const options = {};
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === '--allow-dirty' || arg === '--stdout') options[arg === '--stdout' ? 'stdout' : 'allowDirty'] = true;
    else if (['--evidence-dir', '--expected-head', '--timeout-ms', '--runtime-revision'].includes(arg)) {
      const value = args[++index];
      if (value === undefined) throw new Error('missing-argument-value');
      if (arg === '--evidence-dir') options.evidenceDir = value;
      if (arg === '--expected-head') options.expectedHead = value;
      if (arg === '--timeout-ms') options.timeoutMs = Number(value);
      if (arg === '--runtime-revision') options.runtimeRevision = value;
    } else throw new Error('unknown-argument');
  }
  if (options.stdout && options.evidenceDir) throw new Error('choose-evidence-dir-or-stdout');
  if (process.env.GITHUB_SHA !== undefined) options.githubSha = process.env.GITHUB_SHA;
  return options;
}

if (require.main === module) {
  (async () => {
    const options = parseArgs(process.argv.slice(2));
    const report = await runBaseline(options);
    if (options.stdout) console.log(JSON.stringify(report, null, 2));
    else console.log(JSON.stringify({ status: report.status, tests: report.tests.map(({ path: file, status }) => ({ path: file, status })), failures: report.failures }));
    process.exitCode = report.status === 'passed' ? 0 : 1;
  })().catch(() => {
    console.error('Baseline runner could not initialize or persist evidence. Use --evidence-dir ABSOLUTE_PATH_OUTSIDE_REPO (new summary) or --stdout; optional --expected-head SHA --allow-dirty --timeout-ms 50..120000.');
    process.exitCode = 1;
  });
}

module.exports = { runBaseline, QA, ORIGINAL_FILES, NEW_FILES, SOURCE_COMMIT };
