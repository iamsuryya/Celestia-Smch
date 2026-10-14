import React from 'react';
import { ArrowRight, Compass, Calendar, MapPin, Clock } from 'lucide-react';
import { FESTIVAL_METADATA } from '../data/festivalData';

interface HeroProps {
  onExploreEvents: () => void;
  onOpenRegister: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onExploreEvents, onOpenRegister }) => {
  return (
    <section className="relative min-h-[70vh] sm:min-h-[85vh] flex flex-col justify-center items-center text-center px-4 sm:px-6 lg:px-8 pt-20 sm:pt-28 pb-8 sm:pb-16 overflow-hidden">
      <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center w-full">
        {/* Institution Kicker */}
        <div className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium tracking-widest text-[#E6C57D] uppercase mb-4 px-3.5 py-1.5 rounded-md border border-[#D4AF37]/20 bg-[#0E1538]/80 backdrop-blur-sm max-w-full text-center">
          <MapPin className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
          <span className="truncate">{FESTIVAL_METADATA.collegeName}, Trichy</span>
        </div>

        {/* Subtitle Above CELESTIA'26 */}
        <div className="text-center mb-4">
          <div className="text-[#E6C57D] font-extrabold uppercase tracking-[0.25em] text-center leading-tight drop-shadow-md">
            <span className="block text-base sm:text-xl md:text-2xl font-black">Inter</span>
            <span className="block text-base sm:text-xl md:text-2xl font-black">Collegiate</span>
            <span className="block text-xs sm:text-sm md:text-base font-bold text-[#F5E7C4] tracking-[0.3em] mt-1">Event</span>
          </div>
          <p className="text-[10px] sm:text-xs font-medium tracking-[0.2em] text-[#B8C0D9] uppercase mt-1">
            ANNUAL CULTURAL FESTIVAL · {FESTIVAL_METADATA.romanNumeral}
          </p>
        </div>

        {/* Grand Title */}
        <h1 className="font-cinzel text-4xl xs:text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tight leading-none mb-4 text-white drop-shadow-2xl max-w-full break-words">
          <span className="gold-gradient-text block">CELESTIA'26</span>
        </h1>

        {/* Theme Motto */}
        <div className="flex items-center justify-center gap-2.5 sm:gap-4 mb-6 max-w-full">
          <span className="h-[1px] w-6 sm:w-16 bg-gradient-to-r from-transparent to-[#D4AF37] shrink-0" />
          <h2 className="font-cinzel text-base sm:text-2xl md:text-3xl font-semibold tracking-[0.2em] sm:tracking-[0.25em] text-[#F3E5AB] text-center">
            "{FESTIVAL_METADATA.theme}"
          </h2>
          <span className="h-[1px] w-6 sm:w-16 bg-gradient-to-l from-transparent to-[#D4AF37] shrink-0" />
        </div>

        {/* Event Dates & Venue Metadata Line */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-sm sm:text-base text-slate-300 mb-4 max-w-2xl">
          <div className="flex items-center gap-1.5 font-semibold text-[#F5E7C4]">
            <Calendar className="w-4 h-4 text-[#D4AF37]" />
            <span>November 3 | 4 | 5, 2026</span>
          </div>
          <span className="text-slate-500" aria-hidden="true">·</span>
          <span>Trichy, Tamil Nadu</span>
        </div>

        {/* Configurable Registration Deadline Notice */}
        <div className="flex items-center gap-2 text-xs text-[#E6C57D] mb-8 px-3 py-1 rounded bg-[#D4AF37]/10 border border-[#D4AF37]/25">
          <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>Registration Deadline: <strong>{FESTIVAL_METADATA.registrationDeadlineFormatted}</strong></span>
        </div>

        {/* Interactive CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <button
            onClick={onOpenRegister}
            className="w-full sm:w-auto px-8 py-3.5 text-sm font-bold tracking-wider uppercase text-[#070B1B] bg-gradient-to-r from-[#F5E7C4] via-[#E6C57D] to-[#D4AF37] hover:brightness-110 active:scale-95 transition-all rounded-lg shadow-lg shadow-[#D4AF37]/25 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>REGISTER NOW</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onExploreEvents}
            className="w-full sm:w-auto px-8 py-3.5 text-sm font-semibold tracking-wider uppercase text-[#F5E7C4] hover:text-white bg-[#0E1538]/80 hover:bg-[#162152] border border-[#D4AF37]/40 hover:border-[#D4AF37] transition-all rounded-lg flex items-center justify-center gap-2 cursor-pointer backdrop-blur-md"
          >
            <Compass className="w-4 h-4 text-[#E6C57D]" />
            <span>EXPLORE EVENTS</span>
          </button>
        </div>
      </div>
    </section>
  );
};
