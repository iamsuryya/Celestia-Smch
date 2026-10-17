import React, { useState, useEffect } from 'react';
import { User } from 'lucide-react';
import { useInlineEditor } from '../context/EditorContext';
import rioRajAsset from '../assets/images/rio-raj.jpg';
import aparnaDasAsset from '../assets/images/aparna-das.jpg';

interface GuestPhotoUploaderProps {
  guestId: string;
  guestName: string;
  defaultPhoto?: string;
  variant?: 'large' | 'compact';
  role?: string;
}

export const GuestPhotoUploader: React.FC<GuestPhotoUploaderProps> = ({
  guestId,
  guestName,
  defaultPhoto = '',
  variant = 'compact',
  role,
}) => {
  const { getGuestPhoto, removeGuestPhoto } = useInlineEditor();

  // Robust candidate image paths
  const candidateUrls: string[] = React.useMemo(() => {
    if (guestId === 'main-guest-1') {
      return [
        rioRajAsset,
        '/images/guests/rio-raj.jpg',
        defaultPhoto,
      ].filter(Boolean);
    }
    if (guestId === 'main-guest-2') {
      return [
        aparnaDasAsset,
        '/images/guests/aparna-das.jpg',
        defaultPhoto,
      ].filter(Boolean);
    }
    return [defaultPhoto].filter(Boolean);
  }, [guestId, defaultPhoto]);

  const [candidateIndex, setCandidateIndex] = useState(0);
  const [allFailed, setAllFailed] = useState(false);

  // Custom photo from inline editor or storage has priority (unless it's empty or legacy .svg)
  const rawStoredPhoto = getGuestPhoto(guestId, '');
  const storedPhoto = rawStoredPhoto && !rawStoredPhoto.endsWith('.svg') && rawStoredPhoto.trim().length > 0 ? rawStoredPhoto : '';

  useEffect(() => {
    setCandidateIndex(0);
    setAllFailed(false);
  }, [guestId, defaultPhoto, storedPhoto]);

  const currentPhoto = storedPhoto || candidateUrls[candidateIndex] || candidateUrls[0] || '';
  const isLarge = variant === 'large';

  const handleImgError = () => {
    if (storedPhoto && storedPhoto !== candidateUrls[candidateIndex]) {
      // Custom stored photo failed, revert to official candidate list
      removeGuestPhoto(guestId);
      setCandidateIndex(0);
      return;
    }

    if (candidateIndex + 1 < candidateUrls.length) {
      setCandidateIndex((prev) => prev + 1);
    } else {
      setAllFailed(true);
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden rounded-lg bg-[#070B1E]">
      {/* Guest Photo Display */}
      {currentPhoto && !allFailed ? (
        <img
          src={currentPhoto}
          alt={guestName}
          className="w-full h-full object-cover object-top select-none"
          loading="eager"
          decoding="async"
          onError={handleImgError}
        />
      ) : (
        /* Celestial Dignitary Portrait Fallback */
        <div className="flex flex-col items-center justify-center p-3 text-center w-full h-full bg-gradient-to-b from-[#0C1333] to-[#070B1E]">
          <div className={`${isLarge ? 'w-14 h-14' : 'w-10 h-10'} rounded-full bg-[#121B40] border border-[#D4AF37]/40 flex items-center justify-center mb-2 text-[#E6C57D] shadow-inner`}>
            <User className={`${isLarge ? 'w-7 h-7' : 'w-5 h-5'} text-[#D4AF37]`} />
          </div>
          <span className="text-xs font-bold text-[#F5E7C4] tracking-wide">
            {guestName}
          </span>
          <span className="text-[10px] uppercase font-mono tracking-wider text-[#D4AF37]/80 mt-0.5">
            {role || 'Honoured Guest'}
          </span>
        </div>
      )}

      {/* Role Badge */}
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
