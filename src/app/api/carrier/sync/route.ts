import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { updates } = await req.json();

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json({ success: false, error: "Liste de statuts vide ou invalide." }, { status: 400 });
    }

    let updatedCount = 0;

    for (const item of updates) {
      const tracking = item.tracking?.trim();
      const rawStatus = (item.status || '').toLowerCase();
      const chargedFee = parseFloat(item.chargedFee) || 0;
      const negotiatedFee = 250;

      let normalizedDeliveryStatus = 'EN_TRANSIT';

      if (rawStatus.includes('livr') || rawStatus.includes('encaiss')) {
        normalizedDeliveryStatus = 'LIVRÉ_ET_ENCAISSÉ';
      } else if (rawStatus.includes('retour') || rawStatus.includes('injoignable') || rawStatus.includes('refus')) {
        normalizedDeliveryStatus = chargedFee > negotiatedFee ? 'RETOUR_SURFACTURÉ' : 'RETOUR_CONFORME';
      } else if (rawStatus.includes('hub') || rawStatus.includes('centre') || rawStatus.includes('bloqu')) {
        normalizedDeliveryStatus = 'COLIS_BLOQUÉ_HUB';
      }

      const { data, error } = await supabase
        .from('crm_orders')
        .update({
          delivery_status: normalizedDeliveryStatus,
          updated_at: new Date().toISOString()
        })
        .ilike('tracking_number', `%${tracking}%`)
        .select();

      if (!error && data && data.length > 0) {
        updatedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `${updatedCount} commande(s) CRM synchronisée(s) avec succès.`,
      updatedCount
    }, { status: 200 });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || "Erreur de synchronisation" }, { status: 500 });
  }
}
