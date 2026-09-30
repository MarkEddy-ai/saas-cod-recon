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
  status: 'OVERCHARGED' | 'UNJUSTIFIED' | 'CONFORME';
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
  const [activeTab, setActiveTab] = useState<'rto_audit' | 'ghosts' | 'dispute' | 'import' | 'crm' | 'overview' | 'orders' | 'carriers' | 'billing'>('rto_audit');
  const [copySuccess, setCopySuccess] = useState(false);

  // Coordonnées officielles du bénéficiaire
  const adminName = "COD Reconciliation DZ";
  const adminRip = "00799999000232882074";

  // DONNÉES AUDIT DES RETOURS (RTO AUDIT)
  const [rtoAudits, setRtoAudits] = useState<RtoAuditRow[]>([
    {
      tracking: "yal_ret_104821",
      carrier: "Yalidine Express",
      customerName: "Kamel Zerrouki",
      wilaya: "Boumerdès (35)",
      returnReason: "Client Injoignable",
      negotiatedReturnFee: 200,
      chargedReturnFee: 550,
      overchargedFee: 350,
      callLogVerified: false,
      status: "OVERCHARGED"
    },
    {
      tracking: "zr_ret_992144",
      carrier: "ZR Express",
      customerName: "Imane Sahli",
      wilaya: "Tizi Ouzou (15)",
      returnReason: "Adresse Incomplète",
      negotiatedReturnFee: 250,
      chargedReturnFee: 600,
      overchargedFee: 350,
      callLogVerified: false,
      status: "UNJUSTIFIED"
    },
    {
      tracking: "yal_ret_104899",
      carrier: "Yalidine Express",
      customerName: "Tahar Bouzid",
      wilaya: "Médéa (26)",
      returnReason: "Refus - Colis Non Conforme",
      negotiatedReturnFee: 250,
      chargedReturnFee: 250,
      overchargedFee: 0,
      callLogVerified: true,
      status: "CONFORME"
    },
    {
      tracking: "zr_ret_774012",
      carrier: "ZR Express",
      customerName: "Nadia Cherfa",
      wilaya: "Biskra (07)",
      returnReason: "Client Absent",
      negotiatedReturnFee: 300,
      chargedReturnFee: 750,
      overchargedFee: 450,
      callLogVerified: false,
      status: "OVERCHARGED"
    }
  ]);

  // Calculs RTO Audit
  const totalRtoOvercharged = rtoAudits.reduce((acc, r) => acc + r.overchargedFee, 0);
  const totalRtoCount = rtoAudits.length;
  const unjustifiedCount = rtoAudits.filter(r => r.status === 'UNJUSTIFIED' || !r.callLogVerified).length;

  const handleExportRtoAuditCsv = () => {
    const headers = "N° Tracking;Transporteur;Client;Wilaya;Motif de Retour;Frais Convenus (DZD);Frais Facturés (DZD);Trop-Perçu à Rembourser (DZD);Appel Vérifié;Statut\n";
    const rows = rtoAudits.map(r =>
      `${r.tracking};${r.carrier};${r.customerName};${r.wilaya};${r.returnReason};${r.negotiatedReturnFee};${r.chargedReturnFee};${r.overchargedFee};${r.callLogVerified ? 'Oui' : 'Non'};${r.status}`
    ).join("\n");

    const blob = new Blob(["\uFEFF" + headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Audit_Frais_Retour_RTO_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // DONNÉES COLIS FANTÔMES
  const [ghostPackages] = useState<GhostPackage[]>([
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
    }
  ]);

  const totalStuckCapital = ghostPackages.reduce((acc, p) => acc + p.declaredValueDzd, 0);

  // LITIGES
  const [importedData] = useState<ParsedReconRow[]>([
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
    }
  ]);

  const disputeRows = importedData.filter(r => r.status === 'UNDERPAID' || r.variance < 0);
  const totalDisputeAmount = disputeRows.reduce((acc, r) => acc + Math.abs(r.variance), 0);

  // FORFAITS
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'business' | 'ultra'>('business');

  // FORMULAIRE CARTE
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // CRM
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
              onClick={() => setActiveTab('rto_audit')}
              className={`w-full text-left px-3 py-2.5 rounded-lg font-medium transition flex items-center justify-between ${
                activeTab === 'rto_audit' ? 'bg-rose-500/10 text-rose-400 font-bold' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <span>🔄 Audit Frais de Retour</span>
              {totalRtoOvercharged > 0 && (
                <span className="px-2 py-0.5 text-[10px] bg-rose-500/20 text-rose-400 rounded-full font-bold">
                  -{totalRtoOvercharged} DA
                </span>
              )}
            </button>
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
          <div className="text-xs text-slate-400 mb-1">Entité Officielle :</div>
          <div className="text-sm font-semibold text-white">{adminName}</div>
          <div className="text-xs text-emerald-400 mb-3 font-medium">Passerelle Certifiée Algérie Poste</div>
          <Link href="/auth" className="text-xs text-rose-400 hover:underline">Déconnexion</Link>
        </div>
      </aside>

      {/* CONTENU PRINCIPAL */}
      <main className="flex-1 p-8 overflow-y-auto">
        {/* Header Mobile */}
        <div className="flex md:hidden justify-between items-center mb-6 pb-4 border-b border-slate-800">
          <span className="font-bold text-emerald-400">COD Recon DZ</span>
          <div className="flex gap-2">
            <button onClick={() => setActiveTab('rto_audit')} className="text-xs p-2 bg-slate-800 rounded">Retours</button>
            <button onClick={() => setActiveTab('ghosts')} className="text-xs p-2 bg-slate-800 rounded">Fantômes</button>
            <button onClick={() => setActiveTab('billing')} className="text-xs p-2 bg-slate-800 rounded">Forfaits</button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* FONCTIONNALITÉ 4 : CALCULATEUR & AUDIT DES RETOURS (RTO) */}
        {/* ======================================================== */}
        {activeTab === 'rto_audit' && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-3xl font-extrabold text-white">Calculateur & Audit des Frais de Retour (RTO)</h2>
                <p className="text-slate-400 text-sm mt-1">
                  Détection des retours surfacturés par rapport à vos tarifs contractuels et contestation des faux échecs de livraison.
                </p>
              </div>

              <button
                onClick={handleExportRtoAuditCsv}
                className="bg-rose-500 hover:bg-rose-600 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition shadow-lg shadow-rose-500/20 flex items-center gap-2"
              >
                <span>📥 Exporter Bordereau de Surfacturation (.CSV)</span>
              </button>
            </div>

            {/* SYNTHÈSE DE LA SURFACTURATION */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl">
                <span className="text-xs text-slate-400 font-medium">Surfacturation RTO Détectée</span>
                <div className="text-3xl font-black text-rose-400 mt-2">
                  +{totalRtoOvercharged.toLocaleString()} DZD
                </div>
                <span className="text-[11px] text-rose-500 font-semibold block mt-1">
                  Trop-perçu prélevé indûment
                </span>
              </div>

              <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl">
                <span className="text-xs text-slate-400 font-medium">Colis Retournés Audités</span>
                <div className="text-3xl font-black text-white mt-2">
                  {totalRtoCount} colis
                </div>
                <span className="text-[11px] text-slate-400 block mt-1">
                  Sur le dernier cycle de facturation
                </span>
              </div>

              <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl">
                <span className="text-xs text-slate-400 font-medium">Faux Échecs / Non Justifiés</span>
                <div className="text-3xl font-black text-amber-400 mt-2">
                  {unjustifiedCount} colis
                </div>
                <span className="text-[11px] text-amber-500 font-semibold block mt-1">
                  Zéro preuve d'appel au destinataire
                </span>
              </div>

              <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl">
                <span className="text-xs text-slate-400 font-medium">Économie Potentielle</span>
                <div className="text-3xl font-black text-emerald-400 mt-2">
                  {Math.round((totalRtoOvercharged / 1150) * 100)} %
                </div>
                <span className="text-[11px] text-emerald-400 block mt-1">
                  Récupération sur prochaine quittance
                </span>
              </div>
            </div>

            {/* TABLEAU DES RETOURS AUDITÉS */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="font-bold text-white text-base">Audit Ligne par Ligne des Retours Facturés</h3>
                <span className="text-xs px-2.5 py-1 bg-slate-800 text-slate-300 rounded-lg">
                  Grille contractuelle active : 200 à 300 DZD / retour
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="pb-3">N° Tracking</th>
                      <th className="pb-3">Transporteur</th>
                      <th className="pb-3">Client & Wilaya</th>
                      <th className="pb-3">Motif Invoqué</th>
                      <th className="pb-3">Tarif Convenu</th>
                      <th className="pb-3">Tarif Prélevé</th>
                      <th className="pb-3">Écart Trop-Perçu</th>
                      <th className="pb-3 text-right">Preuve d'Appel</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                    {rtoAudits.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30 transition">
                        <td className="py-3 font-semibold text-white">{item.tracking}</td>
                        <td className="py-3 font-sans text-slate-300">{item.carrier}</td>
                        <td className="py-3 font-sans">
                          <div className="text-slate-200">{item.customerName}</div>
                          <div className="text-[11px] text-slate-400">{item.wilaya}</div>
                        </td>
                        <td className="py-3 font-sans text-slate-400">{item.returnReason}</td>
                        <td className="py-3 text-slate-300">{item.negotiatedReturnFee} DZD</td>
                        <td className="py-3 font-bold text-rose-400">{item.chargedReturnFee} DZD</td>
                        <td className="py-3">
                          {item.overchargedFee > 0 ? (
                            <span className="px-2 py-0.5 bg-rose-500/10 text-rose-400 rounded font-bold">
                              +{item.overchargedFee} DZD
                            </span>
                          ) : (
                            <span className="text-slate-500">0 DZD</span>
                          )}
                        </td>
                        <td className="py-3 text-right font-sans">
                          {item.callLogVerified ? (
                            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded text-[11px] font-semibold">
                              ✓ Appel Confirmé
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded text-[11px] font-semibold animate-pulse">
                              ⚠️ Aucun Appel Tracé
                            </span>
                          )}
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
        {/* ONGLET 2 : RADAR COLIS FANTÔMES                         */}
        {/* ======================================================== */}
        {activeTab === 'ghosts' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Radar Anti-Colis Fantômes & Bloqués en Hub</h2>
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl">
              <span className="text-xs text-slate-400">Capital Immobilisé</span>
              <div className="text-3xl font-black text-amber-400 mt-2">{totalStuckCapital.toLocaleString()} DZD</div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* ONGLET 3 : LITIGES & RÉCLAMATIONS                        */}
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
        {/* ONGLET 4 : IMPORTATION BORDEREAU                         */}
        {activeTab === 'import' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Importateur Universel de Bordereaux</h2>
            <p className="text-slate-400 text-sm">Glissez-déposez vos fichiers pour lancer la réconciliation.</p>
          </div>
        )}

        {/* ======================================================== */}
        {/* ONGLET 5 : CRM & COMPTABILITÉ                            */}
        {activeTab === 'crm' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">CRM Marchands & Tableau de Bord Comptable</h2>
          </div>
        )}

        {/* ======================================================== */}
        {/* ONGLET 6 : VUE OPÉRATIONNELLE                            */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Tableau de bord financier COD</h2>
          </div>
        )}

        {/* ======================================================== */}
        {/* ONGLET 7 : FILTRAGE IP                                   */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Filtrage IP & Commandes Risquées</h2>
          </div>
        )}

        {/* ======================================================== */}
        {/* ONGLET 8 : CONNECTEURS TRANSPORTEURS                     */}
        {activeTab === 'carriers' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Connecteurs Transporteurs Algérie</h2>
          </div>
        )}

        {/* ======================================================== */}
        {/* ONGLET 9 : FORFAITS & PAIEMENTS                          */}
        {activeTab === 'billing' && (
          <div className="space-y-8">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <h2 className="text-3xl font-extrabold text-white">Forfaits & Règlements</h2>
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
              </div>
              <div onClick={() => setSelectedPlan('business')} className={`p-6 rounded-2xl border cursor-pointer ${selectedPlan === 'business' ? 'border-emerald-500 bg-slate-900 ring-2 ring-emerald-500' : 'border-slate-800 bg-slate-900/60'}`}>
                <h3 className="text-xl font-bold">Pack Business</h3>
                <div className="text-3xl font-black my-4">{getPrice('business').dzd.toLocaleString()} DZD</div>
              </div>
              <div onClick={() => setSelectedPlan('ultra')} className={`p-6 rounded-2xl border cursor-pointer ${selectedPlan === 'ultra' ? 'border-emerald-500 bg-slate-900 ring-2 ring-emerald-500' : 'border-slate-800 bg-slate-900/60'}`}>
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
