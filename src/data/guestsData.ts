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
 * Default image paths look inside public/images/guests/ for real JPEG/PNG photographs.
 */
export const MAIN_GUESTS_DATA: GuestItem[] = [
  {
    id: 'main-guest-1',
    name: 'Rio Raj',
    designation: 'Actor & Television Presenter',
    institution: 'Tamil Cinema & Media Industry',
    photo: '/images/guests/rio-raj.jpg',
    role: 'Chief Guest',
    day: 1,
    isMainGuest: true,
  },
  {
    id: 'main-guest-2',
    name: 'Aparna Das',
    designation: 'Celebrity Guest & Artist',
    institution: 'Cultural Arts & Entertainment',
    photo: '/images/guests/aparna-das.jpg',
    role: 'Guest of Honour',
    day: 1,
    isMainGuest: true,
  },
];

/**
 * SECTION 2: GUEST LINE-UP BY DAY
 */
export const DAILY_GUESTS_DATA: GuestItem[] = [];
