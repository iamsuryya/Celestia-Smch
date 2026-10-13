import React from 'react';
import { Sparkles, Calendar, MapPin, ArrowRight, UserCheck, ShieldCheck, Clock, LogOut, Phone } from 'lucide-react';
import { FESTIVAL_METADATA } from '../../data/festivalData';
import { useRegistration } from '../../context/RegistrationContext';

export const RegistrationLanding: React.FC = () => {
  const { currentUser, goToStep, myRegistrations, logoutUser } = useRegistration();

  const handleStart = () => {
    if (currentUser) {
      goToStep('college');
    } else {
      goToStep('account');
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="celestial-glass rounded-3xl p-8 sm:p-14 border border-[#D4AF37]/35 shadow-2xl text-center relative overflow-hidden">
        {/* Decorative corner accents */}
        <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-[#D4AF37]/50 pointer-events-none" />
        <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-[#D4AF37]/50 pointer-events-none" />
        <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-[#D4AF37]/50 pointer-events-none" />
        <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-[#D4AF37]/50 pointer-events-none" />

        {/* Badge & Edition */}
        <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-[#D4AF37] mb-3 px-3 py-1.5 rounded-md bg-[#0C122D] border border-[#D4AF37]/20">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{FESTIVAL_METADATA.edition} · {FESTIVAL_METADATA.romanNumeral}</span>
        </div>

        {/* Title */}
        <h1 className="font-cinzel text-3xl sm:text-5xl font-black text-white mb-3 tracking-tight">
          Register for <span className="gold-gradient-text">Celestia'26</span>
        </h1>

        {/* Dates & Location */}
        <div className="flex flex-wrap items-center justify-center gap-3 text-xs sm:text-sm text-slate-300 mb-6">
          <span className="flex items-center gap-1.5 font-semibold text-[#F5E7C4]">
            <Calendar className="w-4 h-4 text-[#D4AF37]" />
            {FESTIVAL_METADATA.datesFormatted}
          </span>
          <span className="text-slate-500" aria-hidden="true">·</span>
          <span className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" />
            {FESTIVAL_METADATA.collegeName}, Trichy
          </span>
        </div>

        {/* Deadline Alert (Configurable) */}
        <div className="inline-flex items-center gap-2 text-xs text-[#E6C57D] mb-5 px-3.5 py-1.5 rounded-lg bg-[#0F173C] border border-[#D4AF37]/30">
          <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>Registration Deadline: <strong>{FESTIVAL_METADATA.registrationDeadlineFormatted}</strong></span>
        </div>

        {/* Registration Query & Error Support Banner */}
        <div className="mb-6 p-3 rounded-xl bg-[#0B1333] border border-[#D4AF37]/30 text-xs sm:text-sm text-slate-200 flex items-center justify-center gap-2">
          <Phone className="w-4 h-4 text-[#D4AF37] shrink-0" />
          <span>For any query during registration or any error, contact Surya Narayan: <a href="tel:8075970766" className="font-mono text-[#F5E7C4] underline hover:text-white">8075970766</a></span>
        </div>

        {/* Simple explanation mandated in prompt */}
        <p className="text-base sm:text-lg text-slate-200 font-medium mb-8 max-w-lg mx-auto leading-relaxed">
          "Register individually or represent your college as a team."
        </p>

        {/* User Status Bar if logged in */}
        {currentUser && (
          <div className="mb-8 p-4 rounded-xl bg-[#090E25] border border-white/10 text-xs sm:text-sm text-left flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#121B3D] border border-[#D4AF37]/40 flex items-center justify-center text-[#F5E7C4] font-bold">
                {currentUser.fullName.charAt(0).toUpperCase()}
              </div>
              <div>
                <span className="text-slate-400 text-xs block">Logged in as</span>
                <span className="text-white font-semibold">{currentUser.fullName} ({currentUser.email})</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => goToStep('dashboard')}
                className="text-xs font-semibold text-[#D4AF37] hover:underline cursor-pointer"
              >
                My Dashboard ({myRegistrations.length} registrations) →
              </button>
              <button
                onClick={logoutUser}
                className="text-xs text-rose-300 hover:text-white bg-rose-500/15 hover:bg-rose-500/25 px-2.5 py-1 rounded-md border border-rose-500/30 transition-colors flex items-center gap-1 cursor-pointer"
                title="Sign out of current account"
              >
                <LogOut className="w-3 h-3 text-rose-400" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}

        {/* Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
          <button
            onClick={handleStart}
            className="w-full sm:w-auto px-8 py-3.5 text-xs sm:text-sm font-bold tracking-wider uppercase text-[#070B1B] bg-gradient-to-r from-[#F5E7C4] via-[#E6C57D] to-[#D4AF37] hover:brightness-110 active:scale-95 transition-all rounded-lg shadow-lg shadow-[#D4AF37]/25 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{currentUser ? 'Continue Registration' : 'Continue Registration'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {!currentUser ? (
            <button
              onClick={() => goToStep('account')}
              className="w-full sm:w-auto px-7 py-3.5 text-xs sm:text-sm font-semibold tracking-wider uppercase text-[#F5E7C4] hover:text-white bg-[#0D1438] hover:bg-[#152054] border border-[#D4AF37]/35 rounded-lg transition-all cursor-pointer"
            >
              Login / Create Account
            </button>
          ) : (
            <button
              onClick={() => goToStep('dashboard')}
              className="w-full sm:w-auto px-7 py-3.5 text-xs sm:text-sm font-semibold tracking-wider uppercase text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all cursor-pointer"
            >
              Participant Dashboard
            </button>
          )}
        </div>

        {/* Reassurance notes */}
        <div className="mt-10 pt-6 border-t border-white/5 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-400">
          <div className="flex items-center justify-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Single account for all events</span>
          </div>
          <div className="flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Reusable college profile</span>
          </div>
          <div className="flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Official digital receipts</span>
          </div>
        </div>
      </div>
    </div>
  );
};
