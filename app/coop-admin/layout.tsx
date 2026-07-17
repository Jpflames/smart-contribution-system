'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { useDocument } from '@/hooks/use-firestore';
import { Cooperative } from '@/types';

export default function CoopAdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  // Load Admin's Cooperative
  const { data: coop, loading: coopLoading } = useDocument<Cooperative>('cooperatives', user?.coopId || '');

  useEffect(() => {
    if (!loading && (!user || user.role !== 'coop_admin')) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || (user && !user.coopId && coopLoading)) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
        <svg className="animate-spin h-8 w-8 text-emerald-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">Loading Manager Portal...</span>
      </div>
    );
  }

  if (!user || user.role !== 'coop_admin') {
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
              <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-widest">Coop Admin</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5">
            <a 
              href="/coop-admin/dashboard"
              className="px-4 py-2.5 rounded-xl hover:bg-white/5 text-slate-300 hover:text-slate-100 text-xs font-semibold flex items-center gap-2.5 transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z" />
              </svg>
              Dashboard
            </a>
            <a 
              href="/coop-admin/members"
              className="px-4 py-2.5 rounded-xl hover:bg-white/5 text-slate-300 hover:text-slate-100 text-xs font-semibold flex items-center gap-2.5 transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.109A2.25 2.25 0 0 1 12.75 21.5h-1.5a2.25 2.25 0 0 1-2.25-2.263V19.13m4.13-3.07c-.6-.468-1.29-.757-2.043-.812m10.155-.83a3 3 0 1 0-4.697-3.69 4.803 4.803 0 0 1 2.224 2.224L21 14.13M17.5 15V12M15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm-3 5.375c-.328 0-.651-.013-.97-.039a4.877 4.877 0 0 0-4.053 4.053V21H15v-1.664a4.877 4.877 0 0 0-4.053-4.053c-.32-.026-.642-.038-.97-.038Z" />
              </svg>
              Members Register
            </a>
            <a 
              href="/coop-admin/plans"
              className="px-4 py-2.5 rounded-xl hover:bg-white/5 text-slate-300 hover:text-slate-100 text-xs font-semibold flex items-center gap-2.5 transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
              </svg>
              Contribution Plans
            </a>
            <a 
              href="/coop-admin/reports"
              className="px-4 py-2.5 rounded-xl hover:bg-white/5 text-slate-300 hover:text-slate-100 text-xs font-semibold flex items-center gap-2.5 transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
              </svg>
              Audit Reports
            </a>
            <a 
              href="/coop-admin/settings"
              className="px-4 py-2.5 rounded-xl hover:bg-white/5 text-slate-300 hover:text-slate-100 text-xs font-semibold flex items-center gap-2.5 transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 1 1 0-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.357.205a1.125 1.125 0 0 1-1.4-.205l-1.91-1.91a1.125 1.125 0 0 1 0-1.59l1.91-1.91a1.125 1.125 0 0 1 1.4-.205l.357.205c.522.3.71.96.463 1.511-.401.89-.732 1.82-.985 2.783Zm0-9.18c.253-.962.584-1.892.985-2.783a1.125 1.125 0 0 1 1.37-.582l.357.205a1.125 1.125 0 0 1 .581 1.37l-.205.357a1.125 1.125 0 0 1-1.37.581l-.357-.205a1.125 1.125 0 0 1-.581-1.37Zm0 0c-.307-.842-.686-1.637-1.125-2.383" />
              </svg>
              Rules Settings
            </a>
          </nav>
        </div>

        {/* Footer Admin details */}
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

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto max-h-screen">
        {children}
      </main>
    </div>
  );
}
