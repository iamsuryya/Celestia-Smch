import React from 'react';

export const CosmicBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#080C1F]">
      {/* Subtle deep cosmic gradient mesh */}
      <div 
        className="absolute inset-0 opacity-50"
        style={{
          background: `
            radial-gradient(circle at 50% 0%, rgba(35, 25, 65, 0.4) 0%, transparent 60%),
            radial-gradient(circle at 85% 20%, rgba(20, 35, 75, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 15% 70%, rgba(30, 20, 55, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 50% 100%, rgba(8, 12, 31, 0.9) 0%, transparent 70%)
          `
        }}
      />

      {/* Subtle Star Points */}
      <svg className="absolute inset-0 w-full h-full opacity-30" xmlns="http://www.w3.org/2000/svg">
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
