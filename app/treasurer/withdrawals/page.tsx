'use client';

import React from 'react';
import { useAuth } from '@/context/auth-context';
import { useCollection, useDocument, updateDocument, addDocument, getDocumentById } from '@/hooks/use-firestore';
import { sendEmail } from '@/lib/notifications';
import { WithdrawalRequest, Cooperative, Wallet } from '@/types';

export default function TreasurerWithdrawalsPage() {
  const { user } = useAuth();

  // Queries
  const { data: coop } = useDocument<Cooperative>('cooperatives', user?.coopId || '');
  const { data: withdrawals, loading } = useCollection<WithdrawalRequest>('withdrawalRequests', [
    { field: 'coopId', operator: '==', value: user?.coopId || '' }
  ]);

  const currency = coop?.settings?.currency || 'NGN';

  const handleApproveWithdrawal = async (request: WithdrawalRequest) => {
    try {
      // 1. Fetch user wallet
      const wallet = await getDocumentById('wallets', request.userId);
      if (!wallet || wallet.balance < request.amount) {
        alert(`Insufficient Funds: Member's savings balance (${currency} ${wallet ? wallet.balance.toLocaleString() : 0}) is less than requested payout (${currency} ${request.amount.toLocaleString()}).`);
        return;
      }

      // 2. Deduct from wallet balance
      await updateDocument('wallets', request.userId, {
        balance: wallet.balance - request.amount,
        lastUpdated: new Date().toISOString()
      });

      // 3. Update WithdrawalRequest
      await updateDocument('withdrawalRequests', request.id, {
        status: 'approved',
        processedBy: user?.uid || '',
        processedAt: new Date().toISOString()
      });

      // 4. Create Wallet transaction record
      await addDocument('transactions', {
        walletId: request.userId,
        userId: request.userId,
        coopId: user?.coopId,
        type: 'withdrawal',
        amount: request.amount,
        description: `Cash out payout approved to bank account ${request.bankDetails?.bankName} (${request.bankDetails?.accountNumber})`,
        reference: `w_disb_${Math.random().toString(36).substring(2, 9)}`,
        status: 'success'
      });

      // 5. Create Audit Log
      await addDocument('auditLogs', {
        userId: user?.uid || '',
        userEmail: user?.email || '',
        action: 'Approve Payout Withdrawal',
        details: `Approved and debited cash payout of ${currency} ${request.amount.toLocaleString()} for member ${request.userName}`
      });

      // 6. Send email notification
      const member = await getDocumentById('users', request.userId);
      if (member) {
        await sendEmail(
          request.userId,
          member.email,
          'Withdrawal Request Approved',
          `Hello ${request.userName},\n\nYour cash out withdrawal request of ${currency} ${request.amount.toLocaleString()} has been approved. The funds have been transferred to your linked bank account:\nBank: ${request.bankDetails?.bankName}\nAccount: ${request.bankDetails?.accountNumber}\n\nWarm regards,\nTreasury Dept.`
        );
      }

      alert('Withdrawal request approved and processed.');
    } catch (err) {
      console.error(err);
      alert('Failed to process withdrawal.');
    }
  };

  const handleRejectWithdrawal = async (request: WithdrawalRequest) => {
    try {
      await updateDocument('withdrawalRequests', request.id, {
        status: 'rejected',
        processedBy: user?.uid || '',
        processedAt: new Date().toISOString()
      });

      // Create Audit Log
      await addDocument('auditLogs', {
        userId: user?.uid || '',
        userEmail: user?.email || '',
        action: 'Reject Payout Withdrawal',
        details: `Rejected cash out request of ${currency} ${request.amount.toLocaleString()} for member ${request.userName}`
      });

      // Send email notification
      const member = await getDocumentById('users', request.userId);
      if (member) {
        await sendEmail(
          request.userId,
          member.email,
          'Withdrawal Request Declined',
          `Hello ${request.userName},\n\nYour cash out withdrawal request of ${currency} ${request.amount.toLocaleString()} was declined by the cooperative Treasury department. Please review your balance sheet or submit a support dispute.\n\nWarm regards,\nTreasury Dept.`
        );
      }

      alert('Withdrawal request declined.');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      <div>
        <h1 className="text-2xl font-black text-slate-100 tracking-tight">Withdrawals & Cash Payouts</h1>
        <p className="text-xs text-slate-400">Review cash out requests, verify ledger balances, and authorize bank payout clearances.</p>
      </div>

      <div className="p-6 rounded-3xl glass-panel space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-900 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Request Date</th>
                <th className="py-3 px-4">Member Depositor</th>
                <th className="py-3 px-4">Payout Amount</th>
                <th className="py-3 px-4">Destination Bank Account</th>
                <th className="py-3 px-4">Clearance Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">Querying payouts directory...</td>
                </tr>
              ) : withdrawals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">No withdrawal requests found.</td>
                </tr>
              ) : (
                withdrawals.map((w) => (
                  <tr key={w.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-slate-400">{new Date(w.createdAt).toLocaleDateString()}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-300">
                      {w.userName}
                      <span className="text-[9px] text-slate-500 block font-mono">UID: #{w.userId.substring(0, 6).toUpperCase()}</span>
                    </td>
                    <td className="py-3.5 px-4 text-indigo-400 font-mono font-bold">{currency} {w.amount.toLocaleString()}</td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {w.bankDetails?.bankName} ({w.bankDetails?.accountName})<br />
                      <span className="text-[9px] text-slate-500 font-mono block">Number: {w.bankDetails?.accountNumber}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                        w.status === 'approved' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : w.status === 'pending'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {w.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right flex justify-end gap-1.5">
                      {w.status === 'pending' ? (
                        <>
                          <button 
                            onClick={() => handleApproveWithdrawal(w)}
                            className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] uppercase transition-all shadow-md"
                          >
                            Approve Payout
                          </button>
                          <button 
                            onClick={() => handleRejectWithdrawal(w)}
                            className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/20 text-rose-400 font-bold text-[10px] uppercase transition-all"
                          >
                            Decline
                          </button>
                        </>
                      ) : (
                        <span className="text-[10px] text-slate-600 font-medium">Processed</span>
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
