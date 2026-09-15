create table if not exists public.hpp_recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  portions numeric(12,3) not null default 1 check (portions > 0),
  labor_cost numeric(14,2) not null default 0 check (labor_cost >= 0),
  overhead_cost numeric(14,2) not null default 0 check (overhead_cost >= 0),
  target_margin numeric(5,2) not null default 30 check (target_margin >= 0 and target_margin < 100),
  ingredients jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.hpp_recipes enable row level security;
drop policy if exists "Users manage own HPP recipes" on public.hpp_recipes;
create policy "Users manage own HPP recipes" on public.hpp_recipes
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.hpp_recipes to authenticated;
create index if not exists hpp_recipes_user_updated_idx on public.hpp_recipes(user_id, updated_at desc);
alter table public.hpp_recipes replica identity full;
do $$ begin
  alter publication supabase_realtime add table public.hpp_recipes;
exception when duplicate_object then null;
end $$;

create or replace function public.touch_hpp_recipes()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists hpp_recipes_updated_at on public.hpp_recipes;
create trigger hpp_recipes_updated_at
before update on public.hpp_recipes
for each row execute function public.touch_hpp_recipes();
