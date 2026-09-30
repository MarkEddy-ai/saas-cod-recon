'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface PaymentReceipt {
  id: string;
  created_at: string;
  receipt_url: string;
  amount_dzd: number;
  plan_selected: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export default function AdminBackOffice() {
  const [pinCode, setPinCode] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [receipts, setReceipts] = useState<PaymentReceipt[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const MASTER_ADMIN_PIN = "2026";

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinCode === MASTER_ADMIN_PIN) {
      setIsAuthenticated(true);
      fetchReceipts();
    } else {
      alert("Code PIN Administrateur incorrect.");
    }
  };

  const fetchReceipts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('payment_receipts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReceipts(data || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (receiptId: string, newStatus: 'APPROVED' | 'REJECTED') => {
    try {
      const { error } = await supabase
        .from('payment_receipts')
        .update({ status: newStatus })
        .eq('id', receiptId);

      if (error) throw error;

      setActionMessage(`Statut mis à jour : ${newStatus === 'APPROVED' ? 'Abonnement Activé' : 'Reçu Rejeté'}`);
      setReceipts(prev => prev.map(r => r.id === receiptId ? { ...r, status: newStatus } : r));
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      alert("Erreur : " + err.message);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto text-slate-950 font-black text-xl">
              ⚙️
            </div>
            <h1 className="text-2xl font-black">Accès Super-Admin</h1>
            <p className="text-xs text-slate-400">Back-office propriétaire sécurisé (Validation BaridiMob & Métriques)</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Code PIN Propriétaire :</label>
              <input
                type="password"
                maxLength={8}
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value)}
                placeholder="Entrez votre PIN (ex: 2026)"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-center text-xl font-mono text-emerald-400 tracking-widest focus:outline-none focus:border-emerald-500"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 rounded-xl transition"
            >
              Déverrouiller le Back-office
            </button>
          </form>

          <div className="text-center">
            <Link href="/dashboard" className="text-xs text-slate-500 hover:text-slate-400">
              ← Retour au Dashboard Marchand
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-slate-800 pb-6">
          <div>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
              Super-Admin Propriétaire
            </span>
            <h1 className="text-3xl font-black text-white mt-1">Gestionnaire des Règlements & Abonnés</h1>
            <p className="text-xs text-slate-400">Validation des reçus BaridiMob et activation instantanée des comptes.</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchReceipts}
              className="bg-slate-900 hover:bg-slate-800 border border-slate-700 px-4 py-2 rounded-xl text-xs font-bold text-white transition"
            >
              🔄 Actualiser
            </button>
            <Link
              href="/dashboard"
              className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl text-xs font-bold text-slate-300 transition"
            >
              Vue Marchand
            </Link>
          </div>
        </div>

        {actionMessage && (
          <div className="p-4 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs rounded-2xl font-bold">
            {actionMessage}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
            <span className="text-xs text-slate-400">Reçus en attente de validation</span>
            <div className="text-3xl font-black text-amber-400 mt-1">
              {receipts.filter(r => r.status === 'PENDING').length}
            </div>
          </div>
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
            <span className="text-xs text-slate-400">Abonnements confirmés (Actifs)</span>
            <div className="text-3xl font-black text-emerald-400 mt-1">
              {receipts.filter(r => r.status === 'APPROVED').length}
            </div>
          </div>
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
            <span className="text-xs text-slate-400">Trésorerie collectée (DZD)</span>
            <div className="text-3xl font-black text-white mt-1">
              {receipts
                .filter(r => r.status === 'APPROVED')
                .reduce((acc, curr) => acc + (curr.amount_dzd || 0), 0)
                .toLocaleString()} DZD
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
          <div className="p-5 border-b border-slate-800 flex justify-between items-center">
            <h2 className="text-base font-bold text-white">Reçus BaridiMob téléversés par les marchands</h2>
            <span className="text-xs text-slate-400">{receipts.length} opération(s) enregistrée(s)</span>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-slate-500 text-xs">Chargement des reçus depuis Supabase...</div>
          ) : receipts.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">Aucun reçu n'a encore été soumis.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-mono">
                  <tr>
                    <th className="p-4">Date</th>
                    <th className="p-4">Forfait</th>
                    <th className="p-4">Montant</th>
                    <th className="p-4">Capture du Reçu</th>
                    <th className="p-4">Statut</th>
                    <th className="p-4 text-right">Actions Propriétaire</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {receipts.map((rc) => (
                    <tr key={rc.id} className="hover:bg-slate-800/30">
                      <td className="p-4 font-mono text-slate-400">
                        {new Date(rc.created_at).toLocaleDateString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="p-4 font-bold text-white uppercase">{rc.plan_selected}</td>
                      <td className="p-4 font-mono font-bold text-emerald-400">{rc.amount_dzd?.toLocaleString()} DZD</td>
                      <td className="p-4">
                        <a
                          href={rc.receipt_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded-lg text-xs font-mono underline inline-block"
                        >
                          🔍 Examiner le reçu
                        </a>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                          rc.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400' :
                          rc.status === 'PENDING' ? 'bg-amber-500/20 text-amber-400 animate-pulse' :
                          'bg-rose-500/20 text-rose-400'
                        }`}>
                          {rc.status === 'APPROVED' ? 'VALIDÉ' : rc.status === 'PENDING' ? 'EN ATTENTE' : 'REJETÉ'}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        {rc.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(rc.id, 'APPROVED')}
                              className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg transition"
                            >
                              Valider & Activer
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(rc.id, 'REJECTED')}
                              className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg transition"
                            >
                              Rejeter
                            </button>
                          </>
                        )}
                        {rc.status !== 'PENDING' && (
                          <span className="text-slate-500 text-[11px] italic">Traité</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
