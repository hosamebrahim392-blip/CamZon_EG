-- ====================================================================
-- CamZone-EG: Supabase Production PostgreSQL Schema & RLS Policies
-- High-Performance Cloud Database for CCTV Orders & Registered Technicians
-- ====================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Orders & Quotations Table (orders)
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_code VARCHAR(32) NOT NULL UNIQUE,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(32) NOT NULL,
    governorate VARCHAR(64) DEFAULT 'القاهرة',
    address TEXT,
    equipment_bom JSONB NOT NULL DEFAULT '{}'::jsonb,
    total_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    order_status VARCHAR(64) NOT NULL DEFAULT 'جديد قيد المراجعة',
    order_type VARCHAR(32) NOT NULL DEFAULT 'client', -- 'client' or 'custom_bundle'
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Create Technicians Marketplace Table (technicians)
CREATE TABLE IF NOT EXISTS public.technicians (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tech_code VARCHAR(32) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(32) NOT NULL,
    national_id VARCHAR(14) NOT NULL,
    governorate VARCHAR(64) NOT NULL,
    coverage_area TEXT,
    years_of_experience INTEGER NOT NULL DEFAULT 1,
    ewallet_number VARCHAR(32),
    equipment_owned TEXT,
    status VARCHAR(64) NOT NULL DEFAULT 'قيد الاعتماد والمراجعة',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Create Performance Indexes
CREATE INDEX IF NOT EXISTS idx_orders_code ON public.orders(order_code);
CREATE INDEX IF NOT EXISTS idx_orders_phone ON public.orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON public.orders(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tech_code ON public.technicians(tech_code);
CREATE INDEX IF NOT EXISTS idx_tech_phone ON public.technicians(phone_number);
CREATE INDEX IF NOT EXISTS idx_tech_national_id ON public.technicians(national_id);
CREATE INDEX IF NOT EXISTS idx_tech_gov ON public.technicians(governorate);
CREATE INDEX IF NOT EXISTS idx_tech_status ON public.technicians(status);

-- 5. Auto-Update Timestamp Trigger Function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_orders_updated_at ON public.orders;
CREATE TRIGGER set_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_tech_updated_at ON public.technicians;
CREATE TRIGGER set_tech_updated_at
BEFORE UPDATE ON public.technicians
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ====================================================================
-- 6. Row Level Security (RLS) - Absolute Production Hardening
-- ====================================================================

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technicians ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to prevent conflicts
DROP POLICY IF EXISTS "Allow public insert to orders" ON public.orders;
DROP POLICY IF EXISTS "Allow admin full access to orders" ON public.orders;
DROP POLICY IF EXISTS "Allow public insert to technicians" ON public.technicians;
DROP POLICY IF EXISTS "Allow admin full access to technicians" ON public.technicians;

-- Policy A: Anyone (clients / public) can INSERT orders
CREATE POLICY "Allow public insert to orders"
ON public.orders
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Policy B: Super Admins ONLY can SELECT, UPDATE, DELETE orders
CREATE POLICY "Allow admin full access to orders"
ON public.orders
FOR ALL
TO authenticated
USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR (auth.jwt() ->> 'email') = 'admin@camzone-eg.com'
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
)
WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR (auth.jwt() ->> 'email') = 'admin@camzone-eg.com'
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- Policy C: Anyone (technicians / public) can INSERT registration applications
CREATE POLICY "Allow public insert to technicians"
ON public.technicians
FOR INSERT
TO anon, authenticated
WITH CHECK (
    length(national_id) = 14
    AND length(phone_number) >= 10
);

-- Policy D: Super Admins ONLY can SELECT, UPDATE, DELETE technicians
CREATE POLICY "Allow admin full access to technicians"
ON public.technicians
FOR ALL
TO authenticated
USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR (auth.jwt() ->> 'email') = 'admin@camzone-eg.com'
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
)
WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR (auth.jwt() ->> 'email') = 'admin@camzone-eg.com'
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- ====================================================================
-- 7. Seed Initial Production Records (Demonstration Data)
-- ====================================================================

INSERT INTO public.orders (order_code, customer_name, customer_phone, governorate, address, equipment_bom, total_price, order_status, order_type)
VALUES 
(
    'ORD-1092',
    'م. شريف عبد المنعم',
    '01012984533',
    'القاهرة',
    'المعادي الجديدة - شارع النصر',
    '{"brand": "HIKVISION", "cameras": 8, "resolution": "5MP", "cables": 120, "trench": 25, "storage": "2TB", "switches": 1}'::jsonb,
    14200.00,
    'جديد قيد المراجعة',
    'client'
),
(
    'ORD-1091',
    'أحمد الباز (محل هدايا)',
    '01148592011',
    'الجيزة',
    'شارع فيصل الرئيسي',
    '{"brand": "DAHUA", "cameras": 4, "resolution": "2MP", "cables": 60, "trench": 10, "storage": "1TB", "switches": 0}'::jsonb,
    6850.00,
    'تم التركيب',
    'client'
)
ON CONFLICT (order_code) DO NOTHING;

INSERT INTO public.technicians (tech_code, full_name, phone_number, national_id, governorate, coverage_area, years_of_experience, ewallet_number, equipment_owned, status)
VALUES
(
    'TECH-5421',
    'م. حسام الدين نبيل',
    '01121275069',
    '29508140102345',
    'القاهرة',
    'القاهرة الكبرى والتجمع والمعادي',
    6,
    '01121275069',
    'جهاز فحص كاميرات 4K Tester + شنيور هيلتي بوش + فيوجن فايبر',
    'معتمد ونشط'
)
ON CONFLICT (tech_code) DO NOTHING;
