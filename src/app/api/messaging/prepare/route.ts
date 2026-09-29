import { NextRequest, NextResponse } from 'next/server';
import { TemplateEngine, MessageLanguage, OrderContext } from '../../../../modules/messaging/templateEngine';
import { z } from 'zod';

const PrepareSchema = z.object({
  customer_name: z.string().min(1),
  customer_phone: z.string().min(9),
  product_name: z.string().default('Article Commandé'),
  price_cents: z.number().int().positive(),
  wilaya: z.string().default('16 - Alger'),
  carrier_name: z.string().default('Yalidine'),
  store_name: z.string().optional(),
  language: z.enum(['DARIJA', 'FR', 'AR']).default('DARIJA')
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = PrepareSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Paramètres invalides', details: parsed.error.format() }, { status: 400 });
    }

    const { language, ...orderContext } = parsed.data;
    const generated = TemplateEngine.generate(orderContext as OrderContext, language as MessageLanguage);

    return NextResponse.json({
      success: true,
      language,
      ...generated
    }, { status: 200 });

  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Erreur messaging' }, { status: 500 });
  }
}
