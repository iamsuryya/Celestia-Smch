import { EVENTS_DATA } from '../data/festivalData';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const STATUS_STORAGE_KEY = 'celestia_event_registration_status';
const GLOBAL_STATUS_STORAGE_KEY = 'celestia_global_registration_open';
const SMCH_PASSCODE_KEY = 'celestia_smch_passcode';

export interface EventRegistrationStatusMap {
  [eventIdOrCode: string]: boolean; // true = open, false = stopped/closed
}

/**
 * Returns whether global registrations are open.
 * Default is CLOSED (false) as registrations for ALL events are now officially stopped.
/**
 * Returns whether global registrations are open.
 * Unconditionally returns false (REGISTRATION CLOSED FOR ALL EVENTS).
 */
export function isGlobalRegistrationOpen(): boolean {
  return false;
}

/**
 * Sets global registrations open/stopped state.
 */
export function setGlobalRegistrationOpen(isOpen: boolean): void {
  try {
    localStorage.setItem(GLOBAL_STATUS_STORAGE_KEY, 'false');
    window.dispatchEvent(new CustomEvent('celestia-registration-status-changed'));
    saveStatusToSupabase(getEventRegistrationStatusMap(), false);
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
 * Unconditionally returns false for ALL events (REGISTRATION CLOSED).
 */
export function isEventRegistrationOpen(_eventCodeOrId: string | undefined): boolean {
  return false;
}

/**
 * Sets registration open/closed status for a single event and syncs across devices via Supabase.
 */
export function setEventRegistrationOpen(eventCodeOrId: string, isOpen: boolean): void {
  try {
    const map = getEventRegistrationStatusMap();
    const normalized = eventCodeOrId.toLowerCase().trim();

    if (normalized === 'starfusion' || normalized === 'star fusion' || normalized === 'star-fusion' || normalized === 'group-dance') {
      localStorage.setItem('celestia_starfusion_manual_override', String(isOpen));
    }
    if (normalized === 'seraphia' || normalized === 'solo-singing') {
      localStorage.setItem('celestia_seraphia_manual_override', String(isOpen));
    }
    if (normalized === 'elaris' || normalized === 'f01' || normalized === 'cosplay') {
      localStorage.setItem('celestia_elaris_manual_override', String(isOpen));
    }
    
    map[eventCodeOrId] = isOpen;
    map[normalized] = isOpen;

    // Also save under both ID and Code if matched in EVENTS_DATA
    const found = EVENTS_DATA.find(
      (e) => e.id.toLowerCase() === normalized || e.code.toLowerCase() === normalized
    );
    if (found) {
      map[found.id] = isOpen;
      map[found.code] = isOpen;
      map[found.id.toLowerCase()] = isOpen;
      map[found.code.toLowerCase()] = isOpen;
    }

    localStorage.setItem(STATUS_STORAGE_KEY, JSON.stringify(map));
    window.dispatchEvent(new CustomEvent('celestia-registration-status-changed', { detail: { eventCodeOrId, isOpen } }));
    window.dispatchEvent(new Event('storage'));

    // Persist to Supabase DB
    saveStatusToSupabase(map, isGlobalRegistrationOpen());
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
      map[ev.id.toLowerCase()] = isOpen;
      map[ev.code.toLowerCase()] = isOpen;
    });
    localStorage.setItem(STATUS_STORAGE_KEY, JSON.stringify(map));
    localStorage.setItem(GLOBAL_STATUS_STORAGE_KEY, String(isOpen));
    window.dispatchEvent(new CustomEvent('celestia-registration-status-changed', { detail: { isOpen } }));
    window.dispatchEvent(new Event('storage'));

    // Persist to Supabase DB
    saveStatusToSupabase(map, isOpen);
  } catch {}
}

/**
 * Persists event status map to Supabase cloud database for cross-device consistency
 */
export async function saveStatusToSupabase(map: EventRegistrationStatusMap, isGlobalOpen: boolean = true): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    const payload = {
      setting_key: 'event_registration_status',
      setting_value: JSON.stringify({ map, globalOpen: isGlobalOpen }),
      updated_at: new Date().toISOString(),
    };

    const { data: existing } = await supabase
      .from('celestia_app_settings')
      .select('setting_key')
      .eq('setting_key', 'event_registration_status')
      .maybeSingle();

    if (existing) {
      await supabase
        .from('celestia_app_settings')
        .update(payload)
        .eq('setting_key', 'event_registration_status');
    } else {
      await supabase
        .from('celestia_app_settings')
        .insert([payload]);
    }
  } catch (err) {
    // Fail silently or handle fallback
  }
}

