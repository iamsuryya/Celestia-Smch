export interface GuestItem {
  id: string;
  name: string;
  designation: string;
  institution: string;
  photo: string;
  role: string;
  day: 1 | 2 | 3;
  isMainGuest: boolean;
}

/**
 * SECTION 1: TWO MAIN / DISTINGUISHED GUESTS
 * Highest visual prominence on Celestia'26 homepage.
 * Placeholder values preserve authenticity until official announcements.
 */
export const MAIN_GUESTS_DATA: GuestItem[] = [
  {
    id: 'main-guest-1',
    name: 'Rio Raj',
    designation: 'Actor & Television Presenter',
    institution: 'Tamil Cinema & Media Industry',
    photo: '/images/guests/main-guest-1.svg',
    role: 'Chief Guest',
    day: 1,
    isMainGuest: true,
  },
  {
    id: 'main-guest-2',
    name: 'Aparna Das',
    designation: 'Celebrity Guest & Artist',
    institution: 'Cultural Arts & Entertainment',
    photo: '/images/guests/main-guest-2.svg',
    role: 'Guest of Honour',
    day: 1,
    isMainGuest: true,
  },
];

/**
 * SECTION 2: GUEST LINE-UP BY DAY
 * Daily guests attending across Day 1 (Nov 3), Day 2 (Nov 4), and Day 3 (Nov 5).
 */
export const DAILY_GUESTS_DATA: GuestItem[] = [
  // Day 1: November 3, 2026
  {
    id: 'day1-guest-1',
    name: '[Honoured Guest Name]',
    designation: '[Designation / Specialisation]',
    institution: '[Institution / Organisation]',
    photo: '',
    role: 'Keynote Speaker',
    day: 1,
    isMainGuest: false,
  },
  {
    id: 'day1-guest-2',
    name: '[Honoured Guest Name]',
    designation: '[Designation / Specialisation]',
    institution: '[Institution / Organisation]',
    photo: '',
    role: 'Inaugural Dignitary',
    day: 1,
    isMainGuest: false,
  },
  {
    id: 'day1-guest-3',
    name: '[Honoured Guest Name]',
    designation: '[Designation / Specialisation]',
    institution: '[Institution / Organisation]',
    photo: '',
    role: 'Special Invitee',
    day: 1,
    isMainGuest: false,
  },
  {
    id: 'day1-guest-4',
    name: '[Honoured Guest Name]',
    designation: '[Designation / Specialisation]',
    institution: '[Institution / Organisation]',
    photo: '',
    role: 'Cultural Evaluator',
    day: 1,
    isMainGuest: false,
  },

  // Day 2: November 4, 2026
  {
    id: 'day2-guest-1',
    name: '[Honoured Guest Name]',
    designation: '[Designation / Specialisation]',
    institution: '[Institution / Organisation]',
    photo: '',
    role: 'Celebrity Jury',
    day: 2,
    isMainGuest: false,
  },
  {
    id: 'day2-guest-2',
    name: '[Honoured Guest Name]',
    designation: '[Designation / Specialisation]',
    institution: '[Institution / Organisation]',
    photo: '',
    role: 'Guest Speaker',
    day: 2,
    isMainGuest: false,
  },
  {
    id: 'day2-guest-3',
    name: '[Honoured Guest Name]',
    designation: '[Designation / Specialisation]',
    institution: '[Institution / Organisation]',
    photo: '',
    role: 'Special Invitee',
    day: 2,
    isMainGuest: false,
  },
  {
    id: 'day2-guest-4',
    name: '[Honoured Guest Name]',
    designation: '[Designation / Specialisation]',
    institution: '[Institution / Organisation]',
    photo: '',
    role: 'Stage Adjudicator',
    day: 2,
    isMainGuest: false,
  },

  // Day 3: November 5, 2026
  {
    id: 'day3-guest-1',
    name: '[Honoured Guest Name]',
    designation: '[Designation / Specialisation]',
    institution: '[Institution / Organisation]',
    photo: '',
    role: 'Valedictory Chief Guest',
    day: 3,
    isMainGuest: false,
  },
  {
    id: 'day3-guest-2',
    name: '[Honoured Guest Name]',
    designation: '[Designation / Specialisation]',
    institution: '[Institution / Organisation]',
    photo: '',
    role: 'Awards Dignitary',
    day: 3,
    isMainGuest: false,
  },
  {
    id: 'day3-guest-3',
    name: '[Honoured Guest Name]',
    designation: '[Designation / Specialisation]',
    institution: '[Institution / Organisation]',
    photo: '',
    role: 'Special Invitee',
    day: 3,
    isMainGuest: false,
  },
  {
    id: 'day3-guest-4',
    name: '[Honoured Guest Name]',
    designation: '[Designation / Specialisation]',
    institution: '[Institution / Organisation]',
    photo: '',
    role: 'Grand Finale Guest',
    day: 3,
    isMainGuest: false,
  },
];
