'use client';

import React, { useState } from 'react';
import { UserProfile, Cooperative } from '@/types';

interface DigitalIdProps {
  member: UserProfile;
  coop: Cooperative | null;
}

export default function DigitalId({ member, coop }: DigitalIdProps) {
  const [flipped, setFlipped] = useState(false);
  const [isDarkCard, setIsDarkCard] = useState(true);

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=coopsync-member-${member.uid}&color=020617&bgcolor=ffffff`;

  const handleFlip = (e: React.MouseEvent) => {
    // Prevent flip if clicking the theme toggle button
    const target = e.target as HTMLElement;
    if (target.closest('.theme-toggle-btn')) return;
    setFlipped(!flipped);
  };

  return (
    <div className="flex flex-col items-center justify-center p-2 w-full">
      {/* 3D Perspective Card Container */}
      <div 
        className="w-full max-w-sm aspect-[1.58] cursor-pointer perspective-1000 select-none relative"
        onClick={handleFlip}
      >
        <div 
          className={`relative w-full h-full duration-700 preserve-3d transition-transform ${
            flipped ? 'rotate-y-180' : ''
          }`}
        >
          
          {/* FRONT OF THE CARD */}
          <div 
            className={`absolute inset-0 w-full h-full rounded-3xl p-5 flex flex-col justify-between backface-hidden shadow-2xl border transition-all duration-300 ${
              isDarkCard 
                ? 'bg-slate-900/85 border-white/10 text-slate-100 shadow-slate-950/60' 
                : 'bg-white/90 border-slate-200/80 text-slate-900 shadow-slate-400/20'
            }`}
          >
            {/* Background Glows (Clipped in a nested layer to avoid backface hidden browser bugs) */}
            <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none z-0">
              <div className={`absolute -right-16 -top-16 w-36 h-36 rounded-full blur-2xl transition-all duration-300 ${
                isDarkCard ? 'bg-indigo-500/20' : 'bg-blue-500/10'
              }`}></div>
              <div className={`absolute -left-16 -bottom-16 w-36 h-36 rounded-full blur-2xl transition-all duration-300 ${
                isDarkCard ? 'bg-emerald-500/15' : 'bg-violet-500/10'
              }`}></div>
            </div>

            {/* Top Bar */}
            <div className="flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center font-black text-white text-xs shadow-md">
                  C
                </div>
                <div>
                  <h3 className={`text-[9px] font-bold uppercase tracking-widest ${
                    isDarkCard ? 'text-slate-400' : 'text-slate-500'
                  }`}>COOPSYNC ID</h3>
                  <p className="text-[9px] text-indigo-500 font-bold uppercase tracking-wider truncate max-w-[150px]">
                    {coop?.name || 'GLOBAL MEMBER'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-1.5">
                {/* Theme Toggle Button */}
                <button 
                  onClick={() => setIsDarkCard(!isDarkCard)}
                  className="theme-toggle-btn p-1.5 rounded-lg bg-slate-500/10 hover:bg-slate-500/20 border border-slate-500/10 text-slate-400 hover:text-slate-200 transition-all"
                  title="Toggle Card Theme"
                >
                  {isDarkCard ? (
                    // Sun Icon
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3 text-amber-400">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m0 13.5V21M9.75 9.75l1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75a6.75 6.75 0 1 1 0-13.5 6.75 6.75 0 0 1 0 13.5Z" />
                    </svg>
                  ) : (
                    // Moon Icon
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3 text-indigo-600">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25" />
                    </svg>
                  )}
                </button>

                <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider ${
                  member.status === 'approved' 
                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                    : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                }`}>
                  {member.status}
                </span>
              </div>
            </div>

            {/* Mid Section */}
            <div className="flex gap-3.5 items-center z-10 my-2">
              <div className="relative">
                <div className="w-12 h-12 rounded-xl border border-slate-700 bg-slate-800/80 overflow-hidden flex items-center justify-center text-base font-bold text-slate-300 shadow-inner">
                  {member.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900"></div>
              </div>
              <div className="truncate">
                <h2 className={`text-sm font-bold tracking-tight leading-tight ${
                  isDarkCard ? 'text-slate-100' : 'text-slate-900'
                }`}>
                  {member.name}
                </h2>
                <p className={`text-[10px] font-mono tracking-wider mt-0.5 ${
                  isDarkCard ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  ID: #{member.uid.substring(0, 8).toUpperCase()}
                </p>
                <p className="text-[8px] text-indigo-500 font-bold tracking-wide uppercase mt-0.5">
                  ROLE: {member.role.replace('_', ' ')}
                </p>
              </div>
            </div>

            {/* Bottom Section */}
            <div className="flex justify-between items-end z-10 pt-1 border-t border-slate-500/10">
              <div>
                <p className={`text-[8px] uppercase tracking-wider ${
                  isDarkCard ? 'text-slate-500' : 'text-slate-400'
                }`}>Joined Date</p>
                <p className={`text-xs font-semibold ${
                  isDarkCard ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  {new Date(member.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}
                </p>
              </div>
              <div className="text-right">
                <p className={`text-[8px] uppercase tracking-wider ${
                  isDarkCard ? 'text-slate-500' : 'text-slate-400'
                }`}>KYC Status</p>
                <p className="text-xs font-semibold text-emerald-500">
                  {member.kycStatus === 'approved' ? 'VERIFIED ✓' : 'PENDING'}
                </p>
              </div>
            </div>
          </div>

          {/* BACK OF THE CARD */}
          <div 
            className={`absolute inset-0 w-full h-full rounded-3xl p-5 flex justify-between items-center rotate-y-180 backface-hidden shadow-2xl border transition-all duration-300 ${
              isDarkCard 
                ? 'bg-slate-900/85 border-white/10 text-slate-100 shadow-slate-950/60' 
                : 'bg-white/90 border-slate-200/80 text-slate-900 shadow-slate-400/20'
            }`}
          >
            {/* Background Glows */}
            <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none z-0">
              <div className={`absolute -left-16 -top-16 w-36 h-36 rounded-full blur-2xl transition-all duration-300 ${
                isDarkCard ? 'bg-violet-500/20' : 'bg-purple-500/10'
              }`}></div>
            </div>

            {/* Back Details */}
            <div className="flex flex-col justify-between h-full w-2/3 z-10 pr-2">
              <div>
                <h3 className={`text-[9px] font-bold uppercase tracking-widest mb-2 ${
                  isDarkCard ? 'text-slate-400' : 'text-slate-500'
                }`}>COOP DATA</h3>
                <div className="space-y-1.5 text-[10px]">
                  <div>
                    <span className={`text-[7px] uppercase block ${
                      isDarkCard ? 'text-slate-500' : 'text-slate-400'
                    }`}>Phone Connection</span>
                    <span className={isDarkCard ? 'text-slate-300' : 'text-slate-700'}>{member.phone}</span>
                  </div>
                  <div>
                    <span className={`text-[7px] uppercase block ${
                      isDarkCard ? 'text-slate-500' : 'text-slate-400'
                    }`}>Settlement Bank</span>
                    <span className={`font-mono block truncate max-w-[150px] ${
                      isDarkCard ? 'text-slate-300' : 'text-slate-700'
                    }`}>
                      {member.bankDetails?.bankName} ({member.bankDetails?.accountNumber.substring(0, 3)}...{member.bankDetails?.accountNumber.slice(-3)})
                    </span>
                  </div>
                </div>
              </div>

              <p className={`text-[7px] leading-normal ${
                isDarkCard ? 'text-slate-500' : 'text-slate-400'
              }`}>
                Scan ID code to verify membership status on the CoopSync Terminal.
              </p>
            </div>

            {/* QR Code */}
            <div className="flex flex-col items-center gap-1.5 w-1/3 z-10">
              <div className="bg-white p-1.5 rounded-xl shadow-md border border-white/5">
                <img 
                  src={qrUrl} 
                  alt="Member QR Code" 
                  className="w-14 h-14"
                />
              </div>
              <span className={`text-[7px] font-bold uppercase tracking-widest font-mono ${
                isDarkCard ? 'text-slate-400' : 'text-slate-600'
              }`}>
                VERIFY ID
              </span>
            </div>
          </div>

        </div>
      </div>
      
      <p className="text-[10px] text-slate-500 mt-2.5 flex items-center gap-1">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
        </svg>
        Click card to flip for details
      </p>

      {/* Add Custom perspective and flip CSS */}
      <style jsx global>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .preserve-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>
    </div>
  );
}
