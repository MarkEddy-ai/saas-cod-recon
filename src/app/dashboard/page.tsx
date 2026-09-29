'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'carriers' | 'billing'>('billing');
  const [copySuccess, setCopySuccess] = useState(false);

  // Coordonnées officielles du bénéficiaire
  const adminName = "ZOGHLAMI BADREDDINE";
  const adminRip = "00799999000232882074";

  // États du formulaire de paiement par carte
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Formatage automatique du numéro de carte (espaces tous les 4 chiffres)
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 16) value = value.slice(0, 16);
    const formatted = value.match(/.{1,4}/g)?.join(' ') || value;
    setCardNumber(formatted);
  };

  // Formatage de la date d'expiration MM/AA
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 4) value = value.slice(0, 4);
    if (value.length >= 3) {
      value = `${value.slice(0, 2)}/${value.slice(2)}`;
    }
    setCardExpiry(value);
  };

  // Formatage CVC
  const handleCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
    setCardCvc(value);
  };

  // Traitement du paiement sécurisé
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

  // Détection du réseau de carte (Visa / MasterCard)
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
              💳 Paiement & Abonnements
            </button>
          </nav>
        </div>

        <div className="border-t border-slate-800 pt-4">
          <div className="text-xs text-slate-400 mb-1">Administrateur :</div>
          <div className="text-sm font-semibold text-white">{adminName}</div>
          <div className="text-xs text-emerald-400 mb-3 font-medium">Compte Propriétaire Actif</div>
          <Link href="/auth" className="text-xs text-rose-400 hover:underline">Déconnexion</Link>
        </div>
      </aside>

      {/* Zone de contenu principal */}
      <main className="flex-1 p-8 overflow-y-auto">
        {/* Navigation mobile */}
        <div className="flex md:hidden justify-between items-center mb-6 pb-4 border-b border-slate-800">
          <span className="font-bold text-emerald-400">COD Recon DZ</span>
          <div className="flex gap-2">
            <button onClick={() => setActiveTab('overview')} className="text-xs p-2 bg-slate-800 rounded">Général</button>
            <button onClick={() => setActiveTab('billing')} className="text-xs p-2 bg-slate-800 rounded">Paiement</button>
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

        {/* ONGLET 4 : RECEPTION DES PAIEMENTS & ABONNEMENTS */}
        {activeTab === 'billing' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Passerelle de Paiement Sécurisée</h2>
              <p className="text-slate-400 text-sm">Activation instantanée de licence : virement BaridiMob ou paiement universel par carte bancaire.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* GUICHET DE PAIEMENT AUTOMATIQUE PAR CARTE BANCAIRE (VISA / MASTERCARD) */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-2xl relative">
                <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-base">💳 Paiement par Carte</span>
                    <span className="text-[10px] px-2 py-0.5 bg-indigo-500/20 text-indigo-400 font-semibold rounded">3D SECURE</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 font-mono">
                    <span className="text-sky-400 bg-sky-950 px-1.5 py-0.5 rounded">VISA</span>
                    <span className="text-amber-400 bg-amber-950 px-1.5 py-0.5 rounded">MasterCard</span>
                  </div>
                </div>

                {/* Formulaire standard de carte bancaire */}
                <form onSubmit={handlePayCard} className="space-y-4">
                  {/* Aperçu de la carte virtuelle */}
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

                  {/* Champs de saisie */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Nom figurant sur la carte</label>
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
                      <label className="block text-xs font-medium text-slate-300 mb-1">Date d'expiration</label>
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
                      ✓ Carte acceptée et validée avec succès. Licence Enterprise activée.
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={paymentProcessing}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 text-white font-bold py-3 rounded-xl text-sm transition flex items-center justify-center gap-2"
                  >
                    {paymentProcessing ? (
                      <span>Vérification bancaire sécurisée...</span>
                    ) : (
                      <span>Confirmer et Payer 29 € / mois</span>
                    )}
                  </button>

                  <div className="flex items-center justify-center gap-4 text-[11px] text-slate-400 pt-1">
                    <span>🔒 Chiffrement SSL 256-bit</span>
                    <span>✓ Certification PCI-DSS</span>
                    <span>🛡️️ Protection Anti-Fraude</span>
                  </div>
                </form>
              </div>

              {/* COMPTE OFFICIEL BARIDIMOB DE ZOGHLAMI BADREDDINE */}
              <div className="bg-slate-900 border-2 border-emerald-500 rounded-2xl p-6 space-y-5 shadow-2xl flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-full">
                      Compte Bénéficiaire Officiel
                    </span>
                    <span className="text-xs text-slate-400">Algérie Poste (BaridiMob)</span>
                  </div>

                  <div>
                    <div className="text-3xl font-black text-white">4 500 DZD <span className="text-sm font-normal text-slate-400">/ mois</span></div>
                    <p className="text-xs text-slate-400 mt-1">Licence Enterprise Illimitée pour marchands COD</p>
                  </div>

                  {/* Coordonnées bancaires BaridiMob */}
                  <div className="p-4 bg-slate-950 border border-emerald-500/30 rounded-xl space-y-3 text-xs mt-4">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                      <span className="text-slate-400 font-medium">Titulaire du compte :</span>
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
                      * Indiquez votre adresse email en motif de virement pour une activation sous 15 minutes.
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <button className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-3 rounded-xl text-sm transition">
                    Téléverser le Reçu de Virement (Capture d'écran)
                  </button>
                  <p className="text-center text-[11px] text-slate-400">
                    Validation manuelle et support local par téléphone disponible 7j/7
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}