import test from 'node:test';
import assert from 'node:assert/strict';
import { fixture } from './helpers.js';
import { googleExport } from '../backend/google.js';
test('Google exports a complete snapshot using server-only tokens and literal Sheets cells', async t => {
  const originalFetch=globalThis.fetch; t.after(()=>{globalThis.fetch=originalFetch;});
  const env={ GOOGLE_CLIENT_ID:'client',GOOGLE_CLIENT_SECRET:'server-secret',GOOGLE_REFRESH_TOKEN:'server-refresh',GOOGLE_DRIVE_FOLDER_ID:'folder',GOOGLE_SHEET_ID:'sheet' };
  const calls=[];
  globalThis.fetch=async (url,options)=>{
    calls.push({url,options});
    if(String(url).includes('oauth2.googleapis.com'))return Response.json({access_token:'google-server-token'});
    if(String(url).includes('/upload/drive/'))return new Response(null,{headers:{Location:'https://www.googleapis.com/upload/session'}});
    if(String(url).endsWith('/upload/session'))return Response.json({id:'backup-file'});
    if(String(url).includes('?fields=sheets.properties'))return Response.json({sheets:[]});
    if(String(url).endsWith(':batchUpdate'))return Response.json({replies:[]});
    throw new Error('Unexpected endpoint');
  };
  const reply=await googleExport(env,fixture(),7,'backup'); assert.equal(reply.id,'backup-file');
  assert.doesNotMatch(JSON.stringify(reply),/server-secret|server-refresh|google-server-token/);
  const upload=calls.find(c=>String(c.url).endsWith('/upload/session'));
  const contents=JSON.parse(new TextDecoder().decode(upload.options.body)); assert.equal(contents.revision,7); assert.ok(contents.data.audit);
  await googleExport(env,fixture(),7,'sheets'); assert.ok(calls.some(c=>String(c.url).endsWith(':batchUpdate')));
});
