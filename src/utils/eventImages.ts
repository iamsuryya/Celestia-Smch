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
 * Specific Event Code / ID image mappings
 */
const EVENT_IMAGES: Record<string, string> = {
  // Music
  M01: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=80',
  M02: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80',
  // Dance
  D01: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=1200&q=80',
  D02: 'https://images.unsplash.com/photo-1535525153412-5a42439e210d?auto=format&fit=crop&w=1200&q=80',
  D03: 'https://images.unsplash.com/photo-1547153760-18fc86324498?auto=format&fit=crop&w=1200&q=80',
  D04: 'https://images.unsplash.com/photo-1504609773096-104ff2c73ba4?auto=format&fit=crop&w=1200&q=80',
  // Fashion
  F01: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80',
  F02: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1200&q=80',
  // Entertainment & Drama
  E01: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80',
  E02: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=1200&q=80',
  // Media & Special
  MD01: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80',
  MD02: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=1200&q=80',
  S01: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80',
  S02: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
};

/**
 * Returns a suitable image URL for a given event, event ID, event code, or category.
 * Guaranteed to return a valid non-empty string fallback URL.
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
    const codeKey = eventOrKey.code?.toUpperCase();
    const idKey = eventOrKey.id;
    const catKey = eventOrKey.category?.toLowerCase();

    if (codeKey && EVENT_IMAGES[codeKey]) {
      return EVENT_IMAGES[codeKey];
    }
    if (idKey && EVENT_IMAGES[idKey]) {
      return EVENT_IMAGES[idKey];
    }
    if (catKey && CATEGORY_IMAGES[catKey]) {
      return CATEGORY_IMAGES[catKey];
    }
    return DEFAULT_FALLBACK_IMAGE;
  }

  // Handle string key input (code or id)
  const key = String(eventOrKey).trim();
  const upperKey = key.toUpperCase();

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
