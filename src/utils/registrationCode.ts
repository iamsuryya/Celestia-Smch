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
 * Generates an immutable, stable registration code following the Celestia'26 specification:
 * Format: C26-DDMMYY-REG_OF_DAY-EVENT_ORDER
 * 
 * - C26: Common festival prefix
 * - DDMMYY: Date of registration (e.g., 131026 for 13 Oct 2026)
 * - REG_OF_DAY: Monotonic sequential registration count of that specific day (1, 2, 3... 10 etc.)
 * - EVENT_ORDER: 1-based order index of the event (Event 1, Event 2, etc.)
 * 
 * Monotonic Guarantee: Deleting an existing registration will NEVER renumber existing registrations
 * or decrement the daily counter, ensuring other events and entries remain strictly unaffected.
 */
export function generateRegistrationCode(
  eventCodeOrId: string | undefined,
  targetDate: Date = new Date()
): string {
  const day = String(targetDate.getDate()).padStart(2, '0');
  const month = String(targetDate.getMonth() + 1).padStart(2, '0');
  const year = String(targetDate.getFullYear()).slice(-2);
  const dateStr = `${day}${month}${year}`; // e.g. 131026

  const eventOrder = getEventOrderNumber(eventCodeOrId);

  // 1. Read persistent daily sequence counter for this date
  const counterKey = `celestia_reg_counter_${dateStr}`;
  let currentDailyCount = 0;
  try {
    const saved = localStorage.getItem(counterKey);
    if (saved) {
      currentDailyCount = parseInt(saved, 10) || 0;
    }
  } catch {}

  // 2. Scan existing saved registrations to ensure counter is at least equal to highest observed seq for this day
  try {
    const savedRegs = localStorage.getItem('celestia26_registrations');
    if (savedRegs) {
      const parsed: RegistrationSubmission[] = JSON.parse(savedRegs);
      parsed.forEach((r) => {
        const code = r.registrationCode || r.id || '';
        // Match C26-DDMMYY-X-Y
        const pattern = new RegExp(`^C26-${dateStr}-(\\d+)`, 'i');
        const match = code.match(pattern);
        if (match) {
          const seqNum = parseInt(match[1], 10);
          if (!isNaN(seqNum) && seqNum > currentDailyCount) {
            currentDailyCount = seqNum;
          }
        }
      });
    }
  } catch {}

  // 3. Increment counter monotonically
  const nextSeq = currentDailyCount + 1;
  try {
    localStorage.setItem(counterKey, String(nextSeq));
  } catch {}

  return `C26-${dateStr}-${nextSeq}-${eventOrder}`;
}
