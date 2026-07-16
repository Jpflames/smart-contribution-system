'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setTimeout(() => {
      setMessage(`A password reset link has been dispatched to ${email}. (Simulated)`);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-950 grid-bg flex items-center justify-center p-6 relative">
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md glass-panel rounded-3xl p-8 shadow-2xl border border-white/10 relative z-10 space-y-6">
        
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 justify-center">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center font-black text-white shadow-lg text-sm">
              C
            </div>
            <span className="text-lg font-black text-slate-100">CoopSync</span>
          </Link>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-100">Reset password</h2>
          <p className="text-xs text-slate-400">Enter your email to receive recovery instructions</p>
        </div>

        {message ? (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-400 font-medium leading-relaxed">
              {message}
            </div>
            <Link 
              href="/login"
              className="w-full py-3 rounded-xl btn-primary-gradient font-bold text-white text-xs tracking-wider uppercase text-center block"
            >
              Back to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400" htmlFor="email">
                Email Address
              </label>
              <input 
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. member1@coopsync.com"
                className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-200 text-sm placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all font-medium"
                required
              />
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl btn-primary-gradient font-bold text-white text-sm shadow-md hover:scale-[1.01] transition-all flex items-center justify-center gap-2"
            >
              {loading ? 'Dispatched Request...' : 'Send Reset Instructions'}
            </button>
          </form>
        )}

        <div className="text-center text-xs text-slate-500 pt-2">
          Remember credentials?{' '}
          <Link href="/login" className="text-indigo-400 font-bold hover:underline">
            Log In
          </Link>
        </div>

      </div>
    </div>
  );
}
