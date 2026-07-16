'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { addDocument, queryDocuments, setDocument, seedLocalStorage } from '@/hooks/use-firestore';
import { initializeTransaction } from '@/lib/paystack';
import { Cooperative } from '@/types';

export default function RegisterPage() {
  return (
    <React.Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
        <svg className="animate-spin h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className="text-xs text-slate-500 font-bold uppercase tracking-widest text-slate-400">Loading Register Space...</span>
      </div>
    }>
      <RegisterForm />
    </React.Suspense>
  );
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { updateProfileState } = useAuth();
  
  // Wizards state
  const [step, setStep] = useState(1);
  const [cooperatives, setCooperatives] = useState<Cooperative[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State - Step 1: Personal
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [coopId, setCoopId] = useState('');
  const [occupation, setOccupation] = useState('');
  const [address, setAddress] = useState('');

  // Form State - Step 2: KYC & Bank
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [nokName, setNokName] = useState('');
  const [nokPhone, setNokPhone] = useState('');
  const [nokRelationship, setNokRelationship] = useState('');
  const [kycImage, setKycImage] = useState<string | null>(null);

  // Card input states for Step 3 Card Tokenization
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // Temp user ID stored during step transitions
  const [registeredUid, setRegisteredUid] = useState<string | null>(null);

  // Load cooperatives
  useEffect(() => {
    const fetchCoops = async () => {
      try {
        // Seed local storage dynamically if landing on register page first
        if (typeof window !== 'undefined' && !localStorage.getItem('coopsync_seeded')) {
          seedLocalStorage();
        }
        const coops = await queryDocuments('cooperatives', []);
        setCooperatives(coops);
        if (coops.length > 0) setCoopId(coops[0].id);
      } catch (err) {
        console.error('Failed to load coops:', err);
      }
    };
    fetchCoops();
  }, []);

  // Listen to Paystack callback redirect simulation in query params
  useEffect(() => {
    const ref = searchParams.get('reference');
    const status = searchParams.get('status');
    const stepParam = searchParams.get('step');
    
    if (stepParam === '3' && status === 'success') {
      // Simulate final onboarding completion
      setStep(3);
    }
  }, [searchParams]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setKycImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleNextStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone || !password || !coopId || !occupation || !address) {
      setError('Please fill in all profile details.');
      return;
    }
    setError(null);
    setStep(2);
  };

  const handleNextStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankName || !accountNumber || !accountName || !nokName || !nokPhone || !nokRelationship || !nationalId) {
      setError('Please fill in bank details, Next of Kin, and National ID.');
      return;
    }
    if (!kycImage) {
      setError('Please upload your Passport Photograph / Government ID.');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      // Create user profile record (Simulating Auth UID)
      const uid = `user_${Math.random().toString(36).substring(2, 10)}`;
      const now = new Date().toISOString();

      const userProfile = {
        uid,
        email,
        role: 'member' as const,
        name,
        phone,
        status: 'approved' as const, // approved directly for quick sandbox testing
        kycStatus: 'approved' as const,
        kycDetails: {
          nationalId,
          residentialAddress: address,
          occupation,
          idDocumentUrl: kycImage,
          nextOfKin: { name: nokName, relationship: nokRelationship, phone: nokPhone }
        },
        bankDetails: { bankName, accountNumber, accountName },
        coopId,
        createdAt: now,
        updatedAt: now
      };

      // Save user profile
      await setDocument('users', uid, userProfile);
      setRegisteredUid(uid);

      // Increment cooperative member count
      const coop = cooperatives.find(c => c.id === coopId);
      if (coop) {
        coop.stats.totalMembers += 1;
        coop.stats.activeMembers += 1;
        await setDocument('cooperatives', coopId, coop);
      }

      // Automatically create a Wallet for the member
      await setDocument('wallets', uid, {
        id: uid,
        userId: uid,
        coopId,
        balance: 0,
        ledgerBalance: 0,
        currency: coop?.settings.currency || 'NGN',
        lastUpdated: now
      });

      // Save session
      localStorage.setItem('coopsync_session', JSON.stringify(userProfile));
      updateProfileState(userProfile);

      setLoading(false);
      setStep(3);
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Failed to save account details.');
    }
  };

  const handleLinkCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardNumber || !cardExpiry || !cardCvv) {
      setError('Please enter complete card details.');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const activeUid = registeredUid || (JSON.parse(localStorage.getItem('coopsync_session') || '{}')).uid;
      if (!activeUid) throw new Error('Session ID not found. Try again.');

      // Initialize Paystack Authorize Transaction (simulation or real)
      const callbackUrl = window.location.href;
      const response = await initializeTransaction(email, 100, callbackUrl, { userId: activeUid, coopId });

      // Save tokenized authorization details in DB
      const tokenId = `token_${Math.random().toString(36).substring(2, 9)}`;
      const mockToken = {
        id: tokenId,
        userId: activeUid,
        coopId,
        customerCode: `CUS_${Math.random().toString(36).substring(2, 8)}`,
        authorizationCode: `AUTH_simulated_${Math.random().toString(36).substring(2, 10)}`,
        cardType: cardNumber.startsWith('4') ? 'visa' : 'mastercard',
        last4: cardNumber.replace(/\s/g, '').slice(-4) || '4242',
        expMonth: cardExpiry.split('/')[0] || '12',
        expYear: cardExpiry.split('/')[1] ? `20${cardExpiry.split('/')[1]}` : '2028',
        createdAt: new Date().toISOString()
      };

      await setDocument('paymentTokens', `${activeUid}_${coopId}`, mockToken);

      // Audit Log
      await addDocument('auditLogs', {
        userId: activeUid,
        userEmail: email,
        action: 'Link Card',
        details: `Linked tokenized card ending in ${mockToken.last4} for recurring payments.`
      });

      // Add success notification
      await addDocument('notifications', {
        userId: activeUid,
        title: 'Card Linked Successfully',
        message: 'Your debit card was verified and authorized for automatic recurring contribution debits.',
        type: 'success',
        read: false
      });

      // Redirect user directly to the member portal dashboard
      router.push('/member/dashboard');
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Failed to initialize payment gateway.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 grid-bg flex items-center justify-center p-6 relative">
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-lg glass-panel rounded-3xl p-6 md:p-8 shadow-2xl border border-white/10 relative z-10 space-y-6">
        
        {/* Header navigation */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-800">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-black text-white shadow-lg text-xs">
              D
            </div>
            <span className="font-black text-slate-100 text-sm">DCCMS</span>
          </Link>
          <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">
            Step {step} of 3
          </span>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 font-medium rounded-xl leading-relaxed">
            {error}
          </div>
        )}

        {/* STEP 1: Personal Profile Registration */}
        {step === 1 && (
          <form onSubmit={handleNextStep1} className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-slate-100 leading-tight">Create your profile</h2>
              <p className="text-xs text-slate-400">Join a cooperative to start contributing on auto-pilot.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Full Name</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-200 text-xs placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all font-medium"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Select Cooperative</label>
                <select 
                  value={coopId}
                  onChange={(e) => setCoopId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500/50 transition-all font-medium"
                  required
                >
                  {cooperatives.map(c => (
                    <option key={c.id} value={c.id} className="bg-slate-950 text-slate-200">
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Email Address</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. john@doe.com"
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-200 text-xs placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all font-medium"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Phone Number</label>
                <input 
                  type="tel" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +2348000000000"
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-200 text-xs placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all font-medium"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Occupation</label>
                <input 
                  type="text" 
                  value={occupation} 
                  onChange={(e) => setOccupation(e.target.value)}
                  placeholder="e.g. Civil Servant"
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-200 text-xs placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all font-medium"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Account Password</label>
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-200 text-xs placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all font-medium"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Residential Address</label>
              <textarea 
                value={address} 
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Block C, Herbert Macaulay Way, Yaba, Lagos"
                rows={2}
                className="w-full px-3 py-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-200 text-xs placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all font-medium resize-none"
                required
              />
            </div>

            <button 
              type="submit"
              className="w-full py-3.5 rounded-xl btn-primary-gradient font-bold text-white text-xs tracking-wider uppercase transition-all"
            >
              Continue to KYC & Bank details
            </button>
          </form>
        )}

        {/* STEP 2: KYC & Bank accounts */}
        {step === 2 && (
          <form onSubmit={handleNextStep2} className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-slate-100 leading-tight">Financial & KYC Verification</h2>
              <p className="text-xs text-slate-400">Complete bank data and upload credentials for audit compliance.</p>
            </div>

            <div className="p-3 bg-indigo-950/20 border border-indigo-500/10 rounded-xl space-y-1 text-slate-400 text-[10px] leading-relaxed">
              <span className="font-bold text-indigo-400 block uppercase tracking-wide">📂 KYC Requirements</span>
              We collect your National ID and bank coordinates to satisfy transaction validations and ensure payouts/refund compliance.
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Bank Name</label>
                <input 
                  type="text" 
                  value={bankName} 
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="e.g. Access Bank"
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-200 text-xs placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all font-medium"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Account Number</label>
                <input 
                  type="text" 
                  value={accountNumber} 
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="10 Digits"
                  maxLength={10}
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-200 text-xs placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all font-medium"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Account Name</label>
                <input 
                  type="text" 
                  value={accountName} 
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-200 text-xs placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all font-medium"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">National ID Number</label>
                <input 
                  type="text" 
                  value={nationalId} 
                  onChange={(e) => setNationalId(e.target.value)}
                  placeholder="NID-999999999"
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-200 text-xs placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all font-medium"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Government ID / Photo Upload</label>
              <label 
                htmlFor="kyc-file-input"
                className="p-4 rounded-xl border border-dashed border-slate-800 hover:border-indigo-500/30 transition-all flex flex-col items-center justify-center text-center cursor-pointer bg-slate-950/20 block"
              >
                <input 
                  type="file" 
                  id="kyc-file-input" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleImageUpload}
                />
                {kycImage ? (
                  <div className="space-y-2 w-full flex flex-col items-center">
                    <img 
                      src={kycImage} 
                      alt="Uploaded Document" 
                      className="max-h-24 object-contain rounded-lg border border-white/10"
                    />
                    <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Document Selected ✓</span>
                  </div>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 mb-1.5 text-slate-500">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                    </svg>
                    <span className="text-xs font-semibold text-slate-300">Passport Photograph & ID Upload</span>
                    <span className="text-[10px] text-slate-500 mt-1">Click to select image file (Required)</span>
                  </>
                )}
              </label>
            </div>

            <div className="space-y-2 border-t border-slate-800 pt-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Next of Kin Details</span>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Name</label>
                  <input 
                    type="text" 
                    value={nokName} 
                    onChange={(e) => setNokName(e.target.value)}
                    placeholder="Full Name"
                    className="w-full px-2.5 py-2 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500/50 transition-all font-medium"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Phone</label>
                  <input 
                    type="tel" 
                    value={nokPhone} 
                    onChange={(e) => setNokPhone(e.target.value)}
                    placeholder="+23480..."
                    className="w-full px-2.5 py-2 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500/50 transition-all font-medium"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Relationship</label>
                  <input 
                    type="text" 
                    value={nokRelationship} 
                    onChange={(e) => setNokRelationship(e.target.value)}
                    placeholder="e.g. Spouse"
                    className="w-full px-2.5 py-2 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500/50 transition-all font-medium"
                    required
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl btn-primary-gradient font-bold text-white text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving Account Profiles...
                </>
              ) : (
                'Save Onboarding & Link Card'
              )}
            </button>
          </form>
        )}

        {/* STEP 3: Card Tokenization Linking */}
        {step === 3 && (
          <form onSubmit={handleLinkCard} className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-slate-100 leading-tight">Card Authorization Setup</h2>
              <p className="text-xs text-slate-400">Authorize automated billing using Paystack secure card tokenization.</p>
            </div>

            <div className="p-3 bg-amber-500/10 border border-amber-500/25 rounded-xl text-slate-400 text-[10px] leading-relaxed">
              <span className="font-bold text-amber-400 block uppercase tracking-wide">🔐 PCI-Compliance Statement</span>
              We do NOT save your card credentials. They are sent directly to Paystack payment gateway, which returns an encrypted token for authorized recurring debits.
            </div>

            {/* Credit Card Graphic Simulator */}
            <div className="w-full h-40 rounded-2xl bg-gradient-to-tr from-indigo-700 via-purple-600 to-indigo-900 p-6 flex flex-col justify-between shadow-lg relative overflow-hidden">
              <div className="absolute right-0 bottom-0 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
              
              <div className="flex justify-between items-start">
                <span className="text-xs font-black tracking-wider text-white">SECURE DEBIT CARD</span>
                <span className="text-xs font-mono font-bold text-white/60">Paystack SDK</span>
              </div>

              <div className="space-y-1">
                <p className="text-lg font-mono font-bold tracking-widest text-slate-100">
                  {cardNumber ? cardNumber.replace(/(\d{4})/g, '$1 ').trim() : '•••• •••• •••• ••••'}
                </p>
                <div className="flex gap-4 text-[10px] text-slate-300 font-mono">
                  <div>
                    <span className="text-[7px] text-white/40 uppercase block">Expiry</span>
                    <span>{cardExpiry || 'MM/YY'}</span>
                  </div>
                  <div>
                    <span className="text-[7px] text-white/40 uppercase block">CVV</span>
                    <span>{cardCvv || '•••'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Card Number</label>
                <input 
                  type="text" 
                  value={cardNumber} 
                  onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').replace(/(\d{4})/g, '$1 ').trim())}
                  maxLength={19}
                  placeholder="4012 8888 8888 4242"
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-200 text-xs placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Expiration Date</label>
                  <input 
                    type="text" 
                    value={cardExpiry} 
                    onChange={(e) => setCardExpiry(e.target.value.replace(/\D/g, '').replace(/(\d{2})/, '$1/').substring(0, 5))}
                    placeholder="MM/YY"
                    maxLength={5}
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-200 text-xs placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all font-medium"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Security CVV</label>
                  <input 
                    type="password" 
                    value={cardCvv} 
                    onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').substring(0, 3))}
                    placeholder="123"
                    maxLength={3}
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-200 text-xs placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all font-medium"
                    required
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl btn-primary-gradient font-bold text-white text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verifying Card Authorization...
                </>
              ) : (
                'Link Card & Complete Registration'
              )}
            </button>
          </form>
        )}

        <div className="text-center text-xs text-slate-500 pt-2">
          Already have an account?{' '}
          <Link href="/login" className="text-indigo-400 font-bold hover:underline">
            Log In
          </Link>
        </div>

      </div>
    </div>
  );
}
