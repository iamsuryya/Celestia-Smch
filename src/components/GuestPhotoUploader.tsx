import React from 'react';
import { User, Sparkles } from 'lucide-react';
import { useInlineEditor } from '../context/EditorContext';

interface GuestPhotoUploaderProps {
  guestId: string;
  guestName: string;
  defaultPhoto?: string;
  variant?: 'large' | 'compact';
  role?: string;
}

/**
 * Pristine Guest Portrait Display Component.
 * In production/hosting mode, all editing triggers and upload buttons
 * are completely removed so guests are presented cleanly and professionally.
 */
export const GuestPhotoUploader: React.FC<GuestPhotoUploaderProps> = ({
  guestId,
  guestName,
  defaultPhoto = '',
  variant = 'compact',
  role,
}) => {
  const { getGuestPhoto } = useInlineEditor();

  const currentPhoto = getGuestPhoto(guestId, defaultPhoto);
  const isLarge = variant === 'large';

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden rounded-lg bg-[#070B1E]">
      {/* Pristine Guest Photo Display */}
      {currentPhoto ? (
        <img
          src={currentPhoto}
          alt={guestName}
          className="w-full h-full object-cover object-top select-none pointer-events-none"
          loading="lazy"
          onError={(e) => {
            // Graceful fallback to styled silhouette if image fails to load
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
      ) : (
        /* Celestial Dignitary Silhouette for unannounced guests */
        <div className="flex flex-col items-center justify-center p-3 text-center w-full h-full bg-gradient-to-b from-[#0C1333] to-[#070B1E]">
          <div className={`${isLarge ? 'w-14 h-14' : 'w-10 h-10'} rounded-full bg-[#121B40] border border-[#D4AF37]/35 flex items-center justify-center mb-2 text-[#E6C57D] shadow-inner`}>
            <User className={`${isLarge ? 'w-7 h-7' : 'w-5 h-5'} text-[#D4AF37]/80`} />
          </div>
          <span className="text-[10px] uppercase font-mono tracking-wider text-[#D4AF37]/80">
            Dignitary of Honour
          </span>
        </div>
      )}

      {/* Subtle Role Badge */}
      {role && !isLarge && (
        <div className="absolute bottom-2 left-2 pointer-events-none z-10 max-w-[calc(100%-16px)]">
          <span className="inline-block px-2 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider text-[#F5E7C4] bg-[#070B1E]/90 border border-[#D4AF37]/35 backdrop-blur-sm truncate max-w-full">
            {role}
          </span>
        </div>
      )}
    </div>
  );
};
