'use client';

import React from 'react';
import { useAuth } from '@/context/auth-context';
import { useCollection, useDocument, updateDocument, addDocument, getDocumentById } from '@/hooks/use-firestore';
import { sendEmail } from '@/lib/notifications';
import { Payment, Cooperative, Wallet } from '@/types';

export default function TreasurerPaymentsAuditingPage() {
  const { user } = useAuth();
  
  // Queries
  const { data: coop } = useDocument<Cooperative>('cooperatives', user?.coopId || '');
  const { data: payments, loading } = useCollection<Payment>('payments', [
    { field: 'coopId', operator: '==', value: user?.coopId || '' }
  ]);

  const currency = coop?.settings?.currency || 'NGN';

  const handleApproveManualPayment = async (payment: Payment) => {
    try {
      // 1. Update Payment status
      await updateDocument('payments', payment.id, {
        status: 'success',
        paidAt: new Date().toISOString(),
        gatewayRef: `manual_rec_${Math.random().toString(36).substring(2, 9)}`,
        failureReason: null
      });

      // 2. Load User wallet and credit
      const wallet = await getDocumentById('wallets', payment.userId);
      if (wallet) {
        await updateDocument('wallets', payment.userId, {
          balance: (wallet.balance || 0) + payment.amount,
          lastUpdated: new Date().toISOString()
        });
      } else {
        await addDocument('wallets', {
          id: payment.userId,
          userId: payment.userId,
          coopId: user?.coopId,
          balance: payment.amount,
          ledgerBalance: payment.amount,
          currency,
          lastUpdated: new Date().toISOString()
        });
      }

      // 3. Create Audit Log
      await addDocument('auditLogs', {
        userId: user?.uid || '',
        userEmail: user?.email || '',
        action: 'Approve Manual Payment',
        details: `Approved bank transfer contribution of ${currency} ${payment.amount.toLocaleString()} for member ${payment.userName}`
      });

      // 4. Send email receipt
      const member = await getDocumentById('users', payment.userId);
      if (member) {
        await sendEmail(
          payment.userId,
          member.email,
          'Manual Deposit Verified',
          `Hello ${payment.userName},\n\nYour bank transfer payment of ${currency} ${payment.amount.toLocaleString()} has been audited and approved by the Treasurer.\n\nReceipt Number: REC-${payment.id.substring(0, 8).toUpperCase()}\n\nWarm regards,\nTreasury Dept.`
        );
      }

      alert('Manual Payment Approved and Credited.');
    } catch (err) {
      console.error(err);
      alert('Failed to approve payment.');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      <div>
        <h1 className="text-2xl font-black text-slate-100 tracking-tight">Payments Ledger & Auditing</h1>
        <p className="text-xs text-slate-400">Reconcile transaction registries, audit card authorization charges, and credit manual bank transfers.</p>
      </div>

      <div className="p-6 rounded-3xl glass-panel space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-900 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Receipt Number</th>
                <th className="py-3 px-4">Contributor Member</th>
                <th className="py-3 px-4">Saving Scheme</th>
                <th className="py-3 px-4">Total Amount</th>
                <th className="py-3 px-4">Billing Channel</th>
                <th className="py-3 px-4">Reference</th>
                <th className="py-3 px-4">Billing Status</th>
                <th className="py-3 px-4 text-right">Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">Querying transaction sheets...</td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">No payment logs found.</td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-slate-400">REC-{p.id.substring(0, 6).toUpperCase()}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-300">
                      {p.userName}
                      <span className="text-[9px] text-slate-500 block font-mono">UID: #{p.userId.substring(0, 6).toUpperCase()}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">{p.planName}</td>
                    <td className="py-3.5 px-4 text-slate-200 font-mono font-bold">
                      {currency} {(p.amount + p.penaltyAmount).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 uppercase font-bold text-[9px] text-indigo-400">{p.paymentMethod.replace('_', ' ')}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">{p.gatewayRef || 'N/A'}</td>
                    <td className="py-3.5 px-4">
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
                    <td className="py-3.5 px-4 text-right">
                      {p.paymentMethod === 'bank_transfer' && p.status === 'pending' ? (
                        <button 
                          onClick={() => handleApproveManualPayment(p)}
                          className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] uppercase transition-all shadow-md"
                        >
                          Confirm Receipt
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-600 font-medium">Audited</span>
                      )}
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
