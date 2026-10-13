import React from 'react';
import { Sparkles, Building2, HeartHandshake, Shield, Compass, MapPin, Award, Star } from 'lucide-react';
import { FESTIVAL_METADATA } from '../data/festivalData';

export const AboutPage: React.FC = () => {
  return (
    <div className="relative z-10 pt-20 sm:pt-28 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-12 sm:space-y-16">
      {/* Page Header / Subtitle banner */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-[#D4AF37] px-3 py-1 rounded-full celestial-glass border border-[#D4AF37]/30">
          <Sparkles className="w-3.5 h-3.5" />
          <span>November 3–5, 2026 | Srinivasan Medical College and Hospital, Trichy</span>
        </div>
        <h1 className="font-cinzel text-3xl sm:text-5xl font-extrabold text-white tracking-wide">
          CELESTIA’26
        </h1>
        <p className="font-cinzel text-lg sm:text-2xl text-[#E6C57D] tracking-widest uppercase">
          BEYOND THE STARS
        </p>
      </div>

      {/* Main Content Card */}
      <div className="celestial-glass rounded-3xl p-6 sm:p-12 border border-[#D4AF37]/30 shadow-2xl space-y-10">
        
        {/* INSTITUTION & FESTIVAL LEGACY */}
        <div className="space-y-6">
          <div className="border-b border-white/10 pb-4">
            <span className="text-xs font-mono uppercase tracking-widest text-[#D4AF37]">INSTITUTION & FESTIVAL LEGACY</span>
            <h2 className="font-cinzel text-2xl sm:text-3xl font-bold text-white mt-1">About Celestia’26</h2>
          </div>

          <div className="space-y-4 text-slate-300 text-sm sm:text-base leading-relaxed">
            <h3 className="font-cinzel text-lg sm:text-xl font-semibold text-[#E9DDFB]">
              A Celebration of Creativity, Culture and Connection
            </h3>
            <p>
              Celestia’26 is an intercollegiate cultural festival hosted by Srinivasan Medical College and Hospital, Trichy. Bringing together students from different colleges, the festival provides a platform to showcase artistic talent, celebrate cultural diversity and build meaningful connections beyond the classroom.
            </p>
            <p>
              From music and dance to creative expression and competitive events, Celestia’26 celebrates the individuality, imagination and collective spirit of student life.
            </p>
          </div>
        </div>

        {/* The Concept & Ethos */}
        <div className="space-y-6 pt-4 border-t border-white/10">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-[#D4AF37]">The Concept & Ethos</span>
            <h2 className="font-cinzel text-2xl sm:text-3xl font-bold text-white mt-1">
              “Beyond the Stars” — Where Talent Finds Its Universe
            </h2>
          </div>

          <div className="space-y-4 text-slate-300 text-sm sm:text-base leading-relaxed">
            <p>
              Every individual has a unique light to share. Celestia’26 draws inspiration from the vastness of the cosmos, celebrating the many talents, ideas and passions that make every student distinctive.
            </p>
            <p>
              Beyond academics and professional pursuits, college life offers opportunities to explore creativity, discover new interests and form lasting friendships. Celestia’26 brings these experiences together through a celebration of art, performance, culture and friendly competition.
            </p>
            <p>
              With its cosmic identity and spirit of togetherness, the festival aspires to create memorable experiences for participants and establish a foundation for future editions, including Celestia’27 and beyond.
            </p>
          </div>
        </div>

        {/* Host Institution */}
        <div className="space-y-6 pt-4 border-t border-white/10">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-[#D4AF37]">Host Institution</span>
            <h2 className="font-cinzel text-2xl sm:text-3xl font-bold text-white mt-1">
              Srinivasan Medical College and Hospital, Trichy
            </h2>
          </div>

          <div className="space-y-4 text-slate-300 text-sm sm:text-base leading-relaxed">
            <p>
              Srinivasan Medical College and Hospital (SMCH) is a medical educational institution established in 2021 under the Dhanalakshmi Srinivasan Charitable and Educational Trust. Located at Samayapuram, Tiruchirappalli, along the NH-45 Trichy–Chennai Trunk Road, the institution is committed to medical education and healthcare.
            </p>
            <p>
              The institution provides an academic environment supported by teaching facilities, laboratories, a central library and a teaching hospital. Its educational approach emphasises professional competence, ethical values and a commitment to serving society.
            </p>
            <p>
              As the host of Celestia’26, SMCH welcomes students to come together in the spirit of creativity, participation and cultural exchange.
            </p>
          </div>

          {/* Institutional Address Box */}
          <div className="bg-[#0A1430]/80 rounded-2xl p-5 border border-[#D4AF37]/30 flex items-start gap-3">
            <MapPin className="w-5 h-5 text-[#D4AF37] shrink-0 mt-1" />
            <div>
              <h4 className="font-cinzel text-sm font-bold text-white uppercase tracking-wider mb-1">Institutional Address</h4>
              <p className="text-xs sm:text-sm text-slate-300 whitespace-pre-line leading-relaxed">
                Srinivasan Medical College and Hospital{'\n'}
                NH-45, Trichy–Chennai Trunk Road, near Samayapuram Toll Plaza,{'\n'}
                Samayapuram, Tiruchirappalli, Tamil Nadu – 621112.
              </p>
            </div>
          </div>
        </div>

        {/* The Celestia Experience */}
        <div className="space-y-6 pt-4 border-t border-white/10">
          <div>
            <h2 className="font-cinzel text-2xl sm:text-3xl font-bold text-white">
              The Celestia Experience
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 rounded-xl bg-[#0A1430]/60 border border-white/10 hover:border-[#D4AF37]/40 transition-colors space-y-2">
              <div className="flex items-center gap-2 text-[#D4AF37]">
                <Star className="w-4 h-4" />
                <h3 className="font-cinzel text-base font-bold text-white">A Stage for Every Talent</h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-300">
                A platform for students to participate, perform and showcase their abilities across a range of cultural events.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-[#0A1430]/60 border border-white/10 hover:border-[#D4AF37]/40 transition-colors space-y-2">
              <div className="flex items-center gap-2 text-[#D4AF37]">
                <Sparkles className="w-4 h-4" />
                <h3 className="font-cinzel text-base font-bold text-white">Creativity Without Boundaries</h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-300">
                An opportunity to explore artistic expression, celebrate diverse interests and discover new perspectives.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-[#0A1430]/60 border border-white/10 hover:border-[#D4AF37]/40 transition-colors space-y-2">
              <div className="flex items-center gap-2 text-[#D4AF37]">
                <HeartHandshake className="w-4 h-4" />
                <h3 className="font-cinzel text-base font-bold text-white">Competition & Camaraderie</h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-300">
                A celebration of sportsmanship, teamwork, mutual respect and the friendships formed through shared experiences.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-[#0A1430]/60 border border-white/10 hover:border-[#D4AF37]/40 transition-colors space-y-2">
              <div className="flex items-center gap-2 text-[#D4AF37]">
                <Award className="w-4 h-4" />
                <h3 className="font-cinzel text-base font-bold text-white">A Tradition in the Making</h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-300">
                An initiative envisioned to grow through future editions, creating a lasting place for cultural expression in college life.
              </p>
            </div>
          </div>
        </div>

        {/* Our Vision */}
        <div className="space-y-4 pt-4 border-t border-white/10">
          <h2 className="font-cinzel text-xl sm:text-2xl font-bold text-white">Our Vision</h2>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            To create an inclusive and memorable intercollegiate cultural celebration where students can express themselves freely, appreciate diverse talents and connect through the universal language of art and culture.
          </p>
        </div>

        {/* Welcome to Celestia’26 Footer Banner */}
        <div className="celestial-glass rounded-2xl p-6 sm:p-8 border border-[#D4AF37]/40 text-center space-y-4 bg-gradient-to-b from-[#10264A]/60 to-[#0A1430]">
          <h3 className="font-cinzel text-xl sm:text-2xl font-bold text-[#F8F0E3]">
            Welcome to Celestia’26
          </h3>
          <p className="font-cinzel text-sm sm:text-base text-[#D4AF37] tracking-wider font-semibold">
            Three days. Countless talents. One shared universe.
          </p>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Join us at Srinivasan Medical College and Hospital, Trichy, from November 3 to 5, 2026, as we come together to celebrate creativity, culture and the spirit of student life.
          </p>
          <div className="pt-2 font-cinzel text-xs sm:text-sm text-white font-bold tracking-widest uppercase">
            Your talent. Your moment. Your universe.
          </div>
          <div className="text-xs font-mono text-[#D4AF37] tracking-widest uppercase pt-2">
            CELESTIA’26 — BEYOND THE STARS
          </div>
        </div>

      </div>
    </div>
  );
};
