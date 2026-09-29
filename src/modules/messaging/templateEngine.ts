// Moteur de génération de messages dynamiques COD Algérie

export type MessageLanguage = 'DARIJA' | 'FR' | 'AR';

export interface OrderContext {
  customer_name: string;
  customer_phone: string;
  product_name: string;
  price_cents: number;
  wilaya: string;
  carrier_name: string;
  tracking_number?: string;
  store_name?: string;
}

export class TemplateEngine {
  static formatDzd(cents: number): string {
    const val = (cents / 100).toFixed(2);
    return `${val.replace(/\B(?=(\d{3})+(?!\d))/g, " ")} DZD`;
  }

  // Nettoyage et formatage du numéro au standard WhatsApp international (+213)
  static normalizePhoneForWa(phone: string): string {
    const cleaned = phone.replace(/[^0-9]/g, '');
    if (cleaned.startsWith('213')) return cleaned;
    if (cleaned.startsWith('0')) return `213${cleaned.slice(1)}`;
    return `213${cleaned}`;
  }

  static generate(context: OrderContext, lang: MessageLanguage): { text: string; waUrl: string } {
    const store = context.store_name || 'Notre Boutique';
    const priceFormatted = this.formatDzd(context.price_cents);
    let text = '';

    switch (lang) {
      case 'DARIJA':
        text = `Salam ${context.customer_name} ! 🌸\n` +
          `Hadi la boutique ${store}. Rak dert commande ta3 (${context.product_name}) b soummat ${priceFormatted}.\n` +
          `Le colis rah wajed bach ykoun 3endek f ${context.wilaya} m3a ${context.carrier_name} fi 24h/48h inchallah.\n\n` +
          `3afak repondi 3la had l'message b "OUI" bach nvalidiw l'envoi lyoum. Saha ftourek/Yomak said !`;
        break;

      case 'FR':
        text = `Bonjour ${context.customer_name},\n` +
          `L'équipe ${store} vous remercie pour votre commande de (${context.product_name}) d'un montant de ${priceFormatted}.\n` +
          `Votre colis est prêt pour expédition vers ${context.wilaya} via notre partenaire logistique ${context.carrier_name}.\n\n` +
          `Merci de confirmer votre disponibilité pour la réception en répondant "OUI" à ce message.`;
        break;

      case 'AR':
        text = `السلام عليكم ورحمة الله، أخي/أختي ${context.customer_name} 🌿\n` +
          `نشكرك على ثقتك بمتجر ${store}. بخصوص طلبيتك (${context.product_name}) بمبلغ ${priceFormatted}.\n` +
          `الطرد جاهز الآن للتسليم في ولاية ${context.wilaya} عبر شركة الشحن ${context.carrier_name}.\n\n` +
          `يرجى تأكيد رغبتكم في الاستلام بالرد بكلمة "تأكيد" للبدء في الشحن الفوري.`;
        break;
    }

    const phoneWa = this.normalizePhoneForWa(context.customer_phone);
    const waUrl = `https://wa.me/${phoneWa}?text=${encodeURIComponent(text)}`;

    return { text, waUrl };
  }
}
