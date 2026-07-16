'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useDocument, useCollection, addDocument } from '@/hooks/use-firestore';
import { calculateMemberRiskScore, isEligibleForLoan } from '@/lib/risk-score';
import { Cooperative, Payment, Wallet, Loan } from '@/types';

export default function MemberLoanPage() {
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

  const [requestedAmount, setRequestedAmount] = useState(150000);
  const [durationMonths, setDurationMonths] = useState(6);
  const [loading, setLoading] = useState(false);

  const currency = coop?.settings?.currency || 'NGN';
  const totalContributions = payments.filter(p => p.status === 'success').reduce((sum, p) => sum + p.amount, 0);

  // Calculate score and eligibility
  const { score: riskScore } = calculateMemberRiskScore(user?.uid || '', payments, wallet);
  const { eligible, maxEligibleAmount, reason } = isEligibleForLoan(
    riskScore,
    wallet ? wallet.balance : 0,
    requestedAmount,
    totalContributions
  );

  // Interest and installments calculations
  const interestRate = 6; // 6% flat interest
  const totalInterest = requestedAmount * (interestRate / 100) * (durationMonths / 12);
  const totalRepayable = requestedAmount + totalInterest;
  const monthlyInstallment = totalRepayable / durationMonths;

  const handleApplyLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eligible) {
      alert(`Ineligible: ${reason}`);
      return;
    }

    setLoading(true);
    try {
      await addDocument('loans', {
        userId: user?.uid || '',
        userName: user?.name || '',
        coopId: user?.coopId || '',
        amount: requestedAmount,
        interestRate,
        durationMonths,
        monthlyInstallment: Math.round(monthlyInstallment * 100) / 100,
        outstandingBalance: totalRepayable,
        eligibilityScore: riskScore,
        status: 'pending'
      });

      // Audit Log
      await addDocument('auditLogs', {
        userId: user?.uid || '',
        userEmail: user?.email || '',
        action: 'Apply for Loan',
        details: `Submitted loan application for ${currency} ${requestedAmount.toLocaleString()} over ${durationMonths} months.`
      });

      alert('Loan application successfully submitted and queued for review.');
      setRequestedAmount(150000);
    } catch (err) {
      console.error(err);
      alert('Failed to submit loan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-100 tracking-tight">Credit Score & Loan Terminal</h1>
        <p className="text-xs text-slate-400">Review credit eligibility scores, calculate compound interest schedules, and submit loan applications.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Credit details card */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl glass-panel space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wide">Credit Health Summary</h3>
            
            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Total Saved Portfolio</span>
                <span className="font-bold text-slate-200 font-mono">{currency} {totalContributions.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Maximum Credit Limit (3x)</span>
                <span className="font-bold text-emerald-400 font-mono">{currency} {maxEligibleAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Credit Score</span>
                <span className="font-bold text-indigo-400 font-mono">{riskScore} / 100</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Eligibility Status</span>
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                  eligible ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}>
                  {eligible ? 'PASSED ✓' : 'FAILED ✗'}
                </span>
              </div>
            </div>
            
            <p className="text-[10px] text-slate-500 italic pt-2 border-t border-slate-900 leading-normal">
              Note: Loan limit is calculated at 3x your total saved contributions, provided your credit score is 50 or above.
            </p>
          </div>

          {/* Active Loans list */}
          <div className="p-6 rounded-3xl glass-panel space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wide">My Active Loans</h3>
            {loans.length === 0 ? (
              <p className="text-[10px] text-slate-500 italic">No historical or active loans recorded.</p>
            ) : (
              <div className="space-y-3">
                {loans.map(loan => (
                  <div key={loan.id} className="p-3 rounded-2xl bg-slate-950/40 border border-white/5 space-y-1.5 text-xs text-slate-400">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-200">{currency} {loan.amount.toLocaleString()}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                        loan.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {loan.status}
                      </span>
                    </div>
                    <p className="font-mono text-[10px]">Monthly payment: {currency} {loan.monthlyInstallment.toLocaleString()}</p>
                    <p className="font-mono text-[10px] text-slate-500">Outstanding: {currency} {loan.outstandingBalance.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Apply form */}
        <div className="lg:col-span-2 p-6 rounded-3xl glass-panel relative overflow-hidden">
          
          <form onSubmit={handleApplyLoan} className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-100">Submit Loan Application</h2>
              <p className="text-xs text-slate-400">Credit applications will be reviewed by the Treasurer. Review interest rates before submission.</p>
            </div>

            <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl text-[10px] text-slate-400 leading-normal space-y-0.5">
              <span className="font-bold text-indigo-400 block uppercase tracking-wider">🎯 Eligibility Narrative Check</span>
              <p>{reason}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Requested Amount ({currency})</label>
                <input 
                  type="number" 
                  value={requestedAmount} 
                  onChange={(e) => setRequestedAmount(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:border-indigo-500/50 transition-all font-mono font-bold"
                  min={10000}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Duration (Months)</label>
                <select 
                  value={durationMonths} 
                  onChange={(e) => setDurationMonths(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:border-indigo-500/50 transition-all font-medium"
                  required
                >
                  <option value={3}>3 Months</option>
                  <option value={6}>6 Months</option>
                  <option value={12}>12 Months</option>
                </select>
              </div>
            </div>

            {/* Repayment breakdown details */}
            <div className="p-5 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-3 text-xs text-slate-400">
              <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wide block">Repayment Breakdown Ledger</span>
              <div className="flex justify-between items-center">
                <span>Principal Capital</span>
                <span className="font-mono font-bold text-slate-200">{currency} {requestedAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Flat Interest (6% per Annum)</span>
                <span className="font-mono font-bold text-slate-200">+{currency} {totalInterest.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-800 pt-2 font-bold">
                <span className="text-slate-300">Total Repayable Liabilities</span>
                <span className="font-mono text-indigo-400 text-sm">{currency} {totalRepayable.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center border-t border-dashed border-slate-800 pt-2 font-bold text-[10px]">
                <span className="text-slate-400">Monthly Repayment Installment</span>
                <span className="font-mono text-slate-200">{currency} {monthlyInstallment.toLocaleString()}/Month</span>
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading || !eligible}
              className="w-full py-3.5 rounded-xl btn-primary-gradient font-bold text-white text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting Application...' : 'Apply for Credit'}
            </button>
          </form>

        </div>

      </div>

    </div>
  );
}
