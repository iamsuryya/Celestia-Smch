export interface EventPrizes {
  winner: string | null;
  runnerUp: string | null;
  totalFormatted?: string;
}

export interface EventIncharge {
  name: string;
  phone: string;
  role?: string;
}

export interface EventItem {
  id: string;
  code: string;
  title: string;
  category: 'music' | 'dance' | 'fashion' | 'entertainment' | 'special' | 'media';
  categoryDisplay: string;
  type: 'Solo' | 'Duo' | 'Team';
  gender: string;
  participants: string | null; // Display string, e.g. "1", "Exactly 2", "5–15", or null for "No specific limit"
  
  // Numerical rules for automatic form validation
  minParticipants: number;
  maxParticipants: number | null; // null represents "No specific limit"
  feeAmount: number;
  feeType: 'per_head' | 'per_team';
  allowsOnSpotRegistration: boolean;
  maxEntriesPerCollege: number | null; // null represents no specific limit
  maxTotalCapacity: number | null; // null represents no specific limit

  registrationFee: string;
  duration: string;
  venue: string;
  theme?: string | null;
  prizes: EventPrizes | null;
  rules: string[];
  judgingCriteria: string[] | null; // null if "None specified"
  featured: boolean;
  incharges?: EventIncharge[];
}

export interface CategoryInfo {
  id: 'music' | 'dance' | 'fashion' | 'entertainment' | 'special' | 'media';
  title: string;
  subtitle: string;
  description: string;
  iconName: string;
  accentColor: string;
}

export const FESTIVAL_METADATA = {
  edition: "Celestia'26",
  romanNumeral: "MMXXVI",
  theme: "BEYOND THE STARS",
  tagline: "An Intercollegiate Cultural Symphony",
  collegeName: "Srinivasan Medical College and Hospital",
  location: "Trichy, Tamil Nadu",
  datesFormatted: "November 3 | 4 | 5, 2026",
  datesShort: "Nov 3 - 5, 2026",
  targetDateISO: "2026-11-03T09:00:00",
  
  // Configurable registration deadline setting (informational notice, registrations remain open until admin stops)
  registrationDeadlineFormatted: "October 28, 2026 (Nov 1 for Cineverse & Mememania)",
  registrationDeadlineISO: "2026-10-28T23:59:59",
  standardDeadlineFormatted: "October 28, 2026",
  mediaDeadlineFormatted: "November 1, 2026",
  isRegistrationOpen: true,

  defaultVenue: "Main Stage",
  prizePool: "₹1.49 LAKH+",
  trophyTitle: "The Celestial Astral Trophy",
  totalEvents: 14,
  address: "Srinivasan Medical College and Hospital, NH-45 Trichy-Chennai Highway, Samayapuram, Tiruchirappalli, Tamil Nadu 621112",
  officialEmail: "celestiasmch@gmail.com",
  inquiryContact: "+91 8075970766",
  
  // Official Payment Details
  paymentUpiIdPlaceholder: "ppqr01.aaotlx@iob",
  paymentBeneficiaryName: "Srinivasan Medical College",
};

/**
 * Returns event-specific registration deadline.
 * - Cineverse (Movie Recreation Reel) and Mememania (Meme Competition): November 1, 2026
 * - All other 12 festival events: October 28, 2026
 */
export function getEventDeadline(eventIdOrCode?: string): string {
  if (!eventIdOrCode) return 'October 28, 2026';
  const clean = eventIdOrCode.toLowerCase().trim();
  if (
    clean === 'cineverse' || 
    clean === 'md02' || 
    clean === 'mememania' || 
    clean === 'md01' ||
    clean.includes('reel') ||
    clean.includes('meme')
  ) {
    return 'November 1, 2026';
  }
  return 'October 28, 2026';
}

