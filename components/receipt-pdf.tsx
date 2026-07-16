'use client';

import React from 'react';
import { Payment } from '@/types';

interface ReceiptPdfProps {
  payment: Payment;
  coopName: string;
  currency: string;
  onClose: () => void;
}

export default function ReceiptPdf({ payment, coopName, currency, onClose }: ReceiptPdfProps) {
  const receiptNum = `REC-${payment.id.substring(0, 8).toUpperCase()}-${new Date(payment.createdAt).getFullYear()}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=dccms-verify-payment-${payment.id}&color=020617&bgcolor=ffffff`;

  const handlePrint = () => {
    if (typeof window === 'undefined') return;

    const printContents = document.getElementById('printable-receipt-content')?.innerHTML;
    const originalContents = document.body.innerHTML;

    if (printContents) {
      // Create a temporary printing stylesheet
      const style = document.createElement('style');
      style.innerHTML = `
        @media print {
          body {
            background: white !important;
            color: black !important;
            font-family: sans-serif;
            padding: 2rem;
          }
          .no-print {
            display: none !important;
          }
          .print-border {
            border: 1px dashed #ccc;
            padding: 2rem;
            border-radius: 8px;
          }
        }
      `;
      document.head.appendChild(style);

      window.print();
      
      // Clean up stylesheet
      document.head.removeChild(style);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-6 md:p-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Actions header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800 no-print">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-indigo-500">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
            Receipt Generated
          </h2>
          <div className="flex gap-2">
            <button 
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs flex items-center gap-1.5 transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.617 0-1.11-.474-1.12-1.09L5.87 18M18 10.5h.008v.008H18V10.5Zm-1.8 13.5a9 9 0 0 1-12.4-12.4M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              Print Receipt
            </button>
            <button 
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Receipt content wrapper */}
        <div id="printable-receipt-content" className="bg-slate-950 border border-slate-800 rounded-2xl p-6 text-slate-300 print-border">
          {/* Header */}
          <div className="flex justify-between items-start mb-6 pb-6 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white text-xs">
                  D
                </div>
                <span className="font-bold text-sm text-slate-100 tracking-tight">DCCMS</span>
              </div>
              <h1 className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">Cooperative Institution</h1>
              <p className="text-sm font-bold text-indigo-400">{coopName}</p>
            </div>
            <div className="text-right">
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[9px] font-bold uppercase tracking-wider">
                PAID ✓
              </span>
              <p className="text-xs font-mono text-slate-400 mt-2">{receiptNum}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Date: {new Date(payment.paidAt || payment.createdAt).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <span className="text-[9px] uppercase tracking-wider text-slate-500 block">Contributor</span>
              <span className="text-sm font-semibold text-slate-200">{payment.userName}</span>
              <span className="text-xs text-slate-400 block mt-0.5">ID: #{payment.userId.substring(0, 8).toUpperCase()}</span>
            </div>
            <div>
              <span className="text-[9px] uppercase tracking-wider text-slate-500 block">Contribution Plan</span>
              <span className="text-sm font-semibold text-slate-200">{payment.planName}</span>
              <span className="text-xs text-slate-400 block mt-0.5">Schedule: Auto-Debit</span>
            </div>
          </div>

          {/* Payment breakdown ledger table */}
          <div className="border border-slate-800 rounded-xl overflow-hidden mb-6">
            <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex justify-between text-[10px] uppercase font-bold tracking-wider text-slate-400">
              <span>Item Description</span>
              <span>Amount</span>
            </div>
            <div className="divide-y divide-slate-800 px-4">
              <div className="py-2.5 flex justify-between text-xs">
                <span className="text-slate-400">Standard Plan Contribution</span>
                <span className="font-semibold text-slate-200 font-mono">{currency} {payment.amount.toLocaleString()}</span>
              </div>
              {payment.penaltyAmount > 0 && (
                <div className="py-2.5 flex justify-between text-xs">
                  <span className="text-rose-400">Late Payment Penalty Added</span>
                  <span className="font-semibold text-rose-400 font-mono">+{currency} {payment.penaltyAmount.toLocaleString()}</span>
                </div>
              )}
            </div>
            <div className="bg-slate-900/60 px-4 py-3 flex justify-between items-center border-t border-slate-800">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Total Charge Paid</span>
              <span className="text-base font-black text-indigo-400 font-mono">{currency} {payment.totalAmount.toLocaleString()}</span>
            </div>
          </div>

          {/* Verification info and QR */}
          <div className="flex justify-between items-center pt-4 border-t border-slate-800">
            <div className="w-2/3">
              <span className="text-[9px] uppercase tracking-wider text-slate-500 block">Payment Method</span>
              <span className="text-xs text-slate-300 font-medium capitalize flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                {payment.paymentMethod} Payment
              </span>
              <div className="mt-2">
                <span className="text-[8px] uppercase tracking-wider text-slate-500 block">Gateway Transaction Reference</span>
                <span className="text-[10px] font-mono text-slate-400 truncate max-w-[200px] block">{payment.gatewayRef}</span>
              </div>
            </div>
            <div className="flex flex-col items-center gap-1 text-center">
              <div className="bg-white p-1 rounded-lg border border-slate-800">
                <img 
                  src={qrUrl} 
                  alt="Validation QR" 
                  className="w-14 h-14"
                />
              </div>
              <span className="text-[7px] text-slate-500 font-bold uppercase font-mono tracking-wider">
                VALID RECEIPT
              </span>
            </div>
          </div>
        </div>

        {/* Footer instructions */}
        <p className="text-center text-[10px] text-slate-500 mt-6 no-print">
          This receipt is generated automatically upon successful gateway authorization.<br />
          For disputes, please quote the transaction reference in your support request.
        </p>
      </div>
    </div>
  );
}
