import React from 'react';
import { Building2, Calendar, Users, CreditCard, Edit3, ArrowLeft, ArrowRight, ShieldCheck, MapPin } from 'lucide-react';
import { useRegistration } from '../../context/RegistrationContext';

export const RegistrationReview: React.FC = () => {
  const { 
    selectedEvent, 
    collegeDetails, 
    participants, 
    teamName, 
    calculateTotalFee, 
    calculateDiscountAmount,
    appliedPromoCode,
    goToStep 
  } = useRegistration();

  if (!selectedEvent || !collegeDetails) {
    return (
      <div className="max-w-md mx-auto text-center py-12 text-slate-300">
        <p>Incomplete registration details. Please restart from step 1.</p>
        <button
          onClick={() => goToStep('event')}
          className="mt-4 px-4 py-2 bg-[#D4AF37] text-[#070B1B] rounded font-semibold text-xs"
        >
          Select Event
        </button>
      </div>
    );
  }

  const isHost = Boolean(collegeDetails.isHostCollege);
  const baseFee = isHost ? 0 : (selectedEvent.feeType === 'per_head' ? selectedEvent.feeAmount * Math.max(participants.length, 1) : selectedEvent.feeAmount);
  const discountAmount = isHost ? 0 : calculateDiscountAmount(selectedEvent, participants.length);
  const totalFee = isHost ? 0 : calculateTotalFee(selectedEvent, participants.length);

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 space-y-6">
      
      {/* Header */}
      <div className="text-center max-w-xl mx-auto">
        <div className="text-[11px] font-mono text-[#D4AF37] uppercase tracking-wider mb-1">
          Step 5 · Verification & Summary
        </div>
        <h2 className="font-cinzel text-2xl sm:text-4xl font-bold text-white mb-2">
          Registration Review
        </h2>
        <p className="text-xs sm:text-sm text-slate-300">
          Please verify your institutional affiliation, competition roster, and fee calculation before moving to payment.
        </p>
      </div>

      <div className="space-y-5">
        
        {/* 1. COLLEGE SECTION */}
        <div className="celestial-glass rounded-xl p-5 sm:p-6 border border-white/10 relative">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/5">
            <h3 className="font-cinzel text-sm font-bold text-[#F5E7C4] flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#D4AF37]" />
              <span>COLLEGE DETAILS</span>
            </h3>
            <button
              type="button"
              onClick={() => goToStep('college')}
              className="text-xs text-[#E6C57D] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs sm:text-sm">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Institution</span>
              <span className="font-semibold text-white mt-0.5 block">{collegeDetails.collegeName}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Location</span>
              <span className="text-slate-200 mt-0.5 block">{collegeDetails.city}, {collegeDetails.state}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Representative</span>
              <span className="text-slate-200 mt-0.5 block">{collegeDetails.contactPerson} ({collegeDetails.contactMobile})</span>
            </div>
          </div>

          {collegeDetails.isHostCollege && (
            <div className="mt-3.5 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 bg-[#080D24]/60 p-2.5 rounded-lg border border-[#D4AF37]/30">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  SMCH Host Student Waiver
                </span>
                <span className="text-xs text-slate-200">
                  Reg No: <strong className="font-mono text-[#F5E7C4]">{collegeDetails.hostRegisterNumber || 'Provided'}</strong>
                </span>
                <span className="text-slate-400 text-xs">·</span>
                <span className="text-xs text-slate-200">
                  Batch: <strong className="text-white">{collegeDetails.hostBatch || 'N/A'}</strong>
                </span>
              </div>
              {collegeDetails.hostDepartment && (
                <span className="text-[11px] text-slate-400 font-mono">
                  {collegeDetails.hostDepartment}
                </span>
              )}
            </div>
          )}
        </div>

        {/* 2. EVENT SECTION */}
        <div className="celestial-glass rounded-xl p-5 sm:p-6 border border-white/10 relative">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/5">
            <h3 className="font-cinzel text-sm font-bold text-[#F5E7C4] flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#D4AF37]" />
              <span>EVENT DETAILS</span>
            </h3>
            <button
              type="button"
              onClick={() => goToStep('event')}
              className="text-xs text-[#E6C57D] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs sm:text-sm">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Event Name & Code</span>
              <span className="font-semibold text-white mt-0.5 block">{selectedEvent.title} ({selectedEvent.code})</span>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Category</span>
              <span className="text-slate-200 mt-0.5 block">{selectedEvent.categoryDisplay}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Registration Type</span>
              <span className="text-slate-200 mt-0.5 block">{selectedEvent.type}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Venue</span>
              <span className="text-slate-200 mt-0.5 block">{selectedEvent.venue}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Date</span>
              <span className="text-slate-200 mt-0.5 block">November 3, 4 & 5, 2026</span>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Duration</span>
              <span className="text-slate-200 mt-0.5 block">{selectedEvent.duration}</span>
            </div>
          </div>
        </div>

        {/* 3. PARTICIPANTS SECTION */}
        <div className="celestial-glass rounded-xl p-5 sm:p-6 border border-white/10 relative">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/5">
            <h3 className="font-cinzel text-sm font-bold text-[#F5E7C4] flex items-center gap-2">
              <Users className="w-4 h-4 text-[#D4AF37]" />
              <span>PARTICIPANTS ROSTER ({participants.length})</span>
            </h3>
            <button
              type="button"
              onClick={() => goToStep('participants')}
              className="text-xs text-[#E6C57D] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
          </div>

          {teamName && (
            <div className="mb-3 text-xs text-[#F5E7C4]">
              <strong>Team / Entry Name:</strong> {teamName}
            </div>
          )}

          <div className="space-y-2.5">
            {participants.map((m, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-[#070B1E]/70 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div>
                  <span className="font-semibold text-white mr-2">
                    #{idx + 1} {m.fullName}
                  </span>
                  <span className="text-slate-400 font-mono">({m.gender}, Age {m.age})</span>
                  {idx === 0 && m.idCardFileName && (
                    <span className="text-[#D4AF37] block sm:inline sm:ml-2 font-mono text-[11px]">
                      · ID Card: {m.idCardFileName}
                    </span>
                  )}
                </div>
                <div className="text-slate-400 font-mono text-[11px]">
                  <span>{m.mobile}</span>
                  {m.email && <span> · {m.email}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4. PAYMENT CALCULATION SECTION */}
        <div className="celestial-glass rounded-xl p-5 sm:p-6 border border-[#D4AF37]/35 bg-[#0C1230]">
          <h3 className="font-cinzel text-sm font-bold text-[#F5E7C4] flex items-center gap-2 pb-3 mb-3 border-b border-white/5">
            <CreditCard className="w-4 h-4 text-[#D4AF37]" />
            <span>PAYMENT BREAKDOWN</span>
          </h3>

          <div className="space-y-2 text-xs sm:text-sm text-slate-300">
            <div className="flex justify-between">
              <span>Event Base Rate:</span>
              <span className="font-medium text-white">{selectedEvent.registrationFee}</span>
            </div>
            <div className="flex justify-between">
              <span>Fee Structure Type:</span>
              <span className="text-[#E6C57D] capitalize font-mono">
                {selectedEvent.feeType === 'per_head' ? 'Per Participant Head' : 'Flat Team Entry Fee'}
              </span>
            </div>
            {selectedEvent.feeType === 'per_head' && (
              <div className="flex justify-between">
                <span>Total Registered Participants:</span>
                <span className="font-medium text-white">{participants.length} member(s)</span>
              </div>
            )}

            {collegeDetails.isHostCollege ? (
              <div className="p-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 mt-2 space-y-1">
                <div className="flex justify-between font-bold text-xs sm:text-sm">
                  <span>SMCH Host College Student Waiver:</span>
                  <span>100% OFF (₹0.00)</span>
                </div>
                <p className="text-[11px] text-emerald-200">
                  Host student privilege applied: registration fee is waived to ₹0. Physical college ID card verification required at central fest desk.
                </p>
              </div>
            ) : null}

            {!isHost && appliedPromoCode && (
              <div className="p-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 my-2 space-y-1">
                <div className="flex justify-between font-bold text-xs sm:text-sm">
                  <span>Applied Promo Code ({appliedPromoCode.code}):</span>
                  <span>-{appliedPromoCode.discountPercent}% OFF (-₹{discountAmount.toLocaleString('en-IN')})</span>
                </div>
                <p className="text-[11px] text-emerald-200">
                  {appliedPromoCode.description || `${appliedPromoCode.discountPercent}% promotional discount applied.`}
                </p>
              </div>
            )}

            <div className="pt-3 border-t border-white/10 flex justify-between items-center text-base sm:text-lg">
              <span className="font-cinzel font-bold text-white">
                {appliedPromoCode ? 'Revised Amount Payable:' : 'Total Amount Payable:'}
              </span>
              <span className={`font-cinzel font-extrabold text-xl sm:text-2xl tabular-nums ${
                collegeDetails.isHostCollege ? 'text-emerald-400' : 'gold-gradient-text'
              }`}>
                {collegeDetails.isHostCollege ? '₹0 (FREE ENTRY)' : `₹${totalFee.toLocaleString('en-IN')}`}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Review Actions */}
      <div className="pt-6 border-t border-white/10 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => goToStep('participants')}
          className="py-2.5 px-4 text-xs font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Roster</span>
        </button>

        <button
          type="button"
          onClick={() => goToStep('payment')}
          className="py-3 px-7 text-xs font-bold tracking-wider uppercase text-[#070B1B] bg-gradient-to-r from-[#F5E7C4] via-[#E6C57D] to-[#D4AF37] hover:brightness-110 active:scale-95 rounded-lg transition-all shadow-md shadow-[#D4AF37]/25 flex items-center gap-2 cursor-pointer"
        >
          <span>{collegeDetails.isHostCollege ? 'Proceed to Host Verification (₹0)' : 'Confirm & Proceed to Payment'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