export const CATEGORIES: CategoryInfo[] = [
  {
    id: 'music',
    title: 'Music',
    subtitle: 'Vocal & Instrumental Harmony',
    description: 'Seraphia vocals and Symphora instrumental mastery under starlit acoustic resonance.',
    iconName: 'Music',
    accentColor: '#93C5FD',
  },
  {
    id: 'dance',
    title: 'Dance',
    subtitle: 'Cosmic Choreography',
    description: 'Nrityara classical solo, Eclipse western solo, Twin Flare duo, and Starfusion group dance.',
    iconName: 'Sparkles',
    accentColor: '#D4AF37',
  },
  {
    id: 'fashion',
    title: 'Fashion',
    subtitle: 'Celestial Runway',
    description: 'Elaris solo fashion walk and Silhouette Arabian Nights thematic fashion parade.',
    iconName: 'Crown',
    accentColor: '#E9D5FF',
  },
  {
    id: 'entertainment',
    title: 'Entertainment',
    subtitle: 'Thespian & Variety Arts',
    description: 'Reflexia replica stage acts, Cosmic Switch adaptunes, and AdBlitz marketing face-off.',
    iconName: 'Tv',
    accentColor: '#FDE047',
  },
  {
    id: 'special',
    title: 'Special Events',
    subtitle: 'Championship Flagships',
    description: 'Stellar Bid mock IPL mega auction spanning Day 2 prelims and Day 3 main hammer battle.',
    iconName: 'Award',
    accentColor: '#F59E0B',
  },
  {
    id: 'media',
    title: 'Digital & Media',
    subtitle: 'Meme & Reel Competitions',
    description: 'Mememania photo meme battle and Cineverse movie recreation reel contest with prizes up to ₹6,000.',
    iconName: 'Video',
    accentColor: '#F472B6',
  },
];

