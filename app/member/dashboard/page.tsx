'use client';

import React from 'react';
import { useAuth } from '@/context/auth-context';
import { useCollection, useDocument } from '@/hooks/use-firestore';
import { calculateMemberRiskScore } from '@/lib/risk-score';
import { Cooperative, Payment, Wallet, Loan } from '@/types';
import DigitalId from '@/components/digital-id';

export default function MemberDashboardPage() {
  const { user } = useAuth();

  // Queries
  const { data: coop } = useDocument<Cooperative>('cooperatives', user?.coopId || '');
  const { data: wallet } = useDocument<Wallet>('wallets', user?.uid || '');
  const { data: payments } = useCollection<Payment>('payments', [
    { field: 'userId', operator: '==', value: user?.uid || '' }
  ]);
  const { data: loans } = useCollection<Loan>('loans', [
    { field: 'userId', operator: '==', value: user?.uid || '' }
  ]);

  const currency = coop?.settings?.currency || 'NGN';

  // Calculations
  const totalSavings = wallet ? wallet.balance : 0;
  const overduePenalties = payments.filter(p => p.status === 'overdue').reduce((sum, p) => sum + p.penaltyAmount, 0);

  // Next due contribution details
  const nextPayment = payments.find(p => p.status === 'pending');
  
  // Calculate dynamic loan eligibility
  const { score: riskScore } = calculateMemberRiskScore(user?.uid || '', payments, wallet);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Welcome header */}
      <div>
        <h1 className="text-2xl font-black text-slate-100 tracking-tight">Good Day, {user?.name}</h1>
        <p className="text-xs text-slate-400">Track savings, review automated card debits, and check your credit score eligibility.</p>
      </div>

      {/* Grid of stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <div className="p-6 rounded-3xl glass-panel relative overflow-hidden group hover:border-indigo-500/20 transition-all">
          <div className="absolute right-0 bottom-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl"></div>
          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block mb-2">My Savings Wallet</span>
          <span className="text-2xl font-black text-slate-100 tracking-tight font-mono">
            {currency} {totalSavings.toLocaleString()}
          </span>
          <p className="text-[10px] text-slate-500 mt-2">Ledger: {currency} {totalSavings.toLocaleString()}</p>
        </div>

        <div className="p-6 rounded-3xl glass-panel relative overflow-hidden group hover:border-emerald-500/20 transition-all">
          <div className="absolute right-0 bottom-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl"></div>
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block mb-2">Next Contribution</span>
          <span className="text-2xl font-black text-slate-100 tracking-tight font-mono">
            {nextPayment ? `${currency} ${nextPayment.amount.toLocaleString()}` : 'No Pending Due'}
          </span>
          <p className="text-[10px] text-slate-500 mt-2">Date: {nextPayment ? nextPayment.dueDate : 'All cycles paid ✓'}</p>
        </div>

        <div className="p-6 rounded-3xl glass-panel relative overflow-hidden group hover:border-rose-500/20 transition-all">
          <div className="absolute right-0 bottom-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl"></div>
          <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest block mb-2">Arrears & Penalties</span>
          <span className="text-2xl font-black text-slate-100 tracking-tight font-mono">
            {currency} {overduePenalties.toLocaleString()}
          </span>
          <p className="text-[10px] text-slate-500 mt-2">Outstanding: {payments.filter(p => p.status === 'overdue').length} payments</p>
        </div>

        <div className="p-6 rounded-3xl glass-panel relative overflow-hidden group hover:border-violet-500/20 transition-all">
          <div className="absolute right-0 bottom-0 w-24 h-24 bg-violet-500/5 rounded-full blur-2xl"></div>
          <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest block mb-2">Credit Health Score</span>
          <span className="text-2xl font-black text-slate-100 tracking-tight font-mono">
            {riskScore} <span className="text-xs text-slate-500">/ 100</span>
          </span>
          <p className="text-[10px] text-slate-500 mt-2">
            {riskScore >= 75 ? 'Excellent (Low Risk)' : riskScore >= 50 ? 'Fair (Medium Risk)' : 'Poor (High Risk)'}
          </p>
        </div>

      </div>

      {/* Visual Identity & History row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Digital Membership ID */}
        <div className="p-6 rounded-3xl glass-panel space-y-4 flex flex-col justify-center items-center">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider text-center self-start">My Digital Membership ID</h3>
          {user && <DigitalId member={user} coop={coop} />}
        </div>

        {/* Recent Contributions logs */}
        <div className="lg:col-span-2 p-6 rounded-3xl glass-panel space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">My Recent Payments History</h3>
            <a href="/member/contributions" className="text-[10px] text-indigo-400 hover:underline">View All Ledger</a>
          </div>

          <div className="overflow-x-auto pt-2">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-900 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-2.5 px-3">Receipt</th>
                  <th className="py-2.5 px-3">Contribution cycle</th>
                  <th className="py-2.5 px-3">Date Paid</th>
                  <th className="py-2.5 px-3">Amount Paid</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500 text-xs">No contribution payments logged yet.</td>
                  </tr>
                ) : (
                  payments.slice(0, 4).map(p => (
                    <tr key={p.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-3 font-mono text-slate-400">REC-{p.id.substring(0, 6).toUpperCase()}</td>
                      <td className="py-3 px-3 font-bold text-slate-300">
                        {p.planName}
                        <span className="text-[9px] text-slate-500 block">Due: {p.dueDate}</span>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-400">
                        {p.paidAt ? new Date(p.paidAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-200">
                        {currency} {p.totalAmount.toLocaleString()}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          p.status === 'success' 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : p.status === 'overdue'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}
