'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'carriers' | 'billing'>('billing');
  const [copySuccess, setCopySuccess] = useState(false);

  // Coordonnées officielles du bénéficiaire
  const adminName = "ZOGHLAMI BADREDDINE";
  const adminRip = "00799999000232882074";

  // Gestion de la tarification et des forfaits
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'business' | 'ultra'>('business');

  // États du formulaire de paiement par carte
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Configuration des tarifs (Mensuel de base)
  const plans = {
    free: {
      name: "Pack Découverte (Free)",
      tagline: "Pour démarrer et tester la réconciliation",
      ordersLimit: "50 commandes / mois",
      monthlyDzd: 0,
      monthlyUsd: 0,
    },
    business: {
      name: "Pack Business",
      tagline: "Pour les e-commerçants réguliers",
      ordersLimit: "500 commandes / mois",
      monthlyDzd: 1300,
      monthlyUsd: 10,
    },
    ultra: {
      name: "Pack Ultra Illimité",
      tagline: "Pour les marques et grands volumes",
      ordersLimit: "Commandes & clients 100% ILLIMITÉS",
      monthlyDzd: 4500,
      monthlyUsd: 15,
    }
  };

  // Calcul dynamique des prix selon mensuel / annuel (-10% sur l'annuel)
  const getPrice = (planKey: 'free' | 'business' | 'ultra') => {
    const plan = plans[planKey];
    if (billingCycle === 'monthly') {
      return {
        dzd: plan.monthlyDzd,
        usd: plan.monthlyUsd,
        periodText: '/ mois'
      };
    } else {
      // 10% de réduction sur 12 mois = Total annuel x 0.90
      const yearlyDzd = Math.round(plan.monthlyDzd * 12 * 0.9);
      const yearlyUsd = Math.round(plan.monthlyUsd * 12 * 0.9);
      return {
        dzd: yearlyDzd,
        usd: yearlyUsd,
        periodText: '/ an (-10%)'
      };
    }
  };

  const currentPrice = getPrice(selectedPlan);

  // Formatage automatique du numéro de carte bancaire
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 16) value = value.slice(0, 16);
    const formatted = value.match(/.{1,4}/g)?.join(' ') || value;
    setCardNumber(formatted);
  };

  // Formatage date MM/AA
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 4) value = value.slice(0, 4);
    if (value.length >= 3) {
      value = `${value.slice(0, 2)}/${value.slice(2)}`;
    }
    setCardExpiry(value);
  };

  // Formatage CVV
  const handleCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
    setCardCvc(value);
  };

  // Soumission paiement carte
  const handlePayCard = (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentProcessing(true);
    setTimeout(() => {
      setPaymentProcessing(false);
      setPaymentSuccess(true);
      setTimeout(() => setPaymentSuccess(false), 5000);
    }, 1800);
  };

  const handleCopyRip = () => {
    navigator.clipboard.writeText(adminRip);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
  };

  const getCardType = () => {
    const clean = cardNumber.replace(/\s/g, '');
    if (clean.startsWith('4')) return 'VISA';
    if (clean.startsWith('5') || clean.startsWith('2')) return 'MASTERCARD';
    return 'CARTE BANCAIRE';
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Barre latérale de navigation */}
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
              onClick={() => setActiveTab('overview')}
              className={`w-full text-left px-3 py-2 rounded-lg font-medium transition ${
                activeTab === 'overview' ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              📊 Vue Générale
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full text-left px-3 py-2 rounded-lg font-medium transition ${
                activeTab === 'orders' ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              📦 Commandes & Filtre IP
            </button>
            <button
              onClick={() => setActiveTab('carriers')}
              className={`w-full text-left px-3 py-2 rounded-lg font-medium transition ${
                activeTab === 'carriers' ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              🚚 Transporteurs (Yalidine / ZR)
            </button>
            <button
              onClick={() => setActiveTab('billing')}
              className={`w-full text-left px-3 py-2 rounded-lg font-medium transition ${
                activeTab === 'billing' ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              💳 Forfaits & Règlements
            </button>
          </nav>
        </div>

        <div className="border-t border-slate-800 pt-4">
          <div className="text-xs text-slate-400 mb-1">Administrateur :</div>
          <div className="text-sm font-semibold text-white">{adminName}</div>
          <div className="text-xs text-emerald-400 mb-3 font-medium">Plateforme Active</div>
          <Link href="/auth" className="text-xs text-rose-400 hover:underline">Déconnexion</Link>
        </div>
      </aside>

      {/* Contenu principal */}
      <main className="flex-1 p-8 overflow-y-auto">
        {/* Navigation mobile */}
        <div className="flex md:hidden justify-between items-center mb-6 pb-4 border-b border-slate-800">
          <span className="font-bold text-emerald-400">COD Recon DZ</span>
          <div className="flex gap-2">
            <button onClick={() => setActiveTab('overview')} className="text-xs p-2 bg-slate-800 rounded">Général</button>
            <button onClick={() => setActiveTab('billing')} className="text-xs p-2 bg-slate-800 rounded">Forfaits</button>
          </div>
        </div>

        {/* ONGLET 1 : VUE GÉNÉRALE */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-white">Tableau de bord financier COD</h2>
                <p className="text-slate-400 text-sm">Contrôle des versements transporteurs et calcul de variance</p>
              </div>
              <button className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold px-4 py-2.5 rounded-xl text-sm transition">
                + Importer un bordereau transporteur
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl">
                <span className="text-xs text-slate-400 font-medium">Fonds Réconciliés Conformes</span>
                <div className="text-2xl font-bold text-emerald-400 mt-2">1 425 000 DZD</div>
                <span className="text-xs text-emerald-500 font-medium">98.2% du montant attendu</span>
              </div>
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl">
                <span className="text-xs text-slate-400 font-medium">Déficit Transporteur (Litiges)</span>
                <div className="text-2xl font-bold text-rose-400 mt-2">48 500 DZD</div>
                <span className="text-xs text-rose-500 font-medium">6 bordereaux à réclamer</span>
              </div>
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl">
                <span className="text-xs text-slate-400 font-medium">Taux d'Échec / RTO Évités</span>
                <div className="text-2xl font-bold text-amber-400 mt-2">14.8 %</div>
                <span className="text-xs text-amber-500 font-medium">-4.2% grâce à l'Anti-RTO</span>
              </div>
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl">
                <span className="text-xs text-slate-400 font-medium">Commandes Bloquées (IP)</span>
                <div className="text-2xl font-bold text-sky-400 mt-2">23</div>
                <span className="text-xs text-sky-500 font-medium">Pertes évitées au pas de porte</span>
              </div>
            </div>
          </div>
        )}

        {/* ONGLET 2 : FILTRAGE IP */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Filtrage IP & Commandes Risquées</h2>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-lg text-sm">
                <div>
                  <span className="font-semibold text-white">Client : Amine B. (Alger)</span>
                  <span className="text-xs text-slate-400 block">IP: 105.101.44.12 • Panier: 24 500 DZD</span>
                </div>
                <span className="px-2.5 py-1 text-xs bg-emerald-500/10 text-emerald-400 rounded-lg">Validée (Faible Risque)</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-950 border border-rose-900/50 rounded-lg text-sm">
                <div>
                  <span className="font-semibold text-rose-300">Spam Détecté : 4 commandes rapides</span>
                  <span className="text-xs text-slate-400 block">IP: 41.220.78.90 • Panier démesuré: 320 000 DZD</span>
                </div>
                <span className="px-2.5 py-1 text-xs bg-rose-500/10 text-rose-400 rounded-lg">Bloquée (IP Restreinte)</span>
              </div>
            </div>
          </div>
        )}

        {/* ONGLET 3 : TRANSPORTEURS */}
        {activeTab === 'carriers' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Connecteurs Transporteurs Algérie</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
                <h3 className="font-bold text-white">🚚 Yalidine Express</h3>
                <input type="text" placeholder="X-API-ID" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" />
                <input type="password" placeholder="X-API-TOKEN" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" />
                <button className="bg-emerald-500 text-slate-950 text-xs font-semibold px-4 py-2 rounded-lg hover:bg-emerald-400 transition">Enregistrer Yalidine</button>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
                <h3 className="font-bold text-white">🚚 ZR Express</h3>
                <input type="password" placeholder="Clé API Partenaire ZR" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" />
                <button className="bg-emerald-500 text-slate-950 text-xs font-semibold px-4 py-2 rounded-lg hover:bg-emerald-400 transition">Enregistrer ZR Express</button>
              </div>
            </div>
          </div>
        )}

        {/* ONGLET 4 : GRILLE TARIFAIRE DES FORFAITS & RECEPTION DES PAIEMENTS */}
        {activeTab === 'billing' && (
          <div className="space-y-8">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <h2 className="text-3xl font-extrabold text-white">Choisissez le Forfait Adapté à Votre Boutique</h2>
              <p className="text-slate-400 text-sm">
                Automatisez vos réconciliations COD et sécurisez vos marges dès aujourd'hui.
              </p>

              {/* COMMUTATEUR MENSUEL / ANNUEL (-10%) */}
              <div className="pt-4 flex items-center justify-center gap-3">
                <span className={`text-xs font-semibold ${billingCycle === 'monthly' ? 'text-white' : 'text-slate-400'}`}>
                  Facturation Mensuelle
                </span>
                <button
                  type="button"
                  onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
                  className="w-14 h-7 bg-slate-800 rounded-full p-1 transition-colors relative border border-slate-700"
                >
                  <div
                    className={`w-5 h-5 bg-emerald-500 rounded-full transition-transform ${
                      billingCycle === 'yearly' ? 'translate-x-7' : 'translate-x-0'
                    }`}
                  />
                </button>
                <span className={`text-xs font-semibold flex items-center gap-1.5 ${billingCycle === 'yearly' ? 'text-emerald-400' : 'text-slate-400'}`}>
                  Facturation Annuelle
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] rounded-full border border-emerald-500/30">
                    -10% de Réduction
                  </span>
                </span>
              </div>
            </div>

            {/* GRILLE DES 3 FORFAITS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* PLAN 1 : GRATUIT (CRÉDITS LIMITÉS) */}
              <div
                onClick={() => setSelectedPlan('free')}
                className={`cursor-pointer rounded-2xl p-6 border transition relative flex flex-col justify-between ${
                  selectedPlan === 'free'
                    ? 'bg-slate-900 border-emerald-500 shadow-xl shadow-emerald-500/10 ring-2 ring-emerald-500'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Essai Gratuit</span>
                    <span className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[10px] rounded">Crédit Limité</span>
                  </div>
                  <h3 className="text-xl font-bold text-white">{plans.free.name}</h3>
                  <p className="text-xs text-slate-400 mt-1">{plans.free.tagline}</p>

                  <div className="my-6">
                    <div className="text-3xl font-black text-white">0 DZD <span className="text-sm font-normal text-slate-400">/ 0 $</span></div>
                    <span className="text-[11px] text-slate-500">Sans carte bancaire requise</span>
                  </div>

                  <ul className="space-y-2 text-xs text-slate-300 border-t border-slate-800/80 pt-4">
                    <li className="flex items-center gap-2">✓ <span className="font-semibold text-emerald-400">{plans.free.ordersLimit}</span></li>
                    <li className="flex items-center gap-2">✓ Connexion Yalidine & ZR Express</li>
                    <li className="flex items-center gap-2">✓ Détection des écarts de versement</li>
                    <li className="flex items-center gap-2 text-slate-500">✕ Passage direct aux forfaits payants après 50 commandes</li>
                  </ul>
                </div>

                <button
                  type="button"
                  className={`mt-6 w-full py-2.5 rounded-xl text-xs font-bold transition ${
                    selectedPlan === 'free'
                      ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-800/60 text-slate-400'
                  }`}
                >
                  {selectedPlan === 'free' ? 'Plan Actif Sélectionné' : 'Choisir le Forfait Gratuit'}
                </button>
              </div>

              {/* PLAN 2 : BUSINESS (500 TRAITEMENTS / MOIS) */}
              <div
                onClick={() => setSelectedPlan('business')}
                className={`cursor-pointer rounded-2xl p-6 border transition relative flex flex-col justify-between ${
                  selectedPlan === 'business'
                    ? 'bg-slate-900 border-emerald-500 shadow-xl shadow-emerald-500/10 ring-2 ring-emerald-500'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">Recommandé</span>
                    <span className="px-2 py-0.5 bg-sky-500/20 text-sky-400 text-[10px] font-bold rounded">Populaire</span>
                  </div>
                  <h3 className="text-xl font-bold text-white">{plans.business.name}</h3>
                  <p className="text-xs text-slate-400 mt-1">{plans.business.tagline}</p>

                  <div className="my-6">
                    <div className="text-3xl font-black text-white">
                      {getPrice('business').dzd.toLocaleString()} DZD
                      <span className="text-sm font-normal text-slate-400"> ({getPrice('business').usd} $)</span>
                    </div>
                    <span className="text-[11px] text-emerald-400 font-medium">
                      {getPrice('business').periodText}
                    </span>
                  </div>

                  <ul className="space-y-2 text-xs text-slate-300 border-t border-slate-800/80 pt-4">
                    <li className="flex items-center gap-2">✓ <span className="font-semibold text-emerald-400">{plans.business.ordersLimit}</span></li>
                    <li className="flex items-center gap-2">✓ Réconciliation automatique quotidienne</li>
                    <li className="flex items-center gap-2">✓ Génération des bordereaux de litiges</li>
                    <li className="flex items-center gap-2">✓ Module Anti-RTO avec validation WhatsApp</li>
                    <li className="flex items-center gap-2">✓ Restriction et blocage automatique par IP</li>
                  </ul>
                </div>

                <button
                  type="button"
                  className={`mt-6 w-full py-2.5 rounded-xl text-xs font-bold transition ${
                    selectedPlan === 'business'
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-slate-800 text-white'
                  }`}
                >
                  {selectedPlan === 'business' ? 'Forfait Sélectionné' : 'Choisir le Pack Business'}
                </button>
              </div>

              {/* PLAN 3 : ULTRA PRO (ILLIMITÉ TOTAL) */}
              <div
                onClick={() => setSelectedPlan('ultra')}
                className={`cursor-pointer rounded-2xl p-6 border transition relative flex flex-col justify-between ${
                  selectedPlan === 'ultra'
                    ? 'bg-slate-900 border-emerald-500 shadow-xl shadow-emerald-500/10 ring-2 ring-emerald-500'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Enterprise</span>
                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] font-bold rounded">Illimité</span>
                  </div>
                  <h3 className="text-xl font-bold text-white">{plans.ultra.name}</h3>
                  <p className="text-xs text-slate-400 mt-1">{plans.ultra.tagline}</p>

                  <div className="my-6">
                    <div className="text-3xl font-black text-white">
                      {getPrice('ultra').dzd.toLocaleString()} DZD
                      <span className="text-sm font-normal text-slate-400"> ({getPrice('ultra').usd} $)</span>
                    </div>
                    <span className="text-[11px] text-emerald-400 font-medium">
                      {getPrice('ultra').periodText}
                    </span>
                  </div>

                  <ul className="space-y-2 text-xs text-slate-300 border-t border-slate-800/80 pt-4">
                    <li className="flex items-center gap-2">✓ <span className="font-semibold text-amber-400">{plans.ultra.ordersLimit}</span></li>
                    <li className="flex items-center gap-2">✓ Toutes les fonctionnalités Business incluses</li>
                    <li className="flex items-center gap-2">✓ Multi-magasins et multi-comptes transporteurs</li>
                    <li className="flex items-center gap-2">✓ Export comptable certifié (Excel, CSV, PDF)</li>
                    <li className="flex items-center gap-2">✓ Support prioritaire VIP WhatsApp et téléphone 7j/7</li>
                  </ul>
                </div>

                <button
                  type="button"
                  className={`mt-6 w-full py-2.5 rounded-xl text-xs font-bold transition ${
                    selectedPlan === 'ultra'
                      ? 'bg-amber-500 text-slate-950 font-extrabold'
                      : 'bg-slate-800 text-white'
                  }`}
                >
                  {selectedPlan === 'ultra' ? 'Forfait Sélectionné' : 'Choisir le Pack Ultra Illimité'}
                </button>
              </div>
            </div>

            {/* SECTION RÈGLEMENT DU PLAN SÉLECTIONNÉ */}
            {selectedPlan !== 'free' ? (
              <div className="space-y-6 pt-4">
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">Forfait choisi :</span>
                    <h4 className="text-lg font-bold text-white">
                      {plans[selectedPlan].name} — {currentPrice.dzd.toLocaleString()} DZD ({currentPrice.usd} $) {currentPrice.periodText}
                    </h4>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">
                    Sélectionnez votre mode de règlement ci-dessous :
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* MODALITÉ 1 : CARTE BANCAIRE (VISA / MASTERCARD) */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-2xl relative">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-base">💳 Règlement Carte Bancaire</span>
                        <span className="text-[10px] px-2 py-0.5 bg-indigo-500/20 text-indigo-400 font-semibold rounded">3D SECURE</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 font-mono">
                        <span className="text-sky-400 bg-sky-950 px-1.5 py-0.5 rounded">VISA</span>
                        <span className="text-amber-400 bg-amber-950 px-1.5 py-0.5 rounded">MasterCard</span>
                      </div>
                    </div>

                    <form onSubmit={handlePayCard} className="space-y-4">
                      {/* Carte virtuelle dynamique */}
                      <div className="bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-950 border border-slate-700/60 p-4 rounded-xl text-slate-200 shadow-inner">
                        <div className="flex justify-between items-center mb-6">
                          <div className="w-9 h-6 bg-amber-400/80 rounded-sm flex items-center justify-center text-[9px] font-bold text-slate-950">PUCE</div>
                          <span className="text-xs font-mono font-bold tracking-widest text-indigo-300">{getCardType()}</span>
                        </div>
                        <div className="font-mono text-lg tracking-widest text-white mb-4">
                          {cardNumber || '•••• •••• •••• ••••'}
                        </div>
                        <div className="flex justify-between text-[11px] font-mono">
                          <div>
                            <span className="text-slate-400 block text-[9px]">TITULAIRE</span>
                            <span className="uppercase font-semibold text-white">{cardName || 'NOM PRENOM'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[9px]">EXPIRE</span>
                            <span className="font-semibold text-white">{cardExpiry || 'MM/AA'}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">Nom sur la carte</label>
                        <input
                          type="text"
                          required
                          placeholder="MOHAMED BENALI"
                          value={cardName}
                          onChange={(e) => setCardName(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">Numéro de carte</label>
                        <input
                          type="text"
                          required
                          placeholder="4000 1234 5678 9010"
                          value={cardNumber}
                          onChange={handleCardNumberChange}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white font-mono placeholder-slate-600 focus:outline-none focus:border-indigo-500 text-sm"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1">Expiration</label>
                          <input
                            type="text"
                            required
                            placeholder="MM/AA"
                            value={cardExpiry}
                            onChange={handleExpiryChange}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white font-mono placeholder-slate-600 focus:outline-none focus:border-indigo-500 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1">Code CVV / CVC</label>
                          <input
                            type="password"
                            required
                            placeholder="•••"
                            value={cardCvc}
                            onChange={handleCvcChange}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white font-mono placeholder-slate-600 focus:outline-none focus:border-indigo-500 text-sm"
                          />
                        </div>
                      </div>

                      {paymentSuccess && (
                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl text-center font-medium">
                          ✓ Paiement validé avec succès. Votre {plans[selectedPlan].name} est activé !
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={paymentProcessing}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 text-white font-bold py-3 rounded-xl text-sm transition"
                      >
                        {paymentProcessing ? (
                          <span>Vérification bancaire en cours...</span>
                        ) : (
                          <span>Payer {currentPrice.usd} $ {currentPrice.periodText}</span>
                        )}
                      </button>

                      <div className="flex items-center justify-center gap-4 text-[11px] text-slate-400 pt-1">
                        <span>🔒 SSL 256-bit</span>
                        <span>✓ PCI-DSS</span>
                        <span>🛡 Protection 3D-Secure</span>
                      </div>
                    </form>
                  </div>

                  {/* MODALITÉ 2 : BARIDIMOB OFFICIEL */}
                  <div className="bg-slate-900 border-2 border-emerald-500 rounded-2xl p-6 space-y-5 shadow-2xl flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-full">
                          Virement BaridiMob Officiel
                        </span>
                        <span className="text-xs text-slate-400">Algérie Poste</span>
                      </div>

                      <div>
                        <div className="text-3xl font-black text-white">
                          {currentPrice.dzd.toLocaleString()} DZD
                          <span className="text-sm font-normal text-slate-400"> {currentPrice.periodText}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">Montant exact à transférer pour activer le {plans[selectedPlan].name}</p>
                      </div>

                      <div className="p-4 bg-slate-950 border border-emerald-500/30 rounded-xl space-y-3 text-xs mt-4">
                        <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                          <span className="text-slate-400 font-medium">Bénéficiaire Officiel :</span>
                          <span className="text-white font-bold tracking-wide">{adminName}</span>
                        </div>

                        <div className="text-slate-400 font-medium pt-1">RIP BaridiMob (20 chiffres) :</div>
                        <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-between">
                          <span className="font-mono text-emerald-400 font-bold text-sm tracking-wider select-all">
                            {adminRip}
                          </span>
                          <button
                            onClick={handleCopyRip}
                            className="px-3 py-1 bg-emerald-500 text-slate-950 rounded text-xs font-bold hover:bg-emerald-400 transition"
                          >
                            {copySuccess ? 'Copié !' : 'Copier'}
                          </button>
                        </div>
                        <div className="text-slate-400 text-[11px] leading-relaxed">
                          * Indiquez votre numéro ou adresse email en remarque du virement pour validation immédiate.
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <button className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-3 rounded-xl text-sm transition">
                        Téléverser le Reçu BaridiMob ({currentPrice.dzd.toLocaleString()} DZD)
                      </button>
                      <p className="text-center text-[11px] text-slate-400">
                        Activation manuelle sous 15 minutes 7j/7
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-2xl text-center max-w-xl mx-auto space-y-3">
                <span className="text-2xl">🎉</span>
                <h4 className="text-base font-bold text-white">Votre Forfait Gratuit est actuellement prêt</h4>
                <p className="text-xs text-slate-400">
                  Vous disposez de 50 crédits d'analyse gratuits. Une fois ce plafond atteint, vous serez directement orienté vers le règlement du Pack Business ou Ultra.
                </p>
                <button
                  onClick={() => setActiveTab('overview')}
                  className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-xs transition"
                >
                  Aller au Tableau de Bord
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}