/**
 * Loads event registration status map from Supabase cloud DB to sync Admin changes across all devices
 */
export async function loadStatusFromSupabase(): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    const { data, error } = await supabase
      .from('celestia_app_settings')
      .select('setting_value')
      .eq('setting_key', 'event_registration_status')
      .maybeSingle();

    if (!error && data && data.setting_value) {
      const parsed = typeof data.setting_value === 'string' ? JSON.parse(data.setting_value) : data.setting_value;
      if (parsed && typeof parsed === 'object') {
        if (parsed.map) {
          // Seraphia registration is stopped / closed
          if (localStorage.getItem('celestia_seraphia_manual_override') !== 'true') {
            parsed.map['seraphia'] = false;
            parsed.map['SERAPHIA'] = false;
          }
          // Star Fusion / Starfusion registration is stopped / closed
          parsed.map['starfusion'] = false;
          parsed.map['STARFUSION'] = false;

          // Mememania / Memania registration is stopped / closed
          parsed.map['mememania'] = false;
          parsed.map['MEMEMANIA'] = false;
          parsed.map['memania'] = false;

          // Cineverse registration is stopped / closed
          parsed.map['cineverse'] = false;
          parsed.map['CINEVERSE'] = false;
          localStorage.setItem(STATUS_STORAGE_KEY, JSON.stringify(parsed.map));
        }
        if (typeof parsed.globalOpen === 'boolean') {
          localStorage.setItem(GLOBAL_STATUS_STORAGE_KEY, String(parsed.globalOpen));
        }
        window.dispatchEvent(new CustomEvent('celestia-registration-status-changed'));
      }
    }
  } catch (err) {
    // Fail silently
  }
}

// Automatically initiate cloud status sync on import and stop closed registrations
if (typeof window !== 'undefined') {
  try {
    const map = getEventRegistrationStatusMap();
    let changed = false;

    if (map['seraphia'] !== false || map['SERAPHIA'] !== false || !localStorage.getItem('celestia_seraphia_closed_final')) {
      map['seraphia'] = false;
      map['SERAPHIA'] = false;
      localStorage.setItem('celestia_seraphia_closed_final', 'true');
      changed = true;
    }

    if (map['starfusion'] !== false || map['STARFUSION'] !== false || !localStorage.getItem('celestia_starfusion_closed_final')) {
      map['starfusion'] = false;
      map['STARFUSION'] = false;
      localStorage.setItem('celestia_starfusion_closed_final', 'true');
      changed = true;
    }

    if (map['mememania'] !== false || map['MEMEMANIA'] !== false || !localStorage.getItem('celestia_mememania_closed_final')) {
      map['mememania'] = false;
      map['MEMEMANIA'] = false;
      map['memania'] = false;
      localStorage.setItem('celestia_mememania_closed_final', 'true');
      changed = true;
    }

    if (map['cineverse'] !== false || map['CINEVERSE'] !== false || !localStorage.getItem('celestia_cineverse_closed_final')) {
      map['cineverse'] = false;
      map['CINEVERSE'] = false;
      localStorage.setItem('celestia_cineverse_closed_final', 'true');
      changed = true;
    }

    if (changed) {
      localStorage.setItem(STATUS_STORAGE_KEY, JSON.stringify(map));
      window.dispatchEvent(new CustomEvent('celestia-registration-status-changed'));
      saveStatusToSupabase(map, isGlobalRegistrationOpen()).catch(() => {});
    }
  } catch {}

  setTimeout(() => {
    loadStatusFromSupabase().catch(() => {});
  }, 500);
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

const AUTO_APPROVE_STORAGE_KEY = 'celestia_auto_approve_enabled';

/**
 * Returns whether Auto-Approve is enabled.
 */
export function isAutoApproveEnabled(): boolean {
  try {
    const val = localStorage.getItem(AUTO_APPROVE_STORAGE_KEY);
    return val === 'true';
  } catch {
    return false;
  }
}

/**
 * Sets Auto-Approve state.
 */
export function setAutoApproveEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(AUTO_APPROVE_STORAGE_KEY, String(enabled));
    window.dispatchEvent(new CustomEvent('celestia-auto-approve-changed'));
  } catch {}
}
