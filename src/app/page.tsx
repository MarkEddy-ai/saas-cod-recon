'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function LandingPage() {
  const [ordersPerMonth, setOrdersPerMonth] = useState(450);
  const [rtoRate, setRtoRate] = useState(25);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Calcul interactif des pertes évitables
  // Estimation : ~350 DZD de surfacturation ou perte par colis non tracé / retour abusif
  const estimatedReturns = Math.round((ordersPerMonth * rtoRate) / 100);
  const estimatedLossDzd = estimatedReturns * 350;

  const businessPrice = billingCycle === 'monthly' ? 2000 : Math.round(2000 * 12 * 0.9);
  const ultraPrice = billingCycle === 'monthly' ? 4500 : Math.round(4500 * 12 * 0.9);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    {
      q: "Comment s'effectue le règlement de l'abonnement en Algérie ?",
      a: "Le paiement s'effectue simplement par virement BaridiMob ou versement CCP. Une fois le virement réalisé vers notre compte officiel, vous téléversez la capture d'écran sur votre tableau de bord ou l'envoyez directement sur notre WhatsApp commercial. Votre accès est validé en moins de 15 minutes."
    },
    {
      q: "Est-ce compatible avec tous les transporteurs algériens ?",
      a: "Oui. Le système prend en charge les exports natifs .CSV et Excel de Yalidine Express, ZR Express, EcoTrack, ainsi que les formulaires d'expéditions personnalisés."
    },
    {
      q: "Comment fonctionne la détection anti-fraude IP et VPN ?",
      a: "Grâce à notre webhook universel (compatible YouCan, Shopify et WooCommerce), chaque commande entrante est analysée instantanément. Si l'acheteur utilise un VPN étranger, une adresse IP de centre de données ou un faux numéro, la commande est classée suspecte avant même l'expédition."
    },
    {
      q: "Mes données clients et chiffres de vente restent-ils confidentiels ?",
      a: "Absolument. Vos bases de quittances et listes de commandes sont strictement cloisonnées sous protocole de sécurité RLS (Row Level Security). Aucune donnée commerciale n'est partagée avec des tiers."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* NAVBAR */}
      <nav className="border-b border-slate-800 bg-slate-950/85 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center font-black text-slate-950 text-base shadow-lg shadow-emerald-500/20">
              COD
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-white block">Reconciliation DZ</span>
              <span className="text-[10px] text-emerald-400 font-semibold tracking-wider uppercase">Audit & Trésorerie E-commerce</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-bold">
            <Link href="/guide" className="text-slate-400 hover:text-white transition hidden md:inline">
              📖 Wiki des Formules
            </Link>
            <Link href="/dashboard" className="text-slate-300 hover:text-white transition hidden sm:inline">
              Espace Marchand
            </Link>
            <Link
              href="/dashboard"
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2 rounded-xl transition shadow shadow-emerald-500/10 font-black"
            >
              Tester l'Audit Express
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="px-6 pt-16 pb-12 max-w-5xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Conçu pour le marché e-commerce en Algérie
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight">
          Arrêtez de perdre vos bénéfices sur les <span className="text-emerald-400">retours et quittances COD</span>
        </h1>

        <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
          Le premier SaaS en Algérie qui audite automatiquement vos bordereaux de livraison, identifie les surfacturations de retour, localise vos colis bloqués en hub et filtre les faux acheteurs avant l'expédition.
        </p>

        <div className="pt-4 flex flex-col sm:flex-row justify-center items-center gap-3">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-8 py-3.5 rounded-2xl text-sm transition shadow-xl shadow-emerald-500/20"
          >
            Auditer un Bordereau Gratuitement (.CSV) →
          </Link>
          <a
            href="https://wa.me/213699000082?text=Bonjour,%20je%20souhaite%20une%20d%C3%A9monstration%20de%20COD%20Reconciliation%20DZ"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-3.5 rounded-2xl text-sm transition border border-slate-800 flex items-center justify-center gap-2"
          >
            <span>💬</span> Discuter sur WhatsApp
          </a>
        </div>
      </section>

      {/* SIMULATEUR INTERACTIF DE FUITE DE TRÉSORERIE */}
      <section className="px-6 py-10 max-w-4xl mx-auto">
        <div className="p-8 bg-slate-900 border-2 border-emerald-500/40 rounded-3xl space-y-6 shadow-2xl">
          <div className="text-center space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">Simulateur en Temps Réel</span>
            <h2 className="text-2xl font-black text-white">Combien perdez-vous chaque mois sans audit ?</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="space-y-5">
              <div>
                <div className="flex justify-between text-xs font-bold mb-2">
                  <span className="text-slate-400">Colis expédiés par mois :</span>
                  <span className="text-white font-mono">{ordersPerMonth} colis</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="3000"
                  step="50"
                  value={ordersPerMonth}
                  onChange={(e) => setOrdersPerMonth(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-2">
                  <span className="text-slate-400">Taux de retours (RTO moyen) :</span>
                  <span className="text-rose-400 font-mono">{rtoRate}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="60"
                  step="1"
                  value={rtoRate}
                  onChange={(e) => setRtoRate(Number(e.target.value))}
                  className="w-full accent-rose-500 cursor-pointer"
                />
              </div>

              <div className="text-[11px] text-slate-400 bg-slate-950 p-3 rounded-xl border border-slate-800">
                Sur <strong>{ordersPerMonth} colis</strong> expédiés, vous subissez environ <strong>{estimatedReturns} retours</strong> par mois.
              </div>
            </div>

            <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col justify-between text-center md:text-left">
              <div>
                <span className="text-xs text-slate-400">Pertes nettes évitables estimées :</span>
                <div className="text-3xl sm:text-4xl font-black text-rose-400 mt-2 font-mono">
                  -{estimatedLossDzd.toLocaleString()} DZD <span className="text-xs font-normal text-slate-400">/ mois</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  Frais de retours surfacturés (550-750 DA au lieu de 250 DA) et expéditions bloquées en centre de tri.
                </p>
              </div>

              <div className="pt-4 border-t border-slate-800 text-xs text-emerald-400 font-bold">
                Pour seulement 2 000 DZD/mois, sécurisez et récupérez cette trésorerie.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* COMPARATIF : SANS COD RECONCILIATION VS AVEC */}
      <section className="px-6 py-12 max-w-5xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <span className="text-xs bg-slate-800 text-slate-400 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
            Comparatif Opérationnel
          </span>
          <h2 className="text-3xl font-black text-white">Pourquoi automatiser votre réconciliation ?</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* SANS */}
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-rose-500/30 space-y-4">
            <div className="flex items-center gap-2 text-rose-400 font-black text-base">
              <span>✕</span> Sans COD Reconciliation DZ
            </div>
            <ul className="text-xs text-slate-400 space-y-3 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-rose-500 font-bold">•</span>
                Vérification manuelle fastidieuse sur des fichiers Excel de milliers de lignes.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-500 font-bold">•</span>
                Surfacturations invisibles sur les retours (tarifs prélevés supérieurs aux tarifs convenus).
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-500 font-bold">•</span>
                Colis oubliés ou perdus dans les centres régionaux sans suivi après 7 jours.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-500 font-bold">•</span>
                Commandes envoyées à des numéros fictifs ou sous VPN étranger qui finissent en retours certains.
              </li>
            </ul>
          </div>

          {/* AVEC */}
          <div className="p-6 rounded-3xl bg-slate-900 border-2 border-emerald-500/60 space-y-4 shadow-xl">
            <div className="flex items-center gap-2 text-emerald-400 font-black text-base">
              <span>✓</span> Avec COD Reconciliation DZ
            </div>
            <ul className="text-xs text-slate-300 space-y-3 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">•</span>
                Audit instantané en 3 secondes par simple glisser-déposer de quittance.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">•</span>
                Génération immédiate d'un bordereau officiel de contestation légale prêt à l'envoi.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">•</span>
                Radar temps réel des colis bloqués (+7j) pour lancer les réclamations perte avant prescription.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">•</span>
                Webhook de filtrage direct bloquant les robots et VPN au moment du checkout.
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 3 PILIERS TECHNIQUES */}
      <section className="px-6 py-12 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-2xl font-black">
              📊
            </div>
            <h3 className="text-base font-bold text-white">Audit des Bordereaux</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Confronte le tarif convenu contractuellement au montant réellement débité sur chaque quittance pour calculer les sommes indues.
            </p>
          </div>

          <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center text-2xl font-black">
              🚨
            </div>
            <h3 className="text-base font-bold text-white">Radar des Hubs (+7 Jours)</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Détecte les expéditions immobilisées anormalement dans les centres de tri régionaux pour engager les procédures de remboursement.
            </p>
          </div>

          <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-2xl font-black">
              🛡️
            </div>
            <h3 className="text-base font-bold text-white">Score Client & Filtre IP</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Consultez l'historique de livraison partagé des acheteurs algériens et évitez d'expédier vers les clients coutumiers des refus.
            </p>
          </div>
        </div>
      </section>

      {/* GRILLE TARIFAIRE OFFICIELLE */}
      <section className="px-6 py-14 max-w-5xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
            Tarifs Transparents & Accessibles
          </span>
          <h2 className="text-3xl font-black text-white">Choisissez votre formule</h2>
          <p className="text-slate-400 text-xs">Paiement 100% sécurisé via BaridiMob / CCP avec validation sous 15 minutes.</p>

          <div className="pt-4 flex items-center justify-center gap-3">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`text-xs font-bold px-3 py-1 rounded-lg transition ${billingCycle === 'monthly' ? 'bg-slate-800 text-white border border-slate-700' : 'text-slate-400'}`}
            >
              Mensuel
            </button>
            <button
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
              className="w-12 h-6 bg-slate-800 rounded-full p-1 relative border border-slate-700"
            >
              <div className={`w-4 h-4 bg-emerald-500 rounded-full transition-transform ${billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`text-xs font-bold px-3 py-1 rounded-lg transition ${billingCycle === 'yearly' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400'}`}
            >
              Annuel (-10%)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* PACK DÉCOUVERTE */}
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="font-bold text-white text-base">Pack Découverte</h3>
              <div className="text-3xl font-black text-white">0 DZD</div>
              <p className="text-xs text-slate-400">Pour tester le moteur d'audit sur un échantillon de colis.</p>
              <ul className="text-xs text-slate-300 space-y-2 border-t border-slate-800 pt-4">
                <li>✓ 50 colis audités</li>
                <li>✓ Détection des surfacturations</li>
                <li>✕ Webhook temps réel fermé</li>
              </ul>
            </div>
            <Link
              href="/dashboard"
              className="block w-full py-2.5 text-center bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition mt-4"
            >
              Essai Gratuit
            </Link>
          </div>

          {/* PACK BUSINESS */}
          <div className="p-6 bg-slate-900 border-2 border-emerald-500 rounded-3xl space-y-4 relative shadow-2xl flex flex-col justify-between">
            <span className="absolute -top-3 right-4 bg-emerald-500 text-slate-950 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full shadow">
              Recommandé
            </span>
            <div className="space-y-4">
              <h3 className="font-bold text-white text-base">Pack Business</h3>
              <div className="text-3xl font-black text-white">
                {businessPrice.toLocaleString()} DZD
                <span className="text-xs font-normal text-slate-400 ml-1.5">{billingCycle === 'yearly' ? '/ an' : '/ mois'}</span>
              </div>
              <p className="text-xs text-slate-400">Pour les boutiques traitant jusqu'à 800 colis par mois.</p>
              <ul className="text-xs text-slate-300 space-y-2 border-t border-slate-800 pt-4">
                <li>✓ Jusqu'à 800 colis / mois</li>
                <li>✓ Bordereau litiges exportable</li>
                <li>✓ Radar colis bloqués en hubs (+7j)</li>
                <li>✓ Connecteurs Yalidine + ZR Express</li>
              </ul>
            </div>
            <Link
              href="/dashboard"
              className="block w-full py-2.5 text-center bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black transition shadow mt-4"
            >
              Activer Pack Business
            </Link>
          </div>

          {/* PACK ULTRA */}
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="font-bold text-white text-base">Pack Ultra Illimité</h3>
              <div className="text-3xl font-black text-white">
                {ultraPrice.toLocaleString()} DZD
                <span className="text-xs font-normal text-slate-400 ml-1.5">{billingCycle === 'yearly' ? '/ an' : '/ mois'}</span>
              </div>
              <p className="text-xs text-slate-400">Pour les distributeurs à fort volume et agences.</p>
              <ul className="text-xs text-slate-300 space-y-2 border-t border-slate-800 pt-4">
                <li>✓ Volume mensuel illimité</li>
                <li>✓ Protection temps réel VPN / IP</li>
                <li>✓ Tous transporteurs DZ connectés</li>
                <li>✓ Support prioritaire WhatsApp 7j/7</li>
              </ul>
            </div>
            <Link
              href="/dashboard"
              className="block w-full py-2.5 text-center bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition mt-4"
            >
              Activer Pack Ultra
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="px-6 py-14 max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <span className="text-xs bg-slate-800 text-slate-400 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
            Questions Fréquentes
          </span>
          <h2 className="text-2xl font-black text-white">Tout ce que vous devez savoir</h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="p-5 bg-slate-900 border border-slate-800 rounded-2xl cursor-pointer transition hover:border-slate-700"
              onClick={() => toggleFaq(idx)}
            >
              <div className="flex justify-between items-center text-sm font-bold text-white">
                <span>{faq.q}</span>
                <span className="text-emerald-400 font-mono text-base">{openFaq === idx ? '−' : '+'}</span>
              </div>
              {openFaq === idx && (
                <p className="mt-3 text-xs text-slate-400 leading-relaxed border-t border-slate-800/80 pt-3">
                  {faq.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* BANDEAU D'APPEL FINAL */}
      <section className="px-6 py-14 max-w-4xl mx-auto text-center">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-emerald-500/15 via-blue-500/10 to-emerald-500/15 border-2 border-emerald-500/40 space-y-4 shadow-2xl">
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Prêt à assainir la trésorerie de votre boutique ?
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto">
            Testez sans engagement sur votre dernière quittance de livraison et vérifiez immédiatement si vous êtes surfacturé.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3">
            <Link
              href="/dashboard"
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-8 py-3.5 rounded-2xl text-xs transition shadow-xl"
            >
              Lancer l'Audit Immédiat
            </Link>
            <a
              href="https://wa.me/213699000082?text=Bonjour,%20je%20souhaite%20activer%20un%20abonnement%20COD%20Reconciliation%20DZ"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-3.5 rounded-2xl text-xs transition border border-slate-700 flex items-center justify-center gap-2"
            >
              <span>💬</span> WhatsApp Direct
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER OFFICIEL ANONYMISÉ */}
      <footer className="border-t border-slate-800 py-8 px-6 text-center text-xs text-slate-400 space-y-2">
        <div className="font-bold text-white tracking-wide">COD Reconciliation DZ</div>
        <p>Solution comptable et anti-fraude pour le commerce en ligne en Algérie.</p>
        <p className="text-[11px] text-slate-400">
          Support commercial & Licences : <span className="text-white font-mono">weekyfy@gmail.com</span> | WhatsApp : <span className="text-emerald-400 font-mono">+213 699 00 00 82</span>
        </p>
      </footer>
    </div>
  );
}