export const EVENTS_DATA: EventItem[] = [
  {
    id: 'seraphia',
    code: 'SERAPHIA',
    title: 'Seraphia',
    category: 'music',
    categoryDisplay: 'Music',
    type: 'Solo',
    gender: 'Open',
    participants: '1',
    minParticipants: 1,
    maxParticipants: 1,
    feeAmount: 250,
    feeType: 'per_head',
    allowsOnSpotRegistration: false,
    maxEntriesPerCollege: null,
    maxTotalCapacity: null,
    registrationFee: '₹250 per head',
    duration: '3–4 minutes',
    venue: 'Main Stage',
    prizes: {
      winner: '₹6,000',
      runnerUp: '₹3,000',
      totalFormatted: '₹9,000',
    },
    rules: [
      'Prelims may be conducted if required.',
      'Multiple entries from the same college are allowed.',
      'Medleys are allowed.',
      'Karaoke or own instruments are allowed.',
      'Drums will not be provided.',
      'Points will be deducted if team exceeds the alloted time limit.',
    ],
    judgingCriteria: [
      'Timing and pitch',
      'Vocal expression',
      'Impact',
      'Stage presence',
      'Song selection and presentation',
    ],
    incharges: [
      { name: 'Mahalakshmi S', phone: '8148149106', role: 'Event In-Charge' },
      { name: 'Aishwarya K', phone: '7826078945', role: 'Event In-Charge' },
      { name: 'Shri Praveen', phone: '8248076124', role: 'Event In-Charge' },
    ],
    featured: true,
  },
  {
    id: 'symphora',
    code: 'SYMPHORA',
    title: 'Symphora',
    category: 'music',
    categoryDisplay: 'Instrumental Music',
    type: 'Solo',
    gender: 'Open',
    participants: '1',
    minParticipants: 1,
    maxParticipants: 1,
    feeAmount: 250,
    feeType: 'per_head',
    allowsOnSpotRegistration: false,
    maxEntriesPerCollege: null,
    maxTotalCapacity: null,
    registrationFee: '₹250 per head',
    duration: '6–8 minutes including setup',
    venue: 'Main Stage',
    prizes: {
      winner: '₹7,000',
      runnerUp: '₹3,000',
      totalFormatted: '₹10,000',
    },
    rules: [
      'Multiple entries from a college are allowed.',
      'No accompanists.',
      'No backtracks or pre-recorded beats.',
      'Participants must bring their own instruments.',
      'Only drums will be provided.',
      'Allowed instruments include keyboard, guitar, violin, woodwind, drums and classical instruments.',
      'Points will be deducted if team exceeds the alloted time limit.',
      "Judges' decision will be final.",
    ],
    judgingCriteria: [
      'Composition',
      'Clarity',
      'Presentation',
      'Creativity and innovation',
      'Impact',
    ],
    incharges: [
      { name: 'Kaviya V S', phone: '9150272527', role: 'Event In-Charge' },
      { name: 'Arul', phone: '6380313600', role: 'Event In-Charge' },
      { name: 'Azar', phone: '9080628634', role: 'Event In-Charge' },
    ],
    featured: true,
  },
  {
    id: 'nrityara',
    code: 'NRITYARA',
    title: 'Nrityara',
    category: 'dance',
    categoryDisplay: 'Classical Dance',
    type: 'Solo',
    gender: 'Open',
    participants: '1',
    minParticipants: 1,
    maxParticipants: 1,
    feeAmount: 250,
    feeType: 'per_head',
    allowsOnSpotRegistration: false,
    maxEntriesPerCollege: 3,
    maxTotalCapacity: null,
    registrationFee: '₹250 per head',
    duration: '2–4 minutes',
    venue: 'Main Stage',
    prizes: {
      winner: '₹6,000',
      runnerUp: '₹3,000',
      totalFormatted: '₹9,000',
    },
    rules: [
      'Maximum 3 entries per college.',
      'Prelims may be conducted.',
      'Any pure classical dance form is allowed.',
      'Props must be informed beforehand.',
      'Points will be deducted if team exceeds the alloted time limit.',
      'Soundtrack must be submitted before the event.',
      'Any songs with classical beats or decent lyrics can be taken.',
      "Judges' decision will be final.",
    ],
    judgingCriteria: [
      'Steps',
      'Costumes',
      'Choreography',
      'Expression',
      'Stage coverage',
      'Overall appeal',
    ],
    incharges: [
      { name: 'Souujanya', phone: '9342094776', role: 'Event In-Charge' },
      { name: 'Ramya', phone: '9566817877', role: 'Event In-Charge' },
      { name: 'Reshma', phone: '6369860627', role: 'Event In-Charge' },
    ],
    featured: true,
  },
  {
    id: 'reflexia',
    code: 'REFLEXIA',
    title: 'Reflexia',
    category: 'entertainment',
    categoryDisplay: 'Replica',
    type: 'Team',
    gender: 'Open',
    participants: '1–10',
    minParticipants: 1,
    maxParticipants: 10,
    feeAmount: 2500,
    feeType: 'per_team',
    allowsOnSpotRegistration: false,
    maxEntriesPerCollege: 2,
    maxTotalCapacity: 10,
    registrationFee: '₹2,500 per team',
    duration: '5–6 minutes',
    venue: 'Main Stage',
    prizes: {
      winner: '₹15,000',
      runnerUp: '₹10,000',
      totalFormatted: '₹25,000',
    },
    rules: [
      'Maximum 2 teams per college.',
      'First 15 registrations will be accepted.',
      'Participants must replicate a recognized song/performance.',
      'Multiple songs are allowed.',
      'A reference video may be projected.',
      'Props are allowed.',
      'Dangerous props are prohibited.',
      'Participants must arrange their own props.',
      'Edited reference/performance video must be submitted in MP4 format before the deadline.',
      'Points will be deducted if team exceeds the alloted time limit.',
    ],
    judgingCriteria: null,
    incharges: [
      { name: 'Varshini', phone: '6380730291', role: 'Event In-Charge' },
      { name: 'Jackson', phone: '6382707302', role: 'Event In-Charge' },
    ],
    featured: true,
  },
  {
    id: 'stellar-bid',
    code: 'STELLAR-BID',
    title: 'Stellar Bid',
    category: 'special',
    categoryDisplay: 'Mock IPL Auction',
    type: 'Team',
    gender: 'Open',
    participants: '1–2 (Solo or Duo)',
    minParticipants: 1,
    maxParticipants: 2,
    feeAmount: 300,
    feeType: 'per_team',
    allowsOnSpotRegistration: false,
    maxEntriesPerCollege: null,
    maxTotalCapacity: null,
    registrationFee: '₹300 per team',
    duration: 'Day 2: Prelims, Day 3: Main Auction',
    venue: 'Main Stage',
    prizes: {
      winner: '₹5,000',
      runnerUp: '₹3,000',
      totalFormatted: '₹8,000',
    },
    rules: [
      '1 to 2 participants per team (Single participant entry is also allowed; maximum 2 participants per team).',
      'Prelims round questions will be based strictly and exclusively on IPL.',
      '30-mark MCQ round.',
      '20-mark pen-and-paper round.',
      'Top 10 teams qualify for the auction.',
      'Ranking determines auction preference.',
      'Auction purse: ₹120 crore.',
      'Squad size: 18–25 players.',
      'Maximum 8 overseas players.',
      '1 RTM available.',
      'Bids are time-limited.',
      'Teams should consider IPL performance, recent form, squad balance, combination, auction strategy and home-condition advantage.',
    ],
    judgingCriteria: [
      'IPL performance',
      'Recent form',
      'Squad balance',
      'Combination',
      'Auction strategy',
      'Home-condition advantage',
    ],
    incharges: [
      { name: 'Surya Narayan P', phone: '8075970766', role: 'Event In-Charge' },
      { name: 'Rajamurugar VV', phone: '6379279332', role: 'Event In-Charge' },
    ],
    featured: true,
  },
  {
    id: 'eclipse',
    code: 'ECLIPSE',
    title: 'Eclipse',
    category: 'dance',
    categoryDisplay: 'Western Dance',
    type: 'Solo',
    gender: 'Open',
    participants: '1',
    minParticipants: 1,
    maxParticipants: 1,
    feeAmount: 250,
    feeType: 'per_head',
    allowsOnSpotRegistration: false,
    maxEntriesPerCollege: null,
    maxTotalCapacity: null,
    registrationFee: '₹250 per head',
    duration: '5–7 minutes',
    venue: 'Main Stage',
    prizes: {
      winner: '₹6,000',
      runnerUp: '₹3,000',
      totalFormatted: '₹9,000',
    },
    rules: [
      'Any language is allowed.',
      'Props must be shown beforehand.',
      'Participants must arrange their own props.',
      'Slippery or messy materials are prohibited.',
      'MP3 must be submitted before the event.',
      'Points will be deducted if team exceeds the alloted time limit.',
    ],
    judgingCriteria: [
      'Coordination',
      'Execution',
      'Presentation',
      'Theme',
      'Style',
      'Expressions',
      'Costumes',
      'Props',
      'Discipline/effect',
    ],
    incharges: [
      { name: 'Amlesh S', phone: '9080813899', role: 'Event In-Charge' },
      { name: 'Aathayan', phone: '6374035070', role: 'Event In-Charge' },
      { name: 'Gayathri Devi', phone: '8148205647', role: 'Event In-Charge' },
    ],
    featured: true,
  },
  {
    id: 'cosmic-switch',
    code: 'COSMIC-SWITCH',
    title: 'Cosmic Switch',
    category: 'entertainment',
    categoryDisplay: 'Adaptunes (Solo)',
    type: 'Solo',
    gender: 'Open',
    participants: '1',
    minParticipants: 1,
    maxParticipants: 1,
    feeAmount: 300,
    feeType: 'per_head',
    allowsOnSpotRegistration: false,
    maxEntriesPerCollege: null,
    maxTotalCapacity: null,
    registrationFee: '₹300 per head',
    duration: '3–5 minutes',
    venue: 'Main Stage',
    prizes: {
      winner: '₹5,000',
      runnerUp: '₹3,000',
      totalFormatted: '₹8,000',
    },
    rules: [
      'Individual solo adaptunes competition.',
      'Priority is based on registration order.',
      'Random music in any language will be played continuously.',
      'Participants must adapt and dance according to the changing tracks on the spot.',
      'Points will be deducted if team exceeds the alloted time limit.',
      "Judges' decision will be final and binding.",
    ],
    judgingCriteria: [
      'Adaptability and quick response',
      'Execution and rhythm',
      'Presentation and style',
      'Expressions and stage presence',
      'Energy and overall impact',
    ],
    incharges: [
      { name: 'Jayaguru S', phone: '6381975169', role: 'Event In-Charge' },
      { name: 'Vicheathra V', phone: '8778811810', role: 'Event In-Charge' },
    ],
    featured: false,
  },
  {
    id: 'twin-flare',
    code: 'TWIN-FLARE',
    title: 'Twin Flare',
    category: 'dance',
    categoryDisplay: 'Duo Dance',
    type: 'Duo',
    gender: 'Open',
    participants: '2',
    minParticipants: 2,
    maxParticipants: 2,
    feeAmount: 400,
    feeType: 'per_team',
    allowsOnSpotRegistration: false,
    maxEntriesPerCollege: 2,
    maxTotalCapacity: null,
    registrationFee: '₹400 per team',
    duration: '3–5 minutes',
    venue: 'Main Stage',
    prizes: {
      winner: '₹8,000',
      runnerUp: '₹4,000',
      totalFormatted: '₹12,000',
    },
    rules: [
      'Exactly 2 participants per team (Fixed duo event).',
      'Maximum 2 teams per college.',
      'Any gender combination is allowed.',
      'Any language is allowed.',
      'Contemporary, western or freestyle dance is allowed.',
      'Points will be deducted if team exceeds the alloted time limit.',
      'Props require approval.',
      'Powder, water and confetti are prohibited.',
      'MP3 must be submitted.',
      'Backup track should be available.',
    ],
    judgingCriteria: [
      'Coordination',
      'Execution',
      'Theme',
      'Song',
      'Expressions',
      'Costumes',
      'Props',
      'Discipline',
    ],
    incharges: [
      { name: 'Abi. S', phone: '9384375191', role: 'Event In-Charge' },
      { name: 'Swetha', phone: '9361350690', role: 'Event In-Charge' },
    ],
    featured: false,
  },
  {
    id: 'starfusion',
    code: 'STARFUSION',
    title: 'Starfusion',
    category: 'dance',
    categoryDisplay: 'Group Dance',
    type: 'Team',
    gender: 'Open',
    participants: '1–15',
    minParticipants: 1,
    maxParticipants: 15,
    feeAmount: 300,
    feeType: 'per_head', // ₹300 per head
    allowsOnSpotRegistration: false,
    maxEntriesPerCollege: 1,
    maxTotalCapacity: null,
    registrationFee: '₹300 per head',
    duration: '5–10 minutes',
    venue: 'Main Stage',
    prizes: {
      winner: '₹15,000',
      runnerUp: '₹7,000',
      totalFormatted: '₹22,000',
    },
    rules: [
      'Only 1 team per college.',
      'All participants must belong to the same college.',
      'Points will be deducted if team exceeds the alloted time limit.',
      'Any language is allowed.',
      'Props must be shown beforehand.',
      'Participants must arrange their own props.',
      'Slippery or messy materials are prohibited.',
      'MP3 must be submitted before the event.',
    ],
    judgingCriteria: [
      'Coordination',
      'Execution',
      'Presentation',
      'Theme',
      'Style',
      'Expressions',
      'Costumes',
      'Props',
      'Discipline/effect',
    ],
    incharges: [
      { name: 'Nithyasri', phone: '7016600195', role: 'Event In-Charge' },
      { name: 'Krushna Ghaandh', phone: '8072298956', role: 'Event In-Charge' },
      { name: 'Kamalika', phone: '7904560950', role: 'Event In-Charge' },
    ],
    featured: true,
  },
  {
    id: 'elaris',
    code: 'ELARIS',
    title: 'Elaris',
    category: 'fashion',
    categoryDisplay: 'Fashion Walk',
    type: 'Solo',
    gender: 'Open',
    participants: '1',
    minParticipants: 1,
    maxParticipants: 1,
    feeAmount: 250,
    feeType: 'per_head',
    allowsOnSpotRegistration: false,
    maxEntriesPerCollege: null,
    maxTotalCapacity: null,
    registrationFee: '₹250 per head',
    duration: '3–4 minutes',
    venue: 'Main Stage',
    prizes: {
      winner: '₹5,000',
      runnerUp: '₹3,000',
      totalFormatted: '₹8,000',
    },
    rules: [
      'Theme interpretation is expected.',
      'Props, accessories and choreography are subject to safety approval.',
      'Props must be shown/approved.',
      'Fire, sharp objects, explosives, liquids, powders and other hazards are prohibited.',
      'Costumes must be decent.',
      'Vulgarity and obscene gestures are prohibited.',
      'Music must be provided in a pen drive with a backup.',
      'Points will be deducted if team exceeds the alloted time limit.',
    ],
    judgingCriteria: [
      'Theme interpretation',
      'Costume/styling',
      'Creativity',
      'Ramp/confidence',
      'Stage presence',
      'Coordination',
      'Time management',
    ],
    incharges: [
      { name: 'Souujanya', phone: '9342094776', role: 'Event In-Charge' },
      { name: 'Srivarshini', phone: '6380730291', role: 'Event In-Charge' },
    ],
    featured: false,
  },
  {
    id: 'silhouette',
    code: 'SILHOUETTE',
    title: 'Silhouette',
    category: 'fashion',
    categoryDisplay: 'Fashion Parade',
    type: 'Team',
    gender: 'Open',
    participants: '1–10',
    minParticipants: 1,
    maxParticipants: 10,
    feeAmount: 300,
    feeType: 'per_head', // ₹300 per head
    allowsOnSpotRegistration: false,
    maxEntriesPerCollege: 1,
    maxTotalCapacity: null,
    theme: 'Arabian Nights',
    registrationFee: '₹300 per head',
    duration: '6–7 minutes',
    venue: 'Main Stage',
    prizes: {
      winner: '₹15,000',
      runnerUp: '₹10,000',
      totalFormatted: '₹25,000',
    },
    rules: [
      'Only 1 team per college.',
      'Team size 7–10 participants.',
      'Theme: Arabian Nights.',
      'Theme communication is expected.',
      'Props, accessories and choreography are subject to safety approval.',
      'Costumes must be shown to the organisers before the event begins.',
      'Fire, sharp objects, explosives, liquids, powders and other hazards are prohibited.',
      'Music must be provided in advance/pen drive with backup.',
      'Costumes must be decent.',
      'Vulgarity and obscene gestures are prohibited.',
      'The allotted time includes stage setup, costume presentation, and clearing the stage.',
      'Points will be deducted if team exceeds the alloted time limit.',
    ],
    judgingCriteria: [
      'Theme interpretation',
      'Costume/styling',
      'Creativity',
      'Ramp/confidence',
      'Stage presence',
      'Coordination',
      'Time management',
    ],
    incharges: [
      { name: 'Lavanya S', phone: '6374468392', role: 'Event In-Charge' },
      { name: 'Lekha J', phone: '7010132432', role: 'Event In-Charge' },
    ],
    featured: true,
  },
  {
    id: 'adblitz',
    code: 'ADBLITZ',
    title: 'AdBlitz',
    category: 'entertainment',
    categoryDisplay: 'Adzap',
    type: 'Team',
    gender: 'Open',
    participants: '1–8',
    minParticipants: 1,
    maxParticipants: 8,
    feeAmount: 300,
    feeType: 'per_team', // ₹300 per team
    allowsOnSpotRegistration: false,
    maxEntriesPerCollege: 2,
    maxTotalCapacity: null,
    registrationFee: '₹300 per team',
    duration: '4–5 minutes',
    venue: 'Main Stage',
    prizes: {
      winner: '₹4,000',
      runnerUp: '₹2,000',
      totalFormatted: '₹6,000',
    },
    rules: [
      'Product will be given on the spot.',
      '20 minutes preparation time.',
      'Team size 3–8.',
      'Maximum 2 teams per college.',
      'Performance duration 4–5 minutes.',
      'No stage sets.',
      'Pre-recorded music and instruments are allowed.',
      'Points will be deducted if team exceeds the alloted time limit.',
    ],
    judgingCriteria: [
      'Theme',
      'Marketing impact',
      'Humour',
      'Coordination',
      'Acting',
      'Crowd attractiveness',
      'Overall impact',
    ],
    incharges: [
      { name: 'Hariram', phone: '9500692230', role: 'Event In-Charge' },
      { name: 'Kanagadhaarini', phone: '6381228064', role: 'Event In-Charge' },
      { name: 'Pramod', phone: '7200192485', role: 'Event In-Charge' },
    ],
    featured: false,
  },
  {
    id: 'mememania',
    code: 'MEMEMANIA',
    title: 'Meme Competition (Mememania)',
    category: 'media',
    categoryDisplay: 'Digital & Media Arts',
    type: 'Solo',
    gender: 'Open',
    participants: '1 (Solo Entry)',
    minParticipants: 1,
    maxParticipants: 1,
    feeAmount: 25,
    feeType: 'per_head',
    allowsOnSpotRegistration: false,
    maxEntriesPerCollege: null,
    maxTotalCapacity: null,
    registrationFee: '₹25 per participant',
    duration: 'Online Submission',
    venue: 'Online / Instagram (@celestia__26)',
    theme: 'Open Theme',
    prizes: {
      winner: '₹2,000',
      runnerUp: '₹1,000',
      totalFormatted: '₹3,000',
    },
    rules: [
      'Theme: Open Theme.',
      'Multiple entries from a college are allowed.',
      'Only one entry per participant.',
      'Language: English or Tamil only.',
      'Only photo memes are accepted (no videos or GIFs).',
      'The software or application used for designing must be clearly specified (e.g., Adobe Photoshop, Canva, etc.).',
      'Memes should be original, humorous and must not offend any person or group.',
      'Memes will be posted on our Instagram handle: celestia__26.',
      'Any form of plagiarism, presence of watermarks, use of AI-generated content without prior disclosure, or violation of the given rules will result in immediate disqualification.',
      'Submission Guidelines: Last date of submission: 1st November, 2026.',
      'File format: JPEG / PNG.',
      'Aspect ratio: 1:1 or 4:5.',
      'Resolution: Minimum 1080 × 1080 px.',
      'File name format: MEME MANIA_NAME_College.',
      'Submit it either to the respective in-charge or to the given email ID: celestiasmch@gmail.com.',
      'Event In-Charges: Sharmila (9994048706), Aravind (9363638688), Uma (8438821975).',
    ],
    judgingCriteria: [
      'Creativity',
      'Originality',
      'Entertainment value',
      'Overall impression',
    ],
    incharges: [
      { name: 'Sharmila', phone: '9994048706', role: 'Event In-Charge' },
      { name: 'Aravind', phone: '9363638688', role: 'Event In-Charge' },
      { name: 'Uma', phone: '8438821975', role: 'Event In-Charge' },
    ],
    featured: true,
  },
  {
    id: 'cineverse',
    code: 'CINEVERSE',
    title: 'Movie Recreation Reel (Cineverse)',
    category: 'media',
    categoryDisplay: 'Digital & Media Arts',
    type: 'Solo',
    gender: 'Open',
    participants: '1 (Per Entry)',
    minParticipants: 1,
    maxParticipants: 1,
    feeAmount: 75,
    feeType: 'per_head',
    allowsOnSpotRegistration: false,
    maxEntriesPerCollege: null,
    maxTotalCapacity: null,
    registrationFee: '₹75 per participant',
    duration: '60 Seconds Max',
    venue: 'Online / Instagram (@celestia__26)',
    theme: 'Re-creation of any recognised movie scene or song',
    prizes: {
      winner: '₹4,000',
      runnerUp: '₹2,000',
      totalFormatted: '₹6,000',
    },
    rules: [
      'Theme: Re-creation of any recognised movie scene or song.',
      'Any movie scene or song can be recreated.',
      'The original scene/song must be combined or edited with the recreated version, with the original on top and the recreated version at the bottom.',
      'The final output must be in 9:16 dimension video (with top: original video, bottom: recreated video).',
      'The dress code must be relevant to the recreated song or scene.',
      'The time limit is 60 seconds. Participants must strictly adhere to the prescribed time limit.',
      'Points will be deducted if team exceeds the alloted time limit.',
      'Multiple entries from the same college are allowed.',
      'Only one entry per participant is permitted.',
      'Cross-college teams are not allowed.',
      'Reels will be posted on our Instagram handle: celestia__26.',
      'Submission Guidelines: Last date of submission: 1st November, 2026.',
      'File format: Video, background ratio: 9:16 (Top: Original video, Bottom: Recreated video, Time limit: 60 seconds).',
      'Resolution: Minimum 1080 × 1080 px.',
      'File name format: CINEVERSE_NAME_College.',
      'Submit it either to the respective in-charge or to the given email ID: celestiasmch@gmail.com.',
      'Event In-Charges: Sharmila (9994048706), Aravind (9363638688), Uma (8438821975).',
    ],
    judgingCriteria: [
      'Creativity',
      'Originality',
      'Entertainment value',
      'Overall impression',
    ],
    incharges: [
      { name: 'Sharmila', phone: '9994048706', role: 'Event In-Charge' },
      { name: 'Aravind', phone: '9363638688', role: 'Event In-Charge' },
      { name: 'Uma', phone: '8438821975', role: 'Event In-Charge' },
    ],
    featured: true,
  },
];

