'use client';

import React from 'react';
import { useAuth } from '@/context/auth-context';
import { useCollection, useDocument } from '@/hooks/use-firestore';
import { calculateMemberRiskScore } from '@/lib/risk-score';
import { Cooperative, UserProfile, Payment } from '@/types';

export default function CoopAdminDashboard() {
  const { user } = useAuth();
  
  // Queries
  const { data: coop } = useDocument<Cooperative>('cooperatives', user?.coopId || '');
  const { data: members } = useCollection<UserProfile>('users', [
    { field: 'coopId', operator: '==', value: user?.coopId || '' },
    { field: 'role', operator: '==', value: 'member' }
  ]);
  const { data: payments } = useCollection<Payment>('payments', [
    { field: 'coopId', operator: '==', value: user?.coopId || '' }
  ]);

  const currency = coop?.settings?.currency || 'NGN';

  // Calculations
  const totalMembers = members.length;
  const activeMembers = members.filter(m => m.status === 'approved').length;
  
  const successfulPayments = payments.filter(p => p.status === 'success');
  const totalCollected = successfulPayments.reduce((sum, p) => sum + p.amount, 0);

  const overduePayments = payments.filter(p => p.status === 'overdue');
  const totalOutstanding = overduePayments.reduce((sum, p) => sum + p.totalAmount, 0);

  const defaultersCount = Array.from(new Set(overduePayments.map(p => p.userId))).length;

  // Build risk scores alert feed
  const riskAlerts = members.map(m => {
    const mPayments = payments.filter(p => p.userId === m.uid);
    const mWallet = { id: m.uid, userId: m.uid, coopId: user?.coopId || '', balance: 0, ledgerBalance: 0, currency, lastUpdated: '' };
    const { score, rating } = calculateMemberRiskScore(m.uid, mPayments, mWallet);
    const failedAttempts = mPayments.filter(p => p.status === 'failed').reduce((sum, p) => sum + p.retryCount, 0);
    return {
      member: m,
      score,
      rating,
      failedAttempts,
      overdueCount: mPayments.filter(p => p.status === 'overdue').length
    };
  }).filter(item => item.score < 50 || item.failedAttempts > 1);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-100 tracking-tight">Cooperative Performance</h1>
        <p className="text-xs text-slate-400">Manage member portfolios, audit recurring billing cycles, and review delinquency risk charts.</p>
      </div>

      {/* Grid of stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <div className="p-6 rounded-3xl glass-panel relative overflow-hidden group hover:border-emerald-500/20 transition-all">
          <div className="absolute right-0 bottom-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl"></div>
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block mb-2">Total Contributions</span>
          <span className="text-2xl font-black text-slate-100 tracking-tight font-mono">
            {currency} {totalCollected.toLocaleString()}
          </span>
          <p className="text-[10px] text-slate-500 mt-2">Active Plans: {payments.filter(p => p.status === 'success').length}</p>
        </div>

        <div className="p-6 rounded-3xl glass-panel relative overflow-hidden group hover:border-indigo-500/20 transition-all">
          <div className="absolute right-0 bottom-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl"></div>
          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block mb-2">Active Members</span>
          <span className="text-2xl font-black text-slate-100 tracking-tight font-mono">
            {activeMembers} <span className="text-xs text-slate-500 font-normal">/ {totalMembers} Total</span>
          </span>
          <p className="text-[10px] text-slate-500 mt-2">Pending KYC: {members.filter(m => m.kycStatus === 'pending').length}</p>
        </div>

        <div className="p-6 rounded-3xl glass-panel relative overflow-hidden group hover:border-rose-500/20 transition-all">
          <div className="absolute right-0 bottom-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl"></div>
          <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest block mb-2">Outstanding Arrears</span>
          <span className="text-2xl font-black text-slate-100 tracking-tight font-mono">
            {currency} {totalOutstanding.toLocaleString()}
          </span>
          <p className="text-[10px] text-slate-500 mt-2">Unpaid Schedules: {overduePayments.length}</p>
        </div>

        <div className="p-6 rounded-3xl glass-panel relative overflow-hidden group hover:border-amber-500/20 transition-all">
          <div className="absolute right-0 bottom-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl"></div>
          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block mb-2">Defaulters flagged</span>
          <span className="text-2xl font-black text-slate-100 tracking-tight font-mono">
            {defaultersCount}
          </span>
          <p className="text-[10px] text-slate-500 mt-2">Auto-Penalty assessments active</p>
        </div>

      </div>

      {/* Graphs & Alerts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Dynamic Billing Graph */}
        <div className="lg:col-span-2 p-6 rounded-3xl glass-panel space-y-4">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Historical Collection Ledger</h3>
          <p className="text-[10px] text-slate-500">Breakdown of successes vs defaults this quarter</p>

          <div className="h-60 w-full flex items-end justify-around px-4 pb-6 pt-4 relative bg-slate-950/40 rounded-2xl border border-white/5">
            <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none">
              <div className="w-full border-b border-white/5"></div>
              <div className="w-full border-b border-white/5"></div>
              <div className="w-full border-b border-white/5"></div>
            </div>

            {/* Simulated bar groups */}
            <div className="flex flex-col items-center gap-2">
              <div className="flex gap-1 items-end h-36">
                <div className="w-4 bg-emerald-500 rounded-t h-28 hover:scale-105 transition-all" title="Paid"></div>
                <div className="w-4 bg-rose-500 rounded-t h-10 hover:scale-105 transition-all" title="Defaulted"></div>
              </div>
              <span className="text-[9px] font-bold font-mono text-slate-500">Week 1</span>
            </div>

            <div className="flex flex-col items-center gap-2">
              <div className="flex gap-1 items-end h-36">
                <div className="w-4 bg-emerald-500 rounded-t h-32 hover:scale-105 transition-all" title="Paid"></div>
                <div className="w-4 bg-rose-500 rounded-t h-4 hover:scale-105 transition-all" title="Defaulted"></div>
              </div>
              <span className="text-[9px] font-bold font-mono text-slate-500">Week 2</span>
            </div>

            <div className="flex flex-col items-center gap-2">
              <div className="flex gap-1 items-end h-36">
                <div className="w-4 bg-emerald-500 rounded-t h-24 hover:scale-105 transition-all" title="Paid"></div>
                <div className="w-4 bg-rose-500 rounded-t h-12 hover:scale-105 transition-all" title="Defaulted"></div>
              </div>
              <span className="text-[9px] font-bold font-mono text-slate-500">Week 3</span>
            </div>

            <div className="flex flex-col items-center gap-2">
              <div className="flex gap-1 items-end h-36">
                <div className="w-4 bg-emerald-500 rounded-t h-30 hover:scale-105 transition-all" title="Paid"></div>
                <div className="w-4 bg-rose-500 rounded-t h-8 hover:scale-105 transition-all" title="Defaulted"></div>
              </div>
              <span className="text-[9px] font-bold font-mono text-slate-500">Week 4</span>
            </div>
          </div>
        </div>

        {/* High Risk Alerts Panel */}
        <div className="p-6 rounded-3xl glass-panel space-y-4">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
            Delinquency Risk Radar
          </h3>
          <p className="text-[10px] text-slate-500">Members with failing card parameters or low risk scores</p>

          <div className="space-y-3 max-h-64 overflow-y-auto pt-2">
            {riskAlerts.length === 0 ? (
              <div className="h-44 flex flex-col items-center justify-center text-slate-600 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 mb-1 opacity-45">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                <span className="text-[10px]">No members flagged as high risk. All saving schedules are secure.</span>
              </div>
            ) : (
              riskAlerts.map(({ member, score, rating, failedAttempts, overdueCount }) => (
                <div key={member.uid} className="p-3 rounded-2xl bg-slate-950/50 border border-rose-500/10 flex justify-between items-center gap-2">
                  <div className="truncate">
                    <p className="text-xs font-bold text-slate-200 truncate">{member.name}</p>
                    <div className="flex gap-2 text-[9px] text-slate-500 font-mono mt-0.5">
                      <span>Failed Card: {failedAttempts}</span>
                      <span>Overdue: {overdueCount}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold font-mono ${
                      rating === 'High' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      RISK: {score}%
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Recent Payments Logs Table */}
      <div className="p-6 rounded-3xl glass-panel space-y-4">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Transaction Ledger (Recent Payments)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-900 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Receipt Num</th>
                <th className="py-3 px-4">Member Contributor</th>
                <th className="py-3 px-4">Contribution Plan</th>
                <th className="py-3 px-4">Amount Charges</th>
                <th className="py-3 px-4">Settlement Reference</th>
                <th className="py-3 px-4">Billing Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">No recent transactions recorded in this cooperative.</td>
                </tr>
              ) : (
                payments.slice(0, 5).map((pay) => (
                  <tr key={pay.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-400">
                      REC-{pay.id.substring(0, 6).toUpperCase()}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-300">{pay.userName}</td>
                    <td className="py-3.5 px-4 text-slate-400">{pay.planName}</td>
                    <td className="py-3.5 px-4 text-slate-200 font-mono font-bold">
                      {currency} {(pay.amount + pay.penaltyAmount).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">{pay.gatewayRef}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                        pay.status === 'success' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : pay.status === 'overdue'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {pay.status}
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
  );
}
