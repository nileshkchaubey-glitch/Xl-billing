import { sheetsProjection, sheetRequests } from './projections.js';
// Supabase Edge Functions execute this module in Deno; no npm dependencies.
const env = name => { const value = Deno.env.get(name); if (!value) throw new Error(`Missing server configuration: ${name}`); return value; };
async function api(url, options = {}) {
  const response = await fetch(url, { signal: AbortSignal.timeout(25000), ...options });
  if (!response.ok) throw new Error(`External service returned ${response.status}. No billing records were changed.`);
  return response;
}
async function googleToken() {
  const response = await api('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ client_id: env('GOOGLE_CLIENT_ID'), client_secret: env('GOOGLE_CLIENT_SECRET'), refresh_token: env('GOOGLE_REFRESH_TOKEN'), grant_type: 'refresh_token' }) });
  return (await response.json()).access_token;
}
async function driveBackup(data, revision, token) {
  const body = JSON.stringify({ schemaVersion: 2, exportedAt: new Date().toISOString(), revision, data });
  const bytes = new TextEncoder().encode(body);
  const initiation = await api('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'X-Upload-Content-Type': 'application/json', 'X-Upload-Content-Length': String(bytes.length) }, body: JSON.stringify({ name: `xl-billing-r${revision}-${new Date().toISOString().replace(/[:.]/g, '-')}.json`, mimeType: 'application/json', parents: [env('GOOGLE_DRIVE_FOLDER_ID')] }) });
  const location = new URL(initiation.headers.get('Location'));
  if (location.protocol !== 'https:' || location.hostname !== 'www.googleapis.com') throw new Error('Unexpected Google upload location.');
  const response = await api(location.href, { method: 'PUT', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: bytes });
  return { id: (await response.json()).id, message: `Full backup for revision ${revision} saved to Google Drive.` };
}
async function sheetsExport(data, revision, token) {
  const base = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(env('GOOGLE_SHEET_ID'))}`;
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  const metadata = await (await api(base + '?fields=sheets.properties', { headers })).json();
  const body = JSON.stringify({ requests: sheetRequests(sheetsProjection(data, revision), metadata.sheets || []) });
  if (new TextEncoder().encode(body).length > 2 * 1024 * 1024) throw new Error('This report exceeds the 2 MB export limit. Use the full Drive backup; split spreadsheet reports before exporting a larger workspace.');
  await api(base + ':batchUpdate', { method: 'POST', headers, body });
  return { message: `Google Sheets reports updated from revision ${revision}. Bill photos are included in Drive backups.` };
}
Deno.serve(async request => {
  let headers;
  try {
    const origin = request.headers.get('Origin');
    if (origin !== env('APP_ORIGIN')) return new Response('Origin not allowed', { status: 403 });
    headers = { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Headers': 'authorization, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Vary': 'Origin', 'Content-Type': 'application/json' };
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (request.method !== 'POST') return new Response(JSON.stringify({ message: 'Use POST.' }), { status: 405, headers });
    const authorization = request.headers.get('Authorization') || '';
    if (!authorization.startsWith('Bearer ')) return new Response(JSON.stringify({ message: 'Sign in first.' }), { status: 401, headers });
    const authHeaders = { Authorization: authorization, apikey: env('SUPABASE_ANON_KEY') };
    const auth = await fetch(env('SUPABASE_URL') + '/auth/v1/user', { headers: authHeaders, signal: AbortSignal.timeout(10000) });
    if (!auth.ok || (await auth.json()).id !== env('BILLING_OWNER_ID')) return new Response(JSON.stringify({ message: 'This Google connection belongs to a different billing owner.' }), { status: 403, headers });
    const { action } = await request.json();
    if (!['backup', 'sheets'].includes(action)) throw new Error('Choose backup or sheets.');
    const rows = await (await api(env('SUPABASE_URL') + '/rest/v1/xl_billing_workspaces?select=data,revision&limit=1', { headers: authHeaders })).json();
    if (!rows[0]) throw new Error('Save the cloud workspace first.');
    const { data, revision } = rows[0], token = await googleToken();
    const result = action === 'backup' ? await driveBackup(data, revision, token) : await sheetsExport(data, revision, token);
    return new Response(JSON.stringify(result), { headers });
  } catch (error) {
    // No credentials or upstream response bodies are logged or returned.
    return new Response(JSON.stringify({ message: error.message || 'Export failed.' }), { status: 400, headers });
  }
});
