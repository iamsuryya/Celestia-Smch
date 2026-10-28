import React, { useState } from 'react';
import { CheckCircle2, Copy, Check, Home, LayoutDashboard, PlusCircle } from 'lucide-react';
import { useRegistration } from '../../context/RegistrationContext';
import { FESTIVAL_METADATA } from '../../data/festivalData';

export const RegistrationConfirmation: React.FC = () => {
  const { 
    activeRegistration, 
    goToStep, 
    startNewRegistration, 
    setViewReceiptRegistration 
  } = useRegistration();

  const [copied, setCopied] = useState(false);

  if (!activeRegistration) {
    return (
      <div className="max-w-md mx-auto text-center py-12 text-slate-300">
        <p>No active submission found.</p>
        <button
          type="button"
          onClick={() => goToStep('dashboard')}
          className="mt-4 px-6 py-2.5 bg-gradient-to-r from-[#F8E7C4] to-[#D4AF37] text-[#060B1E] rounded-full font-bold text-xs"
        >
          View Registrations
        </button>
      </div>
    );
  }

  const handleCopyId = () => {
    navigator.clipboard.writeText(activeRegistration.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-4 space-y-5">
      <div className="celestial-glass rounded-3xl p-6 sm:p-8 border border-[#D4AF37]/35 shadow-2xl text-center relative overflow-hidden bg-gradient-to-b from-[#0F163D] via-[#080D24] to-[#060B1E]">
        
        {/* Glowing Circle Checkmark (Matching Screen 6) */}
        <div className="w-16 h-16 rounded-full bg-gradient-to-b from-[#F8E7C4]/20 to-[#D4AF37]/10 border border-[#D4AF37]/60 flex items-center justify-center mx-auto mb-3.5 shadow-lg shadow-[#D4AF37]/25">
          <CheckCircle2 className="w-8 h-8 text-[#D4AF37]" />
        </div>

        {/* Title & Subtitle */}
        <h1 className="font-cinzel text-2xl sm:text-3xl font-extrabold text-white mb-1.5 tracking-wide">
          REGISTRATION SUBMITTED!
        </h1>

        <p className="text-xs sm:text-sm text-slate-300 max-w-sm mx-auto mb-6 font-medium">
          Thank you for registering for <span className="text-[#F5E7C4] font-bold">{activeRegistration.eventTitle}</span>
        </p>

        {/* Registration Details Card (Matching Screen 6) */}
        <div className="p-4 rounded-2xl bg-[#080D24] border border-white/10 text-left space-y-2.5 text-xs text-slate-300 mb-5">
          <div className="text-xs font-bold text-[#E6C57D] uppercase tracking-wider pb-2 border-b border-white/10">
            Registration Details
          </div>

          <div className="flex justify-between items-center py-1 border-b border-white/5">
            <span className="text-slate-400">Registration ID</span>
            <div className="flex items-center gap-1.5 font-mono text-white font-bold">
              <span>{activeRegistration.id}</span>
              <button
                type="button"
                onClick={handleCopyId}
                className="p-1 text-[#D4AF37] hover:text-white transition-colors"
                title="Copy Registration ID"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center py-1 border-b border-white/5">
            <span className="text-slate-400">Event</span>
            <span className="font-semibold text-slate-200">{activeRegistration.eventTitle} ({activeRegistration.eventCode})</span>
          </div>

          <div className="flex justify-between items-center py-1 border-b border-white/5">
            <span className="text-slate-400">Participant</span>
            <span className="font-semibold text-[#F5E7C4]">{activeRegistration.participants[0]?.fullName}</span>
          </div>

          <div className="flex justify-between items-center py-1 border-b border-white/5">
            <span className="text-slate-400">College</span>
            <span className="font-medium text-slate-200 truncate max-w-[180px]">{activeRegistration.college.collegeName}</span>
          </div>

          <div className="flex justify-between items-center py-1 border-b border-white/5">
            <span className="text-slate-400">
              {activeRegistration.isAdvancePayment ? 'Advance Amount Paid' : 'Amount'}
            </span>
            <span className="font-mono font-bold text-white">
              {activeRegistration.college?.isHostCollege ? '₹0 (Host Free Waiver)' : `₹${activeRegistration.totalAmount}`}
            </span>
          </div>

          {activeRegistration.isAdvancePayment && activeRegistration.remainingBalance !== undefined && (
            <div className="flex justify-between items-center py-1.5 px-2 bg-amber-500/15 rounded-lg border border-amber-500/30 text-amber-200">
              <span className="font-semibold">Remaining Balance Due on Arrival:</span>
              <span className="font-mono font-bold text-white">₹{activeRegistration.remainingBalance}</span>
            </div>
          )}

          <div className="flex justify-between items-center pt-1">
            <span className="text-slate-400">Status</span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
              Payment Verification Pending
            </span>
          </div>
        </div>

        {/* Confirmation Email & Advance Payment Notice Box */}
        {activeRegistration.isAdvancePayment && activeRegistration.remainingBalance !== undefined && (
          <div className="p-3.5 rounded-xl bg-amber-950/80 border border-amber-500/40 text-xs text-amber-200 text-center mb-4 space-y-1">
            <p className="font-bold text-white">⚠️ Advance Payment Registration Confirmed</p>
            <p>
              Advance paid: ₹{activeRegistration.totalAmount}. Please pay the remaining balance of <strong className="text-amber-300">₹{activeRegistration.remainingBalance}</strong> upon arrival at the fest desk.
            </p>
          </div>
        )}

        <div className="p-3.5 rounded-xl bg-[#0F163D]/80 border border-[#D4AF37]/25 text-xs text-slate-300 text-center mb-6">
          You will receive a confirmation email after your payment is verified.
        </div>

        {/* CTA Buttons (Matching Screen 6: Back to Home & View My Registrations) */}
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={() => goToStep('landing')}
            className="w-full py-3 px-5 text-sm font-bold tracking-wider text-[#060B1E] bg-gradient-to-r from-[#F8E7C4] via-[#E8CB8B] to-[#D4AF37] hover:brightness-110 active:scale-95 rounded-full transition-all shadow-lg shadow-[#D4AF37]/25 cursor-pointer flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>Back to Home</span>
          </button>

          <button
            type="button"
            onClick={() => goToStep('dashboard')}
            className="w-full py-3 px-5 text-xs font-semibold tracking-wider text-slate-200 hover:text-white bg-white/10 hover:bg-white/15 border border-white/15 rounded-full transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <LayoutDashboard className="w-4 h-4 text-[#D4AF37]" />
            <span>View My Registrations</span>
          </button>
        </div>

      </div>
    </div>
  );
};
