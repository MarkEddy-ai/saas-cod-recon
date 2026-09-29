import { NextRequest, NextResponse } from 'next/server';
import { YalidineConnector, ZrExpressConnector } from '../../../../modules/carriers/connectors';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const carrier = body.carrier || 'ALL';

    const results: any[] = [];

    if (carrier === 'ALL' || carrier === 'YALIDINE') {
      const yalidine = new YalidineConnector(body.yalidine_api_id, body.yalidine_api_token);
      const parcels = await yalidine.fetchParcels();
      results.push(...parcels);
    }

    if (carrier === 'ALL' || carrier === 'ZR_EXPRESS') {
      const zr = new ZrExpressConnector(body.zr_api_key);
      const parcels = await zr.fetchParcels();
      results.push(...parcels);
    }

    return NextResponse.json({
      success: true,
      message: `Synchronisation réussie : ${results.length} colis récupérés`,
      total: results.length,
      data: results
    }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error?.message || 'Erreur lors de la synchronisation transporteur'
    }, { status: 500 });
  }
}
