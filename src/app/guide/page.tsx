'use client';

import React from 'react';
import Link from 'next/link';

export default function GuideKnowledgeBase() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-10">
        <div className="flex justify-between items-center border-b border-slate-800 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 flex items-center justify-center font-black text-slate-950 text-lg">
              COD
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">Annuaire & Guide d'Excellence COD</h1>
              <p className="text-xs text-slate-400">Comment maximiser votre marge nette et éliminer les fuites de trésorerie en Algérie.</p>
            </div>
          </div>
          <Link
            href="/dashboard"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition"
          >
            ← Retour au Dashboard
          </Link>
        </div>

        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 font-black flex items-center justify-center text-sm">01</span>
            <h2 className="text-xl font-bold text-white">Comprendre le Rapprochement & Détecter les Surcoûts</h2>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Dans le modèle Cash on Delivery (COD) en Algérie, les quittances de versement fournies par les transporteurs (Yalidine, ZR Express, etc.) regroupent à la fois les montants encaissés et les déductions des frais de livraison et de retour.
          </p>
          <div className="p-4 bg-slate-950 rounded-2xl border border-rose-500/20 space-y-2">
            <div className="text-xs font-bold text-rose-400">Le piège classique de la surfacturation :</div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Votre contrat prévoit souvent un tarif négocié de retour entre 200 et 250 DZD. Pourtant, lors de quittances de masse, certains colis se voient facturés au tarif plein d'aller (550 à 750 DZD). Sans audit ligne par ligne, un marchand perd en moyenne entre 40 000 et 120 000 DZD chaque mois.
            </p>
          </div>
        </section>

        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 font-black flex items-center justify-center text-sm">02</span>
            <h2 className="text-xl font-bold text-white">Le Radar Anti-RTO & le Score Acheteur Algérie</h2>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Le module Anti-RTO s'appuie sur une base partagée entre les marchands. Chaque numéro de téléphone algérien (05xx, 06xx, 07xx) dispose d'un indice de confiance :
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
              <span className="text-emerald-400 font-bold">Score 80 à 100 / Client Fiable :</span>
              <p className="text-[11px] text-slate-400 mt-1">Colis expédié en toute sécurité, taux d'encaissement maximal.</p>
            </div>
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
              <span className="text-rose-400 font-bold">Score inférieur à 40 / Liste Noire :</span>
              <p className="text-[11px] text-slate-400 mt-1">Client avec historique de refus répété. Exigez un acompte BaridiMob avant expédition.</p>
            </div>
          </div>
        </section>

        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 font-black flex items-center justify-center text-sm">03</span>
            <h2 className="text-xl font-bold text-white">Colis Bloqués en Hubs & Délais de Réclamation</h2>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Un colis conservé plus de 7 jours dans un centre de transit régional est statistiquement à 80% en voie de perte ou d'oubli. Notre radar identifie ces expéditions pour déclencher une réclamation formelle d'indemnisation.
          </p>
        </section>

        <div className="text-center pt-4">
          <Link
            href="/dashboard"
            className="inline-block bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-8 py-3 rounded-2xl text-xs transition shadow-lg shadow-emerald-500/20"
          >
            Accéder à mon Espace Marchand
          </Link>
        </div>
      </div>
    </div>
  );
}
