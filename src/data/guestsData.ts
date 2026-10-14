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

export const RIO_RAJ_DATA_URL = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 1000' width='100%' height='100%'><defs><linearGradient id='bg' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%23080D24'/><stop offset='40%' stop-color='%23121D42'/><stop offset='100%' stop-color='%23060918'/></linearGradient><linearGradient id='gold' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%23FFF6DF'/><stop offset='50%' stop-color='%23E6C57D'/><stop offset='100%' stop-color='%23D4AF37'/></linearGradient><linearGradient id='red' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%23DC2626'/><stop offset='100%' stop-color='%23991B1B'/></linearGradient></defs><rect width='800' height='1000' fill='url(%23bg)'/><circle cx='400' cy='380' r='280' fill='none' stroke='url(%23gold)' stroke-width='4' stroke-dasharray='12 6' opacity='0.6'/><path d='M 240 560 C 260 480 340 440 400 440 C 460 440 540 480 560 560 L 580 750 L 220 750 Z' fill='url(%23red)'/><path d='M 360 440 Q 400 460 440 440 L 430 380 L 370 380 Z' fill='%23E2A782'/><ellipse cx='400' cy='330' rx='75' ry='90' fill='%23F0B28A'/><path d='M 315 310 C 310 230 360 210 400 210 C 450 210 490 230 485 310 Z' fill='%231C1917'/><path d='M 330 330 C 330 410 470 410 470 330 C 470 385 450 415 400 415 C 350 415 330 385 330 330 Z' fill='%23262626' opacity='0.85'/><circle cx='368' cy='325' r='7' fill='%231C1917'/><circle cx='432' cy='325' r='7' fill='%231C1917'/><path d='M 370 378 Q 400 398 430 378' stroke='%239A5936' stroke-width='4' fill='none'/><rect x='80' y='760' width='640' height='180' rx='20' fill='%230B122E' stroke='url(%23gold)' stroke-width='2'/><text x='400' y='815' font-family='serif' font-size='36' font-weight='bold' fill='url(%23gold)' text-anchor='middle'>RIO RAJ</text><text x='400' y='855' font-family='sans-serif' font-size='20' font-weight='bold' fill='%23F5E7C4' text-anchor='middle'>ACTOR &amp; TELEVISION PRESENTER</text><text x='400' y='890' font-family='monospace' font-size='14' fill='%23E6C57D' text-anchor='middle'>CHIEF GUEST · CELESTIA %2726</text></svg>`;

export const APARNA_DAS_DATA_URL = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 1000' width='100%' height='100%'><defs><linearGradient id='bg2' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%23180C26'/><stop offset='50%' stop-color='%232A123E'/><stop offset='100%' stop-color='%230B0614'/></linearGradient><linearGradient id='gold2' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%23FFF6DF'/><stop offset='50%' stop-color='%23E6C57D'/><stop offset='100%' stop-color='%23D4AF37'/></linearGradient><linearGradient id='red2' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%23E11D48'/><stop offset='100%' stop-color='%23881337'/></linearGradient></defs><rect width='800' height='1000' fill='url(%23bg2)'/><circle cx='400' cy='380' r='280' fill='none' stroke='url(%23gold2)' stroke-width='4' stroke-dasharray='12 6' opacity='0.6'/><path d='M 220 540 C 250 460 340 430 400 430 C 460 430 550 460 580 540 L 620 760 L 180 760 Z' fill='url(%23red2)'/><path d='M 330 440 C 310 500 290 600 270 760' stroke='%23E2E8F0' stroke-width='10' opacity='0.9' fill='none'/><path d='M 470 440 C 490 500 510 600 530 760' stroke='%23E2E8F0' stroke-width='10' opacity='0.9' fill='none'/><path d='M 340 430 Q 400 470 460 430 L 440 370 L 360 370 Z' fill='%23F3C6A5'/><ellipse cx='400' cy='320' rx='70' ry='85' fill='%23F8D3B7'/><path d='M 320 280 C 290 220 350 190 400 190 C 450 190 510 220 480 280 C 520 350 510 480 480 540 Z' fill='%231C1917'/><circle cx='400' cy='285' r='3' fill='%23991B1B'/><circle cx='370' cy='312' r='6' fill='%231C1917'/><circle cx='430' cy='312' r='6' fill='%231C1917'/><path d='M 375 358 Q 400 372 425 358' stroke='%23BE123C' stroke-width='4' fill='none'/><rect x='80' y='760' width='640' height='180' rx='20' fill='%2312091F' stroke='url(%23gold2)' stroke-width='2'/><text x='400' y='815' font-family='serif' font-size='36' font-weight='bold' fill='url(%23gold2)' text-anchor='middle'>APARNA DAS</text><text x='400' y='855' font-family='sans-serif' font-size='20' font-weight='bold' fill='%23F5E7C4' text-anchor='middle'>CELEBRITY GUEST &amp; ARTIST</text><text x='400' y='890' font-family='monospace' font-size='14' fill='%23E6C57D' text-anchor='middle'>GUEST OF HONOUR · CELESTIA %2726</text></svg>`;

/**
 * SECTION 1: TWO MAIN / DISTINGUISHED GUESTS
 * Embedded inline Data URLs guarantee 100% visibility on all preview and live environments.
 */
export const MAIN_GUESTS_DATA: GuestItem[] = [
  {
    id: 'main-guest-1',
    name: 'Rio Raj',
    designation: 'Actor & Television Presenter',
    institution: 'Tamil Cinema & Media Industry',
    photo: RIO_RAJ_DATA_URL,
    role: 'Chief Guest',
    day: 1,
    isMainGuest: true,
  },
  {
    id: 'main-guest-2',
    name: 'Aparna Das',
    designation: 'Celebrity Guest & Artist',
    institution: 'Cultural Arts & Entertainment',
    photo: APARNA_DAS_DATA_URL,
    role: 'Guest of Honour',
    day: 1,
    isMainGuest: true,
  },
];

/**
 * SECTION 2: GUEST LINE-UP BY DAY
 */
export const DAILY_GUESTS_DATA: GuestItem[] = [];
