// Module de protection contre les commandes abusives et gestion des restrictions IP COD

export interface AbuseCheckParams {
  ip: string;
  orderAmountCents: number; // Montant en centimes
  totalQuantity: number;
  phone: string;
  storeId: string;
}

export interface AbuseCheckResult {
  allowed: boolean;
  action: 'ACCEPT' | 'FLAG_FOR_REVIEW' | 'BLOCK';
  reason?: string;
  riskScore: number; // de 0 (sûr) à 100 (frauduleux)
}

// Mémoire de suivi temporaire (In-Memory pour démo / connectable à Redis/Supabase en prod)
const ipHistory: Record<string, { count: number; firstSeen: number; blockedUntil?: number }> = {};
const blacklistedIps = new Set<string>();

export class IpAbuseGuard {
  // Limites paramétrables pour le e-commerce algérien
  private static MAX_ORDERS_WINDOW = 3; // Maximum 3 commandes
  private static WINDOW_TIME_MS = 10 * 60 * 1000; // Fenêtre de 10 minutes
  private static MAX_COD_AMOUNT_CENTS = 20000000; // 200 000 DZD max en COD direct
  private static MAX_ITEM_QUANTITY = 8; // Max 8 articles d'un coup

  static extractClientIp(reqHeaders: Headers): string {
    const forwarded = reqHeaders.get('x-forwarded-for');
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    return reqHeaders.get('x-real-ip') || '127.0.0.1';
  }

  static checkOrder(params: AbuseCheckParams): AbuseCheckResult {
    const now = Date.now();
    const { ip, orderAmountCents, totalQuantity } = params;

    // 1. Vérification liste noire manuelle
    if (blacklistedIps.has(ip)) {
      return {
        allowed: false,
        action: 'BLOCK',
        reason: 'Adresse IP bannie pour abus de commandes fictives.',
        riskScore: 100
      };
    }

    // 2. Vérification blocage temporaire actif
    const record = ipHistory[ip] || { count: 0, firstSeen: now };
    if (record.blockedUntil && record.blockedUntil > now) {
      return {
        allowed: false,
        action: 'BLOCK',
        reason: 'Trop de tentatives en un temps court. Veuillez patienter.',
        riskScore: 90
      };
    }

    // 3. Réinitialisation de la fenêtre de temps
    if (now - record.firstSeen > this.WINDOW_TIME_MS) {
      record.count = 0;
      record.firstSeen = now;
    }

    record.count += 1;
    ipHistory[ip] = record;

    // Règle A : Vélocité anormale (Spam de commandes)
    if (record.count > this.MAX_ORDERS_WINDOW) {
      record.blockedUntil = now + (30 * 60 * 1000); // Bannissement 30 minutes
      return {
        allowed: false,
        action: 'BLOCK',
        reason: 'Vélocité anormale : plus de 3 commandes soumises en moins de 10 minutes.',
        riskScore: 95
      };
    }

    // Règle B : Commande démesurée / Montant hallucinant
    if (orderAmountCents > this.MAX_COD_AMOUNT_CENTS) {
      return {
        allowed: true, // Laisser passer mais bloquer l'expédition automatique
        action: 'FLAG_FOR_REVIEW',
        reason: `Montant excessif (${(orderAmountCents / 100).toLocaleString('fr-FR')} DZD). Validation manuelle requise.`,
        riskScore: 75
      };
    }

    // Règle C : Quantités massives
    if (totalQuantity > this.MAX_ITEM_QUANTITY) {
      return {
        allowed: true,
        action: 'FLAG_FOR_REVIEW',
        reason: `Volume important (${totalQuantity} pièces). Risque élevé de refus au pas de porte.`,
        riskScore: 65
      };
    }

    return {
      allowed: true,
      action: 'ACCEPT',
      riskScore: 10
    };
  }

  // Permet au marchand d'ajouter une IP à la liste noire en 1 clic
  static addToBlacklist(ip: string) {
    blacklistedIps.add(ip);
  }

  static removeFromBlacklist(ip: string) {
    blacklistedIps.delete(ip);
  }
}
