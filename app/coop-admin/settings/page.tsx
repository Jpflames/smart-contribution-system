'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { useDocument, updateDocument } from '@/hooks/use-firestore';
import { Cooperative } from '@/types';

export default function CooperativeSettingsPage() {
  const { user } = useAuth();
  const { data: coop, loading } = useDocument<Cooperative>('cooperatives', user?.coopId || '');

  // Form State
  const [currency, setCurrency] = useState('NGN');
  const [autoDebitEnabled, setAutoDebitEnabled] = useState(true);
  const [retryIntervalDays, setRetryIntervalDays] = useState(1);
  const [penaltyFlatFee, setPenaltyFlatFee] = useState(2000);
  const [penaltyPercentage, setPenaltyPercentage] = useState(5);
  const [penaltyType, setPenaltyType] = useState<'flat' | 'percentage' | 'compound'>('flat');
  const [gracePeriodDays, setGracePeriodDays] = useState(3);
  
  // Branding
  const [brandColor, setBrandColor] = useState('#0f766e');
  const [headerText, setHeaderText] = useState('LAGOS AGRI-COOP UNION RECEIPT');

  // Key configurations
  const [paystackPubKey, setPaystackPubKey] = useState('pk_test_demo123456');
  const [paystackSecKey, setPaystackSecKey] = useState('sk_test_demo123456');

  // Load active coop values when available
  useEffect(() => {
    if (coop) {
      setCurrency(coop.settings?.currency || 'NGN');
      setAutoDebitEnabled(coop.settings?.autoDebitEnabled ?? true);
      setRetryIntervalDays(coop.settings?.retryIntervalDays || 1);
      setPenaltyFlatFee(coop.settings?.penaltyFlatFee || 2000);
      setPenaltyPercentage(coop.settings?.penaltyPercentage || 5);
      setPenaltyType(coop.settings?.penaltyType || 'flat');
      setGracePeriodDays(coop.settings?.gracePeriodDays ?? 3);
      setBrandColor(coop.settings?.receiptBranding?.color || '#0f766e');
      setHeaderText(coop.settings?.receiptBranding?.headerText || `${coop.name.toUpperCase()} RECEIPT`);
    }
  }, [coop]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coop) return;

    try {
      const updatedSettings = {
        ...coop.settings,
        currency,
        autoDebitEnabled,
        retryIntervalDays,
        penaltyFlatFee,
        penaltyPercentage,
        penaltyType,
        gracePeriodDays,
        receiptBranding: {
          color: brandColor,
          headerText
        }
      };

      await updateDocument('cooperatives', coop.id, { settings: updatedSettings });
      alert('Cooperative configurations saved successfully.');
    } catch (err) {
      console.error(err);
      alert('Failed to save settings.');
    }
  };

  if (loading) {
    return <div className="py-8 text-center text-slate-500 text-xs">Querying configuration files...</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-100 tracking-tight">Cooperative Configuration Rules</h1>
        <p className="text-xs text-slate-400">Establish automated retry scopes, penalty ratios, PDF receipt branding, and payment keys.</p>
      </div>

      <form onSubmit={handleSaveSettings} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Core Billing Rules (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="p-6 rounded-3xl glass-panel space-y-4">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Automated Billing Rules</h3>
            
            <div className="flex items-center gap-2 pb-4 border-b border-slate-900">
              <input 
                type="checkbox" 
                id="coop-autodebit" 
                checked={autoDebitEnabled}
                onChange={(e) => setAutoDebitEnabled(e.target.checked)}
                className="rounded bg-slate-950 border-slate-800 text-emerald-600 focus:ring-emerald-500/30"
              />
              <label htmlFor="coop-autodebit" className="text-xs text-slate-300 font-bold">
                Authorize global background card charges (Paystack API)
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Operation Currency</label>
                <select 
                  value={currency} 
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500/50 transition-all font-medium"
                >
                  <option value="NGN">NGN (₦)</option>
                  <option value="USD">USD ($)</option>
                  <option value="KES">KES (KSh)</option>
                  <option value="GHS">GHS (GH₵)</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Grace period duration</label>
                <input 
                  type="number" 
                  value={gracePeriodDays} 
                  onChange={(e) => setGracePeriodDays(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500/50 transition-all font-medium font-mono"
                  min={0}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Billing Fail Retry Span (Days)</label>
                <input 
                  type="number" 
                  value={retryIntervalDays} 
                  onChange={(e) => setRetryIntervalDays(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500/50 transition-all font-medium font-mono"
                  min={1}
                  required
                />
                <span className="text-[9px] text-slate-500 block">Interval to retry charges (Attempts: 24h, 72h, Final Overdue)</span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-3xl glass-panel space-y-4">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider text-rose-400">Arrears & Penalty ledgers</h3>
            
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Penalty Type</label>
                <select 
                  value={penaltyType}
                  onChange={(e: any) => setPenaltyType(e.target.value)}
                  className="w-full px-2 py-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500/50 transition-all font-medium"
                >
                  <option value="flat">Flat Fee</option>
                  <option value="percentage">Percentage Rate</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Flat Fee Amount</label>
                <input 
                  type="number" 
                  value={penaltyFlatFee} 
                  onChange={(e) => setPenaltyFlatFee(Number(e.target.value))}
                  disabled={penaltyType !== 'flat'}
                  className="w-full px-2 py-2.5 rounded-lg bg-slate-950/60 border border-slate-800 disabled:opacity-40 text-slate-200 text-xs focus:outline-none focus:border-indigo-500/50 transition-all font-medium font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Percentage Rate (%)</label>
                <input 
                  type="number" 
                  value={penaltyPercentage} 
                  onChange={(e) => setPenaltyPercentage(Number(e.target.value))}
                  disabled={penaltyType !== 'percentage'}
                  className="w-full px-2 py-2.5 rounded-lg bg-slate-950/60 border border-slate-800 disabled:opacity-40 text-slate-200 text-xs focus:outline-none focus:border-indigo-500/50 transition-all font-medium font-mono"
                />
              </div>
            </div>
          </div>

          <div className="p-6 rounded-3xl glass-panel space-y-4">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Paystack Merchant Keys</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Sandbox Public Key</label>
                <input 
                  type="text" 
                  value={paystackPubKey}
                  onChange={(e) => setPaystackPubKey(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500/50 transition-all font-medium font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Sandbox Secret Key</label>
                <input 
                  type="password" 
                  value={paystackSecKey}
                  onChange={(e) => setPaystackSecKey(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500/50 transition-all font-medium font-mono"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Branding Preview (1/3 width) */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl glass-panel space-y-4">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Receipt Template Customize</h3>
            
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Header Invoice text</label>
              <input 
                type="text" 
                value={headerText} 
                onChange={(e) => setHeaderText(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500/50 transition-all font-medium"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Receipt Primary Color Accent</label>
              <div className="flex gap-2">
                <input 
                  type="color" 
                  value={brandColor} 
                  onChange={(e) => setBrandColor(e.target.value)}
                  className="w-10 h-10 rounded border-0 bg-transparent cursor-pointer"
                />
                <input 
                  type="text" 
                  value={brandColor} 
                  onChange={(e) => setBrandColor(e.target.value)}
                  className="flex-1 px-3 py-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500/50 transition-all font-medium font-mono"
                  required
                />
              </div>
            </div>

            {/* Receipt Preview box */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/5 space-y-3">
              <span className="text-[8px] uppercase tracking-wider text-slate-500 font-bold block">Live Branding Preview</span>
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between text-[10px]">
                <div>
                  <span className="text-[7px] uppercase block text-slate-500">Header brand</span>
                  <span className="font-bold tracking-tight block truncate max-w-[150px]" style={{ color: brandColor }}>
                    {headerText}
                  </span>
                </div>
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: brandColor }}></div>
              </div>
            </div>
          </div>

          <button 
            type="submit"
            className="w-full py-4 rounded-2xl btn-primary-gradient font-bold text-white text-xs tracking-wider uppercase transition-all shadow-lg"
          >
            Save Cooperative Rules
          </button>
        </div>

      </form>

    </div>
  );
}
