import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Récupération des données transmises par la boutique
    const orderId = body.order_id || body.id || `CMD-${Date.now().toString().slice(-4)}`;
    const customerName = body.customer_name || body.name || "Client Inconnu";
    const phone = body.phone || body.phone_number || "";
    const ipAddress = body.ip || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || "105.101.42.18";
    
    // Algorithme d'analyse IP & VPN
    // Détection d'IP hors Algérie ou de plages d'hébergeurs/VPN connus
    const isVpn = body.is_vpn !== undefined ? Boolean(body.is_vpn) : (
      ipAddress.startsWith('185.') || 
      ipAddress.startsWith('45.') || 
      ipAddress.startsWith('194.') ||
      ipAddress.startsWith('104.') ||
      ipAddress.startsWith('198.')
    );

    // Analyse du numéro de téléphone DZ (05, 06, 07 suivi de 8 chiffres)
    const cleanPhone = phone.replace(/\s+/g, '');
    const isDzPhone = /^(00213|\+213|0)[567][0-9]{8}$/.test(cleanPhone);

    // Calcul du score de confiance
    let score = 95;
    if (isVpn) score -= 60;
    if (!isDzPhone) score -= 30;
    if (!customerName || customerName.length < 3) score -= 15;

    score = Math.max(5, Math.min(100, score));

    const status = score >= 75 ? 'APPROUVE' : score >= 45 ? 'SUSPECT' : 'BLOQUE';

    const orderData = {
      orderId: String(orderId),
      customerName,
      phone: cleanPhone,
      ipAddress,
      isVpn,
      score,
      status,
      receivedAt: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      message: "Commande analysée avec succès par le filtre Anti-Fraude COD DZ",
      order: orderData
    }, { status: 200 });

  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.message || "Erreur interne de traitement"
    }, { status: 500 });
  }
}
