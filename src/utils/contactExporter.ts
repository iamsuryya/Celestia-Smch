/**
 * Contact Group (.VCF / vCard 3.0) and Phone Number Exporter
 * 
 * Generates standards-compliant RFC 2426 vCard 3.0 files importable directly
 * into mobile address books (Apple iOS Contacts, Google Contacts, Samsung, WhatsApp)
 * with event tags, team notes, and college affiliations.
 */

import { RegistrationSubmission } from '../types/registration';

export interface ContactItem {
  id: string;
  name: string;
  phone: string;
  formattedPhone: string;
  email?: string;
  role: 'Captain' | 'Individual' | 'Member';
  teamName?: string;
  collegeName: string;
  eventCode: string;
  eventTitle: string;
  registrationCode: string;
  isHostCollege: boolean;
  paymentStatus?: string;
}

export interface ContactFilterOptions {
  eventCode?: string; // 'ALL' or specific event code
  roleFilter?: 'CAPTAINS_SOLO' | 'ALL_PARTICIPANTS';
  institutionFilter?: 'ALL' | 'HOST_ONLY' | 'OTHER_ONLY';
  onlyVerified?: boolean;
}

/**
 * Clean phone numbers and prepend country code (+91)
 */
export function sanitizePhoneNumber(phoneStr?: string): { clean: string; formatted: string } {
  if (!phoneStr) return { clean: '', formatted: '' };
  const digitsOnly = phoneStr.replace(/\D/g, '');

  if (digitsOnly.length === 10) {
    return {
      clean: digitsOnly,
      formatted: `+91 ${digitsOnly.slice(0, 5)} ${digitsOnly.slice(5)}`,
    };
  }

  if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
    const tenDigits = digitsOnly.slice(2);
    return {
      clean: tenDigits,
      formatted: `+91 ${tenDigits.slice(0, 5)} ${tenDigits.slice(5)}`,
    };
  }

  // Fallback for irregular lengths
  return {
    clean: digitsOnly,
    formatted: phoneStr.trim(),
  };
}

/**
 * Extracts a normalized list of contact items from a collection of registrations
 */
export function extractContactsFromRegistrations(
  registrations: RegistrationSubmission[],
  options: ContactFilterOptions = {}
): ContactItem[] {
  const {
    eventCode = 'ALL',
    roleFilter = 'CAPTAINS_SOLO',
    institutionFilter = 'ALL',
    onlyVerified = false,
  } = options;

  const contactsMap = new Map<string, ContactItem>();

  registrations.forEach((reg) => {
    // Verified filter
    if (onlyVerified && reg.paymentStatus !== 'Verified' && reg.registrationStatus !== 'Confirmed') {
      return;
    }

    // Event filter
    if (eventCode !== 'ALL' && reg.eventCode?.toUpperCase() !== eventCode.toUpperCase()) {
      return;
    }

    // Institution filter
    const isHost = Boolean(reg.isHostCollege || reg.college?.isHostCollege);
    if (institutionFilter === 'HOST_ONLY' && !isHost) return;
    if (institutionFilter === 'OTHER_ONLY' && isHost) return;

    const collegeName = reg.college?.collegeName || 'Unknown College';
    const isTeamEvent = reg.eventType === 'Team' || (reg.participants && reg.participants.length > 1);

    if (roleFilter === 'CAPTAINS_SOLO') {
      // Primary captain / main registrant
      const captain = reg.participants?.[0];
      const rawPhone = captain?.mobile || reg.college?.contactMobile || '';
      const { clean, formatted } = sanitizePhoneNumber(rawPhone);

      if (clean && clean.length >= 8) {
        const captainName = (captain?.fullName || 'Participant').trim();
        const contactRole: ContactItem['role'] = isTeamEvent ? 'Captain' : 'Individual';

        const item: ContactItem = {
          id: `${reg.id}-captain`,
          name: captainName,
          phone: clean,
          formattedPhone: formatted,
          email: captain?.email || reg.college?.contactEmail || '',
          role: contactRole,
          teamName: reg.teamName,
          collegeName,
          eventCode: reg.eventCode || 'CELESTIA',
          eventTitle: reg.eventTitle || 'Celestia 2026',
          registrationCode: reg.registrationCode || reg.id,
          isHostCollege: isHost,
          paymentStatus: reg.paymentStatus || 'Submitted',
        };

        // Key by phone + event to prevent duplicate identical entries
        const dedupeKey = `${clean}-${item.eventCode}`;
        if (!contactsMap.has(dedupeKey)) {
          contactsMap.set(dedupeKey, item);
        }
      }
    } else {
      // All participants on the roster
      (reg.participants || []).forEach((member, idx) => {
        const rawPhone = member.mobile || (idx === 0 ? reg.college?.contactMobile : '') || '';
        const { clean, formatted } = sanitizePhoneNumber(rawPhone);

        if (clean && clean.length >= 8) {
          const memberName = (member.fullName || `Member ${idx + 1}`).trim();
          const role: ContactItem['role'] = idx === 0 && isTeamEvent ? 'Captain' : (isTeamEvent ? 'Member' : 'Individual');

          const item: ContactItem = {
            id: `${reg.id}-p${idx}`,
            name: memberName,
            phone: clean,
            formattedPhone: formatted,
            email: member.email || '',
            role,
            teamName: reg.teamName,
            collegeName,
            eventCode: reg.eventCode || 'CELESTIA',
            eventTitle: reg.eventTitle || 'Celestia 2026',
            registrationCode: reg.registrationCode || reg.id,
            isHostCollege: isHost,
            paymentStatus: reg.paymentStatus || 'Submitted',
          };

          const dedupeKey = `${clean}-${item.eventCode}-${idx}`;
          if (!contactsMap.has(dedupeKey)) {
            contactsMap.set(dedupeKey, item);
          }
        }
      });
    }
  });

  return Array.from(contactsMap.values());
}

