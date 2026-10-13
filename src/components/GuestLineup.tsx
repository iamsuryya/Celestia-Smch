import React, { useState } from 'react';
import { Calendar, User, Sparkles, Award } from 'lucide-react';
import { GuestItem, DAILY_GUESTS_DATA } from '../data/guestsData';
import { GuestPhotoUploader } from './GuestPhotoUploader';

interface GuestLineupProps {
  guests?: GuestItem[];
}

export const GuestLineup: React.FC<GuestLineupProps> = ({ 
  guests = DAILY_GUESTS_DATA 
}) => {
  const [selectedDay, setSelectedDay] = useState<1 | 2 | 3>(1);

  const daysConfig: { day: 1 | 2 | 3; title: string; date: string }[] = [
    { day: 1, title: 'DAY 1', date: 'NOVEMBER 3' },
    { day: 2, title: 'DAY 2', date: 'NOVEMBER 4' },
    { day: 3, title: 'DAY 3', date: 'NOVEMBER 5' },
  ];

  const activeGuests = guests.filter((g) => g.day === selectedDay);

  return (
    <section className="py-12 sm:py-16 px-4 sm:px-6 max-w-7xl mx-auto relative">
      {/* Section Header */}
      <div className="text-center mb-8 sm:mb-10">
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-widest uppercase text-[#D4AF37] mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>FESTIVAL DIGNITARIES</span>
        </div>
        <h2 className="font-cinzel text-2xl sm:text-4xl font-bold text-white tracking-wide">
          CELESTIA'26 GUEST LINE-UP
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto mt-2">
          Honoured to welcome our distinguished guests across three unforgettable days.
        </p>
      </div>

      {/* Three Day Selectors */}
      <div className="flex justify-center gap-2 sm:gap-4 mb-8">
        {daysConfig.map((item) => {
          const isSelected = selectedDay === item.day;
          return (
            <button
              key={item.day}
              onClick={() => setSelectedDay(item.day)}
              className={`py-2.5 px-4 sm:px-7 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer border ${
                isSelected
                  ? 'bg-[#121B3D] border-[#D4AF37] text-[#F5E7C4] shadow-md shadow-[#D4AF37]/20'
                  : 'bg-[#090E25] border-white/10 text-slate-400 hover:text-white hover:border-white/20'
              }`}
            >
              <div className="uppercase font-cinzel text-xs sm:text-sm font-bold">
                {item.title}
              </div>
              <div className="text-[10px] sm:text-xs text-slate-400 font-mono mt-0.5">
                {item.date}
              </div>
            </button>
          );
        })}
      </div>

      {/* Guests Grid for Selected Day */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {activeGuests.map((guest) => (
          <div
            key={guest.id}
            className="celestial-glass rounded-xl p-5 border border-white/10 hover:border-[#D4AF37]/40 transition-all flex flex-col justify-between group bg-[#070B1E]/80"
          >
            <div>
              {/* Portrait with Instant Photo Uploader */}
              <div className="w-full aspect-[4/3] rounded-lg bg-[#0C1230] border border-white/5 mb-4 relative overflow-hidden">
                <GuestPhotoUploader
                  guestId={guest.id}
                  guestName={guest.name}
                  defaultPhoto={guest.photo}
                  variant="compact"
                  role={guest.role}
                />
              </div>

              {/* Guest Name */}
              <h3 className="font-cinzel text-base font-bold text-white group-hover:text-[#F5E7C4] transition-colors mb-1">
                {guest.name}
              </h3>

              {/* Designation */}
              <p className="text-xs text-[#F5E7C4]/90 font-medium leading-snug">
                {guest.designation}
              </p>

              {/* Institution / Organisation */}
              <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                {guest.institution}
              </p>
            </div>

            {/* Bottom Day Token */}
            <div className="mt-4 pt-2.5 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span className="text-[#D4AF37]">DAY 0{guest.day}</span>
              <span>November {guest.day + 2}, 2026</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
