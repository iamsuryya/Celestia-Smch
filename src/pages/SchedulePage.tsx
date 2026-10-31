import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Sparkles, 
  Search, 
  Download, 
  Printer, 
  Info, 
  LayoutGrid, 
  GitCommit, 
  Compass, 
  ExternalLink, 
  Radio, 
  Music, 
  Flame, 
  Disc, 
  CheckCircle2, 
  X,
  ChevronRight,
  Sun,
  Sunset,
  Moon
} from 'lucide-react';
import { FESTIVAL_SCHEDULE, EVENTS_DATA, FESTIVAL_METADATA, EventItem } from '../data/festivalData';
import { isEventRegistrationOpen } from '../utils/registrationStatus';

interface SchedulePageProps {
  onViewEventDetails?: (event: EventItem) => void;
  onOpenRegister?: (event?: EventItem) => void;
}

type ViewMode = 'timeline' | 'matrix' | 'venues';
type TimePhase = 'all' | 'morning' | 'afternoon' | 'night';

export const SchedulePage: React.FC<SchedulePageProps> = ({
  onViewEventDetails,
  onOpenRegister,
}) => {
  const [activeDay, setActiveDay] = useState<1 | 2 | 3>(1);
  const [viewMode, setViewMode] = useState<ViewMode>('timeline');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPhase, setSelectedPhase] = useState<TimePhase>('all');
  const [showGuidelinesModal, setShowGuidelinesModal] = useState(false);

  // Helper to map schedule slot code to rich EventItem if available
  const getEventByCode = (code?: string): EventItem | undefined => {
    if (!code) return undefined;
    return EVENTS_DATA.find((e) => e.code.toUpperCase() === code.toUpperCase());
  };

  // Helper to determine time phase of a slot
  const getTimePhase = (timeStr: string): 'morning' | 'afternoon' | 'night' => {
    const isAM = timeStr.includes('AM');
    const hour = parseInt(timeStr.split(':')[0], 10);
    if (isAM) return 'morning';
    // PM
    if (hour === 12 || hour < 5) return 'afternoon';
    return 'night';
  };

  const currentDayData = FESTIVAL_SCHEDULE.find((d) => d.dayNumber === activeDay) || FESTIVAL_SCHEDULE[0];

  // Filtered slots for Timeline view
  const filteredTimelineSlots = useMemo(() => {
    return currentDayData.slots.filter((slot) => {
      // Phase match
      if (selectedPhase !== 'all') {
        const slotPhase = getTimePhase(slot.time);
        if (slotPhase !== selectedPhase) return false;
      }
      // Search match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = slot.title.toLowerCase().includes(q);
        const matchesTime = slot.time.toLowerCase().includes(q);
        const matchesVenue = slot.venue.toLowerCase().includes(q);
        const matchesCategory = slot.category.toLowerCase().includes(q);
        const matchesCode = slot.code ? slot.code.toLowerCase().includes(q) : false;
        if (!matchesTitle && !matchesTime && !matchesVenue && !matchesCategory && !matchesCode) {
          return false;
        }
      }
      return true;
    });
  }, [currentDayData, selectedPhase, searchQuery]);

  // Venue groupings for Venue Call-Sheet view
  const venueGroupings = useMemo(() => {
    const map: { [venueName: string]: { dayNumber: number; slot: typeof currentDayData.slots[0] }[] } = {};
    FESTIVAL_SCHEDULE.forEach((day) => {
      day.slots.forEach((slot) => {
        if (!map[slot.venue]) {
          map[slot.venue] = [];
        }
        map[slot.venue].push({ dayNumber: day.dayNumber, slot });
      });
    });
    return map;
  }, []);

  // Export iCalendar (.ics) file
  const handleDownloadICS = () => {
    const calendarLines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Celestia 2026//Festival Schedule//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:Celestia 26 Official Schedule',
      'X-WR-TIMEZONE:Asia/Kolkata',
    ];

    FESTIVAL_SCHEDULE.forEach((day) => {
      const year = 2026;
      const month = '11';
      const dayNum = String(day.dayNumber + 2).padStart(2, '0'); // Nov 3, 4, 5

      day.slots.forEach((slot, idx) => {
        // Parse time: e.g. 11:00 AM -> 110000, 02:00 PM -> 140000
        const isPM = slot.time.includes('PM');
        const [hPart, mPart] = slot.time.replace(/ (AM|PM)/, '').split(':');
        let h = parseInt(hPart, 10);
        if (isPM && h !== 12) h += 12;
        if (!isPM && h === 12) h = 0;
        const timeFormatted = `${String(h).padStart(2, '0')}${mPart}00`;
        const endHour = String(Math.min(h + 2, 23)).padStart(2, '0');
        const endTimeFormatted = `${endHour}${mPart}00`;

        calendarLines.push(
          'BEGIN:VEVENT',
          `UID:celestia-2026-d${day.dayNumber}-s${idx}@srinivasanmedical.edu`,
          `DTSTAMP:20261101T000000Z`,
          `DTSTART:${year}${month}${dayNum}T${timeFormatted}`,
          `DTEND:${year}${month}${dayNum}T${endTimeFormatted}`,
          `SUMMARY:Celestia'26: ${slot.title}`,
          `DESCRIPTION:Official event at Celestia'26 National Inter-Collegiate Cultural Festival. Category: ${slot.category}. Venue: ${slot.venue}.`,
          `LOCATION:${slot.venue}, Srinivasan Medical College and Hospital, Samayapuram, Tiruchirappalli`,
          'STATUS:CONFIRMED',
          'END:VEVENT'
        );
      });
    });

    calendarLines.push('END:VCALENDAR');
    const blob = new Blob([calendarLines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Celestia26_Festival_Schedule.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="relative z-10 pt-20 sm:pt-28 pb-12 sm:pb-24 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Schedule Header / Master Call-Sheet Banner */}
      <div className="text-center max-w-3xl mx-auto mb-6 sm:mb-8">
        <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-[#D4AF37] mb-1.5">
          <Calendar className="w-3.5 h-3.5" />
          <span>OFFICIAL TIMETABLE & RUNNING ORDER</span>
        </div>
        <h1 className="font-cinzel text-2xl sm:text-5xl font-bold text-white mb-2 sm:mb-3">
          Festival Schedule
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl mx-auto">
          The verified running sequence for all 3 days of {FESTIVAL_METADATA.edition} at {FESTIVAL_METADATA.collegeName}.
          Stage calls commence 45 minutes prior to designated slot times.
        </p>

        {/* Quick Festival Metrics Strip */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 mt-3 sm:mt-5 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-medium text-white">3 Action-Packed Days</span>
          </div>
          <span className="text-slate-600 hidden sm:inline">|</span>
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>16 Official Stages & Showcases</span>
          </div>
          <span className="text-slate-600 hidden sm:inline">|</span>
          <div className="flex items-center gap-2">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>2 Electrifying DJ Nights</span>
          </div>
        </div>
      </div>

      {/* Control Station: Architectural View Switcher + Action Utility Bar */}
      <div className="bg-[#090E26]/90 border border-[#D4AF37]/30 rounded-2xl p-3 sm:p-4 mb-8 shadow-xl backdrop-blur-md flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Architectural View Modes Switcher */}
        <div className="flex items-center bg-[#050817] p-1 rounded-xl border border-white/10 self-start md:self-auto w-full md:w-auto">
          <button
            onClick={() => setViewMode('timeline')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              viewMode === 'timeline'
                ? 'bg-gradient-to-r from-[#D4AF37] to-[#AA820A] text-[#050714] font-bold shadow-md shadow-[#D4AF37]/20'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <GitCommit className="w-3.5 h-3.5" />
            <span>Timeline Stream</span>
          </button>

          <button
            onClick={() => setViewMode('matrix')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              viewMode === 'matrix'
                ? 'bg-gradient-to-r from-[#D4AF37] to-[#AA820A] text-[#050714] font-bold shadow-md shadow-[#D4AF37]/20'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>3-Day Master Matrix</span>
          </button>

          <button
            onClick={() => setViewMode('venues')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              viewMode === 'venues'
                ? 'bg-gradient-to-r from-[#D4AF37] to-[#AA820A] text-[#050714] font-bold shadow-md shadow-[#D4AF37]/20'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Venues & Stages</span>
          </button>
        </div>

        {/* Utility Tools: Search + Calendar Export + Reporting Guide */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 sm:w-60">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search schedule slot..."
              className="w-full pl-8 pr-7 py-1.5 bg-[#050817] border border-white/10 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#D4AF37]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            onClick={handleDownloadICS}
            title="Download .ics calendar event"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0D153B] hover:bg-[#152055] border border-[#D4AF37]/40 text-[#F5E7C4] text-xs font-medium rounded-lg transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span className="hidden sm:inline">Add to Calendar (.ics)</span>
            <span className="sm:hidden">.ICS</span>
          </button>

          <button
            onClick={handlePrint}
            title="Print schedule program"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#050817] hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Print</span>
          </button>

          <button
            onClick={() => setShowGuidelinesModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#050817] hover:bg-white/10 border border-white/10 text-[#D4AF37] hover:text-[#FFF7D6] text-xs font-medium rounded-lg transition-colors cursor-pointer"
          >
            <Info className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reporting Protocol</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW MODE 1: TIMELINE STREAM (Vertical stage track with day selector)   */}
      {/* ========================================================================= */}
      {viewMode === 'timeline' && (
        <div className="space-y-8">
          {/* Day Selector Segmented Deck */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {FESTIVAL_SCHEDULE.map((d) => {
              const isSelected = activeDay === d.dayNumber;
              return (
                <button
                  key={d.dayNumber}
                  onClick={() => {
                    setActiveDay(d.dayNumber);
                    setSelectedPhase('all');
                  }}
                  className={`p-4 rounded-xl text-left transition-all border cursor-pointer relative overflow-hidden group ${
                    isSelected
                      ? 'bg-gradient-to-br from-[#121B42] to-[#0A102A] border-[#D4AF37] shadow-lg shadow-[#D4AF37]/15 ring-1 ring-[#D4AF37]/30'
                      : 'bg-[#080D24]/80 border-white/10 hover:border-white/25 hover:bg-[#0C1233]/80'
                  }`}
                >
                  {/* Subtle top indicator bar */}
                  <div
                    className={`absolute top-0 left-0 right-0 h-1 transition-all ${
                      isSelected ? 'bg-gradient-to-r from-[#D4AF37] to-[#F5E7C4]' : 'bg-transparent group-hover:bg-white/10'
                    }`}
                  />
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-mono font-bold tracking-widest uppercase ${isSelected ? 'text-[#D4AF37]' : 'text-slate-400'}`}>
                      DAY 0{d.dayNumber}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {d.dateStr.split(',')[0]}
                    </span>
                  </div>
                  <h3 className="font-cinzel text-base font-bold text-white group-hover:text-[#FFF7D6] transition-colors">
                    {d.themeTitle.split(':')[1] || d.themeTitle}
                  </h3>
                  <div className="flex items-center justify-between text-xs text-slate-400 mt-2 pt-2 border-t border-white/5">
                    <span>{d.slots.length} Stage Events</span>
                    <span className="text-[11px] text-[#E6C57D]">
                      {d.slots[0].time} – {d.slots[d.slots.length - 1].time}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Day Active Banner & Time Phase Filter */}
          <div className="bg-[#090E26]/70 border border-[#D4AF37]/25 rounded-2xl p-5 sm:p-6 backdrop-blur-md">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/10">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-[#D4AF37] tracking-wider mb-1">
                  <span>{currentDayData.dateStr}</span>
                  <span>·</span>
                  <span>{currentDayData.slots.length} Scheduled Sessions</span>
                </div>
                <h2 className="font-cinzel text-2xl sm:text-3xl font-bold text-white">
                  {currentDayData.themeTitle}
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 mt-1.5 max-w-2xl leading-relaxed">
                  {currentDayData.summary}
                </p>
              </div>

              {/* Time of Day Phase Jumpers */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs text-slate-400 font-medium mr-1 shrink-0">Time Phase:</span>
                <button
                  onClick={() => setSelectedPhase('all')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                    selectedPhase === 'all'
                      ? 'bg-[#15204C] text-[#F5E7C4] font-semibold border border-[#D4AF37]/50'
                      : 'text-slate-400 hover:text-white bg-transparent hover:bg-white/5'
                  }`}
                >
                  All ({currentDayData.slots.length})
                </button>

                <button
                  onClick={() => setSelectedPhase('morning')}
                  className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                    selectedPhase === 'morning'
                      ? 'bg-[#15204C] text-[#F5E7C4] font-semibold border border-[#D4AF37]/50'
                      : 'text-slate-400 hover:text-white bg-transparent hover:bg-white/5'
                  }`}
                >
                  <Sun className="w-3 h-3 text-amber-300" />
                  <span>Morning</span>
                </button>

                <button
                  onClick={() => setSelectedPhase('afternoon')}
                  className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                    selectedPhase === 'afternoon'
                      ? 'bg-[#15204C] text-[#F5E7C4] font-semibold border border-[#D4AF37]/50'
                      : 'text-slate-400 hover:text-white bg-transparent hover:bg-white/5'
                  }`}
                >
                  <Sunset className="w-3 h-3 text-orange-400" />
                  <span>Afternoon</span>
                </button>

                <button
                  onClick={() => setSelectedPhase('night')}
                  className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                    selectedPhase === 'night'
                      ? 'bg-[#15204C] text-[#F5E7C4] font-semibold border border-[#D4AF37]/50'
                      : 'text-slate-400 hover:text-white bg-transparent hover:bg-white/5'
                  }`}
                >
                  <Moon className="w-3 h-3 text-indigo-300" />
                  <span>Twilight & Night</span>
                </button>
              </div>
            </div>

            {/* Marquee Highlights ticker */}
            <div className="pt-3 flex flex-wrap items-center gap-2 text-xs text-slate-300">
              <span className="font-semibold text-[#D4AF37]">Running Highlights:</span>
              {currentDayData.highlights.map((h, i) => (
                <span key={i} className="text-slate-200">
                  {h}{i < currentDayData.highlights.length - 1 ? ' · ' : ''}
                </span>
              ))}
            </div>
          </div>

          {/* Chronological Timeline Track */}
          <div className="relative pl-6 sm:pl-10 space-y-6 before:absolute before:left-2 sm:before:left-3.5 before:top-4 before:bottom-4 before:w-0.5 before:bg-gradient-to-b before:from-[#D4AF37] before:via-[#D4AF37]/40 before:to-indigo-500/20">
            {filteredTimelineSlots.length > 0 ? (
              filteredTimelineSlots.map((slot, idx) => {
                const linkedEvent = getEventByCode(slot.code);
                const isDJNight = slot.title.toLowerCase().includes('dj night');
                const isFashion = slot.category === 'fashion';
                const isAuction = slot.title.toLowerCase().includes('ipl auction');

                return (
                  <div key={idx} className="relative group">
                    {/* Glowing Node on Timeline Rail */}
                    <div
                      className={`absolute -left-6 sm:-left-10 top-6 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        isDJNight
                          ? 'border-purple-400 bg-[#1D0E3B] shadow-[0_0_12px_rgba(168,85,247,0.7)]'
                          : slot.highlight
                          ? 'border-[#D4AF37] bg-[#0E153B] shadow-[0_0_10px_rgba(212,175,55,0.6)]'
                          : 'border-slate-500 bg-[#070B1F]'
                      }`}
                    >
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${
                          isDJNight ? 'bg-purple-300' : slot.highlight ? 'bg-[#D4AF37]' : 'bg-slate-400'
                        }`}
                      />
                    </div>

                    {/* Timeline Slot Card */}
                    <div
                      className={`rounded-2xl p-5 sm:p-6 transition-all border backdrop-blur-md ${
                        isDJNight
                          ? 'bg-gradient-to-br from-[#1A0F38]/90 via-[#100A26]/90 to-[#0A071E]/90 border-purple-500/40 hover:border-purple-400 shadow-lg shadow-purple-900/20'
                          : slot.highlight
                          ? 'bg-gradient-to-br from-[#0F1742]/90 via-[#0A102E]/90 to-[#060A20]/90 border-[#D4AF37]/40 hover:border-[#D4AF37]/70 shadow-md shadow-[#D4AF37]/10'
                          : 'bg-[#080D24]/80 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        {/* Left block: Time column + Slot description */}
                        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                          {/* Prominent Tabular Time Anchor */}
                          <div className="shrink-0 sm:w-32 bg-[#050818]/90 border border-white/10 rounded-xl p-3 text-center">
                            <div className="font-mono text-lg sm:text-xl font-bold text-[#F5E7C4] tracking-tight">
                              {slot.time}
                            </div>
                            <div className="text-[10px] font-mono uppercase text-slate-400 mt-0.5">
                              {getTimePhase(slot.time)} Session
                            </div>
                          </div>

                          {/* Details */}
                          <div>
                            {/* Metadata Line (Zero-pill discipline) */}
                            <div className="flex items-center gap-2 text-xs font-mono text-[#D4AF37] mb-1.5">
                              {slot.code && (
                                <>
                                  <span className="font-bold tracking-wider">{slot.code}</span>
                                  <span aria-hidden="true">·</span>
                                </>
                              )}
                              <span className="capitalize text-slate-300 font-sans">{slot.category}</span>
                              <span aria-hidden="true">·</span>
                              <span className="text-slate-400 font-sans">Slot {idx + 1} of {currentDayData.slots.length}</span>
                            </div>

                            {/* Slot Title */}
                            <h3 className="font-cinzel text-xl sm:text-2xl font-bold text-white group-hover:text-[#FFF7D6] transition-colors">
                              {slot.title}
                            </h3>

                            {/* Venue & Location */}
                            <div className="flex items-center gap-2 text-xs text-slate-300 mt-2">
                              <MapPin className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                              <span className="font-medium text-white">{slot.venue}</span>
                              <span className="text-slate-500">·</span>
                              <span className="text-slate-400">Campus Access Gate 1 & 2</span>
                            </div>

                            {/* Additional Highlights if specific event */}
                            {isDJNight && (
                              <p className="text-xs text-purple-200 mt-2.5 max-w-xl leading-relaxed">
                                Flagship evening pro-show headlined by guest DJs, featuring state-of-the-art concert lighting, visual effects, and open arena dance ground. Delegate badges compulsory for entry.
                              </p>
                            )}
                            {isFashion && (
                              <p className="text-xs text-amber-200/90 mt-2.5 max-w-xl leading-relaxed">
                                Grand thematic runway showcase with theatrical lighting and live judges panel. Green room access allocated in Block C.
                              </p>
                            )}
                            {isAuction && (
                              <p className="text-xs text-blue-200/90 mt-2.5 max-w-xl leading-relaxed">
                                Strategic cricket franchise simulation auction with virtual team wallets and real-time live projection board.
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Right block: Contextual action triggers */}
                        <div className="flex sm:flex-row md:flex-col items-start sm:items-center md:items-end gap-2.5 self-start shrink-0">
                          {isDJNight ? (
                            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wider uppercase text-purple-300 bg-purple-950/60 border border-purple-500/40 px-3 py-1.5 rounded-lg">
                              <Disc className="w-3 h-3 text-purple-400 animate-spin" />
                              <span>Grand Pro-Show</span>
                            </div>
                          ) : slot.highlight ? (
                            <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#D4AF37] bg-[#D4AF37]/10 border border-[#D4AF37]/30 px-2.5 py-1 rounded-md">
                              <Sparkles className="w-3 h-3" />
                              <span>Featured Competition</span>
                            </div>
                          ) : null}

                          {/* If linked to an official EventItem, offer quick detail modal / registration trigger */}
                          {linkedEvent && onViewEventDetails && (
                            <button
                              onClick={() => onViewEventDetails(linkedEvent)}
                              className="inline-flex items-center gap-1 text-xs text-slate-300 hover:text-[#F5E7C4] transition-colors cursor-pointer group/btn"
                            >
                              <span>View Rulebook & Prizes</span>
                              <ChevronRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                            </button>
                          )}

                          {linkedEvent && onOpenRegister && (
                            isEventRegistrationOpen(linkedEvent.id) && isEventRegistrationOpen(linkedEvent.code) ? (
                              <button
                                onClick={() => onOpenRegister(linkedEvent)}
                                className="px-3 py-1 text-xs font-semibold rounded-md bg-gradient-to-r from-[#D4AF37] to-[#B38D1B] text-[#050714] hover:shadow-md transition-all cursor-pointer"
                              >
                                Register Now
                              </button>
                            ) : (
                              <button
                                disabled
                                className="px-2.5 py-1 text-[11px] font-bold rounded-md bg-rose-950/60 text-rose-300 border border-rose-500/40 cursor-not-allowed flex items-center gap-1 opacity-90"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                                <span>Registration Closed</span>
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-16 bg-[#080D24]/40 border border-white/5 rounded-2xl">
                <Clock className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                <p className="text-sm text-slate-300 font-medium">No events found matching your filter.</p>
                <button
                  onClick={() => {
                    setSelectedPhase('all');
                    setSearchQuery('');
                  }}
                  className="mt-3 text-xs text-[#D4AF37] hover:underline cursor-pointer"
                >
                  Reset filters
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW MODE 2: 3-DAY MASTER MATRIX (Side-by-side synchronized comparison)  */}
      {/* ========================================================================= */}
      {viewMode === 'matrix' && (
        <div className="space-y-6">
          <div className="bg-[#090E26]/70 border border-[#D4AF37]/25 rounded-2xl p-4 sm:p-5 backdrop-blur-md flex items-center justify-between">
            <div>
              <h2 className="font-cinzel text-xl font-bold text-white">Full 3-Day Festival Programme Matrix</h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Side-by-side comparative timetable across all 3 festival days.
              </p>
            </div>
            <button
              onClick={handlePrint}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[#050817] hover:bg-white/10 border border-white/10 text-xs text-[#F5E7C4] rounded-lg cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Programme</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {FESTIVAL_SCHEDULE.map((day) => (
              <div
                key={day.dayNumber}
                className="bg-[#070B1F]/90 border border-white/10 rounded-2xl overflow-hidden flex flex-col shadow-xl"
              >
                {/* Column Day Header */}
                <div className="bg-gradient-to-r from-[#111A3E] to-[#0A102A] p-4 border-b border-[#D4AF37]/30">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs font-bold text-[#D4AF37] tracking-wider">
                      DAY 0{day.dayNumber}
                    </span>
                    <span className="font-mono text-xs text-slate-400">
                      {day.dateStr.split(',')[0]}
                    </span>
                  </div>
                  <h3 className="font-cinzel text-base font-bold text-white">
                    {day.themeTitle.split(':')[1] || day.themeTitle}
                  </h3>
                  <div className="text-[11px] text-slate-400 mt-1">
                    {day.slots.length} Scheduled Sessions
                  </div>
                </div>

                {/* Slots Column List */}
                <div className="p-3 sm:p-4 divide-y divide-white/5 space-y-3">
                  {day.slots.map((slot, sIdx) => {
                    const isDJNight = slot.title.toLowerCase().includes('dj night');
                    const linked = getEventByCode(slot.code);

                    return (
                      <div
                        key={sIdx}
                        className={`pt-3 first:pt-0 transition-colors rounded-xl p-3 ${
                          isDJNight
                            ? 'bg-purple-950/30 border border-purple-500/30'
                            : slot.highlight
                            ? 'bg-[#0E153B]/50 border border-[#D4AF37]/20 hover:border-[#D4AF37]/50'
                            : 'hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-mono mb-1">
                          <span className="font-bold text-[#F5E7C4]">{slot.time}</span>
                          <span className="text-[10px] uppercase text-slate-400 font-sans">{slot.category}</span>
                        </div>

                        <h4 className="font-cinzel text-sm font-bold text-white">
                          {slot.title}
                        </h4>

                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1">
                          <MapPin className="w-3 h-3 text-[#D4AF37] shrink-0" />
                          <span className="truncate">{slot.venue}</span>
                        </div>

                        {linked && onViewEventDetails && (
                          <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between">
                            <span className="text-[10px] font-mono text-slate-400">{slot.code}</span>
                            <button
                              onClick={() => onViewEventDetails(linked)}
                              className="text-[10px] text-[#D4AF37] hover:underline cursor-pointer"
                            >
                              Rulebook →
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW MODE 3: VENUES & STAGES CALL-SHEET (Venue-wise layout)              */}
      {/* ========================================================================= */}
      {viewMode === 'venues' && (
        <div className="space-y-6">
          <div className="bg-[#090E26]/70 border border-[#D4AF37]/25 rounded-2xl p-4 sm:p-5 backdrop-blur-md">
            <h2 className="font-cinzel text-xl font-bold text-white">Campus Venues & Stage Roster</h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Navigate programs based on Srinivasan Medical College campus zones.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(venueGroupings).map(([venueName, venueSlots], vIdx) => (
              <div
                key={vIdx}
                className="bg-[#080D24]/90 border border-white/10 rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur-md flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#0E153B] border border-[#D4AF37]/40 flex items-center justify-center">
                        <MapPin className="w-4 h-4 text-[#D4AF37]" />
                      </div>
                      <div>
                        <h3 className="font-cinzel text-base font-bold text-white">{venueName}</h3>
                        <p className="text-[11px] text-slate-400">Official Fest Stage</p>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-[#D4AF37]">
                      {venueSlots.length} Events
                    </span>
                  </div>

                  <div className="space-y-3">
                    {venueSlots.map((item, iIdx) => (
                      <div
                        key={iIdx}
                        className="p-3 bg-[#050818] rounded-xl border border-white/5 flex items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2 font-mono text-[11px] text-[#D4AF37] mb-0.5">
                            <span className="font-bold">DAY {item.dayNumber}</span>
                            <span>·</span>
                            <span className="text-white">{item.slot.time}</span>
                          </div>
                          <div className="font-cinzel font-bold text-slate-100">{item.slot.title}</div>
                        </div>
                        <span className="text-[10px] uppercase text-slate-400 shrink-0 capitalize">{item.slot.category}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-white/5 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Reporting: 45 min prior</span>
                  <span className="text-[#D4AF37]">Sound Check on slot call</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ATTENDEE & DELEGATE PROTOCOL MODAL                                        */}
      {/* ========================================================================= */}
      {showGuidelinesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#090E26] border border-[#D4AF37]/40 rounded-2xl max-w-xl w-full p-6 text-slate-200 relative shadow-2xl">
            <button
              onClick={() => setShowGuidelinesModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-xs font-mono text-[#D4AF37] uppercase tracking-wider mb-2">
              <Info className="w-4 h-4" />
              <span>Official Protocol</span>
            </div>

            <h3 className="font-cinzel text-xl font-bold text-white mb-4">
              Participant & Delegate Stage Protocol
            </h3>

            <div className="space-y-3.5 text-xs text-slate-300 leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
              <div className="p-3 bg-[#050818] border border-white/10 rounded-xl">
                <div className="font-bold text-white mb-1">1. Mandatory Reporting Time</div>
                All solo and team participants must report to the Central Registration Desk at least <strong>45 minutes</strong> before their scheduled time slot with their official college ID.
              </div>

              <div className="p-3 bg-[#050818] border border-white/10 rounded-xl">
                <div className="font-bold text-white mb-1">2. Audio & Media Track Submission</div>
                Karaoke and dance track submissions must be provided on a virus-free USB drive at the Sound Console at least 1 hour prior to stage slot. Audio format: MP3 / WAV (320kbps).
              </div>

              <div className="p-3 bg-[#050818] border border-white/10 rounded-xl">
                <div className="font-bold text-white mb-1">3. Green Rooms & Dressing Allocation</div>
                Dedicated green rooms are allocated in Block B & C. Team captains will receive room clearance keys upon verification.
              </div>

              <div className="p-3 bg-[#050818] border border-white/10 rounded-xl">
                <div className="font-bold text-white mb-1">4. DJ Night Access</div>
                DJ Night entry on Day 2 & Day 3 requires the Celestia'26 Delegate Band. Wristbands are distributed at the Registration Helpdesk upon registration clearance.
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowGuidelinesModal(false)}
                className="px-4 py-2 bg-gradient-to-r from-[#D4AF37] to-[#B38D1B] text-[#050714] text-xs font-bold rounded-lg cursor-pointer"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
