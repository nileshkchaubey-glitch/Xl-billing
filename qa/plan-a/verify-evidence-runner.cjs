'use strict';

// Failure controls use only disposable Git repositories and code-defined fake
// QA at the six fixed paths. No application, browser, owner data or settings run.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const { ORIGINAL_FILES, NEW_FILES, QA } = require('./verify-baseline.cjs');

const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'plan-a-runner-tests-'));
const repoSource = path.resolve(__dirname, '../..');
const sentinel = 'SYNTHETIC_RAW_FIXTURE_VALUE_MUST_NOT_APPEAR';
const env = { PATH: process.env.PATH || '/usr/bin:/bin', LC_ALL: 'C', TZ: 'UTC' };
const sha256 = bytes => crypto.createHash('sha256').update(bytes).digest('hex');

function git(root, args) {
  const result = spawnSync('git', ['--no-replace-objects', '-C', root, ...args], {
    encoding: 'utf8', env, timeout: 10000, maxBuffer: 1024 * 1024
  });
  assert.equal(result.status, 0, 'Synthetic Git setup must succeed.');
  return result.stdout.trim();
}

function write(root, file, content) {
  const target = path.join(root, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
}

function scenario(name, firstQa = "console.log('Synthetic QA completed.');\n") {
  const root = path.join(temporaryRoot, name, 'repo');
  fs.mkdirSync(root, { recursive: true });
  for (const file of ORIGINAL_FILES) write(root, file, 'Code-defined synthetic baseline.\n');
  for (const file of NEW_FILES) write(root, file, 'Code-defined synthetic evidence source.\n');
  for (const file of QA) write(root, file, "console.log('Synthetic QA completed.');\n");
  write(root, QA[0], firstQa);
  write(root, 'qa/plan-a/verify-baseline.cjs', fs.readFileSync(path.join(__dirname, 'verify-baseline.cjs')));
  write(root, 'qa/plan-a/historical-fixtures.cjs', fs.readFileSync(path.join(__dirname, 'historical-fixtures.cjs')));
  git(root, ['init', '--initial-branch=synthetic']);
  git(root, ['add', '.']);
  git(root, ['-c', 'user.name=Synthetic QA', '-c', 'user.email=synthetic@example.invalid', 'commit', '-m', 'synthetic baseline']);
  const sourceCommit = git(root, ['rev-parse', 'HEAD']);
  const files = ORIGINAL_FILES.map(file => ({ path: file, sha256: sha256(fs.readFileSync(path.join(root, file))) }));
  write(root, 'qa/plan-a/baseline-source.json', JSON.stringify({ schemaVersion: 1, sourceCommit, algorithm: 'sha256', files }, null, 2) + '\n');
  git(root, ['add', '.']);
  git(root, ['-c', 'user.name=Synthetic QA', '-c', 'user.email=synthetic@example.invalid', 'commit', '-m', 'synthetic manifest']);
  const head = git(root, ['rev-parse', 'HEAD']);
  return { root, sourceCommit, head, evidenceDir: path.join(temporaryRoot, name, 'evidence') };
}

function run(fixture, options = {}) {
  // Narrow trusted-module sourceCommit seam; production CLI always pins 3855.
  // The wrapper only invokes the API; CLI exit behavior is checked separately.
  const wrapper = `const {runBaseline}=require(process.argv[1]);
runBaseline(JSON.parse(process.argv[2]), process.argv[3]).catch(()=>{process.exitCode=2;});`;
  const result = spawnSync(process.execPath, ['-e', wrapper,
    path.join(fixture.root, 'qa/plan-a/verify-baseline.cjs'),
    JSON.stringify({ repoRoot: fixture.root, evidenceDir: fixture.evidenceDir,
      expectedHead: fixture.head, timeoutMs: 3000, ...options }), fixture.sourceCommit], {
    encoding: 'utf8', timeout: 15000, maxBuffer: 1024 * 1024,
    env: { ...env, RUNNER_TEST_SECRET: sentinel }
  });
  assert.equal(result.error, undefined, 'Synthetic verifier child must finish.');
  const report = JSON.parse(fs.readFileSync(path.join(fixture.evidenceDir, 'summary.json'), 'utf8'));
  assert.equal(result.status, 0, 'API wrapper must complete and persist its report.');
  assert.equal(JSON.stringify(report).includes(sentinel), false, 'Raw fixture values must not enter evidence.');
  return report;
}

const hasFailure = (report, code) => report.failures.some(row => row.code === code);
const assertNotRun = report => assert.ok(report.tests.every(test => test.status === 'notrun'));
let controls = 0;
try {
  {
    const fixture = scenario('clean');
    // A GitHub PR merge/event SHA may differ from checked-out actual HEAD.
    const report = run(fixture, { githubSha: 'f'.repeat(40) });
    assert.equal(report.status, 'passed');
    assert.equal(report.sourceCommit, fixture.sourceCommit);
    assert.equal(report.provenance.before.actualHead, fixture.head);
    assert.equal(report.provenance.after.actualHead, fixture.head);
    assert.equal(report.provenance.before.dirty, false);
    assert.equal(report.provenance.expectedHead, fixture.head);
    assert.equal(report.provenance.githubSha, 'f'.repeat(40));
    assert.ok(report.tests.every(test => test.status === 'passed' && test.exitCode === 0));
    assert.deepEqual(report.fixtureCharacterization.summaries.map(summary => summary.scale), [0, 86, 500, 2000, 5000]);
    assert.ok(report.fixtureCharacterization.summaries.every(summary => summary.productionSafety === 'unverified'));
    assert.ok(report.notRun.every(row => row.status === 'notrun'));
    controls++;
  }
  {
    const fixture = scenario('actual-exit-failure', `console.log('${sentinel}');console.error('${sentinel}');process.exitCode=7;\n`);
    const report = run(fixture);
    assert.equal(report.tests[0].status, 'failed');
    assert.equal(report.tests[0].exitCode, 7);
    assert.ok(hasFailure(report, 'qa-failed'));
    assert.ok(report.tests.slice(1).every(test => test.status === 'passed'));
    const log = fs.readFileSync(path.join(fixture.evidenceDir, 'logs', path.basename(QA[0]) + '.json'), 'utf8');
    assert.equal(log.includes(sentinel), false);
    assert.ok(report.tests[0].log.stderr.bytes > 0);
    controls++;
  }
  {
    const fixture = scenario('timeout', 'setInterval(()=>{},1000);\n');
    const report = run(fixture, { timeoutMs: 200 });
    assert.equal(report.tests[0].status, 'timed_out');
    assert.ok(hasFailure(report, 'qa-timed_out'));
    assert.ok(report.tests.slice(1).every(test => test.status === 'passed'));
    controls++;
  }
  {
    const fixture = scenario('working-byte-mismatch');
    fs.appendFileSync(path.join(fixture.root, 'index.html'), 'Synthetic changed bytes.\n');
    const report = run(fixture, { allowDirty: true });
    assert.ok(hasFailure(report, 'baseline-hash-mismatch'));
    assertNotRun(report);
    controls++;
  }
  {
    const fixture = scenario('manifest-cannot-authorize-edited-qa');
    fs.appendFileSync(path.join(fixture.root, QA[0]), "console.log('Changed synthetic QA.');\n");
    const target = path.join(fixture.root, 'qa/plan-a/baseline-source.json');
    const manifest = JSON.parse(fs.readFileSync(target, 'utf8'));
    manifest.files.find(file => file.path === QA[0]).sha256 = sha256(fs.readFileSync(path.join(fixture.root, QA[0])));
    fs.writeFileSync(target, JSON.stringify(manifest));
    const report = run(fixture, { allowDirty: true });
    assert.ok(hasFailure(report, 'invalid-baseline-manifest'));
    assertNotRun(report);
    controls++;
  }
  {
    const fixture = scenario('dirty-default-rejection');
    write(fixture.root, 'synthetic-untracked.txt', 'Synthetic-only untracked file.');
    const report = run(fixture);
    assert.ok(hasFailure(report, 'dirty-working-tree'));
    assert.equal(report.provenance.before.dirty, true);
    assert.equal(report.provenance.before.untrackedEntries, 1);
    assert.equal(JSON.stringify(report).includes('synthetic-untracked.txt'), false);
    assertNotRun(report);
    controls++;
  }
  {
    const fixture = scenario('explicit-dirty-provenance');
    write(fixture.root, 'synthetic-untracked.txt', 'Synthetic-only untracked file.');
    const report = run(fixture, { allowDirty: true });
    assert.equal(report.status, 'passed');
    assert.equal(report.provenance.allowDirty, true);
    assert.equal(report.provenance.before.dirty, true);
    assert.equal(report.provenance.after.dirty, true);
    controls++;
  }
  {
    const fixture = scenario('expected-head-mismatch');
    const report = run(fixture, { expectedHead: '0'.repeat(40) });
    assert.ok(hasFailure(report, 'expected-head-mismatch'));
    assert.equal(report.provenance.before.actualHead, fixture.head);
    assertNotRun(report);
    controls++;
  }
  {
    const fixture = scenario('unavailable-source-commit');
    fixture.sourceCommit = '0'.repeat(40);
    const manifestPath = path.join(fixture.root, 'qa/plan-a/baseline-source.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    manifest.sourceCommit = fixture.sourceCommit;
    fs.writeFileSync(manifestPath, JSON.stringify(manifest));
    const report = run(fixture, { allowDirty: true });
    assert.ok(hasFailure(report, 'invalid-baseline-manifest'));
    assertNotRun(report);
    controls++;
  }
  {
    const fixture = scenario('source-mutation', "const fs=require('node:fs'),path=require('node:path');fs.appendFileSync(path.join(__dirname,'../index.html'),'Synthetic mutation.');\n");
    const report = run(fixture);
    assert.equal(report.tests[0].status, 'passed');
    assert.ok(report.tests.slice(1).every(test => test.status === 'notrun'));
    assert.ok(hasFailure(report, 'baseline-hash-mismatch-before-test'));
    assert.ok(hasFailure(report, 'source-changed-during-run'));
    assert.ok(hasFailure(report, 'baseline-hash-mismatch-after-run'));
    controls++;
  }
  {
    const fixture = scenario('new-source-mutation', "const fs=require('node:fs'),path=require('node:path');fs.appendFileSync(path.join(__dirname,'../docs/PLAN_A_TEST_MATRIX.md'),'Synthetic mutation.');\n");
    const report = run(fixture);
    assert.ok(report.tests.every(test => test.status === 'passed'));
    assert.ok(hasFailure(report, 'source-changed-during-run'));
    controls++;
  }
  {
    const fixture = scenario('head-mutation', "require('node:child_process').execFileSync('git',['-c','user.name=Synthetic QA','-c','user.email=synthetic@example.invalid','commit','--allow-empty','-m','synthetic changed head'],{stdio:'ignore'});\n");
    const report = run(fixture);
    assert.ok(hasFailure(report, 'head-changed-during-run'));
    assert.equal(report.provenance.before.actualHead, fixture.head);
    assert.notEqual(report.provenance.after.actualHead, fixture.head);
    controls++;
  }
  {
    const fixture = scenario('minimal-child-environment', "require('node:assert/strict').equal(process.env.RUNNER_TEST_SECRET,undefined);require('node:assert/strict').equal(process.env.NODE_OPTIONS,undefined);\n");
    const report = run(fixture);
    assert.equal(report.status, 'passed');
    controls++;
  }
  {
    const fixture = scenario('production-cli-fails-closed');
    // CLI has no sourceCommit test override: a fake manifest cannot authorize
    // this synthetic repository as the original 3855 baseline.
    const result = spawnSync(process.execPath, [path.join(fixture.root, 'qa/plan-a/verify-baseline.cjs'),
      '--evidence-dir', fixture.evidenceDir, '--expected-head', '0'.repeat(40)], {
      env, encoding: 'utf8', timeout: 15000, maxBuffer: 1024 * 1024
    });
    assert.equal(result.status, 1);
    const report = JSON.parse(fs.readFileSync(path.join(fixture.evidenceDir, 'summary.json'), 'utf8'));
    assert.equal(report.status, 'failed');
    assert.ok(hasFailure(report, 'expected-head-mismatch'));
    assert.ok(hasFailure(report, 'invalid-baseline-manifest'));
    assertNotRun(report);
    controls++;
  }
  console.log('PASS: ' + controls + ' synthetic evidence-runner controls (actual exits, timeout, immutable pins, provenance, mutations, private logs and fixture metadata).');
} finally {
  fs.rmSync(temporaryRoot, { recursive: true, force: true });
}
