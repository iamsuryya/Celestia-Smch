import React, { useEffect } from 'react';
import { X, Award, Clock, MapPin, Users, AlertCircle, CheckCircle2, Calendar, Sparkles, Phone } from 'lucide-react';
import { EventItem, FESTIVAL_METADATA, getEventDeadline } from '../data/festivalData';
import { isEventRegistrationOpen } from '../utils/registrationStatus';
import { getEventImage, handleEventImageError } from '../utils/eventImages';

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
  const participantDisplay = event.participants ?? 'No specific limit';
  const eventImageUrl = getEventImage(event);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-[#03050E]/85 backdrop-blur-md transition-opacity cursor-pointer"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Surface */}
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-title"
        className="relative w-full max-w-3xl my-auto bg-[#070B1E] border border-[#D4AF37]/35 rounded-2xl shadow-2xl overflow-hidden z-10 max-h-[92vh] flex flex-col"
      >
        {/* Modal Top Banner with Event Artwork */}
        <div className="relative h-44 sm:h-52 w-full overflow-hidden bg-[#090E25] border-b border-[#D4AF37]/20">
          <img
            src={eventImageUrl}
            alt={event.title}
            className="w-full h-full object-cover object-center opacity-70"
            loading="lazy"
            onError={(e) => handleEventImageError(e, event)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#070B1E] via-[#070B1E]/60 to-transparent" />

          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2 rounded-full text-slate-300 hover:text-white bg-[#070B1E]/80 hover:bg-[#070B1E] border border-white/10 transition-colors cursor-pointer"
            aria-label="Close details"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="absolute bottom-4 left-6 right-6 z-10">
            <div className="flex items-center gap-2 text-xs font-mono text-[#D4AF37] mb-1 flex-wrap">
              <span className="font-bold">{event.code}</span>
              <span aria-hidden="true">·</span>
              <span className="uppercase text-slate-200 font-sans tracking-wider">{event.categoryDisplay}</span>
              <span aria-hidden="true">·</span>
              <span className="text-[#F5E7C4] font-sans font-medium">{event.type}</span>
            </div>

            <h2 id="event-title" className="font-cinzel text-2xl sm:text-3xl font-bold text-white leading-tight">
              {event.title}
            </h2>

            {event.theme && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-xs text-[#F5E7C4] font-semibold mt-2">
                <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Theme: {event.theme}</span>
              </div>
            )}
          </div>
        </div>

        {/* Modal Scrollable Body Organized into 8 Clear Sections */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-sm text-slate-300">
          
          {/* Section 1: Overview */}
          <section className="space-y-2">
            <h3 className="font-cinzel text-xs font-bold uppercase tracking-widest text-[#D4AF37] flex items-center gap-1.5">
              <span>01. Overview</span>
            </h3>
            <div className="p-4 rounded-xl bg-[#090E25] border border-white/5 text-xs sm:text-sm text-slate-300 space-y-2">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Event Name</span>
                  <span className="font-semibold text-white">{event.title}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Event Code</span>
                  <span className="font-mono text-[#E6C57D] font-bold">{event.code}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Category</span>
                  <span className="text-slate-200">{event.categoryDisplay}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Event Type</span>
                  <span className="text-slate-200">{event.type}</span>
                </div>
              </div>
              {event.theme && (
                <div className="pt-2 border-t border-white/5 text-xs text-[#F5E7C4]">
                  <strong>Official Theme:</strong> {event.theme}
                </div>
              )}
            </div>
          </section>

          {/* Section 2: Participation */}
          <section className="space-y-2">
            <h3 className="font-cinzel text-xs font-bold uppercase tracking-widest text-[#D4AF37] flex items-center gap-1.5">
              <span>02. Participation</span>
            </h3>
            <div className="p-4 rounded-xl bg-[#090E25] border border-white/5 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs sm:text-sm">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Participants</span>
                <span className="font-semibold text-white">{participantDisplay}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Gender Eligibility</span>
                <span className="text-slate-200">{event.gender}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block">College Entry Quota</span>
                <span className="text-slate-200">
                  {event.maxEntriesPerCollege ? `${event.maxEntriesPerCollege} team(s)/entry(ies) per college` : 'No specific limit'}
                </span>
              </div>
              {event.maxTotalCapacity && (
                <div className="sm:col-span-3 pt-2 border-t border-white/5 text-xs text-[#E6C57D]">
                  <strong>Registration Cap:</strong> First {event.maxTotalCapacity} registrations accepted
                </div>
              )}
            </div>
          </section>

          {/* Section 3: Registration Fee */}
          <section className="space-y-2">
            <h3 className="font-cinzel text-xs font-bold uppercase tracking-widest text-[#D4AF37] flex items-center gap-1.5">
              <span>03. Registration Fee</span>
            </h3>
            <div className="p-4 rounded-xl bg-[#090E25] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Applicable Fee</span>
                <span className="font-cinzel text-xl font-bold text-[#F5E7C4]">{event.registrationFee}</span>
              </div>
              <div className="text-xs text-slate-400">
                Registration Deadline: <strong className="text-emerald-300 font-semibold">{getEventDeadline(event.id)} (11:59 PM)</strong>
              </div>
            </div>
          </section>

          {/* Section 4: Duration */}
          <section className="space-y-2">
            <h3 className="font-cinzel text-xs font-bold uppercase tracking-widest text-[#D4AF37] flex items-center gap-1.5">
              <span>04. Duration</span>
            </h3>
            <div className="p-4 rounded-xl bg-[#090E25] border border-white/5 flex items-center gap-3">
              <Clock className="w-4 h-4 text-[#D4AF37] shrink-0" />
              <div className="text-xs sm:text-sm">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Performance Allotment</span>
                <span className="font-semibold text-white">{event.duration}</span>
              </div>
            </div>
          </section>

          {/* Section 5: Venue */}
          <section className="space-y-2">
            <h3 className="font-cinzel text-xs font-bold uppercase tracking-widest text-[#D4AF37] flex items-center gap-1.5">
              <span>05. Venue</span>
            </h3>
            <div className="p-4 rounded-xl bg-[#090E25] border border-white/5 flex items-center gap-3">
              <MapPin className="w-4 h-4 text-[#D4AF37] shrink-0" />
              <div className="text-xs sm:text-sm">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Stage Location</span>
                <span className="font-semibold text-white">{event.venue}</span>
                <span className="text-xs text-slate-400 block mt-0.5">Srinivasan Medical College and Hospital Campus, Trichy</span>
              </div>
            </div>
          </section>

          {/* Section 6: Prizes */}
          <section className="space-y-2">
            <h3 className="font-cinzel text-xs font-bold uppercase tracking-widest text-[#D4AF37] flex items-center gap-1.5">
              <span>06. Prizes</span>
            </h3>
            <div className="p-4 rounded-xl bg-[#0E1538]/50 border border-[#D4AF37]/30">
              {event.prizes ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-lg bg-[#070B1D] border border-[#D4AF37]/40 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-[#F5E7C4] block">Winner</span>
                      <span className="text-lg font-bold text-white font-mono mt-0.5">{event.prizes.winner}</span>
                    </div>
                    <Award className="w-5 h-5 text-[#D4AF37]" />
                  </div>
                  <div className="p-3.5 rounded-lg bg-[#070B1D] border border-white/10 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-300 block">Runner-up</span>
                      <span className="text-lg font-bold text-slate-100 font-mono mt-0.5">{event.prizes.runnerUp}</span>
                    </div>
                    <Award className="w-5 h-5 text-slate-400" />
                  </div>
                </div>
              ) : (
                <div className="p-3 text-xs text-slate-300">
                  Prize amounts will be awarded as per Celestia'26 festival guidelines and announced at the stage briefing.
                </div>
              )}
            </div>
          </section>

          {/* Section 7: Rules */}
          <section className="space-y-2">
            <h3 className="font-cinzel text-xs font-bold uppercase tracking-widest text-[#D4AF37] flex items-center gap-1.5">
              <span>07. Rules & Regulations</span>
            </h3>
            <div className="p-4 rounded-xl bg-[#090E25] border border-white/5">
              <ul className="space-y-2.5">
                {event.rules.map((rule, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] shrink-0 mt-2" />
                    <span className="leading-relaxed">{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Section 8: Judging Criteria */}
          <section className="space-y-2">
            <h3 className="font-cinzel text-xs font-bold uppercase tracking-widest text-[#D4AF37] flex items-center gap-1.5">
              <span>08. Judging Criteria</span>
            </h3>
            <div className="p-4 rounded-xl bg-[#090E25] border border-white/5">
              {event.judgingCriteria && event.judgingCriteria.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {event.judgingCriteria.map((c, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-[#070B1D] border border-white/5 flex items-center gap-2 text-xs text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                      <span>{c}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-400 italic">
                  None specified in the official event sheet.
                </div>
              )}
            </div>
          </section>

          {/* Section 9: Event In-Charges & Contact */}
          <section className="space-y-2">
            <h3 className="font-cinzel text-xs font-bold uppercase tracking-widest text-[#D4AF37] flex items-center gap-1.5">
              <span>09. Event In-Charges & Coordinators</span>
            </h3>
            <div className="p-4 rounded-xl bg-[#090E25] border border-white/5 space-y-3">
              {event.incharges && event.incharges.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {event.incharges.map((inc, idx) => {
                    const cleanPhone = inc.phone.replace(/\D/g, '');
                    return (
                      <div key={idx} className="p-3.5 rounded-xl bg-[#070B1D] border border-white/10 hover:border-[#D4AF37]/40 transition-colors flex items-center justify-between gap-2.5">
                        <div className="min-w-0 flex-1">
                          <span className="font-bold text-white text-xs sm:text-sm block truncate">{inc.name}</span>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-mono">{inc.role || 'Event In-Charge'}</span>
                        </div>
                        <a
                          href={`tel:${cleanPhone}`}
                          className="px-2.5 py-1.5 rounded-lg bg-[#D4AF37]/15 hover:bg-[#D4AF37] text-[#F5E7C4] hover:text-black border border-[#D4AF37]/30 transition-all text-xs font-bold font-mono flex items-center gap-1 shrink-0 cursor-pointer"
                          title={`Call ${inc.name} at ${inc.phone}`}
                        >
                          <Phone className="w-3.5 h-3.5 text-[#D4AF37] group-hover:text-black" />
                          <span>{inc.phone}</span>
                        </a>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-slate-300">
                    For inquiries or rule clarifications regarding <strong className="text-white">{event.title}</strong>, contact central event coordination:
                  </p>
                  <div className="p-3 rounded-xl bg-[#070B1D] border border-white/10 flex items-center justify-between gap-2">
                    <div>
                      <span className="font-bold text-white text-xs block">Celestia Central Helpdesk</span>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-mono">Central Coordination</span>
                    </div>
                    <a
                      href="tel:8075970766"
                      className="px-3 py-1.5 rounded-lg bg-[#D4AF37]/15 hover:bg-[#D4AF37] text-[#F5E7C4] hover:text-black border border-[#D4AF37]/30 transition-all text-xs font-bold font-mono flex items-center gap-1.5 shrink-0 cursor-pointer"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>8075970766</span>
                    </a>
                  </div>
                </div>
              )}
            </div>
          </section>

        </div>

        {/* Modal Sticky Bottom Action */}
        <div className="p-4 sm:p-6 bg-[#090E25] border-t border-[#D4AF37]/20 flex items-center justify-between gap-4">
          <div className="text-xs text-slate-400">
            <span>Registration Fee: </span>
            <span className="font-bold text-[#E6C57D]">{event.registrationFee}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="py-2.5 px-4 text-xs font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-md transition-colors cursor-pointer"
            >
              Close
            </button>
            {!isRegOpen ? (
              <button
                disabled
                className="py-2.5 px-6 text-xs font-bold tracking-wider uppercase text-rose-300 bg-rose-950/40 border border-rose-500/30 rounded-md cursor-not-allowed opacity-80"
              >
                Registration Closed by Admin
              </button>
            ) : (
              <button
                onClick={() => {
                  onClose();
                  onRegister(event);
                }}
                className="py-2.5 px-6 text-xs font-bold tracking-wider uppercase text-[#070B1B] bg-gradient-to-r from-[#F5E7C4] via-[#E6C57D] to-[#D4AF37] hover:brightness-110 active:scale-95 rounded-md transition-all shadow-md shadow-[#D4AF37]/20 cursor-pointer"
              >
                Register for this Event
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
