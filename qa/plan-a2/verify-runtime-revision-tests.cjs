'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const revision = require('./verify-runtime-revision.cjs');
const root = path.resolve(__dirname, '../..');
const original = execFileSync('git', ['--no-replace-objects', '-C', root, 'cat-file', 'blob', revision.BASE + ':index.html']);
const candidate = fs.readFileSync(path.join(root, 'index.html'));
const manifest = JSON.parse(fs.readFileSync(path.join(root, revision.MANIFEST)));
assert.equal(revision.validate(original, candidate, manifest).status, 'verified-authorized-A2-revision');
const cloned = () => JSON.parse(JSON.stringify(manifest));
for (const [label, altered] of [
  ['authorization', {...cloned(), authorization: 'unapproved'}],
  ['base', {...cloned(), baseCommit: '0'.repeat(40)}],
  ['candidate digest', {...cloned(), candidateIndexSha256: '0'.repeat(64)}],
  ['original digest', {...cloned(), originalIndexSha256: '0'.repeat(64)}],
  ['region evidence', {...cloned(), afterRegions: {}}],
  ['codec evidence', {...cloned(), unchangedBackupCodecs: {}}]
]) assert.throws(() => revision.validate(original, candidate, altered), undefined, label);
// A manifest digest update alone cannot bless changed accounting or codecs.
for (const changed of [candidate.toString().replace("let currentPage = 'dashboard';", "let currentPage = 'settings';"), candidate.toString().replace('function createXLCompleteBackup(', 'function changedBackupFactory(')]) {
  const edited = cloned(); edited.candidateIndexSha256 = revision.hash(changed);
  assert.throws(() => revision.validate(original, Buffer.from(changed), edited), /change-outside-approved-A2-regions/);
}
assert.throws(() => revision.validate(Buffer.from(original.toString() + '\n'), candidate, manifest), /unapproved-runtime-revision/);
assert.equal(fs.readFileSync(path.join(root, 'qa/plan-a/baseline-source.json'), 'utf8'), execFileSync('git', ['--no-replace-objects', '-C', root, 'cat-file', 'blob', revision.BASE + ':qa/plan-a/baseline-source.json'], {encoding: 'utf8'}));
console.log('PASS: 11 A2 revision controls; immutable original pins retained, unauthorized source/digest/codec changes refused.');
