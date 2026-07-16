'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useCollection, addDocument, useDocument } from '@/hooks/use-firestore';
import { Plan, Cooperative } from '@/types';

export default function PlansManagementPage() {
  const { user } = useAuth();
  const { data: coop } = useDocument<Cooperative>('cooperatives', user?.coopId || '');
  const { data: plans, loading } = useCollection<Plan>('plans', [
    { field: 'coopId', operator: '==', value: user?.coopId || '' }
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [addingPlan, setAddingPlan] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [amount, setAmount] = useState(20000);
  const [frequency, setFrequency] = useState<'weekly' | 'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [dueDay, setDueDay] = useState(5);
  const [gracePeriodDays, setGracePeriodDays] = useState(3);
  const [penaltyFee, setPenaltyFee] = useState(1000);
  const [maxMembers, setMaxMembers] = useState(100);
  const [autoDebitEnabled, setAutoDebitEnabled] = useState(true);
  const [exitRules, setExitRules] = useState('Minimum duration of 3 months required. Exit attracts 5% administrative charge.');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amount) return;
    setAddingPlan(true);

    try {
      const newPlan: Omit<Plan, 'id'> = {
        coopId: user?.coopId || '',
        name,
        amount,
        frequency,
        dueDay,
        gracePeriodDays,
        penaltyFee,
        maxMembers,
        autoDebitEnabled,
        reminderSchedule: [1, 3], // defaults
        exitRules,
        createdAt: new Date().toISOString()
      };

      await addDocument('plans', newPlan);
      setIsModalOpen(false);
      setName('');
      setAmount(20000);
      setExitRules('Minimum duration of 3 months required. Exit attracts 5% administrative charge.');
      setAddingPlan(false);
    } catch (err) {
      console.error(err);
      setAddingPlan(false);
    }
  };

  const currency = coop?.settings?.currency || 'NGN';

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight">Contribution Schemes & Plans</h1>
          <p className="text-xs text-slate-400">Establish saving thresholds, configure due cycles, and apply late penalty triggers.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-xl btn-primary-gradient text-xs font-bold text-white flex items-center gap-1.5 transition-all shadow-lg shadow-indigo-500/10 hover:scale-102"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Establish Plan
        </button>
      </div>

      {/* Plan Card grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-8 text-center text-slate-500 text-xs">Querying contribution schemes...</div>
        ) : plans.length === 0 ? (
          <div className="col-span-full py-8 text-center text-slate-500 text-xs">No active plans configured. Create a plan to get started.</div>
        ) : (
          plans.map((plan) => (
            <div key={plan.id} className="p-6 rounded-3xl glass-panel relative overflow-hidden group border border-white/5 hover:border-indigo-500/25 transition-all flex flex-col justify-between min-h-[260px]">
              
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-slate-200 text-sm tracking-tight">{plan.name}</h3>
                    <span className="text-[9px] text-indigo-400 uppercase tracking-widest font-bold">
                      {plan.frequency} cycle
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider font-mono ${
                    plan.autoDebitEnabled 
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' 
                      : 'bg-slate-500/15 text-slate-500 border border-slate-500/20'
                  }`}>
                    {plan.autoDebitEnabled ? 'AUTO CHARGE' : 'MANUAL'}
                  </span>
                </div>

                <p className="text-2xl font-black text-slate-100 font-mono">
                  {currency} {plan.amount.toLocaleString()}
                </p>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-900 text-[10px] text-slate-400 font-mono">
                  <div>
                    <span className="text-slate-500 uppercase block text-[8px]">Due Day</span>
                    <span className="text-slate-300 font-bold">Day {plan.dueDay} of cycle</span>
                  </div>
                  <div>
                    <span className="text-slate-500 uppercase block text-[8px]">Grace Period</span>
                    <span className="text-slate-300 font-bold">{plan.gracePeriodDays} Days</span>
                  </div>
                  <div>
                    <span className="text-slate-500 uppercase block text-[8px]">Late penalty fee</span>
                    <span className="text-rose-400 font-bold">+{currency} {plan.penaltyFee.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 uppercase block text-[8px]">Max Seats</span>
                    <span className="text-slate-300 font-bold">{plan.maxMembers} Members</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-900">
                <span className="text-[8px] uppercase tracking-wider text-slate-500 block">Plan Exit Terms</span>
                <p className="text-[9px] text-slate-400 leading-normal italic mt-0.5">{plan.exitRules}</p>
              </div>

            </div>
          ))
        )}
      </div>

      {/* CREATE PLAN MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-4 border-b border-slate-800">
              <h2 className="text-lg font-bold text-slate-100">Establish Contribution Plan</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-200">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Plan Name</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Monthly Standard Savings"
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-200 text-xs placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Amount ({currency})</label>
                  <input 
                    type="number" 
                    value={amount} 
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500/50 transition-all font-medium font-mono"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Contribution Frequency</label>
                  <select 
                    value={frequency} 
                    onChange={(e: any) => setFrequency(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500/50 transition-all font-medium"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Cycle Due Day (e.g. 5th)</label>
                  <input 
                    type="number" 
                    value={dueDay} 
                    onChange={(e) => setDueDay(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500/50 transition-all font-medium"
                    min={1}
                    max={28}
                    required
                  />
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Late Penalty Fee ({currency})</label>
                  <input 
                    type="number" 
                    value={penaltyFee} 
                    onChange={(e) => setPenaltyFee(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500/50 transition-all font-medium font-mono"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Maximum Members Limit</label>
                  <input 
                    type="number" 
                    value={maxMembers} 
                    onChange={(e) => setMaxMembers(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500/50 transition-all font-medium font-mono"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Exit Rules and Restrictions</label>
                <textarea 
                  value={exitRules} 
                  onChange={(e) => setExitRules(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-200 text-xs placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all font-medium resize-none"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input 
                  type="checkbox" 
                  id="plan-autodebit" 
                  checked={autoDebitEnabled}
                  onChange={(e) => setAutoDebitEnabled(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-indigo-500/30"
                />
                <label htmlFor="plan-autodebit" className="text-xs text-slate-300 font-medium">
                  Enable automatic debits for subscribers of this scheme
                </label>
              </div>

              <button 
                type="submit"
                disabled={addingPlan}
                className="w-full py-3.5 rounded-xl btn-primary-gradient font-bold text-white text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2"
              >
                {addingPlan ? 'Saving Plan...' : 'Publish Saving Scheme'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
