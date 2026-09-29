import { NextRequest, NextResponse } from 'next/server';
import { IngestionQueueEngine } from '../../../../modules/queues/worker';
import { z } from 'zod';

const IngestRequestSchema = z.object({
  store_id: z.string().min(1),
  carrier: z.string().min(1),
  items: z.array(
    z.object({
      rawLine: z.object({
        tracking_number: z.string(),
        carrier_name: z.string(),
        collected_amount_cents: z.number().int(),
        shipping_fee_cents: z.number().int(),
        delivery_status: z.enum(['DELIVERED', 'RETURNED', 'IN_TRANSIT'])
      }),
      expectedCents: z.number().int()
    })
  ).min(1)
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = IngestRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Données invalides', details: parsed.error.format() }, { status: 400 });
    }

    const jobId = IngestionQueueEngine.enqueueBatchJob(
      parsed.data.store_id,
      parsed.data.carrier,
      parsed.data.items as any
    );

    return NextResponse.json(
      {
        message: 'Bordereau accepté pour traitement en tâche de fond',
        job_id: jobId,
        status: 'QUEUED',
        total_items: parsed.data.items.length
      },
      { status: 202 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Erreur serveur' }, { status: 500 });
  }
}
