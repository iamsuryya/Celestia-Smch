import React from 'react';
import { Calendar, MapPin, Users, Download, ArrowUpRight, FileText } from 'lucide-react';
import { RegistrationSubmission } from '../../types/registration';
import { StatusBadge } from './StatusBadge';

interface RegistrationCardProps {
  registration: RegistrationSubmission;
  onViewReceipt: (registration: RegistrationSubmission) => void;
}

export const RegistrationCard: React.FC<RegistrationCardProps> = ({
  registration,
  onViewReceipt,
}) => {
  return (
    <div className="celestial-glass rounded-xl p-5 border border-white/10 hover:border-[#D4AF37]/40 transition-all flex flex-col justify-between group">
      <div>
        {/* Top line: Token & Submission date */}
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2.5 pb-2 border-b border-white/5">
          <span className="font-mono text-[#D4AF37] font-semibold text-[11px]">
            {registration.id}
          </span>
          <span className="text-slate-400 text-[11px] font-mono">
            {registration.createdAt}
          </span>
        </div>

        {/* Event Title & Category */}
        <h3 className="font-cinzel text-lg font-bold text-white group-hover:text-[#F5E7C4] transition-colors leading-snug">
          {registration.eventTitle}
        </h3>
        <div className="text-xs text-slate-400 mb-3 flex items-center gap-1.5 mt-0.5">
          <span>{registration.eventCategory}</span>
          <span aria-hidden="true">·</span>
          <span className="text-[#E6C57D] font-medium">{registration.eventType}</span>
        </div>

        {/* Team / Participant Info */}
        <div className="p-3 rounded-lg bg-[#070B1E]/70 border border-white/5 text-xs text-slate-300 space-y-1 mb-4">
          <div className="flex justify-between">
            <span className="text-slate-400">Entry / Team:</span>
            <span className="font-semibold text-white truncate max-w-[180px]">
              {registration.teamName || registration.participants[0]?.fullName}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Members:</span>
            <span className="text-slate-200">{registration.participants.length} participant(s)</span>
          </div>
          <div className="flex justify-between pt-1 border-t border-white/5">
            <span className="text-slate-400">Amount:</span>
            <div className="text-right">
              <span className="font-mono font-bold text-[#F5E7C4]">₹{registration.totalAmount.toLocaleString('en-IN')}</span>
              {registration.promoCode && (
                <span className="block text-[10px] text-emerald-400 font-mono">
                  Code: {registration.promoCode} ({registration.discountPercent}% OFF)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Statuses Badges */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-slate-500 block mb-0.5">Payment</span>
            <StatusBadge type="payment" status={registration.paymentStatus} />
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 block mb-0.5">Registration</span>
            <StatusBadge type="registration" status={registration.registrationStatus} />
          </div>
        </div>
      </div>

      {/* Action: View & Download Receipt */}
      <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onViewReceipt(registration)}
          className="w-full py-2 px-3 text-xs font-semibold text-[#F5E7C4] hover:text-white bg-[#0F173C] hover:bg-[#162152] border border-[#D4AF37]/35 rounded-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <FileText className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>View Official Receipt</span>
        </button>
      </div>
    </div>
  );
};
