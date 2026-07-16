'use client';

import React, { useState } from 'react';
import { useCollection, updateDocument } from '@/hooks/use-firestore';
import { Payment } from '@/types';

export default function DisputesResolutionPage() {
  const { data: payments, loading } = useCollection<Payment>('payments');
  
  // Filter payments that have failed as disputes candidates
  const disputedPayments = payments.filter(p => p.status === 'failed' || p.status === 'overdue');

  const handleResolveDispute = async (paymentId: string) => {
    try {
      await updateDocument('payments', paymentId, { 
        status: 'success', 
        paidAt: new Date().toISOString(),
        failureReason: 'Resolved by Super Admin'
      });
      alert('Dispute resolved. Payment marked as successful.');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      <div>
        <h1 className="text-2xl font-black text-slate-100 tracking-tight">Disputes Resolution Hub</h1>
        <p className="text-xs text-slate-400">Audit failed card debits, review gateway verification errors, and resolve contribution discrepancies.</p>
      </div>

      <div className="p-6 rounded-3xl glass-panel space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-900 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Member Name</th>
                <th className="py-3 px-4">Contribution Plan</th>
                <th className="py-3 px-4">Gateway Reference</th>
                <th className="py-3 px-4">Failed Amount</th>
                <th className="py-3 px-4">Gateway Error Detail</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">Querying dispute ledger...</td>
                </tr>
              ) : disputedPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">Zero active disputes. All collection transactions are settled.</td>
                </tr>
              ) : (
                disputedPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-200">
                      {payment.userName}
                      <span className="text-[9px] text-slate-500 block">ID: #{payment.userId.substring(0, 6).toUpperCase()}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {payment.planName}
                      <span className="text-[9px] text-indigo-400 block font-mono">Due: {payment.dueDate}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono">{payment.gatewayRef}</td>
                    <td className="py-3.5 px-4 text-rose-400 font-mono font-bold">
                      NGN {(payment.amount + payment.penaltyAmount).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-medium italic">
                      {payment.failureReason || 'Debit Attempt Timeout'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                        payment.status === 'overdue' 
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button 
                        onClick={() => handleResolveDispute(payment.id)}
                        className="px-3 py-1.5 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-600 hover:text-white font-bold text-[10px] uppercase transition-all"
                      >
                        Force Settle
                      </button>
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
