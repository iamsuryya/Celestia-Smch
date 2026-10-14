import { EventItem } from '../data/festivalData';

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
 * Specific Event Code / ID curated cover images for all 14 official Celestia'26 events
 */
const EVENT_IMAGES: Record<string, string> = {
  // 1. Seraphia (Solo Singing)
  SERAPHIA: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=80',
  seraphia: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=80',
  M01: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=80',

  // 2. Symphora (Instrumental Music)
  SYMPHORA: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80',
  symphora: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80',
  M02: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80',

  // 3. Nrityara (Classical Solo Dance)
  NRITYARA: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=1200&q=80',
  nrityara: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=1200&q=80',
  D01: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=1200&q=80',

  // 4. Reflexia (Replica Dance / Entertainment)
  REFLEXIA: 'https://images.unsplash.com/photo-1518834107812-67b0b7c58434?auto=format&fit=crop&w=1200&q=80',
  reflexia: 'https://images.unsplash.com/photo-1518834107812-67b0b7c58434?auto=format&fit=crop&w=1200&q=80',
  E01: 'https://images.unsplash.com/photo-1518834107812-67b0b7c58434?auto=format&fit=crop&w=1200&q=80',

  // 5. Stellar Bid (Mock IPL Auction)
  'STELLAR-BID': 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1200&q=80',
  'stellar-bid': 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1200&q=80',
  stellar_bid: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1200&q=80',
  S01: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1200&q=80',

  // 6. Eclipse (Solo Western Dance)
  ECLIPSE: 'https://images.unsplash.com/photo-1535525153412-5a42439e210d?auto=format&fit=crop&w=1200&q=80',
  eclipse: 'https://images.unsplash.com/photo-1535525153412-5a42439e210d?auto=format&fit=crop&w=1200&q=80',
  D02: 'https://images.unsplash.com/photo-1535525153412-5a42439e210d?auto=format&fit=crop&w=1200&q=80',

  // 7. Cosmic Switch (Adaptunes)
  'COSMIC-SWITCH': 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80',
  'cosmic-switch': 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80',
  cosmic_switch: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80',
  E02: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80',

  // 8. Twin Flare (Duo Dance)
  'TWIN-FLARE': 'https://images.unsplash.com/photo-1547153760-18fc86324498?auto=format&fit=crop&w=1200&q=80',
  'twin-flare': 'https://images.unsplash.com/photo-1547153760-18fc86324498?auto=format&fit=crop&w=1200&q=80',
  twin_flare: 'https://images.unsplash.com/photo-1547153760-18fc86324498?auto=format&fit=crop&w=1200&q=80',
  D03: 'https://images.unsplash.com/photo-1547153760-18fc86324498?auto=format&fit=crop&w=1200&q=80',

  // 9. Starfusion (Group Dance)
  STARFUSION: 'https://images.unsplash.com/photo-1504609773096-104ff2c73ba4?auto=format&fit=crop&w=1200&q=80',
  starfusion: 'https://images.unsplash.com/photo-1504609773096-104ff2c73ba4?auto=format&fit=crop&w=1200&q=80',
  D04: 'https://images.unsplash.com/photo-1504609773096-104ff2c73ba4?auto=format&fit=crop&w=1200&q=80',

  // 10. Elaris (Cosplay / Solo Fashion Walk)
  ELARIS: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80',
  elaris: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80',
  F01: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80',

  // 11. Silhouette (Arabian Nights Theme Fashion Parade)
  SILHOUETTE: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1200&q=80',
  silhouette: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1200&q=80',
  F02: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1200&q=80',

  // 12. AdBlitz (Adzap)
  ADBLITZ: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80',
  adblitz: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80',
  E03: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80',

  // 13. Mememania (Online Meme Competition)
  MEMEMANIA: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80',
  mememania: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80',
  MD01: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80',

  // 14. Cineverse (Movie Recreation Reel)
  CINEVERSE: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=1200&q=80',
  cineverse: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=1200&q=80',
  MD02: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=1200&q=80',
};

/**
 * Returns a suitable image URL for a given event, event ID, event code, or category.
 * Also checks localStorage overrides and maps clean fallbacks.
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

  // Handle EventItem object input
  if (typeof eventOrKey === 'object') {
    const idKey = eventOrKey.id?.toLowerCase();
    const codeKey = eventOrKey.code?.toUpperCase();
    const catKey = eventOrKey.category?.toLowerCase();

    // Check localStorage custom override first if set
    if (typeof window !== 'undefined' && idKey) {
      const customSaved = localStorage.getItem(`celestia_event_image_${idKey}`);
      if (customSaved && customSaved.trim()) return customSaved.trim();
    }

    if (idKey && EVENT_IMAGES[idKey]) {
      return EVENT_IMAGES[idKey];
    }
    if (codeKey && EVENT_IMAGES[codeKey]) {
      return EVENT_IMAGES[codeKey];
    }
    if (catKey && CATEGORY_IMAGES[catKey]) {
      return CATEGORY_IMAGES[catKey];
    }
    return DEFAULT_FALLBACK_IMAGE;
  }

  // Handle string key input (code or id)
  const key = String(eventOrKey).trim();
  const lowerKey = key.toLowerCase();
  const upperKey = key.toUpperCase();

  if (typeof window !== 'undefined') {
    const customSaved = localStorage.getItem(`celestia_event_image_${lowerKey}`);
    if (customSaved && customSaved.trim()) return customSaved.trim();
  }

  if (EVENT_IMAGES[lowerKey]) {
    return EVENT_IMAGES[lowerKey];
  }
  if (EVENT_IMAGES[upperKey]) {
    return EVENT_IMAGES[upperKey];
  }
  if (EVENT_IMAGES[key]) {
    return EVENT_IMAGES[key];
  }

  const lowerCat = (fallbackCategory || key).toLowerCase();
  if (CATEGORY_IMAGES[lowerCat]) {
    return CATEGORY_IMAGES[lowerCat];
  }

  return DEFAULT_FALLBACK_IMAGE;
}

export default getEventImage;
