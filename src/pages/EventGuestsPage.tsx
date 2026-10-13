import React from 'react';
import { Sparkles, Calendar, Award, Shield, ArrowRight } from 'lucide-react';
import { MAIN_GUESTS_DATA } from '../data/guestsData';
import { NavigationPage } from '../components/Navbar';
import { GuestPhotoUploader } from '../components/GuestPhotoUploader';

interface EventGuestsPageProps {
  onNavigate?: (page: NavigationPage) => void;
  onOpenRegister?: () => void;
}

export const EventGuestsPage: React.FC<EventGuestsPageProps> = ({
  onNavigate,
  onOpenRegister,
}) => {

  return (
    <div className="relative z-10 pt-20 sm:pt-28 pb-12 sm:pb-20 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Page Header matching Celestia'26 Dignitaries specification */}
      <div className="text-center max-w-3xl mx-auto mb-6 sm:mb-12">
        <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-[#D4AF37] mb-1.5 sm:mb-2.5">
          <Sparkles className="w-4 h-4 text-[#E6C57D]" />
          <span>FESTIVAL DIGNITARIES</span>
        </div>
        <h1 className="font-cinzel text-2xl sm:text-5xl font-bold text-white mb-2 sm:mb-3 tracking-wide">
          CELESTIA'26 GUEST LINE-UP
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
          Honoured to welcome our distinguished guests across three unforgettable days.
        </p>
      </div>

      {/* SECTION 1: TWO MAIN / DISTINGUISHED GUESTS */}
      <section className="mb-10 sm:mb-14">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-widest uppercase text-[#D4AF37] mb-1.5">
            <Award className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Our Honoured Guests</span>
          </div>
          <h2 className="font-cinzel text-xl sm:text-3xl font-bold text-white tracking-wide">
            DISTINGUISHED GUESTS
          </h2>
          <div className="flex items-center justify-center gap-3 mt-2.5">
            <span className="h-[1px] w-12 bg-gradient-to-r from-transparent to-[#D4AF37]/50" />
            <span className="text-[11px] text-[#F5E7C4]/70 font-mono uppercase tracking-widest">
              Celestia'26 Patrons of Honour
            </span>
            <span className="h-[1px] w-12 bg-gradient-to-l from-transparent to-[#D4AF37]/50" />
          </div>
        </div>

        {/* Two Large Premium Guest Cards matching Homepage */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-5xl mx-auto">
          {MAIN_GUESTS_DATA.slice(0, 2).map((guest, idx) => (
            <div
              key={guest.id}
              className="celestial-glass rounded-2xl p-6 sm:p-8 border border-[#D4AF37]/40 bg-[#080D24]/90 relative overflow-hidden group hover:border-[#D4AF37]/70 transition-all duration-300 shadow-xl"
            >
              {/* Subtle ornamental corner brackets */}
              <div className="absolute top-2.5 left-2.5 w-3.5 h-3.5 border-t border-l border-[#D4AF37]/60 pointer-events-none" />
              <div className="absolute top-2.5 right-2.5 w-3.5 h-3.5 border-t border-r border-[#D4AF37]/60 pointer-events-none" />
              <div className="absolute bottom-2.5 left-2.5 w-3.5 h-3.5 border-b border-l border-[#D4AF37]/60 pointer-events-none" />
              <div className="absolute bottom-2.5 right-2.5 w-3.5 h-3.5 border-b border-r border-[#D4AF37]/60 pointer-events-none" />

              {/* Soft celestial radial glow */}
              <div className="absolute -top-12 -right-12 w-48 h-48 bg-radial from-[#D4AF37]/15 to-transparent rounded-full pointer-events-none" />

              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
                {/* Premium Portrait Frame with Instant Uploader */}
                <div className="relative shrink-0">
                  <div className="w-32 h-40 sm:w-36 sm:h-44 rounded-xl border border-[#D4AF37]/50 bg-[#0B1233] relative overflow-hidden shadow-lg flex items-center justify-center p-1.5">
                    <div className="w-full h-full rounded-lg bg-[#070B1E] border border-white/5 relative overflow-hidden">
                      <GuestPhotoUploader
                        guestId={guest.id}
                        guestName={guest.name}
                        defaultPhoto={guest.photo}
                        variant="large"
                        role={guest.role}
                      />

                      {/* Subtle celestial stars */}
                      <div className="absolute top-2 right-2 w-1 h-1 rounded-full bg-[#FFF7D6] opacity-70 pointer-events-none" />
                      <div className="absolute bottom-3 left-3 w-1 h-1 rounded-full bg-[#D4AF37] opacity-70 pointer-events-none" />
                    </div>
                  </div>

                  {/* Role Tag */}
                  <div className="text-center mt-2.5">
                    <span className="inline-block px-3 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-widest text-[#E6C57D] bg-[#D4AF37]/15 border border-[#D4AF37]/35 shadow-sm">
                      {guest.role || (idx === 0 ? 'Chief Guest' : 'Guest of Honour')}
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="text-center sm:text-left space-y-2 flex-1 min-w-0">
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-mono text-[#D4AF37] uppercase tracking-wider">
                    <Shield className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Main Guest 0{idx + 1}</span>
                  </div>

                  <h3 className="font-cinzel text-xl sm:text-2xl font-bold text-white group-hover:text-[#F5E7C4] transition-colors leading-snug">
                    <span className="gold-gradient-text block">
                      {guest.name}
                    </span>
                  </h3>

                  <p className="text-xs sm:text-sm text-[#F5E7C4] font-medium leading-relaxed">
                    {guest.designation}
                  </p>

                  <p className="text-xs text-slate-300 leading-relaxed pt-0.5">
                    {guest.institution}
                  </p>

                  <div className="pt-3 border-t border-white/10 flex items-center justify-center sm:justify-start gap-2 text-[11px] font-mono text-slate-400">
                    <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>November 3, 2026 • Inaugural Ceremony</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 2: AFTER 2 GUESTS - OTHERS GUESTS WILL BE UPDATED SHORTLY */}
      <section className="mb-14 max-w-4xl mx-auto">
        <div className="celestial-glass rounded-2xl p-8 sm:p-12 border border-[#D4AF37]/35 bg-[#080D24]/85 text-center relative overflow-hidden shadow-2xl">
          {/* Cosmic ambient glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-48 bg-radial from-[#D4AF37]/10 to-transparent rounded-full pointer-events-none" />

          {/* Ornamental corner brackets */}
          <div className="absolute top-3 left-3 w-4 h-4 border-t border-l border-[#D4AF37]/40 pointer-events-none" />
          <div className="absolute top-3 right-3 w-4 h-4 border-t border-r border-[#D4AF37]/40 pointer-events-none" />
          <div className="absolute bottom-3 left-3 w-4 h-4 border-b border-l border-[#D4AF37]/40 pointer-events-none" />
          <div className="absolute bottom-3 right-3 w-4 h-4 border-b border-r border-[#D4AF37]/40 pointer-events-none" />

          <div className="relative z-10">
            <div className="w-14 h-14 rounded-full bg-[#10183B] border border-[#D4AF37]/45 flex items-center justify-center mx-auto mb-4 text-[#E6C57D] shadow-lg shadow-[#D4AF37]/15">
              <Sparkles className="w-7 h-7 text-[#D4AF37]" />
            </div>

            <h3 className="font-cinzel text-xl sm:text-3xl font-bold text-white mb-3 tracking-wide">
              Others guests will be updated shortly
            </h3>

            <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
              The full roster of daily dignitaries, star performers, celebrity jury evaluators, and cultural adjudicators across all three festival days will be officially announced shortly.
            </p>

            <div className="flex items-center justify-center gap-3 mt-6">
              <span className="h-[1px] w-14 bg-gradient-to-r from-transparent to-[#D4AF37]/50" />
              <span className="text-[11px] text-[#F5E7C4]/80 font-mono uppercase tracking-widest">
                Srinivasan Medical College & Hospital · Celestia '26
              </span>
              <span className="h-[1px] w-14 bg-gradient-to-l from-transparent to-[#D4AF37]/50" />
            </div>
          </div>
        </div>
      </section>

      {/* Footer Navigation CTA */}
      <section className="mt-16 pt-10 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="font-cinzel text-base font-bold text-white">
            Plan your attendance for Celestia'26
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Check the schedule for inaugural keynotes, jury evaluations, and valedictory awards.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {onNavigate && (
            <button
              onClick={() => onNavigate('schedule')}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-[#F5E7C4] bg-white/5 border border-white/10 hover:border-[#D4AF37]/40 transition-colors cursor-pointer"
            >
              View 3-Day Schedule
            </button>
          )}

          {onOpenRegister && (
            <button
              onClick={onOpenRegister}
              className="px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider text-[#080D24] bg-gradient-to-r from-[#F5E7C4] to-[#D4AF37] hover:brightness-110 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>Register Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </section>
    </div>
  );
};
