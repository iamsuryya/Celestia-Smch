import React, { useEffect, useState } from 'react';
import { X, Award, Clock, MapPin, Users, CheckCircle2, Sparkles, ArrowRight, Mic } from 'lucide-react';
import { EventItem, FESTIVAL_METADATA } from '../data/festivalData';
import { isEventRegistrationOpen } from '../utils/registrationStatus';
import { getEventImage } from '../utils/eventImages';

interface EventDetailModalProps {
  event: EventItem | null;
  onClose: () => void;
  onRegister: (event: EventItem) => void;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
  event,
  onClose,
  onRegister,
}) => {
  const [activeTab, setActiveTab] = useState<'about' | 'rules' | 'judging' | 'prizes'>('about');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (event) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [event, onClose]);

  if (!event) return null;

  const isRegOpen = isEventRegistrationOpen(event.id) && isEventRegistrationOpen(event.code);
  const participantDisplay = event.participants ?? 'No limit';
  const imageUrl = getEventImage(event.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-[#03050E]/85 backdrop-blur-md transition-opacity cursor-pointer"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Surface - Matching Screen 3 layout */}
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-title"
        className="relative w-full max-w-2xl my-auto bg-[#080D24] border border-[#D4AF37]/35 rounded-3xl shadow-2xl overflow-hidden z-10 max-h-[92vh] flex flex-col"
      >
        {/* Modal Top Artwork Header */}
        <div className="relative h-52 sm:h-64 w-full shrink-0 overflow-hidden">
          <img
            src={imageUrl}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#080D24] via-[#080D24]/40 to-transparent" />

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full text-slate-300 hover:text-white bg-black/50 backdrop-blur-md border border-white/20 transition-colors cursor-pointer"
            aria-label="Close details"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Title & Category over banner */}
          <div className="absolute bottom-4 left-5 right-5 space-y-1">
            <h2 id="event-title" className="font-cinzel text-3xl sm:text-4xl font-extrabold text-white leading-tight">
              {event.title}
            </h2>
            <p className="text-xs sm:text-sm text-[#E6C57D] font-semibold tracking-wider uppercase">
              {event.theme ? `${event.theme} • ` : ''}{event.categoryDisplay}
            </p>
          </div>
        </div>

        {/* Stat Pills Bar (Matching Screen 3: Solo, Fee, Duration) */}
        <div className="px-5 py-3 border-b border-white/10 bg-[#0C1232] flex items-center justify-around gap-2 text-xs sm:text-sm">
          <div className="flex items-center gap-1.5 text-slate-200">
            <Users className="w-4 h-4 text-[#D4AF37]" />
            <span className="font-semibold">{event.type}</span>
          </div>
          <div className="text-slate-500">•</div>
          <div className="flex items-center gap-1.5 text-[#F5E7C4] font-bold">
            <span>{event.registrationFee}</span>
          </div>
          <div className="text-slate-500">•</div>
          <div className="flex items-center gap-1.5 text-slate-200">
            <Clock className="w-4 h-4 text-[#D4AF37]" />
            <span>{event.duration}</span>
          </div>
        </div>

        {/* Tab Navigation Row (About, Rules, Judging, Prizes) */}
        <div className="px-5 pt-3 bg-[#080D24] border-b border-white/10 flex items-center justify-center gap-1 sm:gap-2">
          {(['about', 'rules', 'judging', 'prizes'] as const).map((tab) => (
            <button
              type="button"
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-xs font-bold rounded-full capitalize transition-all cursor-pointer ${
                activeTab === tab
                  ? 'bg-[#E8DFFA] text-[#060B1E] shadow-sm'
                  : 'text-slate-300 hover:text-white bg-white/5'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Scrollable Body Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs sm:text-sm text-slate-300">
          {activeTab === 'about' && (
            <div className="space-y-4">
              <p className="leading-relaxed text-slate-200">
                A stage for talents to touch souls. {event.title} celebrates artistic brilliance and competitive excellence at {FESTIVAL_METADATA.edition}, hosted by {FESTIVAL_METADATA.collegeName}, Trichy.
              </p>
              
              <div className="p-4 rounded-2xl bg-[#0F163D] border border-white/10 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Venue:</span>
                  <span className="font-semibold text-white">{event.venue}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Gender Eligibility:</span>
                  <span className="font-semibold text-white">{event.gender}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Participants per entry:</span>
                  <span className="font-semibold text-white">{participantDisplay}</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'rules' && (
            <div className="space-y-3">
              <h4 className="font-cinzel text-xs font-bold uppercase tracking-wider text-[#D4AF37]">
                Official Event Rules
              </h4>
              <ul className="space-y-2">
                {event.rules.map((rule, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] shrink-0 mt-1.5" />
                    <span className="leading-relaxed">{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {activeTab === 'judging' && (
            <div className="space-y-3">
              <h4 className="font-cinzel text-xs font-bold uppercase tracking-wider text-[#D4AF37]">
                Judging Criteria
              </h4>
              {event.judgingCriteria && event.judgingCriteria.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {event.judgingCriteria.map((c, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-[#0F163D] border border-white/10 flex items-center gap-2 text-xs text-slate-200">
                      <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0" />
                      <span>{c}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">None specified in official event guidelines.</p>
              )}
            </div>
          )}

          {activeTab === 'prizes' && (
            <div className="space-y-4">
              <h4 className="font-cinzel text-xs font-bold uppercase tracking-wider text-[#D4AF37] text-center">
                Prizes & Honors
              </h4>
              {event.prizes ? (
                <div className="celestial-glass rounded-2xl p-5 border border-[#D4AF37]/30 text-center space-y-4 bg-gradient-to-b from-[#0F163D] to-[#080D24]">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl bg-[#080D24] border border-[#D4AF37]/40 space-y-1">
                      <span className="text-2xl block">🏆</span>
                      <span className="font-mono text-lg font-bold text-[#F5E7C4] block">{event.prizes.winner}</span>
                      <span className="text-[11px] font-semibold text-slate-300 uppercase block">Winner</span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-[#080D24] border border-white/10 space-y-1">
                      <span className="text-2xl block">🥈</span>
                      <span className="font-mono text-lg font-bold text-slate-200 block">{event.prizes.runnerUp}</span>
                      <span className="text-[11px] font-semibold text-slate-300 uppercase block">Runner Up</span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-white/10 text-xs font-semibold text-[#D4AF37]">
                    Total Prize Pool: <span className="font-mono font-bold text-white text-sm">{event.prizes.totalFormatted || '₹9,000'}</span>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-[#0F163D] text-xs text-slate-300 text-center">
                  Prizes awarded as per fest norms.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Bottom CTA Button - Matching Screen 3: Register for this Event → */}
        <div className="p-4 bg-[#060A1E] border-t border-white/10">
          {!isRegOpen ? (
            <button
              disabled
              className="w-full py-3.5 px-6 text-xs font-bold tracking-wider uppercase text-rose-300 bg-rose-950/40 border border-rose-500/30 rounded-full cursor-not-allowed opacity-80"
            >
              Registration Closed
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                onClose();
                onRegister(event);
              }}
              className="w-full py-3.5 px-6 text-sm font-bold tracking-wider text-[#060B1E] bg-gradient-to-r from-[#F8E7C4] via-[#E8CB8B] to-[#D4AF37] hover:brightness-110 active:scale-95 rounded-full transition-all shadow-lg shadow-[#D4AF37]/25 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Register for this Event</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
