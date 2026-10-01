'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface BuyerReputation {
  id: string;
  phone_number: string;
  total_orders: number;
  delivered_orders: number;
  rto_orders: number;
  trust_score: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'BLACKLISTED';
  last_return_reason?: string;
  wilaya_code?: string;
}

interface WilayaProfitability {
  code: string;
  name: string;
  totalShipped: number;
  deliveredCount: number;
  rtoCount: number;
  deliveredRate: number;
  grossSalesDzd: number;
  deliveryFeesDzd: number;
  rtoLossDzd: number;
  netMarginDzd: number;
  recommendation: 'SCALE_ADS' | 'HEALTHY' | 'REQUIRE_DEPOSIT' | 'EXCLUDE_ADS';
}

interface GhostParcel {
  tracking: string;
  carrier: string;
  customerName: string;
  wilaya: string;
  hubLocation: string;
  daysStuck: number;
  codAmountDzd: number;
  status: 'IMMOBILISE' | 'RECLAMATION_ENVOYEE';
}

interface RtoAuditRow {
  tracking: string;
  carrier: string;
  customerName: string;
  wilaya: string;
  returnReason: string;
  negotiatedReturnFee: number;
  chargedReturnFee: number;
  overchargedFee: number;
  callLogVerified: boolean;
  status: 'OVERCHARGED' | 'CONFORME';
}

interface DisputeItem {
  id: string;
  tracking: string;
  carrier: string;
  customerName: string;
  amountClaimedDzd: number;
  issue: string;
  status: 'OUVERT' | 'EN_COURS' | 'REMBOURSE';
  dateAdded: string;
}

interface OrderFraudItem {
  id?: string;
  orderId: string;
  sourcePlatform?: 'YouCan' | 'Shopify' | 'Ayor' | 'WooCommerce';
  customerName: string;
  phone: string;
  wilaya?: string;
  codAmountDzd?: number;
  carrier?: string;
  trackingNumber?: string;
  ipAddress: string;
  isVpn: boolean;
  score: number;
  status: 'APPROUVE' | 'SUSPECT' | 'BLOQUE';
  deliveryStatus?: string;
  createdAt?: string;
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<
    'import_csv' | 'orders_fraud' | 'wilayas' | 'ghosts' | 'rto_audit' | 'dispute' | 'blacklist' | 'billing' | 'connectors' | 'api_settings' | 'contact'
  >('orders_fraud');

  const [copySuccess, setCopySuccess] = useState(false);
  const [copyEmailSuccess, setCopyEmailSuccess] = useState(false);
  const [copySecretSuccess, setCopySecretSuccess] = useState(false);

  // COORDONNÉES OFFICIELLES
  const corporateBillingEntity = "COD Reconciliation DZ — Service Comptabilité & Licences";
  const billingRip = "00799999000232882074";
  const supportWhatsAppDisplay = "0699 00 00 82";
  const supportWhatsAppNumber = "213699000082";
  const supportEmail = "weekyfy@gmail.com";
  const webhookSecretToken = "recon_sec_live_dz2026";

  // CYCLE DE VIE LICENCE
  const [subscriptionDaysLeft, setSubscriptionDaysLeft] = useState<number>(18);
  const [isSubscriptionLocked, setIsSubscriptionLocked] = useState<boolean>(false);
  const [showOneDayWarning, setShowOneDayWarning] = useState<boolean>(false);

  useEffect(() => {
    if (subscriptionDaysLeft <= 0) {
      setIsSubscriptionLocked(true);
      setShowOneDayWarning(false);
    } else if (subscriptionDaysLeft === 1) {
      setIsSubscriptionLocked(false);
      setShowOneDayWarning(true);
    } else {
      setIsSubscriptionLocked(false);
      setShowOneDayWarning(false);
    }
  }, [subscriptionDaysLeft]);

  // TARIFS
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'business' | 'ultra'>('business');

  const plans = {
    free: { name: "Pack Découverte (Free)", monthlyDzd: 0, monthlyUsd: 0 },
    business: { name: "Pack Business", monthlyDzd: 2000, monthlyUsd: 15 },
    ultra: { name: "Pack Ultra Illimité", monthlyDzd: 4500, monthlyUsd: 30 }
  };

  const getPrice = (planKey: 'free' | 'business' | 'ultra') => {
    const p = plans[planKey];
    if (billingCycle === 'monthly') {
      return { 
        dzd: p.monthlyDzd, 
        usd: p.monthlyUsd, 
        periodText: '/ mois',
        detailText: 'Facturation mensuelle sans engagement (30 jours)'
      };
    } else {
      const yearlyDzd = p.monthlyDzd === 0 ? 0 : Math.round(p.monthlyDzd * 12 * 0.9);
      const yearlyUsd = p.monthlyUsd === 0 ? 0 : Math.round(p.monthlyUsd * 12 * 0.9);
      return {
        dzd: yearlyDzd,
        usd: yearlyUsd,
        periodText: '/ an (-10%)',
        detailText: `Règlement annuel avec 10% d'économie (${yearlyDzd.toLocaleString()} DZD)`
      };
    }
  };

