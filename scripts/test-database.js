// Run only against a disposable local/CI database, never a live billing database.
import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { blankState, applyCommand } from '../src/domain.js';
const database = process.env.XL_TEST_DATABASE_URL;
if (!database) throw new Error('Set XL_TEST_DATABASE_URL to a disposable PostgreSQL database.');
function sql(text) {
  const result = spawnSync('psql', [database, '-X', '-v', 'ON_ERROR_STOP=1', '-q'], { input: text, encoding: 'utf8' });
  if (result.status !== 0) throw new Error(result.stderr);
}
sql(`
create role authenticated nologin;
create role anon nologin;
create schema auth;
create table auth.users(id uuid primary key);
create function auth.uid() returns uuid language sql stable as
  $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
grant usage on schema auth to authenticated, anon;
insert into auth.users values ('00000000-0000-0000-0000-000000000001'), ('00000000-0000-0000-0000-000000000002');
`);
sql(await readFile(new URL('../backend/schema.sql', import.meta.url), 'utf8'));
const data = applyCommand(blankState(), { id: 'fixture-sale', at: '2026-10-09T12:00:00Z', type: 'save-document', collection: 'invoices', payload: { date: '2026-10-09', partyName: 'Cash', isManual: true, total: 100, initialPaid: 20 } });
const snapshot = JSON.stringify(data).replace(/'/g, "''");
sql(`
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', false);
do $$ declare result jsonb; bad_data jsonb; denied boolean := false; begin
  result := public.xl_billing_commit('${snapshot}'::jsonb, 0, '10000000-0000-0000-0000-000000000001');
  assert (result->>'revision')::int = 1, 'first write did not commit';
  result := public.xl_billing_commit('${snapshot}'::jsonb, 0, '10000000-0000-0000-0000-000000000001');
  assert (result->>'revision')::int = 1, 'retry incremented the revision';
  begin
    perform public.xl_billing_commit('${snapshot}'::jsonb, 0, '10000000-0000-0000-0000-000000000002');
  exception when serialization_failure then denied := true; end;
  assert denied, 'stale revision was accepted'; denied := false;
  begin
    update public.xl_billing_workspaces set revision = 999;
  exception when insufficient_privilege then denied := true; end;
  assert denied, 'direct writes bypassed the commit transaction'; denied := false;
  begin
    perform public.xl_billing_commit('{}'::jsonb, 1, '10000000-0000-0000-0000-000000000003');
  exception when invalid_parameter_value then denied := true; end;
  assert denied, 'malformed billing payload accepted'; denied := false;
  bad_data := jsonb_set('${snapshot}'::jsonb, '{invoices,0,balance}', '999'::jsonb);
  begin
    perform public.xl_billing_commit(bad_data, 1, '10000000-0000-0000-0000-000000000005');
  exception when invalid_parameter_value then denied := true; end;
  assert denied, 'inconsistent payment balance was accepted'; denied := false;
  bad_data := '${snapshot}'::jsonb;
  bad_data := jsonb_set(bad_data, '{invoices}', (bad_data->'invoices') || jsonb_build_array(jsonb_set(bad_data->'invoices'->0, '{id}', '"duplicate-number"'::jsonb)));
  begin
    perform public.xl_billing_commit(bad_data, 1, '10000000-0000-0000-0000-000000000006');
  exception when unique_violation then denied := true; end;
  assert denied, 'duplicate invoice number accepted';
end $$;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000002', false);
do $$ begin assert (select count(*) from public.xl_billing_workspaces) = 0, 'another owner could read private data'; end $$;
reset role;
set role anon;
do $$ declare denied boolean := false; begin
  begin perform public.xl_billing_commit('${snapshot}'::jsonb, 1, '10000000-0000-0000-0000-000000000004');
  exception when insufficient_privilege then denied := true; end;
  assert denied, 'anonymous billing write was accepted';
end $$;
`);
process.stdout.write('PostgreSQL checks passed: RLS, RPC permissions, revision conflict, retry identity and payload validation.\n');
