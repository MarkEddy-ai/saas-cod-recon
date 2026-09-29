export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'returned' | 'cancelled';
export type ParcelStatus = 'in_transit' | 'delivered' | 'returned' | 'incident';
export type DisbursementStatus = 'draft' | 'reconciled' | 'discrepancy' | 'closed';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface Organization {
  id: string;
  name: string;
  currency: string;
  created_at: string;
}

export interface Store {
  id: string;
  organization_id: string;
  name: string;
  platform: string;
  api_key_hash: string | null;
  created_at: string;
}

export interface Order {
  id: string;
  store_id: string;
  external_order_id: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  total_amount_cents: number;
  risk_score: number;
  status: OrderStatus;
  created_at: string;
}

export interface Parcel {
  id: string;
  store_id: string;
  order_id: string;
  carrier_name: string;
  tracking_number: string;
  status: ParcelStatus;
  shipping_cost_cents: number;
  cod_amount_cents: number;
  updated_at: string;
}

export interface Disbursement {
  id: string;
  store_id: string;
  carrier_name: string;
  reference_id: string;
  total_collected_cents: number;
  total_fees_cents: number;
  net_transferred_cents: number;
  status: DisbursementStatus;
  disbursed_at: string;
}

export interface DisbursementItem {
  id: string;
  disbursement_id: string;
  parcel_id: string;
  store_id: string;
  expected_cents: number;
  actual_cents: number;
  variance_cents: number;
  created_at: string;
}

export interface FraudRiskLog {
  id: string;
  order_id: string;
  store_id: string;
  trigger_reason: string;
  score_delta: number;
  metadata: Record<string, unknown>;
  created_at: string;
}
