-- ====================================================================
-- MASTER BLUEPRINT COD ALGERIA - SCHEMA RELATIONNEL AVEC RLS
-- ====================================================================

-- 1. Table des Boutiques (Tenants)
CREATE TABLE IF NOT EXISTS public.stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Table des Commandes Clients (Anti-RTO & Risque)
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    external_order_id TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    wilaya TEXT NOT NULL,
    address TEXT NOT NULL,
    risk_score INT NOT NULL DEFAULT 0,
    risk_level TEXT NOT NULL CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH')),
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'SHIPPED', 'CANCELLED')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Table des Colis et Bordereaux (Réconciliation Financière Zéro Flottant)
CREATE TABLE IF NOT EXISTS public.parcels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    tracking_number TEXT NOT NULL,
    carrier TEXT NOT NULL CHECK (carrier IN ('YALIDINE', 'ZR_EXPRESS', 'AYOR', 'GUEPEX', 'PROCOLIS', 'NORD_ET_SUD', 'AUTRE')),
    expected_amount_cents BIGINT NOT NULL,
    collected_amount_cents BIGINT NOT NULL DEFAULT 0,
    shipping_fee_cents BIGINT NOT NULL DEFAULT 0,
    variance_cents BIGINT NOT NULL DEFAULT 0,
    reconciliation_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (reconciliation_status IN ('MATCHED', 'DISCREPANCY_UNDERPAID', 'DISCREPANCY_OVERPAID', 'PENDING')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_store_tracking UNIQUE (store_id, tracking_number)
);

-- 4. Activation de Row Level Security (RLS)
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parcels ENABLE ROW LEVEL SECURITY;

-- 5. Politiques d'isolation stricte multi-tenant
CREATE POLICY tenant_isolation_orders ON public.orders
    FOR ALL
    USING (store_id = NULLIF(current_setting('app.current_store_id', true), '')::UUID);

CREATE POLICY tenant_isolation_parcels ON public.parcels
    FOR ALL
    USING (store_id = NULLIF(current_setting('app.current_store_id', true), '')::UUID);
