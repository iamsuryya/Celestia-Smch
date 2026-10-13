import { Sparkles, User, Award, Shield, ArrowRight } from 'lucide-react';
import { GuestItem, MAIN_GUESTS_DATA } from '../data/guestsData';
import { GuestPhotoUploader } from './GuestPhotoUploader';

interface DistinguishedGuestsProps {
  guests?: GuestItem[];
  onViewAllGuests?: () => void;
}

export const DistinguishedGuests: React.FC<DistinguishedGuestsProps> = ({ 
  guests = MAIN_GUESTS_DATA,
  onViewAllGuests,
}) => {
  return (
    <section className="py-12 sm:py-16 px-4 sm:px-6 max-w-6xl mx-auto relative">
      {/* Subtle cosmic ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-64 bg-radial from-[#D4AF37]/5 to-transparent rounded-full pointer-events-none" />

      {/* Section Header */}
      <div className="text-center mb-10 sm:mb-12 relative z-10">
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-widest uppercase text-[#D4AF37] mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Our Honoured Guests</span>
        </div>
        <h2 className="font-cinzel text-2xl sm:text-4xl font-bold text-white tracking-wide">
          DISTINGUISHED GUESTS
        </h2>
        <div className="flex items-center justify-center gap-3 mt-3">
          <span className="h-[1px] w-12 bg-gradient-to-r from-transparent to-[#D4AF37]/50" />
          <span className="text-[11px] text-[#F5E7C4]/70 font-mono uppercase tracking-widest">
            Celestia'26 Dignitaries
          </span>
          <span className="h-[1px] w-12 bg-gradient-to-l from-transparent to-[#D4AF37]/50" />
        </div>
      </div>

      {/* Two Large Premium Guest Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 relative z-10">
        {guests.slice(0, 2).map((guest, idx) => (
          <div
            key={guest.id}
            className="celestial-glass rounded-2xl p-6 sm:p-8 border border-[#D4AF37]/35 bg-[#080D24]/90 relative overflow-hidden group hover:border-[#D4AF37]/60 transition-all duration-300 shadow-xl"
          >
            {/* Subtle ornamental corner brackets */}
            <div className="absolute top-2.5 left-2.5 w-3.5 h-3.5 border-t border-l border-[#D4AF37]/50 pointer-events-none" />
            <div className="absolute top-2.5 right-2.5 w-3.5 h-3.5 border-t border-r border-[#D4AF37]/50 pointer-events-none" />
            <div className="absolute bottom-2.5 left-2.5 w-3.5 h-3.5 border-b border-l border-[#D4AF37]/50 pointer-events-none" />
            <div className="absolute bottom-2.5 right-2.5 w-3.5 h-3.5 border-b border-r border-[#D4AF37]/50 pointer-events-none" />

            {/* Soft celestial radial backdrop */}
            <div className="absolute -top-12 -right-12 w-44 h-44 bg-radial from-[#D4AF37]/10 to-transparent rounded-full pointer-events-none" />

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
              {/* Premium Portrait Presentation with Instant Uploader */}
              <div className="relative shrink-0">
                {/* Soft celestial halo ring */}
                <div className="w-32 h-40 sm:w-36 sm:h-44 rounded-xl border border-[#D4AF37]/40 bg-[#0B1233] relative overflow-hidden shadow-lg flex items-center justify-center p-1.5">
                  <div className="w-full h-full rounded-lg bg-[#070B1E] border border-white/5 relative overflow-hidden">
                    <GuestPhotoUploader
                      guestId={guest.id}
                      guestName={guest.name}
                      defaultPhoto={guest.photo}
                      variant="large"
                      role={guest.role}
                    />

                    {/* Subtle constellation starlight dots */}
                    <div className="absolute top-2 right-2 w-1 h-1 rounded-full bg-[#FFF7D6] opacity-60 pointer-events-none" />
                    <div className="absolute bottom-3 left-3 w-1 h-1 rounded-full bg-[#D4AF37] opacity-60 pointer-events-none" />
                  </div>
                </div>

                {/* Subtle role tag below photo */}
                <div className="text-center mt-2">
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-widest text-[#E6C57D] bg-[#D4AF37]/15 border border-[#D4AF37]/30">
                    {guest.role || (idx === 0 ? 'Chief Guest' : 'Guest of Honour')}
                  </span>
                </div>
              </div>

              {/* Dignitary Details */}
              <div className="text-center sm:text-left space-y-2.5 flex-1 min-w-0">
                <div className="inline-flex items-center gap-1.5 text-[11px] font-mono text-[#D4AF37] uppercase tracking-wider">
                  <Award className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Main Guest {idx + 1}</span>
                </div>

                {/* Name */}
                <h3 className="font-cinzel text-xl sm:text-2xl font-bold text-white group-hover:text-[#F5E7C4] transition-colors leading-snug">
                  <span className="gold-gradient-text block">
                    {guest.name}
                  </span>
                </h3>

                {/* Designation */}
                <div className="pt-1 border-t border-white/5 space-y-1">
                  <p className="text-xs sm:text-sm font-medium text-[#F5E7C4] leading-relaxed">
                    {guest.designation}
                  </p>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {guest.institution}
                  </p>
                </div>

                {/* Dignity Seal */}
                <div className="pt-2 flex items-center justify-center sm:justify-start gap-1.5 text-[11px] text-slate-400 font-mono">
                  <Shield className="w-3.5 h-3.5 text-[#D4AF37]/80" />
                  <span>Srinivasan Medical College & Hospital · 2026</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Mention below 2 guests: Others guests will be updated shortly */}
      <div className="mt-8 text-center relative z-10 max-w-2xl mx-auto">
        <div className="p-4 sm:p-5 rounded-xl bg-[#080D24]/90 border border-[#D4AF37]/30 celestial-glass shadow-lg">
          <div className="flex items-center justify-center gap-2 text-xs sm:text-sm font-cinzel font-bold text-white tracking-wide">
            <Sparkles className="w-4 h-4 text-[#E6C57D]" />
            <span>Others guests will be updated shortly</span>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-1">
            Stay tuned as we unveil the full roster of jury evaluators, celebrity artists, and festival patrons.
          </p>
        </div>
      </div>

      {onViewAllGuests && (
        <div className="text-center mt-6 relative z-10">
          <button
            onClick={onViewAllGuests}
            className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-[#E6C57D] hover:text-white transition-colors cursor-pointer border-b border-[#D4AF37]/30 pb-0.5 hover:border-[#D4AF37]"
          >
            <span>View Celestia'26 Guests Page</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </section>
  );
};
