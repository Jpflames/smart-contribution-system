'use client';

import React, { useState } from 'react';
import { useCollection, addDocument, updateDocument } from '@/hooks/use-firestore';
import { Cooperative } from '@/types';

export default function CooperativesManagementPage() {
  const { data: coops, loading } = useCollection<Cooperative>('cooperatives');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [addingCoop, setAddingCoop] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [currency, setCurrency] = useState('NGN');
  const [gracePeriodDays, setGracePeriodDays] = useState(3);
  const [penaltyFlatFee, setPenaltyFlatFee] = useState(1000);
  const [penaltyPercentage, setPenaltyPercentage] = useState(5);
  const [penaltyType, setPenaltyType] = useState<'flat' | 'percentage' | 'compound'>('flat');
  const [autoDebitEnabled, setAutoDebitEnabled] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !description) return;
    setAddingCoop(true);

    try {
      const defaultLogo = logoUrl || 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=120&h=120&q=80';
      const newCoop: Omit<Cooperative, 'id'> = {
        name,
        description,
        logoUrl: defaultLogo,
        status: 'active',
        settings: {
          currency,
          autoDebitEnabled,
          retryIntervalDays: 1,
          penaltyFlatFee,
          penaltyPercentage,
          penaltyType,
          gracePeriodDays,
          receiptBranding: {
            color: '#4f46e5',
            headerText: `${name.toUpperCase()} RECEIPT`
          },
          webhookSecret: `whsec_${Math.random().toString(36).substring(2, 10)}`
        },
        stats: {
          totalMembers: 0,
          activeMembers: 0,
          totalRevenue: 0,
          totalOutstanding: 0,
          totalDefaulters: 0
        },
        createdAt: new Date().toISOString()
      };

      await addDocument('cooperatives', newCoop);
      setIsModalOpen(false);
      // Reset form
      setName('');
      setDescription('');
      setLogoUrl('');
      setAddingCoop(false);
    } catch (err) {
      console.error(err);
      setAddingCoop(false);
    }
  };

  const handleToggleStatus = async (coop: Cooperative) => {
    const nextStatus = coop.status === 'active' ? 'inactive' : 'active';
    try {
      await updateDocument('cooperatives', coop.id, { status: nextStatus });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Top Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight">Cooperative Portfolios</h1>
          <p className="text-xs text-slate-400">Register new institutions, adjust automated debit routines, and configure grace settings.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-xl btn-primary-gradient text-xs font-bold text-white flex items-center gap-1.5 transition-all shadow-lg shadow-indigo-500/10 hover:scale-102"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Register Cooperative
        </button>
      </div>

      {/* Main List Table */}
      <div className="p-6 rounded-3xl glass-panel space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-900 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Cooperative Institution</th>
                <th className="py-3 px-4">Billing settings</th>
                <th className="py-3 px-4">Grace Days</th>
                <th className="py-3 px-4">Late Penalty Rate</th>
                <th className="py-3 px-4">Referrals & API Key</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">Querying portfolios...</td>
                </tr>
              ) : coops.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">No registered cooperatives found. Try adding one.</td>
                </tr>
              ) : (
                coops.map((coop) => (
                  <tr key={coop.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-200 flex items-center gap-2.5">
                      <img src={coop.logoUrl} alt={coop.name} className="w-8 h-8 rounded-lg object-cover border border-white/10" />
                      <div>
                        <p className="text-slate-200">{coop.name}</p>
                        <span className="text-[9px] text-slate-500 block max-w-[200px] truncate">{coop.description}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 font-medium">
                      Currency: <span className="font-bold text-indigo-400">{coop.settings?.currency}</span><br />
                      Auto-Debit: <span className={coop.settings?.autoDebitEnabled ? 'text-emerald-400' : 'text-slate-500'}>{coop.settings?.autoDebitEnabled ? 'ENABLED' : 'DISABLED'}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 font-mono font-bold">{coop.settings?.gracePeriodDays} Days</td>
                    <td className="py-3.5 px-4 text-rose-400 font-mono font-bold">
                      {coop.settings?.penaltyType === 'flat' 
                        ? `${coop.settings?.currency} ${coop.settings?.penaltyFlatFee?.toLocaleString()} Flat`
                        : `${coop.settings?.penaltyPercentage}% Percentage`
                      }
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[10px]">
                      {coop.settings?.webhookSecret || 'N/A'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button 
                        onClick={() => handleToggleStatus(coop)}
                        className={`px-3 py-1.5 rounded-xl font-bold text-[10px] uppercase border transition-all ${
                          coop.status === 'active' 
                            ? 'bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20' 
                            : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
                        }`}
                      >
                        {coop.status === 'active' ? 'Suspend' : 'Reactivate'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE COOPERATIVE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-4 border-b border-slate-800">
              <h2 className="text-lg font-bold text-slate-100">Register New Cooperative</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-200">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Cooperative Name</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Lagos Thrift & Credit Cooperative"
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-200 text-xs placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all font-medium"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Logo URL (Optional)</label>
                <input 
                  type="url" 
                  value={logoUrl} 
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-200 text-xs placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Institutional Description</label>
                <textarea 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Focus area, operational mandate..."
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-200 text-xs placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all font-medium resize-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Billing Currency</label>
                  <select 
                    value={currency} 
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500/50 transition-all font-medium"
                  >
                    <option value="NGN">NGN (₦)</option>
                    <option value="USD">USD ($)</option>
                    <option value="KES">KES (KSh)</option>
                    <option value="GHS">GHS (GH₵)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Grace Period (Days)</label>
                  <input 
                    type="number" 
                    value={gracePeriodDays} 
                    onChange={(e) => setGracePeriodDays(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500/50 transition-all font-medium"
                    min={0}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="space-y-1 col-span-1">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Penalty Rule</label>
                  <select 
                    value={penaltyType}
                    onChange={(e: any) => setPenaltyType(e.target.value)}
                    className="w-full px-2.5 py-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500/50 transition-all font-medium"
                  >
                    <option value="flat">Flat Fee</option>
                    <option value="percentage">Percentage</option>
                  </select>
                </div>
                <div className="space-y-1 col-span-1">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Flat Charge</label>
                  <input 
                    type="number" 
                    value={penaltyFlatFee} 
                    onChange={(e) => setPenaltyFlatFee(Number(e.target.value))}
                    disabled={penaltyType !== 'flat'}
                    className="w-full px-2.5 py-2.5 rounded-lg bg-slate-950/60 border border-slate-800 disabled:opacity-40 text-slate-200 text-xs focus:outline-none focus:border-indigo-500/50 transition-all font-medium"
                  />
                </div>
                <div className="space-y-1 col-span-1">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Rate (%)</label>
                  <input 
                    type="number" 
                    value={penaltyPercentage} 
                    onChange={(e) => setPenaltyPercentage(Number(e.target.value))}
                    disabled={penaltyType !== 'percentage'}
                    className="w-full px-2.5 py-2.5 rounded-lg bg-slate-950/60 border border-slate-800 disabled:opacity-40 text-slate-200 text-xs focus:outline-none focus:border-indigo-500/50 transition-all font-medium"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input 
                  type="checkbox" 
                  id="autodebit" 
                  checked={autoDebitEnabled}
                  onChange={(e) => setAutoDebitEnabled(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-indigo-500/30"
                />
                <label htmlFor="autodebit" className="text-xs text-slate-300 font-medium">
                  Enable automatic recurring card charging (Scheduler)
                </label>
              </div>

              <button 
                type="submit"
                disabled={addingCoop}
                className="w-full py-3.5 rounded-xl btn-primary-gradient font-bold text-white text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2"
              >
                {addingCoop ? 'Registering...' : 'Register Cooperative'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
