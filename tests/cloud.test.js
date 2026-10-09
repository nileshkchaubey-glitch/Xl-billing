import test from 'node:test';
import assert from 'node:assert/strict';
import { BillingStore } from '../src/storage.js';
import { CloudClient } from '../src/cloud.js';
import { clone } from '../src/domain.js';
import { MemoryStorage, fixture, sale, command, remoteCloud } from './helpers.js';
function storeFor(cloud) { return new BillingStore(new MemoryStorage({ xl_billing_v2: JSON.stringify({ ...cloud.envelope, ownerId: 'owner' }) }), cloud); }

test('legacy values remain unchanged after migration and local billing', async () => {
  const original = JSON.stringify(fixture().parties), storage = new MemoryStorage({ shop4_parties: original });
  const store = new BillingStore(storage);
  await store.execute('retail', { date: '2026-10-09', amount: 10 });
  assert.equal(storage.getItem('shop4_parties'), original); assert.equal(store.data.retail.length, 1);
});
test('malformed original browser data fails visibly without overwriting it', () => {
  const storage = new MemoryStorage({ shop4_invoices: '{broken' });
  assert.throws(() => new BillingStore(storage)); assert.equal(storage.getItem('shop4_invoices'), '{broken');
});
test('two simultaneous devices rebase independent creates with unique invoice numbers', async () => {
  const cloud = remoteCloud(), a = storeFor(cloud), b = storeFor(cloud);
  const payload = { date: '2026-10-09', partyId: 'customer', partyName: 'Asha', isManual: true, total: 100 };
  await Promise.all([a.execute('save-document', payload, { collection: 'invoices' }), b.execute('save-document', payload, { collection: 'invoices' })]);
  assert.deepEqual(cloud.envelope.data.invoices.map(doc => doc.invoiceNo), ['INV-1001','INV-1002']);
  assert.equal(cloud.envelope.revision, 3); assert.equal(b.pending, null);
});
test('uncertain response preserves pending operation across reload; retry never duplicates the sale', async () => {
  const cloud = remoteCloud(), store = storeFor(cloud), originalCommit = cloud.commit.bind(cloud); let interrupted = true;
  cloud.commit = async (...args) => { const result = await originalCommit(...args); if (interrupted) { interrupted = false; throw new Error('Connection interrupted'); } return result; };
  await assert.rejects(store.execute('save-document', { date: '2026-10-09', partyName: 'Cash', isManual: true, total: 25 }, { collection: 'invoices' }), /interrupted/);
  assert.ok(store.pending); assert.equal(store.status, 'pending');
  const reloaded = new BillingStore(store.storage, cloud);
  await reloaded.retry(); assert.equal(reloaded.pending, null); assert.equal(reloaded.data.invoices.length, 1); assert.equal(cloud.writes, 1);
});
test('a stale edit after another device records payment is rejected without leaving a blocked pending operation', async () => {
  const cloud = remoteCloud(sale(fixture())), a = storeFor(cloud), b = storeFor(cloud), doc = clone(b.data.invoices[0]);
  await a.execute('payment', { direction: 'in', partyId: 'customer', date: '2026-10-09', amount: 10, allocations: [{ id: doc.id, amount: 10 }] });
  await assert.rejects(b.execute('save-document', { ...doc, expectedVersion: doc.version }, { collection: 'invoices' }), /changed/);
  assert.equal(b.pending, null); assert.equal(b.data.invoices[0].paid, 10); assert.equal(cloud.writes, 1);
});
test('first cloud connection preserves local-only data until an explicit switch', async t => {
  const cloud = remoteCloud(), store = new BillingStore(new MemoryStorage(), cloud);
  await store.save({ revision: 1, data: sale(fixture()) });
  await assert.rejects(store.connect(), /preserved/);
  assert.equal(store.data.invoices.length, 1); assert.equal(cloud.writes, 0);
  await store.useCloud(); t.after(() => clearInterval(store.timer));
  assert.equal(store.data.invoices.length, 0); assert.equal(store.envelope.ownerId, 'owner');
});
test('signed-out cloud workspace blocks posting while preserving saved data', async () => {
  const cloud = remoteCloud(), store = storeFor(cloud); cloud.connected = false;
  await assert.rejects(store.execute('retail', { date: '2026-10-09', amount: 10 }), /Sign in/);
  assert.equal(store.data.retail.length, 0);
});
test('client discovers independent billing login and sends no host cookies', async () => {
  const calls = [];
  const client = new CloudClient(async (url, options) => { calls.push({url,options}); return Response.json(url==='./config.json' ? { apiBaseUrl:'https://billing.example',firebaseApiKey:'public-key',firebaseProjectId:'billing-test' } : { storage:'d1',configured:true,authenticated:false, user:null,googleConfigured:false }); });
  await client.discover(); assert.equal(client.connected,false); assert.equal(client.available,true);
  assert.equal(calls[1].url,'https://billing.example/api/billing/session'); assert.equal(calls[1].options.credentials,'omit');
  assert.equal(calls[1].options.headers.apikey,undefined);
});
test('cloud client sends only the operation command for normal saves', async () => {
  let body;
  const client = new CloudClient(async (url, options) => { body=JSON.parse(options.body); return Response.json({data:fixture(),revision:4}); });
  const operation=command('retail',{date:'2026-10-09',amount:10});
  await client.commit(fixture(),3,operation.id,operation);
  assert.deepEqual(body,{expectedRevision:3,operationId:operation.id,command:operation}); assert.equal(body.data,undefined);
});
test('initial session discovery blocks local posting until a missing API confirms local preview mode', async () => {
  const client = new CloudClient(async () => new Response('No API', { status: 404 }));
  const store = new BillingStore(new MemoryStorage(), client);
  await assert.rejects(store.execute('retail', { date: '2026-10-09', amount: 10 }), /Sign in/);
  assert.equal(store.data.retail.length, 0);
  await client.discover(); await store.execute('retail', { date: '2026-10-09', amount: 10 });
  assert.equal(store.data.retail.length, 1);
});
test('a queued second operation cannot overwrite an earlier uncertain save', async () => {
  const cloud = remoteCloud(), store = storeFor(cloud);
  cloud.commit = async () => { throw new Error('Interrupted'); };
  await assert.rejects(store.execute('retail', { date: '2026-10-09', amount: 10 }));
  const pending = clone(store.pending);
  await assert.rejects(store.submit(command('retail', { date: '2026-10-09', amount: 20 })), /pending save/);
  assert.deepEqual(store.pending, pending);
});
test('polling downloads full billing data only when its revision changes', async () => {
  const cloud = remoteCloud(), store = storeFor(cloud), originalRead = cloud.read.bind(cloud); let downloads = 0;
  cloud.read = async () => { downloads++; return originalRead(); };
  await store.refresh(); assert.equal(downloads, 0);
  await cloud.commit(clone(cloud.envelope.data), 1, 'remote-change');
  downloads = 0; await store.refresh(); assert.equal(downloads, 1); assert.equal(store.envelope.revision, 2);
});
