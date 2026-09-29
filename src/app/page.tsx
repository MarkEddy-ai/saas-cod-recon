'use client';

import React, { useState } from 'react';
import { CarrierCsvLine, AlgeriaCarrier } from '../contracts/schemas';
import { reconcileCarrierLine, ReconciliationResult } from '../modules/reconciliation/matcher';
import { evaluateOrderRisk, OrderRiskAssessment } from '../modules/risk/scorer';
import { NotificationEngine } from '../modules/notifications/sender';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'reconciliation' | 'anti_rto' | 'notifications' | 'disputes'>('reconciliation');

  // État Réconciliation
  const [results, setResults] = useState<(ReconciliationResult & { carrier: string })[]>([]);
  const [totalDiscrepancy, setTotalDiscrepancy] = useState<number>(0);
  const [selectedCarrier, setSelectedCarrier] = useState<string>('TOUS');

  // État Anti-RTO
  const [orders, setOrders] = useState<(OrderRiskAssessment & { item_name: string; total_cents: number; carrier: string })[]>([
    {
      ...evaluateOrderRisk({
        id: "CMD-DZ-101",
        customer_name: "Amine Benali",
        phone: "0550123456",
        wilaya: "16 - Alger",
        address: "12 Rue Didouche Mourad, 3ème étage"
      }),
      item_name: "Pack Montre Connectée Pro",
      total_cents: 650000,
      carrier: "YALIDINE"
    },
    {
      ...evaluateOrderRisk({
        id: "CMD-DZ-102",
        customer_name: "Client",
        phone: "0666666666",
        wilaya: "31 - Oran",
        address: "Centre ville"
      }),
      item_name: "Casque Bluetooth Sans Fil",
      total_cents: 390000,
      carrier: "ZR_EXPRESS"
    },
    {
      ...evaluateOrderRisk({
        id: "CMD-DZ-103",
        customer_name: "Karim Ziani",
        phone: "0771987654",
        wilaya: "09 - Blida",
        address: "En face la poste"
      }),
      item_name: "Tondeuse Rechargeable Gold",
      total_cents: 480000,
      carrier: "AYOR"
    }
  ]);

  const [newOrder, setNewOrder] = useState({
    id: `CMD-DZ-${Math.floor(100 + Math.random() * 900)}`,
    customer_name: '',
    phone: '',
    wilaya: '16 - Alger',
    address: '',
    item_name: 'Article E-commerce',
    total_cents: 450000,
    carrier: 'YALIDINE'
  });

  const CARRIERS_LIST = ['TOUS', 'YALIDINE', 'ZR_EXPRESS', 'AYOR', 'GUEPEX', 'PROCOLIS', 'NORD_ET_SUD'];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
      
      const parsedResults: (ReconciliationResult & { carrier: string })[] = [];
      let totalVar = 0;

      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map((c) => c.trim());
        if (cols.length >= 6) {
          const carrier = cols[1].toUpperCase();
          const carrierLine: CarrierCsvLine = {
            tracking_number: cols[0],
            carrier_name: (carrier as AlgeriaCarrier) || 'AUTRE',
            collected_amount_cents: parseInt(cols[2], 10) || 0,
            shipping_fee_cents: parseInt(cols[3], 10) || 0,
            delivery_status: (cols[4] as 'DELIVERED') || 'DELIVERED',
          };
          const expectedCents = parseInt(cols[5], 10) || 0;
          const res = reconcileCarrierLine(expectedCents, carrierLine);
          
          parsedResults.push({ ...res, carrier });
          totalVar += res.variance_cents;
        }
      }

      setResults(parsedResults);
      setTotalDiscrepancy(totalVar);
    };
    reader.readAsText(file);
  };

  const handleAddOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrder.customer_name || !newOrder.phone) return;

    const assessed = evaluateOrderRisk(newOrder);
    setOrders([{
      ...assessed,
      item_name: newOrder.item_name,
      total_cents: newOrder.total_cents,
      carrier: newOrder.carrier
    }, ...orders]);

    setNewOrder({
      id: `CMD-DZ-${Math.floor(100 + Math.random() * 900)}`,
      customer_name: '',
      phone: '',
      wilaya: newOrder.wilaya,
      address: '',
      item_name: 'Article E-commerce',
      total_cents: 450000,
      carrier: 'YALIDINE'
    });
  };

  // Liste des colis en anomalie de caisse
  const discrepancies = results.filter(r => r.status !== 'MATCHED');

  // Exportation CSV officiel de réclamation
  const exportDisputeCSV = () => {
    if (discrepancies.length === 0) return;

    const header = "Tracking,Transporteur,Attendu_DZD,Recu_DZD,Ecart_DZD,Statut_Litige\n";
    const rows = discrepancies.map(d => 
      `${d.tracking_number},${d.carrier},${(d.expected_cents/100).toFixed(2)},${(d.actual_cents/100).toFixed(2)},${(d.variance_cents/100).toFixed(2)},${d.status}`
    ).join("\n");

    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Reclamation_Litiges_COD_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredResults = selectedCarrier === 'TOUS' 
    ? results 
    : results.filter(r => r.carrier.includes(selectedCarrier));

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans antialiased">
      {/* Header */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between pb-8 border-b border-slate-800 gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">Console COD Algérie Enterprise</h1>
          <p className="text-sm text-slate-400 mt-1">Plateforme de réconciliation financière, Anti-RTO & Gestion de litiges</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            RLS Multi-Tenant Actif
          </span>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            Centimes Intact (0 Float)
          </span>
        </div>
      </div>

      {/* Navigation par Onglets */}
      <div className="max-w-7xl mx-auto mt-6 flex gap-8 border-b border-slate-800 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('reconciliation')}
          className={`pb-3 transition-colors border-b-2 ${
            activeTab === 'reconciliation'
              ? 'border-indigo-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          1. Réconciliation Financière
        </button>
        <button
          onClick={() => setActiveTab('disputes')}
          className={`pb-3 transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'disputes'
              ? 'border-indigo-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>2. Dossier Litiges Transporteurs</span>
          {discrepancies.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-rose-500/20 text-rose-400 border border-rose-500/30">
              {discrepancies.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('anti_rto')}
          className={`pb-3 transition-colors border-b-2 ${
            activeTab === 'anti_rto'
              ? 'border-indigo-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          3. Détection Fraude & Anti-RTO
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`pb-3 transition-colors border-b-2 ${
            activeTab === 'notifications'
              ? 'border-indigo-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          4. Confirmation WhatsApp
        </button>
      </div>

      <div className="max-w-7xl mx-auto mt-8">
        {activeTab === 'reconciliation' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Colis Rapprochés</p>
                <p className="text-2xl font-bold mt-2 text-white font-mono">{filteredResults.length}</p>
              </div>
              <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Écart Net (Variance)</p>
                <p className={`text-2xl font-bold mt-2 font-mono ${totalDiscrepancy < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {(totalDiscrepancy / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DZD
                </p>
              </div>
              <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Diagnostic Trésorerie</p>
                <p className="text-2xl font-bold mt-2 text-white font-mono">
                  {results.length > 0 ? (totalDiscrepancy === 0 ? 'CONFORME' : 'ÉCARTS CONSTATÉS') : 'AUCUN IMPORT'}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden">
              <div className="p-4 border-b border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-2">Transporteur :</span>
                  {CARRIERS_LIST.map((c) => (
                    <button
                      key={c}
                      onClick={() => setSelectedCarrier(c)}
                      className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                        selectedCarrier === c ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>

                <label className="cursor-pointer px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors shrink-0">
                  + Importer Bordereau (Algérie)
                  <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>

              <table className="w-full text-left text-sm">
                <thead className="bg-slate-900 text-slate-400 text-xs uppercase font-mono">
                  <tr>
                    <th className="py-3 px-4">Tracking</th>
                    <th className="py-3 px-4">Société</th>
                    <th className="py-3 px-4">Attendu Net</th>
                    <th className="py-3 px-4">Reçu Net</th>
                    <th className="py-3 px-4">Écart (Variance)</th>
                    <th className="py-3 px-4">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                  {filteredResults.map((r, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30">
                      <td className="py-3.5 px-4 font-semibold text-white">{r.tracking_number}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[11px]">
                          {r.carrier}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">{(r.expected_cents / 100).toFixed(2)} DZD</td>
                      <td className="py-3.5 px-4">{(r.actual_cents / 100).toFixed(2)} DZD</td>
                      <td className={`py-3.5 px-4 font-bold ${r.variance_cents < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {(r.variance_cents / 100).toFixed(2)} DZD
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[11px] ${
                          r.status === 'MATCHED'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredResults.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-500">
                        Aucun bordereau importé. Utilisez le bouton ci-dessus pour charger votre fichier CSV.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Onglet Dossier Litiges */}
        {activeTab === 'disputes' && (
          <div className="space-y-6">
            <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-base font-semibold text-white">Dossier des Anomalies & Litiges Financiers</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Ce module isole automatiquement les colis sous-payés ou contestés pour génération d'un relevé officiel de litige.
                </p>
              </div>
              <button
                onClick={exportDisputeCSV}
                disabled={discrepancies.length === 0}
                className={`px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors ${
                  discrepancies.length > 0
                    ? 'bg-rose-600 hover:bg-rose-500 text-white cursor-pointer'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                📥 Exporter Fichier de Réclamation CSV ({discrepancies.length})
              </button>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-900 text-slate-400 text-xs uppercase font-mono">
                  <tr>
                    <th className="py-3 px-4">Tracking</th>
                    <th className="py-3 px-4">Transporteur</th>
                    <th className="py-3 px-4">Attendu Net</th>
                    <th className="py-3 px-4">Reçu Net</th>
                    <th className="py-3 px-4">Montant Litigieux (Perte)</th>
                    <th className="py-3 px-4">Type d'Anomalie</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                  {discrepancies.map((d, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30">
                      <td className="py-3.5 px-4 font-semibold text-white">{d.tracking_number}</td>
                      <td className="py-3.5 px-4">{d.carrier}</td>
                      <td className="py-3.5 px-4">{(d.expected_cents / 100).toFixed(2)} DZD</td>
                      <td className="py-3.5 px-4">{(d.actual_cents / 100).toFixed(2)} DZD</td>
                      <td className="py-3.5 px-4 font-bold text-rose-400">
                        {Math.abs(d.variance_cents / 100).toFixed(2)} DZD
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          {d.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {discrepancies.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-500">
                        Aucun litige de caisse constaté. Toutes les réconciliations actuelles sont conformes.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'anti_rto' && (
          <div className="space-y-8">
            <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm">
              <h2 className="text-base font-semibold text-white mb-4">Simulateur d'Audit de Commande Avant Expédition</h2>
              <form onSubmit={handleAddOrder} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Nom du client</label>
                  <input
                    type="text"
                    required
                    value={newOrder.customer_name}
                    onChange={(e) => setNewOrder({ ...newOrder, customer_name: e.target.value })}
                    placeholder="Ex: Mourad Hadj"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Téléphone (05/06/07)</label>
                  <input
                    type="text"
                    required
                    value={newOrder.phone}
                    onChange={(e) => setNewOrder({ ...newOrder, phone: e.target.value })}
                    placeholder="0550123456"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Wilaya</label>
                  <input
                    type="text"
                    value={newOrder.wilaya}
                    onChange={(e) => setNewOrder({ ...newOrder, wilaya: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Adresse de livraison</label>
                  <input
                    type="text"
                    value={newOrder.address}
                    onChange={(e) => setNewOrder({ ...newOrder, address: e.target.value })}
                    placeholder="Ex: Cité 500 logts bt 3"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="md:col-span-4 flex justify-end">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg text-xs transition-colors"
                  >
                    Auditer & Scorer la Commande
                  </button>
                </div>
              </form>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden">
              <div className="p-4 border-b border-slate-800">
                <h3 className="text-sm font-semibold text-slate-200">Commandes Analysées par le Moteur Prédictif</h3>
              </div>

              <table className="w-full text-left text-sm">
                <thead className="bg-slate-900 text-slate-400 text-xs uppercase font-mono">
                  <tr>
                    <th className="py-3 px-4">Commande</th>
                    <th className="py-3 px-4">Client & Contact</th>
                    <th className="py-3 px-4">Adresse & Wilaya</th>
                    <th className="py-3 px-4">Score Risque</th>
                    <th className="py-3 px-4">Alertes Détectées</th>
                    <th className="py-3 px-4">Recommandation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                  {orders.map((o) => (
                    <tr key={o.order_id} className="hover:bg-slate-800/30">
                      <td className="py-3.5 px-4 font-semibold text-white">{o.order_id}</td>
                      <td className="py-3.5 px-4">
                        <div className="text-slate-200 font-sans">{o.customer_name}</div>
                        <div className="text-slate-400 text-[11px]">{o.phone}</div>
                      </td>
                      <td className="py-3.5 px-4 font-sans">
                        <div className="text-slate-300">{o.address || 'Non renseignée'}</div>
                        <div className="text-indigo-400 text-[11px]">{o.wilaya}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-12 bg-slate-800 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full ${
                                o.risk_score >= 65 ? 'bg-rose-500' : o.risk_score >= 35 ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${o.risk_score}%` }}
                            />
                          </div>
                          <span className={`font-bold ${
                            o.risk_score >= 65 ? 'text-rose-400' : o.risk_score >= 35 ? 'text-amber-400' : 'text-emerald-400'
                          }`}>
                            {o.risk_score}/100
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-sans">
                        {o.flags.length > 0 ? (
                          <ul className="list-disc list-inside text-[11px] text-rose-300/80 space-y-0.5">
                            {o.flags.map((f, i) => (
                              <li key={i}>{f}</li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-emerald-400 text-[11px]">Coordonnées valides</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[11px] ${
                          o.recommendation === 'EXPEDIER'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : o.recommendation === 'CONFIRMATION_REQUISE'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {o.recommendation}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-8">
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden">
              <div className="p-4 border-b border-slate-800">
                <h3 className="text-sm font-semibold text-slate-200">Centre d'Envoi WhatsApp & SMS (Désamorçage RTO)</h3>
                <p className="text-xs text-slate-400 mt-1">Validez directement chaque commande suspecte ou exigeant confirmation avant expédition</p>
              </div>

              <div className="divide-y divide-slate-800/60">
                {orders.map((o) => {
                  const msgs = NotificationEngine.buildConfirmationMessages({
                    order_id: o.order_id,
                    customer_name: o.customer_name,
                    phone: o.phone,
                    total_cents: o.total_cents,
                    item_name: o.item_name,
                    carrier_name: o.carrier
                  });

                  return (
                    <div key={o.order_id} className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:bg-slate-900/60 transition-colors">
                      <div className="space-y-2 max-w-xl">
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-white text-sm">{o.order_id}</span>
                          <span className="text-slate-300 font-medium text-sm">{o.customer_name}</span>
                          <span className="text-slate-400 text-xs font-mono">({msgs.phone_e164})</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            o.recommendation === 'EXPEDIER'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : o.recommendation === 'CONFIRMATION_REQUISE'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                            {o.recommendation}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 bg-slate-950 p-3 rounded-lg border border-slate-800 font-sans whitespace-pre-line">
                          {msgs.whatsapp_body}
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
                        <a
                          href={msgs.whatsapp_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                        >
                          <span>💬 Envoyer WhatsApp</span>
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
