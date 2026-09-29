-- Migration 0001: Schema Initial SaaS COD & Reconciliation
-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Types ENUM
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'shipped', 'delivered', 'returned', 'cancelled');
CREATE TYPE parcel_status AS ENUM ('in_transit', 'delivered', 'returned', 'incident');
CREATE TYPE disbursement_status AS ENUM ('draft', 'reconciled', 'discrepancy', 'closed');
CREATE TYPE risk_level AS ENUM ('low', 'medium', 'high', 'critical');

-- 1. Organizations
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'DZD',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Stores (Multi-tenant)
CREATE TABLE stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    platform VARCHAR(50) NOT NULL DEFAULT 'custom',
    api_key_hash VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Orders
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    external_order_id VARCHAR(100) NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    delivery_address TEXT NOT NULL,
    total_amount_cents BIGINT NOT NULL CHECK (total_amount_cents >= 0),
    risk_score INTEGER DEFAULT 0 CHECK (risk_score BETWEEN 0 AND 100),
    status order_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Fraud Risk Logs
CREATE TABLE fraud_risk_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    trigger_reason VARCHAR(255) NOT NULL,
    score_delta INTEGER NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Parcels
CREATE TABLE parcels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
    carrier_name VARCHAR(100) NOT NULL,
    tracking_number VARCHAR(100) NOT NULL,
    status parcel_status NOT NULL DEFAULT 'in_transit',
    shipping_cost_cents BIGINT NOT NULL DEFAULT 0,
    cod_amount_cents BIGINT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Carrier Disbursements (Bordereaux de versement)
CREATE TABLE disbursements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    carrier_name VARCHAR(100) NOT NULL,
    reference_id VARCHAR(100) NOT NULL,
    total_collected_cents BIGINT NOT NULL DEFAULT 0,
    total_fees_cents BIGINT NOT NULL DEFAULT 0,
    net_transferred_cents BIGINT NOT NULL DEFAULT 0,
    status disbursement_status NOT NULL DEFAULT 'draft',
    disbursed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Disbursement Items (Rapprochement unitaire)
CREATE TABLE disbursement_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    disbursement_id UUID NOT NULL REFERENCES disbursements(id) ON DELETE CASCADE,
    parcel_id UUID NOT NULL REFERENCES parcels(id) ON DELETE RESTRICT,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    expected_cents BIGINT NOT NULL,
    actual_cents BIGINT NOT NULL,
    variance_cents BIGINT GENERATED ALWAYS AS (actual_cents - expected_cents) STORED,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index de performance B-Tree
CREATE INDEX idx_orders_store_id ON orders(store_id);
CREATE INDEX idx_orders_external_id ON orders(external_order_id);
CREATE INDEX idx_orders_phone ON orders(customer_phone);
CREATE INDEX idx_parcels_store_id ON parcels(store_id);
CREATE INDEX idx_parcels_tracking ON parcels(tracking_number);
CREATE INDEX idx_disbursements_store ON disbursements(store_id);
CREATE INDEX idx_disbursement_items_parcel ON disbursement_items(parcel_id);

-- Politiques de sécurité RLS (Row Level Security)
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE fraud_risk_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE parcels ENABLE ROW LEVEL SECURITY;
ALTER TABLE disbursements ENABLE ROW LEVEL SECURITY;
ALTER TABLE disbursement_items ENABLE ROW LEVEL SECURITY;

-- Exemple de politique RLS basée sur le header de session store_id
CREATE POLICY rls_orders_store ON orders
    FOR ALL
    USING (store_id = NULLIF(current_setting('app.current_store_id', true), '')::UUID);

CREATE POLICY rls_parcels_store ON parcels
    FOR ALL
    USING (store_id = NULLIF(current_setting('app.current_store_id', true), '')::UUID);

CREATE POLICY rls_disbursements_store ON disbursements
    FOR ALL
    USING (store_id = NULLIF(current_setting('app.current_store_id', true), '')::UUID);
    CREATE POLICY rls_disbursement_items_store ON disbursement_items
    FOR ALL
    USING (store_id = NULLIF(current_setting('app.current_store_id', true), '')::UUID);