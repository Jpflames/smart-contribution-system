'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { useDocument } from '@/hooks/use-firestore';
import { Cooperative } from '@/types';
import SystemControlPanel from '@/components/system-control-panel';

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  // Load Member's Cooperative
  const { data: coop, loading: coopLoading } = useDocument<Cooperative>('cooperatives', user?.coopId || '');

  useEffect(() => {
    if (!loading && (!user || user.role !== 'member')) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || (user && user.coopId && coopLoading)) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
        <svg className="animate-spin h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">Loading Member Portal...</span>
      </div>
    );
  }

  if (!user || user.role !== 'member') {
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
              <h2 className="font-black text-slate-100 text-xs truncate">{coop?.name || 'Global Savings'}</h2>
              <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-widest">Member Portal</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5">
            <a 
              href="/member/dashboard"
              className="px-4 py-2.5 rounded-xl hover:bg-white/5 text-slate-300 hover:text-slate-100 text-xs font-semibold flex items-center gap-2.5 transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
              My Dashboard
            </a>
            <a 
              href="/member/contributions"
              className="px-4 py-2.5 rounded-xl hover:bg-white/5 text-slate-300 hover:text-slate-100 text-xs font-semibold flex items-center gap-2.5 transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
              </svg>
              Contributions & Receipts
            </a>
            <a 
              href="/member/wallet"
              className="px-4 py-2.5 rounded-xl hover:bg-white/5 text-slate-300 hover:text-slate-100 text-xs font-semibold flex items-center gap-2.5 transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 0V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v3" />
              </svg>
              My Savings Wallet
            </a>
            <a 
              href="/member/loan"
              className="px-4 py-2.5 rounded-xl hover:bg-white/5 text-slate-300 hover:text-slate-100 text-xs font-semibold flex items-center gap-2.5 transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25M16.5 7.5V18a2.25 2.25 0 0 0 2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 0 0 2.25 2.25h13.5M6 7.5h3v3H6v-3Z" />
              </svg>
              Loan Eligibility & Apply
            </a>
            <a 
              href="/member/profile"
              className="px-4 py-2.5 rounded-xl hover:bg-white/5 text-slate-300 hover:text-slate-100 text-xs font-semibold flex items-center gap-2.5 transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
              My Profile & Exit
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
