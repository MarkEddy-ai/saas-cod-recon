import { CarrierCsvLine } from '@/contracts/schemas';

export interface ReconciliationResult {
  tracking_number: string;
  expected_cents: number;
  actual_cents: number;
  variance_cents: number;
  status: 'MATCHED' | 'DISCREPANCY_UNDERPAID' | 'DISCREPANCY_OVERPAID';
}

export function reconcileCarrierLine(
  expectedAmountCents: number,
  carrierData: CarrierCsvLine
): ReconciliationResult {
  const netCarrierCents = carrierData.collected_amount_cents - carrierData.shipping_fee_cents;
  const varianceCents = netCarrierCents - expectedAmountCents;

  let status: ReconciliationResult['status'] = 'MATCHED';
  if (varianceCents < 0) {
    status = 'DISCREPANCY_UNDERPAID';
  } else if (varianceCents > 0) {
    status = 'DISCREPANCY_OVERPAID';
  }

  return {
    tracking_number: carrierData.tracking_number,
    expected_cents: expectedAmountCents,
    actual_cents: netCarrierCents,
    variance_cents: varianceCents,
    status
  };
}
