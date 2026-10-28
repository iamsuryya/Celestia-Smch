import React from 'react';
import { X, Printer, Download, Sparkles, Building2, Calendar, MapPin, CheckCircle2, ShieldCheck } from 'lucide-react';
import { RegistrationSubmission } from '../../types/registration';
import { FESTIVAL_METADATA } from '../../data/festivalData';

interface ReceiptModalProps {
  registration: RegistrationSubmission | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ registration, onClose }) => {
  if (!registration) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-[#03050E]/85 backdrop-blur-md cursor-pointer"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Receipt Surface */}
      <div 
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-xl my-auto bg-[#070B1E] border border-[#D4AF37]/40 rounded-2xl shadow-2xl overflow-hidden z-10 print:border-none print:shadow-none print:bg-white print:text-black"
      >
        {/* Actions bar (hidden in print) */}
        <div className="p-4 bg-[#090E25] border-b border-white/10 flex items-center justify-between print:hidden">
          <span className="text-xs font-mono text-[#D4AF37]">Official Registration Dossier Receipt</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="py-1.5 px-3 rounded bg-white/10 hover:bg-white/15 text-xs text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-white bg-white/5 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Letterhead Content */}
        <div className="p-6 sm:p-8 space-y-6 text-slate-300 print:text-black">
          
          {/* Header */}
          <div className="text-center pb-6 border-b border-white/10 print:border-neutral-300">
            <span className="font-cinzel text-xl sm:text-2xl font-black gold-gradient-text print:text-black tracking-wider block">
              {FESTIVAL_METADATA.edition}
            </span>
            <span className="text-xs font-semibold text-[#F5E7C4] print:text-neutral-700 uppercase tracking-widest block mt-0.5">
              "{FESTIVAL_METADATA.theme}"
            </span>
            <p className="text-xs text-slate-400 print:text-neutral-600 mt-1 max-w-md mx-auto">
              {FESTIVAL_METADATA.collegeName}, Trichy
            </p>
            <p className="text-[11px] text-slate-500 print:text-neutral-500">
              {FESTIVAL_METADATA.datesFormatted} · Main Stage Campus
            </p>
          </div>

          {/* Receipt Identifiers */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 print:text-neutral-500 block">Registration Token</span>
              <span className="font-mono text-base font-bold text-[#E6C57D] print:text-black">{registration.id}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 print:text-neutral-500 block">Date of Submission</span>
              <span className="font-medium text-slate-200 print:text-black">{registration.createdAt}</span>
            </div>
          </div>

          {/* Competition & College Roster */}
          <div className="p-4 rounded-xl bg-[#080D24] print:bg-neutral-100 border border-white/5 print:border-neutral-200 space-y-3 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400 print:text-neutral-600">Event:</span>
              <span className="font-semibold text-white print:text-black">{registration.eventTitle} ({registration.eventCode})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 print:text-neutral-600">Category & Type:</span>
              <span className="text-slate-200 print:text-black">{registration.eventCategory} · {registration.eventType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 print:text-neutral-600">Institution:</span>
              <span className="font-semibold text-white print:text-black">
                {registration.college.collegeName}
                {registration.college?.isHostCollege && ' (Host College)'}
              </span>
            </div>
            {registration.college?.isHostCollege && (
              <div className="flex justify-between text-emerald-400 print:text-neutral-700">
                <span>Host Student Details:</span>
                <span className="font-mono font-semibold">
                  Reg: {registration.college.hostRegisterNumber || 'Provided'} · {registration.college.hostBatch}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-400 print:text-neutral-600">Campus Location:</span>
              <span className="text-slate-200 print:text-black">{registration.college.city}, {registration.college.state}</span>
            </div>
            {registration.teamName && (
              <div className="flex justify-between">
                <span className="text-slate-400 print:text-neutral-600">Entry / Team:</span>
                <span className="font-semibold text-[#F5E7C4] print:text-black">{registration.teamName}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-400 print:text-neutral-600">Participants Count:</span>
              <span className="text-slate-200 print:text-black">{registration.participantCount || registration.participants.length} member(s)</span>
            </div>
          </div>

          {/* Participants list */}
          <div>
            <span className="text-[10px] uppercase tracking-wider text-slate-400 print:text-neutral-600 font-semibold block mb-1.5">
              Registered Performers
            </span>
            <div className="space-y-1 text-xs">
              {registration.participants
                .filter((p, idx) => idx === 0 || Boolean(p.fullName && p.fullName.trim()))
                .map((p, idx) => (
                <div key={idx} className="flex justify-between text-slate-300 print:text-black">
                  <span>#{idx + 1} {p.fullName} ({p.gender || 'N/A'}, Age {p.age || 'N/A'})</span>
                  <span className="font-mono text-slate-400 print:text-neutral-600">{p.mobile || ''}</span>
                </div>
              ))}
            </div>
            {(registration.participantCount || registration.participants.length) > 1 && (
              <div className="mt-2 text-[11px] font-medium text-slate-400 print:text-neutral-600 border-t border-white/5 print:border-neutral-200 pt-1.5 flex justify-between">
                <span>Total Registered Event Roster:</span>
                <span className="text-[#E6C57D] font-bold print:text-black">{registration.participantCount || registration.participants.length} Members</span>
              </div>
            )}
          </div>

          {/* Payment & Verification Box */}
          <div className="p-4 rounded-xl bg-[#090E25] print:bg-neutral-100 border border-[#D4AF37]/30 print:border-neutral-300 space-y-2 text-xs">
            <div className="flex justify-between text-xs font-bold text-slate-300 print:text-black">
              <span>Total Fee:</span>
              <span className="font-mono font-bold text-white print:text-black">
                {registration.college?.isHostCollege ? '₹0 (Host Student Free Waiver)' : `₹${Number(registration.totalAmount).toLocaleString('en-IN')}`}
              </span>
            </div>

            <div className="flex justify-between text-xs font-bold text-emerald-400 print:text-black">
              <span>Amount Paid:</span>
              <span className="font-mono font-bold text-emerald-300 print:text-black">
                ₹{Number(registration.paidAmount !== undefined ? registration.paidAmount : (registration.paymentConfirmed ? registration.totalAmount : 0)).toLocaleString('en-IN')}
              </span>
            </div>

            <div className="flex justify-between text-xs font-bold text-amber-300 print:text-black pt-1 border-t border-white/10 print:border-neutral-200">
              <span>Balance Due / Amount Pending:</span>
              <span className="font-mono font-bold text-amber-400 print:text-black">
                ₹{Number(registration.pendingAmount !== undefined ? registration.pendingAmount : Math.max(0, registration.totalAmount - (registration.paidAmount || 0))).toLocaleString('en-IN')}
              </span>
            </div>

            <div className="flex justify-between text-[11px] text-slate-400 print:text-neutral-600 pt-1 border-t border-white/5 print:border-neutral-200">
              <span>Ref / UTR: {registration.utrNumber || 'N/A'}</span>
              <span className="font-bold text-[#E6C57D] uppercase">
                Payment Status: {registration.college?.isHostCollege ? 'HOST WAIVER' : (registration.paymentStatus || (registration.pendingAmount === 0 ? 'PAID IN FULL' : 'ADVANCE PAID'))}
              </span>
            </div>
          </div>

          {/* Footer Seal */}
          <div className="pt-4 border-t border-white/10 print:border-neutral-300 flex items-center justify-between text-[11px] text-slate-400 print:text-neutral-600">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
              <span>Official Delegate Pass Pending Badge Check-in</span>
            </div>
            <span className="font-mono text-[10px]">SMCH Trichy · 2026</span>
          </div>

        </div>
      </div>
    </div>
  );
};
