import React from 'react';
import { Sparkles, ArrowRight, Phone, Mail } from 'lucide-react';
import { Hero } from '../components/Hero';
import { EventCard } from '../components/EventCard';
import { DistinguishedGuests } from '../components/DistinguishedGuests';
import { 
  EVENTS_DATA, 
  CategoryInfo, 
  EventItem 
} from '../data/festivalData';
import { NavigationPage } from '../components/Navbar';

interface HomePageProps {
  onNavigate: (page: NavigationPage) => void;
  onSelectCategory?: (categoryId: CategoryInfo['id']) => void;
  onViewEventDetails: (event: EventItem) => void;
  onOpenRegister: (event?: EventItem) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onNavigate,
  onSelectCategory,
  onViewEventDetails,
  onOpenRegister,
}) => {
  // Curate 3 spotlight preview events for the homepage to keep it compact and scannable
  const spotlightEvents = EVENTS_DATA.slice(0, 3);

  const categoryPills: { id: CategoryInfo['id'] | 'all'; label: string }[] = [
    { id: 'all', label: `All ${EVENTS_DATA.length} Events` },
    { id: 'music', label: `Music (${EVENTS_DATA.filter(e => e.category === 'music').length})` },
    { id: 'dance', label: `Dance (${EVENTS_DATA.filter(e => e.category === 'dance').length})` },
    { id: 'fashion', label: `Fashion (${EVENTS_DATA.filter(e => e.category === 'fashion').length})` },
    { id: 'entertainment', label: `Entertainment (${EVENTS_DATA.filter(e => e.category === 'entertainment').length})` },
    { id: 'media', label: `Digital & Media (${EVENTS_DATA.filter(e => e.category === 'media').length})` },
    { id: 'special', label: `Special (${EVENTS_DATA.filter(e => e.category === 'special').length})` },
  ];

  const handleCategoryClick = (catId: CategoryInfo['id'] | 'all') => {
    if (catId === 'all') {
      onNavigate('events');
    } else if (onSelectCategory) {
      onSelectCategory(catId);
    } else {
      onNavigate('events');
    }
  };

  return (
    <div className="relative z-10 space-y-4">
      {/* 1. HERO SECTION */}
      <Hero 
        onExploreEvents={() => onNavigate('events')} 
        onOpenRegister={() => onOpenRegister()} 
      />

      {/* 2. QUICK STATS */}
      <section className="py-6 px-4 sm:px-6 max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="celestial-glass rounded-xl p-4 sm:p-5 border border-white/10 text-center">
            <div className="font-cinzel text-xl sm:text-2xl md:text-3xl font-extrabold gold-gradient-text tabular-nums">
              3 DAYS
            </div>
            <div className="text-[11px] sm:text-xs text-slate-400 mt-1 uppercase tracking-wider font-medium">
              Nov 3 | 4 | 5, 2026
            </div>
          </div>

          <div className="celestial-glass rounded-xl p-4 sm:p-5 border border-white/10 text-center">
            <div className="font-cinzel text-xl sm:text-2xl md:text-3xl font-extrabold gold-gradient-text tabular-nums">
              12 EVENTS
            </div>
            <div className="text-[11px] sm:text-xs text-slate-400 mt-1 uppercase tracking-wider font-medium">
              Main Stage
            </div>
          </div>

          <div className="celestial-glass rounded-xl p-4 sm:p-5 border border-white/10 text-center">
            <div className="font-cinzel text-xl sm:text-2xl md:text-3xl font-extrabold gold-gradient-text tabular-nums">
              ₹1.43 LAKH+
            </div>
            <div className="text-[11px] sm:text-xs text-slate-400 mt-1 uppercase tracking-wider font-medium">
              Cash Prizes
            </div>
          </div>

          <div className="celestial-glass rounded-xl p-4 sm:p-5 border border-white/10 text-center">
            <div className="font-cinzel text-xl sm:text-2xl md:text-3xl font-extrabold gold-gradient-text tabular-nums">
              INTERCOLLEGIATE
            </div>
            <div className="text-[11px] sm:text-xs text-slate-400 mt-1 uppercase tracking-wider font-medium">
              Cultural Fest
            </div>
          </div>
        </div>
      </section>

      {/* 3. SHORT ABOUT SECTION */}
      <section className="py-8 sm:py-10 px-4 sm:px-6 max-w-4xl mx-auto">
        <div className="celestial-glass rounded-2xl p-6 sm:p-10 border border-[#D4AF37]/25 text-center relative overflow-hidden">
          {/* Subtle cosmic accent glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-radial from-[#6366F1]/10 to-transparent rounded-full pointer-events-none" />

          <h2 className="font-cinzel text-xl sm:text-2xl md:text-3xl font-bold text-white mb-3 tracking-wide leading-snug">
            THREE DAYS. TWELVE EVENTS. ONE CELESTIAL STAGE.
          </h2>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Celestia'26 brings colleges together for three unforgettable days of music, dance, fashion and entertainment at Srinivasan Medical College and Hospital, Trichy.
          </p>
        </div>
      </section>

      {/* 4. SECTION 1: TWO MAIN / DISTINGUISHED GUESTS */}
      <DistinguishedGuests onViewAllGuests={() => onNavigate('guests')} />

      {/* 5. MAIN EVENTS SECTION */}
      <section id="events-section" className="py-10 sm:py-14 px-4 sm:px-6 max-w-7xl mx-auto scroll-mt-20">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 sm:mb-8 gap-4">
          <div>
            <div className="text-xs font-semibold tracking-widest uppercase text-[#D4AF37] mb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>CELESTIA'26 EVENTS</span>
            </div>
            <h2 className="font-cinzel text-2xl sm:text-4xl font-bold text-white">
              EXPLORE THE EVENTS
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Choose your stage. Make your moment.
            </p>
          </div>

          <button
            onClick={() => onNavigate('events')}
            className="text-xs font-semibold tracking-wider uppercase text-[#E6C57D] hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-end"
          >
            <span>View All {EVENTS_DATA.length} Events</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Category Pills (Directly jump to filtered Events page) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
          {categoryPills.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat.id)}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap bg-white/5 text-slate-300 border border-white/10 hover:border-[#D4AF37]/50 hover:text-white transition-colors cursor-pointer"
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* 3 Spotlight Events Preview Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 mb-8">
          {spotlightEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onViewDetails={onViewEventDetails}
              onRegister={onOpenRegister}
            />
          ))}
        </div>

        {/* Prominent "View All Events" CTA Banner */}
        <div className="celestial-glass rounded-xl p-5 border border-[#D4AF37]/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left bg-[#0A0F2C]">
          <div>
            <h3 className="font-cinzel text-base sm:text-lg font-bold text-white">
              Looking for Symphora, Nrityara, Step Sync, and more?
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Explore the full catalog of {EVENTS_DATA.length} competitions with search and category filters.
            </p>
          </div>

          <button
            onClick={() => onNavigate('events')}
            className="w-full sm:w-auto px-6 py-2.5 text-xs font-bold tracking-wider uppercase text-[#070B1B] bg-gradient-to-r from-[#F5E7C4] to-[#D4AF37] hover:brightness-110 active:scale-95 transition-all rounded-lg shadow-sm shadow-[#D4AF37]/25 flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <span>View All {EVENTS_DATA.length} Events</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* 6. REGISTRATION CTA */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 max-w-4xl mx-auto">
        <div className="relative celestial-glass rounded-3xl p-8 sm:p-12 text-center border border-[#D4AF37]/35 shadow-2xl overflow-hidden">
          {/* Subtle star ring */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border border-[#D4AF37]/10 animate-orbit pointer-events-none" />

          <div className="relative z-10 max-w-xl mx-auto">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-[#D4AF37] mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>REGISTRATION OPEN</span>
            </div>

            <h2 className="font-cinzel text-2xl sm:text-4xl font-bold text-white mb-3 leading-tight">
              Register for Celestia'26
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
              Register individually or represent your college as a team across 12 music, dance, fashion and cultural events.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => onOpenRegister()}
                className="w-full sm:w-auto px-8 py-3 text-xs font-bold tracking-wider uppercase text-[#070B1B] bg-gradient-to-r from-[#F5E7C4] via-[#E6C57D] to-[#D4AF37] hover:brightness-110 active:scale-95 transition-all rounded-lg shadow-md shadow-[#D4AF37]/25 cursor-pointer"
              >
                Register Now
              </button>

              <button
                onClick={() => onNavigate('contact')}
                className="w-full sm:w-auto px-6 py-3 text-xs font-semibold tracking-wider uppercase text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all cursor-pointer"
              >
                Contact & Inquiries
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 7. HOMEPAGE CONTACT & HELPLINE BAR (Touch-to-call & mail optimized for mobile) */}
      <section className="py-4 sm:py-6 px-4 sm:px-6 max-w-4xl mx-auto">
        <div className="celestial-glass rounded-2xl p-5 sm:p-6 border border-[#D4AF37]/30 bg-[#080D24]/90 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-[#D4AF37] uppercase tracking-widest block font-semibold">
              OFFICIAL FESTIVAL HELPDESK
            </span>
            <h3 className="font-cinzel text-base sm:text-lg font-bold text-white">
              Student Convenors & Inquiries
            </h3>
            <p className="text-xs text-slate-300">
              Assistance with event registrations, guidelines, and accommodations.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto shrink-0">
            {/* Phone link */}
            <a
              href="tel:+919080813899"
              className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs text-slate-200 hover:text-white flex items-center justify-center gap-2 transition-colors font-mono"
              title="Call Helpline"
            >
              <Phone className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>+91 9080813899 / +91 9150272527</span>
            </a>

            {/* Email link */}
            <a
              href="mailto:celestiasmch@gmail.com"
              className="px-3.5 py-2 rounded-xl bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25 border border-[#D4AF37]/40 text-xs text-[#F5E7C4] hover:text-white flex items-center justify-center gap-2 transition-colors font-mono font-medium"
              title="Email Secretariat"
            >
              <Mail className="w-3.5 h-3.5 text-[#E6C57D]" />
              <span>celestiasmch@gmail.com</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};
