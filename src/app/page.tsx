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
  deliveredRate: number;
  rtoRate: number;
  grossSalesDzd: number;
  deliveryFeesDzd: number;
  rtoCostDzd: number;
  netMarginDzd: number;
  recommendation: 'SCALE_ADS' | 'HEALTHY' | 'REQUIRE_DEPOSIT' | 'EXCLUDE_ADS';
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'blacklist' | 'billing' | 'wilayas' | 'rto_audit' | 'ghosts' | 'dispute' | 'crm'>('blacklist');
  const [copySuccess, setCopySuccess] = useState(false);

  // Coordonnées officielles du bénéficiaire
  const adminName = "ZOGHLAMI BADREDDINE";
  const adminRip = "00799999000232882074";

  // Tarifs & Abonnements
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'business' | 'ultra'>('business');

  // Supabase Upload Reçus BaridiMob
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const [receiptUploadSuccess, setReceiptUploadSuccess] = useState<string | null>(null);
  const [receiptUploadError, setReceiptUploadError] = useState<string | null>(null);

  // Module Score Acheteur & Blacklist
  const [searchPhone, setSearchPhone] = useState('');
  const [searchResult, setSearchResult] = useState<BuyerReputation | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearchingPhone, setIsSearchingPhone] = useState(false);

  // Formulaire d'ajout de signalement
  const [reportPhone, setReportPhone] = useState('');
  const [reportReason, setReportReason] = useState('Client Injoignable');
  const [reportWilaya, setReportWilaya] = useState('16');
  const [reportingStatus, setReportingStatus] = useState<string | null>(null);

  const plans = {
    free: { name: "Pack Découverte (Free)", monthlyDzd: 0, monthlyUsd: 0 },
    business: { name: "Pack Business", monthlyDzd: 1300, monthlyUsd: 10 },
    ultra: { name: "Pack Ultra Illimité", monthlyDzd: 4500, monthlyUsd: 15 }
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
    navigator.clipboard.writeText(adminRip);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
  };

  // UPLOAD SUPABASE BARIDIMOB
  const handleReceiptFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingReceipt(true);
    setReceiptUploadSuccess(null);
    setReceiptUploadError(null);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `recu_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('baridimob-receipts')
        .upload(fileName, file, { contentType: file.type, upsert: false });

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
      setReceiptUploadSuccess("✓ Reçu BaridiMob téléversé avec succès ! Votre compte sera activé sous 15 minutes.");
    } catch (err: any) {
      setReceiptUploadError(`Erreur : ${err.message || 'Impossible de joindre Supabase'}`);
    } finally {
      setIsUploadingReceipt(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // RECHERCHE SCORE ACHETEUR SUR SUPABASE
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

  // SIGNALER UN RETOUR / CLIENT INDÉLICAT
  const handleReportBuyer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportPhone.trim()) return;

    try {
      const cleanPhone = reportPhone.trim().replace(/\s+/g, '');

      // Vérifier si le numéro existe déjà
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
              trust_score: 20,
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
      alert("Erreur lors de l'enregistrement : " + err.message);
    }
  };

  // DONNÉES WILAYAS
  const wilayaStats: WilayaProfitability[] = [
    { code: "16", name: "Alger", deliveredRate: 89.4, rtoRate: 10.6, grossSalesDzd: 850000, deliveryFeesDzd: 45000, rtoCostDzd: 8200, netMarginDzd: 312000, recommendation: "SCALE_ADS" },
    { code: "09", name: "Blida", deliveredRate: 86.2, rtoRate: 13.8, grossSalesDzd: 420000, deliveryFeesDzd: 24000, rtoCostDzd: 4800, netMarginDzd: 158000, recommendation: "SCALE_ADS" },
    { code: "42", name: "Tipaza", deliveredRate: 88.0, rtoRate: 12.0, grossSalesDzd: 380000, deliveryFeesDzd: 21000, rtoCostDzd: 3900, netMarginDzd: 145000, recommendation: "SCALE_ADS" },
    { code: "39", name: "El Oued", deliveredRate: 46.5, rtoRate: 53.5, grossSalesDzd: 185000, deliveryFeesDzd: 32000, rtoCostDzd: 24500, netMarginDzd: -14200, recommendation: "REQUIRE_DEPOSIT" }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans">
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-64 border-r border-slate-800 bg-slate-900/60 p-6 flex flex-col justify-between hidden md:flex">
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center font-bold text-slate-950">
              COD
            </div>
            <span className="font-bold text-base tracking-tight text-white">Reconciliation DZ</span>
          </div>

          <nav className="space-y-1 text-sm">
            <button
              onClick={() => setActiveTab('blacklist')}
              className={`w-full text-left px-3 py-2.5 rounded-lg font-medium transition flex items-center justify-between ${
                activeTab === 'blacklist' ? 'bg-amber-500/10 text-amber-400 font-bold' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <span>🛡️ Score Acheteur Anti-RTO</span>
              <span className="px-1.5 py-0.5 text-[9px] bg-amber-500/20 text-amber-300 rounded font-bold">DZ</span>
            </button>
            <button
              onClick={() => setActiveTab('billing')}
              className={`w-full text-left px-3 py-2.5 rounded-lg font-medium transition flex items-center justify-between ${
                activeTab === 'billing' ? 'bg-emerald-500/10 text-emerald-400 font-bold' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <span>💳 Forfaits & Règlements</span>
              <span className="px-1.5 py-0.5 text-[9px] bg-emerald-500/20 text-emerald-400 rounded uppercase font-bold">BaridiMob</span>
            </button>
            <button
              onClick={() => setActiveTab('wilayas')}
              className={`w-full text-left px-3 py-2.5 rounded-lg font-medium transition flex items-center justify-between ${
                activeTab === 'wilayas' ? 'bg-emerald-500/10 text-emerald-400 font-bold' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <span>🗺️ Rentabilité par Wilaya</span>
            </button>
            <button
              onClick={() => setActiveTab('rto_audit')}
              className={`w-full text-left px-3 py-2.5 rounded-lg font-medium transition flex items-center justify-between ${
                activeTab === 'rto_audit' ? 'bg-rose-500/10 text-rose-400 font-bold' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <span>🔄 Audit Frais de Retour</span>
            </button>
            <button
              onClick={() => setActiveTab('ghosts')}
              className={`w-full text-left px-3 py-2.5 rounded-lg font-medium transition flex items-center justify-between ${
                activeTab === 'ghosts' ? 'bg-amber-500/10 text-amber-400 font-bold' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <span>🚨 Colis Fantômes (Hubs)</span>
            </button>
            <button
              onClick={() => setActiveTab('dispute')}
              className={`w-full text-left px-3 py-2.5 rounded-lg font-medium transition flex items-center justify-between ${
                activeTab === 'dispute' ? 'bg-rose-500/10 text-rose-400 font-bold' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <span>⚖️ Dossiers de Litiges</span>
            </button>
            <button
              onClick={() => setActiveTab('crm')}
              className={`w-full text-left px-3 py-2.5 rounded-lg font-medium transition flex items-center justify-between ${
                activeTab === 'crm' ? 'bg-emerald-500/10 text-emerald-400 font-bold' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <span>👥 CRM & Comptabilité</span>
            </button>
          </nav>
        </div>

        <div className="border-t border-slate-800 pt-4">
          <div className="text-xs text-slate-400 mb-1">Propriétaire SaaS :</div>
          <div className="text-sm font-semibold text-white">{adminName}</div>
          <div className="text-xs text-emerald-400 mb-3 font-medium">Bénéficiaire BaridiMob Actif</div>
          <Link href="/auth" className="text-xs text-rose-400 hover:underline">Déconnexion</Link>
        </div>
      </aside>

      {/* ZONE CENTRALE */}
      <main className="flex-1 p-8 overflow-y-auto">
        {/* ======================================================== */}
        {/* ONGLET 1 : SCORE ACHETEUR & BLACKLIST PARTAGÉE ANTI-RTO  */}
        {/* ======================================================== */}
        {activeTab === 'blacklist' && (
          <div className="space-y-8 max-w-5xl mx-auto">
            <div>
              <h2 className="text-3xl font-extrabold text-white">Radar Anti-RTO & Score de Confiance Acheteur</h2>
              <p className="text-slate-400 text-sm mt-1">
                Vérifiez la fiabilité d'un client avant d'expédier un colis afin d'éviter les frais de retour inutiles.
              </p>
            </div>

            {/* FORMULAIRE DE VÉRIFICATION INSTANTANÉE */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>🔍 Vérifier un numéro algérien</span>
                <span className="text-xs font-normal text-slate-400">(05xx, 06xx, 07xx)</span>
              </h3>

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
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-3 rounded-xl transition flex items-center justify-center gap-2"
                >
                  {isSearchingPhone ? 'Analyse...' : 'Auditer le Numéro'}
                </button>
              </form>

              {/* RÉSULTAT DU SCAN */}
              {hasSearched && (
                <div className="pt-4 mt-4 border-t border-slate-800">
                  {searchResult ? (
                    <div className="p-5 rounded-xl border bg-slate-950/70 border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
                      <div className="space-y-2 text-center md:text-left">
                        <div className="flex items-center gap-3 justify-center md:justify-start">
                          <span className="font-mono text-xl font-bold text-white">{searchResult.phone_number}</span>
                          <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                            searchResult.risk_level === 'LOW' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                            searchResult.risk_level === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                            'bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse'
                          }`}>
                            {searchResult.risk_level === 'LOW' && '✓ CLIENT DE CONFIANCE'}
                            {searchResult.risk_level === 'MEDIUM' && '⚠️ RISQUE MOYEN'}
                            {searchResult.risk_level === 'HIGH' && '🚨 RISQUE ÉLEVÉ'}
                            {searchResult.risk_level === 'BLACKLISTED' && '⛔ LISTE NOIRE (REFUS RECOMMANDÉ)'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">
                          Historique COD : <strong className="text-white">{searchResult.delivered_orders}</strong> livrées avec succès sur <strong className="text-white">{searchResult.total_orders}</strong> commandes.
                        </p>
                        {searchResult.last_return_reason && (
                          <p className="text-xs text-rose-400 bg-rose-500/10 px-3 py-1.5 rounded-lg border border-rose-500/20">
                            Dernier motif de retour signalé : {searchResult.last_return_reason}
                          </p>
                        )}
                      </div>

                      {/* JAUGE DE SCORE */}
                      <div className="text-center p-4 bg-slate-900 border border-slate-800 rounded-xl min-w-[140px]">
                        <div className={`text-4xl font-black ${
                          searchResult.trust_score >= 80 ? 'text-emerald-400' :
                          searchResult.trust_score >= 50 ? 'text-amber-400' : 'text-rose-500'
                        }`}>
                          {searchResult.trust_score}/100
                        </div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Indice de Fiabilité</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 text-center text-slate-400 text-sm">
                      ✨ Numéro jamais signalé. Aucun antécédent négatif enregistré dans la base nationale partagée.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* FORMULAIRE DE SIGNALEMENT COMMUNAUTAIRE */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>📢 Signaler un Colis Refusé ou un Client Injoignable</span>
              </h3>
              <p className="text-xs text-slate-400">
                Contribuez à la base de données partagée pour prémunir les autres marchands des acheteurs fantômes.
              </p>

              <form onSubmit={handleReportBuyer} className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Numéro (ex: 0661xxxxxx)"
                  value={reportPhone}
                  onChange={(e) => setReportPhone(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono"
                />
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                >
                  <option value="Client Injoignable">Client Injoignable (Ne répond pas)</option>
                  <option value="Refus à l'ouverture">Refus à l'ouverture du colis</option>
                  <option value="Numéro erroné / Fake">Numéro erroné ou faux numéro</option>
                  <option value="Report abusif / Annulation">Report abusif puis annulation</option>
                </select>
                <button
                  type="submit"
                  className="bg-rose-600 hover:bg-rose-500 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition"
                >
                  Ajouter au Répertoire Partagé
                </button>
              </form>

              {reportingStatus && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl font-medium">
                  {reportingStatus}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ONGLET 2 : FORFAITS & REÇUS BARIDIMOB */}
        {activeTab === 'billing' && (
          <div className="space-y-8">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <h2 className="text-3xl font-extrabold text-white">Forfaits & Règlements Sécurisés</h2>
              <p className="text-slate-400 text-sm">Réglez votre licence par BaridiMob ou par Carte Bancaire.</p>
              
              <div className="pt-4 flex items-center justify-center gap-3">
                <span className={`text-xs font-semibold ${billingCycle === 'monthly' ? 'text-white' : 'text-slate-400'}`}>Mensuel</span>
                <button
                  type="button"
                  onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
                  className="w-14 h-7 bg-slate-800 rounded-full p-1 transition-colors relative border border-slate-700"
                >
                  <div className={`w-5 h-5 bg-emerald-500 rounded-full transition-transform ${billingCycle === 'yearly' ? 'translate-x-7' : 'translate-x-0'}`} />
                </button>
                <span className={`text-xs font-semibold flex items-center gap-1.5 ${billingCycle === 'yearly' ? 'text-emerald-400' : 'text-slate-400'}`}>
                  Annuel (-10%)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div onClick={() => setSelectedPlan('free')} className={`p-6 rounded-2xl border cursor-pointer ${selectedPlan === 'free' ? 'border-emerald-500 bg-slate-900 ring-2 ring-emerald-500' : 'border-slate-800 bg-slate-900/60'}`}>
                <h3 className="text-xl font-bold">Pack Free</h3>
                <div className="text-3xl font-black my-4">0 DZD</div>
                <p className="text-xs text-slate-400">50 commandes d'essai</p>
              </div>

              <div onClick={() => setSelectedPlan('business')} className={`p-6 rounded-2xl border cursor-pointer ${selectedPlan === 'business' ? 'border-emerald-500 bg-slate-900 ring-2 ring-emerald-500' : 'border-slate-800 bg-slate-900/60'}`}>
                <h3 className="text-xl font-bold">Pack Business</h3>
                <div className="text-3xl font-black my-4">{getPrice('business').dzd.toLocaleString()} DZD</div>
                <p className="text-xs text-slate-400">Jusqu'à 500 commandes / mois</p>
              </div>

              <div onClick={() => setSelectedPlan('ultra')} className={`p-6 rounded-2xl border cursor-pointer ${selectedPlan === 'ultra' ? 'border-emerald-500 bg-slate-900 ring-2 ring-emerald-500' : 'border-slate-800 bg-slate-900/60'}`}>
                <h3 className="text-xl font-bold">Pack Ultra Illimité</h3>
                <div className="text-3xl font-black my-4">{getPrice('ultra').dzd.toLocaleString()} DZD</div>
                <p className="text-xs text-slate-400">Commandes 100% illimitées</p>
              </div>
            </div>

            {selectedPlan !== 'free' && (
              <div className="max-w-xl mx-auto bg-slate-900 border-2 border-emerald-500 rounded-2xl p-6 space-y-4 shadow-xl">
                <div className="flex justify-between items-center">
                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-full">Bénéficiaire Officiel</span>
                  <span className="text-xs text-slate-400">Algérie Poste (BaridiMob)</span>
                </div>
                <div className="text-3xl font-black text-white">{getPrice(selectedPlan).dzd.toLocaleString()} DZD {getPrice(selectedPlan).periodText}</div>
                <div className="p-4 bg-slate-950 border border-emerald-500/30 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between border-b border-slate-800 pb-1.5">
                    <span className="text-slate-400">Titulaire :</span>
                    <span className="text-white font-bold">{adminName}</span>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-between">
                    <span className="font-mono text-emerald-400 font-bold select-all text-sm">{adminRip}</span>
                    <button onClick={handleCopyRip} className="px-2.5 py-1 bg-emerald-500 text-slate-950 text-xs font-bold rounded hover:bg-emerald-400">
                      {copySuccess ? 'Copié !' : 'Copier'}
                    </button>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <input type="file" ref={fileInputRef} accept="image/*,.pdf" onChange={handleReceiptFileChange} className="hidden" />
                  {receiptUploadSuccess && <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl font-medium">{receiptUploadSuccess}</div>}
                  {receiptUploadError && <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl font-medium">{receiptUploadError}</div>}
                  <button
                    type="button"
                    disabled={isUploadingReceipt}
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-800 text-slate-950 font-bold py-3.5 rounded-xl text-sm transition"
                  >
                    {isUploadingReceipt ? 'Envoi vers Supabase...' : '📸 Téléverser la Capture du Reçu BaridiMob'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ONGLET WILAYAS */}
        {activeTab === 'wilayas' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Rentabilité Nette par Wilaya</h2>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-800">
                    <th className="pb-3">Wilaya</th>
                    <th className="pb-3">Livraison</th>
                    <th className="pb-3">Marge</th>
                    <th className="pb-3 text-right">Décision Meta Ads</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {wilayaStats.map((w, idx) => (
                    <tr key={idx}>
                      <td className="py-3 font-sans font-bold text-white">{w.code} - {w.name}</td>
                      <td className="py-3 text-emerald-400">{w.deliveredRate}%</td>
                      <td className="py-3 font-bold">{w.netMarginDzd > 0 ? `+${w.netMarginDzd} DZD` : `${w.netMarginDzd} DZD`}</td>
                      <td className="py-3 text-right font-sans">{w.recommendation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* AUTRES ONGLETS SIMPLES */}
        {activeTab === 'rto_audit' && <div className="p-6 bg-slate-900 rounded-xl text-white">Module Audit des Frais de Retour actif.</div>}
        {activeTab === 'ghosts' && <div className="p-6 bg-slate-900 rounded-xl text-white">Module Radar Colis Fantômes actif.</div>}
        {activeTab === 'dispute' && <div className="p-6 bg-slate-900 rounded-xl text-white">Module Dossiers de Litiges actif.</div>}
        {activeTab === 'crm' && <div className="p-6 bg-slate-900 rounded-xl text-white">Module CRM Marchands actif.</div>}
      </main>
    </div>
  );
}