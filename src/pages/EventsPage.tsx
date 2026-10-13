import React, { useState, useMemo } from 'react';
import { Search, Sparkles, X, Users } from 'lucide-react';
import { EventCard } from '../components/EventCard';
import { EVENTS_DATA, CATEGORIES, EventItem, CategoryInfo, FESTIVAL_METADATA } from '../data/festivalData';

interface EventsPageProps {
  selectedCategory: CategoryInfo['id'] | 'all';
  onCategoryChange: (cat: CategoryInfo['id'] | 'all') => void;
  onViewDetails: (event: EventItem) => void;
  onRegister: (event: EventItem) => void;
}

export const EventsPage: React.FC<EventsPageProps> = ({
  selectedCategory,
  onCategoryChange,
  onViewDetails,
  onRegister,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'Solo' | 'Duo' | 'Team'>('all');

  const filteredEvents = useMemo(() => {
    return EVENTS_DATA.filter((event) => {
      // Category match
      if (selectedCategory !== 'all' && event.category !== selectedCategory) {
        return false;
      }
      // Type match: Solo, Duo, Team
      if (selectedType !== 'all' && event.type !== selectedType) {
        return false;
      }
      // Search match
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = event.title.toLowerCase().includes(query);
        const matchesCode = event.code.toLowerCase().includes(query);
        const matchesCategory = event.categoryDisplay.toLowerCase().includes(query);
        const matchesVenue = event.venue.toLowerCase().includes(query);
        const matchesTheme = event.theme ? event.theme.toLowerCase().includes(query) : false;
        if (!matchesTitle && !matchesCode && !matchesCategory && !matchesVenue && !matchesTheme) {
          return false;
        }
      }
      return true;
    });
  }, [selectedCategory, selectedType, searchQuery]);

  return (
    <div className="relative z-10 pt-20 sm:pt-28 pb-12 sm:pb-20 px-3.5 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Page Header - Matching Screen 2 of Reference Image */}
      <div className="text-center max-w-3xl mx-auto mb-6 sm:mb-10">
        <h1 className="font-cinzel text-3xl sm:text-5xl font-extrabold text-[#F5E7C4] tracking-wide mb-1 sm:mb-2">
          OUR EVENTS
        </h1>
        <div className="flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold tracking-widest uppercase text-[#D4AF37]">
          <span>12 UNIQUE EVENTS</span>
          <span>✦</span>
          <span>MULTIPLE CATEGORIES</span>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="celestial-glass rounded-2xl p-3.5 sm:p-6 mb-6 sm:mb-8 border border-[#D4AF37]/25 space-y-3.5 sm:space-y-4">
        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search events by name, code (SERAPHIA, SYMPHORA...), or category..."
            className="w-full pl-10 pr-10 py-2.5 bg-[#080D24] border border-white/15 rounded-xl text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-[#D4AF37] transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-3.5 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Category Pills Row (Matching Screen 2) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2 border-t border-white/10">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              type="button"
              onClick={() => onCategoryChange('all')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-full whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-[#E8DFFA] text-[#060B1E] font-bold shadow-md'
                  : 'bg-white/10 text-slate-200 hover:bg-white/15 border border-white/10'
              }`}
            >
              All
            </button>
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => onCategoryChange(cat.id)}
                  className={`px-4 py-1.5 text-xs font-semibold rounded-full whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#E8DFFA] text-[#060B1E] font-bold shadow-md'
                      : 'bg-white/10 text-slate-200 hover:bg-white/15 border border-white/10'
                  }`}
                >
                  {cat.title} ✦
                </button>
              );
            })}
          </div>

          {/* Type Selector Pills */}
          <div className="flex items-center gap-1.5 shrink-0 pt-1 md:pt-0">
            <span className="text-xs text-slate-400 font-medium mr-1">Type:</span>
            {(['all', 'Solo', 'Duo', 'Team'] as const).map((fmt) => (
              <button
                type="button"
                key={fmt}
                onClick={() => setSelectedType(fmt)}
                className={`px-3 py-1 text-xs rounded-full transition-all cursor-pointer ${
                  selectedType === fmt
                    ? 'bg-[#182352] text-[#F5E7C4] font-semibold border border-[#D4AF37]/50'
                    : 'text-slate-400 hover:text-white bg-transparent hover:bg-white/5'
                }`}
              >
                {fmt === 'all' ? 'All' : fmt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-xs text-slate-300 mb-4 px-1 font-medium">
        <div>
          Showing <span className="font-bold text-[#F5E7C4]">{filteredEvents.length}</span> event{filteredEvents.length !== 1 ? 's' : ''}
        </div>
        {(selectedCategory !== 'all' || selectedType !== 'all' || searchQuery) && (
          <button
            type="button"
            onClick={() => {
              onCategoryChange('all');
              setSelectedType('all');
              setSearchQuery('');
            }}
            className="text-xs text-[#D4AF37] hover:underline"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Event Grid - Mobile uses horizontal cards, desktop uses 3-column cards */}
      {filteredEvents.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-6">
          {filteredEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onViewDetails={onViewDetails}
              onRegister={onRegister}
            />
          ))}
        </div>
      ) : (
        <div className="celestial-glass rounded-2xl p-10 text-center border border-white/10 space-y-3">
          <p className="text-slate-300 text-sm">No events found matching your filter criteria.</p>
          <button
            type="button"
            onClick={() => {
              onCategoryChange('all');
              setSelectedType('all');
              setSearchQuery('');
            }}
            className="px-4 py-2 text-xs font-bold text-[#060B1E] bg-[#D4AF37] rounded-full"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
};
