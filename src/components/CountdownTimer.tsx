import React, { useState, useEffect } from 'react';
import { Clock, Calendar } from 'lucide-react';
import { FESTIVAL_METADATA } from '../data/festivalData';

export const CountdownTimer: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
  });

  useEffect(() => {
    const calculateTime = () => {
      const target = new Date(FESTIVAL_METADATA.targetDateISO).getTime();
      const now = new Date().getTime();
      const difference = target - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, isExpired: false });
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const timeUnits = [
    { label: 'DAYS', value: String(timeLeft.days).padStart(2, '0') },
    { label: 'HOURS', value: String(timeLeft.hours).padStart(2, '0') },
    { label: 'MINUTES', value: String(timeLeft.minutes).padStart(2, '0') },
    { label: 'SECONDS', value: String(timeLeft.seconds).padStart(2, '0') },
  ];

  return (
    <section className="relative py-12 px-4 sm:px-6 max-w-5xl mx-auto">
      {/* Decorative cosmic arch frame */}
      <div className="relative celestial-glass rounded-2xl p-6 sm:p-10 border border-[#D4AF37]/30 shadow-2xl overflow-hidden">
        {/* Subtle corner ornamental accents */}
        <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-[#D4AF37]/50 pointer-events-none" />
        <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-[#D4AF37]/50 pointer-events-none" />
        <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-[#D4AF37]/50 pointer-events-none" />
        <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-[#D4AF37]/50 pointer-events-none" />

        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-[#D4AF37] mb-2">
            <Clock className="w-3.5 h-3.5 text-[#E6C57D]" />
            <span>COUNTDOWN TO CELESTIAL CONVERGENCE</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-cinzel">
            The Stars Align In
          </h2>
          <p className="text-sm text-slate-300 mt-1 max-w-md mx-auto">
            November 3, 4 & 5, 2026 · Srinivasan Medical College & Hospital, Trichy
          </p>
        </div>

        {/* Dial Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
          {timeUnits.map((unit) => (
            <div
              key={unit.label}
              className="relative flex flex-col items-center justify-center p-4 sm:p-6 rounded-xl bg-[#090E25]/85 border border-[#D4AF37]/20 hover:border-[#D4AF37]/45 transition-colors group"
            >
              {/* Radial subtle ambient glow */}
              <div className="absolute inset-0 bg-radial from-[#D4AF37]/5 to-transparent rounded-xl pointer-events-none" />
              
              <span className="font-cinzel text-3xl sm:text-5xl font-extrabold tracking-tight gold-gradient-text tabular-nums">
                {unit.value}
              </span>
              <span className="text-[10px] sm:text-xs font-semibold tracking-widest text-[#B5BED3] mt-2 group-hover:text-[#F5E7C4] transition-colors">
                {unit.label}
              </span>
            </div>
          ))}
        </div>

        {/* Bottom indicator */}
        <div className="mt-8 pt-6 border-t border-white/5 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#D4AF37]" />
            <span>Inauguration: 09:00 AM, November 3, 2026</span>
          </div>
          <span className="hidden sm:inline" aria-hidden="true">·</span>
          <div>
            <span>Venue: Trichy-Chennai Highway Campus</span>
          </div>
        </div>
      </div>
    </section>
  );
};
