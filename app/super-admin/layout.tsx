'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import SystemControlPanel from '@/components/system-control-panel';

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'super_admin')) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
        <svg className="animate-spin h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">Loading Admin Space...</span>
      </div>
    );
  }

  if (!user || user.role !== 'super_admin') {
    return null; // Prevents flashing while routing redirect occurs
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row relative">
      {/* Side Navigation Bar */}
      <aside className="w-full md:w-64 glass-panel border-r border-slate-900 flex flex-col justify-between p-6">
        <div className="space-y-8">
          {/* Logo Branding */}
          <div className="flex items-center gap-2 pb-6 border-b border-slate-900">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center font-black text-white text-base">
              D
            </div>
            <div>
              <h2 className="font-black text-slate-100 text-sm">DCCMS</h2>
              <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">Super Admin</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5">
            <a 
              href="/super-admin/dashboard"
              className="px-4 py-2.5 rounded-xl hover:bg-white/5 text-slate-300 hover:text-slate-100 text-xs font-semibold flex items-center gap-2.5 transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z" />
              </svg>
              Global Analytics
            </a>
            <a 
              href="/super-admin/cooperatives"
              className="px-4 py-2.5 rounded-xl hover:bg-white/5 text-slate-300 hover:text-slate-100 text-xs font-semibold flex items-center gap-2.5 transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h18" />
              </svg>
              Cooperatives
            </a>
            <a 
              href="/super-admin/admins"
              className="px-4 py-2.5 rounded-xl hover:bg-white/5 text-slate-300 hover:text-slate-100 text-xs font-semibold flex items-center gap-2.5 transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
              </svg>
              Admin Approvals
            </a>
            <a 
              href="/super-admin/disputes"
              className="px-4 py-2.5 rounded-xl hover:bg-white/5 text-slate-300 hover:text-slate-100 text-xs font-semibold flex items-center gap-2.5 transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286Zm0 13.036h.008v.008H12v-.008Z" />
              </svg>
              Dispute Resolution
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

      {/* Floating System Control Helper Panel */}
      <SystemControlPanel />
    </div>
  );
}
