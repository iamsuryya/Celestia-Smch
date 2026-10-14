import React from 'react';
import { ArrowRight, Calendar, MapPin, Users, Sparkles, Star } from 'lucide-react';
import { FESTIVAL_METADATA } from '../data/festivalData';

interface HeroProps {
  onExploreEvents: () => void;
  onOpenRegister: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onExploreEvents, onOpenRegister }) => {
  return (
    <section className="relative min-h-[85vh] sm:min-h-[92vh] flex flex-col justify-center items-center text-center px-4 sm:px-6 lg:px-8 pt-20 sm:pt-28 pb-12 sm:pb-20 overflow-hidden">
      {/* Central Rotating Celestial Astrolabe / Solar System Rings */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] sm:w-[620px] md:w-[840px] aspect-square rounded-full pointer-events-none opacity-50">
        <div className="w-full h-full rounded-full border border-[#D4AF37]/30 relative animate-orbit">
          {/* Planetary nodes */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 sm:w-5 h-4 sm:h-5 rounded-full bg-gradient-to-r from-[#FFF7D6] via-[#F5E7C4] to-[#D4AF37] shadow-lg shadow-[#D4AF37]/60" />
          <div className="absolute bottom-16 right-16 w-3 h-3 rounded-full bg-[#93C5FD] shadow-md shadow-[#93C5FD]/50" />
          <div className="absolute top-1/4 left-8 w-2.5 h-2.5 rounded-full bg-[#C084FC] shadow-md shadow-[#C084FC]/50" />
        </div>
        <div className="absolute inset-8 rounded-full border border-dashed border-[#818CF8]/25 animate-orbit-reverse">
          <div className="absolute top-8 right-12 w-3.5 h-3.5 rounded-full bg-[#FCD34D] shadow-md shadow-[#FCD34D]/50" />
        </div>
        <div className="absolute inset-20 rounded-full border border-[#D4AF37]/20" />
      </div>

      {/* Floating Sparkle Stars around title */}
      <div className="absolute top-12 left-[12%] text-[#D4AF37]/70 animate-star-twinkle hidden sm:block pointer-events-none">
        <Sparkles className="w-6 h-6" />
      </div>
      <div className="absolute top-24 right-[15%] text-[#F5E7C4]/80 animate-star-twinkle [animation-delay:1.5s] hidden sm:block pointer-events-none">
        <Star className="w-5 h-5 fill-[#F5E7C4]/30" />
      </div>
      <div className="absolute bottom-20 left-[18%] text-[#93C5FD]/70 animate-star-twinkle [animation-delay:0.8s] hidden sm:block pointer-events-none">
        <Sparkles className="w-5 h-5" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center w-full">
        {/* Solar System Celestial Crest Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full celestial-glass border border-[#D4AF37]/40 text-[#F5E7C4] text-xs font-semibold uppercase tracking-widest mb-4 shadow-lg shadow-[#D4AF37]/10 animate-float-gentle">
          <Sparkles className="w-3.5 h-3.5 text-[#D4AF37] animate-spin [animation-duration:12s]" />
          <span>SOLAR SYSTEM OF TALENT ✦ BEYOND THE STARS</span>
        </div>

        {/* Grand Title */}
        <h1 className="font-cinzel text-4xl xs:text-5xl sm:text-7xl md:text-8xl font-extrabold tracking-wider leading-none mb-2.5 text-white drop-shadow-2xl">
          <span className="gold-gradient-text block">CELESTIA'26</span>
        </h1>

        {/* Subtitle */}
        <p className="font-cinzel text-xs sm:text-lg tracking-[0.2em] sm:tracking-[0.25em] font-semibold text-[#E6C57D] uppercase mb-3">
          INTERCOLLEGIATE CULTURAL FESTIVAL
        </p>

        {/* Tagline Motto */}
        <div className="flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold tracking-widest text-[#E9DDFB] uppercase mb-6">
          <span>ARTS</span>
          <span className="text-[#D4AF37] animate-pulse">✦</span>
          <span>TALENT</span>
          <span className="text-[#D4AF37] animate-pulse">✦</span>
          <span>BEYOND LIMITS</span>
        </div>

        {/* Date, Location, and Event count Pill badges */}
        <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-2.5 text-xs sm:text-sm text-slate-200 mb-8 max-w-xl w-full">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full celestial-glass border border-[#D4AF37]/30 text-[#F5E7C4] font-semibold w-full sm:w-auto justify-center shadow-sm hover:border-[#D4AF37]/60 transition-all">
            <Calendar className="w-4 h-4 text-[#D4AF37]" />
            <span>NOV 3, 4, 5 2026</span>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 rounded-full celestial-glass border border-[#D4AF37]/30 text-slate-200 font-medium w-full sm:w-auto justify-center shadow-sm hover:border-[#D4AF37]/60 transition-all">
            <MapPin className="w-4 h-4 text-[#D4AF37]" />
            <span className="uppercase tracking-wider text-xs">SRINIVASAN MEDICAL COLLEGE TRICHY</span>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 rounded-full celestial-glass border border-[#D4AF37]/30 text-slate-200 font-medium w-full sm:w-auto justify-center shadow-sm hover:border-[#D4AF37]/60 transition-all">
            <Users className="w-4 h-4 text-[#D4AF37]" />
            <span>12+ UNIQUE EVENTS</span>
          </div>
        </div>

        {/* Interactive CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={onExploreEvents}
            className="w-full sm:w-auto px-10 py-3.5 text-sm sm:text-base font-bold tracking-wider uppercase text-[#060B1E] bg-gradient-to-r from-[#F8E7C4] via-[#E8CB8B] to-[#D4AF37] hover:brightness-110 active:scale-95 transition-all rounded-full shadow-lg shadow-[#D4AF37]/35 flex items-center justify-center gap-2.5 cursor-pointer hover:shadow-[#D4AF37]/50"
          >
            <span>EXPLORE EVENTS</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>

          <button
            type="button"
            onClick={onOpenRegister}
            className="w-full sm:w-auto px-8 py-3.5 text-xs sm:text-sm font-semibold tracking-wider uppercase text-[#F5E7C4] hover:text-white bg-[#101736]/80 hover:bg-[#182352] border border-[#D4AF37]/40 hover:border-[#D4AF37] transition-all rounded-full flex items-center justify-center gap-2 cursor-pointer backdrop-blur-md shadow-md"
          >
            <span>REGISTER NOW</span>
          </button>
        </div>

        {/* About Celestia Quick Section below Hero */}
        <div className="mt-12 sm:mt-16 max-w-lg mx-auto p-6 rounded-2xl celestial-glass border border-[#D4AF37]/20 text-center space-y-2 relative group hover:border-[#D4AF37]/40 transition-all">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[#080C1F] border border-[#D4AF37]/40 text-[10px] text-[#D4AF37] font-semibold tracking-widest uppercase">
            ✦ FESTIVAL ETHOS ✦
          </div>
          <h2 className="font-cinzel text-base sm:text-lg font-bold text-white uppercase tracking-wider pt-1">
            ABOUT CELESTIA
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            A celebration of creativity, culture and expression, where every talent shines like stars in a grand galaxy.
          </p>
        </div>
      </div>
    </section>
  );
};
