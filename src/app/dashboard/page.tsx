'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface ClientSubscriber {
  id: string;
  storeName: string;
  contactName: string;
  phone: string;
  email: string;
  wilaya: string;
  plan: 'free' | 'business' | 'ultra';
  paymentMethod: 'BARIDIMOB' | 'STRIPE_CARD';
  status: 'ACTIVE' | 'TRIAL' | 'PENDING_VALIDATION' | 'CHURNED';
  joinedDate: string;
  mrrDzd: number;
  consumedCredits: number;
  maxCredits: number;
  churnReason?: string;
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'crm' | 'orders' | 'carriers' | 'billing'>('crm');
  const [copySuccess, setCopySuccess] = useState(false);
  const [crmFilter, setCrmFilter] = useState<'ALL' | 'ACTIVE' | 'PENDING' | 'CHURNED'>('ALL');

  // Coordonnées officielles du bénéficiaire
  const adminName = "ZOGHLAMI BADREDDINE";
  const adminRip = "00799999000232882074";

  // Gestion des tarifs
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'business' | 'ultra'>('business');

  // Formulaire Carte
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // BASE CRM MARCHANDS (Exemples représentatifs réels)
  const [subscribers, setSubscribers] = useState<ClientSubscriber[]>([
    {
      id: "SUB-001",
      storeName: "Algeria Moda Shop",
      contactName: "Karim Brahimi",
      phone: "0550 12 34 56",
      email: "karim@algeriamoda.com",
      wilaya: "Alger (16)",
      plan: "ultra",
      paymentMethod: "BARIDIMOB",
      status: "ACTIVE",
      joinedDate: "2026-08-14",
      mrrDzd: 4500,
      consumedCredits: 1240,
      maxCredits: 999999
    },
    {
      id: "SUB-002",
      storeName: "Oran Tech Express",
      contactName: "Sofiane Mansouri",
      phone: "0661 88 99 00",
      email: "sofiane@orantech.dz",
      wilaya: "Oran (31)",
      plan: "business",
      paymentMethod: "STRIPE_CARD",
      status: "ACTIVE",
      joinedDate: "2026-09-02",
      mrrDzd: 1300,
      consumedCredits: 380,
      maxCredits: 500
    },
    {
      id: "SUB-003",
      storeName: "Cosmétique Naturelle DZ",
      contactName: "Yasmine Belkacem",
      phone: "0770 45 67 89",
      email: "contact@naturelledz.com",
      wilaya: "Blida (09)",
      plan: "business",
      paymentMethod: "BARIDIMOB",
      status: "PENDING_VALIDATION",
      joinedDate: "2026-09-28",
      mrrDzd: 1300,
      consumedCredits: 49,
      maxCredits: 500
    },
    {
      id: "SUB-004",
      storeName: "Sétif Électro & Maison",
      contactName: "Nabil Zaidi",
      phone: "0541 22 33 44",
      email: "nabil@setifelectro.dz",
      wilaya: "Sétif (19)",
      plan: "free",
      paymentMethod: "BARIDIMOB",
      status: "TRIAL",
      joinedDate: "2026-09-27",
      mrrDzd: 0,
      consumedCredits: 42,
      maxCredits: 50
    },
    {
      id: "SUB-005",
      storeName: "Auto Pièces Tipaza",
      contactName: "Mourad Haddad",
      phone: "0559 77 66 55",
      email: "mourad@tipazapieces.dz",
      wilaya: "Tipaza (42)",
      plan: "business",
      paymentMethod: "BARIDIMOB",
      status: "CHURNED",
      joinedDate: "2026-07-10",
      mrrDzd: 0,
      consumedCredits: 500,
      maxCredits: 500,
      churnReason: "Plafond d'envoi journalier atteint sur Yalidine et arrêt saisonnier d'activité."
    }
  ]);

  // CALCULS COMPTABLES GLOBAUX
  const totalSubscribers = subscribers.length;
  const activeSubscribers = subscribers.filter(s => s.status === 'ACTIVE').length;
  const pendingSubscribers = subscribers.filter(s => s.status === 'PENDING_VALIDATION').length;
  const churnedSubscribers = subscribers.filter(s => s.status === 'CHURNED').length;
  const churnRate = ((churnedSubscribers / totalSubscribers) * 100).toFixed(1);

  const mrrTotalDzd = subscribers
    .filter(s => s.status === 'ACTIVE')
    .reduce((acc, curr) => acc + curr.mrrDzd, 0);

  const arrProjectedDzd = mrrTotalDzd * 12;
  const baridiMobShareDzd = subscribers
    .filter(s => s.status === 'ACTIVE' && s.paymentMethod === 'BARIDIMOB')
    .reduce((acc, curr) => acc + curr.mrrDzd, 0);
  const stripeShareDzd = mrrTotalDzd - baridiMobShareDzd;

  // PLANS
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

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 16) value = value.slice(0, 16);
    setCardNumber(value.match(/.{1,4}/g)?.join(' ') || value);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 4) value = value.slice(0, 4);
    if (value.length >= 3) value = `${value.slice(0, 2)}/${value.slice(2)}`;
    setCardExpiry(value);
  };

  const handleValidatePendingPayment = (clientId: string) => {
    setSubscribers(prev => prev.map(c => c.id === clientId ? { ...c, status: 'ACTIVE' } : c));
  };

  const filteredSubscribers = subscribers.filter(s => {
    if (crmFilter === 'ACTIVE') return s.status === 'ACTIVE';
    if (crmFilter === 'PENDING') return s.status === 'PENDING_VALIDATION';
    if (crmFilter === 'CHURNED') return s.status === 'CHURNED';
    return true;
  });

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
              onClick={() => setActiveTab('crm')}
              className={`w-full text-left px-3 py-2.5 rounded-lg font-medium transition flex items-center justify-between ${
                activeTab === 'crm' ? 'bg-emerald-500/10 text-emerald-400 font-bold' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <span>👥 CRM & Comptabilité</span>
              {pendingSubscribers > 0 && (
                <span className="px-2 py-0.5 text-[10px] bg-amber-500/20 text-amber-400 rounded-full font-bold">
                  {pendingSubscribers}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full text-left px-3 py-2.5 rounded-lg font-medium transition ${
                activeTab === 'overview' ? 'bg-emerald-500/10 text-emerald-400 font-bold' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              📊 Vue Opérationnelle COD
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full text-left px-3 py-2.5 rounded-lg font-medium transition ${
                activeTab === 'orders' ? 'bg-emerald-500/10 text-emerald-400 font-bold' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              📦 Commandes & Filtre IP
            </button>
            <button
              onClick={() => setActiveTab('carriers')}
              className={`w-full text-left px-3 py-2.5 rounded-lg font-medium transition ${
                activeTab === 'carriers' ? 'bg-emerald-500/10 text-emerald-400 font-bold' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              🚚 Connecteurs Yalidine / ZR
            </button>
            <button
              onClick={() => setActiveTab('billing')}
              className={`w-full text-left px-3 py-2.5 rounded-lg font-medium transition ${
                activeTab === 'billing' ? 'bg-emerald-500/10 text-emerald-400 font-bold' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              💳 Forfaits & Règlements
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
        {/* ENTÊTE MOBILE */}
        <div className="flex md:hidden justify-between items-center mb-6 pb-4 border-b border-slate-800">
          <span className="font-bold text-emerald-400">COD Recon DZ</span>
          <div className="flex gap-2">
            <button onClick={() => setActiveTab('crm')} className="text-xs p-2 bg-slate-800 rounded">CRM</button>
            <button onClick={() => setActiveTab('billing')} className="text-xs p-2 bg-slate-800 rounded">Paiement</button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* ONGLET NOUVEAU : CRM, COMPTABILITÉ & STATISTIQUES SAAS */}
        {/* ======================================================== */}
        {activeTab === 'crm' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-extrabold text-white">CRM Marchands & Tableau de Bord Comptable</h2>
              <p className="text-slate-400 text-sm mt-1">
                Suivi du MRR, gestion des souscriptions BaridiMob/Stripe et analyse des contraintes terrain.
              </p>
            </div>

            {/* STATISTIQUES FINANCIÈRES & SAAS KPI */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl">
                <span className="text-xs text-slate-400 font-medium">MRR (Revenu Mensuel Récurrent)</span>
                <div className="text-3xl font-black text-emerald-400 mt-2">
                  {mrrTotalDzd.toLocaleString()} DZD
                </div>
                <span className="text-xs text-slate-400 block mt-1">
                  Équivalent ~{Math.round(mrrTotalDzd / 135)} USD / mois
                </span>
              </div>

              <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl">
                <span className="text-xs text-slate-400 font-medium">ARR Projeté (Annuel)</span>
                <div className="text-3xl font-black text-sky-400 mt-2">
                  {arrProjectedDzd.toLocaleString()} DZD
                </div>
                <span className="text-xs text-sky-500 font-medium">Projection sur base abonnés actifs</span>
              </div>

              <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl">
                <span className="text-xs text-slate-400 font-medium">Répartition des Encaissements</span>
                <div className="text-sm font-bold text-white mt-2 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-emerald-400">BaridiMob :</span>
                    <span>{baridiMobShareDzd.toLocaleString()} DZD</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-indigo-400">Cartes/Stripe :</span>
                    <span>{stripeShareDzd.toLocaleString()} DZD</span>
                  </div>
                </div>
              </div>

              <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl">
                <span className="text-xs text-slate-400 font-medium">Taux d'Abandon (Churn Rate)</span>
                <div className="text-3xl font-black text-amber-400 mt-2">{churnRate} %</div>
                <span className="text-xs text-slate-400 block mt-1">
                  {churnedSubscribers} désabonné(s) sur {totalSubscribers} marchands
                </span>
              </div>
            </div>

            {/* FILTRES & LISTE DES CLIENTS CRM */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="font-bold text-white text-lg">Répertoire Détaillé des Clients Marchands</h3>
                  <p className="text-xs text-slate-400">Consultez l'utilisation, validez les paiements ou lancez un contact direct.</p>
                </div>

                {/* Filtre d'état */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setCrmFilter('ALL')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                      crmFilter === 'ALL' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    Tous ({totalSubscribers})
                  </button>
                  <button
                    onClick={() => setCrmFilter('ACTIVE')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                      crmFilter === 'ACTIVE' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    Actifs ({activeSubscribers})
                  </button>
                  <button
                    onClick={() => setCrmFilter('PENDING')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                      crmFilter === 'PENDING' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    En Attente Reçu ({pendingSubscribers})
                  </button>
                  <button
                    onClick={() => setCrmFilter('CHURNED')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                      crmFilter === 'CHURNED' ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    Désabonnés ({churnedSubscribers})
                  </button>
                </div>
              </div>

              {/* TABLEAU CRM */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="pb-3">Boutique & Marchand</th>
                      <th className="pb-3">Coordonnées (Contact)</th>
                      <th className="pb-3">Forfait & Paiement</th>
                      <th className="pb-3">Consommation Crédits</th>
                      <th className="pb-3">Statut</th>
                      <th className="pb-3 text-right">Actions Directes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredSubscribers.map(sub => (
                      <tr key={sub.id} className="hover:bg-slate-800/30 transition">
                        <td className="py-4">
                          <div className="font-bold text-white">{sub.storeName}</div>
                          <div className="text-xs text-slate-400">{sub.contactName} • {sub.wilaya}</div>
                        </td>
                        <td className="py-4 font-mono text-xs">
                          <div className="text-slate-200">{sub.phone}</div>
                          <div className="text-slate-400">{sub.email}</div>
                        </td>
                        <td className="py-4">
                          <div className="text-xs font-semibold text-white uppercase">{sub.plan}</div>
                          <span className="text-[11px] text-slate-400">
                            {sub.paymentMethod === 'BARIDIMOB' ? '🟢 BaridiMob' : '🔵 Carte Bancaire'}
                          </span>
                        </td>
                        <td className="py-4">
                          <div className="text-xs text-white">
                            {sub.consumedCredits} / {sub.maxCredits > 900000 ? '∞' : sub.maxCredits}
                          </div>
                          <div className="w-24 bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                            <div
                              className="bg-emerald-500 h-full rounded-full"
                              style={{
                                width: `${Math.min(100, (sub.consumedCredits / (sub.maxCredits > 900000 ? 2000 : sub.maxCredits)) * 100)}%`
                              }}
                            />
                          </div>
                        </td>
                        <td className="py-4">
                          {sub.status === 'ACTIVE' && (
                            <span className="px-2.5 py-1 text-xs bg-emerald-500/10 text-emerald-400 rounded-lg font-semibold">
                              ✓ Actif
                            </span>
                          )}
                          {sub.status === 'PENDING_VALIDATION' && (
                            <span className="px-2.5 py-1 text-xs bg-amber-500/10 text-amber-400 rounded-lg font-semibold animate-pulse">
                              ⏳ Reçu en attente
                            </span>
                          )}
                          {sub.status === 'TRIAL' && (
                            <span className="px-2.5 py-1 text-xs bg-sky-500/10 text-sky-400 rounded-lg font-semibold">
                              Essai Gratuit
                            </span>
                          )}
                          {sub.status === 'CHURNED' && (
                            <span className="px-2.5 py-1 text-xs bg-rose-500/10 text-rose-400 rounded-lg font-semibold">
                              Désabonné
                            </span>
                          )}
                        </td>
                        <td className="py-4 text-right space-x-2">
                          {sub.status === 'PENDING_VALIDATION' && (
                            <button
                              onClick={() => handleValidatePendingPayment(sub.id)}
                              className="px-2.5 py-1 bg-emerald-500 text-slate-950 text-xs font-bold rounded-lg hover:bg-emerald-400"
                            >
                              Valider Reçu BaridiMob
                            </button>
                          )}
                          <a
                            href={`https://wa.me/213${sub.phone.replace(/\D/g, '').slice(-9)}?text=Bonjour%20${encodeURIComponent(sub.contactName)},%20concernant%20votre%20compte%20SaaS%20COD%20Recon%20DZ`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block px-2.5 py-1 bg-slate-800 text-emerald-400 text-xs font-semibold rounded-lg hover:bg-slate-700"
                          >
                            WhatsApp
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* RAPPORT DE CONTRAINTES TERRAIN & ANALYSE DU CHURN */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
              <h3 className="font-bold text-white text-lg">Rapport des Contraintes Métier & Analyse des Risques</h3>
              <p className="text-xs text-slate-400">
                Synthèse des difficultés réelles rencontrées par vos clients e-commerçants pour ajuster vos fonctionnalités :
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="p-4 bg-slate-950 border border-rose-900/40 rounded-xl space-y-2">
                  <div className="text-xs font-bold text-rose-400">🚨 Plafond & Délais Transporteurs</div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Les marchands subissent des blocages lors des pics de commandes lorsque le solde flottant chez Yalidine ou ZR n'est pas versé sous 48h.
                  </p>
                  <span className="text-[10px] text-emerald-400 font-semibold block">
                    Solution : Relance automatique des bordereaux en litige.
                  </span>
                </div>

                <div className="p-4 bg-slate-950 border border-amber-900/40 rounded-xl space-y-2">
                  <div className="text-xs font-bold text-amber-400">💳 Plafond Journalier BaridiMob</div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Certains clients dépassent la limite de virement de 100 000 DZD/jour sur l'application BaridiMob lors du renouvellement annuel.
                  </p>
                  <span className="text-[10px] text-emerald-400 font-semibold block">
                    Solution : Échelonnement ou paiement direct par carte internationale.
                  </span>
                </div>

                <div className="p-4 bg-slate-950 border border-sky-900/40 rounded-xl space-y-2">
                  <div className="text-xs font-bold text-sky-400">📦 Taux de Retour Colis (RTO)</div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Le motif n°1 de perte de rentabilité pour vos boutiques abonnées reste les clients injoignables au pas de porte.
                  </p>
                  <span className="text-[10px] text-emerald-400 font-semibold block">
                    Solution : Confirmation WhatsApp obligatoire avant expédition du colis.
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* ONGLET 2 : VUE OPÉRATIONNELLE COD */}
        {/* ======================================================== */}
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

        {/* ======================================================== */}
        {/* ONGLET 3 : FILTRAGE IP */}
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

        {/* ======================================================== */}
        {/* ONGLET 4 : TRANSPORTEURS */}
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

        {/* ======================================================== */}
        {/* ONGLET 5 : FORFAITS, GRILLE TARIFAIRE & RÈGLEMENTS */}
        {activeTab === 'billing' && (
          <div className="space-y-8">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <h2 className="text-3xl font-extrabold text-white">Choisissez le Forfait Adapté à Votre Boutique</h2>
              <p className="text-slate-400 text-sm">
                Activez vos réconciliations COD et sécurisez vos marges dès aujourd'hui.
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
              {/* PLAN 1 : GRATUIT */}
              <div
                onClick={() => setSelectedPlan('free')}
                className={`cursor-pointer rounded-2xl p-6 border transition relative flex flex-col justify-between ${
                  selectedPlan === 'free'
                    ? 'bg-slate-900 border-emerald-500 shadow-xl ring-2 ring-emerald-500'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Essai Gratuit</span>
                    <span className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[10px] rounded">Crédit Limité</span>
                  </div>
                  <h3 className="text-xl font-bold text-white">{plans.free.name}</h3>
                  <div className="my-6">
                    <div className="text-3xl font-black text-white">0 DZD <span className="text-sm font-normal text-slate-400">/ 0 $</span></div>
                    <span className="text-[11px] text-slate-500">Sans carte bancaire requise</span>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-300 border-t border-slate-800/80 pt-4">
                    <li>✓ 50 commandes / mois</li>
                    <li>✓ Connexion Yalidine & ZR Express</li>
                    <li>✓ Détection des écarts</li>
                  </ul>
                </div>
                <button
                  type="button"
                  className={`mt-6 w-full py-2.5 rounded-xl text-xs font-bold transition ${
                    selectedPlan === 'free' ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800/60 text-slate-400'
                  }`}
                >
                  {selectedPlan === 'free' ? 'Plan Actif Sélectionné' : 'Choisir le Forfait Gratuit'}
                </button>
              </div>

              {/* PLAN 2 : BUSINESS */}
              <div
                onClick={() => setSelectedPlan('business')}
                className={`cursor-pointer rounded-2xl p-6 border transition relative flex flex-col justify-between ${
                  selectedPlan === 'business'
                    ? 'bg-slate-900 border-emerald-500 shadow-xl ring-2 ring-emerald-500'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">Recommandé</span>
                    <span className="px-2 py-0.5 bg-sky-500/20 text-sky-400 text-[10px] font-bold rounded">Populaire</span>
                  </div>
                  <h3 className="text-xl font-bold text-white">{plans.business.name}</h3>
                  <div className="my-6">
                    <div className="text-3xl font-black text-white">
                      {getPrice('business').dzd.toLocaleString()} DZD
                      <span className="text-sm font-normal text-slate-400"> ({getPrice('business').usd} $)</span>
                    </div>
                    <span className="text-[11px] text-emerald-400 font-medium">{getPrice('business').periodText}</span>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-300 border-t border-slate-800/80 pt-4">
                    <li>✓ Jusqu'à 500 commandes / mois</li>
                    <li>✓ Réconciliation automatique quotidienne</li>
                    <li>✓ Module Anti-RTO avec confirmation WhatsApp</li>
                    <li>✓ Restriction IP contre le spam</li>
                  </ul>
                </div>
                <button
                  type="button"
                  className={`mt-6 w-full py-2.5 rounded-xl text-xs font-bold transition ${
                    selectedPlan === 'business' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-white'
                  }`}
                >
                  {selectedPlan === 'business' ? 'Forfait Sélectionné' : 'Choisir le Pack Business'}
                </button>
              </div>

              {/* PLAN 3 : ULTRA PRO */}
              <div
                onClick={() => setSelectedPlan('ultra')}
                className={`cursor-pointer rounded-2xl p-6 border transition relative flex flex-col justify-between ${
                  selectedPlan === 'ultra'
                    ? 'bg-slate-900 border-emerald-500 shadow-xl ring-2 ring-emerald-500'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Enterprise</span>
                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] font-bold rounded">Illimité</span>
                  </div>
                  <h3 className="text-xl font-bold text-white">{plans.ultra.name}</h3>
                  <div className="my-6">
                    <div className="text-3xl font-black text-white">
                      {getPrice('ultra').dzd.toLocaleString()} DZD
                      <span className="text-sm font-normal text-slate-400"> ({getPrice('ultra').usd} $)</span>
                    </div>
                    <span className="text-[11px] text-emerald-400 font-medium">{getPrice('ultra').periodText}</span>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-300 border-t border-slate-800/80 pt-4">
                    <li>✓ Commandes & clients 100% ILLIMITÉS</li>
                    <li>✓ Multi-boutiques & multi-comptes livreurs</li>
                    <li>✓ Export comptable certifié (Excel, PDF)</li>
                    <li>✓ Support VIP 7j/7 par téléphone et WhatsApp</li>
                  </ul>
                </div>
                <button
                  type="button"
                  className={`mt-6 w-full py-2.5 rounded-xl text-xs font-bold transition ${
                    selectedPlan === 'ultra' ? 'bg-amber-500 text-slate-950 font-extrabold' : 'bg-slate-800 text-white'
                  }`}
                >
                  {selectedPlan === 'ultra' ? 'Forfait Sélectionné' : 'Choisir le Pack Ultra Illimité'}
                </button>
              </div>
            </div>

            {/* GUICHET DE RÈGLEMENT */}
            {selectedPlan !== 'free' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
                {/* FORMULAIRE CARTE */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                    <span className="font-bold text-white">💳 Paiement par Carte Universelle</span>
                    <span className="text-xs font-mono text-slate-400">VISA / MASTERCARD</span>
                  </div>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      setPaymentProcessing(true);
                      setTimeout(() => {
                        setPaymentProcessing(false);
                        setPaymentSuccess(true);
                        setTimeout(() => setPaymentSuccess(false), 5000);
                      }, 1800);
                    }}
                    className="space-y-3"
                  >
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Nom sur la carte</label>
                      <input
                        type="text"
                        required
                        placeholder="MOHAMED BENALI"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Numéro de carte</label>
                      <input
                        type="text"
                        required
                        placeholder="4000 1234 5678 9010"
                        value={cardNumber}
                        onChange={handleCardNumberChange}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        required
                        placeholder="MM/AA"
                        value={cardExpiry}
                        onChange={handleExpiryChange}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono"
                      />
                      <input
                        type="password"
                        required
                        placeholder="CVV"
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value.slice(0, 4))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono"
                      />
                    </div>
                    {paymentSuccess && (
                      <div className="p-2.5 bg-emerald-500/10 text-emerald-400 text-xs rounded-lg text-center">
                        ✓ Paiement validé avec succès !
                      </div>
                    )}
                    <button
                      type="submit"
                      disabled={paymentProcessing}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl text-sm transition"
                    >
                      {paymentProcessing ? 'Validation...' : `Payer ${getPrice(selectedPlan).usd} $ ${getPrice(selectedPlan).periodText}`}
                    </button>
                  </form>
                </div>

                {/* COMPTE OFFICIEL BARIDIMOB */}
                <div className="bg-slate-900 border-2 border-emerald-500 rounded-2xl p-6 space-y-4 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-full">
                        Compte Bénéficiaire Officiel
                      </span>
                      <span className="text-xs text-slate-400">Algérie Poste (BaridiMob)</span>
                    </div>
                    <div className="text-2xl font-black text-white">
                      {getPrice(selectedPlan).dzd.toLocaleString()} DZD {getPrice(selectedPlan).periodText}
                    </div>

                    <div className="p-4 bg-slate-950 border border-emerald-500/30 rounded-xl space-y-2 text-xs mt-3">
                      <div className="flex justify-between border-b border-slate-800 pb-1.5">
                        <span className="text-slate-400">Bénéficiaire :</span>
                        <span className="text-white font-bold">{adminName}</span>
                      </div>
                      <div className="text-slate-400 pt-1">RIP BaridiMob (20 chiffres) :</div>
                      <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-between">
                        <span className="font-mono text-emerald-400 font-bold select-all text-sm">{adminRip}</span>
                        <button
                          onClick={handleCopyRip}
                          className="px-2.5 py-1 bg-emerald-500 text-slate-950 text-xs font-bold rounded hover:bg-emerald-400"
                        >
                          {copySuccess ? 'Copié !' : 'Copier'}
                        </button>
                      </div>
                    </div>
                  </div>

                  <button className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-3 rounded-xl text-sm transition">
                    Téléverser le Reçu de Virement BaridiMob
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}