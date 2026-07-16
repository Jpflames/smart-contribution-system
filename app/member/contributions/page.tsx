'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useCollection, useDocument } from '@/hooks/use-firestore';
import { Payment, Cooperative } from '@/types';
import ReceiptPdf from '@/components/receipt-pdf';

export default function MemberContributionsPage() {
  const { user } = useAuth();
  const { data: coop } = useDocument<Cooperative>('cooperatives', user?.coopId || '');
  const { data: payments, loading } = useCollection<Payment>('payments', [
    { field: 'userId', operator: '==', value: user?.uid || '' }
  ]);

  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  const currency = coop?.settings?.currency || 'NGN';

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      <div>
        <h1 className="text-2xl font-black text-slate-100 tracking-tight">Contributions Ledger & Receipts</h1>
        <p className="text-xs text-slate-400">Review historical payments, audit penalty assessments, and download receipt certificates.</p>
      </div>

      <div className="p-6 rounded-3xl glass-panel space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-900 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Receipt Num</th>
                <th className="py-3 px-4">Contribution Plan</th>
                <th className="py-3 px-4">Base Savings</th>
                <th className="py-3 px-4">Accrued Penalty</th>
                <th className="py-3 px-4">Total Amount Charged</th>
                <th className="py-3 px-4">DueDate</th>
                <th className="py-3 px-4">Paid Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 text-xs">Querying savings logs...</td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 text-xs">No contribution history recorded.</td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-slate-400">REC-{p.id.substring(0, 6).toUpperCase()}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-200">{p.planName}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-300">{currency} {p.amount.toLocaleString()}</td>
                    <td className="py-3.5 px-4 font-mono text-rose-400">+{currency} {p.penaltyAmount.toLocaleString()}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-100">{currency} {p.totalAmount.toLocaleString()}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">{p.dueDate}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">{p.paidAt ? new Date(p.paidAt).toLocaleDateString() : 'N/A'}</td>
                    <td className="py-3.5 px-4 text-right">
                      {p.status === 'success' ? (
                        <button 
                          onClick={() => setSelectedPayment(p)}
                          className="px-2.5 py-1.5 rounded-xl bg-indigo-600/10 hover:bg-indigo-600 border border-indigo-500/20 hover:text-white text-indigo-400 font-bold text-[9px] uppercase tracking-wider transition-all"
                        >
                          View Receipt
                        </button>
                      ) : (
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                          p.status === 'overdue' ? 'bg-rose-500/15 text-rose-400 border border-rose-500/20' : 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                        }`}>
                          {p.status}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RECEIPT VIEW MODAL OVERLAY */}
      {selectedPayment && (
        <ReceiptPdf 
          payment={selectedPayment} 
          coopName={coop?.name || 'Cooperative'} 
          currency={currency} 
          onClose={() => setSelectedPayment(null)} 
        />
      )}

    </div>
  );
}
