'use client';

import React from 'react';
import { useAuth } from '@/context/auth-context';
import { useCollection, useDocument } from '@/hooks/use-firestore';
import { Cooperative, Payment, WithdrawalRequest, Wallet } from '@/types';

export default function TreasurerDashboard() {
  const { user } = useAuth();
  
  // Queries
  const { data: coop } = useDocument<Cooperative>('cooperatives', user?.coopId || '');
  const { data: payments } = useCollection<Payment>('payments', [
    { field: 'coopId', operator: '==', value: user?.coopId || '' }
  ]);
  const { data: withdrawals } = useCollection<WithdrawalRequest>('withdrawalRequests', [
    { field: 'coopId', operator: '==', value: user?.coopId || '' }
  ]);
  const { data: wallets } = useCollection<Wallet>('wallets', [
    { field: 'coopId', operator: '==', value: user?.coopId || '' }
  ]);

  const currency = coop?.settings?.currency || 'NGN';

  // Calculations
  const totalWalletBalances = wallets.reduce((sum, w) => sum + w.balance, 0);
  const pendingWithdrawalCount = withdrawals.filter(w => w.status === 'pending').length;
  
  const manualPaymentsPending = payments.filter(
    p => p.paymentMethod === 'bank_transfer' && p.status === 'pending'
  ).length;

  const successfulPayments = payments.filter(p => p.status === 'success');
  const todayCollections = successfulPayments.filter(p => {
    if (!p.paidAt) return false;
    const paidDate = new Date(p.paidAt).toDateString();
    const todayDate = new Date().toDateString();
    return paidDate === todayDate;
  }).reduce((sum, p) => sum + p.totalAmount, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Title */}
      <div>
        <h1 className="text-2xl font-black text-slate-100 tracking-tight">Treasury Management Overview</h1>
        <p className="text-xs text-slate-400">Reconcile deposits, audit manual transfer requests, and authorize member cash payouts.</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <div className="p-6 rounded-3xl glass-panel relative overflow-hidden group hover:border-indigo-500/20 transition-all">
          <div className="absolute right-0 bottom-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl"></div>
          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block mb-2">Total Treasury Assets</span>
          <span className="text-2xl font-black text-slate-100 tracking-tight font-mono">
            {currency} {totalWalletBalances.toLocaleString()}
          </span>
          <p className="text-[10px] text-slate-500 mt-2">Sum of all member savings wallets</p>
        </div>

        <div className="p-6 rounded-3xl glass-panel relative overflow-hidden group hover:border-amber-500/20 transition-all">
          <div className="absolute right-0 bottom-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl"></div>
          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block mb-2">Pending Payouts</span>
          <span className="text-2xl font-black text-slate-100 tracking-tight font-mono">
            {pendingWithdrawalCount}
          </span>
          <p className="text-[10px] text-slate-500 mt-2">Active cash out requests</p>
        </div>

        <div className="p-6 rounded-3xl glass-panel relative overflow-hidden group hover:border-emerald-500/20 transition-all">
          <div className="absolute right-0 bottom-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl"></div>
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block mb-2">Manual Transfers</span>
          <span className="text-2xl font-black text-slate-100 tracking-tight font-mono">
            {manualPaymentsPending}
          </span>
          <p className="text-[10px] text-slate-500 mt-2">Pending verification audits</p>
        </div>

        <div className="p-6 rounded-3xl glass-panel relative overflow-hidden group hover:border-pink-500/20 transition-all">
          <div className="absolute right-0 bottom-0 w-24 h-24 bg-pink-500/5 rounded-full blur-2xl"></div>
          <span className="text-[10px] font-bold text-pink-400 uppercase tracking-widest block mb-2">Today's Collections</span>
          <span className="text-2xl font-black text-slate-100 tracking-tight font-mono">
            {currency} {todayCollections.toLocaleString()}
          </span>
          <p className="text-[10px] text-slate-500 mt-2">Successful auto & manual collections today</p>
        </div>

      </div>

      {/* Main grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Pending Payout approvals */}
        <div className="p-6 rounded-3xl glass-panel space-y-4">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Pending Withdrawal Payouts</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-900 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-2.5 px-3">Member</th>
                  <th className="py-2.5 px-3">Payout Amount</th>
                  <th className="py-2.5 px-3">Bank Details</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900">
                {withdrawals.filter(w => w.status === 'pending').length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-500 text-xs">No pending cash out payouts.</td>
                  </tr>
                ) : (
                  withdrawals.filter(w => w.status === 'pending').map(w => (
                    <tr key={w.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-3 font-bold text-slate-300">{w.userName}</td>
                      <td className="py-3 px-3 font-mono font-bold text-indigo-400">{currency} {w.amount.toLocaleString()}</td>
                      <td className="py-3 px-3 text-slate-400">
                        {w.bankDetails?.bankName}<br />
                        <span className="text-[9px] font-mono block">{w.bankDetails?.accountNumber}</span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <a 
                          href="/treasurer/withdrawals"
                          className="px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[9px] uppercase tracking-wider inline-block"
                        >
                          Review
                        </a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pending manual payments */}
        <div className="p-6 rounded-3xl glass-panel space-y-4">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Manual Bank Transfers Audits</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-900 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-2.5 px-3">Member</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Due Cycle</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900">
                {payments.filter(p => p.paymentMethod === 'bank_transfer' && p.status === 'pending').length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-500 text-xs">No pending manual deposits.</td>
                  </tr>
                ) : (
                  payments.filter(p => p.paymentMethod === 'bank_transfer' && p.status === 'pending').map(p => (
                    <tr key={p.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-3 font-bold text-slate-300">{p.userName}</td>
                      <td className="py-3 px-3 font-mono font-bold text-emerald-400">{currency} {p.amount.toLocaleString()}</td>
                      <td className="py-3 px-3 text-slate-400 font-mono text-[10px]">{p.dueDate}</td>
                      <td className="py-3 px-3 text-right">
                        <a 
                          href="/treasurer/payments"
                          className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[9px] uppercase tracking-wider inline-block"
                        >
                          Approve
                        </a>
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
