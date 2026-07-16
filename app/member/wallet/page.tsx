'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useDocument, useCollection, addDocument } from '@/hooks/use-firestore';
import { sendSMS } from '@/lib/notifications';
import { Cooperative, Wallet, Plan } from '@/types';

export default function MemberWalletPage() {
  const { user } = useAuth();
  
  // Queries
  const { data: coop } = useDocument<Cooperative>('cooperatives', user?.coopId || '');
  const { data: wallet } = useDocument<Wallet>('wallets', user?.uid || '');
  const { data: plans } = useCollection<Plan>('plans', [
    { field: 'coopId', operator: '==', value: user?.coopId || '' }
  ]);

  const [activeForm, setActiveForm] = useState<'withdraw' | 'manual_pay'>('withdraw');

  // Withdrawal form
  const [withdrawAmount, setWithdrawAmount] = useState(10000);
  const [loading, setLoading] = useState(false);

  // Manual payment form
  const [manualAmount, setManualAmount] = useState(20000);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [transferRef, setTransferRef] = useState('');

  const currency = coop?.settings?.currency || 'NGN';
  const balance = wallet ? wallet.balance : 0;

  const handleWithdrawalRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (withdrawAmount <= 0) return;
    if (withdrawAmount > balance) {
      alert(`Insufficient Funds: Your savings balance (${currency} ${balance.toLocaleString()}) is less than requested withdrawal.`);
      return;
    }

    setLoading(true);
    try {
      await addDocument('withdrawalRequests', {
        userId: user?.uid || '',
        userName: user?.name || '',
        coopId: user?.coopId || '',
        amount: withdrawAmount,
        bankDetails: user?.bankDetails || {
          bankName: 'Access Bank',
          accountNumber: '0123456789',
          accountName: user?.name || ''
        },
        status: 'pending',
        processedBy: null,
        processedAt: null
      });

      // Send SMS log
      await sendSMS(
        user?.uid || '',
        user?.phone || '',
        `Notification: Your cash out withdrawal of ${currency} ${withdrawAmount.toLocaleString()} has been queued. Pending Treasurer approval clearance.`
      );

      // Audit Log
      await addDocument('auditLogs', {
        userId: user?.uid || '',
        userEmail: user?.email || '',
        action: 'Request Withdrawal Payout',
        details: `Requested cash out of ${currency} ${withdrawAmount.toLocaleString()} to bank coordinates.`
      });

      alert('Withdrawal request successfully queued for Treasurer approval.');
      setWithdrawAmount(10000);
    } catch (err) {
      console.error(err);
      alert('Failed to submit withdrawal.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanId || !transferRef || manualAmount <= 0) {
      alert('Please fill in transfer reference and select saving scheme.');
      return;
    }

    setLoading(true);
    try {
      const plan = plans.find(p => p.id === selectedPlanId);
      
      // Create pending bank transfer payment
      await addDocument('payments', {
        userId: user?.uid || '',
        userName: user?.name || '',
        coopId: user?.coopId || '',
        planId: selectedPlanId,
        planName: plan?.name || 'Savings Contribution Plan',
        amount: manualAmount,
        penaltyAmount: 0,
        totalAmount: manualAmount,
        status: 'pending',
        paymentMethod: 'bank_transfer',
        gateway: 'paystack',
        gatewayRef: transferRef,
        dueDate: new Date().toISOString().split('T')[0],
        paidAt: null,
        failureReason: 'Pending Audit Review',
        retryCount: 0
      });

      // Audit Log
      await addDocument('auditLogs', {
        userId: user?.uid || '',
        userEmail: user?.email || '',
        action: 'Submit Manual Payment Proof',
        details: `Submitted manual bank transfer reference ${transferRef} for contribution of ${currency} ${manualAmount.toLocaleString()}`
      });

      alert('Manual Payment reference submitted. Treasurer will audit and credit your account shortly.');
      setTransferRef('');
      setManualAmount(20000);
    } catch (err) {
      console.error(err);
      alert('Failed to submit payment proof.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-100 tracking-tight">Savings Ledger & Wallet</h1>
        <p className="text-xs text-slate-400">Withdraw savings assets, check active balances, or submit manual bank transfer confirmations.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Wallet status and instructions */}
        <div className="space-y-6">
          
          <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-900/60 to-slate-900 border border-indigo-500/20 shadow-xl space-y-4">
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block">Available Balance</span>
            <span className="text-3xl font-black text-slate-100 tracking-tight font-mono">
              {currency} {balance.toLocaleString()}
            </span>
            <div className="text-[10px] text-slate-400 leading-normal pt-2 border-t border-indigo-500/10 space-y-1">
              <p>Institution: <span className="text-slate-200 font-semibold">{coop?.name}</span></p>
              <p>Primary Currency: <span className="text-slate-200 font-semibold font-mono">{currency}</span></p>
            </div>
          </div>

          <div className="p-6 rounded-3xl glass-panel space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wide">Wallet Actions</h3>
            <div className="flex flex-col gap-2">
              <button 
                onClick={() => setActiveForm('withdraw')}
                className={`py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all border ${
                  activeForm === 'withdraw' 
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-md' 
                    : 'bg-slate-950/60 border-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                Request Withdrawal Payout
              </button>
              <button 
                onClick={() => setActiveForm('manual_pay')}
                className={`py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all border ${
                  activeForm === 'manual_pay' 
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-md' 
                    : 'bg-slate-950/60 border-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                Submit Manual Bank Transfer
              </button>
            </div>
          </div>

        </div>

        {/* Dynamic Forms Panel */}
        <div className="lg:col-span-2 p-6 rounded-3xl glass-panel relative overflow-hidden">
          
          {activeForm === 'withdraw' && (
            <form onSubmit={handleWithdrawalRequest} className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-100">Submit Cash Out Payout</h2>
                <p className="text-xs text-slate-400">Funds will be disbursed to your linked bank coordinates upon verification.</p>
              </div>

              {/* Linked account card */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1.5 text-xs text-slate-400">
                <span className="text-[9px] uppercase font-bold text-slate-500 block">Payout Destination Account</span>
                <p className="font-bold text-slate-200">{user?.bankDetails?.accountName || user?.name}</p>
                <p className="font-mono">{user?.bankDetails?.bankName} — {user?.bankDetails?.accountNumber}</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Withdrawal Amount ({currency})</label>
                <input 
                  type="number" 
                  value={withdrawAmount} 
                  onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:border-indigo-500/50 transition-all font-mono font-bold"
                  min={1000}
                  required
                />
                <span className="text-[9px] text-slate-500">Maximum eligible payout: {currency} {balance.toLocaleString()}</span>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl btn-primary-gradient font-bold text-white text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2"
              >
                {loading ? 'Queuing Request...' : 'Request Payout Clearance'}
              </button>
            </form>
          )}

          {activeForm === 'manual_pay' && (
            <form onSubmit={handleManualPaymentSubmit} className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-100">Submit Bank Transfer Proof</h2>
                <p className="text-xs text-slate-400">Transfer funds to the cooperative coordinates, then submit audit details below.</p>
              </div>

              {/* Institution bank coordinates */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1.5 text-xs text-slate-400">
                <span className="text-[9px] uppercase font-bold text-indigo-400 block tracking-wide">🏦 Cooperative Bank Account</span>
                <p className="font-bold text-slate-200">{coop?.name}</p>
                <p className="font-mono">GTBank — 0023456789</p>
                <p className="text-[9px] text-slate-500 italic pt-1 border-t border-slate-800">
                  Include your name/UID in the transfer reference narrative for quick reconciliation checks.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Amount Sent ({currency})</label>
                  <input 
                    type="number" 
                    value={manualAmount} 
                    onChange={(e) => setManualAmount(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:border-indigo-500/50 transition-all font-mono font-bold"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Saving Scheme</label>
                  <select 
                    value={selectedPlanId}
                    onChange={(e) => setSelectedPlanId(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:border-indigo-500/50 transition-all font-medium"
                    required
                  >
                    <option value="">Select Plan...</option>
                    {plans.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({currency} {p.amount.toLocaleString()})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Bank Transfer Narrative / Ref Reference</label>
                <input 
                  type="text" 
                  value={transferRef} 
                  onChange={(e) => setTransferRef(e.target.value)}
                  placeholder="e.g. TXN-9876543210-BANK"
                  className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:border-indigo-500/50 transition-all font-mono"
                  required
                />
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl btn-primary-gradient font-bold text-white text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2"
              >
                {loading ? 'Submitting Transfer Audit...' : 'Submit Deposit Audit'}
              </button>
            </form>
          )}

        </div>

      </div>

    </div>
  );
}
