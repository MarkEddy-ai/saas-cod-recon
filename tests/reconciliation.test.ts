import { describe, it, expect } from 'vitest';
import { reconcileCarrierLine } from '../src/modules/reconciliation/matcher';
import { evaluateOrderRisk } from '../src/modules/risk/scorer';
import { CarrierCsvLine } from '../src/contracts/schemas';

describe('Agent 12 : Moteur de Réconciliation Financière (Zéro Flottant)', () => {
  it('doit valider un rapprochement parfaitement conforme (variance = 0)', () => {
    const line: CarrierCsvLine = {
      tracking_number: 'YAL-16-1001',
      carrier_name: 'YALIDINE',
      collected_amount_cents: 450000, // 4500.00 DZD
      shipping_fee_cents: 50000,     // 500.00 DZD (Net reçu = 4000.00 DZD)
      delivery_status: 'DELIVERED',
    };
    const expectedCents = 400000;

    const result = reconcileCarrierLine(expectedCents, line);

    expect(result.actual_cents).toBe(400000);
    expect(result.variance_cents).toBe(0);
    expect(result.status).toBe('MATCHED');
  });

  it('doit détecter un sous-paiement transporteur (DISCREPANCY_UNDERPAID)', () => {
    const line: CarrierCsvLine = {
      tracking_number: 'ZR-31-5021',
      carrier_name: 'ZR_EXPRESS',
      collected_amount_cents: 500000,
      shipping_fee_cents: 80000, // Net reçu = 420000
      delivery_status: 'DELIVERED',
    };
    const expectedCents = 450000; // Écart = -30000 centimes (-300 DZD)

    const result = reconcileCarrierLine(expectedCents, line);

    expect(result.variance_cents).toBe(-30000);
    expect(result.status).toBe('DISCREPANCY_UNDERPAID');
  });
});

describe('Agent 11 : Moteur Anti-RTO & Validation DZ', () => {
  it('doit valider un numéro conforme et une adresse précise', () => {
    const order = {
      id: 'CMD-TEST-01',
      customer_name: 'Tarik Mansouri',
      phone: '0555123456',
      wilaya: '16 - Alger',
      address: '15 Boulevard des Martyrs, Appt 4',
    };

    const assessment = evaluateOrderRisk(order);

    expect(assessment.risk_level).toBe('LOW');
    expect(assessment.recommendation).toBe('EXPEDIER');
  });

  it('doit bloquer les numéros suspects répétitifs', () => {
    const order = {
      id: 'CMD-TEST-FRAUD',
      customer_name: 'Client',
      phone: '0666666666',
      wilaya: '31 - Oran',
      address: 'centre ville',
    };

    const assessment = evaluateOrderRisk(order);

    expect(assessment.risk_score).toBeGreaterThanOrEqual(65);
    expect(assessment.recommendation).toBe('BLOQUER');
  });
});
