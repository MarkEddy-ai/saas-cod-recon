import { NextRequest, NextResponse } from 'next/server';
import { evaluateOrderRisk } from '@/modules/risk/scorer';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const risk = evaluateOrderRisk({
      id: body.id || body.order_id || `CMD-${Date.now()}`,
      customer_name: body.customer_name || body.name || 'Client',
      phone: body.phone || body.customer_phone || '',
      wilaya: body.wilaya || '16 - Alger',
      address: body.address || body.delivery_address || ''
    });

    return NextResponse.json(risk, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Erreur evaluation risque' }, { status: 500 });
  }
}
