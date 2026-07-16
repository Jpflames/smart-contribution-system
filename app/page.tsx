'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 grid-bg relative flex flex-col justify-between overflow-hidden">
      {/* Background radial gradient highlights */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none animate-pulse-slow"></div>
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none animate-pulse-slow"></div>

      {/* HEADER NAVBAR */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-black text-white shadow-lg text-lg">
            C
          </div>
          <span className="text-xl font-black bg-gradient-to-r from-slate-50 to-indigo-200 bg-clip-text text-transparent">
            DCCMS
          </span>
        </div>

        <nav className="flex items-center gap-4">
          {user ? (
            <Link 
              href={`/${user.role.replace('_', '-')}/dashboard`}
              className="px-5 py-2.5 rounded-xl btn-primary-gradient text-sm font-bold text-white shadow-md hover:scale-102 duration-200"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link 
                href="/login" 
                className="px-5 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 font-semibold text-sm transition-all"
              >
                Log In
              </Link>
              <Link 
                href="/register" 
                className="px-5 py-2.5 rounded-xl btn-primary-gradient text-sm font-bold text-white shadow-md hover:scale-102 duration-200"
              >
                Join Cooperative
              </Link>
            </>
          )}
        </nav>
      </header>

      {/* HERO SECTION */}
      <main className="w-full max-w-7xl mx-auto px-6 py-12 md:py-24 grid md:grid-cols-2 gap-12 items-center z-10 flex-1">
        <div className="space-y-8 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-400">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping"></span>
            Automating Cooperative Collections
          </div>

          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-none text-slate-100">
            Smart Savings.<br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Zero Default.
            </span>
          </h1>

          <p className="text-base md:text-lg text-slate-400 leading-relaxed max-w-xl mx-auto md:mx-0">
            DCCMS combines tokenized recurring card debits, grace periods, automated penalty ledgers, and AI-driven risk scoring to streamline financial contributions and eliminate delinquencies.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
            <Link 
              href="/register"
              className="px-8 py-4 rounded-xl btn-primary-gradient font-bold text-white shadow-lg text-center shadow-indigo-500/20 hover:translate-y-[-2px] duration-200"
            >
              Get Started (Register)
            </Link>
            <Link 
              href="/login"
              className="px-8 py-4 rounded-xl btn-secondary-gradient font-bold text-slate-200 text-center hover:bg-white/10 duration-200"
            >
              Access Portal
            </Link>
          </div>


        </div>

        {/* FEATURE SHIELD CARDS */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-6 rounded-3xl glass-panel glow-card space-y-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0V10.5m-3.25 3h15.5A2.25 2.25 0 0 1 21 15.75v5.25a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 21v-5.25a2.25 2.25 0 0 1 2.25-2.25Z" />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-slate-200">Tokenized Billing</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Securely store reusable payment authorizations. Charge contributions directly on schedule via Paystack.
            </p>
          </div>

          <div className="p-6 rounded-3xl glass-panel glow-card space-y-4 translate-y-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 21l8.982-11.861H13.65l.772-5.903L5.438 15.116h4.375Z" />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-slate-200">Delinquency Guard</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Detect late payments, auto-assess flat or compound penalties, and restrict defaulters automatically.
            </p>
          </div>

          <div className="p-6 rounded-3xl glass-panel glow-card space-y-4">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-slate-200">Financial Reports</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Keep treasurers and members aligned. Generate receipts and download detailed balance sheets instantly.
            </p>
          </div>

          <div className="p-6 rounded-3xl glass-panel glow-card space-y-4 translate-y-6">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 0 0 .495-7.468 5.99 5.99 0 0 0-1.925 3.547 5.975 5.975 0 0 1-2.133-1.001A3.75 3.75 0 0 0 12 18Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 0 1 5.656 0M9 10h.008v.008H9V10Zm3 0h.008v.008H12V10Zm3 0h.008v.008H15V10Z" />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-slate-200">AI Risk Profiling</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Calculate loan eligibility and default risk in real time based on contribution consistency and wallet health.
            </p>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-6 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500 z-10">
        <p>© {new Date().getFullYear()} DCCMS. All rights reserved.</p>
        <p>Built with Next.js 16 App Router, Firebase and Paystack Gateway.</p>
      </footer>
    </div>
  );
}
