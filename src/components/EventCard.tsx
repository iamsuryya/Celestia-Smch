import React from 'react';
import { ArrowUpRight, Award, Users, MapPin, Clock, ArrowRight } from 'lucide-react';
import { EventItem } from '../data/festivalData';
import { isEventRegistrationOpen } from '../utils/registrationStatus';
import { getEventImage } from '../utils/eventImages';

interface EventCardProps {
  event: EventItem;
  onViewDetails: (event: EventItem) => void;
  onRegister: (event: EventItem) => void;
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  onViewDetails,
  onRegister,
}) => {
  const isRegOpen = isEventRegistrationOpen(event.id) && isEventRegistrationOpen(event.code);
  const participantDisplay = event.participants ?? 'No limit';
  const imageUrl = getEventImage(event.id);

  const prizeDisplay = event.prizes
    ? `Winner: ${event.prizes.winner} · Runner-up: ${event.prizes.runnerUp}`
    : 'Prizes as per fest norms';

  return (
    <article
      onClick={() => onViewDetails(event)}
      className="celestial-glass rounded-2xl p-3.5 sm:p-5 transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1 hover:scale-[1.01] hover:shadow-[0_0_30px_rgba(212,175,55,0.2)] hover:border-[#D4AF37]/60 cursor-pointer"
    >
      {/* Mobile Compact Horizontal Layout (Matching Screen 2 of reference image) */}
      <div className="flex sm:hidden items-center gap-3.5 w-full">
        {/* Left Artwork Thumbnail */}
        <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-white/15 shadow-md">
          <img
            src={imageUrl}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        </div>

        {/* Center Details */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="font-cinzel text-base font-bold text-white group-hover:text-[#F5E7C4] transition-colors truncate">
              {event.title}
            </h3>
          </div>
          <p className="text-xs text-slate-300 truncate font-medium">
            {event.theme || event.categoryDisplay} ({event.type})
          </p>
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-[#E6C57D] font-mono pt-0.5">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3 text-[#D4AF37]" />
              <span>{event.type}</span>
            </span>
            <span className="text-slate-500">•</span>
            <span className="font-bold text-white">{event.registrationFee}</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-300">{event.duration}</span>
          </div>
        </div>

        {/* Right Arrow Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails(event);
          }}
          className="w-9 h-9 rounded-full bg-white/10 group-hover:bg-[#D4AF37] text-white group-hover:text-[#060B1E] flex items-center justify-center transition-all shrink-0 border border-white/15"
          aria-label={`View details for ${event.title}`}
        >
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Desktop / Tablet Vertical Card Layout (Matching Screen 2 Desktop of reference image) */}
      <div className="hidden sm:flex sm:flex-col sm:justify-between h-full">
        <div>
          {/* Artwork Header */}
          <div className="relative h-44 w-full rounded-xl overflow-hidden mb-4 border border-white/10 shadow-lg">
            <img
              src={imageUrl}
              alt={event.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#060B1E] via-transparent to-black/20" />
            <div className="absolute top-2.5 left-2.5 bg-[#060B1E]/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-[#D4AF37]/30 text-[11px] font-mono font-semibold text-[#D4AF37]">
              {event.code}
            </div>
            <div className="absolute top-2.5 right-2.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20 text-[11px] font-semibold text-white flex items-center gap-1">
              <Users className="w-3 h-3 text-[#D4AF37]" />
              <span>{event.type}</span>
            </div>
          </div>

          {/* Title & Theme */}
          <div className="mb-3">
            <h3 className="font-cinzel text-xl sm:text-2xl font-bold text-white group-hover:text-[#F5E7C4] transition-colors leading-snug">
              {event.title}
            </h3>
            <p className="text-xs text-[#E6C57D] font-medium mt-0.5">
              {event.theme ? `Theme: ${event.theme}` : event.categoryDisplay}
            </p>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs py-2.5 px-3 rounded-xl bg-[#080D26]/90 border border-white/10 mb-3.5">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Registration Fee</div>
              <div className="text-xs font-bold text-[#F5E7C4] mt-0.5">{event.registrationFee}</div>
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Participants</div>
              <div className="text-xs font-semibold text-slate-200 mt-0.5">{participantDisplay}</div>
            </div>
            <div className="col-span-2 pt-2 border-t border-white/10 flex items-center justify-between gap-1 text-[11px] text-slate-300">
              <span className="flex items-center gap-1 text-slate-300">
                <MapPin className="w-3 h-3 text-[#D4AF37] shrink-0" />
                <span>{event.venue}</span>
              </span>
              <span className="flex items-center gap-1 text-slate-300">
                <Clock className="w-3 h-3 text-[#D4AF37] shrink-0" />
                <span>{event.duration}</span>
              </span>
            </div>
          </div>

          {/* Prize Banner */}
          <div className="p-2.5 rounded-xl bg-[#0F163D]/80 border border-[#D4AF37]/30 mb-4 flex items-center gap-2">
            <Award className="w-4 h-4 text-[#D4AF37] shrink-0" />
            <div className="min-w-0 text-xs">
              <span className="text-[10px] uppercase font-bold text-[#D4AF37] block">Prizes</span>
              <span className="font-semibold text-[#F5E7C4] truncate block">{prizeDisplay}</span>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2 pt-2 border-t border-white/10">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(event);
            }}
            className="flex-1 py-2 px-3 text-xs font-semibold text-[#F5E7C4] hover:text-white bg-[#101736] hover:bg-[#182352] border border-[#D4AF37]/40 rounded-xl transition-colors flex items-center justify-center gap-1"
          >
            <span>View Details</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>

          {!isRegOpen ? (
            <button
              disabled
              className="py-2 px-3 text-xs font-semibold text-rose-300 bg-rose-950/40 border border-rose-500/30 rounded-xl opacity-80"
            >
              Closed
            </button>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRegister(event);
              }}
              className="py-2 px-4 text-xs font-bold text-[#060B1E] bg-gradient-to-r from-[#F8E7C4] via-[#E8CB8B] to-[#D4AF37] hover:brightness-110 rounded-xl transition-all shadow-sm"
            >
              Register
            </button>
          )}
        </div>
      </div>
    </article>
  );
};
