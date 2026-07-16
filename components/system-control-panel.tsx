'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { UserRole } from '@/types';

export default function SystemControlPanel() {
  const { user, simulateRoleChange, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [cronRunning, setCronRunning] = useState(false);
  const [cronResult, setCronResult] = useState<string | null>(null);

  // Load testing notification logs
  const loadNotifications = () => {
    if (typeof window === 'undefined') return;
    const log = localStorage.getItem('coopsync_notifications_log');
    setNotifications(log ? JSON.parse(log) : []);
  };

  useEffect(() => {
    loadNotifications();
    window.addEventListener('coopsync_notifications_changed', loadNotifications);
    return () => window.removeEventListener('coopsync_notifications_changed', loadNotifications);
  }, []);

  const handleRoleSwitch = (role: UserRole) => {
    simulateRoleChange(role);
    setIsOpen(false);
    // Force reload dashboard
    window.location.reload();
  };

  const handleTriggerCron = async () => {
    setCronRunning(true);
    setCronResult(null);
    try {
      const response = await fetch('/api/cron/auto-debit', { method: 'POST' });
      const data = await response.json();
      setCronResult(data.message || 'Auto-debit scheduler executed successfully.');
      loadNotifications();
    } catch (err: any) {
      setCronResult(`Auto-debit check failed: ${err.message}`);
    } finally {
      setCronRunning(false);
    }
  };

  const handleResetData = () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('coopsync_seeded');
    localStorage.removeItem('coopsync_session');
    localStorage.removeItem('coopsync_notifications_log');
    // Clear all collections
    const collections = ['users', 'cooperatives', 'plans', 'paymentTokens', 'payments', 'wallets', 'withdrawalRequests', 'loans', 'auditLogs', 'notifications'];
    collections.forEach(col => localStorage.removeItem(`coopsync_db_${col}`));
    
    alert('Local offline database re-seeded with initial values.');
    logout();
    window.location.href = '/';
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full btn-primary-gradient flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 hover:scale-105 duration-200"
        title="System Control Panel"
      >
        {isOpen ? (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 animate-spin-slow">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.43l-1.003.828c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.43l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          </svg>
        )}
      </button>

      {/* Expanded Control Box */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-80 md:w-96 max-h-[85vh] overflow-y-auto glass-panel rounded-3xl p-6 shadow-2xl border border-white/10 flex flex-col gap-6 animate-in slide-in-from-bottom-5 duration-200">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-400">System Control Panel</h2>
            <p className="text-[11px] text-slate-400">Audit and control financial operations, routing checks, and billing logs.</p>
          </div>

          {/* Quick Role switcher */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wide">Quick Switch Roles</h3>
            <div className="grid grid-cols-2 gap-1.5">
              <button 
                onClick={() => handleRoleSwitch('super_admin')}
                className="p-2 rounded-xl text-left bg-slate-950/60 hover:bg-indigo-600/20 text-xs font-medium border border-white/5 hover:border-indigo-500/40 text-slate-300 transition-all"
              >
                Super Admin
              </button>
              <button 
                onClick={() => handleRoleSwitch('coop_admin')}
                className="p-2 rounded-xl text-left bg-slate-950/60 hover:bg-emerald-600/20 text-xs font-medium border border-white/5 hover:border-emerald-500/40 text-slate-300 transition-all"
              >
                Coop Admin
              </button>
              <button 
                onClick={() => handleRoleSwitch('treasurer')}
                className="p-2 rounded-xl text-left bg-slate-950/60 hover:bg-amber-600/20 text-xs font-medium border border-white/5 hover:border-amber-500/40 text-slate-300 transition-all"
              >
                Treasurer
              </button>
              <button 
                onClick={() => handleRoleSwitch('member')}
                className="p-2 rounded-xl text-left bg-slate-950/60 hover:bg-violet-600/20 text-xs font-medium border border-white/5 hover:border-violet-500/40 text-slate-300 transition-all"
              >
                Member (John Doe)
              </button>
            </div>
            <p className="text-[10px] text-slate-500 italic">Active Role: {user ? `${user.name} (${user.role})` : 'Guest'}</p>
          </div>

          {/* Cron Trigger */}
          <div className="space-y-2 pb-2 border-b border-slate-800">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wide">Recurring Billing Engine</h3>
            <button 
              onClick={handleTriggerCron}
              disabled={cronRunning}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 text-xs font-bold text-white flex items-center justify-center gap-2 tracking-wide shadow-md transition-all"
            >
              {cronRunning ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing Auto-Debit Run...
                </>
              ) : (
                'Trigger Automated Card Debit Run'
              )}
            </button>
            {cronResult && (
              <div className="p-2.5 rounded-lg bg-slate-950/80 text-[10px] text-indigo-300 border border-indigo-500/10 font-mono leading-relaxed max-h-24 overflow-y-auto">
                {cronResult}
              </div>
            )}
          </div>

          {/* Outbound Messaging Outbox Log */}
          <div className="space-y-2 flex-1">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wide">SMS & Email Dispatch Queue</h3>
              <span className="text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 px-1.5 py-0.5 rounded font-mono font-bold">
                {notifications.length} Sent
              </span>
            </div>
            
            {notifications.length === 0 ? (
              <div className="h-32 rounded-xl bg-slate-950/40 border border-white/5 flex flex-col items-center justify-center text-slate-600">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 mb-1 opacity-40">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                </svg>
                <span className="text-[10px]">No notifications generated yet</span>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {notifications.slice(0, 8).map((notif) => (
                  <div key={notif.id} className="p-2.5 rounded-lg bg-slate-950/40 border border-white/5 space-y-1">
                    <div className="flex justify-between items-center text-[8px]">
                      <span className={`px-1.5 py-0.5 rounded uppercase font-bold tracking-wider text-[8px] ${
                        notif.type === 'sms' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : notif.type === 'email'
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          : 'bg-violet-500/10 text-violet-400 border border-violet-500/20'
                      }`}>
                        {notif.type}
                      </span>
                      <span className="text-slate-500 font-mono">
                        {new Date(notif.sentAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-[9px] font-semibold text-slate-300 leading-tight">
                      {notif.title}
                    </p>
                    <p className="text-[9px] text-slate-400 leading-normal">
                      {notif.message}
                    </p>
                    <span className="text-[7px] text-slate-600 font-mono block">
                      To: {notif.recipient}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Reset database */}
          <div className="pt-2 border-t border-slate-800">
            <button 
              onClick={handleResetData}
              className="w-full py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/20 text-rose-400 font-bold text-xs uppercase tracking-wider transition-all"
            >
              Reset Local Storage Database
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