  const handleCopyRip = () => {
    navigator.clipboard.writeText(billingRip);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 3000);
  };

  const handleCopySecret = () => {
    navigator.clipboard.writeText(webhookSecretToken);
    setCopySecretSuccess(true);
    setTimeout(() => setCopySecretSuccess(false), 3000);
  };

  const handleOpenEmail = () => {
    const subject = `Preuve de virement BaridiMob - ${plans[selectedPlan].name}`;
    const body = `Bonjour,\n\nJe viens d'effectuer le virement BaridiMob de ${getPrice(selectedPlan).dzd.toLocaleString()} DZD pour activer le ${plans[selectedPlan].name}.\nVeuillez trouver ma quittance en pièce jointe.`;
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${supportEmail}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(gmailUrl, '_blank');
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(supportEmail);
    setCopyEmailSuccess(true);
    setTimeout(() => setCopyEmailSuccess(false), 3000);
  };

  // CSV EN MÉMOIRE (DIRECT SANS DISQUE)
  const downloadSampleYalidine = () => {
    const csvContent =
      "Tracking,Destinataire,Wilaya,Frais_Preleves_DZD,Statut_Livraison\n" +
      "yal_crm_965374,Tarek Brahimi,Blida (09),250,Livre\n" +
      "yal_crm_476503,Abderrahmane Ziani,Boumerdes (35),550,Retour Client Injoignable\n" +
      "yal_crm_400429,Tarek Brahimi,Blida (09),250,Livre\n" +
      "yal_live_109841,Karim Benali,Alger (16),250,Livre\n" +
      "yal_live_109842,Amine Khelifi,Boumerdes (35),550,Retour Client Injoignable\n";

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'yalidine_quittance_reelle_demo.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadSampleZR = () => {
    const csvContent =
      "Tracking,Destinataire,Wilaya,Frais_Preleves_DZD,Statut_Livraison\n" +
      "zr_crm_740781,Selma Benali,Alger (16),250,Colis Livre Encaissé\n" +
      "zr_live_33491,Farid Khelifa,Constantine (25),250,Colis Livre Encaissé\n" +
      "zr_exp_99282,Mohamed Larbi,Biskra (07),750,Retour Client Absent\n";

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'zr_express_quittance_reelle_demo.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // UPLOAD REÇU BARIDIMOB
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const [receiptUploadSuccess, setReceiptUploadSuccess] = useState<string | null>(null);
  const [receiptUploadError, setReceiptUploadError] = useState<string | null>(null);

  const handleReceiptUpload = async (file: File) => {
    setIsUploadingReceipt(true);
    setReceiptUploadSuccess(null);
    setReceiptUploadError(null);

    try {
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `recu_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('baridimob-receipts')
        .upload(fileName, file, { contentType: file.type || 'image/jpeg', upsert: false });

      if (uploadError) throw new Error(uploadError.message);

      const { data: { publicUrl } } = supabase.storage
        .from('baridimob-receipts')
        .getPublicUrl(fileName);

      const currentPriceObj = getPrice(selectedPlan);
      const { error: dbError } = await supabase
        .from('payment_receipts')
        .insert([
          {
            receipt_url: publicUrl,
            amount_dzd: currentPriceObj.dzd,
            plan_selected: `${selectedPlan}_${billingCycle}`,
            status: 'PENDING'
          }
        ]);

      if (dbError) throw new Error(dbError.message);
      setReceiptUploadSuccess("✓ Reçu BaridiMob transmis avec succès ! Licence validée sous 15 minutes.");
    } catch (err: any) {
      setReceiptUploadError(`Erreur : ${err.message || 'Impossible de joindre Supabase'}`);
    } finally {
      setIsUploadingReceipt(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  // ÉTAT DU CRM AVEC PERSISTANCE SUPABASE & SYNCHRONISATION
  const [crmOrders, setCrmOrders] = useState<OrderFraudItem[]>([]);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);

  // CHARGEMENT AUTOMATIQUE INITIAL DEPUIS SUPABASE
  const fetchCrmFromSupabase = async () => {
    try {
      const { data, error } = await supabase
        .from('crm_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data && data.length > 0) {
        const mapped: OrderFraudItem[] = data.map(d => ({
          id: d.id,
          orderId: d.order_id,
          sourcePlatform: d.source_platform as any,
          customerName: d.customer_name,
          phone: d.phone,
          wilaya: d.wilaya,
          codAmountDzd: Number(d.cod_amount_dzd),
          carrier: d.carrier,
          trackingNumber: d.tracking_number,
          ipAddress: d.ip_address,
          isVpn: d.is_vpn,
          score: d.trust_score,
          status: d.fraud_status as any,
          deliveryStatus: d.delivery_status,
          createdAt: new Date(d.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
        }));
        setCrmOrders(mapped);
      } else {
        // Jeu de démarrage si la base est vierge
        setCrmOrders([
          { orderId: "AYOR-2177", sourcePlatform: "Ayor", customerName: "Abderrahmane Ziani", phone: "0771239845", wilaya: "Boumerdès (35)", codAmountDzd: 6400, carrier: "Yalidine Express", trackingNumber: "yal_crm_476503", ipAddress: "105.105.88.22", isVpn: false, score: 95, status: "APPROUVE", deliveryStatus: "EN_ATTENTE_EXPEDITION", createdAt: "10:14" },
          { orderId: "YC-5620", sourcePlatform: "YouCan", customerName: "Tarek Brahimi", phone: "0661998877", wilaya: "Blida (09)", codAmountDzd: 4500, carrier: "Yalidine Express", trackingNumber: "yal_crm_965374", ipAddress: "105.102.14.99", isVpn: false, score: 95, status: "APPROUVE", deliveryStatus: "EN_ATTENTE_EXPEDITION", createdAt: "10:05" },
          { orderId: "SHOPIFY-#1099", sourcePlatform: "Shopify", customerName: "Selma Benali", phone: "0550482914", wilaya: "Alger (16)", codAmountDzd: 8900, carrier: "ZR Express", trackingNumber: "zr_crm_740781", ipAddress: "105.101.42.18", isVpn: false, score: 95, status: "APPROUVE", deliveryStatus: "EN_ATTENTE_EXPEDITION", createdAt: "09:50" }
        ]);
      }
    } catch (err) {
      console.log("Supabase crm_orders connect error:", err);
    }
  };

  useEffect(() => {
    fetchCrmFromSupabase();
  }, []);

  // MOTEUR D'AUDIT QUITTANCE CSV AVEC SYNCHRONISATION AUTOMATIQUE CRM
  const csvFileRef = useRef<HTMLInputElement>(null);
  const [csvFileName, setCsvFileName] = useState<string | null>(null);
  const [isAuditingCsv, setIsAuditingCsv] = useState(false);

  const [rtoAudits, setRtoAudits] = useState<RtoAuditRow[]>([
    { tracking: "yal_ret_104821", carrier: "Yalidine Express", customerName: "Destinataire #1048", wilaya: "Boumerdès (35)", returnReason: "Client Injoignable", negotiatedReturnFee: 200, chargedReturnFee: 550, overchargedFee: 350, callLogVerified: false, status: "OVERCHARGED" },
    { tracking: "zr_ret_992144", carrier: "ZR Express", customerName: "Destinataire #9921", wilaya: "Tizi Ouzou (15)", returnReason: "Adresse Incomplète", negotiatedReturnFee: 250, chargedReturnFee: 600, overchargedFee: 350, callLogVerified: false, status: "OVERCHARGED" }
  ]);

  const [auditStats, setAuditStats] = useState({
    totalRows: 2,
    overchargedCount: 2,
    totalOverchargedDzd: 700,
    totalRecoverableDzd: 700
  });

  const handleProcessCsv = (file: File) => {
    setCsvFileName(file.name);
    setIsAuditingCsv(true);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim() !== '');
      
      const newAudits: RtoAuditRow[] = [];
      let totalOvercharged = 0;
      let overchargedCount = 0;
      let matchedCount = 0;

      const quittanceRows: { tracking: string; status: string; customer: string }[] = [];

      lines.slice(1).forEach((line, idx) => {
        const cols = line.split(/[,;\t]/);
        if (cols.length >= 3) {
          const tracking = cols[0]?.trim() || `dz_track_${idx + 1000}`;
          const customer = cols[1]?.trim() || `Client #${idx + 1}`;
          const statusLivraison = cols[4]?.trim() || (idx % 2 === 0 ? "Livre" : "Retour Injoignable");
          const charged = parseFloat(cols[3]?.replace(/[^\d.-]/g, '')) || 250;
          const negotiated = 250;
          const diff = Math.max(0, charged - negotiated);

          if (diff > 0) {
            totalOvercharged += diff;
            overchargedCount++;
          }

          quittanceRows.push({ tracking, status: statusLivraison, customer });

          newAudits.push({
            tracking,
            carrier: file.name.toLowerCase().includes('zr') ? 'ZR Express' : 'Yalidine Express',
            customerName: customer,
            wilaya: cols[2]?.trim() || "Alger (16)",
            returnReason: diff > 0 ? "Faux échec / Injoignable" : "Retour Conforme",
            negotiatedReturnFee: negotiated,
            chargedReturnFee: charged,
            overchargedFee: diff,
            callLogVerified: diff === 0,
            status: diff > 0 ? 'OVERCHARGED' : 'CONFORME'
          });
        }
      });

      // RAPPROCHEMENT & SYNCHRONISATION INSTANTANÉE AVEC LE CRM
      setCrmOrders(prev => {
        return prev.map(ord => {
          const match = quittanceRows.find(q => 
            (ord.trackingNumber && q.tracking.toLowerCase().includes(ord.trackingNumber.toLowerCase())) ||
            (ord.customerName && q.customer.toLowerCase().includes(ord.customerName.toLowerCase()))
          );

          if (match) {
            matchedCount++;
            const isDelivered = match.status.toLowerCase().includes('livr') || match.status.toLowerCase().includes('encaiss');
            const newDeliveryStatus = isDelivered ? 'LIVRÉ_ET_ENCAISSÉ' : 'RETOUR_SURFACTURÉ';

            // Mise à jour en base de données Supabase si ID présent
            if (ord.id) {
              supabase
                .from('crm_orders')
                .update({ delivery_status: newDeliveryStatus, updated_at: new Date().toISOString() })
                .eq('id', ord.id)
                .then();
            }

            return {
              ...ord,
              deliveryStatus: newDeliveryStatus
            };
          }
          return ord;
        });
      });

      setTimeout(() => {
        if (newAudits.length > 0) {
          setRtoAudits(newAudits);
          setAuditStats({
            totalRows: newAudits.length,
            overchargedCount,
            totalOverchargedDzd: totalOvercharged,
            totalRecoverableDzd: totalOvercharged
          });
        }
        setIsAuditingCsv(false);
        setSyncStatusMsg(`✓ Quittance auditée avec succès ! ${matchedCount} commandes CRM ont été automatiquement synchronisées (Passage en "LIVRÉ ET ENCAISSÉ").`);
      }, 700);
    };

    reader.readAsText(file);
  };

  const handleSimulateCrmOrder = async (platform: 'YouCan' | 'Shopify' | 'Ayor') => {
    let payload = {};

    if (platform === 'Ayor') {
      payload = {
        platform: "ayor",
        ayor_order_id: `AYOR-${Math.floor(1000 + Math.random() * 9000)}`,
        name: "Abderrahmane Ziani",
        phone: "0771239845",
        wilaya: "Boumerdès (35)",
        total_price: 6400,
        ip: "105.105.88.22",
        is_vpn: false
      };
    } else if (platform === 'Shopify') {
      payload = {
        order_number: Math.floor(1000 + Math.random() * 9000),
        name: `#${Math.floor(1000 + Math.random() * 9000)}`,
        shipping_address: {
          name: "Selma Benali",
          phone: "0550482914",
          province: "Alger (16)"
        },
        total_price: 8900,
        ip: "105.101.42.18",
        is_vpn: false
      };
    } else {
      payload = {
        data: {
          order_id: Math.floor(1000 + Math.random() * 9000),
          customer: { first_name: "Tarek", last_name: "Brahimi", phone: "0661998877" },
          shipping_address: { state: "Blida (09)" },
          total: 4500
        },
        ip: "105.102.14.99",
        is_vpn: false
      };
    }

    try {
      const res = await fetch('/api/orders/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-secret': webhookSecretToken
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success && data.order) {
        setCrmOrders(prev => [data.order, ...prev]);
        alert(`✓ Commande ${data.order.orderId} reçue de ${platform}, persistée dans Supabase et ajoutée au CRM !`);
      } else {
        alert(data.error || "Erreur webhook");
      }
    } catch (e) {
      alert("Erreur communication webhook");
    }
  };

  const exportDisputeCsv = () => {
    const overchargedRows = rtoAudits.filter(r => r.overchargedFee > 0);
    const headers = "Tracking;Transporteur;Client;Wilaya;Motif;Tarif_Convenu_DZD;Tarif_Preleve_DZD;Trop_Percu_Reclame_DZD\n";
    const body = overchargedRows.map(r => 
      `${r.tracking};${r.carrier};${r.customerName};${r.wilaya};${r.returnReason};${r.negotiatedReturnFee};${r.chargedReturnFee};${r.overchargedFee}`
    ).join('\n');

    const blob = new Blob([headers + body], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `bordereau_reclamation_litiges_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // WILAYAS
  const [wilayaFilter, setWilayaFilter] = useState<'ALL' | 'SCALE' | 'EXCLUDE'>('ALL');
  const wilayaStats: WilayaProfitability[] = [
    { code: "16", name: "Alger", totalShipped: 185, deliveredCount: 168, rtoCount: 17, deliveredRate: 90.8, grossSalesDzd: 890000, deliveryFeesDzd: 67200, rtoLossDzd: 6800, netMarginDzd: 384000, recommendation: "SCALE_ADS" },
    { code: "09", name: "Blida", totalShipped: 94, deliveredCount: 82, rtoCount: 12, deliveredRate: 87.2, grossSalesDzd: 420000, deliveryFeesDzd: 32800, rtoLossDzd: 4800, netMarginDzd: 182000, recommendation: "SCALE_ADS" },
    { code: "42", name: "Tipaza", totalShipped: 80, deliveredCount: 71, rtoCount: 9, deliveredRate: 88.7, grossSalesDzd: 360000, deliveryFeesDzd: 28400, rtoLossDzd: 3600, netMarginDzd: 154000, recommendation: "SCALE_ADS" },
    { code: "31", name: "Oran", totalShipped: 142, deliveredCount: 120, rtoCount: 22, deliveredRate: 84.5, grossSalesDzd: 640000, deliveryFeesDzd: 54000, rtoLossDzd: 9900, netMarginDzd: 260000, recommendation: "HEALTHY" },
    { code: "25", name: "Constantine", totalShipped: 88, deliveredCount: 71, rtoCount: 17, deliveredRate: 80.6, grossSalesDzd: 395000, deliveryFeesDzd: 35500, rtoLossDzd: 7650, netMarginDzd: 142000, recommendation: "HEALTHY" },
    { code: "19", name: "Sétif", totalShipped: 105, deliveredCount: 72, rtoCount: 33, deliveredRate: 68.5, grossSalesDzd: 410000, deliveryFeesDzd: 36000, rtoLossDzd: 14850, netMarginDzd: 58000, recommendation: "REQUIRE_DEPOSIT" },
    { code: "39", name: "El Oued", totalShipped: 52, deliveredCount: 21, rtoCount: 31, deliveredRate: 40.3, grossSalesDzd: 115000, deliveryFeesDzd: 16800, rtoLossDzd: 21700, netMarginDzd: -18500, recommendation: "EXCLUDE_ADS" },
    { code: "47", name: "Ghardaïa", totalShipped: 38, deliveredCount: 16, rtoCount: 22, deliveredRate: 42.1, grossSalesDzd: 89000, deliveryFeesDzd: 12800, rtoLossDzd: 15400, netMarginDzd: -9200, recommendation: "EXCLUDE_ADS" }
  ];

  const filteredWilayas = wilayaStats.filter(w => {
    if (wilayaFilter === 'SCALE') return w.recommendation === 'SCALE_ADS';
    if (wilayaFilter === 'EXCLUDE') return w.recommendation === 'EXCLUDE_ADS';
    return true;
  });

  // GHOSTS & LITIGES
  const [ghostParcels, setGhostParcels] = useState<GhostParcel[]>([
    { tracking: "yal_dz_9981023", carrier: "Yalidine Express", customerName: "Boutique Sud Tech", wilaya: "Ghardaïa (47)", hubLocation: "Hub Régional Ghardaïa", daysStuck: 12, codAmountDzd: 18500, status: "IMMOBILISE" },
    { tracking: "zr_hub_441092", carrier: "ZR Express", customerName: "Client Biskra", wilaya: "Biskra (07)", hubLocation: "Centre de Tri Biskra", daysStuck: 9, codAmountDzd: 7400, status: "IMMOBILISE" }
  ]);

  const [disputes, setDisputes] = useState<DisputeItem[]>([
    { id: "LIT-2026-001", tracking: "yal_ret_104821", carrier: "Yalidine Express", customerName: "Destinataire Boumerdès (35)", amountClaimedDzd: 350, issue: "Surfacturation retour non conforme", status: "EN_COURS", dateAdded: "28/09/2026" }
  ]);

  const [claimNotification, setClaimNotification] = useState<string | null>(null);

  const handleClaimGhost = (parcel: GhostParcel) => {
    setGhostParcels(prev =>
      prev.map(g => g.tracking === parcel.tracking ? { ...g, status: 'RECLAMATION_ENVOYEE' } : g)
    );

    const newDispute: DisputeItem = {
      id: `LIT-2026-${Math.floor(100 + Math.random() * 900)}`,
      tracking: parcel.tracking,
      carrier: parcel.carrier,
      customerName: `${parcel.customerName} (${parcel.wilaya})`,
      amountClaimedDzd: parcel.codAmountDzd,
      issue: `Colis immobilisé ${parcel.daysStuck} jours au ${parcel.hubLocation} (Réclamation Perte)`,
      status: 'OUVERT',
      dateAdded: new Date().toLocaleDateString('fr-FR')
    };

    setDisputes(prev => [newDispute, ...prev]);
    setClaimNotification(`✓ Dossier officiel de réclamation ouvert pour le colis ${parcel.tracking} !`);
    setTimeout(() => setClaimNotification(null), 4000);
  };

  // SCORE ACHETEUR
  const [searchPhone, setSearchPhone] = useState('');
  const [searchResult, setSearchResult] = useState<BuyerReputation | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearchingPhone, setIsSearchingPhone] = useState(false);

  const handleSearchBuyer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchPhone.trim()) return;
    setIsSearchingPhone(true);
    setHasSearched(true);
    setSearchResult(null);

    try {
      const cleanPhone = searchPhone.trim().replace(/\s+/g, '');
      const { data, error } = await supabase
        .from('buyer_reputation')
        .select('*')
        .eq('phone_number', cleanPhone)
        .maybeSingle();

      if (error) throw error;
      setSearchResult(data || null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearchingPhone(false);
    }
  };

  const deliveredTotalDzd = crmOrders
    .filter(o => o.deliveryStatus === 'LIVRÉ_ET_ENCAISSÉ')
    .reduce((acc, curr) => acc + (curr.codAmountDzd || 0), 0);

  const pendingTotalDzd = crmOrders
    .filter(o => o.deliveryStatus !== 'LIVRÉ_ET_ENCAISSÉ' && o.status === 'APPROUVE')
    .reduce((acc, curr) => acc + (curr.codAmountDzd || 0), 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans">
      <aside className="w-72 border-r border-slate-800 bg-slate-900/80 p-5 flex flex-col justify-between hidden md:flex shrink-0">
        <div className="space-y-6">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center font-black text-slate-950 text-base shadow-lg shadow-emerald-500/20">
              COD
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-white block">Reconciliation DZ</span>
              <span className="text-[10px] text-emerald-400 font-semibold tracking-wider uppercase">Espace Marchand</span>
            </div>
          </div>

          <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1.5">
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-slate-400 font-medium">Statut Licence :</span>
              <span className={`font-bold ${isSubscriptionLocked ? 'text-rose-400' : 'text-emerald-400'}`}>
                {isSubscriptionLocked ? 'Expiré (Bloqué)' : 'Actif (Pack Business)'}
              </span>
            </div>
            <div className="text-[10px] text-slate-400">
              {isSubscriptionLocked ? 'Accès suspendu' : `Valide encore ${subscriptionDaysLeft} jours`}
            </div>
          </div>

          <Link
            href="/guide"
            className="block p-3 rounded-xl bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/30 hover:border-emerald-400 transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">📖 Guide & Annuaire Valeur</span>
              <span className="text-[10px] bg-emerald-500 text-slate-950 font-bold px-1.5 py-0.5 rounded">WIKI</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Comprendre comment récupérer vos marges perdues.</p>
          </Link>

          <nav className="space-y-1 text-xs">
            <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Moteur d'Audit & P&L</div>

            <button
              onClick={() => setActiveTab('import_csv')}
              className={`w-full text-left px-3 py-2.5 rounded-xl font-semibold transition flex items-center justify-between ${
                activeTab === 'import_csv' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center gap-2">📁 Import Quittances (CSV/Excel)</span>
              <span className="px-2 py-0.5 text-[10px] bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-full font-bold">
                {auditStats.overchargedCount > 0 ? `${auditStats.overchargedCount} Litiges` : `${auditStats.totalRows} Colis`}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('orders_fraud')}
              className={`w-full text-left px-3 py-2.5 rounded-xl font-semibold transition flex items-center justify-between ${
                activeTab === 'orders_fraud' ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center gap-2">⚡ CRM Commandes & Rapprochement</span>
              <span className="px-1.5 py-0.5 text-[9px] bg-indigo-500 text-white rounded font-bold">
                {crmOrders.length} Commandes
              </span>
            </button>

            <button
              onClick={() => setActiveTab('wilayas')}
              className={`w-full text-left px-3 py-2.5 rounded-xl font-semibold transition flex items-center justify-between ${
                activeTab === 'wilayas' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center gap-2">🗺️️ Rentabilité & Meta Ads</span>
              <span className="px-1.5 py-0.5 text-[9px] bg-indigo-500/20 text-indigo-300 rounded font-bold">P&L</span>
            </button>

            <button
              onClick={() => setActiveTab('ghosts')}
              className={`w-full text-left px-3 py-2.5 rounded-xl font-semibold transition flex items-center justify-between ${
                activeTab === 'ghosts' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center gap-2">🚨 Colis Bloqués en Hubs</span>
              <span className="w-5 h-5 rounded-full bg-amber-500/30 text-amber-300 text-[10px] flex items-center justify-center font-bold">
                {ghostParcels.filter(g => g.status === 'IMMOBILISE').length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('dispute')}
              className={`w-full text-left px-3 py-2.5 rounded-xl font-semibold transition flex items-center justify-between ${
                activeTab === 'dispute' ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center gap-2">⚖️ Dossiers de Litiges</span>
              <span className="w-5 h-5 rounded-full bg-rose-500/30 text-rose-300 text-[10px] flex items-center justify-center font-bold">
                {disputes.length}
              </span>
            </button>

            <div className="pt-3 px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sécurité & Trésorerie</div>

            <button
              onClick={() => setActiveTab('blacklist')}
              className={`w-full text-left px-3 py-2.5 rounded-xl font-semibold transition flex items-center justify-between ${
                activeTab === 'blacklist' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center gap-2">🛡️ Score Acheteur Anti-RTO</span>
              <span className="px-1.5 py-0.5 text-[9px] bg-amber-500/20 text-amber-300 rounded font-bold">DZ</span>
            </button>

            <button
              onClick={() => setActiveTab('billing')}
              className={`w-full text-left px-3 py-2.5 rounded-xl font-semibold transition flex items-center justify-between ${
                activeTab === 'billing' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center gap-2">💳 Forfaits & Règlements</span>
              <span className="px-1.5 py-0.5 text-[9px] bg-emerald-500/20 text-emerald-300 rounded font-bold">BaridiMob</span>
            </button>

            <button
              onClick={() => setActiveTab('api_settings')}
              className={`w-full text-left px-3 py-2.5 rounded-xl font-semibold transition flex items-center justify-between ${
                activeTab === 'api_settings' ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center gap-2">🔌 Shopify / YouCan / Ayor</span>
              <span className="px-1.5 py-0.5 text-[9px] bg-cyan-500 text-slate-950 font-bold rounded">CRM</span>
            </button>
          </nav>
        </div>

        <div className="border-t border-slate-800 pt-4 space-y-1">
          <div className="text-[11px] text-slate-400">Entité de facturation :</div>
          <div className="text-xs font-bold text-white tracking-wide">COD Reconciliation DZ</div>
          <div className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Passerelle BaridiMob Certifiée
          </div>
          <div className="pt-2 flex justify-between items-center">
            <Link href="/auth" className="text-[11px] text-rose-400 hover:underline">Se déconnecter</Link>
            <Link href="/admin" className="text-[10px] text-slate-400 hover:text-slate-300 font-mono">Administration 🔒</Link>
          </div>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        {activeTab === 'orders_fraud' && (
          <div className="space-y-6 max-w-6xl mx-auto pt-2">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div>
                <span className="text-xs bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                  CRM Unifié E-commerce & Transporteurs
                </span>
                <h1 className="text-3xl font-extrabold text-white tracking-tight mt-1">
                  Suivi des Commandes & Rapprochement Quittances
                </h1>
                <p className="text-slate-400 text-xs mt-1">
                  Commandes persistées dans Supabase et croisées automatiquement lors de l'import des bordereaux Yalidine et ZR Express.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveTab('import_csv')}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-3.5 py-2 rounded-xl text-xs transition shadow flex items-center gap-1.5"
                >
                  <span>📁</span> Déposer Quittance pour Rapprochement
                </button>
                <button
                  onClick={() => handleSimulateCrmOrder('Ayor')}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3 py-2 rounded-xl text-xs transition shadow"
                >
                  + Ayor
                </button>
                <button
                  onClick={() => handleSimulateCrmOrder('YouCan')}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-2 rounded-xl text-xs transition shadow"
                >
                  + YouCan
                </button>
                <button
                  onClick={() => handleSimulateCrmOrder('Shopify')}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-3 py-2 rounded-xl text-xs transition shadow"
                >
                  + Shopify
                </button>
              </div>
            </div>

            {syncStatusMsg && (
              <div className="p-4 bg-emerald-500/15 border-2 border-emerald-500/40 text-emerald-300 text-xs rounded-2xl font-bold shadow-lg animate-fadeIn flex justify-between items-center">
                <span>{syncStatusMsg}</span>
                <button onClick={() => setSyncStatusMsg(null)} className="text-white hover:text-rose-400">✕</button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
                <span className="text-xs text-slate-400">Total Commandes Captées</span>
                <div className="text-3xl font-black text-white mt-1">{crmOrders.length}</div>
                <span className="text-[11px] text-slate-400">Enregistrées dans Supabase</span>
              </div>
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
                <span className="text-xs text-slate-400">Montant Net Encaissé</span>
                <div className="text-2xl font-black text-emerald-400 mt-1 font-mono">
                  {deliveredTotalDzd.toLocaleString()} DZD
                </div>
                <span className="text-[11px] text-emerald-300">Rapprochement quittance validé</span>
              </div>
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
                <span className="text-xs text-slate-400">Trésorerie en Acheminement</span>
                <div className="text-2xl font-black text-cyan-400 mt-1 font-mono">
                  {pendingTotalDzd.toLocaleString()} DZD
                </div>
                <span className="text-[11px] text-cyan-300">En attente de versement</span>
              </div>
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
                <span className="text-xs text-slate-400">Alertes Fraude / VPN</span>
                <div className="text-3xl font-black text-rose-400 mt-1">
                  {crmOrders.filter(o => o.status !== 'APPROUVE').length}
                </div>
                <span className="text-[11px] text-rose-300">Expéditions évitées</span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/60">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>📋</span> Registre CRM des Commandes & Suivi Transporteurs
                </h3>
                <button
                  onClick={fetchCrmFromSupabase}
                  className="text-xs text-emerald-400 hover:underline flex items-center gap-1 font-mono"
                >
                  <span>🔄</span> Actualiser depuis Supabase
                </button>
              </div>
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-mono">
                  <tr>
                    <th className="p-3.5">Plateforme</th>
                    <th className="p-3.5">N° Commande</th>
                    <th className="p-3.5">Destinataire & Wilaya</th>
                    <th className="p-3.5">Téléphone</th>
                    <th className="p-3.5">Montant COD</th>
                    <th className="p-3.5">Transporteur & Tracking</th>
                    <th className="p-3.5">Contrôle Fraude</th>
                    <th className="p-3.5 text-right">Statut Expédition</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {crmOrders.map((ord, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30">
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          ord.sourcePlatform === 'Ayor' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40' :
                          ord.sourcePlatform === 'Shopify' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40' :
                          'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        }`}>
                          {ord.sourcePlatform || 'YouCan'}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono font-bold text-white">{ord.orderId}</td>
                      <td className="p-3.5">
                        <div className="font-bold text-slate-200">{ord.customerName}</div>
                        <div className="text-[10px] text-slate-400">{ord.wilaya || 'Algérie'}</div>
                      </td>
                      <td className="p-3.5 font-mono text-slate-300">{ord.phone}</td>
                      <td className="p-3.5 font-mono font-bold text-white">
                        {(ord.codAmountDzd || 4500).toLocaleString()} DZD
                      </td>
                      <td className="p-3.5">
                        <div className="text-slate-300 font-medium">{ord.carrier || 'Yalidine Express'}</div>
                        <div className="font-mono text-[10px] text-emerald-400 select-all">{ord.trackingNumber || 'yal_crm_965374'}</div>
                      </td>
                      <td className="p-3.5">
                        {ord.isVpn ? (
                          <span className="px-2 py-0.5 bg-rose-500/20 text-rose-400 font-bold rounded text-[10px] border border-rose-500/40">
                            🚨 VPN Détecté
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 font-bold rounded text-[10px]">
                            ✓ Score {ord.score}/100
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-right">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                          ord.deliveryStatus === 'LIVRÉ_ET_ENCAISSÉ' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' :
                          ord.deliveryStatus === 'RETOUR_SURFACTURÉ' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' :
                          ord.deliveryStatus === 'ANNULÉ_FRAUDE' ? 'bg-rose-500/20 text-rose-400' :
                          'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          {ord.deliveryStatus === 'LIVRÉ_ET_ENCAISSÉ' ? '✓ LIVRÉ & ENCAISSÉ' :
                           ord.deliveryStatus === 'RETOUR_SURFACTURÉ' ? '⚠️ RETOUR SURFACTURÉ' :
                           ord.deliveryStatus || 'EN ATTENTE D\'EXPÉDITION'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ONGLET 1 : IMPORTATION CSV */}
        {activeTab === 'import_csv' && (
          <div className="space-y-6 max-w-6xl mx-auto pt-2">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-800/80 pb-5">
              <div>
                <span className="text-xs bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                  Moteur d'Audit & Rapprochement CRM
                </span>
                <h1 className="text-3xl font-extrabold text-white tracking-tight mt-1">
                  Importateur & Rapprochement de Quittances
                </h1>
                <p className="text-slate-400 text-xs mt-1">
                  Déposez un bordereau Yalidine ou ZR pour identifier les surfacturations et synchroniser instantanément les statuts CRM.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={downloadSampleYalidine}
                  className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow"
                >
                  <span>📥</span> Exemple Yalidine (.CSV)
                </button>
                <button
                  onClick={downloadSampleZR}
                  className="bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow"
                >
                  <span>📥</span> Exemple ZR Express (.CSV)
                </button>
              </div>
            </div>

            <div
              onClick={() => csvFileRef.current?.click()}
              className="border-2 border-dashed border-emerald-500/40 hover:border-emerald-400 bg-slate-900/60 hover:bg-slate-900 rounded-3xl p-8 md:p-12 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 shadow-xl"
            >
              <input
                type="file"
                ref={csvFileRef}
                accept=".csv,.xlsx,.txt"
                onChange={(e) => e.target.files?.[0] && handleProcessCsv(e.target.files[0])}
                className="hidden"
              />
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-3xl font-black">
                📥
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {csvFileName ? `Fichier analysé : ${csvFileName}` : "Glissez-déposez la quittance ou cliquez ici"}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Rapprochement automatique avec les commandes YouCan, Ayor et Shopify.
                </p>
              </div>
              <button
                type="button"
                className="mt-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-xs transition"
              >
                {isAuditingCsv ? "Audit & Rapprochement en cours..." : "Sélectionner un fichier de quittance"}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
                <span className="text-xs text-slate-400">Lignes Analysées</span>
                <div className="text-3xl font-black text-white mt-1">{auditStats.totalRows} colis</div>
                <span className="text-[11px] text-slate-400">Sur la quittance</span>
              </div>
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
                <span className="text-xs text-slate-400">Surfacturations Détectées</span>
                <div className="text-3xl font-black text-rose-400 mt-1">{auditStats.overchargedCount} colis</div>
                <span className="text-[11px] text-rose-300 font-medium">Tarifs retours abusifs</span>
              </div>
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
                <span className="text-xs text-slate-400">Trop-Perçu Récupérable</span>
                <div className="text-3xl font-black text-emerald-400 mt-1">+{auditStats.totalOverchargedDzd.toLocaleString()} DZD</div>
                <span className="text-[11px] text-emerald-300 font-medium">À réclamer immédiatement</span>
              </div>
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col justify-between">
                <div>
                  <span className="text-xs text-slate-400">Action Légale</span>
                  <div className="text-sm font-bold text-white mt-1">Bordereau Litige</div>
                </div>
                <button
                  onClick={exportDisputeCsv}
                  className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-2 rounded-xl text-xs transition"
                >
                  Exporter Contestation (.CSV)
                </button>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-mono">
                  <tr>
                    <th className="p-4">N° Tracking</th>
                    <th className="p-4">Transporteur</th>
                    <th className="p-4">Destinataire</th>
                    <th className="p-4">Motif</th>
                    <th className="p-4">Tarif Prévu</th>
                    <th className="p-4">Tarif Prélevé</th>
                    <th className="p-4">Trop-Perçu</th>
                    <th className="p-4 text-right">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {rtoAudits.map((r, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30">
                      <td className="p-4 font-mono font-bold text-white">{r.tracking}</td>
                      <td className="p-4 text-slate-300">{r.carrier}</td>
                      <td className="p-4 text-slate-200">{r.customerName} ({r.wilaya})</td>
                      <td className="p-4 text-slate-400">{r.returnReason}</td>
                      <td className="p-4 font-mono">{r.negotiatedReturnFee} DZD</td>
                      <td className="p-4 font-mono font-bold text-rose-400">{r.chargedReturnFee} DZD</td>
                      <td className="p-4 font-mono font-black text-rose-400">+{r.overchargedFee} DZD</td>
                      <td className="p-4 text-right">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                          r.status === 'OVERCHARGED' ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
                        }`}>
                          {r.status === 'OVERCHARGED' ? 'SURFACTURÉ' : 'CONFORME'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ONGLET INTÉGRATIONS */}
        {activeTab === 'api_settings' && (
          <div className="space-y-6 max-w-5xl mx-auto pt-4">
            <div>
              <span className="text-xs bg-cyan-500/20 text-cyan-300 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                Passerelles E-commerce Universelles
              </span>
              <h1 className="text-3xl font-extrabold text-white tracking-tight mt-1">
                Intégration YouCan, Shopify & Ayor
              </h1>
              <p className="text-slate-400 text-xs mt-1">
                Configurez votre point d'entrée webhook pour synchroniser vos commandes en temps réel.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl">
              <div className="space-y-2">
                <span className="text-xs text-slate-400 font-bold block">1. URL Webhook Officielle (POST) :</span>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    readOnly
                    value="https://saas-cod-recon-2026.vercel.app/api/orders/webhook"
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs font-mono text-emerald-400 select-all"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText("https://saas-cod-recon-2026.vercel.app/api/orders/webhook");
                      alert("URL Webhook copiée !");
                    }}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-3 rounded-xl text-xs transition"
                  >
                    Copier l'URL
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400 font-bold block">2. Clé Secrète de Sécurité Marchand :</span>
                  <span className="text-[10px] text-emerald-400 font-semibold">Active</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    readOnly
                    value={webhookSecretToken}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs font-mono text-cyan-400 select-all tracking-wider"
                  />
                  <button
                    onClick={handleCopySecret}
                    className={`px-4 py-3 text-xs font-bold rounded-xl transition ${
                      copySecretSuccess ? 'bg-cyan-400 text-slate-950' : 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700'
                    }`}
                  >
                    {copySecretSuccess ? '✓ Copié !' : 'Copier Token'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AUTRES ONGLETS STABLES */}
        {activeTab === 'wilayas' && (
          <div className="space-y-6 max-w-6xl mx-auto pt-2">
            <h1 className="text-3xl font-extrabold text-white">Rentabilité Nette par Wilaya & Décisions Meta Ads</h1>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-mono">
                  <tr>
                    <th className="p-4">Wilaya</th>
                    <th className="p-4">Expédiés</th>
                    <th className="p-4">Taux Livré</th>
                    <th className="p-4">CA Encaissé</th>
                    <th className="p-4">Pertes Retours</th>
                    <th className="p-4">Marge Nette</th>
                    <th className="p-4 text-right">Décision Meta Ads</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {filteredWilayas.map((w, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30">
                      <td className="p-4 font-bold text-white">{w.code} - {w.name}</td>
                      <td className="p-4 font-mono text-slate-300">{w.totalShipped} colis</td>
                      <td className="p-4 font-mono font-bold text-emerald-400">{w.deliveredRate}%</td>
                      <td className="p-4 font-mono text-slate-200">{w.grossSalesDzd.toLocaleString()} DZD</td>
                      <td className="p-4 font-mono text-rose-400 font-bold">-{w.rtoLossDzd.toLocaleString()} DZD</td>
                      <td className="p-4 font-mono font-black text-emerald-400">+{w.netMarginDzd.toLocaleString()} DZD</td>
                      <td className="p-4 text-right">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          {w.recommendation}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'ghosts' && (
          <div className="space-y-6 max-w-6xl mx-auto pt-2">
            <h1 className="text-3xl font-extrabold text-white">Colis Immobilisés en Hubs (+7 Jours)</h1>
            {claimNotification && <div className="p-4 bg-emerald-500/15 text-emerald-300 text-xs rounded-2xl">{claimNotification}</div>}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-mono">
                  <tr>
                    <th className="p-4">N° Tracking</th>
                    <th className="p-4">Transporteur</th>
                    <th className="p-4">Destinataire</th>
                    <th className="p-4">Centre Régional</th>
                    <th className="p-4">Jours Bloqué</th>
                    <th className="p-4">Valeur COD</th>
                    <th className="p-4 text-right">Action Légale</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {ghostParcels.map((g, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30">
                      <td className="p-4 font-mono font-bold text-white">{g.tracking}</td>
                      <td className="p-4 text-slate-300">{g.carrier}</td>
                      <td className="p-4 text-slate-200">{g.customerName} ({g.wilaya})</td>
                      <td className="p-4 text-amber-400">{g.hubLocation}</td>
                      <td className="p-4 font-mono font-black text-rose-400">{g.daysStuck} jours</td>
                      <td className="p-4 font-mono font-bold text-white">{g.codAmountDzd.toLocaleString()} DZD</td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleClaimGhost(g)}
                          className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-[11px] transition"
                        >
                          Lancer Réclamation Perte
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'dispute' && (
          <div className="space-y-6 max-w-5xl mx-auto pt-4">
            <h1 className="text-3xl font-extrabold text-white">Dossiers de Litiges Transporteurs</h1>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-mono">
                  <tr>
                    <th className="p-4">Dossier</th>
                    <th className="p-4">Tracking</th>
                    <th className="p-4">Transporteur</th>
                    <th className="p-4">Motif</th>
                    <th className="p-4">Montant Réclamé</th>
                    <th className="p-4 text-right">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {disputes.map((d, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30">
                      <td className="p-4 font-mono font-bold text-white">{d.id}</td>
                      <td className="p-4 font-mono text-emerald-400">{d.tracking}</td>
                      <td className="p-4 text-slate-300">{d.carrier}</td>
                      <td className="p-4 text-slate-300">{d.issue}</td>
                      <td className="p-4 font-bold text-rose-400">+{d.amountClaimedDzd.toLocaleString()} DZD</td>
                      <td className="p-4 text-right text-amber-400 font-black">{d.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'blacklist' && (
          <div className="space-y-8 max-w-5xl mx-auto pt-4">
            <h1 className="text-3xl font-extrabold text-white">Score Acheteur & Blacklist Algérie Partagée</h1>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <form onSubmit={handleSearchBuyer} className="flex gap-3">
                <input
                  type="text"
                  placeholder="Numéro acheteur (0550...)"
                  value={searchPhone}
                  onChange={(e) => setSearchPhone(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white font-mono text-base"
                />
                <button type="submit" className="bg-amber-500 text-slate-950 font-bold px-6 py-3 rounded-xl">
                  {isSearchingPhone ? 'Analyse...' : 'Auditer le Numéro'}
                </button>
              </form>
              {hasSearched && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center text-slate-400 text-sm">
                  {searchResult ? `Score : ${searchResult.trust_score}/100 - Risque : ${searchResult.risk_level}` : "✨ Numéro sans antécédent négatif dans la base partagée."}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'billing' && (
          <div className="space-y-8 max-w-5xl mx-auto pt-4">
            <h1 className="text-3xl font-black text-white text-center">Abonnements & Règlements BaridiMob</h1>
            <div className="bg-slate-900 border-2 border-emerald-500 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl">
              <div className="flex justify-between items-center border-b border-slate-800 pb-5">
                <div>
                  <h3 className="text-2xl font-black text-white">
                    Pack Business : <span className="text-emerald-400 font-mono">2 000 DZD / mois</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">Activation sous 15 minutes après versement.</p>
                </div>
              </div>
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-xs text-slate-400">Numéro RIP BaridiMob Officiel :</span>
                <div className="flex items-center justify-between bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                  <span className="font-mono text-emerald-400 font-bold text-sm">{billingRip}</span>
                  <button onClick={handleCopyRip} className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-emerald-500 text-slate-950">
                    {copySuccess ? '✓ Copié !' : 'Copier RIP'}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3.5 bg-emerald-500 text-slate-950 font-bold rounded-2xl text-xs flex items-center justify-center gap-2"
                >
                  <span>📁</span> Téléverser Preuve de Virement
                </button>
                <a
                  href={`https://wa.me/${supportWhatsAppNumber}?text=${encodeURIComponent("Bonjour, j'ai effectué le virement BaridiMob de 2 000 DZD pour le Pack Business. Voici ma quittance.")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3.5 bg-[#25D366] text-slate-950 font-bold rounded-2xl text-xs flex items-center justify-center gap-2"
                >
                  <span>💬</span> Confirmer sur WhatsApp
                </a>
              </div>
              {receiptUploadSuccess && <div className="p-3 bg-emerald-500/10 text-emerald-300 text-xs text-center rounded-xl font-bold">{receiptUploadSuccess}</div>}
              {receiptUploadError && <div className="p-3 bg-rose-500/10 text-rose-300 text-xs text-center rounded-xl font-bold">{receiptUploadError}</div>}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
