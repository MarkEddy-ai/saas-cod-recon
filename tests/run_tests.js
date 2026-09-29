// -------------------------------------------------------------
// AGENT 18 : SUITE DE VALIDATION UNITAIRE & INTÉGRITÉ FINANCIÈRE
// -------------------------------------------------------------

console.log("\n=======================================================");
console.log("   AGENT 18 - SUITE DE TESTS AUTOMATISÉS DU BLUEPRINT   ");
console.log("=======================================================\n");

let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(` \x1b[32m[PASS]\x1b[0m : ${testName}`);
    passed++;
  } else {
    console.error(` \x1b[31m[FAIL]\x1b[0m : ${testName}`);
    failed++;
  }
}

// Logique de réconciliation (Agent 12)
function reconcileCarrierLine(expectedAmountCents, carrierLine) {
  const actualNetCents = carrierLine.collected_amount_cents - carrierLine.shipping_fee_cents;
  const varianceCents = actualNetCents - expectedAmountCents;

  let status = 'MATCHED';
  if (varianceCents < 0) {
    status = 'DISCREPANCY_UNDERPAID';
  } else if (varianceCents > 0) {
    status = 'DISCREPANCY_OVERPAID';
  }

  return {
    tracking_number: carrierLine.tracking_number,
    expected_cents: expectedAmountCents,
    actual_cents: actualNetCents,
    variance_cents: varianceCents,
    status
  };
}

// Logique Anti-RTO (Agent 11)
function evaluateOrderRisk(order) {
  let score = 10;
  const flags = [];
  const cleanPhone = order.phone.replace(/\s+/g, '');
  
  const dzPhoneRegex = /^(0)(5|6|7)[0-9]{8}$/;
  if (!dzPhoneRegex.test(cleanPhone)) {
    score += 45;
    flags.push("Format numéro algérien non conforme");
  } else if (/(\d)\1{5,}/.test(cleanPhone)) {
    score += 40;
    flags.push("Numéro répétitif hautement suspect");
  }

  const cleanAddr = order.address.trim().toLowerCase();
  const suspiciousKeywords = ['centre ville', 'poste', 'en face', 'rond point'];
  if (cleanAddr.length < 8 || suspiciousKeywords.some(kw => cleanAddr === kw)) {
    score += 30;
    flags.push("Adresse excessivement vague");
  }

  const finalScore = Math.min(100, Math.max(0, score));
  let recommendation = 'EXPEDIER';
  if (finalScore >= 65) recommendation = 'BLOQUER';
  else if (finalScore >= 35) recommendation = 'CONFIRMATION_REQUISE';

  return { risk_score: finalScore, recommendation, flags };
}

// TEST 1 : Règle Zéro Flottant (Conformité de versement)
const line1 = {
  tracking_number: 'YAL-16-1001',
  collected_amount_cents: 450000,
  shipping_fee_cents: 50000
};
const res1 = reconcileCarrierLine(400000, line1);
assert(
  res1.actual_cents === 400000 && res1.variance_cents === 0 && res1.status === 'MATCHED',
  "Réconciliation conforme : variance = 0 DZD et statut MATCHED"
);

// TEST 2 : Détection d'écart de versement (Sous-paiement)
const line2 = {
  tracking_number: 'ZR-31-5021',
  collected_amount_cents: 500000,
  shipping_fee_cents: 80000
};
const res2 = reconcileCarrierLine(450000, line2);
assert(
  res2.variance_cents === -30000 && res2.status === 'DISCREPANCY_UNDERPAID',
  "Déficit caisse détecté : variance = -300.00 DZD et statut DISCREPANCY_UNDERPAID"
);

// TEST 3 : Validation commande conforme (Numéro 05/06/07 et adresse précise)
const orderValid = {
  phone: '0555123456',
  address: '15 Boulevard des Martyrs, Appt 4'
};
const risk1 = evaluateOrderRisk(orderValid);
assert(
  risk1.recommendation === 'EXPEDIER' && risk1.flags.length === 0,
  "Anti-RTO : Commande régulière certifiée (EXPEDIER, 0 alertes)"
);

// TEST 4 : Blocage commande suspecte (Téléphone fictif et adresse vague)
const orderFraud = {
  phone: '0666666666',
  address: 'centre ville'
};
const risk2 = evaluateOrderRisk(orderFraud);
assert(
  risk2.risk_score >= 65 && risk2.recommendation === 'BLOQUER',
  "Anti-RTO : Commande suspecte bloquée (Score >= 65, BLOQUER)"
);

console.log("\n-------------------------------------------------------");
console.log(`RÉSULTAT GLOBAL : ${passed} Test(s) Validé(s), ${failed} Échoué(s)`);
console.log("-------------------------------------------------------\n");

if (failed > 0) process.exit(1);
