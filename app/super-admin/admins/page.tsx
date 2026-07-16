'use client';

import React from 'react';
import { useCollection, updateDocument } from '@/hooks/use-firestore';
import { UserProfile } from '@/types';

export default function AdminsManagementPage() {
  const { data: users, loading } = useCollection<UserProfile>('users');

  const admins = users.filter(u => u.role === 'coop_admin' || u.role === 'treasurer');

  const handleApproveAdmin = async (admin: UserProfile) => {
    try {
      await updateDocument('users', admin.uid, { status: 'approved' });
    } catch (err) {
      console.error(err);
    }
  };

  const handleSuspendAdmin = async (admin: UserProfile) => {
    const nextStatus = admin.status === 'suspended' ? 'approved' : 'suspended';
    try {
      await updateDocument('users', admin.uid, { status: nextStatus });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      <div>
        <h1 className="text-2xl font-black text-slate-100 tracking-tight">Cooperative Administrators</h1>
        <p className="text-xs text-slate-400">Review registrations, authorize Treasurer credentials, and audit administrative permissions.</p>
      </div>

      <div className="p-6 rounded-3xl glass-panel space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-900 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Admin Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Contact Phone</th>
                <th className="py-3 px-4">Assigned Coop ID</th>
                <th className="py-3 px-4">System Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">Querying admins list...</td>
                </tr>
              ) : admins.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">No cooperative admins found.</td>
                </tr>
              ) : (
                admins.map((admin) => (
                  <tr key={admin.uid} className="hover:bg-white/5 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-200 flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-300">
                        {admin.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      {admin.name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">{admin.email}</td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono">{admin.phone}</td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono">{admin.coopId || 'GLOBAL'}</td>
                    <td className="py-3.5 px-4 text-indigo-400 font-bold uppercase tracking-wider text-[10px]">
                      {admin.role.replace('_', ' ')}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                        admin.status === 'approved' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : admin.status === 'pending'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {admin.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right flex justify-end gap-2">
                      {admin.status === 'pending' && (
                        <button 
                          onClick={() => handleApproveAdmin(admin)}
                          className="px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] uppercase transition-all"
                        >
                          Approve
                        </button>
                      )}
                      <button 
                        onClick={() => handleSuspendAdmin(admin)}
                        className={`px-2.5 py-1.5 rounded-xl font-bold text-[10px] uppercase border transition-all ${
                          admin.status === 'suspended' 
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20' 
                            : 'bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20'
                        }`}
                      >
                        {admin.status === 'suspended' ? 'Reactivate' : 'Suspend'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
