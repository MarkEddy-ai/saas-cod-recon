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
  const [activeTab, setActiveTab] = useState<'dispute' | 'import' | 'crm' | 'overview' | 'orders' | 'carriers' | 'billing'>('dispute');
  const [copySuccess, setCopySuccess] = useState(false);
  const [crmFilter, setCrmFilter] = useState<'ALL' | 'ACTIVE' | 'PENDING' | 'CHURNED'>('ALL');
  const [showLetterModal, setShowLetterModal] = useState(false);

  // Coordonnées officielles du bénéficiaire
  const adminName = "ZOGHLAMI BADREDDINE";
  const adminRip = "00799999000232882074";

  // États de l'import et de réconciliation
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [fileNameUploaded, setFileNameUploaded] = useState<string>("Bordereau_Versement_Hebdo.csv");
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
    },
    {
      tracking: "yal_dz_9920188",
      customerName: "Abdelkader D.",
      wilaya: "Chlef (02)",
      carrier: "Yalidine Express",
      expectedAmount: 9400,
      receivedAmount: 7400,
      variance: -2000,
      status: "UNDERPAID"
    }
  ]);

  // Extraction automatique des litiges
  const disputeRows = importedData.filter(r => r.status === 'UNDERPAID' || r.variance < 0);
  const totalDisputeAmount = disputeRows.reduce((acc, r) => acc + Math.abs(r.variance), 0);

  // Fonction d'exportation CSV / Excel du dossier de litige
  const handleExportDisputeCsv = () => {
    const headers = "N° Suivi (Tracking);Transporteur;Client;Wilaya;Montant Attendu (DZD);Montant Encaissé (DZD);Déficit à Réclamer (DZD)\n";
    const rows = disputeRows.map(r =>
      `${r.tracking};${r.carrier};${r.customerName};${r.wilaya};${r.expectedAmount};${r.receivedAmount};${Math.abs(r.variance)}`
    ).join("\n");

    const blob = new Blob(["\uFEFF" + headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Dossier_Litige_Reclamation_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Traitement Drag & Drop
  const handleFileProcess = (file: File) => {
    setIsProcessingFile(true);
    setFileNameUploaded(file.name);
    setTimeout(() => {
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

  // CRM
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
    }
  ]);

  const totalSubscribers = subscribers.length;
  const activeSubscribers = subscribers.filter(s => s.status === 'ACTIVE').length;
  const pendingSubscribers = subscribers.filter(s => s.status === 'PENDING_VALIDATION').length;
  const mrrTotalDzd = subscribers.filter(s => s.status === 'ACTIVE').reduce((acc, curr) => acc + curr.mrrDzd, 0);

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
              className={`w-full text-left px-3 py-2.5 rounded-lg font-medium transition flex items-center justify-between ${
                activeTab === 'import' ? 'bg-emerald-500/10 text-emerald-400 font-bold' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <span>📂 Import Bordereau</span>
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
            <button onClick={() => setActiveTab('dispute')} className="text-xs p-2 bg-slate-800 rounded">Litiges</button>
            <button onClick={() => setActiveTab('import')} className="text-xs p-2 bg-slate-800 rounded">Import</button>
            <button onClick={() => setActiveTab('billing')} className="text-xs p-2 bg-slate-800 rounded">Forfaits</button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* FONCTIONNALITÉ 2 : DOSSIERS DE LITIGES & RÉCLAMATIONS    */}
        {/* ======================================================== */}
        {activeTab === 'dispute' && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-3xl font-extrabold text-white">Générateur de Dossiers de Litige & Réclamations</h2>
                <p className="text-slate-400 text-sm mt-1">
                  Exportez les preuves d'anomalies financières pour exiger le remboursement immédiat auprès de Yalidine ou ZR Express.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowLetterModal(true)}
                  className="bg-slate-800 hover:bg-slate-700 text-white font-semibold px-4 py-2.5 rounded-xl text-xs transition border border-slate-700 flex items-center gap-2"
                >
                  <span>📄 Voir Lettre Formelle</span>
                </button>
                <button
                  onClick={handleExportDisputeCsv}
                  className="bg-rose-500 hover:bg-rose-600 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition shadow-lg shadow-rose-500/20 flex items-center gap-2"
                >
                  <span>📥 Exporter Dossier Litige (.CSV / Excel)</span>
                </button>
              </div>
            </div>

            {/* SYNTHÈSE DU RECOUVREMENT */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl">
                <span className="text-xs text-slate-400 font-medium">Montant Total à Réclamer</span>
                <div className="text-3xl font-black text-rose-400 mt-2">
                  {totalDisputeAmount.toLocaleString()} DZD
                </div>
                <span className="text-[11px] text-rose-500 font-semibold block mt-1">
                  Somme nette due par les transporteurs
                </span>
              </div>

              <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl">
                <span className="text-xs text-slate-400 font-medium">Colis en Anomalie</span>
                <div className="text-3xl font-black text-amber-400 mt-2">
                  {disputeRows.length} colis
                </div>
                <span className="text-[11px] text-slate-400 block mt-1">
                  Sur {importedData.length} colis audités
                </span>
              </div>

              <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl">
                <span className="text-xs text-slate-400 font-medium">Transporteurs Concédants</span>
                <div className="text-sm font-bold text-white mt-2 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-300">Yalidine :</span>
                    <span className="text-rose-400 font-mono">
                      {disputeRows.filter(r => r.carrier.includes("Yalidine")).reduce((acc, r) => acc + Math.abs(r.variance), 0).toLocaleString()} DZD
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">ZR Express :</span>
                    <span className="text-rose-400 font-mono">
                      {disputeRows.filter(r => r.carrier.includes("ZR")).reduce((acc, r) => acc + Math.abs(r.variance), 0).toLocaleString()} DZD
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl">
                <span className="text-xs text-slate-400 font-medium">Délai Légal de Contestation</span>
                <div className="text-3xl font-black text-sky-400 mt-2">7 Jours</div>
                <span className="text-[11px] text-slate-400 block mt-1">
                  À compter de la réception du bordereau
                </span>
              </div>
            </div>

            {/* TABLEAU DES COLIS EN LITIGE PRÊT POUR RÉCLAMATION */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <div>
                  <h3 className="font-bold text-white text-base">Bordereau de Preuves : Colis Sous-Payés</h3>
                  <p className="text-xs text-slate-400">Ce tableau est directement compilé dans le fichier d'exportation pour le transporteur.</p>
                </div>
                <span className="text-xs px-2.5 py-1 bg-rose-500/10 text-rose-400 rounded-lg font-semibold">
                  {disputeRows.length} preuves prêtes
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="pb-3">N° Suivi (Tracking)</th>
                      <th className="pb-3">Transporteur</th>
                      <th className="pb-3">Client & Wilaya</th>
                      <th className="pb-3">Montant Prévu</th>
                      <th className="pb-3">Montant Versé</th>
                      <th className="pb-3">Perte / Écart Subi</th>
                      <th className="pb-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                    {disputeRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30 transition">
                        <td className="py-3 font-semibold text-rose-300">{row.tracking}</td>
                        <td className="py-3 font-sans text-slate-300">{row.carrier}</td>
                        <td className="py-3 font-sans">
                          <div className="text-slate-200">{row.customerName}</div>
                          <div className="text-[11px] text-slate-400">{row.wilaya}</div>
                        </td>
                        <td className="py-3 text-white">{row.expectedAmount.toLocaleString()} DZD</td>
                        <td className="py-3 text-slate-300">{row.receivedAmount.toLocaleString()} DZD</td>
                        <td className="py-3 font-bold text-rose-400">
                          {row.variance.toLocaleString()} DZD
                        </td>
                        <td className="py-3 text-right font-sans">
                          <span className="px-2 py-0.5 bg-rose-500/10 text-rose-400 rounded-md text-[11px] font-semibold">
                            Sous-paiement
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* MODALE LETTRE DE RÉCLAMATION OFFICIELLE */}
            {showLetterModal && (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                    <h3 className="font-bold text-white text-base">Modèle de Courrier Officiel de Réclamation</h3>
                    <button
                      onClick={() => setShowLetterModal(false)}
                      className="text-slate-400 hover:text-white text-lg font-bold"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-300 space-y-3 leading-relaxed select-all">
                    <p><strong>À l'attention du Service Financier & Réclamations</strong></p>
                    <p><strong>Objet :</strong> Réclamation formelle pour écart de versement sur bordereau de livraison COD</p>
                    <p>Madame, Monsieur,</p>
                    <p>
                      Suite à l'audit comptable automatique de notre dernier bordereau de versement ({fileNameUploaded}), nous avons constaté une non-conformité financière portant sur un montant total de <strong>{totalDisputeAmount.toLocaleString()} DZD</strong> réparti sur <strong>{disputeRows.length} colis</strong> livrés et encaissés au pas de porte.
                    </p>
                    <p>
                      Vous trouverez en pièce jointe le tableau détaillé des numéros de suivi ainsi que les écarts constatés par rapport aux bons d'expédition initiaux.
                    </p>
                    <p>
                      Nous vous prions de bien vouloir régulariser ce montant sur notre prochain bordereau de paiement.
                    </p>
                    <p className="pt-2">Veuillez agréer nos salutations distinguées.<br /><strong>La Direction Financière</strong></p>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`Réclamation écart versement - Total: ${totalDisputeAmount} DZD`);
                        alert("Texte copié dans le presse-papier !");
                      }}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition"
                    >
                      Copier le texte
                    </button>
                    <button
                      onClick={() => setShowLetterModal(false)}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-bold transition"
                    >
                      Fermer
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* ONGLET IMPORT PAR DRAG & DROP                           */}
        {/* ======================================================== */}
        {activeTab === 'import' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-extrabold text-white">Importateur Universel de Bordereaux</h2>
              <p className="text-slate-400 text-sm mt-1">Glissez-déposez vos fichiers pour lancer la réconciliation.</p>
            </div>

            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-10 text-center transition duration-200 ${
                isDragging ? 'border-emerald-400 bg-emerald-500/10' : 'border-slate-800 bg-slate-900/40'
              }`}
            >
              <input type="file" id="fileUpload" accept=".csv, .xlsx, .xls, .txt" onChange={(e) => e.target.files && handleFileProcess(e.target.files[0])} className="hidden" />
              <div className="max-w-md mx-auto space-y-4">
                <div className="text-3xl">{isProcessingFile ? '⚙️' : '📥'}</div>
                <h3 className="text-lg font-bold text-white">
                  {isProcessingFile ? 'Analyse en cours...' : 'Glissez votre bordereau ici'}
                </h3>
                <label htmlFor="fileUpload" className="inline-block cursor-pointer bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-xs transition">
                  Parcourir mes fichiers locaux
                </label>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* ONGLET CRM & COMPTABILITÉ                                */}
        {/* ======================================================== */}
        {activeTab === 'crm' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">CRM Marchands & Tableau de Bord Comptable</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl">
                <span className="text-xs text-slate-400">MRR Mensuel</span>
                <div className="text-3xl font-black text-emerald-400 mt-2">{mrrTotalDzd.toLocaleString()} DZD</div>
              </div>
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl">
                <span className="text-xs text-slate-400">Abonnés Actifs</span>
                <div className="text-3xl font-black text-sky-400 mt-2">{activeSubscribers} marchands</div>
              </div>
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl">
                <span className="text-xs text-slate-400">En Attente Reçu</span>
                <div className="text-3xl font-black text-amber-400 mt-2">{pendingSubscribers} reçus</div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* ONGLET VUE OPÉRATIONNELLE                                */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Tableau de bord financier COD</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl">
                <span className="text-xs text-slate-400">Fonds Conformes</span>
                <div className="text-2xl font-bold text-emerald-400 mt-2">1 425 000 DZD</div>
              </div>
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl">
                <span className="text-xs text-slate-400">Déficit Transporteur</span>
                <div className="text-2xl font-bold text-rose-400 mt-2">48 500 DZD</div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* ONGLET FILTRAGE IP                                       */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Filtrage IP & Commandes Risquées</h2>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-lg text-sm">
                <div>
                  <span className="font-semibold text-white">Amine B. (Alger)</span>
                  <span className="text-xs text-slate-400 block">IP: 105.101.44.12 • Panier: 24 500 DZD</span>
                </div>
                <span className="px-2.5 py-1 text-xs bg-emerald-500/10 text-emerald-400 rounded-lg">Validée</span>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* ONGLET TRANSPORTEURS                                     */}
        {activeTab === 'carriers' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Connecteurs Transporteurs Algérie</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
                <h3 className="font-bold text-white">🚚 Yalidine Express</h3>
                <input type="text" placeholder="X-API-ID" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white" />
                <button className="bg-emerald-500 text-slate-950 text-xs font-semibold px-4 py-2 rounded-lg">Sauvegarder</button>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
                <h3 className="font-bold text-white">🚚 ZR Express</h3>
                <input type="password" placeholder="Clé API" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white" />
                <button className="bg-emerald-500 text-slate-950 text-xs font-semibold px-4 py-2 rounded-lg">Sauvegarder</button>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* ONGLET FORFAITS & PAIEMENTS                              */}
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
              <div onClick={() => setSelectedPlan('free')} className={`cursor-pointer rounded-2xl p-6 border transition ${selectedPlan === 'free' ? 'bg-slate-900 border-emerald-500 ring-2 ring-emerald-500' : 'bg-slate-900/60 border-slate-800'}`}>
                <h3 className="text-xl font-bold text-white">Pack Free</h3>
                <div className="my-4 text-3xl font-black text-white">0 DZD</div>
              </div>
              <div onClick={() => setSelectedPlan('business')} className={`cursor-pointer rounded-2xl p-6 border transition ${selectedPlan === 'business' ? 'bg-slate-900 border-emerald-500 ring-2 ring-emerald-500' : 'bg-slate-900/60 border-slate-800'}`}>
                <h3 className="text-xl font-bold text-white">Pack Business</h3>
                <div className="my-4 text-3xl font-black text-white">{getPrice('business').dzd.toLocaleString()} DZD</div>
              </div>
              <div onClick={() => setSelectedPlan('ultra')} className={`cursor-pointer rounded-2xl p-6 border transition ${selectedPlan === 'ultra' ? 'bg-slate-900 border-emerald-500 ring-2 ring-emerald-500' : 'bg-slate-900/60 border-slate-800'}`}>
                <h3 className="text-xl font-bold text-white">Pack Ultra Illimité</h3>
                <div className="my-4 text-3xl font-black text-white">{getPrice('ultra').dzd.toLocaleString()} DZD</div>
              </div>
            </div>

            {selectedPlan !== 'free' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                  <span className="font-bold text-white">💳 Carte Bancaire Universelle</span>
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

                <div className="bg-slate-900 border-2 border-emerald-500 rounded-2xl p-6 space-y-4 flex flex-col justify-between">
                  <div>
                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-full">Compte Bénéficiaire Officiel</span>
                    <div className="text-2xl font-black text-white mt-2">{getPrice(selectedPlan).dzd.toLocaleString()} DZD</div>
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