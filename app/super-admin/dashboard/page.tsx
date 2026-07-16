'use client';

import React from 'react';
import { useCollection } from '@/hooks/use-firestore';
import { Cooperative, UserProfile, Payment } from '@/types';

export default function SuperAdminDashboard() {
  const { data: coops, loading: coopsLoading } = useCollection<Cooperative>('cooperatives');
  const { data: users, loading: usersLoading } = useCollection<UserProfile>('users');
  const { data: payments, loading: paymentsLoading } = useCollection<Payment>('payments');

  // Calculate summaries
  const totalCoops = coops.length;
  const totalMembers = users.filter(u => u.role === 'member').length;
  const activeCoops = coops.filter(c => c.status === 'active').length;
  
  const successfulPayments = payments.filter(p => p.status === 'success');
  const totalCollections = successfulPayments.reduce((sum, p) => sum + p.amount, 0);

  const pendingApprovals = users.filter(u => u.status === 'pending' || u.kycStatus === 'pending').length;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-black text-slate-100 tracking-tight">System Administration Overview</h1>
        <p className="text-xs text-slate-400">Real-time statistics across all registered cooperatives and gateways.</p>
      </div>

      {/* Grid of Summary Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Card 1 */}
        <div className="p-6 rounded-3xl glass-panel relative overflow-hidden group hover:border-indigo-500/20 transition-all">
          <div className="absolute right-0 bottom-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:scale-110 transition-transform"></div>
          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block mb-2">Registered Cooperatives</span>
          <span className="text-3xl font-black text-slate-100 tracking-tight font-mono">
            {coopsLoading ? '...' : totalCoops}
          </span>
          <p className="text-[10px] text-slate-500 mt-2">Active: {activeCoops} | Inactive: {totalCoops - activeCoops}</p>
        </div>

        {/* Card 2 */}
        <div className="p-6 rounded-3xl glass-panel relative overflow-hidden group hover:border-violet-500/20 transition-all">
          <div className="absolute right-0 bottom-0 w-24 h-24 bg-violet-500/5 rounded-full blur-2xl group-hover:scale-110 transition-transform"></div>
          <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest block mb-2">Global Members</span>
          <span className="text-3xl font-black text-slate-100 tracking-tight font-mono">
            {usersLoading ? '...' : totalMembers}
          </span>
          <p className="text-[10px] text-slate-500 mt-2">KYC Completed: {users.filter(u => u.kycStatus === 'approved').length}</p>
        </div>

        {/* Card 3 */}
        <div className="p-6 rounded-3xl glass-panel relative overflow-hidden group hover:border-emerald-500/20 transition-all">
          <div className="absolute right-0 bottom-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:scale-110 transition-transform"></div>
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block mb-2">Total Collections</span>
          <span className="text-3xl font-black text-slate-100 tracking-tight font-mono">
            NGN {paymentsLoading ? '...' : totalCollections.toLocaleString()}
          </span>
          <p className="text-[10px] text-slate-500 mt-2">Successful Charges: {successfulPayments.length}</p>
        </div>

        {/* Card 4 */}
        <div className="p-6 rounded-3xl glass-panel relative overflow-hidden group hover:border-amber-500/20 transition-all">
          <div className="absolute right-0 bottom-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:scale-110 transition-transform"></div>
          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block mb-2">Action Items</span>
          <span className="text-3xl font-black text-slate-100 tracking-tight font-mono">
            {usersLoading ? '...' : pendingApprovals}
          </span>
          <p className="text-[10px] text-slate-500 mt-2">Pending KYC/Account approvals</p>
        </div>

      </div>

      {/* Charts & Graphs Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Collection Trends Chart (2/3 width) */}
        <div className="lg:col-span-2 p-6 rounded-3xl glass-panel space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Contribution Revenue Trend</h3>
              <p className="text-[10px] text-slate-500">Global successful auto-debits monthly</p>
            </div>
            <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 text-[10px] font-bold font-mono">
              Auto-Debit Run
            </span>
          </div>

          {/* Premium Custom SVG Chart */}
          <div className="h-64 w-full flex items-end justify-between px-4 pb-6 pt-4 relative bg-slate-950/40 rounded-2xl border border-white/5">
            {/* Grid Lines */}
            <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none">
              <div className="w-full border-b border-white/5"></div>
              <div className="w-full border-b border-white/5"></div>
              <div className="w-full border-b border-white/5"></div>
              <div className="w-full border-b border-white/5"></div>
            </div>

            {/* Simulated Bars */}
            <div className="flex flex-col items-center gap-2 z-10 w-12">
              <div className="w-6 bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-lg h-20 hover:scale-105 duration-200 cursor-pointer shadow-md"></div>
              <span className="text-[9px] font-bold font-mono text-slate-500">May</span>
            </div>
            <div className="flex flex-col items-center gap-2 z-10 w-12">
              <div className="w-6 bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-lg h-32 hover:scale-105 duration-200 cursor-pointer shadow-md"></div>
              <span className="text-[9px] font-bold font-mono text-slate-500">Jun</span>
            </div>
            <div className="flex flex-col items-center gap-2 z-10 w-12">
              <div className="w-6 bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-lg h-44 hover:scale-105 duration-200 cursor-pointer shadow-md"></div>
              <span className="text-[9px] font-bold font-mono text-slate-500">Jul</span>
            </div>
            <div className="flex flex-col items-center gap-2 z-10 w-12">
              <div className="w-6 bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-lg h-36 hover:scale-105 duration-200 cursor-pointer shadow-md"></div>
              <span className="text-[9px] font-bold font-mono text-slate-500">Aug</span>
            </div>
            <div className="flex flex-col items-center gap-2 z-10 w-12">
              <div className="w-6 bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-lg h-52 hover:scale-105 duration-200 cursor-pointer shadow-md"></div>
              <span className="text-[9px] font-bold font-mono text-slate-500">Sep</span>
            </div>
          </div>
        </div>

        {/* Cooperative Distribution (1/3 width) */}
        <div className="p-6 rounded-3xl glass-panel space-y-4">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Member Distribution</h3>
          <p className="text-[10px] text-slate-500">Division across primary institutions</p>

          <div className="space-y-4 mt-6">
            {coopsLoading ? (
              <p className="text-xs text-slate-500">Loading details...</p>
            ) : coops.length === 0 ? (
              <p className="text-xs text-slate-600">No cooperatives added yet.</p>
            ) : (
              coops.map((coop, i) => {
                const total = coops.reduce((sum, c) => sum + (c.stats?.totalMembers || 0), 0);
                const percent = total > 0 ? Math.round(((coop.stats?.totalMembers || 0) / total) * 100) : 0;
                
                const colors = ['bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-pink-500'];
                const color = colors[i % colors.length];

                return (
                  <div key={coop.id} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-300 truncate max-w-[150px]">{coop.name}</span>
                      <span className="text-slate-400 font-bold">{coop.stats?.totalMembers || 0} ({percent}%)</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
                      <div className={`h-full rounded-full ${color}`} style={{ width: `${percent}%` }}></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Recent Cooperatives Grid table */}
      <div className="p-6 rounded-3xl glass-panel space-y-4">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Registered Cooperatives Portfolio</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-900 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Cooperative Institution</th>
                <th className="py-3 px-4">Admin settings</th>
                <th className="py-3 px-4">Currency</th>
                <th className="py-3 px-4">Total Members</th>
                <th className="py-3 px-4">Collections</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900">
              {coopsLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">Fetching cooperative registers...</td>
                </tr>
              ) : coops.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">No registered cooperatives found.</td>
                </tr>
              ) : (
                coops.map((coop) => (
                  <tr key={coop.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-200 flex items-center gap-2.5">
                      <img src={coop.logoUrl} alt={coop.name} className="w-7 h-7 rounded-lg object-cover border border-white/10" />
                      <div>
                        <p>{coop.name}</p>
                        <span className="text-[9px] text-slate-500 uppercase tracking-wider block font-sans">ID: {coop.id}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      Auto Debit: {coop.settings?.autoDebitEnabled ? 'ON' : 'OFF'}<br />
                      Grace: {coop.settings?.gracePeriodDays} Days
                    </td>
                    <td className="py-3.5 px-4 text-indigo-400 font-bold font-mono">{coop.settings?.currency}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-300 font-mono">{coop.stats?.totalMembers}</td>
                    <td className="py-3.5 px-4 font-bold text-emerald-400 font-mono">
                      {coop.settings?.currency} {coop.stats?.totalRevenue?.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                        coop.status === 'active' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {coop.status}
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
