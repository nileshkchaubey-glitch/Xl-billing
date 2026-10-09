import { COLLECTIONS, blankState, normalizeState, applyCommand, clone } from '../src/domain.js';
export class BillingError extends Error {
  constructor(message, status = 400, code = '22023') { super(message); this.status = status; this.code = code; }
}
const bytes = value => new TextEncoder().encode(value);
const primary = db => db.withSession ? db.withSession('first-primary') : db;
const metadata = state => Object.fromEntries(Object.entries(state).filter(([name]) => !COLLECTIONS.includes(name)));
export async function readWorkspace(env, owner) {
  const db = primary(env.DB);
  const [workspace, records] = await db.batch([
    db.prepare('SELECT revision, metadata_json FROM billing_workspaces WHERE owner_id = ?').bind(owner),
    db.prepare('SELECT collection, data_json, photo_key FROM billing_records WHERE owner_id = ? ORDER BY collection, ordinal').bind(owner)
  ]);
  const row = workspace.results[0]; if (!row) return null;
  const state = { ...JSON.parse(row.metadata_json), ...Object.fromEntries(COLLECTIONS.map(kind => [kind, []])) };
  // Bounded reads avoid starting hundreds of photo fetches at once.
  for (let offset = 0; offset < records.results.length; offset += 10) {
    const entries = await Promise.all(records.results.slice(offset, offset + 10).map(async record => {
      const data = JSON.parse(record.data_json);
      if (record.photo_key) {
        const photo = await env.BUCKET.get(record.photo_key);
        if (!photo) throw new BillingError('A bill photo is missing from storage. Keep your backup and contact the owner.', 503, 'STORAGE_ERROR');
        data.photoData = await photo.text();
      }
      return { kind: record.collection, data };
    }));
    for (const entry of entries) state[entry.kind].push(entry.data);
  }
  return { revision: row.revision, data: normalizeState(state) };
}
export async function readRevision(env, owner) {
  const row = await primary(env.DB).prepare('SELECT revision FROM billing_workspaces WHERE owner_id = ?').bind(owner).first();
  return row?.revision ?? null;
}
async function hasOperation(env, owner, id) {
  return Boolean(await primary(env.DB).prepare('SELECT 1 AS found FROM billing_operations WHERE owner_id = ? AND operation_id = ?').bind(owner, id).first());
}
async function photoKey(env, owner, content) {
  if (!env.BUCKET) throw new BillingError('Photo storage is unavailable.', 503, 'STORAGE_ERROR');
  const digest = await crypto.subtle.digest('SHA-256', bytes(content));
  const hash = [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
  const key = `photos/${encodeURIComponent(owner)}/${hash}`;
  await env.BUCKET.put(key, content, { httpMetadata: { contentType: 'text/plain;charset=utf-8' } });
  return key;
}
export async function commitWorkspace(env, owner, input) {
  const { expectedRevision, operationId, command, data } = input;
  if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 0 || typeof operationId !== 'string' || !/^[a-zA-Z0-9-]{1,100}$/.test(operationId)) throw new BillingError('Invalid save identity.');
  if (await hasOperation(env, owner, operationId)) return readWorkspace(env, owner);
  const current = await readWorkspace(env, owner);
  if ((current?.revision || 0) !== expectedRevision) throw new BillingError('Workspace changed. Refresh and retry.', 409, '40001');
  let next;
  if (command) {
    if (!current || command.id !== operationId) throw new BillingError('Connect the workspace before posting a bill.');
    try { next = normalizeState(applyCommand(current.data, command)); }
    catch (error) { throw new BillingError(error.message); }
  } else {
    if (current) throw new BillingError('A cloud workspace already exists. Review a backup restore instead.', 409, '40001');
    try { next = normalizeState(data); } catch (error) { throw new BillingError(error.message); }
  }
  if (bytes(JSON.stringify(next)).length > 20 * 1024 * 1024) throw new BillingError('Workspace exceeds the 20 MB synchronization limit. Export a backup before adding more data.');
  const db = primary(env.DB), at = new Date().toISOString();
  const statements = [];
  if (!current) statements.push(db.prepare('INSERT OR IGNORE INTO billing_workspaces(owner_id, metadata_json, updated_at) VALUES (?, ?, ?)').bind(owner, JSON.stringify(metadata(blankState())), at));
  statements.push(db.prepare('UPDATE billing_workspaces SET revision = revision + 1, last_operation_id = ?, metadata_json = ?, updated_at = ? WHERE owner_id = ? AND revision = ?').bind(operationId, JSON.stringify(metadata(next)), at, owner, expectedRevision));
  // CHECK(verified=1) forces the complete D1 batch to roll back if CAS updated
  // zero rows. No dependent record can be written after a stale revision.
  statements.push(db.prepare('INSERT INTO billing_operations(owner_id, operation_id, revision, verified, created_at) SELECT ?, ?, ?, CASE WHEN EXISTS (SELECT 1 FROM billing_workspaces WHERE owner_id = ? AND revision = ? AND last_operation_id = ?) THEN 1 ELSE 0 END, ?').bind(owner, operationId, expectedRevision + 1, owner, expectedRevision + 1, operationId, at));
  const upserts = [];
  for (const kind of COLLECTIONS) {
    const previous = new Map((current?.data[kind] || []).map((record, ordinal) => [record.id, { record, ordinal }]));
    const ids = new Set(next[kind].map(record => record.id));
    const removed = [...previous.keys()].filter(id => !ids.has(id));
    if (removed.length) statements.push(db.prepare('DELETE FROM billing_records WHERE owner_id = ? AND collection = ? AND record_id IN (SELECT value FROM json_each(?))').bind(owner, kind, JSON.stringify(removed)));
    for (let ordinal = 0; ordinal < next[kind].length; ordinal++) {
      const record = next[kind][ordinal], old = previous.get(record.id);
      if (old?.ordinal === ordinal && JSON.stringify(old.record) === JSON.stringify(record)) continue;
      const stored = clone(record); let photo = null;
      if (typeof stored.photoData === 'string' && stored.photoData) { photo = await photoKey(env, owner, stored.photoData); delete stored.photoData; }
      const json = JSON.stringify(stored);
      if (bytes(json).length > 1800000) throw new BillingError('One record exceeds the database row limit. Export it and split this entry before saving.');
      upserts.push({ kind, id: record.id, ordinal, json, photo });
    }
  }
  let group = [], size = 0;
  const flush = () => {
    if (!group.length) return;
    statements.push(db.prepare("INSERT INTO billing_records(owner_id, collection, record_id, ordinal, data_json, photo_key) SELECT ?, json_extract(value, '$.kind'), json_extract(value, '$.id'), json_extract(value, '$.ordinal'), json_extract(value, '$.json'), json_extract(value, '$.photo') FROM json_each(?) WHERE 1 ON CONFLICT(owner_id, collection, record_id) DO UPDATE SET ordinal = excluded.ordinal, data_json = excluded.data_json, photo_key = excluded.photo_key").bind(owner, JSON.stringify(group)));
    group = []; size = 0;
  };
  for (const row of upserts) {
    const rowSize = bytes(JSON.stringify(row)).length;
    if (rowSize > 1950000) throw new BillingError('One record exceeds the save parameter limit. Split this entry before saving.');
    if (group.length && size + rowSize > 1500000) flush();
    group.push(row); size += rowSize + 1;
  }
  flush();
  try { await db.batch(statements); }
  catch (error) {
    if (await hasOperation(env, owner, operationId)) return readWorkspace(env, owner);
    if ((await readRevision(env, owner)) !== expectedRevision) throw new BillingError('Workspace changed. Refresh and retry.', 409, '40001');
    throw new BillingError('Database save failed. Your operation is retained for retry.', 503, 'DATABASE_ERROR');
  }
  return { revision: expectedRevision + 1, data: next };
}
