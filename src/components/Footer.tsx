import React from 'react';
import { Sparkles, MapPin, Calendar, ArrowUp } from 'lucide-react';
import { FESTIVAL_METADATA } from '../data/festivalData';
import { NavigationPage } from './Navbar';

interface FooterProps {
  onNavigate: (page: NavigationPage) => void;
  onOpenRegister: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onOpenRegister }) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative bg-[#040612] border-t border-[#D4AF37]/20 pt-12 pb-10 text-slate-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16 pb-10 border-b border-white/5 items-start">
          {/* Brand and College Column */}
          <div className="space-y-3.5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full border border-[#D4AF37]/40 flex items-center justify-center bg-[#101736]">
                <Sparkles className="w-4 h-4 text-[#E6C57D]" />
              </div>
              <span className="font-cinzel text-2xl font-bold gold-gradient-text tracking-wider">
                {FESTIVAL_METADATA.edition}
              </span>
            </div>

            <p className="font-cinzel text-sm text-[#F3E5AB] tracking-widest uppercase">
              "{FESTIVAL_METADATA.theme}"
            </p>

            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-md">
              The annual flagship intercollegiate cultural festival hosted by {FESTIVAL_METADATA.collegeName}, fostering artistic virtuosity, dance, music, and collegiate spirit.
            </p>

            <div className="text-xs text-slate-400 space-y-1.5 pt-1">
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#D4AF37] shrink-0 mt-0.5" />
                <span>Samayapuram, Trichy - Chennai Highway, Tamil Nadu 621112</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                <span>November 3, 4 & 5, 2026</span>
              </div>
            </div>
          </div>

          {/* Connect & Helpdesk */}
          <div className="md:justify-self-end w-full md:max-w-xs space-y-3">
            <h4 className="font-cinzel text-xs font-bold uppercase tracking-widest text-white">
              Connect & Helpdesk
            </h4>
            <div className="space-y-2.5 text-xs text-slate-400">
              <div>
                <span className="block text-[11px] text-slate-500 uppercase font-mono">Official Email</span>
                <span className="text-slate-300 font-mono text-xs">{FESTIVAL_METADATA.officialEmail}</span>
              </div>
              <div>
                <span className="block text-[11px] text-slate-500 uppercase font-mono">Helpline</span>
                <span className="text-slate-300 font-mono text-xs">{FESTIVAL_METADATA.inquiryContact}</span>
              </div>
              <div className="pt-2">
                <button
                  onClick={onOpenRegister}
                  className="w-full py-2.5 px-4 text-center text-xs font-bold uppercase tracking-wider text-[#0B1028] bg-gradient-to-r from-[#F5E7C4] to-[#D4AF37] rounded-lg transition-all hover:brightness-110 cursor-pointer shadow-sm shadow-[#D4AF37]/20"
                >
                  Register Now
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div>
            © 2026 Celestia'26 · Srinivasan Medical College and Hospital, Trichy. All Rights Reserved.
          </div>
          <div className="flex items-center gap-5 sm:gap-6 flex-wrap">
            <button
              onClick={() => onNavigate('accommodation')}
              className="text-slate-400 hover:text-[#F5E7C4] transition-colors cursor-pointer text-xs font-mono"
            >
              Accommodation
            </button>
            <button
              onClick={scrollToTop}
              className="hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer text-slate-400"
            >
              <span>Back to Top</span>
              <ArrowUp className="w-3.5 h-3.5 text-[#D4AF37]" />
            </button>
          </div>
        </div>

        {/* Creator Attribution */}
        <div className="pt-4 mt-5 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Website created by</span>
            <span className="font-semibold text-[#F5E7C4] tracking-wide font-cinzel text-xs sm:text-sm border-b border-[#D4AF37]/50 pb-0.5">
              Surya Narayan P
            </span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
            <span>Celestia'26 Official Cultural Portal</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
