import React from 'react';

export const CosmicBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#050714]">
      {/* Deep cosmic gradient mesh */}
      <div 
        className="absolute inset-0 opacity-70"
        style={{
          background: `
            radial-gradient(circle at 50% 12%, rgba(79, 30, 130, 0.28) 0%, transparent 45%),
            radial-gradient(circle at 85% 25%, rgba(29, 78, 216, 0.18) 0%, transparent 45%),
            radial-gradient(circle at 15% 60%, rgba(109, 40, 217, 0.16) 0%, transparent 40%),
            radial-gradient(circle at 75% 85%, rgba(197, 160, 89, 0.08) 0%, transparent 45%),
            radial-gradient(circle at 50% 100%, rgba(15, 23, 42, 0.8) 0%, transparent 60%)
          `
        }}
      />

      {/* Astronomical Orbital Rings */}
      <div className="absolute top-[-180px] left-1/2 -translate-x-1/2 w-[900px] h-[900px] md:w-[1200px] md:h-[1200px] rounded-full border border-[#D4AF37]/10 animate-orbit" />
      <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[720px] h-[720px] md:w-[980px] md:h-[980px] rounded-full border border-dashed border-[#818CF8]/10 animate-orbit-reverse" />
      <div className="absolute top-[80px] left-1/2 -translate-x-1/2 w-[540px] h-[540px] md:w-[760px] md:h-[760px] rounded-full border border-[#D4AF37]/8" />

      {/* Subtle Star Points */}
      <svg className="absolute inset-0 w-full h-full opacity-35" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="starGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFF7D6" stopOpacity="1" />
            <stop offset="100%" stopColor="#FFF7D6" stopOpacity="0" />
          </radialGradient>
        </defs>
        {/* Constellation vector lines */}
        <line x1="12%" y1="18%" x2="18%" y2="22%" stroke="rgba(212,175,55,0.12)" strokeWidth="0.75" />
        <line x1="18%" y1="22%" x2="25%" y2="16%" stroke="rgba(212,175,55,0.12)" strokeWidth="0.75" />
        <line x1="82%" y1="15%" x2="88%" y2="24%" stroke="rgba(197,160,89,0.12)" strokeWidth="0.75" />
        <line x1="88%" y1="24%" x2="80%" y2="35%" stroke="rgba(197,160,89,0.12)" strokeWidth="0.75" />

        {/* Scattered fixed stars */}
        <circle cx="12%" cy="18%" r="1.5" fill="#FFF7D6" opacity="0.8" />
        <circle cx="18%" cy="22%" r="2" fill="#D4AF37" opacity="0.9" />
        <circle cx="25%" cy="16%" r="1.5" fill="#E2E8F0" opacity="0.7" />
        <circle cx="32%" cy="28%" r="1" fill="#E2E8F0" opacity="0.5" />
        <circle cx="45%" cy="12%" r="2" fill="#FFF7D6" opacity="0.85" />
        <circle cx="62%" cy="19%" r="1.5" fill="#93C5FD" opacity="0.7" />
        <circle cx="72%" cy="10%" r="1" fill="#E2E8F0" opacity="0.6" />
        <circle cx="82%" cy="15%" r="2.5" fill="#FCE7F3" opacity="0.85" />
        <circle cx="88%" cy="24%" r="1.5" fill="#D4AF37" opacity="0.9" />
        <circle cx="80%" cy="35%" r="2" fill="#FFF7D6" opacity="0.75" />
        <circle cx="94%" cy="42%" r="1" fill="#E2E8F0" opacity="0.4" />
        <circle cx="8%" cy="55%" r="2" fill="#93C5FD" opacity="0.65" />
        <circle cx="15%" cy="72%" r="1" fill="#FFF7D6" opacity="0.5" />
        <circle cx="28%" cy="84%" r="1.5" fill="#E2E8F0" opacity="0.6" />
        <circle cx="70%" cy="65%" r="2" fill="#D4AF37" opacity="0.75" />
        <circle cx="85%" cy="78%" r="1.5" fill="#FFF7D6" opacity="0.8" />
        <circle cx="92%" cy="88%" r="1" fill="#E2E8F0" opacity="0.5" />
        <circle cx="50%" cy="92%" r="1.5" fill="#93C5FD" opacity="0.7" />
      </svg>
    </div>
  );
};
