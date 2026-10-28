import React, { useState, useMemo, useEffect } from 'react';
import { Search, Sparkles, X, Users, MapPin, Check, ArrowLeft, ArrowRight, Clock, Award, AlertCircle } from 'lucide-react';
import { EVENTS_DATA, CATEGORIES, EventItem, getEventDeadline } from '../../data/festivalData';
import { useRegistration } from '../../context/RegistrationContext';
import { isEventRegistrationOpen } from '../../utils/registrationStatus';

export const EventSelector: React.FC = () => {
  const { selectEvent, selectedEvent, goToStep, collegeDetails } = useRegistration();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'Solo' | 'Duo' | 'Team'>('all');
  const [, setStatusTrigger] = useState(0);

  useEffect(() => {
    const handleStatusChange = () => setStatusTrigger((prev) => prev + 1);
    window.addEventListener('celestia-registration-status-changed', handleStatusChange);
    return () => window.removeEventListener('celestia-registration-status-changed', handleStatusChange);
  }, []);

  const filteredEvents = useMemo(() => {
    return EVENTS_DATA.filter((event) => {
      if (categoryFilter !== 'all' && event.category !== categoryFilter) {
        return false;
      }
      if (typeFilter !== 'all' && event.type !== typeFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = event.title.toLowerCase().includes(q);
        const matchesCode = event.code.toLowerCase().includes(q);
        const matchesCat = event.categoryDisplay.toLowerCase().includes(q);
        if (!matchesTitle && !matchesCode && !matchesCat) return false;
      }
      return true;
    });
  }, [categoryFilter, typeFilter, searchQuery]);

  const handleSelectEvent = (event: EventItem) => {
    if (!isEventRegistrationOpen(event.id) || !isEventRegistrationOpen(event.code)) {
      return;
    }
    selectEvent(event);
    goToStep('participants');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 space-y-6">
      
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <div className="text-[11px] font-mono text-[#D4AF37] uppercase tracking-wider mb-1">
          Step 3 · Competition Selection
        </div>
        <h2 className="font-cinzel text-2xl sm:text-4xl font-bold text-white mb-2">
          Select Your Event
        </h2>
        <p className="text-xs sm:text-sm text-slate-300">
          Choose from {EVENTS_DATA.length} official Celestia'26 flagship competitions. Participant limits are automatically adapted.
        </p>
      </div>

      {/* College Context Chip */}
      {collegeDetails && (
        <div className="max-w-xl mx-auto p-3 rounded-xl bg-[#080D24] border border-white/10 flex items-center justify-between text-xs text-slate-300">
          <div className="truncate">
            <span className="text-slate-500 uppercase text-[10px] block">Registering for College:</span>
            <span className="font-semibold text-[#F5E7C4] truncate block">{collegeDetails.collegeName}</span>
          </div>
          <button
            onClick={() => goToStep('college')}
            className="text-[11px] text-[#D4AF37] hover:underline shrink-0 ml-2"
          >
            Change College
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="celestial-glass rounded-2xl p-4 sm:p-6 border border-[#D4AF37]/25 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search events by name or code (e.g. SERAPHIA, STARFUSION, SILHOUETTE)..."
            className="w-full pl-10 pr-10 py-2.5 bg-[#080D24] border border-white/10 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:border-[#D4AF37] transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-3.5 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2 border-t border-white/5">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <span className="text-xs text-slate-400 mr-1 shrink-0">Category:</span>
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                categoryFilter === 'all'
                  ? 'bg-gradient-to-r from-[#F5E7C4] to-[#D4AF37] text-[#070B1B]'
                  : 'bg-[#090E25] text-slate-300 hover:text-white border border-white/5'
              }`}
            >
              All ({EVENTS_DATA.length})
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                  categoryFilter === cat.id
                    ? 'bg-gradient-to-r from-[#F5E7C4] to-[#D4AF37] text-[#070B1B]'
                    : 'bg-[#090E25] text-slate-300 hover:text-white border border-white/5'
                }`}
              >
                {cat.title}
              </button>
            ))}
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs text-slate-400 mr-1">Type:</span>
            {(['all', 'Solo', 'Duo', 'Team'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-2.5 py-1 text-xs rounded transition-colors cursor-pointer ${
                  typeFilter === t
                    ? 'bg-[#15204C] text-[#F5E7C4] font-semibold border border-[#D4AF37]/50'
                    : 'text-slate-400 hover:text-white bg-transparent hover:bg-white/5'
                }`}
              >
                {t === 'all' ? 'All' : t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredEvents.map((evt) => {
          const isSelected = selectedEvent?.id === evt.id;
          const participantDisplay = evt.participants ?? 'No specific limit';
          const isRegOpen = isEventRegistrationOpen(evt.id) && isEventRegistrationOpen(evt.code);

          return (
            <div
              key={evt.id}
              className={`celestial-glass rounded-xl p-5 border transition-all flex flex-col justify-between ${
                !isRegOpen
                  ? 'border-rose-500/30 bg-[#0c0d1e] opacity-80'
                  : isSelected
                  ? 'border-[#D4AF37] ring-2 ring-[#D4AF37]/30 bg-[#0F173C]'
                  : 'border-white/10 hover:border-[#D4AF37]/40'
              }`}
            >
              <div>
                {/* Code & Type */}
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2 pb-2 border-b border-white/5">
                  <span className="font-mono text-[#D4AF37] font-semibold">{evt.code}</span>
                  <div className="flex items-center gap-2">
                    {!isRegOpen && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 font-semibold">
                        Registration Stopped
                      </span>
                    )}
                    <span className="text-[#E6C57D] font-medium">{evt.type}</span>
                  </div>
                </div>

                {/* Title & Theme */}
                <h3 className="font-cinzel text-lg font-bold text-white mb-1">
                  {evt.title}
                </h3>
                <div className="text-xs text-slate-400 mb-3">
                  {evt.categoryDisplay}
                  {evt.theme && <span className="text-[#F5E7C4] ml-1">· Theme: {evt.theme}</span>}
                </div>

                {/* Spec Box */}
                <div className="p-3 rounded-lg bg-[#070B1E]/70 border border-white/5 space-y-1.5 text-xs text-slate-300 mb-4">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Registration Fee:</span>
                    <span className="font-bold text-[#F5E7C4]">{evt.registrationFee}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Deadline:</span>
                    <span className="font-semibold text-emerald-400">{getEventDeadline(evt.id)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Participant Limit:</span>
                    <span className="font-medium text-white">{participantDisplay}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-white/5">
                    <span className="text-slate-400">Venue:</span>
                    <span className="text-slate-200">{evt.venue}</span>
                  </div>
                </div>

                {/* Capacity Flag if any */}
                {evt.maxTotalCapacity && (
                  <div className="mb-3 text-[10px] uppercase tracking-wider text-amber-400 font-semibold flex items-center gap-1">
                    <span>⚠️ First {evt.maxTotalCapacity} entries only</span>
                  </div>
                )}
              </div>

              {/* Action */}
              <div className="pt-2 border-t border-white/5">
                {!isRegOpen ? (
                  <button
                    type="button"
                    disabled
                    className="w-full py-2.5 px-4 text-xs font-bold tracking-wider uppercase rounded-lg bg-rose-950/40 text-rose-300 border border-rose-500/30 flex items-center justify-center gap-1.5 cursor-not-allowed opacity-80"
                  >
                    <AlertCircle className="w-4 h-4 text-rose-400" />
                    <span>Registration Closed</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSelectEvent(evt)}
                    className={`w-full py-2.5 px-4 text-xs font-bold tracking-wider uppercase rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gradient-to-r from-[#F5E7C4] via-[#E6C57D] to-[#D4AF37] text-[#070B1B] hover:brightness-110'
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Selected · Continue</span>
                      </>
                    ) : (
                      <>
                        <span>Register for this Event</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Back button */}
      <div className="pt-6 flex justify-start">
        <button
          type="button"
          onClick={() => goToStep('college')}
          className="py-2.5 px-4 text-xs font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to College Details</span>
        </button>
      </div>
    </div>
  );
};
