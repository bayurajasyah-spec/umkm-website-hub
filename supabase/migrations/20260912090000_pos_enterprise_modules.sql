create table if not exists public.outlets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  tax_percent numeric(5,2) not null default 11,
  service_charge_percent numeric(5,2) not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.shifts (
  id uuid primary key default gen_random_uuid(),
  outlet_id uuid not null references public.outlets(id) on delete cascade,
  cashier_id uuid not null references auth.users(id) on delete restrict,
  opening_cash bigint not null default 0,
  closing_cash bigint,
  expected_cash bigint,
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  status text not null default 'open' check (status in ('open','closed'))
);

create table if not exists public.inventory_stock (
  id uuid primary key default gen_random_uuid(),
  outlet_id uuid not null references public.outlets(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  quantity numeric(12,2) not null default 0,
  reorder_level numeric(12,2) not null default 5,
  updated_at timestamptz not null default now(),
  unique (outlet_id, product_id)
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  outlet_id uuid not null references public.outlets(id) on delete cascade,
  name text not null,
  phone text,
  points integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.cash_movements (
  id uuid primary key default gen_random_uuid(),
  shift_id uuid not null references public.shifts(id) on delete cascade,
  cashier_id uuid not null references auth.users(id) on delete restrict,
  type text not null check (type in ('in','out')),
  amount bigint not null check (amount > 0),
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  outlet_id uuid references public.outlets(id) on delete set null,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.outlets enable row level security;
alter table public.shifts enable row level security;
alter table public.inventory_stock enable row level security;
alter table public.customers enable row level security;
alter table public.cash_movements enable row level security;
alter table public.audit_logs enable row level security;

do $$ begin
  create policy "staff read outlets" on public.outlets for select to authenticated using (public.is_staff(auth.uid()));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "staff manage shifts" on public.shifts for all to authenticated using (cashier_id = auth.uid() or public.has_role(auth.uid(),'admin')) with check (cashier_id = auth.uid() or public.has_role(auth.uid(),'admin'));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "staff manage inventory" on public.inventory_stock for all to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "staff manage customers" on public.customers for all to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "staff read cash movements" on public.cash_movements for select to authenticated using (cashier_id = auth.uid() or public.has_role(auth.uid(),'admin'));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "admins read audit logs" on public.audit_logs for select to authenticated using (public.has_role(auth.uid(),'admin'));
exception when duplicate_object then null; end $$;

alter table public.shifts replica identity full;
alter table public.inventory_stock replica identity full;
alter table public.cash_movements replica identity full;
do $$ begin
  alter publication supabase_realtime add table public.shifts;
  alter publication supabase_realtime add table public.inventory_stock;
  alter publication supabase_realtime add table public.cash_movements;
exception when duplicate_object then null; end $$;
