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
  const [activeTab, setActiveTab] = useState<'overview' | 'import' | 'crm' | 'orders' | 'carriers' | 'billing'>('import');
  const [copySuccess, setCopySuccess] = useState(false);
  const [crmFilter, setCrmFilter] = useState<'ALL' | 'ACTIVE' | 'PENDING' | 'CHURNED'>('ALL');

  // Coordonnées officielles du bénéficiaire
  const adminName = "ZOGHLAMI BADREDDINE";
  const adminRip = "00799999000232882074";

  // États du module d'import Drag & Drop
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
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
  const [fileNameUploaded, setFileNameUploaded] = useState<string>("Exemple_Bordereau_Hebdo_Yalidine_ZR.csv");

  // Simulation de traitement intelligent du fichier déposé
  const handleFileProcess = (file: File) => {
    setIsProcessingFile(true);
    setFileNameUploaded(file.name);

    setTimeout(() => {
      // Génération de données réconciliées dynamiques
      const simulatedRows: ParsedReconRow[] = [
        {
          tracking: "IMP-" + Math.floor(100000 + Math.random() * 900000),
          customerName: "Nassim Rahmouni",
          wilaya: "Tipaza (42)",
          carrier: file.name.toLowerCase().includes("zr") ? "ZR Express" : "Yalidine Express",
          expectedAmount: 5400,
          receivedAmount: 5400,
          variance: 0,
          status: "MATCHED"
        },
        {
          tracking: "IMP-" + Math.floor(100000 + Math.random() * 900000),
          customerName: "Yacine Boualem",
          wilaya: "Sétif (19)",
          carrier: file.name.toLowerCase().includes("zr") ? "ZR Express" : "Yalidine Express",
          expectedAmount: 9800,
          receivedAmount: 7800,
          variance: -2000,
          status: "UNDERPAID"
        },
        {
          tracking: "IMP-" + Math.floor(100000 + Math.random() * 900000),
          customerName: "Amina Cherifi",
          wilaya: "Tlemcen (13)",
          carrier: file.name.toLowerCase().includes("zr") ? "ZR Express" : "Yalidine Express",
          expectedAmount: 14500,
          receivedAmount: 14500,
          variance: 0,
          status: "MATCHED"
        },
        {
          tracking: "IMP-" + Math.floor(100000 + Math.random() * 900000),
          customerName: "Walid Guerfi",
          wilaya: "Batna (05)",
          carrier: file.name.toLowerCase().includes("zr") ? "ZR Express" : "Yalidine Express",
          expectedAmount: 3200,
          receivedAmount: 2800,
          variance: -400,
          status: "UNDERPAID"
        }
      ];

      setImportedData(simulatedRows);
      setIsProcessingFile(false);
    }, 1200);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileProcess(e.target.files[0]);
    }
  };

  // Calculs financiers sur le fichier importé
  const totalExpected = importedData.reduce((acc, row) => acc + row.expectedAmount, 0);
  const totalReceived = importedData.reduce((acc, row) => acc + row.receivedAmount, 0);
  const totalDiscrepancy = totalReceived - totalExpected;
  const matchedCount = importedData.filter(row => row.status === 'MATCHED').length;
  const underpaidCount = importedData.filter(row => row.status === 'UNDERPAID').length;

  // Gestion des forfaits & tarification
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'business' | 'ultra'>('business');

  // Formulaire Carte
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Données CRM marchands
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

  // KPI CRM
  const totalSubscribers = subscribers.length;
  const activeSubscribers = subscribers.filter(s => s.status === 'ACTIVE').length;
  const pendingSubscribers = subscribers.filter(s => s.status === 'PENDING_VALIDATION').length;
  const churnedSubscribers = subscribers.filter(s => s.status === 'CHURNED').length;
  const churnRate = ((churnedSubscribers / totalSubscribers) * 100).toFixed(1);

  const mrrTotalDzd = subscribers
    .filter(s => s.status === 'ACTIVE')
    .reduce((acc, curr) => acc + curr.mrrDzd, 0);

  const arrProjectedDzd = mrrTotalDzd * 12;

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
              onClick={() => setActiveTab('import')}
              className={`w-full text-left px-3 py-2.5 rounded-lg font-medium transition flex items-center justify-between ${
                activeTab === 'import' ? 'bg-emerald-500/10 text-emerald-400 font-bold' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <span>📂 Import Bordereau (Drag&Drop)</span>
              <span className="px-1.5 py-0.5 text-[9px] bg-emerald-500/20 text-emerald-400 rounded uppercase font-bold">Nouveau</span>
            </button>
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

      {/* CONTENU PRINCIPAL */}
      <main className="flex-1 p-8 overflow-y-auto">
        {/* Navigation Mobile */}
        <div className="flex md:hidden justify-between items-center mb-6 pb-4 border-b border-slate-800">
          <span className="font-bold text-emerald-400">COD Recon DZ</span>
          <div className="flex gap-2">
            <button onClick={() => setActiveTab('import')} className="text-xs p-2 bg-slate-800 rounded">Import</button>
            <button onClick={() => setActiveTab('crm')} className="text-xs p-2 bg-slate-800 rounded">CRM</button>
            <button onClick={() => setActiveTab('billing')} className="text-xs p-2 bg-slate-800 rounded">Forfaits</button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* FONCTIONNALITÉ 1 : IMPORT DRAG & DROP UNIVERSEL CSV/EXCEL */}
        {/* ======================================================== */}
        {activeTab === 'import' && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-3xl font-extrabold text-white">Importateur Universel de Bordereaux</h2>
                <p className="text-slate-400 text-sm mt-1">
                  Glissez-déposez les fichiers bruts exportés depuis votre espace Yalidine ou ZR Express pour une réconciliation instantanée.
                </p>
              </div>
              <span className="text-xs px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 font-mono">
                Formats : .CSV, .XLSX, .XLS, .TXT
              </span>
            </div>

            {/* ZONE DRAG & DROP INTERACTIVE */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-10 text-center transition duration-200 ${
                isDragging
                  ? 'border-emerald-400 bg-emerald-500/10 scale-[1.01]'
                  : 'border-slate-800 hover:border-slate-700 bg-slate-900/40'
              }`}
            >
              <input
                type="file"
                id="fileUpload"
                accept=".csv, .xlsx, .xls, .txt"
                onChange={handleFileInputChange}
                className="hidden"
              />

              <div className="max-w-md mx-auto space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-slate-800 flex items-center justify-center text-3xl">
                  {isProcessingFile ? '⚙️' : '📥'}
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white">
                    {isProcessingFile
                      ? 'Analyse intelligente du bordereau en cours...'
                      : 'Glissez votre bordereau transporteur ici'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Détection automatique des colonnes Tracking, Montant Encaissé et Frais de Livraison
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="fileUpload"
                    className="inline-block cursor-pointer bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-xs transition"
                  >
                    Parcourir mes fichiers locaux
                  </label>
                </div>

                <div className="text-[11px] text-slate-500 pt-2">
                  Dernier fichier analysé : <span className="font-mono text-slate-300">{fileNameUploaded}</span>
                </div>
              </div>
            </div>

            {/* SYNTHÈSE FINANCIÈRE DE L'IMPORT */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl">
                <span className="text-xs text-slate-400 font-medium">Montant Attendu (Boutique)</span>
                <div className="text-2xl font-bold text-white mt-1">
                  {totalExpected.toLocaleString()} DZD
                </div>
                <span className="text-[11px] text-slate-400">Total commandes déclarées</span>
              </div>

              <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl">
                <span className="text-xs text-slate-400 font-medium">Montant Versé par Transporteur</span>
                <div className="text-2xl font-bold text-emerald-400 mt-1">
                  {totalReceived.toLocaleString()} DZD
                </div>
                <span className="text-[11px] text-emerald-500 font-medium">{matchedCount} colis conformes</span>
              </div>

              <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl">
                <span className="text-xs text-slate-400 font-medium">Déficit Détecté (Écart de Caisse)</span>
                <div className="text-2xl font-bold text-rose-400 mt-1">
                  {totalDiscrepancy.toLocaleString()} DZD
                </div>
                <span className="text-[11px] text-rose-400 font-semibold">{underpaidCount} sous-paiement(s) identifié(s)</span>
              </div>

              <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl">
                <span className="text-xs text-slate-400 font-medium">Taux d'Exactitude Financière</span>
                <div className="text-2xl font-bold text-sky-400 mt-1">
                  {((totalReceived / (totalExpected || 1)) * 100).toFixed(1)} %
                </div>
                <span className="text-[11px] text-sky-400">Audit sans erreur humaine</span>
              </div>
            </div>

            {/* TABLEAU DES LIGNES RÉCONCILIÉES EN DIRECT */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="font-bold text-white text-base">Résultats Détaillés de la Réconciliation Ligne par Ligne</h3>
                <span className="text-xs text-slate-400">{importedData.length} colis audités</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="pb-3">N° Suivi (Tracking)</th>
                      <th className="pb-3">Client & Wilaya</th>
                      <th className="pb-3">Transporteur</th>
                      <th className="pb-3">Montant Attendu</th>
                      <th className="pb-3">Montant Versé</th>
                      <th className="pb-3">Écart Net</th>
                      <th className="pb-3 text-right">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                    {importedData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30 transition">
                        <td className="py-3 font-semibold text-white">{row.tracking}</td>
                        <td className="py-3 font-sans">
                          <div className="text-slate-200">{row.customerName}</div>
                          <div className="text-[11px] text-slate-400">{row.wilaya}</div>
                        </td>
                        <td className="py-3 font-sans text-slate-300">{row.carrier}</td>
                        <td className="py-3 text-white">{row.expectedAmount.toLocaleString()} DZD</td>
                        <td className="py-3 text-emerald-400 font-bold">{row.receivedAmount.toLocaleString()} DZD</td>
                        <td className="py-3">
                          {row.variance === 0 ? (
                            <span className="text-slate-400">0 DZD</span>
                          ) : (
                            <span className="text-rose-400 font-bold">{row.variance.toLocaleString()} DZD</span>
                          )}
                        </td>
                        <td className="py-3 text-right font-sans">
                          {row.status === 'MATCHED' ? (
                            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-md font-semibold">
                              ✓ Conforme
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-rose-500/10 text-rose-400 rounded-md font-semibold">
                              ⚠️ Déficit Transporteur
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
        {/* ONGLET 2 : CRM MARCHANDS & COMPTABILITÉ */}
        {/* ======================================================== */}
        {activeTab === 'crm' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-extrabold text-white">CRM Marchands & Tableau de Bord Comptable</h2>
              <p className="text-slate-400 text-sm mt-1">
                Suivi du MRR, gestion des souscriptions BaridiMob/Stripe et analyse des contraintes terrain.
              </p>
            </div>

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
                <span className="text-xs text-sky-500 font-medium">Base abonnés actifs</span>
              </div>

              <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl">
                <span className="text-xs text-slate-400 font-medium">Taux d'Abandon (Churn Rate)</span>
                <div className="text-3xl font-black text-amber-400 mt-2">{churnRate} %</div>
                <span className="text-xs text-slate-400 block mt-1">
                  {churnedSubscribers} désabonné(s) sur {totalSubscribers} marchands
                </span>
              </div>

              <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl">
                <span className="text-xs text-slate-400 font-medium">Validations BaridiMob en Attente</span>
                <div className="text-3xl font-black text-amber-400 mt-2">{pendingSubscribers}</div>
                <span className="text-xs text-slate-400 block mt-1">Reçus à approuver</span>
              </div>
            </div>

            {/* TABLEAU CRM */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <h3 className="font-bold text-white text-lg">Répertoire Détaillé des Clients Marchands</h3>
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
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="pb-3">Boutique & Marchand</th>
                      <th className="pb-3">Contact</th>
                      <th className="pb-3">Forfait & Mode</th>
                      <th className="pb-3">Statut</th>
                      <th className="pb-3 text-right">Actions Directes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {subscribers
                      .filter(s => crmFilter === 'ALL' || (crmFilter === 'ACTIVE' && s.status === 'ACTIVE') || (crmFilter === 'PENDING' && s.status === 'PENDING_VALIDATION'))
                      .map(sub => (
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
          </div>
        )}

        {/* ======================================================== */}
        {/* ONGLET 3 : VUE OPÉRATIONNELLE */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Tableau de bord financier COD</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl">
                <span className="text-xs text-slate-400 font-medium">Fonds Réconciliés Conformes</span>
                <div className="text-2xl font-bold text-emerald-400 mt-2">1 425 000 DZD</div>
              </div>
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl">
                <span className="text-xs text-slate-400 font-medium">Déficit Transporteur</span>
                <div className="text-2xl font-bold text-rose-400 mt-2">48 500 DZD</div>
              </div>
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl">
                <span className="text-xs text-slate-400 font-medium">Taux d'Échec Évités</span>
                <div className="text-2xl font-bold text-amber-400 mt-2">14.8 %</div>
              </div>
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl">
                <span className="text-xs text-slate-400 font-medium">Commandes Bloquées (IP)</span>
                <div className="text-2xl font-bold text-sky-400 mt-2">23</div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* ONGLET 4 : FILTRAGE IP */}
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
        {/* ONGLET 5 : TRANSPORTEURS */}
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
        {/* ONGLET 6 : FORFAITS & PAIEMENTS */}
        {activeTab === 'billing' && (
          <div className="space-y-8">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <h2 className="text-3xl font-extrabold text-white">Choisissez le Forfait Adapté à Votre Boutique</h2>
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
              {/* FREE */}
              <div onClick={() => setSelectedPlan('free')} className={`cursor-pointer rounded-2xl p-6 border transition ${selectedPlan === 'free' ? 'bg-slate-900 border-emerald-500 ring-2 ring-emerald-500' : 'bg-slate-900/60 border-slate-800'}`}>
                <h3 className="text-xl font-bold text-white">Pack Free</h3>
                <div className="my-4 text-3xl font-black text-white">0 DZD</div>
                <p className="text-xs text-slate-400">50 commandes de test</p>
              </div>
              {/* BUSINESS */}
              <div onClick={() => setSelectedPlan('business')} className={`cursor-pointer rounded-2xl p-6 border transition ${selectedPlan === 'business' ? 'bg-slate-900 border-emerald-500 ring-2 ring-emerald-500' : 'bg-slate-900/60 border-slate-800'}`}>
                <h3 className="text-xl font-bold text-white">Pack Business</h3>
                <div className="my-4 text-3xl font-black text-white">{getPrice('business').dzd.toLocaleString()} DZD <span className="text-xs font-normal">({getPrice('business').usd} $)</span></div>
                <p className="text-xs text-slate-400">Jusqu'à 500 commandes / mois</p>
              </div>
              {/* ULTRA */}
              <div onClick={() => setSelectedPlan('ultra')} className={`cursor-pointer rounded-2xl p-6 border transition ${selectedPlan === 'ultra' ? 'bg-slate-900 border-emerald-500 ring-2 ring-emerald-500' : 'bg-slate-900/60 border-slate-800'}`}>
                <h3 className="text-xl font-bold text-white">Pack Ultra Illimité</h3>
                <div className="my-4 text-3xl font-black text-white">{getPrice('ultra').dzd.toLocaleString()} DZD <span className="text-xs font-normal">({getPrice('ultra').usd} $)</span></div>
                <p className="text-xs text-slate-400">Commandes 100% illimitées</p>
              </div>
            </div>

            {selectedPlan !== 'free' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
                {/* CARTE BANCAIRE */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                    <span className="font-bold text-white">💳 Carte Bancaire Universelle</span>
                    <span className="text-xs font-mono text-slate-400">VISA / MASTERCARD</span>
                  </div>
                  <form onSubmit={(e) => { e.preventDefault(); setPaymentProcessing(true); setTimeout(() => { setPaymentProcessing(false); setPaymentSuccess(true); }, 1500); }} className="space-y-3">
                    <input type="text" required placeholder="NOM SUR LA CARTE" value={cardName} onChange={(e) => setCardName(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white" />
                    <input type="text" required placeholder="NUMERO DE CARTE" value={cardNumber} onChange={handleCardNumberChange} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono" />
                    <div className="grid grid-cols-2 gap-2">
                      <input type="text" required placeholder="MM/AA" value={cardExpiry} onChange={handleExpiryChange} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono" />
                      <input type="password" required placeholder="CVV" value={cardCvc} onChange={(e) => setCardCvc(e.target.value.slice(0, 4))} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono" />
                    </div>
                    {paymentSuccess && <div className="p-2 bg-emerald-500/10 text-emerald-400 text-xs rounded text-center">✓ Paiement Validé !</div>}
                    <button type="submit" disabled={paymentProcessing} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl text-sm transition">
                      {paymentProcessing ? 'Validation...' : `Payer ${getPrice(selectedPlan).usd} $`}
                    </button>
                  </form>
                </div>

                {/* BARIDIMOB */}
                <div className="bg-slate-900 border-2 border-emerald-500 rounded-2xl p-6 space-y-4 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-full">Compte Bénéficiaire Officiel</span>
                      <span className="text-xs text-slate-400">Algérie Poste</span>
                    </div>
                    <div className="text-2xl font-black text-white">{getPrice(selectedPlan).dzd.toLocaleString()} DZD</div>
                    <div className="p-4 bg-slate-950 border border-emerald-500/30 rounded-xl space-y-2 text-xs mt-3">
                      <div className="flex justify-between border-b border-slate-800 pb-1.5">
                        <span className="text-slate-400">Bénéficiaire :</span>
                        <span className="text-white font-bold">{adminName}</span>
                      </div>
                      <div className="text-slate-400 pt-1">RIP BaridiMob (20 chiffres) :</div>
                      <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-between">
                        <span className="font-mono text-emerald-400 font-bold select-all text-sm">{adminRip}</span>
                        <button onClick={handleCopyRip} className="px-2.5 py-1 bg-emerald-500 text-slate-950 text-xs font-bold rounded hover:bg-emerald-400">
                          {copySuccess ? 'Copié !' : 'Copier'}
                        </button>
                      </div>
                    </div>
                  </div>
                  <button className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-3 rounded-xl text-sm transition">
                    Téléverser le Reçu BaridiMob
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