import test from 'node:test';
import assert from 'node:assert/strict';
import { LocalD1, LocalBucket } from './d1-helper.js';
import { fixture, command } from './helpers.js';
import { commitWorkspace, readWorkspace, readRevision } from '../backend/d1.js';
import { billingApi } from '../backend/worker.js';
import { identityEnv, testToken, mockIdentity } from './auth-helper.js';
function setup(t) { const DB = new LocalD1(); t.after(() => DB.close()); return { DB, BUCKET: new LocalBucket() }; }
const create = (env, owner = 'owner', data = fixture()) => commitWorkspace(env, owner, { data, expectedRevision: 0, operationId: 'initial' });

test('real SQLite schema saves and reads an owner workspace; another owner cannot read it', async t => {
  const env = setup(t); const saved = await create(env);
  assert.equal(saved.revision, 1); assert.deepEqual(await readWorkspace(env, 'owner'), saved);
  assert.equal(await readWorkspace(env, 'other'), null); assert.equal(await readRevision(env, 'other'), null);
});
test('server applies authoritative billing rules; retries are deduplicated without another revision', async t => {
  const env = setup(t); await create(env);
  const operation = command('save-document', { date: '2026-10-09', partyId: 'customer', partyName: 'Asha', isManual: true, total: 100, initialPaid: 20 }, { collection: 'invoices' });
  const input = { operationId: operation.id, expectedRevision: 1, command: operation };
  const saved = await commitWorkspace(env, 'owner', input); assert.equal(saved.data.invoices[0].balance, 80);
  assert.deepEqual(await commitWorkspace(env, 'owner', input), JSON.parse(JSON.stringify(saved)));
  const excess = command('payment', { direction: 'in', date: '2026-10-09', partyId: 'customer', amount: 100, allocations: [{ id: operation.id, amount: 100 }] });
  await assert.rejects(commitWorkspace(env, 'owner', { operationId: excess.id, expectedRevision: 2, command: excess }), /exceeds/);
  assert.equal(await readRevision(env, 'owner'), 2);
});
test('two server writes using one revision allow exactly one atomic commit', async t => {
  const env = setup(t); await create(env);
  const inputs = [10,20].map(amount => { const operation = command('retail', { date: '2026-10-09', amount }); return { expectedRevision: 1, operationId: operation.id, command: operation }; });
  const results = await Promise.allSettled(inputs.map(input => commitWorkspace(env, 'owner', input)));
  assert.equal(results.filter(r => r.status === 'fulfilled').length, 1);
  assert.equal(results.find(r => r.status === 'rejected').reason.code, '40001');
  const actual = await readWorkspace(env, 'owner'); assert.equal(actual.revision, 2); assert.equal(actual.data.retail.length, 1);
  assert.equal(env.DB.db.prepare('SELECT count(*) AS n FROM billing_operations').get().n, 2);
});
test('database failure rolls back revision, operation and all dependent records', async t => {
  const env = setup(t); await create(env); const batch = env.DB.batch.bind(env.DB);
  env.DB.batch = async statements => {
    if (statements.some(s => s.sql.startsWith('UPDATE billing_workspaces'))) return batch([...statements, env.DB.prepare('INSERT INTO billing_operations VALUES (?, ?, ?, ?, ?)').bind('owner','broken',99,0,'now')]);
    return batch(statements);
  };
  const operation = command('retail', { date: '2026-10-09', amount: 10 });
  await assert.rejects(commitWorkspace(env, 'owner', { expectedRevision: 1, operationId: operation.id, command: operation }), /retained/);
  const state = await readWorkspace(env, 'owner'); assert.equal(state.revision, 1); assert.equal(state.data.retail.length, 0);
});
test('photos stay outside database rows and full backup roundtrip retains them and unknown fields', async t => {
  const env = setup(t); const operation = command('save-document', { date: '2026-10-09', partyName: 'Cash', isManual: true, total: 50, photoData: 'data:image/png;base64,aGVsbG8=', customLegacy: 'keep' }, { collection: 'purchases' });
  await create(env);
  const saved = await commitWorkspace(env, 'owner', { expectedRevision: 1, operationId: operation.id, command: operation });
  assert.equal(env.BUCKET.files.size, 1);
  const row = env.DB.db.prepare("SELECT data_json, photo_key FROM billing_records WHERE collection='purchases'").get();
  assert.doesNotMatch(row.data_json, /base64/); assert.ok(row.photo_key);
  assert.deepEqual(await readWorkspace(env, 'owner'), JSON.parse(JSON.stringify(saved))); assert.equal(saved.data.purchases[0].customLegacy, 'keep');
});
test('initial import groups many rows into bounded SQL calls and retains their order', async t => {
  const env = setup(t), state = fixture();
  state.items = Array.from({ length: 1500 }, (_, i) => ({ id: `item-${i}`, name: `Item ${i}`, saleRate: i }));
  await create(env, 'owner', state);
  assert.ok(Math.max(...env.DB.batches) < 10); assert.deepEqual((await readWorkspace(env,'owner')).data.items, state.items);
});
test('backup restore rejects duplicate invoice numbers before any cloud record is replaced', async t => {
  const env = setup(t); await create(env);
  const state = fixture(); state.invoices = [1,2].map(id => ({ id: 'bill-'+id, invoiceNo: 'DUPLICATE', date: '2026-10-09', total: 10, payments: [] }));
  const operation = command('restore-backup', { data: state });
  await assert.rejects(commitWorkspace(env,'owner',{ expectedRevision:1,operationId:operation.id,command:operation }), /duplicate invoice/);
  assert.equal(await readRevision(env,'owner'),1);
});
test('API requires billing identity and trusted-origin JSON writes, and checks Google owner', async t => {
  const env = { ...setup(t), ...identityEnv(), APP_ORIGIN: 'https://nileshkchaubey-glitch.github.io' }; await create(env); mockIdentity(t);
  const call = (path, options={}) => billingApi(new Request('https://billing.example/api/billing/'+path,options),env);
  assert.equal((await call('workspace')).status,401);
  const owner = { Authorization: 'Bearer ' + testToken() };
  const session = await (await call('session',{ headers:owner })).json(); assert.equal(session.user.id,'owner');
  assert.equal((await call('commit',{ method:'POST',headers:{...owner, Origin:'https://evil.example','Content-Type':'application/json'},body:'{}' })).status,403);
  assert.equal((await call('workspace',{ headers:{'oai-authenticated-user-id':'owner'} })).status,401);
  assert.equal((await call('workspace',{ headers:{ Authorization:'Bearer '+testToken({},'other') } })).status,403);
  const preflight = await call('commit', { method:'OPTIONS', headers:{ Origin:env.APP_ORIGIN, 'Access-Control-Request-Method':'POST', 'Access-Control-Request-Headers':'authorization,content-type' } });
  assert.equal(preflight.status,204); assert.equal(preflight.headers.get('Access-Control-Allow-Origin'),env.APP_ORIGIN);
  const crossOriginRead = await call('workspace', { headers:{...owner,Origin:env.APP_ORIGIN} });
  assert.equal(crossOriginRead.status,200); assert.equal(crossOriginRead.headers.get('Access-Control-Allow-Origin'),env.APP_ORIGIN);
  const operation = command('retail',{date:'2026-10-09',amount:10});
  const crossOriginSave = await call('commit',{method:'POST',headers:{...owner,Origin:env.APP_ORIGIN,'Content-Type':'application/json'},body:JSON.stringify({expectedRevision:1,operationId:operation.id,command:operation})});
  assert.equal(crossOriginSave.status,200); assert.equal((await crossOriginSave.json()).data.retail.length,1);
  const forbidden = await call('commit',{method:'OPTIONS',headers:{Origin:'https://evil.example','Access-Control-Request-Method':'POST'}});
  assert.equal(forbidden.status,403); assert.equal(forbidden.headers.get('Access-Control-Allow-Origin'),null);
  assert.equal((await call('google',{ method:'POST',headers:{...owner,Origin:'https://billing.example','Content-Type':'application/json'},body:'{"action":"backup"}' })).status,403);
  const health=await (await call('health')).json(); assert.ok(health.schemaReady); assert.ok(health.photosReady);
});
test('API rejects malformed and oversized bodies before a database change', async t => {
  const env = { ...setup(t), ...identityEnv() }; mockIdentity(t); const token=testToken();
  const send = (body, extra = {}) => billingApi(new Request('https://billing.example/api/billing/commit', {
    method: 'POST', headers: { Authorization:'Bearer '+token, Origin: 'https://billing.example', 'Content-Type': 'application/json', ...extra }, body
  }), env);
  for (const body of ['{', 'null', '[]']) assert.equal((await send(body)).status, 400);
  assert.equal((await send('{}', { 'Content-Length': String(22 * 1024 * 1024) })).status, 413);
  assert.equal((await send(' '.repeat(21 * 1024 * 1024 + 1))).status, 413);
  assert.equal(await readWorkspace(env, 'owner'), null);
});
