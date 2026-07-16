'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useCollection, useDocument } from '@/hooks/use-firestore';
import { Cooperative, Payment, UserProfile } from '@/types';

export default function ReportsPortalPage() {
  const { user } = useAuth();
  const { data: coop } = useDocument<Cooperative>('cooperatives', user?.coopId || '');
  const { data: payments } = useCollection<Payment>('payments', [
    { field: 'coopId', operator: '==', value: user?.coopId || '' }
  ]);
  const { data: members } = useCollection<UserProfile>('users', [
    { field: 'coopId', operator: '==', value: user?.coopId || '' },
    { field: 'role', operator: '==', value: 'member' }
  ]);

  const [activeTab, setActiveTab] = useState<'contributions' | 'defaulters' | 'revenue'>('contributions');

  const currency = coop?.settings?.currency || 'NGN';

  // Filters
  const successfulPayments = payments.filter(p => p.status === 'success');
  const overduePayments = payments.filter(p => p.status === 'overdue');

  const handleExportCSV = (reportType: string) => {
    let exportData: any[] = [];
    let filename = `coopsync_${reportType}_report.csv`;

    if (reportType === 'contributions') {
      exportData = successfulPayments.map(p => ({
        ReceiptNumber: `REC-${p.id.substring(0, 8).toUpperCase()}`,
        MemberName: p.userName,
        PlanName: p.planName,
        Amount: p.amount,
        Penalty: p.penaltyAmount,
        TotalPaid: p.totalAmount,
        DatePaid: new Date(p.paidAt || p.createdAt).toLocaleDateString(),
        Reference: p.gatewayRef
      }));
    } else if (reportType === 'defaulters') {
      exportData = overduePayments.map(p => ({
        MemberName: p.userName,
        PlanName: p.planName,
        OverdueAmount: p.amount,
        PenaltyAssessed: p.penaltyAmount,
        TotalOutstanding: p.totalAmount,
        DueDate: p.dueDate,
        FailedAttempts: p.retryCount,
        Reason: p.failureReason || 'Declined'
      }));
    } else {
      // Revenue
      exportData = [
        { Metric: 'Total Registered Members', Value: members.length },
        { Metric: 'Active Contributors', Value: members.filter(m => m.status === 'approved').length },
        { Metric: 'Successful Auto-Debits', Value: successfulPayments.length },
        { Metric: 'Total Capital Collected', Value: successfulPayments.reduce((sum, p) => sum + p.amount, 0) },
        { Metric: 'Penalties Assessed', Value: overduePayments.reduce((sum, p) => sum + p.penaltyAmount, 0) },
        { Metric: 'Total Revenue Realized', Value: successfulPayments.reduce((sum, p) => sum + p.totalAmount, 0) }
      ];
    }

    if (exportData.length === 0) {
      alert('No data available to export.');
      return;
    }

    // Convert JSON to CSV string
    const headers = Object.keys(exportData[0]).join(',');
    const rows = exportData.map(item => 
      Object.values(item).map(val => typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val).join(',')
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight">Audit & Financial Statements</h1>
          <p className="text-xs text-slate-400">Generate compliance ledgers, audit defaults, and export financial summaries.</p>
        </div>
        <button 
          onClick={() => handleExportCSV(activeTab)}
          className="px-4 py-2.5 rounded-xl btn-primary-gradient text-xs font-bold text-white flex items-center gap-1.5 transition-all shadow-lg shadow-indigo-500/10 hover:scale-102"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Export Report (CSV)
        </button>
      </div>

      {/* Tabs selectors */}
      <div className="flex gap-2 border-b border-slate-900 pb-px">
        <button 
          onClick={() => setActiveTab('contributions')}
          className={`pb-3 px-2 text-xs font-bold tracking-wider uppercase border-b-2 transition-all ${
            activeTab === 'contributions' 
              ? 'border-indigo-500 text-slate-100' 
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          Contributions Ledger
        </button>
        <button 
          onClick={() => setActiveTab('defaulters')}
          className={`pb-3 px-2 text-xs font-bold tracking-wider uppercase border-b-2 transition-all ${
            activeTab === 'defaulters' 
              ? 'border-indigo-500 text-slate-100' 
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          Defaulters List
        </button>
        <button 
          onClick={() => setActiveTab('revenue')}
          className={`pb-3 px-2 text-xs font-bold tracking-wider uppercase border-b-2 transition-all ${
            activeTab === 'revenue' 
              ? 'border-indigo-500 text-slate-100' 
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          Capital Summary
        </button>
      </div>

      {/* Report Panel */}
      <div className="p-6 rounded-3xl glass-panel">
        
        {activeTab === 'contributions' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Cleared Contributions</span>
              <span className="text-xs text-emerald-400 font-mono font-bold">
                Total Cleared: {currency} {successfulPayments.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-900 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-2.5 px-3">Receipt</th>
                    <th className="py-2.5 px-3">Contributor</th>
                    <th className="py-2.5 px-3">Plan</th>
                    <th className="py-2.5 px-3">Base saving</th>
                    <th className="py-2.5 px-3">Penalty Assessed</th>
                    <th className="py-2.5 px-3">Total Paid</th>
                    <th className="py-2.5 px-3">Settlement Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {successfulPayments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">No successful payments logged.</td>
                    </tr>
                  ) : (
                    successfulPayments.map(p => (
                      <tr key={p.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-3 px-3 font-mono text-slate-400">REC-{p.id.substring(0, 6).toUpperCase()}</td>
                        <td className="py-3 px-3 font-bold text-slate-300">{p.userName}</td>
                        <td className="py-3 px-3 text-slate-400">{p.planName}</td>
                        <td className="py-3 px-3 font-mono text-slate-300">{currency} {p.amount.toLocaleString()}</td>
                        <td className="py-3 px-3 font-mono text-rose-400">+{currency} {p.penaltyAmount.toLocaleString()}</td>
                        <td className="py-3 px-3 font-mono font-bold text-emerald-400">{currency} {p.totalAmount.toLocaleString()}</td>
                        <td className="py-3 px-3 font-mono text-slate-500">{new Date(p.paidAt || p.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'defaulters' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Active Overdue Invoices</span>
              <span className="text-xs text-rose-400 font-mono font-bold">
                Outstanding: {currency} {overduePayments.reduce((sum, p) => sum + p.totalAmount, 0).toLocaleString()}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-900 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-2.5 px-3">Member Defaulter</th>
                    <th className="py-2.5 px-3">Contribution Plan</th>
                    <th className="py-2.5 px-3">Overdue Capital</th>
                    <th className="py-2.5 px-3">Accrued Penalty</th>
                    <th className="py-2.5 px-3">Outstanding Bal</th>
                    <th className="py-2.5 px-3">Original Due Date</th>
                    <th className="py-2.5 px-3">Billing Errors</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {overduePayments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">Zero active defaults recorded. Good work!</td>
                    </tr>
                  ) : (
                    overduePayments.map(p => (
                      <tr key={p.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-3 px-3 font-bold text-slate-300">
                          {p.userName}
                          <span className="text-[9px] text-slate-500 block font-mono">UID: #{p.userId.substring(0, 6).toUpperCase()}</span>
                        </td>
                        <td className="py-3 px-3 text-slate-400">{p.planName}</td>
                        <td className="py-3 px-3 font-mono text-slate-300">{currency} {p.amount.toLocaleString()}</td>
                        <td className="py-3 px-3 font-mono text-rose-400">+{currency} {p.penaltyAmount.toLocaleString()}</td>
                        <td className="py-3 px-3 font-mono font-bold text-rose-500">{currency} {p.totalAmount.toLocaleString()}</td>
                        <td className="py-3 px-3 font-mono text-slate-500">{p.dueDate}</td>
                        <td className="py-3 px-3 font-medium text-slate-500 italic">{p.failureReason || 'Failed charge auth'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'revenue' && (
          <div className="space-y-6">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block pb-2 border-b border-slate-900">Capital Ledger Breakdown</span>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-950/40 border border-white/5 flex justify-between items-center">
                  <span className="text-xs text-slate-400 font-medium">Total Registered Members</span>
                  <span className="text-base font-bold text-slate-200 font-mono">{members.length}</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950/40 border border-white/5 flex justify-between items-center">
                  <span className="text-xs text-slate-400 font-medium">Active Subscribed Depositors</span>
                  <span className="text-base font-bold text-indigo-400 font-mono">{members.filter(m => m.status === 'approved').length}</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950/40 border border-white/5 flex justify-between items-center">
                  <span className="text-xs text-slate-400 font-medium">Auto-Debit Cards Linked</span>
                  <span className="text-base font-bold text-emerald-400 font-mono">
                    {members.filter(m => m.kycStatus === 'approved').length} Linked
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-950/40 border border-white/5 flex justify-between items-center">
                  <span className="text-xs text-slate-400 font-medium">Net Savings Contributions</span>
                  <span className="text-base font-bold text-emerald-400 font-mono">
                    {currency} {successfulPayments.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950/40 border border-white/5 flex justify-between items-center">
                  <span className="text-xs text-slate-400 font-medium">Accrued Default Penalties</span>
                  <span className="text-base font-bold text-rose-400 font-mono">
                    {currency} {payments.reduce((sum, p) => sum + p.penaltyAmount, 0).toLocaleString()}
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950/40 border border-white/5 flex justify-between items-center">
                  <span className="text-xs text-slate-400 font-bold">Total Portfolio Assets</span>
                  <span className="text-base font-black text-indigo-400 font-mono">
                    {currency} {successfulPayments.reduce((sum, p) => sum + p.totalAmount, 0).toLocaleString()}
                  </span>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>

    </div>
  );
}
