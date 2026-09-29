export interface OrderRiskAssessment {
  order_id: string;
  customer_name: string;
  phone: string;
  wilaya: string;
  address: string;
  risk_score: number; // 0 (Faible risque) à 100 (Fraude quasi certaine)
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  flags: string[];
  recommendation: 'EXPEDIER' | 'CONFIRMATION_REQUISE' | 'BLOQUER';
}

export function evaluateOrderRisk(order: {
  id: string;
  customer_name: string;
  phone: string;
  wilaya: string;
  address: string;
}): OrderRiskAssessment {
  let score = 10; // Score de base
  const flags: string[] = [];

  const cleanPhone = order.phone.replace(/\s+/g, '');
  
  // 1. Audit Téléphone Algérie (Mobilis, Djezzy, Ooredoo)
  const dzPhoneRegex = /^(0)(5|6|7)[0-9]{8}$/;
  if (!dzPhoneRegex.test(cleanPhone)) {
    score += 45;
    flags.push("Format numéro algérien non conforme (doit commencer par 05, 06 ou 07)");
  } else {
    // Détection de suites suspectes (ex: 0555555555 ou 0612345678)
    if (/(\d)\1{5,}/.test(cleanPhone)) {
      score += 40;
      flags.push("Numéro répétitif hautement suspect");
    }
  }

  // 2. Audit Adresse de livraison
  const cleanAddr = order.address.trim().toLowerCase();
  const suspiciousKeywords = ['centre ville', 'poste', 'en face', 'rond point', 'arret', 'alger', 'oran'];
  
  if (cleanAddr.length < 8) {
    score += 30;
    flags.push("Adresse excessivement courte ou imprécise");
  } else if (suspiciousKeywords.some(kw => cleanAddr === kw)) {
    score += 25;
    flags.push("Adresse générique sans détails d'habitation ou de repère précis");
  }

  // 3. Audit Nom Client
  if (order.customer_name.trim().length < 3 || !order.customer_name.includes(' ')) {
    score += 15;
    flags.push("Nom client incomplet (nom ou prénom manquant)");
  }

  // Normalisation du score entre 0 et 100
  const finalScore = Math.min(100, Math.max(0, score));

  let riskLevel: OrderRiskAssessment['risk_level'] = 'LOW';
  let recommendation: OrderRiskAssessment['recommendation'] = 'EXPEDIER';

  if (finalScore >= 65) {
    riskLevel = 'HIGH';
    recommendation = 'BLOQUER';
  } else if (finalScore >= 35) {
    riskLevel = 'MEDIUM';
    recommendation = 'CONFIRMATION_REQUISE';
  }

  return {
    order_id: order.id,
    customer_name: order.customer_name,
    phone: cleanPhone,
    wilaya: order.wilaya,
    address: order.address,
    risk_score: finalScore,
    risk_level: riskLevel,
    flags,
    recommendation
  };
}
