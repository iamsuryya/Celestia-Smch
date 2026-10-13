export const EVENT_IMAGES: Record<string, string> = {
  seraphia: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=600&q=80', // Singer with mic on stage
  symphora: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80', // Acoustic guitar under stage lights
  nrityara: 'https://images.unsplash.com/photo-1547153760-18fc86324498?auto=format&fit=crop&w=600&q=80', // Classical Indian dance silhouette / stage
  reflexia: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=600&q=80', // Drama / theatrical masks
  eclipse: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=600&q=80', // Western solo dance silhouette against lights
  'stellar-bid': 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=600&q=80', // Cricket stadium / auction lights
  'cosmic-switch': 'https://images.unsplash.com/photo-1535525153412-5a42439a210d?auto=format&fit=crop&w=600&q=80', // Street dance
  'twin-flare': 'https://images.unsplash.com/photo-1504609773096-104ff2c73ba4?auto=format&fit=crop&w=600&q=80', // Duo dancers
  starfusion: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80', // Group dance stage
  elaris: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=600&q=80', // Fashion model runway
  silhouette: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80', // Thematic fashion parade
  adblitz: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=600&q=80', // Ad & marketing creation
  mememania: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80', // Digital creative meme art
  cineverse: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=600&q=80', // Cinema video camera
};

export function getEventImage(eventId: string): string {
  return EVENT_IMAGES[eventId] || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80';
}
