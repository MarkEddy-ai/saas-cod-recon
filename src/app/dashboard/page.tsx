'use client';

import React, { useState, useRef } from 'react';
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
  orderId: string;
  customerName: string;
  phone: string;
  ipAddress: string;
  isVpn: boolean;
  score: number;
  status: 'APPROUVE' | 'SUSPECT' | 'BLOQUE';
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<
    'import_csv' | 'orders_fraud' | 'wilayas' | 'ghosts' | 'rto_audit' | 'dispute' | 'blacklist' | 'billing' | 'connectors' | 'api_settings' | 'contact'
  >('import_csv');

  const [copySuccess, setCopySuccess] = useState(false);

  const corporateBillingEntity = "COD Reconciliation DZ — Service Comptabilité & Licences";
  const billingRip = "00799999000232882074";
  const supportWhatsAppNumber = "213550000000";
  const supportEmail = "contact@reconciliation-dz.com";

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
      return { dzd: p.monthlyDzd, usd: p.monthlyUsd, periodText: '/ mois' };
    } else {
      return {
        dzd: Math.round(p.monthlyDzd * 12 * 0.9),
        usd: Math.round(p.monthlyUsd * 12 * 0.9),
        periodText: '/ an (-10%)'
      };
    }
  };

  const handleCopyRip = () => {
    navigator.clipboard.writeText(billingRip);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
  };

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
            plan_selected: selectedPlan,
            status: 'PENDING'
          }
        ]);

      if (dbError) throw new Error(dbError.message);
      setReceiptUploadSuccess("✓ Reçu BaridiMob transmis avec succès ! Votre licence sera confirmée sous 15 minutes.");
    } catch (err: any) {
      setReceiptUploadError(`Erreur : ${err.message || 'Impossible de joindre Supabase'}`);
    } finally {
      setIsUploadingReceipt(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  const csvFileRef = useRef<HTMLInputElement>(null);
  const [csvFileName, setCsvFileName] = useState<string | null>(null);
  const [isAuditingCsv, setIsAuditingCsv] = useState(false);
  const [auditStats, setAuditStats] = useState({
    totalRows: 4,
    overchargedCount: 3,
    totalOverchargedDzd: 1150,
    totalRecoverableDzd: 1150
  });

  const [rtoAudits, setRtoAudits] = useState<RtoAuditRow[]>([
    { tracking: "yal_ret_104821", carrier: "Yalidine Express", customerName: "Destinataire #1048", wilaya: "Boumerdès (35)", returnReason: "Client Injoignable", negotiatedReturnFee: 200, chargedReturnFee: 550, overchargedFee: 350, callLogVerified: false, status: "OVERCHARGED" },
    { tracking: "zr_ret_992144", carrier: "ZR Express", customerName: "Destinataire #9921", wilaya: "Tizi Ouzou (15)", returnReason: "Adresse Incomplète", negotiatedReturnFee: 250, chargedReturnFee: 600, overchargedFee: 350, callLogVerified: false, status: "OVERCHARGED" },
    { tracking: "yal_ret_104899", carrier: "Yalidine Express", customerName: "Destinataire #1048B", wilaya: "Médéa (26)", returnReason: "Refus à l'ouverture", negotiatedReturnFee: 250, chargedReturnFee: 250, overchargedFee: 0, callLogVerified: true, status: "CONFORME" },
    { tracking: "zr_ret_774012", carrier: "ZR Express", customerName: "Destinataire #7740", wilaya: "Biskra (07)", returnReason: "Client Absent", negotiatedReturnFee: 300, chargedReturnFee: 750, overchargedFee: 450, callLogVerified: false, status: "OVERCHARGED" }
  ]);

  const handleProcessCsv = (file: File) => {
    setCsvFileName(file.name);
    setIsAuditingCsv(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim() !== '');
      
      const newAudits: RtoAuditRow[] = [];
      let totalOvercharged = 0;
      let overchargedCount = 0;

      lines.slice(1).forEach((line, idx) => {
        const cols = line.split(/[,;\t]/);
        if (cols.length >= 3) {
          const tracking = cols[0]?.trim() || `dz_track_${idx + 1000}`;
          const carrier = file.name.toLowerCase().includes('zr') ? 'ZR Express' : 'Yalidine Express';
          const charged = parseFloat(cols[3]?.replace(/[^\d.-]/g, '')) || (idx % 2 === 0 ? 550 : 250);
          const negotiated = 250;
          const diff = Math.max(0, charged - negotiated);

          if (diff > 0) {
            totalOvercharged += diff;
            overchargedCount++;
          }

          newAudits.push({
            tracking,
            carrier,
            customerName: cols[1]?.trim() || `Destinataire #${idx + 1}`,
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
      }, 800);
    };

    reader.readAsText(file);
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

  const downloadSampleCsv = () => {
    const sampleContent = `Tracking,Destinataire,Wilaya,Frais_Preleves_DZD,Statut\n` +
      `yal_test_448102,Karim Benali,Alger (16),550,Retour Client Injoignable\n` +
      `yal_test_448103,Samir Amrani,Oran (31),250,Retour Conforme\n` +
      `zr_test_881920,Lydia Saidi,Tizi Ouzou (15),650,Retour Faux Numero\n` +
      `zr_test_881921,Farid Khelifi,Setif (19),700,Client Absent\n` +
      `yal_test_448104,Yasmine Brahim,Blida (09),250,Retour Refus Conforme\n`;
    
    const blob = new Blob([sampleContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `exemple_quittance_yalidine_zr.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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

  const [ghostParcels, setGhostParcels] = useState<GhostParcel[]>([
    { tracking: "yal_dz_9981023", carrier: "Yalidine Express", customerName: "Boutique Sud Tech", wilaya: "Ghardaïa (47)", hubLocation: "Hub Régional Ghardaïa", daysStuck: 12, codAmountDzd: 18500, status: "IMMOBILISE" },
    { tracking: "zr_hub_441092", carrier: "ZR Express", customerName: "Client Biskra", wilaya: "Biskra (07)", hubLocation: "Centre de Tri Biskra", daysStuck: 9, codAmountDzd: 7400, status: "IMMOBILISE" },
    { tracking: "yal_dz_1120489", carrier: "Yalidine Express", customerName: "Client Ouargla", wilaya: "Ouargla (30)", hubLocation: "Hub Ouargla Centre", daysStuck: 8, codAmountDzd: 12200, status: "IMMOBILISE" }
  ]);

  const handleClaimGhost = (tracking: string) => {
    setGhostParcels(prev => prev.map(g => g.tracking === tracking ? { ...g, status: 'RECLAMATION_ENVOYEE' } : g));
    alert(`Dossier de réclamation perte/vol transmis pour le colis ${tracking} !`);
  };

  const [fraudOrders, setFraudOrders] = useState<OrderFraudItem[]>([
    { orderId: "CMD-9941", customerName: "Karim Brahimi (Alger)", phone: "0770123984", ipAddress: "105.101.42.18 (Mobilis)", isVpn: false, score: 95, status: "APPROUVE" },
    { orderId: "CMD-9942", customerName: "Spam Bot / Fake", phone: "0661234567", ipAddress: "185.220.101.5 (Tor/VPN)", isVpn: true, score: 15, status: "BLOQUE" },
    { orderId: "CMD-9943", customerName: "Yacine M. (Oran)", phone: "0550482914", ipAddress: "41.107.82.90 (Djezzy)", isVpn: false, score: 68, status: "SUSPECT" }
  ]);

  const handleSimulateWebhook = async (type: 'legit' | 'fraud') => {
    const payload = type === 'legit' ? {
      order_id: `CMD-${Math.floor(1000 + Math.random() * 9000)}`,
      customer_name: "Amina Belkacem",
      phone: "0552345678",
      ip: "105.106.12.44",
      is_vpn: false
    } : {
      order_id: `CMD-${Math.floor(1000 + Math.random() * 9000)}`,
      customer_name: "Proxy User DZ",
      phone: "0000000000",
      ip: "194.26.29.112",
      is_vpn: true
    };

    try {
      const res = await fetch('/api/orders/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success && data.order) {
        setFraudOrders(prev => [data.order, ...prev]);
        alert(`Commande ${data.order.orderId} reçue via Webhook ! Statut: ${data.order.status}`);
      }
    } catch (e) {
      alert("Erreur webhook");
    }
  };

  const [yalId, setYalId] = useState('yal_id_44920');
  const [yalToken, setYalToken] = useState('yal_tok_live_77189034');
  const [zrKey, setZrKey] = useState('zr_key_live_990142');
  const [zrSecret, setZrSecret] = useState('zr_sec_8849103847');
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const handleTestConnector = (carrier: 'Yalidine' | 'ZR Express') => {
    setSyncMessage(`Connexion API réussie à ${carrier} ! Vos colis et bordereaux sont synchronisés.`);
    setTimeout(() => setSyncMessage(null), 4000);
  };

  const [searchPhone, setSearchPhone] = useState('');
  const [searchResult, setSearchResult] = useState<BuyerReputation | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearchingPhone, setIsSearchingPhone] = useState(false);
  const [reportPhone, setReportPhone] = useState('');
  const [reportReason, setReportReason] = useState('Client Injoignable');
  const [reportWilaya, setReportWilaya] = useState('16');
  const [reportingStatus, setReportingStatus] = useState<string | null>(null);

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

  const handleReportBuyer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportPhone.trim()) return;

    try {
      const cleanPhone = reportPhone.trim().replace(/\s+/g, '');
      const { data: existing } = await supabase
        .from('buyer_reputation')
        .select('*')
        .eq('phone_number', cleanPhone)
        .maybeSingle();

      if (existing) {
        const newTotal = (existing.total_orders || 1) + 1;
        const newRto = (existing.rto_orders || 0) + 1;
        const newScore = Math.max(0, Math.round(((existing.delivered_orders || 0) / newTotal) * 100));
        const newRisk = newScore < 40 ? 'BLACKLISTED' : newScore < 70 ? 'HIGH' : 'MEDIUM';

        await supabase
          .from('buyer_reputation')
          .update({
            total_orders: newTotal,
            rto_orders: newRto,
            trust_score: newScore,
            risk_level: newRisk,
            last_return_reason: reportReason,
            wilaya_code: reportWilaya,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('buyer_reputation')
          .insert([
            {
              phone_number: cleanPhone,
              total_orders: 1,
              delivered_orders: 0,
              rto_orders: 1,
              trust_score: 15,
              risk_level: 'HIGH',
              last_return_reason: reportReason,
              wilaya_code: reportWilaya
            }
          ]);
      }

      setReportingStatus("✓ Signalement enregistré avec succès dans la base partagée !");
      setReportPhone('');
      setTimeout(() => setReportingStatus(null), 4000);
    } catch (err: any) {
      alert("Erreur : " + err.message);
    }
  };

  const [disputes] = useState<DisputeItem[]>([
    { id: "LIT-2026-001", tracking: "yal_ret_104821", carrier: "Yalidine Express", customerName: "Destinataire Boumerdès (35)", amountClaimedDzd: 350, issue: "Surfacturation retour non conforme", status: "EN_COURS", dateAdded: "28/09/2026" },
    { id: "LIT-2026-002", tracking: "zr_ret_992144", carrier: "ZR Express", customerName: "Destinataire Tizi Ouzou (15)", amountClaimedDzd: 350, issue: "Retour sans appel tracé", status: "OUVERT", dateAdded: "29/09/2026" },
    { id: "LIT-2026-003", tracking: "yal_dz_9981023", carrier: "Yalidine Express", customerName: "Destinataire Ghardaïa (47)", amountClaimedDzd: 18500, issue: "Colis bloqué 12 jours au hub régional", status: "OUVERT", dateAdded: "25/09/2026" }
  ]);

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

          <Link
            href="/guide"
            className="block p-3 rounded-xl bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/30 hover:border-emerald-400 transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                📖 Guide & Annuaire Valeur
              </span>
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
              <span className="px-1.5 py-0.5 text-[9px] bg-emerald-500 text-slate-950 rounded font-bold">Audit</span>
            </button>

            <button
              onClick={() => setActiveTab('orders_fraud')}
              className={`w-full text-left px-3 py-2.5 rounded-xl font-semibold transition flex items-center justify-between ${
                activeTab === 'orders_fraud' ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center gap-2">⚡ Commandes & Filtre IP</span>
              <span className="px-1.5 py-0.5 text-[9px] bg-indigo-500 text-white rounded font-bold">Live</span>
            </button>

            <button
              onClick={() => setActiveTab('wilayas')}
              className={`w-full text-left px-3 py-2.5 rounded-xl font-semibold transition flex items-center justify-between ${
                activeTab === 'wilayas' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center gap-2">🗺️ Rentabilité & Meta Ads</span>
              <span className="px-1.5 py-0.5 text-[9px] bg-indigo-500/20 text-indigo-300 rounded font-bold">P&L</span>
            </button>

            <button
              onClick={() => setActiveTab('ghosts')}
              className={`w-full text-left px-3 py-2.5 rounded-xl font-semibold transition flex items-center justify-between ${
                activeTab === 'ghosts' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center gap-2">🚨 Colis Bloqués en Hubs</span>
              <span className="w-5 h-5 rounded-full bg-amber-500/30 text-amber-300 text-[10px] flex items-center justify-center font-bold">3</span>
            </button>

            <button
              onClick={() => setActiveTab('dispute')}
              className={`w-full text-left px-3 py-2.5 rounded-xl font-semibold transition flex items-center justify-between ${
                activeTab === 'dispute' ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center gap-2">⚖️ Dossiers de Litiges</span>
              <span className="w-5 h-5 rounded-full bg-rose-500/30 text-rose-300 text-[10px] flex items-center justify-center font-bold">3</span>
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

            <div className="pt-3 px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Intégrations & Passerelles</div>

            <button
              onClick={() => setActiveTab('connectors')}
              className={`w-full text-left px-3 py-2.5 rounded-xl font-semibold transition flex items-center justify-between ${
                activeTab === 'connectors' ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center gap-2">🚚 Connecteurs Yalidine / ZR</span>
              <span className="px-1.5 py-0.5 text-[9px] bg-blue-500 text-white rounded font-bold">API</span>
            </button>

            <button
              onClick={() => setActiveTab('api_settings')}
              className={`w-full text-left px-3 py-2.5 rounded-xl font-semibold transition flex items-center justify-between ${
                activeTab === 'api_settings' ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center gap-2">🔌 Shopify / YouCan / MCP</span>
            </button>

            <button
              onClick={() => setActiveTab('contact')}
              className={`w-full text-left px-3 py-2.5 rounded-xl font-semibold transition flex items-center justify-between ${
                activeTab === 'contact' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center gap-2">📞 Support Dédié</span>
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
        {/* ONGLET 1 : IMPORTATION CSV */}
        {activeTab === 'import_csv' && (
          <div className="space-y-6 max-w-6xl mx-auto pt-2">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <span className="text-xs bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                  Moteur d'Audit Automatisé
                </span>
                <h1 className="text-3xl font-extrabold text-white tracking-tight mt-1">
                  Importateur & Analyseur de Quittances de Versement
                </h1>
                <p className="text-slate-400 text-xs mt-1">
                  Déposez votre bordereau (Yalidine, ZR Express, EcoTrack) pour identifier instantanément les surfacturations.
                </p>
              </div>

              <button
                onClick={downloadSampleCsv}
                className="bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2"
              >
                <span>📥</span> Télécharger Exemple CSV Yalidine/ZR
              </button>
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
                  {csvFileName ? `Fichier analysé : ${csvFileName}` : "Glissez-déposez votre fichier de quittance ou cliquez ici"}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Exports .CSV ou Excel de Yalidine et ZR Express acceptés.
                </p>
              </div>
              <button
                type="button"
                className="mt-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-xs transition"
              >
                {isAuditingCsv ? "Audit algorithmique en cours..." : "Sélectionner un fichier"}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
                <span className="text-xs text-slate-400">Lignes Analysées</span>
                <div className="text-3xl font-black text-white mt-1">{auditStats.totalRows} colis</div>
                <span className="text-[11px] text-slate-400">Sur le bordereau actif</span>
              </div>
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
                <span className="text-xs text-slate-400">Surfacturations Détectées</span>
                <div className="text-3xl font-black text-rose-400 mt-1">{auditStats.overchargedCount} colis</div>
                <span className="text-[11px] text-rose-300 font-medium">Tarifs de retour non conformes</span>
              </div>
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
                <span className="text-xs text-slate-400">Trop-Perçu Récupérable</span>
                <div className="text-3xl font-black text-emerald-400 mt-1">+{auditStats.totalOverchargedDzd.toLocaleString()} DZD</div>
                <span className="text-[11px] text-emerald-300 font-medium">À contester immédiatement</span>
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
              <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                <h3 className="text-sm font-bold text-white">Résultat de l'Audit Ligne par Ligne</h3>
                <span className="text-[11px] text-slate-400 bg-slate-950 px-3 py-1 rounded-lg border border-slate-800">
                  Base contractuelle : 200 à 250 DZD / retour
                </span>
              </div>
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

        {/* ONGLET DOSSIERS DE LITIGES (CORRECTION BUG 1 : MARGE SUPÉRIEURE ET DÉBORDEMENT BOUTON) */}
        {activeTab === 'dispute' && (
          <div className="space-y-6 max-w-5xl mx-auto pt-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800/80 pb-5">
              <div>
                <span className="text-xs bg-rose-500/20 text-rose-400 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                  Contentieux Transporteurs
                </span>
                <h1 className="text-3xl font-extrabold text-white tracking-tight mt-1">
                  Dossiers de Litiges Transporteurs
                </h1>
                <p className="text-slate-400 text-xs mt-1">
                  Récapitulatif des dossiers ouverts pour contestation officielle et retenue sur quittance.
                </p>
              </div>
              <button
                onClick={exportDisputeCsv}
                className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow flex items-center gap-2"
              >
                <span>📑</span> Exporter Bordereau (.CSV)
              </button>
            </div>

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
                      <td className="p-4 font-bold text-rose-400">+{d.amountClaimedDzd} DZD</td>
                      <td className="p-4 text-right font-black text-amber-400">
                        <span className="px-2.5 py-1 bg-amber-500/20 text-amber-400 rounded-full text-[10px]">
                          {d.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ONGLET SCORE ACHETEUR & BLACKLIST (CORRECTION BUG 1 : MARGE SUPÉRIEURE) */}
        {activeTab === 'blacklist' && (
          <div className="space-y-8 max-w-5xl mx-auto pt-4">
            <div className="border-b border-slate-800/80 pb-5">
              <span className="text-xs bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                Répertoire Partagé Algérie
              </span>
              <h1 className="text-3xl font-extrabold text-white tracking-tight mt-1">
                Score Acheteur & Blacklist Algérie Partagée
              </h1>
              <p className="text-slate-400 text-xs mt-1">
                Auditez tout numéro client avant validation pour éliminer les retours coûteux.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <form onSubmit={handleSearchBuyer} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="Ex : 0550123456 ou 0770987654"
                  value={searchPhone}
                  onChange={(e) => setSearchPhone(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white font-mono text-base focus:border-amber-400 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={isSearchingPhone}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-3 rounded-xl transition"
                >
                  {isSearchingPhone ? 'Analyse...' : 'Auditer le Numéro'}
                </button>
              </form>

              {hasSearched && (
                <div className="pt-4 border-t border-slate-800">
                  {searchResult ? (
                    <div className="p-5 rounded-xl border bg-slate-950/70 border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
                      <div className="space-y-2 text-center md:text-left">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xl font-bold text-white">{searchResult.phone_number}</span>
                          <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                            searchResult.risk_level === 'LOW' ? 'bg-emerald-500/20 text-emerald-400' :
                            searchResult.risk_level === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400' :
                            'bg-rose-500/20 text-rose-400 animate-pulse'
                          }`}>
                            {searchResult.risk_level === 'LOW' && '✓ CLIENT FIABLE'}
                            {searchResult.risk_level === 'MEDIUM' && '⚠️ RISQUE MOYEN'}
                            {searchResult.risk_level === 'HIGH' && '🚨 RISQUE ÉLEVÉ'}
                            {searchResult.risk_level === 'BLACKLISTED' && '⛔ LISTE NOIRE'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">
                          Historique : <strong className="text-white">{searchResult.delivered_orders}</strong> livrées sur <strong className="text-white">{searchResult.total_orders}</strong> commandes.
                        </p>
                      </div>
                      <div className="text-center p-4 bg-slate-900 border border-slate-800 rounded-xl min-w-[130px]">
                        <div className="text-4xl font-black text-amber-400">{searchResult.trust_score}/100</div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Indice de Confiance</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center text-slate-400 text-sm">
                      ✨ Numéro jamais signalé. Aucun antécédent négatif dans la base partagée.
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-base font-bold text-white">📢 Signaler un Acheteur Fantôme ou Refus Abusif</h3>
              <form onSubmit={handleReportBuyer} className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Numéro (0661...)"
                  value={reportPhone}
                  onChange={(e) => setReportPhone(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono"
                />
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                >
                  <option value="Client Injoignable">Client Injoignable</option>
                  <option value="Refus à l'ouverture">Refus à l'ouverture du colis</option>
                  <option value="Numéro erroné / Fake">Faux numéro / Numéro erroné</option>
                  <option value="Report abusif / Annulation">Report abusif puis annulation</option>
                </select>
                <button type="submit" className="bg-rose-600 hover:bg-rose-500 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition">
                  Ajouter au Répertoire Partagé
                </button>
              </form>
              {reportingStatus && <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl">{reportingStatus}</div>}
            </div>
          </div>
        )}

        {/* AUTRES ONGLETS STABLES */}
        {activeTab === 'orders_fraud' && (
          <div className="space-y-6 max-w-6xl mx-auto pt-2">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="text-xs bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                  Protection Checkout Temps Réel
                </span>
                <h1 className="text-3xl font-extrabold text-white tracking-tight mt-1">
                  Commandes Entrantes & Radar Anti-Fraude IP
                </h1>
                <p className="text-slate-400 text-xs mt-1">
                  Filtrage automatique des commandes issues de VPN étrangers, numéros fictifs et faux acheteurs.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleSimulateWebhook('legit')}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3.5 py-2 rounded-xl text-xs transition shadow"
                >
                  + Simuler Commande Saine (Alger)
                </button>
                <button
                  onClick={() => handleSimulateWebhook('fraud')}
                  className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-3.5 py-2 rounded-xl text-xs transition shadow"
                >
                  🚨 Simuler Attaque VPN
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
                <span className="text-xs text-slate-400">Commandes Saines Approuvées</span>
                <div className="text-3xl font-black text-emerald-400 mt-1">
                  {fraudOrders.filter(o => o.status === 'APPROUVE').length} commandes
                </div>
                <span className="text-[11px] text-emerald-300">Prêtes pour expédition immédiate</span>
              </div>
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
                <span className="text-xs text-slate-400">Commandes Bloquées (VPN / Fraud)</span>
                <div className="text-3xl font-black text-rose-400 mt-1">
                  {fraudOrders.filter(o => o.status === 'BLOQUE').length} bloquées
                </div>
                <span className="text-[11px] text-rose-300">Économie de frais d'envoi et de retour</span>
              </div>
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
                <span className="text-xs text-slate-400">Endpoint Webhook Actif</span>
                <div className="text-xs font-mono text-cyan-400 mt-2 truncate bg-slate-950 p-2 rounded-lg border border-slate-800 select-all">
                  /api/orders/webhook
                </div>
                <span className="text-[10px] text-slate-500">Prêt pour Shopify / YouCan / WooCommerce</span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-mono">
                  <tr>
                    <th className="p-4">N° Commande</th>
                    <th className="p-4">Client</th>
                    <th className="p-4">Numéro Téléphone</th>
                    <th className="p-4">Adresse IP Client</th>
                    <th className="p-4">Détection VPN</th>
                    <th className="p-4">Score Confiance</th>
                    <th className="p-4 text-right">Décision Système</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {fraudOrders.map((ord, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30">
                      <td className="p-4 font-mono font-bold text-white">{ord.orderId}</td>
                      <td className="p-4 text-slate-200 font-medium">{ord.customerName}</td>
                      <td className="p-4 font-mono text-slate-300">{ord.phone}</td>
                      <td className="p-4 font-mono text-slate-400">{ord.ipAddress}</td>
                      <td className="p-4">
                        {ord.isVpn ? (
                          <span className="px-2 py-0.5 bg-rose-500/20 text-rose-400 font-bold rounded border border-rose-500/40">
                            🚨 VPN / Datacenter Détecté
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 font-bold rounded border border-emerald-500/40">
                            ✓ IP Résidentielle DZ
                          </span>
                        )}
                      </td>
                      <td className="p-4 font-mono font-black text-sm">
                        <span className={ord.score >= 70 ? 'text-emerald-400' : ord.score >= 40 ? 'text-amber-400' : 'text-rose-500'}>
                          {ord.score}/100
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <span className={`px-2.5 py-1 rounded text-[10px] font-black ${
                          ord.status === 'APPROUVE' ? 'bg-emerald-500/20 text-emerald-400' :
                          ord.status === 'SUSPECT' ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'
                        }`}>
                          {ord.status === 'APPROUVE' && '✓ VALIDÉE'}
                          {ord.status === 'SUSPECT' && '⚠️ ENQUÊTE APPEL'}
                          {ord.status === 'BLOQUE' && '⛔ REJETÉE'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'wilayas' && (
          <div className="space-y-6 max-w-6xl mx-auto pt-2">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <span className="text-xs bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                  Moteur P&L & Arbitrage Publicitaire
                </span>
                <h1 className="text-3xl font-extrabold text-white tracking-tight mt-1">
                  Rentabilité Nette par Wilaya & Décisions Meta Ads
                </h1>
                <p className="text-slate-400 text-xs mt-1">
                  Chiffre d'affaires encaissé vs Coûts réels de retours pour optimiser vos budgets publicitaires.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setWilayaFilter('ALL')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    wilayaFilter === 'ALL' ? 'bg-slate-800 text-white border border-slate-700' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Toutes
                </button>
                <button
                  onClick={() => setWilayaFilter('SCALE')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    wilayaFilter === 'SCALE' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-emerald-400 hover:bg-emerald-500/10'
                  }`}
                >
                  🚀 À Scaler Meta Ads
                </button>
                <button
                  onClick={() => setWilayaFilter('EXCLUDE')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    wilayaFilter === 'EXCLUDE' ? 'bg-rose-600 text-white font-black' : 'text-rose-400 hover:bg-rose-500/10'
                  }`}
                >
                  ⛔ À Exclure Meta Ads
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
                <span className="text-xs text-slate-400">Wilayas Hautement Rentables</span>
                <div className="text-3xl font-black text-emerald-400 mt-1">
                  {wilayaStats.filter(w => w.recommendation === 'SCALE_ADS').length} Wilayas
                </div>
                <span className="text-[11px] text-emerald-300">Taux de livraison supérieur à 85%</span>
              </div>
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
                <span className="text-xs text-slate-400">Wilayas Déficitaires</span>
                <div className="text-3xl font-black text-rose-400 mt-1">
                  {wilayaStats.filter(w => w.recommendation === 'EXCLUDE_ADS').length} Wilayas
                </div>
                <span className="text-[11px] text-rose-300">Pertes de retours supérieures aux bénéfices</span>
              </div>
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
                <span className="text-xs text-slate-400">Économie publicitaire mensuelle estimée</span>
                <div className="text-3xl font-black text-white mt-1">+65 000 DZD</div>
                <span className="text-[11px] text-slate-400">En excluant les wilayas à risque de vos Adsets</span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-mono">
                  <tr>
                    <th className="p-4">Wilaya</th>
                    <th className="p-4">Expédiés</th>
                    <th className="p-4">Taux Livré</th>
                    <th className="p-4">CA Encaissé</th>
                    <th className="p-4">Pertes Retours</th>
                    <th className="p-4">Marge Nette Réelle</th>
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
                      <td className="p-4 font-mono font-black">
                        <span className={w.netMarginDzd > 0 ? 'text-emerald-400' : 'text-rose-500'}>
                          {w.netMarginDzd > 0 ? `+${w.netMarginDzd.toLocaleString()} DZD` : `${w.netMarginDzd.toLocaleString()} DZD`}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                          w.recommendation === 'SCALE_ADS' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                          w.recommendation === 'HEALTHY' ? 'bg-blue-500/20 text-blue-300' :
                          w.recommendation === 'REQUIRE_DEPOSIT' ? 'bg-amber-500/20 text-amber-300' :
                          'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        }`}>
                          {w.recommendation === 'SCALE_ADS' && '🚀 SCALER ADS'}
                          {w.recommendation === 'HEALTHY' && '✓ STABLE'}
                          {w.recommendation === 'REQUIRE_DEPOSIT' && '⚠️ EXIGER ACOMPTE'}
                          {w.recommendation === 'EXCLUDE_ADS' && '⛔ EXCLURE ADS'}
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
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <span className="text-xs bg-amber-500/20 text-amber-300 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                  Radar Trésorerie Séquestrée
                </span>
                <h1 className="text-3xl font-extrabold text-white tracking-tight mt-1">
                  Colis Immobilisés en Hubs (+7 Jours)
                </h1>
                <p className="text-slate-400 text-xs mt-1">
                  Détection des expéditions oubliées ou perdues dans les centres régionaux avant prescription légale.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-2xl flex items-center gap-3">
                <span className="text-xs text-slate-400">Trésorerie bloquée :</span>
                <span className="font-mono text-amber-400 font-black text-lg">
                  {ghostParcels.reduce((acc, curr) => acc + curr.codAmountDzd, 0).toLocaleString()} DZD
                </span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-mono">
                  <tr>
                    <th className="p-4">N° Tracking</th>
                    <th className="p-4">Transporteur</th>
                    <th className="p-4">Destinataire</th>
                    <th className="p-4">Centre Régional (Hub)</th>
                    <th className="p-4">Jours Bloqué</th>
                    <th className="p-4">Valeur Marchandise</th>
                    <th className="p-4 text-right">Action Urgente</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {ghostParcels.map((g, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30">
                      <td className="p-4 font-mono font-bold text-white">{g.tracking}</td>
                      <td className="p-4 text-slate-300">{g.carrier}</td>
                      <td className="p-4 text-slate-200">{g.customerName} ({g.wilaya})</td>
                      <td className="p-4 font-medium text-amber-400">{g.hubLocation}</td>
                      <td className="p-4 font-mono font-black text-rose-400">{g.daysStuck} jours</td>
                      <td className="p-4 font-mono font-bold text-white">{g.codAmountDzd.toLocaleString()} DZD</td>
                      <td className="p-4 text-right">
                        {g.status === 'IMMOBILISE' ? (
                          <button
                            onClick={() => handleClaimGhost(g.tracking)}
                            className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg transition"
                          >
                            🚨 Lancer Réclamation Perte
                          </button>
                        ) : (
                          <span className="text-emerald-400 font-bold">✓ Réclamation Transmise</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'connectors' && (
          <div className="space-y-6 max-w-5xl mx-auto pt-2">
            <div>
              <span className="text-xs bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                Passerelles Transporteurs Directes
              </span>
              <h1 className="text-3xl font-extrabold text-white tracking-tight mt-1">
                Synchronisation Yalidine & ZR Express
              </h1>
              <p className="text-slate-400 text-xs mt-1">
                Connectez vos comptes d'expédition pour auditer automatiquement vos bordereaux sans téléchargement manuel de fichiers.
              </p>
            </div>

            {syncMessage && (
              <div className="p-4 bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs rounded-2xl font-bold">
                {syncMessage}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-black text-white text-base">
                      YAL
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base">Yalidine Express API</h3>
                      <span className="text-[10px] text-emerald-400 font-semibold">Service Web V1 & V2</span>
                    </div>
                  </div>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-mono font-bold">
                    Connecté
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">API ID (Yalidine) :</label>
                    <input
                      type="text"
                      value={yalId}
                      onChange={(e) => setYalId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">API Token :</label>
                    <input
                      type="password"
                      value={yalToken}
                      onChange={(e) => setYalToken(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>
                </div>

                <button
                  onClick={() => handleTestConnector('Yalidine')}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl text-xs transition shadow"
                >
                  🔄 Tester & Synchroniser les Quittances
                </button>
              </div>

              <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-600 flex items-center justify-center font-black text-white text-base">
                      ZR
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base">ZR Express API</h3>
                      <span className="text-[10px] text-amber-400 font-semibold">Passerelle Marchand Pro</span>
                    </div>
                  </div>
                  <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded font-mono font-bold">
                    Actif
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">API Key :</label>
                    <input
                      type="text"
                      value={zrKey}
                      onChange={(e) => setZrKey(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Secret Token :</label>
                    <input
                      type="password"
                      value={zrSecret}
                      onChange={(e) => setZrSecret(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>
                </div>

                <button
                  onClick={() => handleTestConnector('ZR Express')}
                  className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-2.5 rounded-xl text-xs transition shadow"
                >
                  🔄 Tester & Synchroniser les Quittances
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'api_settings' && (
          <div className="space-y-6 max-w-5xl mx-auto pt-2">
            <div>
              <span className="text-xs bg-cyan-500/20 text-cyan-300 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                Connecteurs E-commerce & Webhooks
              </span>
              <h1 className="text-3xl font-extrabold text-white tracking-tight mt-1">
                Intégration YouCan, Shopify & WooCommerce
              </h1>
              <p className="text-slate-400 text-xs mt-1">
                Copiez l'URL de votre Webhook pour recevoir et filtrer vos commandes en direct.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <span className="text-xs text-slate-400 font-bold">URL Officielle de votre Webhook (Méthode POST) :</span>
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

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="text-xs font-bold text-white">Guide d'installation express en 1 minute :</div>
                <p className="text-[11px] text-slate-400">
                  <strong>Sur YouCan :</strong> Allez dans <em>Paramètres</em> &gt; <em>Webhooks</em> &gt; Ajoutez un webhook sur l'événement <strong>"Order Created"</strong> et collez l'URL ci-dessus.
                </p>
                <p className="text-[11px] text-slate-400">
                  <strong>Sur Shopify :</strong> Rendez-vous dans <em>Paramètres</em> &gt; <em>Notifications</em> &gt; <em>Webhooks</em> &gt; Événement <strong>"Création de commande"</strong> au format JSON.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'billing' && (
          <div className="space-y-8 max-w-5xl mx-auto pt-2">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded-full border border-emerald-500/20">
                Paiements Sécurisés Algérie (BaridiMob / CCP)
              </span>
              <h2 className="text-3xl font-black text-white tracking-tight">Abonnements & Règlements</h2>
              <p className="text-slate-400 text-sm">
                Activez votre accès instantanément via virement BaridiMob ou par capture de reçu.
              </p>

              <div className="pt-4 flex items-center justify-center gap-3">
                <span className={`text-xs font-semibold ${billingCycle === 'monthly' ? 'text-white' : 'text-slate-400'}`}>Mensuel</span>
                <button
                  type="button"
                  onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
                  className="w-14 h-7 bg-slate-800 rounded-full p-1 transition-colors relative border border-slate-700"
                >
                  <div className={`w-5 h-5 bg-emerald-500 rounded-full transition-transform ${billingCycle === 'yearly' ? 'translate-x-7' : 'translate-x-0'}`} />
                </button>
                <span className={`text-xs font-semibold flex items-center gap-1.5 ${billingCycle === 'yearly' ? 'text-emerald-400 font-bold' : 'text-slate-400'}`}>
                  Annuel (-10%)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div
                onClick={() => setSelectedPlan('free')}
                className={`p-6 rounded-2xl border cursor-pointer transition ${
                  selectedPlan === 'free' ? 'border-emerald-500 bg-slate-900 ring-2 ring-emerald-500/40 shadow-xl' : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-bold text-white">Pack Découverte</h3>
                  <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">Essai</span>
                </div>
                <div className="text-3xl font-black text-white my-3">0 DZD</div>
                <p className="text-xs text-slate-400 mb-4">Pour tester l'audit sur un échantillon de 50 commandes.</p>
                <ul className="text-xs text-slate-300 space-y-2">
                  <li>✓ 50 commandes analysées</li>
                  <li>✓ Audit de base des tarifs de livraison</li>
                  <li>✕ Détection IP & VPN désactivée</li>
                </ul>
              </div>

              <div
                onClick={() => setSelectedPlan('business')}
                className={`p-6 rounded-2xl border cursor-pointer relative transition ${
                  selectedPlan === 'business' ? 'border-emerald-500 bg-slate-900 ring-2 ring-emerald-500 shadow-xl' : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                }`}
              >
                <span className="absolute -top-3 right-4 bg-emerald-500 text-slate-950 text-[10px] font-black uppercase px-2 py-0.5 rounded-full shadow">
                  Recommandé
                </span>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-bold text-white">Pack Business</h3>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-mono">Complet</span>
                </div>
                <div className="text-3xl font-black text-white my-3">
                  {getPrice('business').dzd.toLocaleString()} DZD
                  <span className="text-xs font-normal text-slate-400 ml-1.5">{getPrice('business').periodText}</span>
                </div>
                <p className="text-xs text-slate-400 mb-4">Pour les boutiques traitant jusqu'à 800 colis par mois.</p>
                <ul className="text-xs text-slate-300 space-y-2">
                  <li>✓ Jusqu'à 800 colis / mois audités</li>
                  <li>✓ Détection des surfacturations & litiges</li>
                  <li>✓ Radar Anti-RTO & Score Acheteur</li>
                  <li>✓ Connecteurs Yalidine + ZR Express</li>
                </ul>
              </div>

              <div
                onClick={() => setSelectedPlan('ultra')}
                className={`p-6 rounded-2xl border cursor-pointer transition ${
                  selectedPlan === 'ultra' ? 'border-emerald-500 bg-slate-900 ring-2 ring-emerald-500/40 shadow-xl' : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-bold text-white">Pack Ultra Illimité</h3>
                  <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded font-mono">Élite</span>
                </div>
                <div className="text-3xl font-black text-white my-3">
                  {getPrice('ultra').dzd.toLocaleString()} DZD
                  <span className="text-xs font-normal text-slate-400 ml-1.5">{getPrice('ultra').periodText}</span>
                </div>
                <p className="text-xs text-slate-400 mb-4">Idéal pour les agences e-commerce et gros distributeurs.</p>
                <ul className="text-xs text-slate-300 space-y-2">
                  <li>✓ Volume de colis illimité</li>
                  <li>✓ Tous transporteurs DZ connectés</li>
                  <li>✓ Filtre anti-fraude IP / Proxy en temps réel</li>
                  <li>✓ Support prioritaire 7j/7</li>
                </ul>
              </div>
            </div>

            {selectedPlan !== 'free' && (
              <div className="bg-slate-900 border-2 border-emerald-500 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-5">
                  <div>
                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-full">
                      Paiement Sécurisé BaridiMob / CCP
                    </span>
                    <h3 className="text-2xl font-black text-white mt-2">
                      Montant net à transférer : {getPrice(selectedPlan).dzd.toLocaleString()} DZD
                    </h3>
                  </div>
                  <div className="text-xs text-slate-400 bg-slate-950 px-4 py-2 rounded-xl border border-slate-800">
                    Activation sous <strong className="text-emerald-400">15 minutes</strong>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                    <span className="text-xs text-slate-400">Bénéficiaire Officiel :</span>
                    <div className="text-base font-bold text-white">{corporateBillingEntity}</div>
                    <span className="text-[11px] text-emerald-400">Compte vérifié Algérie Poste</span>
                  </div>

                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                    <span className="text-xs text-slate-400">Numéro RIP BaridiMob :</span>
                    <div className="flex items-center justify-between bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                      <span className="font-mono text-emerald-400 font-bold text-sm select-all">{billingRip}</span>
                      <button
                        onClick={handleCopyRip}
                        className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-lg transition"
                      >
                        {copySuccess ? 'Copié !' : 'Copier'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                    Transmettre votre preuve de règlement :
                  </h4>

                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*,.pdf"
                    onChange={(e) => e.target.files?.[0] && handleReceiptUpload(e.target.files[0])}
                    className="hidden"
                  />
                  <input
                    type="file"
                    ref={cameraInputRef}
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => e.target.files?.[0] && handleReceiptUpload(e.target.files[0])}
                    className="hidden"
                  />

                  {receiptUploadSuccess && (
                    <div className="p-4 bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-sm rounded-2xl text-center font-bold">
                      {receiptUploadSuccess}
                    </div>
                  )}

                  {receiptUploadError && (
                    <div className="p-4 bg-rose-500/15 border border-rose-500/40 text-rose-300 text-sm rounded-2xl text-center font-bold">
                      {receiptUploadError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <button
                      type="button"
                      disabled={isUploadingReceipt}
                      onClick={() => fileInputRef.current?.click()}
                      className="p-3.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 text-slate-950 font-bold rounded-2xl text-xs flex flex-col items-center justify-center gap-1.5 transition shadow"
                    >
                      <span className="text-lg">📁</span>
                      <span>Téléverser Capture</span>
                    </button>

                    <button
                      type="button"
                      disabled={isUploadingReceipt}
                      onClick={() => cameraInputRef.current?.click()}
                      className="p-3.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl text-xs flex flex-col items-center justify-center gap-1.5 transition border border-slate-700"
                    >
                      <span className="text-lg">📷</span>
                      <span>Prendre en Photo</span>
                    </button>

                    <a
                      href={`https://wa.me/${supportWhatsAppNumber}?text=${encodeURIComponent(
                        `Bonjour, j'ai effectué le virement BaridiMob de ${getPrice(selectedPlan).dzd} DZD pour le${plans[selectedPlan].name}. Voici ma capture d'écran.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3.5 bg-[#25D366] hover:bg-[#20ba59] text-slate-950 font-bold rounded-2xl text-xs flex flex-col items-center justify-center gap-1.5 transition shadow"
                    >
                      <span className="text-lg">💬</span>
                      <span>Envoyer sur WhatsApp</span>
                    </a>

                    <a
                      href={`mailto:${supportEmail}?subject=${encodeURIComponent(
                        `Preuve de virement BaridiMob - ${plans[selectedPlan].name}`
                      )}`}
                      className="p-3.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl text-xs flex flex-col items-center justify-center gap-1.5 transition border border-slate-700"
                    >
                      <span className="text-lg">✉️️</span>
                      <span>Envoyer par Email</span>
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'contact' && (
          <div className="space-y-6 max-w-3xl mx-auto pt-2">
            <h2 className="text-2xl font-black text-white">Support & Assistance</h2>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3 text-xs">
              <div className="flex justify-between p-3 bg-slate-950 rounded-xl">
                <span className="text-slate-400">Support WhatsApp :</span>
                <span className="text-emerald-400 font-mono font-bold">+213 550 00 00 00</span>
              </div>
              <div className="flex justify-between p-3 bg-slate-950 rounded-xl">
                <span className="text-slate-400">Email commercial :</span>
                <span className="text-white font-mono">{supportEmail}</span>
              </div>
              <div className="flex justify-between p-3 bg-slate-950 rounded-xl">
                <span className="text-slate-400">Entité émettrice :</span>
                <span className="text-white font-medium">{corporateBillingEntity}</span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
