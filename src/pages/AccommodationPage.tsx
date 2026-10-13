import React, { useState } from 'react';
import { 
  Building2, 
  ShieldAlert, 
  Phone, 
  ExternalLink, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  FileText, 
  Copy, 
  Check, 
  MessageSquare,
  IndianRupee,
  UtensilsCrossed,
  Info,
  Calendar,
  Users
} from 'lucide-react';
import { NavigationPage } from '../components/Navbar';

interface AccommodationPageProps {
  onNavigate?: (page: NavigationPage) => void;
  onOpenRegister?: () => void;
}

export const AccommodationPage: React.FC<AccommodationPageProps> = ({
  onNavigate,
  onOpenRegister,
}) => {
  // Official Google Form link provided for Celestia'26 accommodation registration
  const OFFICIAL_FORM_URL = 'https://forms.gle/eQiuPYni1znrmEd48';

  const [copiedNumber, setCopiedNumber] = useState<string | null>(null);

  const handleCopyNumber = (num: string) => {
    navigator.clipboard.writeText(num);
    setCopiedNumber(num);
    setTimeout(() => setCopiedNumber(null), 2000);
  };

  // Accommodation in-charges provided by the organizers
  const contactInCharges = [
    {
      name: 'Rajamurugar V V',
      phone: '6379279332',
      phoneFormatted: '+91 63792 79332',
      role: 'Accommodation In-Charge',
    },
    {
      name: 'Parul S',
      phone: '8438417409',
      phoneFormatted: '+91 84384 17409',
      role: 'Accommodation In-Charge',
    },
    {
      name: 'Yogeshwaran',
      phone: '6382100725',
      phoneFormatted: '+91 63821 00725',
      role: 'Accommodation In-Charge',
    },
    {
      name: 'Kanagadharini',
      phone: '6381228064',
      phoneFormatted: '+91 63812 28064',
      role: 'Accommodation In-Charge',
    },
  ];

  // The 14 official accommodation rules
  const accommodationRules = [
    {
      id: 1,
      text: 'Accommodation must be confirmed individually by every participant through the registration link.',
      highlight: false,
    },
    {
      id: 2,
      text: 'All delegates must register to avail accommodation.',
      highlight: false,
    },
    {
      id: 3,
      text: 'A refundable caution deposit of ₹250 per person must be paid at the registration desk after arrival.',
      highlight: true,
      badge: 'Refundable Deposit',
    },
    {
      id: 4,
      text: 'Accommodation provided will be basic.',
      highlight: false,
    },
    {
      id: 5,
      text: 'Buckets will be provided.',
      highlight: false,
    },
    {
      id: 6,
      text: 'Participants are responsible for returning the accommodation in good condition.',
      highlight: false,
    },
    {
      id: 7,
      text: 'Beds, bedsheets, pillows and pillow covers will not be provided.',
      highlight: true,
      badge: 'Bring Your Own Bedding',
    },
    {
      id: 8,
      text: 'Accommodation will be allotted based on team size, arrival date and duration of stay. Accommodation will mostly be provided in rooms and halls, with more than 10 people per room.',
      highlight: false,
    },
    {
      id: 9,
      text: 'Rooms may be shared with delegates from other colleges.',
      highlight: false,
    },
    {
      id: 10,
      text: 'Organisers are not responsible for loss of valuables, luggage or other personal belongings.',
      highlight: false,
    },
    {
      id: 11,
      text: 'Smoking and consumption of alcohol or narcotics on campus are strictly prohibited.',
      highlight: true,
      badge: 'Strict Campus Rule',
      isWarning: true,
    },
    {
      id: 12,
      text: 'Violation of accommodation rules will lead to severe action.',
      highlight: true,
      isWarning: true,
    },
    {
      id: 13,
      text: 'A team may be denied participation or disqualified for misconduct by its members.',
      highlight: true,
      badge: 'Misconduct Disqualification',
      isWarning: true,
    },
    {
      id: 14,
      text: 'Any damage to college property will be fined accordingly.',
      highlight: true,
      isWarning: true,
    },
  ];

  // Accommodation and food charges according to page 62 of the brochure
  const chargesData = [
    {
      item: "Boys' accommodation",
      charge: '₹150/person/day',
      category: 'Accommodation',
      icon: Building2,
    },
    {
      item: "Girls' accommodation",
      charge: '₹150/person/day',
      category: 'Accommodation',
      icon: Building2,
    },
    {
      item: 'Refundable caution deposit',
      charge: '₹250/person',
      category: 'Caution Deposit',
      icon: IndianRupee,
      tag: 'Refundable',
    },
    {
      item: 'Food for boys and girls',
      charge: '₹150/person/day',
      category: 'Mess / Dining',
      icon: UtensilsCrossed,
    },
  ];

  return (
    <div className="relative z-10 pt-20 sm:pt-28 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* 1. Page Header & Hero Banner */}
      <div className="text-center max-w-4xl mx-auto mb-10 sm:mb-14">
        <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-[#D4AF37] mb-2 sm:mb-3">
          <Sparkles className="w-4 h-4 text-[#E6C57D]" />
          <span>DELEGATE HOSPITALITY & CAMPUS STAY</span>
        </div>
        <h1 className="font-cinzel text-2xl sm:text-5xl font-bold text-white mb-3 sm:mb-4 tracking-wide">
          CELESTIA’26 — Accommodation Rules & Contact Numbers
        </h1>
        <p className="text-xs sm:text-base text-slate-300 leading-relaxed max-w-2xl mx-auto">
          Welcome to Srinivasan Medical College & Hospital, Trichy. All delegates and participants must confirm accommodation individually via the official registration link.
        </p>

        {/* PRIMARY CALL TO ACTION BUTTON */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href={OFFICIAL_FORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-cinzel text-sm sm:text-base font-bold uppercase tracking-wider text-[#070B1B] bg-gradient-to-r from-[#F5E7C4] via-[#E6C57D] to-[#D4AF37] hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-[#D4AF37]/30 flex items-center justify-center gap-2.5 cursor-pointer group"
          >
            <span>Click here to register</span>
            <ExternalLink className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>
        </div>
      </div>

      {/* QUICK STATS / HIGHLIGHTS BAR */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-5xl mx-auto mb-12 sm:mb-16">
        <div className="p-4 rounded-xl celestial-glass border border-white/10 bg-[#080D24]/80 text-center">
          <span className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">Accommodation</span>
          <span className="font-cinzel text-base sm:text-xl font-bold text-[#F5E7C4]">₹150 / day</span>
          <span className="block text-[10px] text-slate-400 mt-0.5">Per person (Boys/Girls)</span>
        </div>
        <div className="p-4 rounded-xl celestial-glass border border-white/10 bg-[#080D24]/80 text-center">
          <span className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">Caution Deposit</span>
          <span className="font-cinzel text-base sm:text-xl font-bold text-[#D4AF37]">₹250</span>
          <span className="block text-[10px] text-emerald-400 font-medium mt-0.5">Refundable at desk</span>
        </div>
        <div className="p-4 rounded-xl celestial-glass border border-white/10 bg-[#080D24]/80 text-center">
          <span className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">Food Charges</span>
          <span className="font-cinzel text-base sm:text-xl font-bold text-[#F5E7C4]">₹150 / day</span>
          <span className="block text-[10px] text-slate-400 mt-0.5">Per person</span>
        </div>
        <div className="p-4 rounded-xl celestial-glass border border-white/10 bg-[#080D24]/80 text-center">
          <span className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">In-Charges Helpline</span>
          <span className="font-cinzel text-base sm:text-xl font-bold text-white">4 Coordinators</span>
          <span className="block text-[10px] text-[#E6C57D] font-mono mt-0.5">Call & WhatsApp 24/7</span>
        </div>
      </div>

      {/* =========================================================================
          SECTION 1: ACCOMMODATION RULES
         ========================================================================= */}
      <section className="mb-14 sm:mb-18 max-w-5xl mx-auto">
        <div className="celestial-glass rounded-2xl p-6 sm:p-10 border border-[#D4AF37]/40 bg-[#080D24]/90 relative overflow-hidden shadow-2xl">
          {/* Ornamental corner brackets */}
          <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-[#D4AF37]/70 pointer-events-none" />
          <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-[#D4AF37]/70 pointer-events-none" />
          <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-[#D4AF37]/70 pointer-events-none" />
          <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-[#D4AF37]/70 pointer-events-none" />

          {/* Section Header */}
          <div className="flex items-center gap-3.5 mb-8 pb-5 border-b border-white/10">
            <div className="w-11 h-11 rounded-xl bg-[#121B42] border border-[#D4AF37]/50 flex items-center justify-center text-[#E6C57D] shadow-md">
              <ShieldAlert className="w-6 h-6 text-[#D4AF37]" />
            </div>
            <div>
              <div className="text-[11px] font-mono uppercase tracking-widest text-[#D4AF37]">
                MANDATORY GUIDELINES
              </div>
              <h2 className="font-cinzel text-xl sm:text-3xl font-bold text-white tracking-wide">
                1. Accommodation rules
              </h2>
            </div>
          </div>

          {/* The 14 Rules in clean, structured list */}
          <div className="space-y-3.5">
            {accommodationRules.map((rule) => {
              return (
                <div
                  key={rule.id}
                  className={`p-4 rounded-xl border transition-all duration-200 flex items-start gap-3.5 ${
                    rule.isWarning
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-100 hover:border-rose-500/50'
                      : rule.highlight
                      ? 'bg-[#10183B]/80 border-[#D4AF37]/40 text-[#F5E7C4] hover:border-[#D4AF37]/70'
                      : 'bg-[#0B1028]/70 border-white/10 text-slate-200 hover:border-white/20'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold shrink-0 mt-0.5 ${
                      rule.isWarning
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : rule.highlight
                        ? 'bg-[#D4AF37]/20 text-[#F5E7C4] border border-[#D4AF37]/50'
                        : 'bg-white/10 text-slate-300 border border-white/15'
                    }`}
                  >
                    {rule.id}
                  </div>

                  <div className="flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-xs sm:text-sm font-medium leading-relaxed">
                        {rule.text}
                      </p>
                      {rule.badge && (
                        <span
                          className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border ${
                            rule.isWarning
                              ? 'bg-rose-500/20 border-rose-500/40 text-rose-200 font-bold'
                              : 'bg-[#D4AF37]/20 border-[#D4AF37]/40 text-[#E6C57D]'
                          }`}
                        >
                          {rule.badge}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Notice box */}
          <div className="mt-8 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3 text-xs text-amber-200">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <span>
              <strong>Important Notice:</strong> Strictly adhere to all accommodation rules. The ₹250 caution deposit must be submitted at the desk upon arrival and is fully refundable subject to property care and safe return.
            </span>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 2: ACCOMMODATION CONTACT NUMBERS
         ========================================================================= */}
      <section className="mb-14 sm:mb-18 max-w-5xl mx-auto">
        <div className="celestial-glass rounded-2xl p-6 sm:p-10 border border-[#D4AF37]/40 bg-[#080D24]/90 relative overflow-hidden shadow-2xl">
          {/* Section Header */}
          <div className="flex items-center gap-3.5 mb-8 pb-5 border-b border-white/10">
            <div className="w-11 h-11 rounded-xl bg-[#121B42] border border-[#D4AF37]/50 flex items-center justify-center text-[#E6C57D] shadow-md">
              <Phone className="w-6 h-6 text-[#D4AF37]" />
            </div>
            <div>
              <div className="text-[11px] font-mono uppercase tracking-widest text-[#D4AF37]">
                HELP DESK & ASSISTANCE
              </div>
              <h2 className="font-cinzel text-xl sm:text-3xl font-bold text-white tracking-wide">
                2. Accommodation contact numbers
              </h2>
            </div>
          </div>

          {/* Interactive Contact Cards (Single display) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {contactInCharges.map((contact, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-white/10 bg-[#0B1028] hover:border-[#D4AF37]/50 transition-all flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-cinzel text-base font-bold text-white">
                      {contact.name}
                    </h3>
                    <span className="text-[11px] font-mono text-[#D4AF37]">
                      {contact.role}
                    </span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[#121B42] flex items-center justify-center text-[#E6C57D]">
                    <Phone className="w-4 h-4 text-[#D4AF37]" />
                  </div>
                </div>

                <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                  <span className="font-mono text-sm font-bold text-[#F5E7C4]">
                    {contact.phoneFormatted}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleCopyNumber(contact.phone)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
                      title="Copy phone number"
                    >
                      {copiedNumber === contact.phone ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <a
                      href={`tel:${contact.phone}`}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Phone className="w-3 h-3" />
                      <span>Call</span>
                    </a>
                    <a
                      href={`https://wa.me/91${contact.phone}?text=Hello%20${encodeURIComponent(contact.name)}%2C%20regarding%20Celestia%2726%20Accommodation`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1.5 rounded-lg bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] border border-[#25D366]/40 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>WhatsApp</span>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 3: ACCOMMODATION AND FOOD CHARGES
         ========================================================================= */}
      <section className="mb-14 sm:mb-18 max-w-5xl mx-auto">
        <div className="celestial-glass rounded-2xl p-6 sm:p-10 border border-[#D4AF37]/40 bg-[#080D24]/90 relative overflow-hidden shadow-2xl">
          {/* Section Header */}
          <div className="flex items-center gap-3.5 mb-6 pb-5 border-b border-white/10">
            <div className="w-11 h-11 rounded-xl bg-[#121B42] border border-[#D4AF37]/50 flex items-center justify-center text-[#E6C57D] shadow-md">
              <IndianRupee className="w-6 h-6 text-[#D4AF37]" />
            </div>
            <div>
              <div className="text-[11px] font-mono uppercase tracking-widest text-[#D4AF37]">
                OFFICIAL BROCHURE TARIFF
              </div>
              <h2 className="font-cinzel text-xl sm:text-3xl font-bold text-white tracking-wide">
                3. Accommodation and food charges
              </h2>
            </div>
          </div>

          {/* Brochure Reference Subtitle */}
          <p className="text-xs sm:text-sm text-slate-300 font-mono mb-4 flex items-center gap-2">
            <Info className="w-4 h-4 text-[#E6C57D] shrink-0" />
            <span>According to page 62 of the brochure:</span>
          </p>

          {/* Charges Table */}
          <div className="overflow-x-auto rounded-xl border border-white/15 bg-[#0A0F2B]/90 mb-6 shadow-inner">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-[#121A3D] border-b border-white/15 text-[#F5E7C4] font-cinzel">
                  <th className="py-3.5 px-4 sm:px-6 font-bold uppercase tracking-wider">
                    Item
                  </th>
                  <th className="py-3.5 px-4 sm:px-6 font-bold uppercase tracking-wider font-mono">
                    Charge
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {chargesData.map((row, idx) => {
                  const Icon = row.icon;
                  return (
                    <tr key={idx} className="hover:bg-white/5 transition-colors">
                      <td className="py-3.5 px-4 sm:px-6 text-white font-medium">
                        <div className="flex items-center gap-2.5">
                          <Icon className="w-4 h-4 text-[#D4AF37] shrink-0" />
                          <span>{row.item}</span>
                          {row.tag && (
                            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold">
                              {row.tag}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 font-mono font-bold text-[#F5E7C4] text-sm sm:text-base">
                        {row.charge}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Important Highlight Box as instructed */}
          <div className="p-4 sm:p-5 rounded-xl bg-gradient-to-r from-[#121B42] to-[#0A0F2B] border border-[#D4AF37]/40 text-xs sm:text-sm text-slate-200 space-y-1.5">
            <div className="flex items-center gap-2 font-cinzel font-bold text-[#F5E7C4]">
              <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
              <span>Important Tariff Conditions</span>
            </div>
            <p className="text-slate-300 leading-relaxed pl-6">
              Important: The ₹250 caution deposit is refundable, subject to the applicable conditions. Accommodation and food are charged separately.
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 4: PROMINENT REGISTRATION BANNER WITH GOOGLE FORMS LINK
         ========================================================================= */}
      <section className="mb-14 max-w-5xl mx-auto">
        <div className="celestial-glass rounded-2xl p-6 sm:p-10 border-2 border-[#D4AF37]/70 bg-gradient-to-br from-[#0B1238] via-[#080D24] to-[#121942] relative overflow-hidden shadow-2xl text-center">
          {/* Ornamental corner brackets */}
          <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-[#D4AF37] pointer-events-none" />
          <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-[#D4AF37] pointer-events-none" />
          <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-[#D4AF37] pointer-events-none" />
          <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-[#D4AF37] pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono uppercase tracking-widest text-[#070B1B] bg-gradient-to-r from-[#F5E7C4] to-[#D4AF37] font-bold">
              <FileText className="w-3.5 h-3.5" />
              <span>CONFIRM YOUR STAY NOW</span>
            </div>

            <h3 className="font-cinzel text-xl sm:text-3xl font-bold text-white tracking-wide">
              Official Accommodation Registration Link
            </h3>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Ensure your team's on-campus stay is secured. Click the button below to complete individual delegate confirmation via Google Forms.
            </p>

            <div className="pt-2">
              <a
                href={OFFICIAL_FORM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-3 px-8 sm:px-10 py-4 rounded-xl font-cinzel text-sm sm:text-base font-bold uppercase tracking-wider text-[#070B1B] bg-gradient-to-r from-[#F5E7C4] via-[#E6C57D] to-[#D4AF37] hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-[#D4AF37]/30 cursor-pointer group"
              >
                <span>Click here to register</span>
                <ExternalLink className="w-5 h-5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
              </a>
            </div>

            <p className="text-[11px] font-mono text-[#E6C57D]/80 pt-1">
              Link: {OFFICIAL_FORM_URL}
            </p>
          </div>
        </div>
      </section>

      {/* BOTTOM NAVIGATION CTA */}
      <section className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="font-cinzel text-base font-bold text-white">
            Ready to participate in Celestia'26?
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Register your events team or delegate entry today.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {onNavigate && (
            <button
              onClick={() => onNavigate('events')}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-[#F5E7C4] bg-white/5 border border-white/10 hover:border-[#D4AF37]/40 transition-colors cursor-pointer"
            >
              Browse All Events
            </button>
          )}

          {onOpenRegister && (
            <button
              onClick={onOpenRegister}
              className="px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider text-[#080D24] bg-gradient-to-r from-[#F5E7C4] to-[#D4AF37] hover:brightness-110 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>Register Events</span>
              <CheckCircle2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </section>
    </div>
  );
};
