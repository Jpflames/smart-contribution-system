'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const userProfile = await login(email, password);
      // Route based on role
      const roleRoute = userProfile.role.replace('_', '-');
      router.push(`/${roleRoute}/dashboard`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 grid-bg flex items-center justify-center p-6 relative">
      {/* Background glow highlights */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-violet-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md glass-panel rounded-3xl p-8 shadow-2xl border border-white/10 relative z-10 space-y-6">
        
        {/* Header branding */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 justify-center">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center font-black text-white shadow-lg text-sm">
              D
            </div>
            <span className="text-lg font-black text-slate-100">DCCMS</span>
          </Link>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-100">Welcome back</h2>
          <p className="text-xs text-slate-400">Log in to manage contributions and authorize payments</p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-xs text-rose-400 font-medium leading-relaxed">
            {error}
          </div>
        )}

        {/* Input Form */}
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

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400" htmlFor="password">
                Password
              </label>
              <Link href="/forgot-password" className="text-[11px] text-indigo-400 hover:underline">
                Forgot password?
              </Link>
            </div>
            <input 
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-200 text-sm placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all font-medium"
              required
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl btn-primary-gradient font-bold text-white text-sm shadow-md hover:scale-[1.01] transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Verifying Credentials...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>



        <div className="text-center text-xs text-slate-500 pt-2">
          Don't have an account?{' '}
          <Link href="/register" className="text-indigo-400 font-bold hover:underline">
            Register Here
          </Link>
        </div>

      </div>
    </div>
  );
}
