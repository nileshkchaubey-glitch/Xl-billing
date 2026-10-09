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
test('connection rejects secret/service-role credentials and resets sessions when changing projects', () => {
  const storage = new MemoryStorage(), session = new MemoryStorage(), client = new CloudClient(storage, session);
  assert.throws(() => client.configure('http://bad.test', 'key'), /HTTPS/);
  assert.throws(() => client.configure('https://project.supabase.co', 'sb_secret_bad'), /secret/);
  const token = `header.${Buffer.from(JSON.stringify({ role: 'service_role' })).toString('base64url')}.signature`;
  assert.throws(() => client.configure('https://project.supabase.co', token), /valid/);
  client.configure('https://project.supabase.co', 'sb_publishable_test'); client.session = { access_token: 'token' };
  client.configure('https://other.supabase.co', 'sb_publishable_test'); assert.equal(client.session, null);
});
test('REST client refreshes authentication once and sends revision + operation ID to RPC', async () => {
  const calls = [], storage = new MemoryStorage(), sessions = new MemoryStorage();
  const client = new CloudClient(storage, sessions, async (url, options) => {
    calls.push({ url, ...options });
    if (url.includes('refresh_token')) return Response.json({ access_token: 'new', refresh_token: 'refresh', expires_at: Date.now()/1000 + 3600, user: { id: 'owner' } });
    return Response.json({ data: fixture(), revision: 4 });
  });
  client.configure('https://project.supabase.co', 'sb_publishable_test'); client.session = { expires_at: 0, refresh_token: 'refresh' };
  await client.commit(fixture(), 3, 'unique-op');
  assert.equal(calls.length, 2); assert.equal(calls[1].headers.Authorization, 'Bearer new');
  assert.equal(JSON.parse(calls[1].body).expected_revision, 3); assert.equal(JSON.parse(calls[1].body).operation_id, 'unique-op');
});
