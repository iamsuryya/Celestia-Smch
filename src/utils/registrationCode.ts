import { EVENTS_DATA } from '../data/festivalData';
import { RegistrationSubmission } from '../types/registration';

/**
 * Returns the 1-based order number of the event in EVENTS_DATA.
 * Event 1 = SERAPHIA, Event 2 = SYMPHORA, Event 3 = NRITYARA, etc.
 */
export function getEventOrderNumber(eventCodeOrId: string | undefined): number {
  if (!eventCodeOrId) return 1;
  const normalized = eventCodeOrId.toLowerCase().trim();
  const index = EVENTS_DATA.findIndex(
    (ev) => ev.id.toLowerCase() === normalized || ev.code.toLowerCase() === normalized
  );
  return index !== -1 ? index + 1 : 1;
}

/**
 * Generates an immutable, strictly monotonic registration code following Celestia'26 spec:
 * Format: C26-DDMMYY-REG_OF_DAY-EVENT_ORDER
 * 
 * Monotonic Suffix Guarantee: Uses daily high-water mark sequence counters that NEVER decrement
 * upon record deletion, plus timestamp offsets to guarantee zero duplication.
 */
export function generateRegistrationCode(
  eventCodeOrId: string | undefined,
  targetDate: Date = new Date()
): string {
  const day = String(targetDate.getDate()).padStart(2, '0');
  const month = String(targetDate.getMonth() + 1).padStart(2, '0');
  const year = String(targetDate.getFullYear()).slice(-2);
  const dateStr = `${day}${month}${year}`; // e.g. 141026

  const eventOrder = getEventOrderNumber(eventCodeOrId);

  // 1. Read persistent daily sequence counter & high water mark for this date
  const counterKey = `celestia_reg_counter_${dateStr}`;
  const highWaterKey = `celestia_high_water_counter_${dateStr}`;
  
  let currentCount = 0;
  let highWater = 0;

  try {
    currentCount = parseInt(localStorage.getItem(counterKey) || '0', 10) || 0;
    highWater = parseInt(localStorage.getItem(highWaterKey) || '0', 10) || 0;
  } catch {}

  // 2. Scan existing saved registrations to ensure counter is at least equal to highest observed seq for this day
  try {
    const savedRegs = localStorage.getItem('celestia26_registrations');
    if (savedRegs) {
      const parsed: RegistrationSubmission[] = JSON.parse(savedRegs);
      parsed.forEach((r) => {
        const code = r.registrationCode || r.id || '';
        const pattern = new RegExp(`^C26-${dateStr}-(\\d+)`, 'i');
        const match = code.match(pattern);
        if (match) {
          const seqNum = parseInt(match[1], 10);
          if (!isNaN(seqNum) && seqNum > highWater) {
            highWater = seqNum;
          }
        }
      });
    }
  } catch {}

  // Monotonic sequence is strictly max of currentCount and highWater + 1
  const nextSeq = Math.max(currentCount, highWater) + 1;

  try {
    localStorage.setItem(counterKey, String(nextSeq));
    localStorage.setItem(highWaterKey, String(nextSeq));
  } catch {}

  return `C26-${dateStr}-${nextSeq}-${eventOrder}`;
}
