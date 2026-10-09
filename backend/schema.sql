-- Run in the SQL editor of a NEW/dedicated Supabase project.
-- Each Auth user owns one workspace. Use the SAME owner account on both devices.
begin;

create table if not exists public.xl_billing_workspaces (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null,
  revision bigint not null default 0 check (revision >= 0),
  updated_at timestamptz not null default now()
);
create table if not exists public.xl_billing_operations (
  user_id uuid not null references auth.users(id) on delete cascade,
  operation_id uuid not null,
  revision bigint not null,
  created_at timestamptz not null default now(),
  primary key (user_id, operation_id)
);
alter table public.xl_billing_workspaces enable row level security;
alter table public.xl_billing_operations enable row level security;
drop policy if exists owner_read on public.xl_billing_workspaces;
create policy owner_read on public.xl_billing_workspaces for select to authenticated
  using ((select auth.uid()) = user_id);
revoke all on public.xl_billing_workspaces, public.xl_billing_operations from anon, authenticated;
grant select on public.xl_billing_workspaces to authenticated;

-- A single transaction checks the revision, writes all data and records the
-- operation ID. Retrying after an interrupted response cannot duplicate a sale.
create or replace function public.xl_billing_commit(
  next_data jsonb, expected_revision bigint, operation_id uuid
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  owner_id uuid := auth.uid();
  op_id uuid := operation_id;
  current_row public.xl_billing_workspaces%rowtype;
  collection text;
  doc jsonb;
  payment jsonb;
  total_value numeric;
  paid_value numeric;
  sum_paid numeric;
begin
  if owner_id is null then raise exception 'Sign in first' using errcode = '42501'; end if;
  if op_id is null or expected_revision is null or expected_revision < 0 then
    raise exception 'Invalid operation identity' using errcode = '22023';
  end if;
  -- First-write races are serialized by the primary key, then the row lock.
  insert into public.xl_billing_workspaces(user_id, data, revision)
    values (owner_id, '{}'::jsonb, 0) on conflict (user_id) do nothing;
  select w.* into current_row from public.xl_billing_workspaces w
    where w.user_id = owner_id for update;
  if exists (select 1 from public.xl_billing_operations o where o.user_id = owner_id and o.operation_id = op_id) then
    return jsonb_build_object('data', current_row.data, 'revision', current_row.revision);
  end if;
  if current_row.revision <> expected_revision then
    raise exception 'Workspace changed; refresh and retry' using errcode = '40001';
  end if;
  if jsonb_typeof(next_data) is distinct from 'object'
    or jsonb_typeof(next_data->'settings') is distinct from 'object'
    or next_data->>'schemaVersion' is distinct from '2' then
    raise exception 'Invalid billing data' using errcode = '22023';
  end if;
  -- Bound snapshot growth explicitly; private object storage + normalized tables
  -- are the next step for larger businesses, rather than silently truncating data.
  if octet_length(next_data::text) > 20 * 1024 * 1024 then
    raise exception 'Workspace exceeds 20 MB; move photos to object storage before adding more' using errcode = '22023';
  end if;
  foreach collection in array array['items','parties','invoices','purchases','retail','audit','openingPayments'] loop
    if jsonb_typeof(next_data->collection) is distinct from 'array' then
      raise exception 'Invalid collection: %', collection using errcode = '22023';
    end if;
    if exists (select 1 from jsonb_array_elements(next_data->collection) r
      where jsonb_typeof(r) is distinct from 'object' or coalesce(r->>'id', '') = '')
      or exists (select 1 from jsonb_array_elements(next_data->collection) r group by r->>'id' having count(*) > 1) then
      raise exception 'Missing or duplicate IDs in %', collection using errcode = '22023';
    end if;
  end loop;
  foreach collection in array array['invoices','purchases'] loop
    for doc in select value from jsonb_array_elements(next_data->collection) loop
      if jsonb_typeof(doc->'payments') is distinct from 'array' or jsonb_typeof(doc->'items') is distinct from 'array'
        or coalesce(doc->>'date','') !~ '^\d{4}-\d{2}-\d{2}$'
        or jsonb_typeof(doc->'total') is distinct from 'number'
        or jsonb_typeof(doc->'paid') is distinct from 'number'
        or jsonb_typeof(doc->'balance') is distinct from 'number' then
        raise exception 'Invalid bill' using errcode = '22023';
      end if;
      if to_char((doc->>'date')::date, 'YYYY-MM-DD') <> doc->>'date' then
        raise exception 'Invalid bill date' using errcode = '22023';
      end if;
      total_value := round((doc->>'total')::numeric, 2);
      paid_value := round((doc->>'paid')::numeric, 2);
      sum_paid := 0;
      for payment in select value from jsonb_array_elements(doc->'payments') loop
        if coalesce(payment->>'id', '') = '' or jsonb_typeof(payment->'amt') is distinct from 'number'
          or (payment->>'amt')::numeric < 0 then
          raise exception 'Invalid payment' using errcode = '22023';
        end if;
        if not (payment ? 'voidedAt') then sum_paid := sum_paid + round((payment->>'amt')::numeric, 2); end if;
      end loop;
      if total_value < 0 or paid_value <> sum_paid or round((doc->>'balance')::numeric, 2) <> greatest(0, total_value - paid_value) then
        raise exception 'Bill balances do not match payments' using errcode = '22023';
      end if;
    end loop;
    if collection = 'invoices' and exists (select 1 from jsonb_array_elements(next_data->collection) r
      group by r->>'invoiceNo' having count(*) > 1) then
      raise exception 'Duplicate invoice number' using errcode = '23505';
    end if;
  end loop;
  -- Remove legacy integration secrets even if a client sends an old backup.
  next_data := jsonb_set(next_data, '{settings}', (next_data->'settings') - array['jsonbinKey','jsonbinId','gsUrl','deletePin']);
  update public.xl_billing_workspaces w set data = next_data,
    revision = current_row.revision + 1, updated_at = now() where w.user_id = owner_id;
  insert into public.xl_billing_operations(user_id, operation_id, revision)
    values (owner_id, op_id, current_row.revision + 1);
  return jsonb_build_object('data', next_data, 'revision', current_row.revision + 1);
exception when invalid_text_representation or datetime_field_overflow then
  raise exception 'Invalid date or numeric field' using errcode = '22023';
end;
$$;
revoke all on function public.xl_billing_commit(jsonb, bigint, uuid) from public, anon;
grant execute on function public.xl_billing_commit(jsonb, bigint, uuid) to authenticated;
commit;
