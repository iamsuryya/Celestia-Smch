import React, { useState } from 'react';
import { Trophy, Search, Clock, Award, Sparkles, Filter } from 'lucide-react';
import { useResults } from '../context/ResultsContext';
import { EVENTS_DATA } from '../data/festivalData';

export const ResultsPage: React.FC = () => {
  const { results } = useResults();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Map each of the 12 events to its current results state
  const combinedEvents = EVENTS_DATA.map((event) => {
    const resultItem = results.find((r) => r.eventId === event.id);
    return {
      event,
      result: resultItem,
    };
  });

  const filteredItems = combinedEvents.filter(({ event, result }) => {
    if (selectedCategory !== 'all' && event.category !== selectedCategory) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchEvent =
        event.title.toLowerCase().includes(q) ||
        event.code.toLowerCase().includes(q) ||
        event.categoryDisplay.toLowerCase().includes(q);

      const matchWinner =
        result?.status === 'PUBLISHED' &&
        (result?.winner?.participantName.toLowerCase().includes(q) ||
          result?.winner?.collegeName.toLowerCase().includes(q) ||
          result?.runnerUp?.participantName.toLowerCase().includes(q) ||
          result?.runnerUp?.collegeName.toLowerCase().includes(q) ||
          result?.secondRunnerUp?.participantName.toLowerCase().includes(q) ||
          result?.secondRunnerUp?.collegeName.toLowerCase().includes(q));

      return matchEvent || matchWinner;
    }

    return true;
  });

  const categories = [
    { id: 'all', label: 'All Events', count: results.length },
    { id: 'music', label: 'Music', count: results.filter(r => r.category === 'music').length },
    { id: 'dance', label: 'Dance', count: results.filter(r => r.category === 'dance').length },
    { id: 'fashion', label: 'Fashion', count: results.filter(r => r.category === 'fashion').length },
    { id: 'entertainment', label: 'Entertainment', count: results.filter(r => r.category === 'entertainment').length },
    { id: 'media', label: 'Digital & Media', count: results.filter(r => r.category === 'media').length },
    { id: 'special', label: 'Special', count: results.filter(r => r.category === 'special').length },
  ];

  return (
    <div className="relative z-10 pt-20 sm:pt-28 pb-12 sm:pb-24 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="text-center max-w-3xl mx-auto mb-6 sm:mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#E6C57D] text-xs font-mono tracking-widest uppercase mb-2 sm:mb-3">
          <Trophy className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>CELESTIA'26 RESULTS</span>
        </div>
        <h1 className="font-cinzel text-2xl sm:text-5xl font-bold text-white mb-2 sm:mb-3 tracking-wide">
          CELESTIA'26 RESULTS
        </h1>
        <p className="text-xs sm:text-base text-slate-300 leading-relaxed font-light">
          Celebrating the performances that rose beyond the stars.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6 sm:mb-10 pb-4 sm:pb-6 border-b border-white/10">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 w-full md:w-auto">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-gradient-to-r from-[#D4AF37] to-[#B38F26] text-[#050714] font-bold shadow-md shadow-[#D4AF37]/20'
                    : 'bg-[#0B1028]/80 text-slate-300 border border-white/10 hover:border-[#D4AF37]/40 hover:text-white'
                }`}
              >
                {cat.label} ({cat.count})
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search event or participant..."
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-[#0B1028]/90 border border-white/10 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all"
          />
        </div>
      </div>

      {/* Event-Wise Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {filteredItems.map(({ event, result }) => {
          const isPublished = result?.status === 'PUBLISHED' && Boolean(result?.winner || result?.runnerUp);

          return (
            <div
              key={event.id}
              className={`rounded-2xl transition-all duration-300 flex flex-col justify-between overflow-hidden relative ${
                isPublished
                  ? 'bg-[#0C122D]/90 border border-[#D4AF37]/45 shadow-xl shadow-black/40 hover:border-[#D4AF37]'
                  : 'bg-[#080D21]/80 border border-white/10 hover:border-white/20'
              }`}
            >
              {/* Subtle top gold aura when published */}
              {isPublished && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />
              )}

              {/* Card Header */}
              <div className="p-6 pb-4 border-b border-white/5">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] font-mono tracking-wider text-[#D4AF37] uppercase font-semibold">
                    {event.code}
                  </span>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-white/5 text-slate-300 border border-white/10 uppercase tracking-wide">
                    {event.type}
                  </span>
                </div>
                <h3 className="font-cinzel text-xl sm:text-2xl font-bold text-white tracking-wide">
                  {event.title}
                </h3>
                <p className="text-xs text-[#E6C57D] font-medium mt-0.5">
                  {event.categoryDisplay}
                </p>
              </div>

              {/* Card Body: Results Section */}
              <div className="p-6 pt-5 flex-1 flex flex-col justify-center">
                {isPublished ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-1 border-b border-white/10">
                      <span className="text-[11px] font-mono font-bold tracking-widest text-[#D4AF37] uppercase">
                        RESULTS
                      </span>
                      {result?.publishedAt && (
                        <span className="text-[10px] text-slate-300 font-mono">
                          Announced {result.publishedAt}
                        </span>
                      )}
                    </div>

                    {/* 🥇 WINNER */}
                    {result?.winner && (
                      <div className="p-3.5 rounded-xl bg-gradient-to-r from-[#D4AF37]/15 to-transparent border border-[#D4AF37]/35">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-xs font-bold font-cinzel text-[#F5E7C4] tracking-wide flex items-center gap-1.5">
                            <span className="text-base">🥇</span> WINNER
                          </span>
                          {result.winner.prizeAmount && (
                            <span className="text-[11px] font-mono text-[#D4AF37] font-semibold">
                              {result.winner.prizeAmount}
                            </span>
                          )}
                        </div>
                        <div className="font-semibold text-sm text-white">
                          {result.winner.participantName}
                        </div>
                        <div className="text-xs text-slate-300 mt-0.5 font-light">
                          {result.winner.collegeName}
                        </div>
                      </div>
                    )}

                    {/* 🥈 RUNNER-UP */}
                    {result?.runnerUp && (
                      <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-xs font-bold font-cinzel text-slate-200 tracking-wide flex items-center gap-1.5">
                            <span className="text-base">🥈</span> RUNNER-UP
                          </span>
                          {result.runnerUp.prizeAmount && (
                            <span className="text-[11px] font-mono text-slate-300 font-semibold">
                              {result.runnerUp.prizeAmount}
                            </span>
                          )}
                        </div>
                        <div className="font-semibold text-sm text-slate-100">
                          {result.runnerUp.participantName}
                        </div>
                        <div className="text-xs text-slate-300 mt-0.5 font-light">
                          {result.runnerUp.collegeName}
                        </div>
                      </div>
                    )}

                    {/* 🥉 SECOND RUNNER-UP */}
                    {result?.secondRunnerUp && (
                      <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-xs font-bold font-cinzel text-amber-200/90 tracking-wide flex items-center gap-1.5">
                            <span className="text-base">🥉</span> SECOND RUNNER-UP
                          </span>
                          {result.secondRunnerUp.prizeAmount && (
                            <span className="text-[11px] font-mono text-slate-300">
                              {result.secondRunnerUp.prizeAmount}
                            </span>
                          )}
                        </div>
                        <div className="font-medium text-xs sm:text-sm text-slate-200">
                          {result.secondRunnerUp.participantName}
                        </div>
                        <div className="text-[11px] text-slate-300 mt-0.5">
                          {result.secondRunnerUp.collegeName}
                        </div>
                      </div>
                    )}

                    {/* Special Awards */}
                    {result?.specialAwards && result.specialAwards.length > 0 && (
                      <div className="pt-2 border-t border-white/10 space-y-2">
                        {result.specialAwards.map((award, aIdx) => (
                          <div key={aIdx} className="text-xs p-2 rounded-lg bg-[#D4AF37]/5 border border-[#D4AF37]/20">
                            <span className="text-[10px] uppercase font-mono tracking-wider text-[#D4AF37] block font-semibold">
                              🎖️ {award.awardTitle}
                            </span>
                            <span className="font-medium text-slate-200 block text-xs">
                              {award.participantName}
                            </span>
                            <span className="text-[11px] text-slate-300 block">
                              {award.collegeName}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  /* UNANNOUNCED / PENDING STATE */
                  <div className="py-8 px-4 text-center rounded-xl bg-black/20 border border-white/5 flex flex-col items-center justify-center my-auto">
                    <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 mb-3">
                      <Clock className="w-5 h-5 text-slate-400" />
                    </div>
                    <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed max-w-[240px]">
                      Results will be announced after the event.
                    </p>
                    <span className="mt-3 inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono text-slate-300 bg-white/5 border border-white/10">
                      Adjudication Pending
                    </span>
                  </div>
                )}
              </div>

              {/* Card Footer: Event Venue & Prize Context */}
              <div className="px-6 py-3.5 bg-black/30 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-300">
                <span className="font-mono">Venue: {event.venue}</span>
                <span className="font-mono text-[#E6C57D]">
                  Prize Pool: {event.prizes?.totalFormatted || 'Official Accolades'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-16 bg-[#080D21]/50 rounded-2xl border border-white/10">
          <p className="text-slate-400 text-sm">No events match your current search or category filter.</p>
        </div>
      )}
    </div>
  );
};
