import React from 'react';
import { CheckCircle2, Download, Eye, LayoutDashboard, PlusCircle, Sparkles, Building2, Calendar, CreditCard } from 'lucide-react';
import { useRegistration } from '../../context/RegistrationContext';
import { FESTIVAL_METADATA } from '../../data/festivalData';

export const RegistrationConfirmation: React.FC = () => {
  const { 
    activeRegistration, 
    goToStep, 
    startNewRegistration, 
    setViewReceiptRegistration 
  } = useRegistration();

  if (!activeRegistration) {
    return (
      <div className="max-w-md mx-auto text-center py-12 text-slate-300">
        <p>No active submission found.</p>
        <button
          onClick={() => goToStep('dashboard')}
          className="mt-4 px-4 py-2 bg-[#D4AF37] text-[#070B1B] rounded font-semibold text-xs"
        >
          View Dashboard
        </button>
      </div>
    );
  }

  const handleDownloadReceipt = () => {
    setViewReceiptRegistration(activeRegistration);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="celestial-glass rounded-3xl p-6 sm:p-10 border border-[#D4AF37]/35 shadow-2xl text-center relative overflow-hidden">
        
        {/* Success Icon */}
        <div className="w-16 h-16 rounded-full bg-emerald-500/15 border-2 border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center mb-4">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <div className="inline-flex items-center gap-1.5 text-xs font-mono text-[#D4AF37] uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{FESTIVAL_METADATA.edition} · Official Confirmation</span>
        </div>

        {/* Title */}
        <h1 className="font-cinzel text-2xl sm:text-4xl font-extrabold text-white mb-2">
          Registration Submitted Successfully
        </h1>

        <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto mb-6">
          {activeRegistration.college?.isHostCollege
            ? 'Your host student entry dossier has been logged. Please carry your physical SMCH student ID card to the central helpdesk on festival day.'
            : 'Your entry dossier has been logged. Our accounts and registration desk will verify the UTR transaction within 24 working hours.'}
        </p>

        {/* Registration ID Banner */}
        <div className="p-4 rounded-xl bg-[#070B1E] border border-[#D4AF37]/30 max-w-sm mx-auto mb-6 text-center">
          <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block">
            Official Registration ID
          </span>
          <span className="font-mono text-xl sm:text-2xl font-bold text-[#E6C57D] block mt-0.5 tracking-wider">
            {activeRegistration.id}
          </span>
        </div>

        {/* Details Grid */}
        <div className="p-5 rounded-2xl bg-[#090E25]/80 border border-white/10 text-left space-y-3 text-xs sm:text-sm text-slate-300 mb-8">
          <div className="flex justify-between items-center pb-2 border-b border-white/5">
            <span className="text-slate-400">Competition:</span>
            <span className="font-semibold text-white">{activeRegistration.eventTitle} ({activeRegistration.eventCode})</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-white/5">
            <span className="text-slate-400">Institution:</span>
            <span className="font-medium text-slate-200">{activeRegistration.college.collegeName}</span>
          </div>
          {activeRegistration.college?.isHostCollege && (
            <div className="flex justify-between items-center pb-2 border-b border-white/5 text-emerald-400">
              <span>Host Student Verification:</span>
              <span className="font-mono font-semibold">
                Reg: {activeRegistration.college.hostRegisterNumber || 'Provided'} ({activeRegistration.college.hostBatch})
              </span>
            </div>
          )}
          <div className="flex justify-between items-center pb-2 border-b border-white/5">
            <span className="text-slate-400">Participant / Team:</span>
            <span className="font-medium text-[#F5E7C4]">{activeRegistration.teamName || activeRegistration.participants[0]?.fullName}</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-white/5">
            <span className="text-slate-400">Total Remitted:</span>
            <span className="font-mono font-bold text-white text-base">
              {activeRegistration.college?.isHostCollege ? '₹0 (Host Free Waiver)' : `₹${activeRegistration.totalAmount.toLocaleString('en-IN')}`}
            </span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-white/5">
            <span className="text-slate-400">UTR / Waiver Ref:</span>
            <span className="font-mono text-slate-300">{activeRegistration.utrNumber}</span>
          </div>
          <div className="flex justify-between items-center pt-1">
            <span className="text-slate-400">Payment Status:</span>
            {activeRegistration.college?.isHostCollege ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                Host Student (ID Verification at Desk)
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                Pending Verification
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons as requested */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleDownloadReceipt}
            className="w-full sm:w-auto py-2.5 px-5 text-xs font-bold tracking-wider uppercase text-[#070B1B] bg-gradient-to-r from-[#F5E7C4] to-[#D4AF37] hover:brightness-110 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-[#D4AF37]/20"
          >
            <Download className="w-4 h-4" />
            <span>Download Receipt</span>
          </button>

          <button
            type="button"
            onClick={() => goToStep('dashboard')}
            className="w-full sm:w-auto py-2.5 px-5 text-xs font-semibold tracking-wider uppercase text-slate-200 hover:text-white bg-[#0D1438] hover:bg-[#162152] border border-[#D4AF37]/30 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <LayoutDashboard className="w-4 h-4 text-[#D4AF37]" />
            <span>Back to Dashboard</span>
          </button>

          <button
            type="button"
            onClick={() => startNewRegistration()}
            className="w-full sm:w-auto py-2.5 px-5 text-xs font-semibold tracking-wider uppercase text-[#E6C57D] hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Register Another Event</span>
          </button>
        </div>

      </div>
    </div>
  );
};
