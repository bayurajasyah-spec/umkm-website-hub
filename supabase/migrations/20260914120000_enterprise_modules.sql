create table if not exists public.business_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  module text not null check (module in ('products','inventory','customers','staff','online_store')),
  name text not null,
  description text not null default '',
  status text not null default 'active',
  amount numeric(14,2) not null default 0,
  quantity integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.business_records enable row level security;
drop policy if exists "Users manage own business records" on public.business_records;
create policy "Users manage own business records" on public.business_records for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create index if not exists business_records_user_module_idx on public.business_records(user_id, module, updated_at desc);
alter table public.business_records replica identity full;
do $$ begin alter publication supabase_realtime add table public.business_records; exception when duplicate_object then null; end $$;
create or replace function public.touch_business_records() returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end $$;
drop trigger if exists business_records_updated_at on public.business_records;
create trigger business_records_updated_at before update on public.business_records for each row execute function public.touch_business_records();
grant select, insert, update, delete on public.business_records to authenticated; 

create or replace view public.business_reports with (security_invoker = true) as
select user_id, module, count(*)::int as record_count, coalesce(sum(amount), 0)::numeric as total_amount, coalesce(sum(quantity), 0)::int as total_quantity
from public.business_records group by user_id, module;
grant select on public.business_reports to authenticated;
