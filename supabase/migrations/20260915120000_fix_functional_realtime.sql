-- FUNCTIONAL SCHEMA: Bridge gap between generic business_records and operational tables

-- Extend business_records with operational fields
ALTER TABLE public.business_records ADD COLUMN IF NOT EXISTS sku text;
ALTER TABLE public.business_records ADD COLUMN IF NOT EXISTS unit text DEFAULT 'pcs';
ALTER TABLE public.business_records ADD COLUMN IF NOT EXISTS min_stock integer DEFAULT 0;
ALTER TABLE public.business_records ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE public.business_records ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.business_records ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.business_records ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE public.business_records ADD COLUMN IF NOT EXISTS points integer DEFAULT 0;
ALTER TABLE public.business_records ADD COLUMN IF NOT EXISTS salary_type text CHECK (salary_type IN ('daily','monthly','hourly'));
ALTER TABLE public.business_records ADD COLUMN IF NOT EXISTS salary_amount numeric(14,2);
ALTER TABLE public.business_records ADD COLUMN IF NOT EXISTS position text;

-- Create view for Products (business_records with module='products')
CREATE OR REPLACE VIEW public.products_view WITH (security_invoker = true) AS
SELECT
  id,
  user_id,
  name as nama,
  description as deskripsi,
  amount as harga,
  quantity as stok,
  sku,
  unit,
  min_stock,
  category,
  status as aktif_status,
  CASE WHEN status = 'active' THEN true ELSE false END as aktif,
  COALESCE(CAST(metadata->>'rating' AS numeric), 4.5)::numeric(2,1) as rating,
  NULL::text as foto_url,
  created_at,
  updated_at
FROM public.business_records
WHERE module = 'products' AND user_id = auth.uid()
ORDER BY updated_at DESC;

GRANT SELECT ON public.products_view TO authenticated;

-- Create view for Inventory (business_records with module='inventory')
CREATE OR REPLACE VIEW public.inventory_view WITH (security_invoker = true) AS
SELECT
  id,
  user_id,
  name as item_name,
  description,
  amount as unit_cost,
  quantity as current_stock,
  quantity - COALESCE(CAST(metadata->>'reserved' AS integer), 0) as available_stock,
  COALESCE(CAST(metadata->>'reserved' AS integer), 0) as reserved,
  min_stock as reorder_point,
  sku,
  category as warehouse,
  status,
  created_at,
  updated_at
FROM public.business_records
WHERE module = 'inventory' AND user_id = auth.uid()
ORDER BY updated_at DESC;

GRANT SELECT ON public.inventory_view TO authenticated;

-- Create view for Customers (business_records with module='customers')
CREATE OR REPLACE VIEW public.customers_view WITH (security_invoker = true) AS
SELECT
  id,
  user_id,
  name as customer_name,
  phone,
  email,
  points as loyalty_points,
  COALESCE(CAST(metadata->>'total_spent' AS numeric), 0)::numeric(14,2) as total_spent,
  CASE WHEN status = 'active' THEN 'regular' WHEN status = 'vip' THEN 'vip' ELSE 'inactive' END as tier,
  status,
  created_at,
  updated_at
FROM public.business_records
WHERE module = 'customers' AND user_id = auth.uid()
ORDER BY updated_at DESC;

GRANT SELECT ON public.customers_view TO authenticated;

-- Create view for Staff (business_records with module='staff')
CREATE OR REPLACE VIEW public.staff_view WITH (security_invoker = true) AS
SELECT
  id,
  user_id,
  name as staff_name,
  phone,
  email,
  position,
  salary_type,
  salary_amount,
  COALESCE(CAST(metadata->>'hire_date' AS date), CURRENT_DATE) as hire_date,
  status as employment_status,
  created_at,
  updated_at
FROM public.business_records
WHERE module = 'staff' AND user_id = auth.uid()
ORDER BY updated_at DESC;

GRANT SELECT ON public.staff_view TO authenticated;

-- Create view for Online Store (business_records with module='online_store')
CREATE OR REPLACE VIEW public.online_store_view WITH (security_invoker = true) AS
SELECT
  id,
  user_id,
  name as item_name,
  description,
  amount as price,
  quantity as available_quantity,
  category as channel,
  sku,
  COALESCE(CAST(metadata->>'sales' AS integer), 0) as sales_count,
  COALESCE(CAST(metadata->>'revenue' AS numeric), 0)::numeric(14,2) as revenue,
  status as visibility,
  created_at,
  updated_at
FROM public.business_records
WHERE module = 'online_store' AND user_id = auth.uid()
ORDER BY updated_at DESC;

GRANT SELECT ON public.online_store_view TO authenticated;

-- Update business_reports to include time filters
CREATE OR REPLACE VIEW public.business_reports_daily WITH (security_invoker = true) AS
SELECT
  user_id,
  module,
  DATE(updated_at) as report_date,
  count(*)::int as record_count,
  coalesce(sum(amount), 0)::numeric as total_amount,
  coalesce(sum(quantity), 0)::int as total_quantity,
  coalesce(sum(CAST(metadata->>'revenue' AS numeric)), 0)::numeric as total_revenue
FROM public.business_records
WHERE user_id = auth.uid()
GROUP BY user_id, module, DATE(updated_at)
ORDER BY report_date DESC;

GRANT SELECT ON public.business_reports_daily TO authenticated;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS business_records_module_status_idx ON public.business_records(user_id, module, status, updated_at DESC);
CREATE INDEX IF NOT EXISTS business_records_metadata_idx ON public.business_records USING gin(metadata);
CREATE INDEX IF NOT EXISTS business_records_created_idx ON public.business_records(user_id, created_at DESC);

-- Enable realtime for all dependent views (already covered by base table)
ALTER TABLE public.business_records REPLICA IDENTITY FULL;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.business_records;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
