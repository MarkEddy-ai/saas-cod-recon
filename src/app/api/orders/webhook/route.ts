import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // Vérification du Token Secret Marchand (Sécurité Anti-Spam)
    const secretHeader = req.headers.get('x-webhook-secret') || req.headers.get('authorization')?.replace('Bearer ', '');
    const validSecret = "recon_sec_live_dz2026"; // Clé secrète par défaut

    if (secretHeader && secretHeader !== validSecret) {
      return NextResponse.json({
        success: false,
        error: "Accès refusé : Jeton secret Webhook invalide ou non autorisé."
      }, { status: 401 });
    }

    const body = await req.json();

    // Extraction des données de commande
    const orderId = body.order_id || body.id || `CMD-${Date.now().toString().slice(-4)}`;
    const customerName = body.customer_name || body.name || "Client Inconnu";
    const phone = body.phone || body.phone_number || "";
    const ipAddress = body.ip || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || "105.101.42.18";

    // Détection VPN / IP hors Algérie
    const isVpn = body.is_vpn !== undefined ? Boolean(body.is_vpn) : (
      ipAddress.startsWith('185.') ||
      ipAddress.startsWith('45.') ||
      ipAddress.startsWith('194.') ||
      ipAddress.startsWith('104.') ||
      ipAddress.startsWith('198.')
    );

    // Contrôle du numéro DZ (05, 06, 07)
    const cleanPhone = phone.replace(/\s+/g, '');
    const isDzPhone = /^(00213|\+213|0)[567][0-9]{8}$/.test(cleanPhone);

    // Calcul du score de confiance
    let score = 95;
    if (isVpn) score -= 60;
    if (!isDzPhone) score -= 30;
    if (!customerName || customerName.length < 3) score -= 15;

    score = Math.max(5, Math.min(100, score));
    const status = score >= 70 ? 'APPROUVE' : score >= 40 ? 'SUSPECT' : 'BLOQUE';

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
      message: "Commande vérifiée et analysée par l'algorithme Anti-Fraude COD DZ",
      order: orderData
    }, { status: 200 });

  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.message || "Erreur interne lors du traitement"
    }, { status: 500 });
  }
}
