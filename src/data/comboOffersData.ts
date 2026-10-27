import { EventItem, EVENTS_DATA } from './festivalData';

export type ComboCategory = 'solo' | 'digital' | 'minor' | 'major' | 'package';

export interface ComboOffer {
  id: string;
  name: string;
  category: ComboCategory;
  categoryTitle: string;
  shortDescription: string;
  fullDescription: string;
  comboPrice: number; // In INR or fixed total/discount calculation type
  originalEstimatedValue?: number;
  savingsAmount?: number;
  savingsPercent?: number;
  priceType: 'fixed_price' | 'discount_percentage';
  discountPercentage?: number; // E.g. 25 or 33 for percentage-based offers
  buttonText: string;
  eligibleEventIds?: string[]; // Allowed event IDs if restricted
  eligibleCategoryType?: 'solo' | 'minor' | 'major' | 'digital' | 'mixed';
  minEventsToSelect?: number;
  maxEventsToSelect?: number;
  
  // Specific constraints for packages
  packageStructure?: {
    majorCount?: number;
    minorCount?: number;
    soloCount?: number;
    requiresSpecificEvent?: string; // e.g., 'silhouette' for Fashion Royale
    bonusFreeEvents?: {
      eventId: string;
      count: number;
    };
  };
  
  // Rules and eligibility conditions text
  eligibilityConditions: string[];
}

