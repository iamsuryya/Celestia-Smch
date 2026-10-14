import React from 'react';
import { ArrowUpRight, Award, Users, MapPin, Clock } from 'lucide-react';
import { EventItem, getEventDeadline } from '../data/festivalData';
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
  const participantDisplay = event.participants ?? 'No specific limit';

  const prizeDisplay = event.prizes
    ? `Winner: ${event.prizes.winner} · Runner-up: ${event.prizes.runnerUp}`
    : 'Prizes as per fest norms';

  const eventImage = getEventImage(event);

  return (
    <article className="celestial-glass rounded-xl overflow-hidden transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1.5 hover:scale-[1.015] hover:shadow-[0_0_35px_rgba(212,175,55,0.22)] hover:border-[#D4AF37]/60">
      {/* Event Artwork Banner */}
      <div className="relative h-36 w-full overflow-hidden bg-[#090E25]">
        <img
          src={eventImage}
          alt={event.title}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 opacity-80"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#080C1F] via-[#080C1F]/40 to-transparent" />
        <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-xs">
          <span className="font-mono font-bold text-[#E6C57D] bg-[#080C1F]/80 px-2 py-0.5 rounded border border-[#D4AF37]/30">
            {event.code}
          </span>
          <span className="uppercase text-[10px] font-bold tracking-wider text-[#FFF6DF] bg-white/10 backdrop-blur-md px-2 py-0.5 rounded border border-white/20">
            {event.categoryDisplay}
          </span>
        </div>
      </div>

      <div className="p-5 sm:p-6 pt-3 flex-1 flex flex-col justify-between">
        <div>
          {/* Top metadata line: Event Type & Deadline */}
          <div className="flex items-center justify-between text-xs text-slate-300 mb-2 pb-2 border-b border-white/10">
            <span className="text-[10px] sm:text-[11px] font-mono text-[#D4AF37] uppercase font-semibold">
              Deadline: {getEventDeadline(event.id)}
            </span>
            <div className="flex items-center gap-1 text-[#F5E7C4] bg-white/5 px-2 py-0.5 rounded border border-white/10">
              <Users className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span className="font-semibold text-xs">{event.type}</span>
            </div>
          </div>

          {/* Event Name */}
          <div className="mb-2.5">
            <h3 className="font-cinzel text-xl sm:text-2xl font-bold text-white group-hover:text-[#F5E7C4] transition-colors leading-snug">
              {event.title}
            </h3>
            {event.theme && (
              <p className="text-xs sm:text-sm text-[#F3E5AB] font-medium mt-1">
                Theme: {event.theme}
              </p>
            )}
          </div>

          {/* Structured Meta Grid: Fee, Participant Count, Venue, Duration */}
          <div className="grid grid-cols-2 gap-2 text-xs py-3 px-3.5 rounded-lg bg-[#070B1E]/80 border border-white/10 mb-4">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Registration Fee</div>
              <div className="text-sm font-bold text-[#F5E7C4] tabular-nums mt-0.5">{event.registrationFee}</div>
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Participants</div>
              <div className="text-sm font-semibold text-slate-200 mt-0.5">{participantDisplay}</div>
            </div>
            <div className="col-span-2 pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-1 text-xs text-slate-300">
              <span className="flex items-center gap-1.5 text-slate-200">
                <MapPin className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                <span>{event.venue}</span>
              </span>
              <span className="flex items-center gap-1.5 text-slate-200">
                <Clock className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                <span>{event.duration}</span>
              </span>
            </div>
          </div>

          {/* Prize Information Banner */}
          <div className="p-3 rounded-lg bg-[#0E1538]/80 border border-[#D4AF37]/30 mb-5 flex items-center gap-2.5">
            <Award className="w-4 h-4 text-[#D4AF37] shrink-0" />
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#D4AF37] block">Prizes</span>
              <span className="font-semibold text-[#F5E7C4] text-xs sm:text-sm leading-snug block">{prizeDisplay}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons: View Details and Register */}
        <div className="flex items-center gap-2.5 pt-3 border-t border-white/10">
          <button
            onClick={() => onViewDetails(event)}
            className="flex-1 min-h-[40px] py-2 px-3 text-xs sm:text-sm font-semibold tracking-wider text-[#F5E7C4] hover:text-white bg-[#101736] hover:bg-[#162152] border border-[#D4AF37]/40 hover:border-[#D4AF37] rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <span>View Details</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>

          {!isRegOpen ? (
            <button
              disabled
              className="min-h-[40px] py-2 px-3 sm:px-4 text-xs font-semibold tracking-wider text-rose-300 bg-rose-950/40 border border-rose-500/30 rounded-lg cursor-not-allowed opacity-80 whitespace-nowrap"
            >
              Closed
            </button>
          ) : (
            <button
              onClick={() => onRegister(event)}
              className="min-h-[40px] py-2 px-4 sm:px-5 text-xs sm:text-sm font-bold tracking-wider text-[#070B1B] bg-gradient-to-r from-[#F5E7C4] via-[#E6C57D] to-[#D4AF37] hover:brightness-110 active:scale-95 rounded-lg transition-all cursor-pointer whitespace-nowrap shadow-sm shadow-[#D4AF37]/30"
            >
              Register
            </button>
          )}
        </div>
      </div>
    </article>
  );
};
