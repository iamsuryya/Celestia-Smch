import { EventItem } from '../data/festivalData';

import imgSeraphia from '../assets/images/regenerated_image_1792232104341.jpg';
import imgSymphora from '../assets/images/regenerated_image_1792232117700.jpg';
import imgNrityara from '../assets/images/regenerated_image_1792232129829.jpg';
import imgReflexia from '../assets/images/regenerated_image_1792232140692.jpg';
import imgStellarBid from '../assets/images/regenerated_image_1792232160031.jpg';
import imgEclipse from '../assets/images/regenerated_image_1792232170862.jpg';
import imgCosmicSwitch from '../assets/images/regenerated_image_1792232181442.jpg';
import imgTwinFlare from '../assets/images/regenerated_image_1792232191228.jpg';
import imgStarfusion from '../assets/images/regenerated_image_1792232202262.jpg';
import imgElaris from '../assets/images/regenerated_image_1792232212539.jpg';
import imgSilhouette from '../assets/images/regenerated_image_1792232222364.jpg';
import imgAdblitz from '../assets/images/regenerated_image_1792232231748.jpg';
import imgMememania from '../assets/images/regenerated_image_1792232242415.jpg';
import imgCineverse from '../assets/images/regenerated_image_1792232251549.jpg';

const REGENERATED_EVENT_IMAGES: Record<string, string> = {
  seraphia: imgSeraphia,
  m01: imgSeraphia,
  symphora: imgSymphora,
  m02: imgSymphora,
  nrityara: imgNrityara,
  d01: imgNrityara,
  reflexia: imgReflexia,
  e01: imgReflexia,
  'stellar-bid': imgStellarBid,
  stellar_bid: imgStellarBid,
  s01: imgStellarBid,
  eclipse: imgEclipse,
  d02: imgEclipse,
  'cosmic-switch': imgCosmicSwitch,
  cosmic_switch: imgCosmicSwitch,
  e02: imgCosmicSwitch,
  'twin-flare': imgTwinFlare,
  twin_flare: imgTwinFlare,
  d03: imgTwinFlare,
  starfusion: imgStarfusion,
  d04: imgStarfusion,
  elaris: imgElaris,
  f01: imgElaris,
  silhouette: imgSilhouette,
  f02: imgSilhouette,
  adblitz: imgAdblitz,
  e03: imgAdblitz,
  mememania: imgMememania,
  md01: imgMememania,
  cineverse: imgCineverse,
  md02: imgCineverse,
};

/**
 * Default fallback celestial event cover image
 */
const DEFAULT_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80';

/**
 * Category-specific high-resolution fallback image mappings
 */
const CATEGORY_IMAGES: Record<string, string> = {
  music: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80',
  dance: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=1200&q=80',
  fashion: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1200&q=80',
  entertainment: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80',
  special: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80',
  media: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80',
};

/**
 * Returns the primary local cover image path or custom override for an event.
 */
export function getEventImage(
  eventOrKey?: EventItem | string | null,
  fallbackCategory?: string
): string {
  if (!eventOrKey) {
    if (fallbackCategory && CATEGORY_IMAGES[fallbackCategory.toLowerCase()]) {
      return CATEGORY_IMAGES[fallbackCategory.toLowerCase()];
    }
    return DEFAULT_FALLBACK_IMAGE;
  }

  let cleanId = '';
  let cleanCode = '';
  let catKey = '';

  if (typeof eventOrKey === 'object') {
    cleanId = (eventOrKey.id || '').toLowerCase().trim();
    cleanCode = (eventOrKey.code || '').toLowerCase().trim();
    catKey = (eventOrKey.category || '').toLowerCase().trim();
  } else {
    cleanId = String(eventOrKey).toLowerCase().trim();
  }

  // Check localStorage custom override first if set
  if (typeof window !== 'undefined' && cleanId) {
    const customSaved = localStorage.getItem(`celestia_event_image_${cleanId}`);
    if (customSaved && customSaved.trim()) return customSaved.trim();
  }

  if (cleanId && REGENERATED_EVENT_IMAGES[cleanId]) {
    return REGENERATED_EVENT_IMAGES[cleanId];
  }

  if (cleanCode && REGENERATED_EVENT_IMAGES[cleanCode]) {
    return REGENERATED_EVENT_IMAGES[cleanCode];
  }

  if (cleanId) {
    return `/images/events/${cleanId}.jpg`;
  }

  if (cleanCode) {
    return `/images/events/${cleanCode}.jpg`;
  }

  if (catKey && CATEGORY_IMAGES[catKey]) {
    return CATEGORY_IMAGES[catKey];
  }

  return DEFAULT_FALLBACK_IMAGE;
}

/**
 * Handles image load errors gracefully by trying alternative local extensions (.png, .webp, .jpeg, underscore variant)
 * before finally falling back to the curated Unsplash stock cover artwork.
 */
export function handleEventImageError(
  e: React.SyntheticEvent<HTMLImageElement, Event>,
  eventOrKey?: EventItem | string | null,
  fallbackCategory?: string
): void {
  const img = e.currentTarget;
  if (!img) return;

  let cleanId = '';
  let catKey = '';

  if (typeof eventOrKey === 'object' && eventOrKey) {
    cleanId = (eventOrKey.id || '').toLowerCase().trim();
    catKey = (eventOrKey.category || '').toLowerCase().trim();
  } else if (eventOrKey) {
    cleanId = String(eventOrKey).toLowerCase().trim();
  }

  const currentIndex = parseInt(img.dataset.tryIndex || '0', 10);
  const nextIndex = currentIndex + 1;
  img.dataset.tryIndex = String(nextIndex);

  const underscoreId = cleanId.replace(/-/g, '_');

  const candidateUrls: string[] = [
    `/images/events/${cleanId}.jpg`,
    `/images/events/${cleanId}.png`,
    `/images/events/${cleanId}.webp`,
    `/images/events/${cleanId}.jpeg`,
    `/images/events/${underscoreId}.jpg`,
    `/images/events/${underscoreId}.png`,
    `/images/events/${underscoreId}.webp`,
    REGENERATED_EVENT_IMAGES[cleanId] || (catKey ? CATEGORY_IMAGES[catKey] : null) || DEFAULT_FALLBACK_IMAGE,
  ];

  if (nextIndex < candidateUrls.length && candidateUrls[nextIndex]) {
    img.src = candidateUrls[nextIndex];
  } else {
    // Final fallback if all candidates fail
    img.src = REGENERATED_EVENT_IMAGES[cleanId] || (catKey ? CATEGORY_IMAGES[catKey] : null) || DEFAULT_FALLBACK_IMAGE;
  }
}

export default getEventImage;
