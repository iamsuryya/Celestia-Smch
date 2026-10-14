import React, { useState, useEffect } from 'react';
import { Menu, X, Sparkles, UserCheck, LogOut } from 'lucide-react';

export type NavigationPage = 'home' | 'events' | 'guests' | 'schedule' | 'accommodation' | 'results' | 'about' | 'contact' | 'admin' | 'admin1' | 'incharges';

interface NavbarProps {
  currentPage: NavigationPage;
  onNavigate: (page: NavigationPage) => void;
  onOpenRegister: () => void;
  userFullName?: string | null;
  onOpenDashboard?: () => void;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  onNavigate,
  onOpenRegister,
  userFullName,
  onOpenDashboard,
  onLogout,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems: { label: string; page: NavigationPage }[] = [
    { label: 'Home', page: 'home' },
    { label: 'Events', page: 'events' },
    { label: 'Event Guests', page: 'guests' },
    { label: 'Schedule', page: 'schedule' },
    { label: 'Accommodation', page: 'accommodation' },
    { label: 'Results', page: 'results' },
    { label: 'About', page: 'about' },
    { label: 'Contact', page: 'contact' },
  ];

  const handleNavClick = (page: NavigationPage) => {
    onNavigate(page);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-[#070B1C]/92 backdrop-blur-md border-b border-[#D4AF37]/20 shadow-lg shadow-black/40 py-3' 
          : 'bg-transparent border-b border-white/5 py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-11">
          {/* Zone 1: Single element wordmark brand title */}
          <button
            onClick={() => handleNavClick('home')}
            className="group text-left flex items-center gap-2 cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-[#D4AF37]"
            aria-label="Celestia 26 Home"
          >
            <div className="w-8 h-8 rounded-full border border-[#D4AF37]/40 flex items-center justify-center bg-[#101736]/70 group-hover:border-[#D4AF37] transition-colors">
              <Sparkles className="w-4 h-4 text-[#E6C57D]" />
            </div>
            <span className="font-cinzel text-xl sm:text-2xl font-bold tracking-wider gold-gradient-text">
              CELESTIA'26
            </span>
          </button>

          {/* Zone 2: Clean text navigation links */}
          <nav className="hidden md:flex items-center gap-4 lg:gap-6 text-xs lg:text-sm font-medium">
            {navItems.map((item) => {
              const isActive = currentPage === item.page;
              return (
                <button
                  key={item.page}
                  onClick={() => handleNavClick(item.page)}
                  className={`relative py-1 cursor-pointer transition-colors whitespace-nowrap ${
                    isActive 
                      ? 'text-[#F5E7C4] font-semibold' 
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Primary action button & mobile toggle */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {userFullName && (
              <div className="hidden sm:flex items-center gap-1 bg-[#101736] border border-[#D4AF37]/35 rounded-lg p-0.5">
                {onOpenDashboard && (
                  <button
                    onClick={onOpenDashboard}
                    className="flex items-center gap-1.5 py-1 px-2.5 rounded-md text-xs font-semibold text-[#F5E7C4] hover:bg-[#182454] transition-colors cursor-pointer"
                    title="View Registrations Dashboard"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span className="truncate max-w-[100px]">{userFullName.split(' ')[0]}</span>
                  </button>
                )}
                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="p-1 rounded-md text-slate-400 hover:text-rose-300 hover:bg-rose-500/15 transition-colors cursor-pointer"
                    title={`Logout (${userFullName})`}
                    aria-label="Logout"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            <button
              onClick={onOpenRegister}
              className="px-4 sm:px-5 py-2 text-xs font-semibold tracking-wider uppercase text-[#0B1026] bg-gradient-to-r from-[#F5E7C4] via-[#E6C57D] to-[#D4AF37] hover:brightness-110 active:scale-95 transition-all rounded-md shadow-sm shadow-[#D4AF37]/30 whitespace-nowrap cursor-pointer"
            >
              Register
            </button>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-300 hover:text-white rounded-md border border-white/10 hover:border-[#D4AF37]/40 transition-colors cursor-pointer"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-[#E6C57D]" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#070B1E]/98 backdrop-blur-xl border-b border-[#D4AF37]/25 px-5 py-6 shadow-2xl transition-all">
          <div className="flex flex-col gap-2">
            {navItems.map((item) => {
              const isActive = currentPage === item.page;
              return (
                <button
                  key={item.page}
                  onClick={() => handleNavClick(item.page)}
                  className={`flex items-center justify-between text-left py-2.5 px-3 rounded-md text-base transition-colors ${
                    isActive 
                      ? 'bg-[#141C42] text-[#F5E7C4] font-semibold border-l-2 border-[#D4AF37]' 
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span>{item.label}</span>
                  {isActive && <span className="text-xs text-[#D4AF37] font-mono">Active</span>}
                </button>
              );
            })}

            {userFullName && (
              <div className="pt-2 border-t border-white/10 space-y-1.5">
                <div className="px-3 py-1 text-[11px] text-slate-400 font-mono">
                  Signed in as <strong className="text-white">{userFullName}</strong>
                </div>
                {onOpenDashboard && (
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenDashboard();
                    }}
                    className="w-full py-2.5 px-3 text-left text-xs font-semibold text-[#F5E7C4] bg-[#121B3E] rounded-md border border-[#D4AF37]/30 flex items-center justify-between cursor-pointer"
                  >
                    <span>My Registrations Dashboard</span>
                    <UserCheck className="w-4 h-4 text-[#D4AF37]" />
                  </button>
                )}
                {onLogout && (
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onLogout();
                    }}
                    className="w-full py-2 px-3 text-left text-xs font-semibold text-rose-300 hover:text-white bg-rose-500/10 hover:bg-rose-500/20 rounded-md border border-rose-500/30 flex items-center justify-between cursor-pointer"
                  >
                    <span>Logout ({userFullName.split(' ')[0]})</span>
                    <LogOut className="w-4 h-4 text-rose-400" />
                  </button>
                )}
              </div>
            )}

            <div className="pt-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenRegister();
                }}
                className="w-full py-3 text-center text-xs font-bold tracking-widest uppercase text-[#0B1026] bg-gradient-to-r from-[#F5E7C4] via-[#E6C57D] to-[#D4AF37] rounded-md shadow-md"
              >
                Register for Celestia'26
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
