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
}

interface GhostPackage {
  tracking: string;
  carrier: string;
  customerName: string;
  wilaya: string;
  lastHubLocation: string;
  daysStuck: number;
  declaredValueDzd: number;
  severity: 'WARNING' | 'CRITICAL_LOST';
}

interface ParsedReconRow {
  tracking: string;
  customerName: string;
  wilaya: string;
  carrier: string;
  expectedAmount: number;
  receivedAmount: number;
  variance: number;
  status: 'MATCHED' | 'UNDERPAID' | 'OVERPAID' | 'RTO';
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'ghosts' | 'dispute' | 'import' | 'crm' | 'overview' | 'orders' | 'carriers' | 'billing'>('ghosts');
  const [copySuccess, setCopySuccess] = useState(false);
  const [showLetterModal, setShowLetterModal] = useState(false);

  // Coordonnées officielles du bénéficiaire
  const adminName = "ZOGHLAMI BADREDDINE";
  const adminRip = "00799999000232882074";

  // DONNÉES COLIS FANTÔMES (Stuck / Bloqués en hub)
  const [ghostPackages, setGhostPackages] = useState<GhostPackage[]>([
    {
      tracking: "yal_dz_7701923",
      carrier: "Yalidine Express",
      customerName: "Tarek Berrabah",
      wilaya: "Ouargla (30)",
      lastHubLocation: "Hub Régional Ghardaïa",
      daysStuck: 16,
      declaredValueDzd: 18500,
      severity: "CRITICAL_LOST"
    },
    {
      tracking: "zr_exp_881920",
      carrier: "ZR Express",
      customerName: "Hichem Mebarki",
      wilaya: "Annaba (23)",
      lastHubLocation: "Agence Principale Constantine",
      daysStuck: 12,
      declaredValueDzd: 14200,
      severity: "WARNING"
    },
    {
      tracking: "yal_dz_9918231",
      carrier: "Yalidine Express",
      customerName: "Lyes Amara",
      wilaya: "Béjaïa (06)",
      lastHubLocation: "Centre de Tri Oued Smar (Alger)",
      daysStuck: 19,
      declaredValueDzd: 22000,
      severity: "CRITICAL_LOST"
    },
    {
      tracking: "zr_exp_339102",
      carrier: "ZR Express",
      customerName: "Bilal Khelifi",
      wilaya: "Mostaganem (27)",
      lastHubLocation: "Hub Transit Chlef",
      daysStuck: 8,
      declaredValueDzd: 9500,
      severity: "WARNING"
    }
  ]);

  // Calculs Colis Fantômes
  const totalStuckCapital = ghostPackages.reduce((acc, p) => acc + p.declaredValueDzd, 0);
  const criticalLostCount = ghostPackages.filter(p => p.severity === 'CRITICAL_LOST').length;

  // DONNÉES RÉCONCILIATION & LITIGES
  const [importedData, setImportedData] = useState<ParsedReconRow[]>([
    {
      tracking: "yal_dz_9920145",
      customerName: "Mohamed Amine",
      wilaya: "Alger (16)",
      carrier: "Yalidine Express",
      expectedAmount: 6500,
      receivedAmount: 6500,
      variance: 0,
      status: "MATCHED"
    },
    {
      tracking: "yal_dz_9920146",
      customerName: "Khaled Benacer",
      wilaya: "Oran (31)",
      carrier: "Yalidine Express",
      expectedAmount: 12000,
      receivedAmount: 10500,
      variance: -1500,
      status: "UNDERPAID"
    },
    {
      tracking: "zr_exp_443021",
      customerName: "Fatima Zohra",
      wilaya: "Constantine (25)",
      carrier: "ZR Express",
      expectedAmount: 4800,
      receivedAmount: 4800,
      variance: 0,
      status: "MATCHED"
    },
    {
      tracking: "zr_exp_443022",
      customerName: "Samir Kaci",
      wilaya: "Blida (09)",
      carrier: "ZR Express",
      expectedAmount: 8500,
      receivedAmount: 7000,
      variance: -1500,
      status: "UNDERPAID"
    }
  ]);

  const disputeRows = importedData.filter(r => r.status === 'UNDERPAID' || r.variance < 0);
  const totalDisputeAmount = disputeRows.reduce((acc, r) => acc + Math.abs(r.variance), 0);

  // Tarification
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'business' | 'ultra'>('business');