export const COMBO_OFFERS: ComboOffer[] = [
  // -------------------------------------------------------------
  // A. SOLO EVENT COMBOS
  // Eligible: Seraphia (Singing), Symphora (Instrumental), Nrityara (Classical), Cosmic Switch (Adaptunes), Eclipse (Western), Elaris (Fashion)
  // -------------------------------------------------------------
  {
    id: 'solo-duo',
    name: 'Solo Duo',
    category: 'solo',
    categoryTitle: 'Solo Event Combos',
    shortDescription: 'Choose any 2 eligible solo events.',
    fullDescription: 'Participate in any 2 solo competitions of your choice (including Seraphia, Symphora, Nrityara, Cosmic Switch, Eclipse, or Elaris) and save ₹75 instantly.',
    comboPrice: 425,
    originalEstimatedValue: 500,
    savingsAmount: 75,
    priceType: 'fixed_price',
    buttonText: 'Choose 2 Solo Events',
    eligibleCategoryType: 'solo',
    eligibleEventIds: ['seraphia', 'symphora', 'nrityara', 'cosmic-switch', 'eclipse', 'elaris', 'stellar-bid'],
    minEventsToSelect: 2,
    maxEventsToSelect: 2,
    eligibilityConditions: [
      'Applies to any 2 distinct eligible solo events.',
      'Individual/duo registration per participant.',
      'Fixed combo fee: ₹425.'
    ]
  },
  {
    id: 'triple-threat-solo',
    name: 'Triple Threat (Solo)',
    category: 'solo',
    categoryTitle: 'Solo Event Combos',
    shortDescription: 'Choose any 3 eligible solo events.',
    fullDescription: 'Showcase your versatility across 3 solo stages and unlock massive ₹250 savings.',
    comboPrice: 500,
    originalEstimatedValue: 750,
    savingsAmount: 250,
    priceType: 'fixed_price',
    buttonText: 'Choose 3 Solo Events',
    eligibleCategoryType: 'solo',
    eligibleEventIds: ['seraphia', 'symphora', 'nrityara', 'cosmic-switch', 'eclipse', 'elaris', 'stellar-bid'],
    minEventsToSelect: 3,
    maxEventsToSelect: 3,
    eligibilityConditions: [
      'Applies to any 3 distinct solo events.',
      'Individual/duo registration per participant.',
      'Fixed combo fee: ₹500.'
    ]
  },

  // -------------------------------------------------------------
  // B. DIGITAL EVENT COMBO
  // Eligible: Mememania & Cineverse
  // -------------------------------------------------------------
  {
    id: 'viral-takeover',
    name: 'Viral Takeover',
    category: 'digital',
    categoryTitle: 'Digital Event Combos',
    shortDescription: 'Both Mememania (Meme) & Cineverse (Reels).',
    fullDescription: 'Dominate the online space by entering both Meme & Movie Recreation Reel competitions.',
    comboPrice: 250,
    originalEstimatedValue: 350,
    savingsAmount: 100,
    priceType: 'fixed_price',
    buttonText: 'Choose Both Digital Events',
    eligibleCategoryType: 'digital',
    eligibleEventIds: ['mememania', 'cineverse'],
    minEventsToSelect: 2,
    maxEventsToSelect: 2,
    eligibilityConditions: [
      'Includes both Mememania and Cineverse entries.',
      'Online submission before Nov 1, 2026.',
      'Combined combo price: ₹250.'
    ]
  },

  // -------------------------------------------------------------
  // C. MINOR EVENT COMBOS
  // Eligible: AdBlitz (AdZap), Stellar Bid (IPL Auction), Twin Flare (Duo Dance)
  // -------------------------------------------------------------
  {
    id: 'double-impact-minor',
    name: 'Double Impact',
    category: 'minor',
    categoryTitle: 'Minor Event Combos',
    shortDescription: '2 Teams from the same college in a Minor Event.',
    fullDescription: 'Register 2 teams from your college for a minor event and get 25% OFF total registration fees.',
    comboPrice: 0, // dynamic 25% discount
    discountPercentage: 25,
    priceType: 'discount_percentage',
    buttonText: 'Register 2 College Teams (25% OFF)',
    eligibleCategoryType: 'minor',
    eligibleEventIds: ['adblitz', 'stellar-bid', 'twin-flare'],
    minEventsToSelect: 1, // 1 event, but 2 separate teams
    maxEventsToSelect: 1,
    eligibilityConditions: [
      'Requires 2 separate teams from the SAME college for 1 minor event.',
      '25% discount applied automatically on total qualifying fee.'
    ]
  },
  {
    id: 'triple-takeover-minor',
    name: 'Triple Takeover',
    category: 'minor',
    categoryTitle: 'Minor Event Combos',
    shortDescription: '3 Teams from the same college in a Minor Event.',
    fullDescription: 'Bring 3 teams from your college for a minor event and claim 33% OFF overall fees.',
    comboPrice: 0,
    discountPercentage: 33,
    priceType: 'discount_percentage',
    buttonText: 'Register 3 College Teams (33% OFF)',
    eligibleCategoryType: 'minor',
    eligibleEventIds: ['adblitz', 'stellar-bid', 'twin-flare'],
    minEventsToSelect: 1,
    maxEventsToSelect: 1,
    eligibilityConditions: [
      'Requires 3 separate teams from the SAME college for 1 minor event.',
      '33% discount applied on total qualifying fee.'
    ]
  },
  {
    id: 'double-trouble-minor',
    name: 'Double Trouble',
    category: 'minor',
    categoryTitle: 'Minor Event Combos',
    shortDescription: 'Same team registers for 2 Minor Events.',
    fullDescription: 'One team competes in 2 distinct minor events and earns 25% OFF overall total fees.',
    comboPrice: 0,
    discountPercentage: 25,
    priceType: 'discount_percentage',
    buttonText: 'Choose 2 Minor Events (25% OFF)',
    eligibleCategoryType: 'minor',
    eligibleEventIds: ['adblitz', 'stellar-bid', 'twin-flare'],
    minEventsToSelect: 2,
    maxEventsToSelect: 2,
    eligibilityConditions: [
      'The SAME team registers for 2 different minor events.',
      '25% discount calculated on combined team fees.'
    ]
  },
  {
    id: 'triple-threat-team-minor',
    name: 'Triple Threat — Team Edition',
    category: 'minor',
    categoryTitle: 'Minor Event Combos',
    shortDescription: 'Same team registers for 3 Minor Events.',
    fullDescription: 'The ultimate minor squad sweep! One team competes in all 3 minor events with 33% OFF total fees.',
    comboPrice: 0,
    discountPercentage: 33,
    priceType: 'discount_percentage',
    buttonText: 'Choose 3 Minor Events (33% OFF)',
    eligibleCategoryType: 'minor',
    eligibleEventIds: ['adblitz', 'stellar-bid', 'twin-flare'],
    minEventsToSelect: 3,
    maxEventsToSelect: 3,
    eligibilityConditions: [
      'The SAME team enters all 3 minor events (AdZap, IPL Auction, Duo Dance).',
      '33% discount applied on combined total fees.'
    ]
  },

  // -------------------------------------------------------------
  // D. MAJOR EVENT COMBOS
  // Eligible: Reflexia (Replica), Starfusion (Group Dance), Silhouette (Fashion Parade)
  // -------------------------------------------------------------
  {
    id: 'campus-clash-major',
    name: 'Campus Clash',
    category: 'major',
    categoryTitle: 'Major Event Combos',
    shortDescription: '2 Teams from the same college in a Major Event.',
    fullDescription: 'Bring 2 heavy-hitter teams from your college for a major flagship event with 25% OFF total fees.',
    comboPrice: 0,
    discountPercentage: 25,
    priceType: 'discount_percentage',
    buttonText: 'Register 2 College Teams (25% OFF)',
    eligibleCategoryType: 'major',
    eligibleEventIds: ['reflexia', 'starfusion', 'silhouette'],
    minEventsToSelect: 1,
    maxEventsToSelect: 1,
    eligibilityConditions: [
      '2 separate teams from the SAME college for 1 major event.',
      '25% discount applied automatically on qualifying total.'
    ]
  },
  {
    id: 'campus-domination-major',
    name: 'Campus Domination',
    category: 'major',
    categoryTitle: 'Major Event Combos',
    shortDescription: '3 Teams from the same college in a Major Event.',
    fullDescription: 'Dominate the main stage! 3 teams from your college in a major event get 33% OFF overall fees.',
    comboPrice: 0,
    discountPercentage: 33,
    priceType: 'discount_percentage',
    buttonText: 'Register 3 College Teams (33% OFF)',
    eligibleCategoryType: 'major',
    eligibleEventIds: ['reflexia', 'starfusion', 'silhouette'],
    minEventsToSelect: 1,
    maxEventsToSelect: 1,
    eligibilityConditions: [
      '3 separate teams from the SAME college for 1 major event.',
      '33% discount applied on total fees.'
    ]
  },
  {
    id: 'double-feature-major',
    name: 'Double Feature',
    category: 'major',
    categoryTitle: 'Major Event Combos',
    shortDescription: 'Same team registers for 2 Major Events.',
    fullDescription: 'One power squad enters 2 flagship major events with 25% OFF combined total fees.',
    comboPrice: 0,
    discountPercentage: 25,
    priceType: 'discount_percentage',
    buttonText: 'Choose 2 Major Events (25% OFF)',
    eligibleCategoryType: 'major',
    eligibleEventIds: ['reflexia', 'starfusion', 'silhouette'],
    minEventsToSelect: 2,
    maxEventsToSelect: 2,
    eligibilityConditions: [
      'The SAME team registers for 2 distinct major events.',
      '25% discount calculated on total team fees.'
    ]
  },
  {
    id: 'triple-crown-major',
    name: 'Triple Crown',
    category: 'major',
    categoryTitle: 'Major Event Combos',
    shortDescription: 'Same college registers for all 3 major events.',
    fullDescription: 'Claim the ultimate festival crown! Same college enters Replica, Group Dance & Fashion Parade for 33% OFF.',
    comboPrice: 0,
    discountPercentage: 33,
    priceType: 'discount_percentage',
    buttonText: 'Choose 3 Major Events (33% OFF)',
    eligibleCategoryType: 'major',
    eligibleEventIds: ['reflexia', 'starfusion', 'silhouette'],
    minEventsToSelect: 3,
    maxEventsToSelect: 3,
    eligibilityConditions: [
      'Same college registers for all 3 major events.',
      '33% discount applied on total combined fees.'
    ]
  },

  // -------------------------------------------------------------
  // E. COMBINED EVENT PACKAGES
  // -------------------------------------------------------------
  {
    id: 'fashion-royale',
    name: 'Fashion Royale',
    category: 'package',
    categoryTitle: 'Combined Packages',
    shortDescription: 'Register for Fashion Parade Get 3 Fashion Solo Entries completely Free!',
    fullDescription: 'Register for Silhouette Fashion Parade and automatically receive 3 FREE entries for Elaris Fashion Walk.',
    comboPrice: 3000, // Standard team fee for Silhouette
    originalEstimatedValue: 3750,
    savingsAmount: 750,
    priceType: 'fixed_price',
    buttonText: 'Unlock Fashion Royale Package',
    packageStructure: {
      requiresSpecificEvent: 'silhouette',
      bonusFreeEvents: {
        eventId: 'elaris',
        count: 3
      }
    },
    eligibilityConditions: [
      'Requires registration for Silhouette Fashion Parade.',
      'Includes 3 FREE Elaris Solo Fashion entries (₹750 value free).',
      'Package total fee: ₹3,000.'
    ]
  },
  {
    id: 'spotlight-squad-package',
    name: 'Spotlight Squad',
    category: 'package',
    categoryTitle: 'Combined Packages',
    shortDescription: '1 Major + 2 Solo Events.',
    fullDescription: 'Combine main stage team glory with individual star performances.',
    comboPrice: 2400,
    originalEstimatedValue: 3000,
    savingsAmount: 600,
    priceType: 'fixed_price',
    buttonText: 'Choose Spotlight Squad (₹2,400)',
    eligibleCategoryType: 'mixed',
    packageStructure: {
      majorCount: 1,
      minorCount: 0,
      soloCount: 2
    },
    eligibilityConditions: [
      'Requires exactly 1 Major event + 2 Solo events.',
      'Fixed team package price: ₹2,400.',
      'Save ₹600 on combined entries.'
    ]
  },
  {
    id: 'power-trio-package',
    name: 'Power Trio',
    category: 'package',
    categoryTitle: 'Combined Packages',
    shortDescription: '1 Major + 2 Minor Events.',
    fullDescription: 'Target the high-stakes stage events with 1 Major and 2 Minor competitions.',
    comboPrice: 2400,
    originalEstimatedValue: 3300,
    savingsAmount: 900,
    priceType: 'fixed_price',
    buttonText: 'Choose Power Trio (₹2,400)',
    eligibleCategoryType: 'mixed',
    packageStructure: {
      majorCount: 1,
      minorCount: 2,
      soloCount: 0
    },
    eligibilityConditions: [
      'Requires exactly 1 Major event + 2 Minor events.',
      'Fixed team package price: ₹2,400.',
      'Savings up to ₹900.'
    ]
  },
  {
    id: 'celestia-all-access',
    name: 'Celestia All-Access',
    category: 'package',
    categoryTitle: 'Combined Packages',
    shortDescription: '1 Major + 2 Minor + 2 Solo Events.',
    fullDescription: 'The ultimate all-inclusive festival package for complete campus participation.',
    comboPrice: 3000,
    originalEstimatedValue: 4200,
    savingsAmount: 1200,
    priceType: 'fixed_price',
    buttonText: 'Choose All-Access Package (₹3,000)',
    eligibleCategoryType: 'mixed',
    packageStructure: {
      majorCount: 1,
      minorCount: 2,
      soloCount: 2
    },
    eligibilityConditions: [
      'Requires exactly 1 Major event + 2 Minor events + 2 Solo events.',
      'All-inclusive team package price: ₹3,000.',
      'Massive savings up to ₹1,200.'
    ]
  }
];

/**
 * Helper to retrieve event detail object by ID
 */
export function getEventById(id: string): EventItem | undefined {
  return EVENTS_DATA.find(e => e.id.toLowerCase() === id.toLowerCase() || e.code.toLowerCase() === id.toLowerCase());
}

/**
 * Helper to classify event into combo category types
 */
export function getEventComboType(event: EventItem): 'solo' | 'minor' | 'major' | 'digital' {
  if (event.id === 'mememania' || event.id === 'cineverse' || event.category === 'media') {
    return 'digital';
  }
  if (event.id === 'reflexia' || event.id === 'starfusion' || event.id === 'silhouette') {
    return 'major';
  }
  if (event.id === 'adblitz' || event.id === 'stellar-bid' || event.id === 'twin-flare') {
    return 'minor';
  }
  return 'solo';
}
