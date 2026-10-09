import test from 'node:test';
import assert from 'node:assert/strict';
import { CloudClient } from '../src/cloud.js';
import { MemoryStorage } from './helpers.js';
const config = { apiBaseUrl:'https://billing.example',firebaseApiKey:'public-key',firebaseProjectId:'billing-test' };
test('email/password login verifies backend access; credentials never enter browser persistence', async () => {
  const storage = new MemoryStorage(), calls=[];
  const client = new CloudClient(async (url, options) => {
    calls.push({url,options});
    if (url==='./config.json') return Response.json(config);
    if (url.includes('signInWithPassword')) return Response.json({idToken:'fixture-token',refreshToken:'fixture-refresh',expiresIn:'3600'});
    if (url.endsWith('/session')) return Response.json({storage:'d1',configured:true,authenticated:Boolean(options.headers.Authorization),user:{id:'owner',email:'owner@example.test'}});
    throw new Error('Unexpected request');
  },storage);
  await client.discover(); await client.signIn('owner@example.test','private-password');
  assert.ok(client.connected); assert.doesNotMatch(JSON.stringify([...storage.values]),/private-password/);
  assert.equal(calls.at(-1).options.headers.Authorization,'Bearer fixture-token');
  client.signOut(); assert.equal(client.connected,false); assert.equal(storage.values.size,0);
});
test('rejected business access removes temporary login tokens', async () => {
  const storage = new MemoryStorage();
  const client = new CloudClient(async url => url.includes('signInWithPassword') ? Response.json({idToken:'token',refreshToken:'refresh',expiresIn:'3600'}) : Response.json({message:'Wrong business',code:'OWNER_REQUIRED'},{status:403}),storage);
  client.config=config; client.configured=true;
  await assert.rejects(client.signIn('other@example.test','password'),/Wrong business/);
  assert.equal(client.connected,false); assert.equal(storage.values.size,0);
});
test('expired login refreshes once for simultaneous API reads', async () => {
  let refreshes=0; const storage = new MemoryStorage();
  const client = new CloudClient(async (url, options) => {
    if (url.includes('securetoken.googleapis.com')) { refreshes++; return Response.json({id_token:'new-token',refresh_token:'new-refresh',expires_in:'3600'}); }
    assert.equal(options.headers.Authorization,'Bearer new-token'); return Response.json({revision:4});
  },storage);
  client.config=config; client.saveTokens({idToken:'old',refreshToken:'refresh',expiresIn:'1'});
  assert.deepEqual(await Promise.all([client.readRevision(),client.readRevision()]),[4,4]); assert.equal(refreshes,1);
});
test('unconfigured cloud allows device-only work but invalid API origins fail visibly', async () => {
  const local = new CloudClient(async () => Response.json({apiBaseUrl:'',firebaseApiKey:'',firebaseProjectId:''}));
  await local.discover(); assert.equal(local.available,false);
  const invalid = new CloudClient(async () => Response.json({...config,apiBaseUrl:'http://unsafe.example'}));
  await assert.rejects(invalid.discover(),/HTTPS/); assert.equal(invalid.available,true);
});
