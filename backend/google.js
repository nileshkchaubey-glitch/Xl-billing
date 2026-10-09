import { sheetsProjection, sheetRequests } from './projections.js';
import { BillingError } from './d1.js';
export const googleConfigured = env => Boolean(env.GOOGLE_OWNER_ID && env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.GOOGLE_REFRESH_TOKEN);
const required = (env, name) => { if (!env[name]) throw new BillingError(`Google integration needs ${name} configured by the owner.`, 503, 'GOOGLE_SETUP'); return env[name]; };
async function googleApi(url, options = {}) {
  const response = await fetch(url, { signal: AbortSignal.timeout(25000), ...options });
  if (!response.ok) throw new BillingError(`Google export failed (${response.status}). Your billing records are unchanged.`, 502, 'GOOGLE_ERROR');
  return response;
}
export async function googleExport(env, data, revision, action) {
  if (!['backup', 'sheets'].includes(action)) throw new BillingError('Choose backup or sheets.');
  const response = await googleApi('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ client_id: required(env, 'GOOGLE_CLIENT_ID'), client_secret: required(env, 'GOOGLE_CLIENT_SECRET'), refresh_token: required(env, 'GOOGLE_REFRESH_TOKEN'), grant_type: 'refresh_token' }) });
  const token = (await response.json()).access_token;
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  if (action === 'backup') {
    const body = new TextEncoder().encode(JSON.stringify({ schemaVersion: 2, exportedAt: new Date().toISOString(), revision, data }));
    const initiation = await googleApi('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id', { method: 'POST', headers: { ...headers, 'X-Upload-Content-Type': 'application/json', 'X-Upload-Content-Length': String(body.length) }, body: JSON.stringify({ name: `xl-billing-r${revision}-${new Date().toISOString().replace(/[:.]/g, '-')}.json`, mimeType: 'application/json', parents: [required(env, 'GOOGLE_DRIVE_FOLDER_ID')] }) });
    const location = new URL(initiation.headers.get('Location'));
    if (location.protocol !== 'https:' || location.hostname !== 'www.googleapis.com') throw new BillingError('Unexpected Google upload location.');
    const saved = await googleApi(location.href, { method: 'PUT', headers, body });
    return { id: (await saved.json()).id, message: `Full backup for revision ${revision} saved to Google Drive.` };
  }
  const base = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(required(env, 'GOOGLE_SHEET_ID'))}`;
  const meta = await (await googleApi(base + '?fields=sheets.properties', { headers })).json();
  const body = JSON.stringify({ requests: sheetRequests(sheetsProjection(data, revision), meta.sheets || []) });
  if (new TextEncoder().encode(body).length > 2 * 1024 * 1024) throw new BillingError('The spreadsheet export exceeds 2 MB. Use a full backup and split larger reports.');
  await googleApi(base + ':batchUpdate', { method: 'POST', headers, body });
  return { message: `Google Sheets reports updated from revision ${revision}. Photos remain in full backups.` };
}
