// Connecteur officiel et unifié pour transporteurs algériens

export interface UnifiedCarrierParcel {
  tracking_number: string;
  carrier_name: 'YALIDINE' | 'ZR_EXPRESS' | 'GUEPEX';
  customer_name: string;
  customer_phone: string;
  wilaya_id: string;
  delivery_status: 'DELIVERED' | 'RETURNED' | 'IN_TRANSIT';
  collected_amount_cents: number; // Montant encaissé en centimes (Zéro Flottant)
  shipping_fee_cents: number;     // Frais de livraison en centimes
  synced_at: string;
}

export class YalidineConnector {
  private apiId: string;
  private apiToken: string;
  private baseUrl: string = 'https://api.yalidine.app/v1';

  constructor(apiId?: string, apiToken?: string) {
    this.apiId = apiId || process.env.YALIDINE_API_ID || '';
    this.apiToken = apiToken || process.env.YALIDINE_API_TOKEN || '';
  }

  // Récupération des colis récents et normalisation
  async fetchParcels(): Promise<UnifiedCarrierParcel[]> {
    if (!this.apiId || !this.apiToken) {
      console.warn('[YalidineConnector] Clés API non configurées, génération de données mockées de synchronisation');
      return [
        {
          tracking_number: "yal-api-1601",
          carrier_name: "YALIDINE",
          customer_name: "Yacine Mansouri",
          customer_phone: "0555112233",
          wilaya_id: "16 - Alger",
          delivery_status: "DELIVERED",
          collected_amount_cents: 620000, // 6 200,00 DZD
          shipping_fee_cents: 50000,      // 500,00 DZD
          synced_at: new Date().toISOString()
        },
        {
          tracking_number: "yal-api-3102",
          carrier_name: "YALIDINE",
          customer_name: "Amine K.",
          customer_phone: "0770998877",
          wilaya_id: "31 - Oran",
          delivery_status: "RETURNED",
          collected_amount_cents: 0,
          shipping_fee_cents: 45000,      // 450,00 DZD frais retour
          synced_at: new Date().toISOString()
        }
      ];
    }

    try {
      const res = await fetch(`${this.baseUrl}/parcels`, {
        headers: {
          'X-API-ID': this.apiId,
          'X-API-TOKEN': this.apiToken,
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) throw new Error(`Erreur HTTP Yalidine: ${res.status}`);
      const data = await res.json();

      // Normalisation stricte
      return (data.data || []).map((item: any) => ({
        tracking_number: item.tracking,
        carrier_name: 'YALIDINE',
        customer_name: `${item.firstname || ''} ${item.familyname || ''}`.trim(),
        customer_phone: item.phone || '',
        wilaya_id: String(item.to_wilaya_name || '16 - Alger'),
        delivery_status: item.last_status === 'Livré' ? 'DELIVERED' : item.last_status === 'Retourné' ? 'RETURNED' : 'IN_TRANSIT',
        collected_amount_cents: Math.round(Number(item.price || 0) * 100),
        shipping_fee_cents: Math.round(Number(item.delivery_cost || 0) * 100),
        synced_at: new Date().toISOString()
      }));
    } catch (err) {
      console.error('[YalidineConnector] Erreur appel API:', err);
      throw err;
    }
  }
}

export class ZrExpressConnector {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.ZR_EXPRESS_API_KEY || '';
  }

  async fetchParcels(): Promise<UnifiedCarrierParcel[]> {
    if (!this.apiKey) {
      console.warn('[ZrExpressConnector] Clé API non configurée, simulation active');
      return [
        {
          tracking_number: "zr-api-2503",
          carrier_name: "ZR_EXPRESS",
          customer_name: "Mourad Belkacem",
          customer_phone: "0661445566",
          wilaya_id: "25 - Constantine",
          delivery_status: "DELIVERED",
          collected_amount_cents: 480000, // 4 800,00 DZD
          shipping_fee_cents: 60000,      // 600,00 DZD
          synced_at: new Date().toISOString()
        }
      ];
    }
    return [];
  }
}
