'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { useDocument } from '@/hooks/use-firestore';
import { Cooperative } from '@/types';
import SystemControlPanel from '@/components/system-control-panel';

export default function TreasurerLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  // Load Treasurer's Cooperative
  const { data: coop, loading: coopLoading } = useDocument<Cooperative>('cooperatives', user?.coopId || '');

  useEffect(() => {
    if (!loading && (!user || user.role !== 'treasurer')) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || (user && !user.coopId && coopLoading)) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
        <svg className="animate-spin h-8 w-8 text-amber-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">Loading Treasurer space...</span>
      </div>
    );
  }

  if (!user || user.role !== 'treasurer') {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row relative">
      {/* Side Navigation */}
      <aside className="w-full md:w-64 glass-panel border-r border-slate-900 flex flex-col justify-between p-6">
        <div className="space-y-8">
          
          {/* Logo / Cooperative Brand details */}
          <div className="flex items-center gap-2.5 pb-6 border-b border-slate-900">
            <img 
              src={coop?.logoUrl || 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=120&h=120&q=80'} 
              alt={coop?.name || 'Cooperative Logo'} 
              className="w-9 h-9 rounded-xl object-cover border border-white/10"
            />
            <div className="truncate max-w-[130px]">
              <h2 className="font-black text-slate-100 text-xs truncate">{coop?.name || 'Lagos Agri-Coop'}</h2>
              <span className="text-[9px] text-amber-400 font-bold uppercase tracking-widest">Treasurer</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5">
            <a 
              href="/treasurer/dashboard"
              className="px-4 py-2.5 rounded-xl hover:bg-white/5 text-slate-300 hover:text-slate-100 text-xs font-semibold flex items-center gap-2.5 transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z" />
              </svg>
              Treasury Overview
            </a>
            <a 
              href="/treasurer/payments"
              className="px-4 py-2.5 rounded-xl hover:bg-white/5 text-slate-300 hover:text-slate-100 text-xs font-semibold flex items-center gap-2.5 transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-1.971-.659-1.171-.88-1.171-2.303 0-3.182 1.171-.879 3.07-.879 4.242 0 .879.66 1.45 1.547 1.45 2.651M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18Z" />
              </svg>
              Payments & Auditing
            </a>
            <a 
              href="/treasurer/withdrawals"
              className="px-4 py-2.5 rounded-xl hover:bg-white/5 text-slate-300 hover:text-slate-100 text-xs font-semibold flex items-center gap-2.5 transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 7.5h-.75A2.25 2.25 0 0 0 4.5 9.75v7.5a2.25 2.25 0 0 0 2.25 2.25h7.5a2.25 2.25 0 0 0 2.25-2.25v-.75m-6 3h-1.5m6.5-12.75H19.5m0 0v5.25m0-5.25L13.5 12" />
              </svg>
              Withdrawals Approvals
            </a>
          </nav>
        </div>

        {/* Footer profile info & Logout */}
        <div className="space-y-4 pt-6 border-t border-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-xs font-black text-slate-300">
              {user.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="truncate max-w-[130px]">
              <p className="text-xs font-bold text-slate-200">{user.name}</p>
              <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="w-full py-2 rounded-xl bg-slate-950 border border-slate-900 hover:bg-rose-500/10 hover:border-rose-500/20 text-slate-400 hover:text-rose-400 text-xs font-bold transition-all"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Panel Content Area */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto max-h-screen">
        {children}
      </main>

      <SystemControlPanel />
    </div>
  );
}
