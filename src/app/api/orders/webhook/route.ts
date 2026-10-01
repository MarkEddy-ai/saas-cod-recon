import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const secretHeader = req.headers.get('x-webhook-secret') || req.headers.get('authorization')?.replace('Bearer ', '');
    const validSecret = "recon_sec_live_dz2026";

    if (secretHeader && secretHeader !== validSecret) {
      return NextResponse.json({
        success: false,
        error: "Accès refusé : Jeton secret Webhook invalide."
      }, { status: 401 });
    }

    const body = await req.json();

    // 1. Détection intelligente de la plateforme source
    let sourcePlatform: 'YouCan' | 'Shopify' | 'Ayor' | 'WooCommerce' = 'YouCan';
    let orderId = `CMD-${Math.floor(1000 + Math.random() * 9000)}`;
    let customerName = "Client Inconnu";
    let phone = "";
    let wilaya = "Alger (16)";
    let codAmountDzd = 4500;

    if (body.platform === 'ayor' || body.ayor_order_id) {
      // Format AYOR
      sourcePlatform = 'Ayor';
      orderId = body.ayor_order_id || body.order_number || `AYOR-${Date.now().toString().slice(-4)}`;
      customerName = body.customer?.full_name || body.name || "Client Ayor";
      phone = body.customer?.phone || body.phone || "";
      wilaya = body.shipping_address?.province || body.wilaya || "Blida (09)";
      codAmountDzd = parseFloat(body.total_price) || 5200;
    } else if (body.line_items || body.order_number || body.customer?.default_address) {
      // Format SHOPIFY
      sourcePlatform = 'Shopify';
      orderId = body.name || `SHOPIFY-#${body.order_number || Date.now().toString().slice(-4)}`;
      customerName = `${body.customer?.first_name || ''} ${body.customer?.last_name || ''}`.trim() || body.shipping_address?.name || "Client Shopify";
      phone = body.shipping_address?.phone || body.customer?.phone || body.phone || "";
      wilaya = body.shipping_address?.province || body.shipping_address?.city || "Oran (31)";
      codAmountDzd = parseFloat(body.total_price) || 6800;
    } else if (body.data?.order_id || body.data?.customer) {
      // Format YOUCAN
      sourcePlatform = 'YouCan';
      orderId = body.data?.order_id ? `YC-${body.data.order_id}` : `YC-${Date.now().toString().slice(-4)}`;
      customerName = `${body.data?.customer?.first_name || ''} ${body.data?.customer?.last_name || ''}`.trim() || "Client YouCan";
      phone = body.data?.customer?.phone || "";
      wilaya = body.data?.shipping_address?.state || "Tipaza (42)";
      codAmountDzd = parseFloat(body.data?.total) || 4500;
    } else {
      // Format générique / test
      orderId = body.order_id || `CMD-${Date.now().toString().slice(-4)}`;
      customerName = body.customer_name || body.name || "Client Direct";
      phone = body.phone || body.phone_number || "0550123456";
      wilaya = body.wilaya || "Alger (16)";
      codAmountDzd = parseFloat(body.cod_amount) || 3900;
    }

    // 2. Détection VPN / IP & Fraude
    const ipAddress = body.ip || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || "105.101.42.18";
    const isVpn = body.is_vpn !== undefined ? Boolean(body.is_vpn) : (
      ipAddress.startsWith('185.') ||
      ipAddress.startsWith('45.') ||
      ipAddress.startsWith('194.') ||
      ipAddress.startsWith('104.') ||
      ipAddress.startsWith('198.')
    );

    const cleanPhone = phone.replace(/\s+/g, '');
    const isDzPhone = /^(00213|\+213|0)[567][0-9]{8}$/.test(cleanPhone);

    let score = 95;
    if (isVpn) score -= 60;
    if (!isDzPhone) score -= 30;
    if (customerName.length < 3) score -= 15;
    score = Math.max(5, Math.min(100, score));

    const status = score >= 70 ? 'APPROUVE' : score >= 40 ? 'SUSPECT' : 'BLOQUE';

    // 3. Assignation transporteur et suivi CRM
    const carrier = Math.random() > 0.5 ? 'Yalidine Express' : 'ZR Express';
    const trackingNumber = carrier === 'Yalidine Express' 
      ? `yal_crm_${Math.floor(100000 + Math.random() * 900000)}` 
      : `zr_crm_${Math.floor(100000 + Math.random() * 900000)}`;

    const crmOrder = {
      orderId: String(orderId),
      sourcePlatform,
      customerName,
      phone: cleanPhone || "Numéro manquant",
      wilaya,
      codAmountDzd,
      carrier,
      trackingNumber,
      ipAddress,
      isVpn,
      score,
      status,
      deliveryStatus: status === 'BLOQUE' ? 'ANNULÉ_FRAUDE' : 'EN_ATTENTE_EXPEDITION',
      createdAt: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    };

    return NextResponse.json({
      success: true,
      message: `Commande ${orderId} reçue de ${sourcePlatform} et traitée par le CRM`,
      order: crmOrder
    }, { status: 200 });

  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.message || "Erreur de traitement webhook"
    }, { status: 500 });
  }
}
