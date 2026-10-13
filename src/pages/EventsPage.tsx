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
    <div className="relative z-10 pt-20 sm:pt-28 pb-12 sm:pb-20 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="text-center max-w-3xl mx-auto mb-6 sm:mb-10">
        <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-[#D4AF37] mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>FESTIVAL DIRECTORY</span>
        </div>
        <h1 className="font-cinzel text-2xl sm:text-5xl font-bold text-white mb-2 sm:mb-3">
          Events & Competitions
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          Official competition roster for {FESTIVAL_METADATA.edition} at {FESTIVAL_METADATA.collegeName}, Trichy. Registration deadline: <strong className="text-[#F5E7C4]">{FESTIVAL_METADATA.registrationDeadlineFormatted}</strong>.
        </p>
      </div>

      {/* Filter and Search Controls */}
      <div className="celestial-glass rounded-xl p-3.5 sm:p-6 mb-6 sm:mb-8 border border-[#D4AF37]/25 space-y-3.5 sm:space-y-4">
        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search events by name, code (e.g. SERAPHIA, SYMPHORA, NRITYARA), or category..."
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

        {/* Filter Tabs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2 border-t border-white/5">
          {/* Category Tabs: All, Music, Dance, Fashion, Entertainment, Special Events */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <span className="text-xs text-slate-400 font-medium mr-1 shrink-0">Category:</span>
            <button
              onClick={() => onCategoryChange('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-gradient-to-r from-[#F5E7C4] to-[#D4AF37] text-[#070B1B] font-bold shadow-sm'
                  : 'bg-[#090E25] text-slate-300 hover:text-white border border-white/5 hover:border-white/20'
              }`}
            >
              All
            </button>
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => onCategoryChange(cat.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#F5E7C4] to-[#D4AF37] text-[#070B1B] font-bold shadow-sm'
                      : 'bg-[#090E25] text-slate-300 hover:text-white border border-white/5 hover:border-white/20'
                  }`}
                >
                  {cat.title}
                </button>
              );
            })}
          </div>

          {/* Format Tabs: Solo, Duo, Team */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs text-slate-400 font-medium mr-1">Type:</span>
            {(['all', 'Solo', 'Duo', 'Team'] as const).map((fmt) => (
              <button
                key={fmt}
                onClick={() => setSelectedType(fmt)}
                className={`px-2.5 py-1 text-xs rounded transition-colors cursor-pointer ${
                  selectedType === fmt
                    ? 'bg-[#15204C] text-[#F5E7C4] font-semibold border border-[#D4AF37]/50'
                    : 'text-slate-400 hover:text-white bg-transparent hover:bg-white/5'
                }`}
              >
                {fmt === 'all' ? 'All' : fmt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Count & Reset Filter Indicator */}
      <div className="flex items-center justify-between text-xs text-slate-400 mb-6 px-1">
        <div>
          Showing <span className="font-semibold text-white">{filteredEvents.length}</span> event{filteredEvents.length !== 1 ? 's' : ''}
          {selectedCategory !== 'all' && (
            <span> in <span className="text-[#E6C57D] capitalize">{selectedCategory}</span></span>
          )}
          {selectedType !== 'all' && (
            <span> ({selectedType} only)</span>
          )}
        </div>

        {(selectedCategory !== 'all' || selectedType !== 'all' || searchQuery) && (
          <button
            onClick={() => {
              onCategoryChange('all');
              setSelectedType('all');
              setSearchQuery('');
            }}
            className="text-[11px] text-[#D4AF37] hover:underline cursor-pointer"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Events Grid */}
      {filteredEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
        <div className="celestial-glass rounded-2xl p-12 text-center max-w-md mx-auto border border-white/10">
          <Sparkles className="w-8 h-8 text-[#D4AF37] mx-auto mb-3 opacity-60" />
          <h3 className="font-cinzel text-lg font-bold text-white mb-1">
            No Competitions Found
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Try adjusting your search keywords or switching category filters.
          </p>
          <button
            onClick={() => {
              onCategoryChange('all');
              setSelectedType('all');
              setSearchQuery('');
            }}
            className="py-2 px-4 text-xs font-semibold text-[#070B1B] bg-gradient-to-r from-[#F5E7C4] to-[#D4AF37] rounded-md transition-all cursor-pointer"
          >
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  );
};
