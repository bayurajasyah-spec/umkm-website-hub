create table if not exists public.store_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  store_name text not null default 'BY.CASHIER', phone text not null default '', email text not null default '', city text not null default '', address text not null default '', logo_url text, tax_enabled boolean not null default false, tax_percent numeric(5,2) not null default 10, payment_methods jsonb not null default '["Tunai","Kartu","Transfer","QRIS"]'::jsonb, dana_enabled boolean not null default false, dana_number text not null default '', dana_recipient text not null default '', dana_qr_url text, receipt_logo boolean not null default true, receipt_npwp boolean not null default true, receipt_footer text not null default 'Terima kasih atas pembelian Anda!', updated_at timestamptz not null default now());
alter table public.store_settings enable row level security;
drop policy if exists "Users manage own store settings" on public.store_settings;
create policy "Users manage own store settings" on public.store_settings for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
alter table public.store_settings replica identity full;
do $$ begin alter publication supabase_realtime add table public.store_settings; exception when duplicate_object then null; end $$;
insert into storage.buckets (id, name, public) values ('store-assets', 'store-assets', true) on conflict (id) do nothing;
drop policy if exists "Users upload store assets" on storage.objects;
create policy "Users upload store assets" on storage.objects for insert to authenticated with check (bucket_id = 'store-assets' and (storage.foldername(name))[1] = (select auth.uid()::text));
drop policy if exists "Users update store assets" on storage.objects;
create policy "Users update store assets" on storage.objects for update to authenticated using (bucket_id = 'store-assets' and (storage.foldername(name))[1] = (select auth.uid()::text)) with check (bucket_id = 'store-assets' and (storage.foldername(name))[1] = (select auth.uid()::text));
create or replace function public.touch_store_settings() returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end $$;
drop trigger if exists store_settings_updated_at on public.store_settings;
create trigger store_settings_updated_at before update on public.store_settings for each row execute function public.touch_store_settings();
