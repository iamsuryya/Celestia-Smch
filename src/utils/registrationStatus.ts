import { EVENTS_DATA } from '../data/festivalData';

const STATUS_STORAGE_KEY = 'celestia_event_registration_status';
const GLOBAL_STATUS_STORAGE_KEY = 'celestia_global_registration_open';
const SMCH_PASSCODE_KEY = 'celestia_smch_passcode';

export interface EventRegistrationStatusMap {
  [eventIdOrCode: string]: boolean; // true = open, false = stopped/closed
}

/**
 * Returns whether global registrations are open.
 * Always defaults to true (OPEN) until explicitly stopped by admin.
 */
export function isGlobalRegistrationOpen(): boolean {
  try {
    const val = localStorage.getItem(GLOBAL_STATUS_STORAGE_KEY);
    if (val === 'false') return false;
    return true; // Default is OPEN
  } catch {
    return true;
  }
}

/**
 * Sets global registrations open/stopped state.
 */
export function setGlobalRegistrationOpen(isOpen: boolean): void {
  try {
    localStorage.setItem(GLOBAL_STATUS_STORAGE_KEY, String(isOpen));
    window.dispatchEvent(new CustomEvent('celestia-registration-status-changed'));
  } catch {}
}

/**
 * Reads all stored event-level registration statuses.
 */
export function getEventRegistrationStatusMap(): EventRegistrationStatusMap {
  try {
    const raw = localStorage.getItem(STATUS_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}
  return {};
}

/**
 * Returns whether registration for a specific event is open.
 * GUARANTEE: Never auto-stops by time or date!
 * Stays OPEN until an admin explicitly toggles it off.
 */
export function isEventRegistrationOpen(eventCodeOrId: string | undefined): boolean {
  if (!isGlobalRegistrationOpen()) return false;
  if (!eventCodeOrId) return true;

  const map = getEventRegistrationStatusMap();
  const normalized = eventCodeOrId.toLowerCase().trim();

  for (const [key, val] of Object.entries(map)) {
    if (key.toLowerCase().trim() === normalized) {
      return val !== false;
    }
  }

  // Default is OPEN for all events!
  return true;
}

/**
 * Sets registration open/closed status for a single event.
 */
export function setEventRegistrationOpen(eventCodeOrId: string, isOpen: boolean): void {
  try {
    const map = getEventRegistrationStatusMap();
    map[eventCodeOrId] = isOpen;
    // Also save under both ID and Code if matched in EVENTS_DATA
    const found = EVENTS_DATA.find(
      (e) => e.id.toLowerCase() === eventCodeOrId.toLowerCase() || e.code.toLowerCase() === eventCodeOrId.toLowerCase()
    );
    if (found) {
      map[found.id] = isOpen;
      map[found.code] = isOpen;
    }
    localStorage.setItem(STATUS_STORAGE_KEY, JSON.stringify(map));
    window.dispatchEvent(new CustomEvent('celestia-registration-status-changed'));
  } catch {}
}

/**
 * Sets registration open/closed status for all events at once.
 */
export function setAllEventsRegistrationOpen(isOpen: boolean): void {
  try {
    const map: EventRegistrationStatusMap = {};
    EVENTS_DATA.forEach((ev) => {
      map[ev.id] = isOpen;
      map[ev.code] = isOpen;
    });
    localStorage.setItem(STATUS_STORAGE_KEY, JSON.stringify(map));
    localStorage.setItem(GLOBAL_STATUS_STORAGE_KEY, String(isOpen));
    window.dispatchEvent(new CustomEvent('celestia-registration-status-changed'));
  } catch {}
}

/**
 * Returns the configurable SMCH host student passcode (default: CELESMCH).
 */
export function getSmchPasscode(): string {
  try {
    const val = localStorage.getItem(SMCH_PASSCODE_KEY);
    if (val && val.trim().length > 0) return val.trim();
  } catch {}
  return 'CELESMCH';
}

/**
 * Sets the SMCH host student passcode.
 */
export function setSmchPasscode(code: string): void {
  try {
    localStorage.setItem(SMCH_PASSCODE_KEY, code.trim());
    window.dispatchEvent(new CustomEvent('celestia-smch-passcode-changed'));
  } catch {}
}
