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

  const corporateBillingEntity = "COD Reconciliation DZ — Service Comptabilité & Licences";
  const billingRip = "00799999000232882074";
  const supportWhatsAppNumber = "213699000082";
  const supportEmail = "weekyfy@gmail.com";
  const webhookSecretToken = "recon_sec_live_dz2026";

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

  const downloadSampleYalidine = () => {
    const csvContent =
      "Tracking,Destinataire,Wilaya,Frais_Preleves_DZD,Statut_Livraison\n" +
      "yal_crm_965374,Tarek Brahimi,Blida (09),250,Livre\n" +
      "yal_crm_476503,Abderrahmane Ziani,Boumerdes (35),550,Retour Client Injoignable\n" +
      "yal_live_109841,Karim Benali,Alger (16),250,Livre\n";

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
      "zr_live_33491,Farid Khelifa,Constantine (25),250,Colis Livre Encaissé\n";

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'zr_express_quittance_reelle_demo.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const [receiptUploadSuccess, setReceiptUploadSuccess] = useState<string | null>(null);
  const [receiptUploadError, setReceiptUploadError] = useState<string | null>(null);

  const handleReceiptUpload = async (file: File) => {
    setIsUploadingReceipt(true);
    try {
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `recu_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('baridimob-receipts').upload(fileName, file);
      if (uploadError) throw new Error(uploadError.message);

      const { data: { publicUrl } } = supabase.storage.from('baridimob-receipts').getPublicUrl(fileName);
      await supabase.from('payment_receipts').insert([{ receipt_url: publicUrl, amount_dzd: getPrice(selectedPlan).dzd, plan_selected: `${selectedPlan}_${billingCycle}`, status: 'PENDING' }]);
      setReceiptUploadSuccess("✓ Reçu BaridiMob transmis avec succès ! Validé sous 15 minutes.");
    } catch (err: any) {
      setReceiptUploadError(`Erreur : ${err.message}`);
    } finally {
      setIsUploadingReceipt(false);
    }
  };

  const [crmOrders, setCrmOrders] = useState<OrderFraudItem[]>([]);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);

  const fetchCrmFromSupabase = async () => {
    try {
      const { data, error } = await supabase.from('crm_orders').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      if (data && data.length > 0) {
        setCrmOrders(data.map(d => ({
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
        })));
      }
    } catch (err) {
      console.log("Supabase fetch error:", err);
    }
  };

  useEffect(() => {
    fetchCrmFromSupabase();
  }, []);

  const csvFileRef = useRef<HTMLInputElement>(null);
  const [csvFileName, setCsvFileName] = useState<string | null>(null);
  const [isAuditingCsv, setIsAuditingCsv] = useState(false);

  const [rtoAudits, setRtoAudits] = useState<RtoAuditRow[]>([
    { tracking: "yal_ret_104821", carrier: "Yalidine Express", customerName: "Destinataire #1048", wilaya: "Boumerdès (35)", returnReason: "Client Injoignable", negotiatedReturnFee: 200, chargedReturnFee: 550, overchargedFee: 350, callLogVerified: false, status: "OVERCHARGED" }
  ]);

  const [auditStats, setAuditStats] = useState({ totalRows: 1, overchargedCount: 1, totalOverchargedDzd: 350, totalRecoverableDzd: 350 });

  const handleProcessCsv = (file: File) => {
    setCsvFileName(file.name);
    setIsAuditingCsv(true);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim() !== '');
      let matchedCount = 0;
      const quittanceRows: { tracking: string; status: string; customer: string }[] = [];

      lines.slice(1).forEach((line, idx) => {
        const cols = line.split(/[,;\t]/);
        if (cols.length >= 3) {
          quittanceRows.push({ tracking: cols[0]?.trim() || '', status: cols[4]?.trim() || 'Livre', customer: cols[1]?.trim() || '' });
        }
      });

      setCrmOrders(prev => prev.map(ord => {
        const match = quittanceRows.find(q => ord.trackingNumber && q.tracking.toLowerCase().includes(ord.trackingNumber.toLowerCase()));
        if (match) {
          matchedCount++;
          const newStatus = match.status.toLowerCase().includes('livr') ? 'LIVRÉ_ET_ENCAISSÉ' : 'RETOUR_SURFACTURÉ';
          if (ord.id) supabase.from('crm_orders').update({ delivery_status: newStatus }).eq('id', ord.id).then();
          return { ...ord, deliveryStatus: newStatus };
        }
        return ord;
      }));

      setTimeout(() => {
        setIsAuditingCsv(false);
        setSyncStatusMsg(`✓ Quittance auditée ! ${matchedCount} commandes synchronisées.`);
      }, 600);
    };
    reader.readAsText(file);
  };

  const handleSimulateCrmOrder = async (platform: 'YouCan' | 'Shopify' | 'Ayor') => {
    let payload = platform === 'Ayor' ? { platform: "ayor", ayor_order_id: `AYOR-${Math.floor(1000 + Math.random() * 9000)}`, name: "Abderrahmane Ziani", phone: "0771239845", wilaya: "Boumerdès (35)", total_price: 6400, ip: "105.105.88.22", is_vpn: false } :
                  platform === 'Shopify' ? { order_number: Math.floor(1000 + Math.random() * 9000), name: `#${Math.floor(1000 + Math.random() * 9000)}`, shipping_address: { name: "Selma Benali", phone: "0550482914", province: "Alger (16)" }, total_price: 8900, ip: "105.101.42.18", is_vpn: false } :
                  { data: { order_id: Math.floor(1000 + Math.random() * 9000), customer: { first_name: "Tarek", last_name: "Brahimi", phone: "0661998877" }, shipping_address: { state: "Blida (09)" }, total: 4500 }, ip: "105.102.14.99", is_vpn: false };

    try {
      const res = await fetch('/api/orders/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-webhook-secret': webhookSecretToken },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success && data.order) {
        setCrmOrders(prev => [data.order, ...prev]);
        alert(`✓ Commande ${data.order.orderId} reçue de ${platform} et ajoutée au CRM !`);
      } else {
        alert(data.error || "Erreur webhook");
      }
    } catch (e) {
      alert("Erreur communication webhook");
    }
  };

  const exportDisputeCsv = () => {
    const headers = "Tracking;Transporteur;Client;Wilaya;Motif;Trop_Percu_Reclame_DZD\n";
    const body = rtoAudits.map(r => `${r.tracking};${r.carrier};${r.customerName};${r.wilaya};${r.returnReason};${r.overchargedFee}`).join('\n');
    const blob = new Blob([headers + body], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `litiges_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const deliveredTotalDzd = crmOrders.filter(o => o.deliveryStatus === 'LIVRÉ_ET_ENCAISSÉ').reduce((acc, curr) => acc + (curr.codAmountDzd || 0), 0);
  const pendingTotalDzd = crmOrders.filter(o => o.deliveryStatus !== 'LIVRÉ_ET_ENCAISSÉ' && o.status === 'APPROUVE').reduce((acc, curr) => acc + (curr.codAmountDzd || 0), 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans">
      <aside className="w-72 border-r border-slate-800 bg-slate-900/80 p-5 flex flex-col justify-between hidden md:flex shrink-0">
        <div className="space-y-6">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center font-black text-slate-950 text-base shadow-lg shadow-emerald-500/20">COD</div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-white block">Reconciliation DZ</span>
              <span className="text-[10px] text-emerald-400 font-semibold tracking-wider uppercase">Espace Marchand</span>
            </div>
          </div>

          <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1.5">
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-slate-400 font-medium">Statut Licence :</span>
              <span className="font-bold text-emerald-400">Actif (Pack Business)</span>
            </div>
            <div className="text-[10px] text-slate-400">Valide encore {subscriptionDaysLeft} jours</div>
          </div>

          <Link href="/guide" className="block p-3 rounded-xl bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/30 hover:border-emerald-400 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">📖 Guide & Annuaire Valeur</span>
              <span className="text-[10px] bg-emerald-500 text-slate-950 font-bold px-1.5 py-0.5 rounded">WIKI</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Comprendre comment récupérer vos marges.</p>
          </Link>

          <nav className="space-y-1 text-xs">
            <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Moteur d'Audit & P&L</div>

            <button
              onClick={() => setActiveTab('import_csv')}
              className={`w-full text-left px-3 py-2.5 rounded-xl font-semibold transition flex items-center justify-between ${activeTab === 'import_csv' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              <span className="flex items-center gap-2">📁 Import Quittances</span>
              <span className="px-2 py-0.5 text-[10px] bg-rose-500/20 text-rose-400 rounded-full font-bold">1 Litige</span>
            </button>

            <button
              onClick={() => setActiveTab('orders_fraud')}
              className={`w-full text-left px-3 py-2.5 rounded-xl font-semibold transition flex items-center justify-between ${activeTab === 'orders_fraud' ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              <span className="flex items-center gap-2">⚡ CRM Commandes</span>
              <span className="px-1.5 py-0.5 text-[9px] bg-indigo-500 text-white rounded font-bold">{crmOrders.length}</span>
            </button>

            <button
              onClick={() => setActiveTab('billing')}
              className={`w-full text-left px-3 py-2.5 rounded-xl font-semibold transition flex items-center justify-between ${activeTab === 'billing' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              <span className="flex items-center gap-2">💳 Forfaits & Règlements</span>
              <span className="px-1.5 py-0.5 text-[9px] bg-emerald-500/20 text-emerald-300 rounded font-bold">BaridiMob</span>
            </button>

            <button
              onClick={() => setActiveTab('api_settings')}
              className={`w-full text-left px-3 py-2.5 rounded-xl font-semibold transition flex items-center justify-between ${activeTab === 'api_settings' ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30' : 'text-slate-300 hover:bg-slate-800'}`}
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
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        {activeTab === 'orders_fraud' && (
          <div className="space-y-6 max-w-7xl mx-auto">
            {/* ENTÊTE AVEC BOUTONS FORCÉS SUR UNE LIGNE (FLEX-NOWRAP & GAP OPTIMISÉ) */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-slate-900/50 p-6 rounded-3xl border border-slate-800/80 shadow-lg">
              <div>
                <span className="text-xs bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                  CRM Unifié E-commerce & Transporteurs
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
                  Suivi des Commandes & Rapprochement Quittances
                </h1>
                <p className="text-slate-400 text-xs mt-1">
                  Commandes persistées dans Supabase et croisées automatiquement lors de l'import des bordereaux.
                </p>
              </div>

              {/* BOUTONS D'ACTION ALIGNÉS SUR UNE LIGNE UNIQUE SANS RETOUR À LA LIGNE */}
              <div className="flex items-center gap-2 shrink-0 overflow-x-auto pb-1 xl:pb-0">
                <button
                  onClick={() => setActiveTab('import_csv')}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-3.5 py-2.5 rounded-xl text-xs transition shadow whitespace-nowrap flex items-center gap-1.5"
                >
                  <span>📁</span> Quittance
                </button>
                <button
                  onClick={() => handleSimulateCrmOrder('Ayor')}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3.5 py-2.5 rounded-xl text-xs transition shadow whitespace-nowrap"
                >
                  + Ayor
                </button>
                <button
                  onClick={() => handleSimulateCrmOrder('YouCan')}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3.5 py-2.5 rounded-xl text-xs transition shadow whitespace-nowrap"
                >
                  + YouCan
                </button>
                <button
                  onClick={() => handleSimulateCrmOrder('Shopify')}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-3.5 py-2.5 rounded-xl text-xs transition shadow whitespace-nowrap"
                >
                  + Shopify
                </button>
              </div>
            </div>

            {syncStatusMsg && (
              <div className="p-4 bg-emerald-500/15 border-2 border-emerald-500/40 text-emerald-300 text-xs rounded-2xl font-bold shadow-lg flex justify-between items-center">
                <span>{syncStatusMsg}</span>
                <button onClick={() => setSyncStatusMsg(null)} className="text-white hover:text-rose-400">✕</button>
              </div>
            )}

            {/* CARTES STATS HARMONISÉES */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow">
                <span className="text-xs text-slate-400">Total Commandes Captées</span>
                <div className="text-3xl font-black text-white mt-1">{crmOrders.length}</div>
                <span className="text-[11px] text-slate-400">Enregistrées dans Supabase</span>
              </div>
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow">
                <span className="text-xs text-slate-400">Montant Net Encaissé</span>
                <div className="text-2xl font-black text-emerald-400 mt-1 font-mono">{deliveredTotalDzd.toLocaleString()} DZD</div>
                <span className="text-[11px] text-emerald-300">Rapprochement validé</span>
              </div>
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow">
                <span className="text-xs text-slate-400">Trésorerie en Acheminement</span>
                <div className="text-2xl font-black text-cyan-400 mt-1 font-mono">{pendingTotalDzd.toLocaleString()} DZD</div>
                <span className="text-[11px] text-cyan-300">En attente de versement</span>
              </div>
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow">
                <span className="text-xs text-slate-400">Alertes Fraude / VPN</span>
                <div className="text-3xl font-black text-rose-400 mt-1">{crmOrders.filter(o => o.status !== 'APPROUVE').length}</div>
                <span className="text-[11px] text-rose-300">Expéditions évitées</span>
              </div>
            </div>

            {/* TABLEAU CRM */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
              <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/70">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>📋</span> Registre CRM des Commandes & Suivi Transporteurs
                </h3>
                <button
                  onClick={fetchCrmFromSupabase}
                  className="text-xs text-emerald-400 hover:underline flex items-center gap-1 font-mono bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800"
                >
                  <span>🔄</span> Actualiser depuis Supabase
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-mono">
                    <tr>
                      <th className="p-4">Plateforme</th>
                      <th className="p-4">N° Commande</th>
                      <th className="p-4">Destinataire & Wilaya</th>
                      <th className="p-4">Téléphone</th>
                      <th className="p-4">Montant COD</th>
                      <th className="p-4">Transporteur & Tracking</th>
                      <th className="p-4">Contrôle Fraude</th>
                      <th className="p-4 text-right">Statut Expédition</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {crmOrders.map((ord, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30 transition">
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded text-[10px] font-black uppercase ${
                            ord.sourcePlatform === 'Ayor' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40' :
                            ord.sourcePlatform === 'Shopify' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40' :
                            'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          }`}>
                            {ord.sourcePlatform || 'YouCan'}
                          </span>
                        </td>
                        <td className="p-4 font-mono font-bold text-white">{ord.orderId}</td>
                        <td className="p-4">
                          <div className="font-bold text-slate-200">{ord.customerName}</div>
                          <div className="text-[10px] text-slate-400">{ord.wilaya || 'Algérie'}</div>
                        </td>
                        <td className="p-4 font-mono text-slate-300">{ord.phone}</td>
                        <td className="p-4 font-mono font-bold text-white">{(ord.codAmountDzd || 4500).toLocaleString()} DZD</td>
                        <td className="p-4">
                          <div className="text-slate-300 font-medium">{ord.carrier || 'Yalidine Express'}</div>
                          <div className="font-mono text-[10px] text-emerald-400 select-all">{ord.trackingNumber || 'yal_crm_965374'}</div>
                        </td>
                        <td className="p-4">
                          {ord.isVpn ? (
                            <span className="px-2.5 py-1 bg-rose-500/20 text-rose-400 font-bold rounded text-[10px] border border-rose-500/40">🚨 VPN Détecté</span>
                          ) : (
                            <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 font-bold rounded text-[10px]">✓ Score {ord.score}/100</span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black inline-block ${
                            ord.deliveryStatus === 'LIVRÉ_ET_ENCAISSÉ' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' :
                            ord.deliveryStatus === 'RETOUR_SURFACTURÉ' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' :
                            'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}>
                            {ord.deliveryStatus === 'LIVRÉ_ET_ENCAISSÉ' ? '✓ LIVRÉ & ENCAISSÉ' :
                             ord.deliveryStatus === 'RETOUR_SURFACTURÉ' ? '⚠️ RETOUR SURFACTURÉ' :
                             'EN ATTENTE D\'EXPÉDITION'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ONGLET IMPORT QUITTANCES */}
        {activeTab === 'import_csv' && (
          <div className="space-y-6 max-w-6xl mx-auto pt-2">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-800/80 pb-5">
              <div>
                <span className="text-xs bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full font-bold uppercase tracking-wider">Moteur d'Audit & Rapprochement</span>
                <h1 className="text-3xl font-extrabold text-white tracking-tight mt-1">Importateur & Rapprochement de Quittances</h1>
                <p className="text-slate-400 text-xs mt-1">Déposez un bordereau Yalidine ou ZR pour synchroniser instantanément les statuts CRM.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={downloadSampleYalidine} className="bg-blue-600/20 text-blue-300 border border-blue-500/40 px-3.5 py-2 rounded-xl text-xs font-bold transition">📥 Exemple Yalidine (.CSV)</button>
                <button onClick={downloadSampleZR} className="bg-amber-600/20 text-amber-300 border border-amber-500/40 px-3.5 py-2 rounded-xl text-xs font-bold transition">📥 Exemple ZR Express (.CSV)</button>
              </div>
            </div>

            <div onClick={() => csvFileRef.current?.click()} className="border-2 border-dashed border-emerald-500/40 hover:border-emerald-400 bg-slate-900/60 rounded-3xl p-12 text-center cursor-pointer transition flex flex-col items-center gap-3">
              <input type="file" ref={csvFileRef} accept=".csv,.xlsx" onChange={(e) => e.target.files?.[0] && handleProcessCsv(e.target.files[0])} className="hidden" />
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-3xl font-black">📥</div>
              <h3 className="text-base font-bold text-white">{csvFileName ? `Fichier : ${csvFileName}` : "Glissez-déposez la quittance ou cliquez ici"}</h3>
              <button type="button" className="mt-2 bg-emerald-500 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-xs">{isAuditingCsv ? "Traitement..." : "Sélectionner un fichier"}</button>
            </div>
          </div>
        )}

        {/* ONGLET FACTURATION */}
        {activeTab === 'billing' && (
          <div className="space-y-8 max-w-5xl mx-auto pt-4">
            <h1 className="text-3xl font-black text-white text-center">Abonnements & Règlements BaridiMob</h1>
            <div className="bg-slate-900 border-2 border-emerald-500 rounded-3xl p-8 space-y-6 shadow-2xl">
              <h3 className="text-2xl font-black text-white">Pack Business : <span className="text-emerald-400 font-mono">2 000 DZD / mois</span></h3>
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-xs text-slate-400">Numéro RIP BaridiMob Officiel :</span>
                <div className="flex items-center justify-between bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <span className="font-mono text-emerald-400 font-bold text-sm">{billingRip}</span>
                  <button onClick={() => { navigator.clipboard.writeText(billingRip); alert("RIP Copié !"); }} className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-emerald-500 text-slate-950">Copier RIP</button>
                </div>
              </div>
              <a href={`https://wa.me/${supportWhatsAppNumber}?text=${encodeURIComponent("Bonjour, j'ai effectué le virement BaridiMob de 2 000 DZD pour le Pack Business.")}`} target="_blank" rel="noopener noreferrer" className="block w-full p-4 bg-[#25D366] text-slate-950 font-bold rounded-2xl text-center text-xs">💬 Confirmer le paiement sur WhatsApp (+213 699 00 00 82)</a>
            </div>
          </div>
        )}

        {/* ONGLET API */}
        {activeTab === 'api_settings' && (
          <div className="space-y-6 max-w-5xl mx-auto pt-4">
            <h1 className="text-3xl font-extrabold text-white">Intégration YouCan, Shopify & Ayor</h1>
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-4">
              <span className="text-xs text-slate-400 font-bold">URL Webhook (POST) :</span>
              <input type="text" readOnly value="https://saas-cod-recon-2026.vercel.app/api/orders/webhook" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs font-mono text-emerald-400 select-all" />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
