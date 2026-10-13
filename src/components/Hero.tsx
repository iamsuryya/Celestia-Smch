import React from 'react';
import { ArrowRight, Compass, Calendar, MapPin, Sparkles, Clock } from 'lucide-react';
import { FESTIVAL_METADATA } from '../data/festivalData';

interface HeroProps {
  onExploreEvents: () => void;
  onOpenRegister: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onExploreEvents, onOpenRegister }) => {
  return (
    <section className="relative min-h-[75vh] sm:min-h-[90vh] flex flex-col justify-center items-center text-center px-4 sm:px-6 lg:px-8 pt-20 sm:pt-32 pb-8 sm:pb-16 overflow-hidden">
      {/* Central Celestial Astrolabe / Orbital Ring visual element */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] sm:w-[540px] md:w-[720px] aspect-square rounded-full pointer-events-none opacity-40">
        <div className="w-full h-full rounded-full border border-[#D4AF37]/25 relative animate-orbit">
          {/* Planetary node */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-gradient-to-r from-[#F5E7C4] to-[#D4AF37] shadow-lg shadow-[#D4AF37]/50" />
          <div className="absolute bottom-12 right-12 w-2.5 h-2.5 rounded-full bg-[#93C5FD] shadow-md shadow-[#93C5FD]/40" />
        </div>
      </div>

      {/* Decorative Crescent Moon & Constellation motif */}
      <div className="absolute top-20 right-8 sm:right-24 w-16 h-16 sm:w-24 sm:h-24 opacity-30 pointer-events-none">
        <svg viewBox="0 0 100 100" className="w-full h-full fill-none stroke-[#D4AF37] stroke-[1.5]">
          <path d="M50,15 A35,35 0 0,0 85,50 A35,35 0 0,1 50,15" fill="rgba(212,175,55,0.15)" />
          <circle cx="25" cy="40" r="1.5" fill="#FFF7D6" />
          <circle cx="35" cy="30" r="2" fill="#D4AF37" />
          <line x1="25" y1="40" x2="35" y2="30" stroke="rgba(212,175,55,0.3)" strokeWidth="0.8" />
        </svg>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center w-full">
        {/* Institution Kicker */}
        <div className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium tracking-widest text-[#E6C57D] uppercase mb-4 px-3.5 py-1.5 rounded-md border border-[#D4AF37]/20 bg-[#0E1538]/80 backdrop-blur-sm max-w-full text-center">
          <MapPin className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
          <span className="truncate">{FESTIVAL_METADATA.collegeName}, Trichy</span>
        </div>

        {/* Edition Subtitle / Tagline */}
        <p className="text-[11px] sm:text-xs md:text-sm font-semibold tracking-[0.25em] sm:tracking-[0.3em] uppercase text-[#B8C0D9] mb-3 max-w-full">
          ANNUAL INTERCOLLEGIATE CULTURAL FESTIVAL · {FESTIVAL_METADATA.romanNumeral}
        </p>

        {/* Grand Title - carefully sized to prevent clipping or awkward breaks */}
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

        {/* Event Dates & Venue Metadata Line (Clean, unboxed) */}
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
