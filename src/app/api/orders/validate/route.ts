import { NextRequest, NextResponse } from 'next/server';
import { IpAbuseGuard } from '../../../../modules/security/ipGuard';
import { z } from 'zod';

const OrderCheckSchema = z.object({
  customer_phone: z.string().min(9),
  total_cents: z.number().int().positive(),
  item_count: z.number().int().positive().default(1),
  store_id: z.string().default('store_default')
});

export async function POST(req: NextRequest) {
  try {
    const clientIp = IpAbuseGuard.extractClientIp(req.headers);
    const body = await req.json();

    const validation = OrderCheckSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Données invalides', details: validation.error.format() }, { status: 400 });
    }

    const { customer_phone, total_cents, item_count, store_id } = validation.data;

    // Analyse anti-fraude et restriction IP
    const check = IpAbuseGuard.checkOrder({
      ip: clientIp,
      orderAmountCents: total_cents,
      totalQuantity: item_count,
      phone: customer_phone,
      storeId: store_id
    });

    if (!check.allowed) {
      return NextResponse.json({
        success: false,
        blocked: true,
        action: check.action,
        reason: check.reason,
        client_ip: clientIp
      }, { status: 429 }); // Trop de requêtes / Commande rejetée
    }

    return NextResponse.json({
      success: true,
      blocked: false,
      action: check.action,
      risk_score: check.riskScore,
      reason: check.reason || 'Commande validée',
      client_ip: clientIp
    }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erreur interne de vérification' }, { status: 500 });
  }
}
