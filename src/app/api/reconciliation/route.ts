import { NextRequest, NextResponse } from 'next/server';
import { reconcileCarrierLine } from '../../../modules/reconciliation/matcher';
import { CarrierCsvLineSchema } from '../../../contracts/schemas';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = CarrierCsvLineSchema.safeParse(body.carrierLine);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Format invalide', details: parsed.error }, { status: 400 });
    }

    const result = reconcileCarrierLine(body.expectedCents, parsed.data);
    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
