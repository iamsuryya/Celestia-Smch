import React, { useRef, useState, useEffect } from 'react';
import { User, Camera, Trash2 } from 'lucide-react';
import { useInlineEditor } from '../context/EditorContext';

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
  const { getGuestPhoto, setGuestPhoto, removeGuestPhoto } = useInlineEditor();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Candidate image paths to check in public/images/guests/
  const candidateUrls: string[] = React.useMemo(() => {
    if (guestId === 'main-guest-1') {
      return [
        '/images/guests/rio-raj.jpg',
        '/images/guests/rio-raj.jpeg',
        '/images/guests/rio-raj.png',
        '/images/guests/main-guest-1.jpg',
        '/images/guests/main-guest-1.jpeg',
        '/images/guests/main-guest-1.png',
        defaultPhoto,
      ].filter(Boolean);
    }
    if (guestId === 'main-guest-2') {
      return [
        '/images/guests/aparna-das.jpg',
        '/images/guests/aparna-das.jpeg',
        '/images/guests/aparna-das.png',
        '/images/guests/main-guest-2.jpg',
        '/images/guests/main-guest-2.jpeg',
        '/images/guests/main-guest-2.png',
        defaultPhoto,
      ].filter(Boolean);
    }
    return [defaultPhoto].filter(Boolean);
  }, [guestId, defaultPhoto]);

  const [candidateIndex, setCandidateIndex] = useState(0);
  const [allFailed, setAllFailed] = useState(false);

  // Custom photo from inline editor or storage has priority
  const storedPhoto = getGuestPhoto(guestId, '');

  useEffect(() => {
    setCandidateIndex(0);
    setAllFailed(false);
  }, [guestId, defaultPhoto, storedPhoto]);

  const currentPhoto = storedPhoto || candidateUrls[candidateIndex] || '';
  const isLarge = variant === 'large';

  const handleImgError = () => {
    if (storedPhoto) {
      // Stored photo failed, fallback to candidate list
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setAllFailed(false);
        setGuestPhoto(guestId, dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden rounded-lg bg-[#070B1E] group">
      {/* Hidden File Input for mobile and desktop photo selection */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Guest Photo Display */}
      {currentPhoto && !allFailed ? (
        <img
          src={currentPhoto}
          alt={guestName}
          className="w-full h-full object-cover object-top select-none"
          loading="lazy"
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

      {/* Mobile-Friendly Quick Photo Upload Button (Top Corner) */}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        title="Upload or Change Photo"
        aria-label="Upload photo"
        className="absolute top-2 right-2 p-1.5 rounded-full bg-[#080D24]/85 hover:bg-[#121B42] text-[#E6C57D] border border-[#D4AF37]/40 shadow-lg cursor-pointer transition-all active:scale-95 z-20"
      >
        <Camera className="w-3.5 h-3.5" />
      </button>

      {/* Hover / Active Full Overlay */}
      <div className="absolute inset-0 bg-[#070B1E]/80 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2 z-20 pointer-events-none group-hover:pointer-events-auto">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#F5E7C4] to-[#D4AF37] text-[#070B1B] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 hover:brightness-110 shadow-lg cursor-pointer transition-transform active:scale-95"
        >
          <Camera className="w-3.5 h-3.5" />
          <span>Upload Photo</span>
        </button>

        {storedPhoto && (
          <button
            type="button"
            onClick={() => {
              removeGuestPhoto(guestId);
              setCandidateIndex(0);
              setAllFailed(false);
            }}
            className="px-2.5 py-1 rounded-md bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40 text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            <span>Reset</span>
          </button>
        )}
      </div>

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
