'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'carriers' | 'billing'>('overview');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Sidebar Navigation */}
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
              💳 Abonnement & Paiements
            </button>
          </nav>
        </div>

        <div className="border-t border-slate-800 pt-4">
          <div className="text-xs text-slate-400 mb-2">Boutique Active : <span className="text-white font-semibold">DzShop Pro</span></div>
          <Link href="/auth" className="text-xs text-rose-400 hover:underline">Déconnexion</Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto">
        {/* TOP BAR MOBILE */}
        <div className="flex md:hidden justify-between items-center mb-6 pb-4 border-b border-slate-800">
          <span className="font-bold text-emerald-400">COD Recon DZ</span>
          <div className="flex gap-2">
            <button onClick={() => setActiveTab('overview')} className="text-xs p-2 bg-slate-800 rounded">Général</button>
            <button onClick={() => setActiveTab('billing')} className="text-xs p-2 bg-slate-800 rounded">Paiement</button>
          </div>
        </div>

        {/* CONTENU ONGLET 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-white">Tableau de bord financier</h2>
                <p className="text-slate-400 text-sm">Réconciliation temps réel de vos flux Cash On Delivery</p>
              </div>
              <button className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold px-4 py-2.5 rounded-xl text-sm transition">
                + Importer un bordereau transporteur
              </button>
            </div>

            {/* KPI CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl">
                <span className="text-xs text-slate-400 font-medium">Fonds Réconciliés Conformes</span>
                <div className="text-2xl font-bold text-emerald-400 mt-2">1 425 000 DZD</div>
                <span className="text-xs text-emerald-500 font-medium">98.2% du montant attendu</span>
              </div>
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl">
                <span className="text-xs text-slate-400 font-medium">Déficit Détecté (À réclamer)</span>
                <div className="text-2xl font-bold text-rose-400 mt-2">48 500 DZD</div>
                <span className="text-xs text-rose-500 font-medium">6 bordereaux en litige</span>
              </div>
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl">
                <span className="text-xs text-slate-400 font-medium">Taux d'Échec / RTO Évités</span>
                <div className="text-2xl font-bold text-amber-400 mt-2">14.8 %</div>
                <span className="text-xs text-amber-500 font-medium">-4.2% grâce à l'Anti-RTO</span>
              </div>
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl">
                <span className="text-xs text-slate-400 font-medium">Commandes Bloquées (IP/Spam)</span>
                <div className="text-2xl font-bold text-sky-400 mt-2">23</div>
                <span className="text-xs text-sky-500 font-medium">~165 000 DZD de pertes évitées</span>
              </div>
            </div>

            {/* DERNIERS BORDEREAUX RECUS */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-4">Derniers bordereaux de versement reçus</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="pb-3">Transporteur</th>
                      <th className="pb-3">Bordereau #</th>
                      <th className="pb-3">Colis Livrés</th>
                      <th className="pb-3">Montant Attendu</th>
                      <th className="pb-3">Montant Versé</th>
                      <th className="pb-3">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    <tr>
                      <td className="py-3 font-medium text-white">Yalidine Express</td>
                      <td className="py-3 text-slate-400">YAL-2026-09-001</td>
                      <td className="py-3">142</td>
                      <td className="py-3">540 000 DZD</td>
                      <td className="py-3 text-emerald-400 font-semibold">540 000 DZD</td>
                      <td className="py-3"><span className="px-2 py-0.5 text-xs bg-emerald-500/10 text-emerald-400 rounded-md">Conforme</span></td>
                    </tr>
                    <tr>
                      <td className="py-3 font-medium text-white">ZR Express</td>
                      <td className="py-3 text-slate-400">ZR-DZ-88421</td>
                      <td className="py-3">38</td>
                      <td className="py-3">162 000 DZD</td>
                      <td className="py-3 text-rose-400 font-semibold">149 000 DZD</td>
                      <td className="py-3"><span className="px-2 py-0.5 text-xs bg-rose-500/10 text-rose-400 rounded-md">Écart -13 000 DZD</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* CONTENU ONGLET 2: ORDERS & IP RESTRICTION */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Filtrage IP & Commandes Risquées</h2>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-2">Historique des commandes récentes et scores de risque</h3>
              <p className="text-slate-400 text-xs mb-4">Les commandes dépassant le seuil de vélocité ou le montant de sécurité sont automatiquement bloquées.</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-lg text-sm">
                  <div>
                    <span className="font-semibold text-white">Client : Amine B. (Alger)</span>
                    <span className="text-xs text-slate-400 block">IP: 105.101.44.12 • Produit: Pack Électroménager • Montant: 24 500 DZD</span>
                  </div>
                  <span className="px-2.5 py-1 text-xs bg-emerald-500/10 text-emerald-400 rounded-lg">Validée (Risque: 5/100)</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-950 border border-rose-900/50 rounded-lg text-sm">
                  <div>
                    <span className="font-semibold text-rose-300">Client Suspect : Faux Nom (Oran)</span>
                    <span className="text-xs text-slate-400 block">IP: 41.220.78.90 • 4 commandes consécutives en 3 minutes • 320 000 DZD</span>
                  </div>
                  <span className="px-2.5 py-1 text-xs bg-rose-500/10 text-rose-400 rounded-lg">Bloquée Automatiquement (IP Bannie)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CONTENU ONGLET 3: TRANSPORTEURS */}
        {activeTab === 'carriers' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Configuration des Connecteurs Transporteurs</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
                <h3 className="font-bold text-white flex items-center gap-2">🚚 Yalidine Express</h3>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">API ID (X-API-ID)</label>
                  <input type="text" placeholder="yal_user_..." className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">API Token (X-API-TOKEN)</label>
                  <input type="password" placeholder="••••••••••••••••" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white" />
                </div>
                <button className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-semibold px-4 py-2 rounded-lg">Tester & Sauvegarder</button>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
                <h3 className="font-bold text-white flex items-center gap-2">🚚 ZR Express</h3>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Clé API Partenaire</label>
                  <input type="password" placeholder="zr_key_live_..." className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white" />
                </div>
                <button className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-semibold px-4 py-2 rounded-lg">Tester & Sauvegarder</button>
              </div>
            </div>
          </div>
        )}

        {/* CONTENU ONGLET 4: BILLING & PAIEMENTS (STRIPE, PAYPAL, BARIDIMOB) */}
        {activeTab === 'billing' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Modalités de Paiement & Abonnement</h2>
              <p className="text-slate-400 text-sm">Réglez votre abonnement en DZD (Algérie) ou devises internationales (Visa, MasterCard, PayPal)</p>
            </div>

            {/* GRILLE D'ABONNEMENT */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* PLAN 1 : PAIEMENT LOCAL ALGERIE */}
              <div className="bg-slate-900 border-2 border-emerald-500/50 rounded-2xl p-6 space-y-5">
                <div className="flex justify-between items-center">
                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-full">Algérie (DZD)</span>
                  <span className="text-slate-400 text-xs">Paiement Manuel / Instantané</span>
                </div>
                <div>
                  <div className="text-3xl font-extrabold text-white">4 500 DZD <span className="text-sm font-normal text-slate-400">/ mois</span></div>
                  <p className="text-xs text-slate-400 mt-1">Accès complet illimité • Support local par téléphone</p>
                </div>

                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2 text-xs">
                  <div className="font-semibold text-emerald-400">💳 Règlement par BaridiMob / CCP :</div>
                  <div className="text-slate-300">RIP BaridiMob : <span className="font-mono text-white font-bold select-all">007999990023456789 21</span></div>
                  <div className="text-slate-300">CCP : <span className="font-mono text-white font-bold select-all">23456789 Clé 21</span></div>
                  <div className="text-slate-400 text-[11px]">Après virement, téléversez votre reçu pour activation sous 15 minutes.</div>
                </div>

                <button className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-2.5 rounded-xl text-sm transition">
                  Envoyer le reçu BaridiMob
                </button>
              </div>

              {/* PLAN 2 : PAIEMENT INTERNATIONAL (STRIPE / PAYPAL / CARTE) */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
                <div className="flex justify-between items-center">
                  <span className="px-3 py-1 bg-sky-500/20 text-sky-400 text-xs font-semibold rounded-full">International</span>
                  <span className="text-slate-400 text-xs">Renouvellement Automatique</span>
                </div>
                <div>
                  <div className="text-3xl font-extrabold text-white">29 € <span className="text-sm font-normal text-slate-400">/ mois</span></div>
                  <p className="text-xs text-slate-400 mt-1">Paiement sécurisé par carte ou portefeuille en ligne</p>
                </div>

                <div className="space-y-3">
                  <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition">
                    <span>Payer par Carte Visa / MasterCard (Stripe)</span>
                  </button>
                  <button className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition">
                    <span>Payer avec PayPal</span>
                  </button>
                </div>

                <div className="text-center text-[11px] text-slate-400">
                  Transactions chiffrées SSL 256-bit • Facturation conforme
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
