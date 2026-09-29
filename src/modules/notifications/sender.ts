export interface NotificationPayload {
  order_id: string;
  customer_name: string;
  phone: string;
  total_cents: number;
  item_name: string;
  carrier_name: string;
}

export interface GeneratedMessage {
  phone_e164: string;
  whatsapp_url: string;
  sms_body: string;
  whatsapp_body: string;
}

export class NotificationEngine {
  /**
   * Convertit un numéro local algérien (05/06/07) au format international E.164 (+213)
   */
  static formatToE164(phone: string): string {
    const cleaned = phone.replace(/\s+/g, '').replace(/[-.]/g, '');
    if (cleaned.startsWith('0')) {
      return `213${cleaned.substring(1)}`;
    }
    if (cleaned.startsWith('+213')) {
      return cleaned.substring(1);
    }
    if (cleaned.startsWith('213')) {
      return cleaned;
    }
    return `213${cleaned}`;
  }

  /**
   * Génère les templates de messages adaptés au marché algérien (Français / Arabe Darija)
   */
  static buildConfirmationMessages(payload: NotificationPayload): GeneratedMessage {
    const phoneInternational = this.formatToE164(payload.phone);
    const amountDzd = (payload.total_cents / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2 });

    // Modèle SMS concis
    const smsBody = `Bonjour ${payload.customer_name}, confirmation de votre commande #${payload.order_id} (${payload.item_name}) pour ${amountDzd} DZD. Expédition via ${payload.carrier_name}. Répondez OUI pour valider.`;

    // Modèle WhatsApp interactif
    const whatsappBody = `Salam ${payload.customer_name} 👋\n\nMerci pour votre commande chez nous !\n\n📦 *Détails de la commande :*\n- Réf : *#${payload.order_id}*\n- Produit : ${payload.item_name}\n- Montant à payer à la livraison : *${amountDzd} DZD*\n- Société de livraison : *${payload.carrier_name}*\n\nPour confirmer l'envoi de votre colis dès aujourd'hui, merci de répondre par *OUI* à ce message.`;

    const encodedText = encodeURIComponent(whatsappBody);
    const whatsappUrl = `https://wa.me/${phoneInternational}?text=${encodedText}`;

    return {
      phone_e164: phoneInternational,
      whatsapp_url: whatsappUrl,
      sms_body: smsBody,
      whatsapp_body: whatsappBody
    };
  }
}