/**
 * Generates an RFC 2426 vCard 3.0 string for the provided contact list
 */
export function generateVCardString(contacts: ContactItem[]): string {
  const cards = contacts.map((contact) => {
    const roleSuffix = contact.role === 'Captain' 
      ? `(Capt - ${contact.eventCode})` 
      : `(${contact.eventCode})`;
    
    const formattedName = `${contact.name} ${roleSuffix}`.trim();
    const phoneClean = contact.phone.length === 10 ? `+91${contact.phone}` : `+${contact.phone}`;

    // Split name into First and Last for vCard standard N: field
    const nameParts = contact.name.trim().split(/\s+/);
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
    const firstName = nameParts[0] || contact.name;

    const noteLines = [
      `Event: ${contact.eventTitle} (${contact.eventCode})`,
      contact.teamName ? `Team: ${contact.teamName}` : null,
      `Registration ID: ${contact.registrationCode}`,
      `College: ${contact.collegeName}`,
      contact.isHostCollege ? 'Institution: SMCH Host College' : 'Institution: Other College',
      contact.paymentStatus ? `Payment Status: ${contact.paymentStatus}` : null,
      `Role: ${contact.role}`,
    ].filter(Boolean).join('\\n');

    return [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${escapeVCardText(formattedName)}`,
      `N:${escapeVCardText(lastName)};${escapeVCardText(firstName)};;;`,
      `ORG:${escapeVCardText(contact.collegeName)};Celestia 2026`,
      `TITLE:${escapeVCardText(`${contact.role} - ${contact.eventTitle}`)}`,
      `TEL;TYPE=CELL,VOICE,PREF:${phoneClean}`,
      contact.email ? `EMAIL;TYPE=INTERNET,WORK:${escapeVCardText(contact.email)}` : null,
      `CATEGORIES:Celestia 2026,Celestia 2026 - ${contact.eventCode}`,
      `NOTE:${noteLines}`,
      'END:VCARD',
    ]
      .filter(Boolean)
      .join('\r\n');
  });

  return cards.join('\r\n') + '\r\n';
}

function escapeVCardText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/**
 * Initiates download of the generated .vcf file to the user's phone or computer
 */
export function downloadVCardFile(contacts: ContactItem[], filename?: string): boolean {
  if (contacts.length === 0) return false;

  const vCardContent = generateVCardString(contacts);
  const blob = new Blob([vCardContent], { type: 'text/vcard;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const defaultFilename = filename || `Celestia26_Captains_Group_${new Date().toISOString().slice(0, 10)}.vcf`;

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', defaultFilename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}

/**
 * Returns a clean, comma-separated list of 10-digit / international phone numbers
 * for pasting directly into WhatsApp broadcasts or SMS tools.
 */
export function getCommaSeparatedPhoneNumbers(contacts: ContactItem[], withCountryCode = true): string {
  const numbers = contacts
    .map((c) => (withCountryCode && c.phone.length === 10 ? `+91${c.phone}` : c.phone))
    .filter(Boolean);

  // Return unique numbers only
  return Array.from(new Set(numbers)).join(', ');
}
