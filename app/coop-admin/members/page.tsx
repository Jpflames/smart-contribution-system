'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useCollection, useDocument, updateDocument, queryDocuments, setDocument } from '@/hooks/use-firestore';
import { calculateMemberRiskScore } from '@/lib/risk-score';
import { UserProfile, Payment, Cooperative } from '@/types';
import DigitalId from '@/components/digital-id';

export default function MembersManagementPage() {
  const { user } = useAuth();
  
  // Queries
  const { data: coop } = useDocument<Cooperative>('cooperatives', user?.coopId || '');
  const { data: members, loading } = useCollection<UserProfile>('users', [
    { field: 'coopId', operator: '==', value: user?.coopId || '' },
    { field: 'role', operator: '==', value: 'member' }
  ]);
  const { data: payments } = useCollection<Payment>('payments', [
    { field: 'coopId', operator: '==', value: user?.coopId || '' }
  ]);

  const [selectedMember, setSelectedMember] = useState<UserProfile | null>(null);

  const handleToggleFreeze = async (member: UserProfile) => {
    const nextStatus = member.status === 'suspended' ? 'approved' : 'suspended';
    try {
      await updateDocument('users', member.uid, { status: nextStatus });
    } catch (err) {
      console.error(err);
    }
  };

  const handleWaivePenalties = async (memberId: string) => {
    try {
      // Find all unpaid penalties for this user
      const memberPenalties = await queryDocuments('penalties', [
        { field: 'userId', operator: '==', value: memberId },
        { field: 'status', operator: '==', value: 'unpaid' }
      ]);

      if (memberPenalties.length === 0) {
        alert('This member has no unpaid penalties.');
        return;
      }

      // Mark all as waived
      for (const penalty of memberPenalties) {
        await updateDocument('penalties', penalty.id, { status: 'waived', waivedAt: new Date().toISOString() });
      }

      // Also adjust payment record penalty amount to 0
      const memberOverduePayments = await queryDocuments('payments', [
        { field: 'userId', operator: '==', value: memberId },
        { field: 'status', operator: '==', value: 'overdue' }
      ]);

      for (const pay of memberOverduePayments) {
        await updateDocument('payments', pay.id, { 
          penaltyAmount: 0,
          totalAmount: pay.amount // reset total to base amount
        });
      }

      alert('All unpaid penalties have been waived successfully.');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      <div>
        <h1 className="text-2xl font-black text-slate-100 tracking-tight">Cooperative Members Directory</h1>
        <p className="text-xs text-slate-400">Audit KYC forms, analyze membership health indexes, restrict logins, or override penalty fees.</p>
      </div>

      <div className="p-6 rounded-3xl glass-panel space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-900 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Member Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Contact Phone</th>
                <th className="py-3 px-4">Delinquency Risk</th>
                <th className="py-3 px-4">KYC Compliance</th>
                <th className="py-3 px-4">Account status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">Querying member files...</td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">No members registered in this cooperative yet.</td>
                </tr>
              ) : (
                members.map((m) => {
                  const mPayments = payments.filter(p => p.userId === m.uid);
                  const mWallet = { id: m.uid, userId: m.uid, coopId: user?.coopId || '', balance: 0, ledgerBalance: 0, currency: coop?.settings?.currency || 'NGN', lastUpdated: '' };
                  const { score, rating } = calculateMemberRiskScore(m.uid, mPayments, mWallet);

                  return (
                    <tr key={m.uid} className="hover:bg-white/5 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-200">
                        {m.name}
                        <span className="text-[9px] text-slate-500 block font-mono">UID: #{m.uid.substring(0, 6).toUpperCase()}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">{m.email}</td>
                      <td className="py-3.5 px-4 text-slate-400 font-mono">{m.phone}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono ${
                          rating === 'Low' 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : rating === 'Medium'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {score}% ({rating})
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold">
                        <span className={`text-[10px] ${m.kycStatus === 'approved' ? 'text-emerald-400' : 'text-amber-500'}`}>
                          {m.kycStatus === 'approved' ? '✓ VERIFIED' : 'PENDING'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          m.status === 'approved' 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {m.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right flex justify-end gap-1.5">
                        <button 
                          onClick={() => setSelectedMember(m)}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[10px] uppercase transition-all"
                        >
                          View ID Card
                        </button>
                        <button 
                          onClick={() => handleWaivePenalties(m.uid)}
                          className="px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 font-bold text-[10px] uppercase transition-all"
                        >
                          Waive Fees
                        </button>
                        <button 
                          onClick={() => handleToggleFreeze(m)}
                          className={`px-2.5 py-1.5 rounded-xl font-bold text-[10px] uppercase border transition-all ${
                            m.status === 'suspended' 
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20' 
                              : 'bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20'
                          }`}
                        >
                          {m.status === 'suspended' ? 'Activate' : 'Suspend'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* VIEW ID CARD POPUP MODAL */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-4 border-b border-slate-800">
              <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wide">Member Digital Credential</h2>
              <button onClick={() => setSelectedMember(null)} className="text-slate-400 hover:text-slate-200">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="py-4">
              <DigitalId member={selectedMember} coop={coop} />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
