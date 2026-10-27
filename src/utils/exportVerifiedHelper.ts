import { RegistrationSubmission } from '../types/registration';
import { EVENTS_DATA } from '../data/festivalData';

/**
 * Exports all verified / approved registrations grouped event-by-event into a clean CSV format.
 * Format generated:
 * 
 * EVENT 1: <Event Title> (<Event Code>)
 * SL No | Primary Participant / Captain Name | College Name | Team Members | Mobile Number | Email | Team Name | Reg Code | Fee Amount | UTR Ref
 * 
 * EVENT 2: <Event Title> ...
 */
export function exportVerifiedByEventCSV(
  registrations: RegistrationSubmission[],
  showToast?: (msg: string) => void
): void {
  // Filter ONLY verified / approved entries
  const verifiedList = registrations.filter((r) => {
    const pStatus = (r.paymentStatus || '').toLowerCase();
    const rStatus = (r.registrationStatus || '').toLowerCase();
    return (
      r.paymentConfirmed ||
      pStatus === 'verified' ||
      pStatus === 'approved' ||
      rStatus === 'confirmed' ||
      rStatus === 'verified'
    );
  });

  if (verifiedList.length === 0) {
    if (showToast) {
      showToast('No verified registrations found to export.');
    } else {
      alert('No verified registrations found to export.');
    }
    return;
  }

  // Group verified registrations by Event
  const eventGroupsMap = new Map<string, { eventTitle: string; eventCode: string; items: RegistrationSubmission[] }>();

  // Map known events from catalog first to keep catalog order
  EVENTS_DATA.forEach((ev) => {
    const matched = verifiedList.filter(
      (r) =>
        r.eventCode?.toLowerCase() === ev.code.toLowerCase() ||
        r.eventId?.toLowerCase() === ev.id.toLowerCase() ||
        r.eventTitle?.toLowerCase() === ev.title.toLowerCase()
    );
    if (matched.length > 0) {
      eventGroupsMap.set(ev.code, {
        eventTitle: ev.title,
        eventCode: ev.code,
        items: matched,
      });
    }
  });

  // Include any other custom/unmapped events
  verifiedList.forEach((r) => {
    const code = r.eventCode || 'OTHER';
    if (!eventGroupsMap.has(code)) {
      eventGroupsMap.set(code, {
        eventTitle: r.eventTitle || code,
        eventCode: code,
        items: [r],
      });
    } else {
      const existing = eventGroupsMap.get(code)!;
      if (!existing.items.some((item) => item.id === r.id)) {
        existing.items.push(r);
      }
    }
  });

  const lines: string[] = [];

  // Document Title Banner
  lines.push('"CELESTIA \'26 - VERIFIED REGISTRATIONS REPORT (EVENT-WISE)"');
  lines.push(`"Generated Date: ${new Date().toLocaleString()}"`);
  lines.push(`"Total Verified Entries: ${verifiedList.length}"`);
  lines.push('');

  let eventNum = 1;
  eventGroupsMap.forEach((group) => {
    lines.push(`"===================================================================================================="`);
    lines.push(`"EVENT ${eventNum}: ${group.eventTitle.toUpperCase()} (${group.eventCode}) - ${group.items.length} VERIFIED REGISTRATION${group.items.length > 1 ? 'S' : ''}"`);
    lines.push(`"===================================================================================================="`);
    lines.push('"SL No","Primary Participant / Captain Name","College Name","Team Members Roster","Mobile Number","Email Address","Team Name","Registration Code","Fee Amount (₹)","UTR Ref Number"');

    group.items.forEach((reg, index) => {
      const primaryName = reg.participants?.[0]?.fullName || reg.college?.contactPerson || 'N/A';
      const collegeName = reg.college?.collegeName || 'N/A';

      const mobile = reg.participants?.[0]?.mobile || reg.college?.contactMobile || 'N/A';
      const email = reg.participants?.[0]?.email || reg.college?.contactEmail || 'N/A';
      const teamName = reg.teamName || (reg.participants && reg.participants.length > 1 ? `${primaryName}'s Team` : 'Solo Entry');

      // Team Members roster string
      let teamMembersStr = '';
      if (reg.participants && reg.participants.length > 0) {
        teamMembersStr = reg.participants
          .map((p, pIdx) => `${pIdx + 1}. ${p.fullName}${p.role ? ` (${p.role})` : ''}`)
          .join('; ');
      } else {
        teamMembersStr = primaryName;
      }

      const clean = (val: unknown) => `"${String(val ?? '').replace(/"/g, '""')}"`;

      lines.push([
        (index + 1).toString(),
        clean(primaryName),
        clean(collegeName),
        clean(teamMembersStr),
        clean(mobile),
        clean(email),
        clean(teamName),
        clean(reg.registrationCode || reg.id),
        clean(reg.totalAmount || 0),
        clean(reg.utrNumber || 'N/A'),
      ].join(','));
    });

    lines.push(''); // Blank row between events
    eventNum++;
  });

  const csvContent = '\uFEFF' + lines.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Celestia26_Verified_Registrations_By_Event_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  if (showToast) {
    showToast(`Downloaded verified registrations for ${verifiedList.length} participants across ${eventGroupsMap.size} events!`);
  }
}