  // Formulaire Carte
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Données CRM
  const [subscribers] = useState<ClientSubscriber[]>([
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
    }
  ]);

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

  const handleExportGhostPackagesCsv = () => {
    const headers = "N° Suivi;Transporteur;Client;Wilaya;Dernier Hub Connu;Jours d'Immobilisation;Valeur Marchande (DZD);Gravité\n";
    const rows = ghostPackages.map(p =>
      `${p.tracking};${p.carrier};${p.customerName};${p.wilaya};${p.lastHubLocation};${p.daysStuck};${p.declaredValueDzd};${p.severity === 'CRITICAL_LOST' ? 'Présumé Perdu' : 'Alerte Blocage'}`
    ).join("\n");

    const blob = new Blob(["\uFEFF" + headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Colis_Bloques_Hubs_Yalidine_ZR_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
              onClick={() => setActiveTab('ghosts')}
              className={`w-full text-left px-3 py-2.5 rounded-lg font-medium transition flex items-center justify-between ${
                activeTab === 'ghosts' ? 'bg-amber-500/10 text-amber-400 font-bold' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <span>🚨 Colis Fantômes (Hubs)</span>
              {ghostPackages.length > 0 && (
                <span className="px-2 py-0.5 text-[10px] bg-amber-500/20 text-amber-400 rounded-full font-bold">
                  {ghostPackages.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('dispute')}
              className={`w-full text-left px-3 py-2.5 rounded-lg font-medium transition flex items-center justify-between ${
                activeTab === 'dispute' ? 'bg-rose-500/10 text-rose-400 font-bold' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <span>⚖️ Dossiers de Litiges</span>
              {disputeRows.length > 0 && (
                <span className="px-2 py-0.5 text-[10px] bg-rose-500/20 text-rose-400 rounded-full font-bold">
                  {disputeRows.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('import')}
              className={`w-full text-left px-3 py-2.5 rounded-lg font-medium transition ${
                activeTab === 'import' ? 'bg-emerald-500/10 text-emerald-400 font-bold' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              📂 Import Bordereau
            </button>
            <button
              onClick={() => setActiveTab('crm')}
              className={`w-full text-left px-3 py-2.5 rounded-lg font-medium transition ${
                activeTab === 'crm' ? 'bg-emerald-500/10 text-emerald-400 font-bold' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              👥 CRM & Comptabilité
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

      {/* CONTENU PRINCIPAL */}
      <main className="flex-1 p-8 overflow-y-auto">
        {/* Navigation Mobile */}
        <div className="flex md:hidden justify-between items-center mb-6 pb-4 border-b border-slate-800">
          <span className="font-bold text-emerald-400">COD Recon DZ</span>
          <div className="flex gap-2">
            <button onClick={() => setActiveTab('ghosts')} className="text-xs p-2 bg-slate-800 rounded">Fantômes</button>
            <button onClick={() => setActiveTab('dispute')} className="text-xs p-2 bg-slate-800 rounded">Litiges</button>
            <button onClick={() => setActiveTab('billing')} className="text-xs p-2 bg-slate-800 rounded">Forfaits</button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* FONCTIONNALITÉ 3 : DÉTECTION DES COLIS FANTÔMES          */}
        {/* ======================================================== */}
        {activeTab === 'ghosts' && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-3xl font-extrabold text-white">Radar Anti-Colis Fantômes & Bloqués en Hub</h2>
                <p className="text-slate-400 text-sm mt-1">
                  Surveillance des colis immobiles depuis plus de 7 jours chez Yalidine et ZR Express sans tentative de livraison ni retour.
                </p>
              </div>

              <button
                onClick={handleExportGhostPackagesCsv}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs transition shadow-lg shadow-amber-500/20 flex items-center gap-2"
              >
                <span>📥 Exporter Liste des Colis Bloqués (.CSV)</span>
              </button>
            </div>

            {/* SYNTHÈSE DES STOCKS IMMOBILISÉS DANS LA NATURE */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl">
                <span className="text-xs text-slate-400 font-medium">Marchandise Bloquée en Transit</span>
                <div className="text-3xl font-black text-amber-400 mt-2">
                  {totalStuckCapital.toLocaleString()} DZD
                </div>
                <span className="text-[11px] text-amber-500 font-semibold block mt-1">
                  Capital immobilisé chez les transporteurs
                </span>
              </div>

              <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl">
                <span className="text-xs text-slate-400 font-medium">Colis Bloqués (> 7 jours)</span>
                <div className="text-3xl font-black text-white mt-2">
                  {ghostPackages.length} colis
                </div>
                <span className="text-[11px] text-slate-400 block mt-1">
                  Absence de mise à jour de tracking
                </span>
              </div>

              <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl">
                <span className="text-xs text-slate-400 font-medium">Présumés Perdus (> 15 jours)</span>
                <div className="text-3xl font-black text-rose-400 mt-2">
                  {criticalLostCount} colis
                </div>
                <span className="text-[11px] text-rose-500 font-semibold block mt-1">
                  Éligibles au remboursement valeur marchande
                </span>
              </div>

              <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl">
                <span className="text-xs text-slate-400 font-medium">Temps Moyen de Blocage</span>
                <div className="text-3xl font-black text-sky-400 mt-2">
                  13.8 Jours
                </div>
                <span className="text-[11px] text-slate-400 block mt-1">
                  Seuil critique toléré : 5 jours
                </span>
              </div>
            </div>

            {/* TABLEAU DES COLIS FANTÔMES */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="font-bold text-white text-base">Détail des Colis Suspects sans Statut Récent</h3>
                <span className="text-xs px-2.5 py-1 bg-amber-500/10 text-amber-400 rounded-lg font-semibold">
                  Alerte Perte de Stock Active
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="pb-3">N° Tracking</th>
                      <th className="pb-3">Transporteur</th>
                      <th className="pb-3">Dernière Localisation Hub</th>
                      <th className="pb-3">Immobilisation</th>
                      <th className="pb-3">Valeur Déclarée</th>
                      <th className="pb-3">Statut Risque</th>
                      <th className="pb-3 text-right">Action Proactive</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                    {ghostPackages.map((pkg, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30 transition">
                        <td className="py-3 font-semibold text-white">{pkg.tracking}</td>
                        <td className="py-3 font-sans text-slate-300">{pkg.carrier}</td>
                        <td className="py-3 font-sans">
                          <div className="text-slate-200">{pkg.lastHubLocation}</div>
                          <div className="text-[11px] text-slate-400">Destinataire : {pkg.customerName} ({pkg.wilaya})</div>
                        </td>
                        <td className="py-3 font-bold text-amber-400">{pkg.daysStuck} jours</td>
                        <td className="py-3 font-bold text-white">{pkg.declaredValueDzd.toLocaleString()} DZD</td>
                        <td className="py-3 font-sans">
                          {pkg.severity === 'CRITICAL_LOST' ? (
                            <span className="px-2 py-0.5 bg-rose-500/10 text-rose-400 rounded-md font-semibold text-[11px] animate-pulse">
                              🚨 Présumé Perdu
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded-md font-semibold text-[11px]">
                              ⏳ Blocage Hub
                            </span>
                          )}
                        </td>
                        <td className="py-3 text-right font-sans space-x-2">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(`Urgent Réclamation - Colis ${pkg.tracking} bloqué depuis ${pkg.daysStuck} jours au ${pkg.lastHubLocation}.`);
                              alert("Message de réclamation copié !");
                            }}
                            className="px-2.5 py-1 bg-slate-800 text-amber-300 rounded-lg text-xs font-semibold hover:bg-slate-700"
                          >
                            Copier Alerte Agence
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* ONGLET 2 : LITIGES & RÉCLAMATIONS                        */}
        {/* ======================================================== */}
        {activeTab === 'dispute' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Générateur de Dossiers de Litige & Réclamations</h2>
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl">
              <span className="text-xs text-slate-400">Total à réclamer</span>
              <div className="text-3xl font-black text-rose-400 mt-2">{totalDisputeAmount.toLocaleString()} DZD</div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* ONGLET 3 : IMPORTATION BORDEREAU                         */}
        {activeTab === 'import' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Importateur Universel de Bordereaux</h2>
            <p className="text-slate-400 text-sm">Glissez-déposez vos fichiers pour lancer la réconciliation.</p>
          </div>
        )}

        {/* ======================================================== */}
        {/* ONGLET 4 : CRM & COMPTABILITÉ                            */}
        {activeTab === 'crm' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">CRM Marchands & Tableau de Bord Comptable</h2>
          </div>
        )}

        {/* ======================================================== */}
        {/* ONGLET 5 : VUE OPÉRATIONNELLE                            */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Tableau de bord financier COD</h2>
          </div>
        )}

        {/* ======================================================== */}
        {/* ONGLET 6 : FILTRAGE IP                                   */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Filtrage IP & Commandes Risquées</h2>
          </div>
        )}

        {/* ======================================================== */}
        {/* ONGLET 7 : CONNECTEURS TRANSPORTEURS                     */}
        {activeTab === 'carriers' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Connecteurs Transporteurs Algérie</h2>
          </div>
        )}

        {/* ======================================================== */}
        {/* ONGLET 8 : FORFAITS & PAIEMENTS                          */}
        {activeTab === 'billing' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Forfaits & Règlements</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div onClick={() => setSelectedPlan('free')} className={`p-6 rounded-2xl border ${selectedPlan === 'free' ? 'border-emerald-500 bg-slate-900' : 'border-slate-800'}`}>
                <h3 className="text-xl font-bold">Pack Free</h3>
                <div className="text-3xl font-black my-4">0 DZD</div>
              </div>
              <div onClick={() => setSelectedPlan('business')} className={`p-6 rounded-2xl border ${selectedPlan === 'business' ? 'border-emerald-500 bg-slate-900' : 'border-slate-800'}`}>
                <h3 className="text-xl font-bold">Pack Business</h3>
                <div className="text-3xl font-black my-4">{getPrice('business').dzd.toLocaleString()} DZD</div>
              </div>
              <div onClick={() => setSelectedPlan('ultra')} className={`p-6 rounded-2xl border ${selectedPlan === 'ultra' ? 'border-emerald-500 bg-slate-900' : 'border-slate-800'}`}>
                <h3 className="text-xl font-bold">Pack Ultra Illimité</h3>
                <div className="text-3xl font-black my-4">{getPrice('ultra').dzd.toLocaleString()} DZD</div>
              </div>
            </div>

            <div className="bg-slate-900 border-2 border-emerald-500 rounded-2xl p-6 mt-6">
              <div className="text-sm font-bold text-slate-400">Bénéficiaire Officiel BaridiMob :</div>
              <div className="text-lg font-bold text-white">{adminName}</div>
              <div className="font-mono text-emerald-400 font-bold text-lg mt-1 select-all">{adminRip}</div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}