export interface ScheduleDay {
  dayNumber: 1 | 2 | 3;
  dateStr: string;
  themeTitle: string;
  summary: string;
  highlights: string[];
  slots: {
    time: string;
    title: string;
    category: 'music' | 'dance' | 'fashion' | 'entertainment' | 'special' | 'media' | 'ceremony';
    venue: string;
    code?: string;
    highlight?: boolean;
  }[];
}

export const FESTIVAL_SCHEDULE: ScheduleDay[] = [
  {
    dayNumber: 1,
    dateStr: 'November 3, 2026',
    themeTitle: 'Day 1: The Celestial Genesis',
    summary: 'Classical dance solos, melodic vocal renditions, instrumental harmony, and iconic replica performances.',
    highlights: ['Solo Classical Dance', 'Solo Singing', 'Solo Instrumental Music', 'Replica'],
    slots: [
      { time: '11:00 AM', title: 'Solo Classical Dance (Nrityara)', category: 'dance', venue: 'Main Stage', code: 'NRITYARA', highlight: true },
      { time: '02:00 PM', title: 'Solo Singing (Seraphia)', category: 'music', venue: 'Main Stage', code: 'SERAPHIA', highlight: true },
      { time: '03:00 PM', title: 'Solo Instrumental Music (Symphora)', category: 'music', venue: 'Main Stage', code: 'SYMPHORA', highlight: true },
      { time: '05:00 PM', title: 'Replica (Reflexia)', category: 'entertainment', venue: 'Main Stage', code: 'REFLEXIA', highlight: true },
    ],
  },
  {
    dayNumber: 2,
    dateStr: 'November 4, 2026',
    themeTitle: 'Day 2: The Astral Surge',
    summary: 'Online creative showcase, western dance solos, high-strategy IPL auction prelims, impromptu adaptunes, duo dance showdown, and electrifying DJ Night.',
    highlights: ['Reels & Meme (Online)', 'Solo Western Dance', 'Mock IPL Auction – Prelims', 'Adaptunes', 'Duo Dance', 'DJ Night'],
    slots: [
      { time: '11:00 AM', title: 'Meme Competition (Mememania)', category: 'media', venue: 'Online / Instagram (@celestia__26)', code: 'MEMEMANIA', highlight: true },
      { time: '12:00 PM', title: 'Movie Recreation Reel (Cineverse)', category: 'media', venue: 'Online / Instagram (@celestia__26)', code: 'CINEVERSE', highlight: true },
      { time: '03:00 PM', title: 'Solo Western Dance (Eclipse)', category: 'dance', venue: 'Main Stage', code: 'ECLIPSE', highlight: true },
      { time: '04:00 PM', title: 'Mock IPL Auction – Prelims (Stellar Bid)', category: 'special', venue: 'Auditorium Hall', code: 'STELLAR-BID', highlight: true },
      { time: '04:00 PM', title: 'Adaptunes (Cosmic Switch)', category: 'entertainment', venue: 'Main Stage', code: 'COSMIC-SWITCH', highlight: true },
      { time: '05:00 PM', title: 'Duo Dance (Twin Flare)', category: 'dance', venue: 'Main Stage', code: 'TWIN-FLARE', highlight: true },
      { time: '07:00 PM', title: 'DJ Night', category: 'special', venue: 'Open Grounds / Grand Stage', highlight: true },
    ],
  },
  {
    dayNumber: 3,
    dateStr: 'November 5, 2026',
    themeTitle: 'Day 3: The Cosmic Zenith',
    summary: 'Grand auction finals, solo cosplay runway, flagship group dance, adzap marketing battles, Arabian Nights fashion parade, and the grand finale DJ Night.',
    highlights: ['Mock IPL Auction – Finals', 'Cosplay – Fashion Walk Solo', 'Group Dance', 'Adzap', 'Fashion Parade', 'DJ Night'],
    slots: [
      { time: '09:00 AM', title: 'Mock IPL Auction – Finals (Stellar Bid)', category: 'special', venue: 'Auditorium Hall', code: 'STELLAR-BID', highlight: true },
      { time: '10:00 AM', title: 'Cosplay – Fashion Walk Solo (Elaris)', category: 'fashion', venue: 'Main Stage', code: 'ELARIS', highlight: true },
      { time: '03:00 PM', title: 'Group Dance (Starfusion)', category: 'dance', venue: 'Main Stage', code: 'STARFUSION', highlight: true },
      { time: '04:00 PM', title: 'Adzap (AdBlitz)', category: 'entertainment', venue: 'Main Stage', code: 'ADBLITZ', highlight: true },
      { time: '06:00 PM', title: 'Fashion Parade (Silhouette – Arabian Nights)', category: 'fashion', venue: 'Main Stage', code: 'SILHOUETTE', highlight: true },
      { time: '08:30 PM', title: 'DJ Night (Grand Finale)', category: 'special', venue: 'Open Grounds / Grand Stage', highlight: true },
    ],
  },
];

