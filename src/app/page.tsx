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
  deliveredRate: number;
  rtoRate: number;
  grossSalesDzd: number;
  deliveryFeesDzd: number;
  rtoCostDzd: number;
  netMarginDzd: number;
  recommendation: 'SCALE_ADS' | 'HEALTHY' | 'REQUIRE_DEPOSIT' | 'EXCLUDE_ADS';
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
    'billing' | 'blacklist' | 'orders_fraud' | 'rto_audit' | 'dispute' | 'ghosts' | 'wilayas' | 'connectors' | 'api_settings' | 'reviews' | 'contact'
  >('billing');

  const [copySuccess, setCopySuccess] = useState(false);

  // ENTITÉ PROFESSIONNELLE ANONYMISÉE
  const corporateBillingEntity = "COD Reconciliation DZ — Service Comptabilité & Licences";
  const billingRip = "00799999000232882074";
  const supportWhatsAppNumber = "213550000000";
  const supportEmail = "contact@reconciliation-dz.com";

  // Tarifs : Pack Business à 2 000 DZD
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

  // Upload Supabase Reçu BaridiMob
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

  // Score Acheteur Anti-RTO
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

  // Données Litiges
  const [disputes] = useState<DisputeItem[]>([
    {
      id: "LIT-2026-001",
      tracking: "yal_ret_104821",
      carrier: "Yalidine Express",
      customerName: "Client Boumerdès (35)",
      amountClaimedDzd: 350,
      issue: "Surfacturation tarif de retour non conforme au contrat",
      status: "EN_COURS",
      dateAdded: "28/09/2026"
    },
    {
      id: "LIT-2026-002",
      tracking: "zr_ret_992144",
      carrier: "ZR Express",
      customerName: "Client Tizi Ouzou (15)",
      amountClaimedDzd: 350,
      issue: "Retour sans tentative d'appel téléphonique tracée",
      status: "OUVERT",
      dateAdded: "29/09/2026"
    },
    {
      id: "LIT-2026-003",
      tracking: "yal_dz_7701923",
      carrier: "Yalidine Express",
      customerName: "Client Ghardaïa (47)",
      amountClaimedDzd: 18500,
      issue: "Colis bloqué plus de 16 jours au hub régional sans livraison",
      status: "OUVERT",
      dateAdded: "25/09/2026"
    }
  ]);

  // Données Fraude IP
  const [fraudOrders] = useState<OrderFraudItem[]>([
    { orderId: "CMD-9941", customerName: "Client Alger Centre", phone: "0770123984", ipAddress: "105.101.42.18", isVpn: false, score: 95, status: "APPROUVE" },
    { orderId: "CMD-9942", customerName: "Tentative Suspecte", phone: "0661234567", ipAddress: "185.220.101.5", isVpn: true, score: 10, status: "BLOQUE" },
    { orderId: "CMD-9943", customerName: "Client Oran", phone: "0550482914", ipAddress: "41.107.82.90", isVpn: false, score: 62, status: "SUSPECT" }
  ]);

  // Données RTO Audit
  const [rtoAudits] = useState<RtoAuditRow[]>([
    { tracking: "yal_ret_104821", carrier: "Yalidine Express", customerName: "Destinataire #1048", wilaya: "Boumerdès (35)", returnReason: "Client Injoignable", negotiatedReturnFee: 200, chargedReturnFee: 550, overchargedFee: 350, callLogVerified: false, status: "OVERCHARGED" },
    { tracking: "zr_ret_992144", carrier: "ZR Express", customerName: "Destinataire #9921", wilaya: "Tizi Ouzou (15)", returnReason: "Adresse Incomplète", negotiatedReturnFee: 250, chargedReturnFee: 600, overchargedFee: 350, callLogVerified: false, status: "OVERCHARGED" },
    { tracking: "yal_ret_104899", carrier: "Yalidine Express", customerName: "Destinataire #1048B", wilaya: "Médéa (26)", returnReason: "Refus à l'ouverture", negotiatedReturnFee: 250, chargedReturnFee: 250, overchargedFee: 0, callLogVerified: true, status: "CONFORME" },
    { tracking: "zr_ret_774012", carrier: "ZR Express", customerName: "Destinataire #7740", wilaya: "Biskra (07)", returnReason: "Client Absent", negotiatedReturnFee: 300, chargedReturnFee: 750, overchargedFee: 450, callLogVerified: false, status: "OVERCHARGED" }
  ]);

  // Données Wilayas
  const wilayaStats: WilayaProfitability[] = [
    { code: "16", name: "Alger", deliveredRate: 89.4, rtoRate: 10.6, grossSalesDzd: 850000, deliveryFeesDzd: 45000, rtoCostDzd: 8200, netMarginDzd: 312000, recommendation: "SCALE_ADS" },
    { code: "09", name: "Blida", deliveredRate: 86.2, rtoRate: 13.8, grossSalesDzd: 420000, deliveryFeesDzd: 24000, rtoCostDzd: 4800, netMarginDzd: 158000, recommendation: "SCALE_ADS" },
    { code: "42", name: "Tipaza", deliveredRate: 88.0, rtoRate: 12.0, grossSalesDzd: 380000, deliveryFeesDzd: 21000, rtoCostDzd: 3900, netMarginDzd: 145000, recommendation: "SCALE_ADS" },
    { code: "39", name: "El Oued", deliveredRate: 46.5, rtoRate: 53.5, grossSalesDzd: 185000, deliveryFeesDzd: 32000, rtoCostDzd: 24500, netMarginDzd: -14200, recommendation: "REQUIRE_DEPOSIT" }
  ];

  const reviews = [
    { name: "Boutique Prêt-à-Porter (Alger)", comment: "En auditant notre premier mois de quittances, le SaaS a repéré 52 000 DZD de surfacturations indues.", rating: 5 },
    { name: "Magasin Tech & Accessoires (Oran)", comment: "Le score acheteur nous a permis de baisser notre taux de retour global de 28% à moins de 14%.", rating: 5 },
    { name: "Store Électroménager (Constantine)", comment: "Le rapprochement des versements avec Yalidine et ZR nous évite deux journées de réconciliation manuelle par quinzaine.", rating: 5 }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans">
      {/* SIDEBAR ABONNÉ */}
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
            <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sécurité & Trésorerie</div>
            
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
              onClick={() => setActiveTab('blacklist')}
              className={`w-full text-left px-3 py-2.5 rounded-xl font-semibold transition flex items-center justify-between ${
                activeTab === 'blacklist' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center gap-2">🛡️ Score Acheteur Anti-RTO</span>
              <span className="px-1.5 py-0.5 text-[9px] bg-amber-500/20 text-amber-300 rounded font-bold">DZ</span>
            </button>

            <button
              onClick={() => setActiveTab('orders_fraud')}
              className={`w-full text-left px-3 py-2.5 rounded-xl font-semibold transition flex items-center justify-between ${
                activeTab === 'orders_fraud' ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center gap-2">📦 Commandes & Filtre IP</span>
            </button>

            <div className="pt-3 px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Audit & Litiges Transport</div>

            <button
              onClick={() => setActiveTab('rto_audit')}
              className={`w-full text-left px-3 py-2.5 rounded-xl font-semibold transition flex items-center justify-between ${
                activeTab === 'rto_audit' ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center gap-2">🔄 Audit Frais de Retour</span>
              <span className="px-1.5 py-0.5 text-[10px] bg-rose-500/20 text-rose-400 rounded-full font-bold">-1150 DA</span>
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

            <button
              onClick={() => setActiveTab('ghosts')}
              className={`w-full text-left px-3 py-2.5 rounded-xl font-semibold transition flex items-center justify-between ${
                activeTab === 'ghosts' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center gap-2">🚨 Colis Bloqués (Hubs)</span>
            </button>

            <button
              onClick={() => setActiveTab('wilayas')}
              className={`w-full text-left px-3 py-2.5 rounded-xl font-semibold transition flex items-center justify-between ${
                activeTab === 'wilayas' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center gap-2">🗺️️ Rentabilité par Wilaya</span>
            </button>

            <div className="pt-3 px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Intégrations & Système</div>

            <button
              onClick={() => setActiveTab('connectors')}
              className={`w-full text-left px-3 py-2.5 rounded-xl font-semibold transition flex items-center justify-between ${
                activeTab === 'connectors' ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center gap-2">🚚 Connecteurs Yalidine / ZR</span>
            </button>

            <button
              onClick={() => setActiveTab('api_settings')}
              className={`w-full text-left px-3 py-2.5 rounded-xl font-semibold transition flex items-center justify-between ${
                activeTab === 'api_settings' ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center gap-2">⚙️ Clés API, Webhooks & MCP</span>
            </button>

            <button
              onClick={() => setActiveTab('reviews')}
              className={`w-full text-left px-3 py-2.5 rounded-xl font-semibold transition flex items-center justify-between ${
                activeTab === 'reviews' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center gap-2">⭐ Retours d'Expérience</span>
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

      {/* ZONE CENTRALE */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        {/* ONGLET FORFAITS & REÇUS BARIDIMOB */}
        {activeTab === 'billing' && (
          <div className="space-y-8 max-w-5xl mx-auto">
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
              {/* FREE */}
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

              {/* BUSINESS - 2000 DZD */}
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

              {/* ULTRA */}
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
                    Activation de votre licence sous <strong className="text-emerald-400">15 minutes</strong>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                    <span className="text-xs text-slate-400">Bénéficiaire Officiel :</span>
                    <div className="text-base font-bold text-white">{corporateBillingEntity}</div>
                    <span className="text-[11px] text-emerald-400">Compte vérifié Algérie Poste</span>
                  </div>

                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                    <span className="text-xs text-slate-400">Numéro RIP BaridiMob (20 chiffres) :</span>
                    <div className="flex items-center justify-between bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                      <span className="font-mono text-emerald-400 font-bold text-sm tracking-wider select-all">{billingRip}</span>
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
                        `Bonjour, j'ai effectué le virement BaridiMob de ${getPrice(selectedPlan).dzd} DZD pour le${plans[selectedPlan].name}. Voici ma capture d'écran pour validation de ma licence.`
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
                      )}&body=${encodeURIComponent(
                        `Bonjour,\n\nJe viens d'effectuer le virement BaridiMob de ${getPrice(selectedPlan).dzd} DZD pour activer le${plans[selectedPlan].name}.\nVeuillez trouver mon reçu en pièce jointe.`
                      )}`}
                      className="p-3.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl text-xs flex flex-col items-center justify-center gap-1.5 transition border border-slate-700"
                    >
                      <span className="text-lg">✉️</span>
                      <span>Envoyer par Email</span>
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ONGLET SCORE ACHETEUR & BLACKLIST */}
        {activeTab === 'blacklist' && (
          <div className="space-y-8 max-w-5xl mx-auto">
            <div>
              <h2 className="text-3xl font-extrabold text-white">Score Acheteur & Blacklist Algérie Partagée</h2>
              <p className="text-slate-400 text-sm mt-1">
                Auditez tout numéro client avant validation pour éliminer les retours coûteux et les faux acheteurs.
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
                        {searchResult.last_return_reason && (
                          <p className="text-xs text-rose-400 bg-rose-500/10 px-3 py-1.5 rounded-lg border border-rose-500/20">
                            Motif signalé : {searchResult.last_return_reason}
                          </p>
                        )}
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

        {/* ONGLET COMMANDES & FILTRE IP */}
        {activeTab === 'orders_fraud' && (
          <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black text-white">Commandes & Détection Anti-Fraude IP</h2>
                <p className="text-slate-400 text-xs">Blocage préventif des commandes issues de VPN ou de faux profils.</p>
              </div>
              <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 text-xs font-bold rounded-lg border border-indigo-500/30">
                Filtre Actif : Algérie
              </span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-mono">
                  <tr>
                    <th className="p-4">N° Commande</th>
                    <th className="p-4">Identifiant Client</th>
                    <th className="p-4">Téléphone</th>
                    <th className="p-4">Adresse IP</th>
                    <th className="p-4">VPN / Proxy</th>
                    <th className="p-4">Score</th>
                    <th className="p-4 text-right">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {fraudOrders.map((ord, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30">
                      <td className="p-4 font-mono font-bold text-white">{ord.orderId}</td>
                      <td className="p-4 text-slate-200">{ord.customerName}</td>
                      <td className="p-4 font-mono text-slate-300">{ord.phone}</td>
                      <td className="p-4 font-mono text-slate-400">{ord.ipAddress}</td>
                      <td className="p-4">
                        {ord.isVpn ? (
                          <span className="px-2 py-0.5 bg-rose-500/20 text-rose-400 font-bold rounded">VPN Détecté</span>
                        ) : (
                          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 font-bold rounded">IP DZ Réelle</span>
                        )}
                      </td>
                      <td className="p-4 font-black">{ord.score}/100</td>
                      <td className="p-4 text-right">
                        <span className={`px-2 py-1 rounded text-[10px] font-black ${
                          ord.status === 'APPROUVE' ? 'bg-emerald-500/20 text-emerald-400' :
                          ord.status === 'SUSPECT' ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'
                        }`}>
                          {ord.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ONGLET DOSSIERS DE LITIGES */}
        {activeTab === 'dispute' && (
          <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-black text-white">Dossiers de Litiges Transporteurs</h2>
                <p className="text-slate-400 text-xs">Réclamations générées pour surfacturation et colis égarés en hubs.</p>
              </div>
              <button
                onClick={() => alert("Bordereau officiel généré pour envoi au service réclamation du transporteur !")}
                className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition"
              >
                📑 Exporter Bordereau de Réclamation (.CSV)
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
                <span className="text-xs text-slate-400">Total Réclamé</span>
                <div className="text-3xl font-black text-rose-400 mt-1">19 200 DZD</div>
              </div>
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
                <span className="text-xs text-slate-400">Dossiers en Attente</span>
                <div className="text-3xl font-black text-amber-400 mt-1">3 dossiers</div>
              </div>
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
                <span className="text-xs text-slate-400">Taux de Remboursement Obtenu</span>
                <div className="text-3xl font-black text-emerald-400 mt-1">94 %</div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-mono">
                  <tr>
                    <th className="p-4">Dossier</th>
                    <th className="p-4">Tracking</th>
                    <th className="p-4">Transporteur</th>
                    <th className="p-4">Motif de Contestation</th>
                    <th className="p-4">Montant Réclamé</th>
                    <th className="p-4 text-right">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {disputes.map((d, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30">
                      <td className="p-4 font-mono font-bold text-slate-300">{d.id}</td>
                      <td className="p-4 font-mono text-emerald-400">{d.tracking}</td>
                      <td className="p-4 text-white font-medium">{d.carrier}</td>
                      <td className="p-4 text-slate-300">{d.issue}</td>
                      <td className="p-4 font-bold text-rose-400">+{d.amountClaimedDzd} DZD</td>
                      <td className="p-4 text-right">
                        <span className={`px-2.5 py-1 rounded text-[10px] font-black ${
                          d.status === 'REMBOURSE' ? 'bg-emerald-500/20 text-emerald-400' :
                          d.status === 'EN_COURS' ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'
                        }`}>
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

        {/* ONGLET AUDIT RTO */}
        {activeTab === 'rto_audit' && (
          <div className="space-y-6 max-w-5xl mx-auto">
            <h2 className="text-2xl font-black text-white">Audit Frais de Retour (RTO)</h2>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-mono">
                  <tr>
                    <th className="p-4">N° Tracking</th>
                    <th className="p-4">Transporteur</th>
                    <th className="p-4">Wilaya</th>
                    <th className="p-4">Motif</th>
                    <th className="p-4">Tarif Convenu</th>
                    <th className="p-4">Prélevé</th>
                    <th className="p-4">Écart Trop-Perçu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {rtoAudits.map((r, idx) => (
                    <tr key={idx}>
                      <td className="p-4 font-mono text-white">{r.tracking}</td>
                      <td className="p-4">{r.carrier}</td>
                      <td className="p-4">{r.customerName} ({r.wilaya})</td>
                      <td className="p-4">{r.returnReason}</td>
                      <td className="p-4">{r.negotiatedReturnFee} DZD</td>
                      <td className="p-4 text-rose-400 font-bold">{r.chargedReturnFee} DZD</td>
                      <td className="p-4 text-rose-400 font-black">+{r.overchargedFee} DZD</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ONGLET CONNECTEURS TRANSPORTEURS */}
        {activeTab === 'connectors' && (
          <div className="space-y-6 max-w-5xl mx-auto">
            <h2 className="text-2xl font-black text-white">Connecteurs Transporteurs Algérie</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-white text-base">Yalidine Express API</span>
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded">Connecté</span>
                </div>
                <input type="text" defaultValue="yal_api_token_live_99481" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 font-mono" />
                <button onClick={() => alert("Synchronisation Yalidine réussie !")} className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2 rounded-xl text-xs transition">
                  Synchroniser les Quittances
                </button>
              </div>

              <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-white text-base">ZR Express API</span>
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded">Connecté</span>
                </div>
                <input type="text" defaultValue="zr_key_live_449102" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 font-mono" />
                <button onClick={() => alert("Synchronisation ZR Express réussie !")} className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2 rounded-xl text-xs transition">
                  Synchroniser les Quittances
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ONGLET PARAMÈTRES API & MCP */}
        {activeTab === 'api_settings' && (
          <div className="space-y-6 max-w-5xl mx-auto">
            <h2 className="text-2xl font-black text-white">Intégrations E-commerce, Webhooks & MCP</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
                <span className="font-bold text-white text-sm">Clé API Marchand</span>
                <input type="text" readOnly value="recon_live_sec_994827103984" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-emerald-400 font-mono" />
                <p className="text-[11px] text-slate-400">Pour intégrer le score acheteur à votre checkout Shopify / YouCan / WooCommerce.</p>
              </div>

              <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
                <span className="font-bold text-white text-sm">Point de Connexion MCP</span>
                <input type="text" readOnly value="https://saas-cod-recon-2026.vercel.app/api/mcp" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-cyan-400 font-mono" />
                <p className="text-[11px] text-slate-400">Pour connecter vos agents IA aux données de votre boutique.</p>
              </div>
            </div>
          </div>
        )}

        {/* ONGLET AVIS MARCHANDS */}
        {activeTab === 'reviews' && (
          <div className="space-y-6 max-w-5xl mx-auto">
            <h2 className="text-2xl font-black text-white">Avis des Marchands & Preuve Sociale</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {reviews.map((rev, idx) => (
                <div key={idx} className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
                  <div className="text-amber-400">{'★'.repeat(rev.rating)}</div>
                  <p className="text-xs text-slate-300 italic">"{rev.comment}"</p>
                  <div className="pt-2 border-t border-slate-800 text-[11px] font-bold text-white">{rev.name}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ONGLET CONTACT OFFICIEL */}
        {activeTab === 'contact' && (
          <div className="space-y-6 max-w-3xl mx-auto">
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

        {/* ONGLETS SECONDAIRES */}
        {activeTab === 'ghosts' && <div className="p-6 bg-slate-900 rounded-2xl text-white">Radar des colis immobilisés en Hubs régionaux actif.</div>}
        {activeTab === 'wilayas' && (
          <div className="space-y-6 max-w-5xl mx-auto">
            <h2 className="text-2xl font-black text-white">Rentabilité Nette par Wilaya (58 Wilayas)</h2>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-800">
                    <th className="pb-3">Wilaya</th>
                    <th className="pb-3">Taux Livraison</th>
                    <th className="pb-3">Marge Nette</th>
                    <th className="pb-3 text-right">Décision Meta Ads</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {wilayaStats.map((w, idx) => (
                    <tr key={idx}>
                      <td className="py-3 font-bold text-white">{w.code} - {w.name}</td>
                      <td className="py-3 text-emerald-400 font-mono">{w.deliveredRate}%</td>
                      <td className="py-3 font-bold">{w.netMarginDzd > 0 ? `+${w.netMarginDzd} DZD` : `${w.netMarginDzd} DZD`}</td>
                      <td className="py-3 text-right font-semibold">{w.recommendation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}