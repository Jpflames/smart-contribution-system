'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useDocument, useCollection, updateDocument, addDocument } from '@/hooks/use-firestore';
import { Cooperative, PaymentToken } from '@/types';

export default function MemberProfilePage() {
  const { user, logout } = useAuth();
  
  // Queries
  const { data: coop } = useDocument<Cooperative>('cooperatives', user?.coopId || '');
  const { data: token } = useDocument<PaymentToken>('paymentTokens', `${user?.uid}_${user?.coopId}`);

  const [requestingExit, setRequestingExit] = useState(false);

  const handleRequestExit = async () => {
    if (!user) return;
    const confirm = window.confirm('Are you absolutely sure you want to request exit from this cooperative? This will halt all auto-debits and send a review request to the administrators.');
    if (!confirm) return;

    setRequestingExit(true);
    try {
      // Update member status to pending exit
      await updateDocument('users', user.uid, { status: 'suspended' });

      // Audit Log
      await addDocument('auditLogs', {
        userId: user.uid,
        userEmail: user.email,
        action: 'Request Exit',
        details: 'Submitted request to exit cooperative.'
      });

      alert('Exit request submitted. Your account is temporarily locked/suspended pending admin review.');
      logout();
    } catch (err) {
      console.error(err);
      setRequestingExit(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-100 tracking-tight">Personal Profile & KYC</h1>
        <p className="text-xs text-slate-400">Review KYC identity credentials, connected debit cards, and membership status.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Profile Card & KYC details */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="p-6 rounded-3xl glass-panel space-y-4">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">KYC Identity Card</h3>
            
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[9px] uppercase tracking-wider text-slate-500 block">Full Name</span>
                <span className="font-bold text-slate-300">{user?.name}</span>
              </div>
              <div>
                <span className="text-[9px] uppercase tracking-wider text-slate-500 block">Primary Email</span>
                <span className="font-bold text-slate-300">{user?.email}</span>
              </div>
              <div>
                <span className="text-[9px] uppercase tracking-wider text-slate-500 block">Phone Number</span>
                <span className="font-bold text-slate-300">{user?.phone}</span>
              </div>
              <div>
                <span className="text-[9px] uppercase tracking-wider text-slate-500 block">Occupation</span>
                <span className="font-bold text-slate-300">{user?.kycDetails?.occupation || 'Software Engineer'}</span>
              </div>
              <div className="col-span-2">
                <span className="text-[9px] uppercase tracking-wider text-slate-500 block">Residential Address</span>
                <span className="font-bold text-slate-300 leading-normal block">
                  {user?.kycDetails?.residentialAddress || '15 Herbert Macaulay Way, Yaba, Lagos'}
                </span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-3xl glass-panel space-y-4">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Settlement Bank Coordinates</h3>
            
            <div className="grid grid-cols-3 gap-4 text-xs font-mono">
              <div>
                <span className="text-[9px] uppercase tracking-wider text-slate-500 block font-sans">Bank Name</span>
                <span className="font-bold text-slate-300">{user?.bankDetails?.bankName || 'Access Bank'}</span>
              </div>
              <div>
                <span className="text-[9px] uppercase tracking-wider text-slate-500 block font-sans">Account Number</span>
                <span className="font-bold text-slate-300">{user?.bankDetails?.accountNumber || '0123456789'}</span>
              </div>
              <div>
                <span className="text-[9px] uppercase tracking-wider text-slate-500 block font-sans">Account Name</span>
                <span className="font-bold text-slate-300 truncate block">{user?.bankDetails?.accountName || user?.name}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Linked Card Tokenization Info & Exit Cooperative */}
        <div className="space-y-6">
          
          <div className="p-6 rounded-3xl glass-panel space-y-4">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Linked Recurring Card</h3>
            
            {token ? (
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-indigo-400 capitalize font-mono">{token.cardType} **** {token.last4}</span>
                  <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                    ACTIVE
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono space-y-0.5">
                  <p>Expiry: {token.expMonth}/{token.expYear}</p>
                  <p className="truncate">Auth Code: {token.authorizationCode.substring(0, 15)}...</p>
                  <p className="truncate">Cust Code: {token.customerCode}</p>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-950/40 border border-white/5 text-center text-slate-500 text-xs">
                No tokenized payment cards linked.
              </div>
            )}
          </div>

          <div className="p-6 rounded-3xl glass-panel space-y-4 border border-rose-500/10">
            <h3 className="text-xs font-bold text-rose-400 uppercase tracking-wider">Exit Cooperative</h3>
            <p className="text-[10px] text-slate-500 leading-normal">
              Exit requests will stop automated billing and flag your profile for administrative clearance reviews.
            </p>
            <button 
              onClick={handleRequestExit}
              disabled={requestingExit}
              className="w-full py-2.5 rounded-xl bg-rose-600/10 hover:bg-rose-600 border border-rose-500/25 hover:text-white text-rose-400 font-bold text-xs tracking-wider uppercase transition-all"
            >
              {requestingExit ? 'Processing Exit...' : 'Request Cooperative Exit'}
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
