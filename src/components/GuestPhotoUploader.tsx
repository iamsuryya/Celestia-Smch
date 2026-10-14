import React, { useRef } from 'react';
import { User, Camera, Upload, Trash2 } from 'lucide-react';
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

  const currentPhoto = getGuestPhoto(guestId, defaultPhoto);
  const isLarge = variant === 'large';

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
        setGuestPhoto(guestId, dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden rounded-lg bg-[#070B1E] group">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Guest Photo Display */}
      {currentPhoto ? (
        <img
          src={currentPhoto}
          alt={guestName}
          className="w-full h-full object-cover object-top select-none"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
      ) : (
        /* Celestial Dignitary Silhouette fallback */
        <div className="flex flex-col items-center justify-center p-3 text-center w-full h-full bg-gradient-to-b from-[#0C1333] to-[#070B1E]">
          <div className={`${isLarge ? 'w-14 h-14' : 'w-10 h-10'} rounded-full bg-[#121B40] border border-[#D4AF37]/35 flex items-center justify-center mb-2 text-[#E6C57D] shadow-inner`}>
            <User className={`${isLarge ? 'w-7 h-7' : 'w-5 h-5'} text-[#D4AF37]/80`} />
          </div>
          <span className="text-[10px] uppercase font-mono tracking-wider text-[#D4AF37]/80">
            Dignitary of Honour
          </span>
        </div>
      )}

      {/* Interactive Photo Upload / Change Overlay */}
      <div className="absolute inset-0 bg-[#070B1E]/75 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2 z-20">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#F5E7C4] to-[#D4AF37] text-[#070B1B] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 hover:brightness-110 shadow-lg cursor-pointer transition-transform active:scale-95"
        >
          <Camera className="w-3.5 h-3.5" />
          <span>Upload Photo</span>
        </button>

        {currentPhoto && currentPhoto !== defaultPhoto && (
          <button
            type="button"
            onClick={() => removeGuestPhoto(guestId)}
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
