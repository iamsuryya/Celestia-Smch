import { RegistrationSubmission } from '../types/registration';
import { EVENTS_DATA } from '../data/festivalData';
import { isExactSmchHost } from './collegeTagging';

export interface ExportVerifiedOptions {
  excludeSmch?: boolean;
}

/**
 * Exports all verified / approved registrations grouped event-by-event into a clean CSV format.
 * Includes:
 * 1. "Number of Participants" column per registration row.
 * 2. Event-level Total Participants summary row.
 * 3. Grand Total Participants & Revenue summary at the bottom.
 * 4. Option to filter out Srinivasan Medical College & Hospital (Host College) students.
 */
export function exportVerifiedByEventCSV(
  registrations: RegistrationSubmission[],
  showToast?: (msg: string) => void,
  options?: ExportVerifiedOptions
): void {
  const excludeSmch = Boolean(options?.excludeSmch);

  // Helper to check if a registration belongs to SMCH / Srinivasan Medical College (Host)
  const isSmchHostRegistration = (r: RegistrationSubmission): boolean => {
    const cName = r.college?.collegeName || '';
    return isExactSmchHost(cName);
  };

  // Filter ONLY verified / approved entries
  let verifiedList = registrations.filter((r) => {
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

  // Apply SMCH Exclusion Filter if requested
  if (excludeSmch) {
    verifiedList = verifiedList.filter((r) => !isSmchHostRegistration(r));
  }

  if (verifiedList.length === 0) {
    const msg = excludeSmch
      ? 'No non-SMCH verified registrations found to export.'
      : 'No verified registrations found to export.';
    if (showToast) {
      showToast(msg);
    } else {
      alert(msg);
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
  lines.push(`"Report Scope: ${excludeSmch ? 'NON-HOST COLLEGES ONLY (EXCLUDING SRINIVASAN MEDICAL COLLEGE)' : 'ALL VERIFIED PARTICIPANTS (ALL INSTITUTIONS)'}"`);
  lines.push(`"Generated Date: ${new Date().toLocaleString()}"`);
  lines.push(`"Total Verified Registration Submissions: ${verifiedList.length}"`);
  lines.push('');

  let eventNum = 1;
  let grandTotalParticipants = 0;
  let grandTotalFees = 0;

  eventGroupsMap.forEach((group) => {
    const eventParticipantSum = group.items.reduce(
      (sum, reg) => sum + (reg.participantCount || reg.participants?.length || 1),
      0
    );
    const eventFeeSum = group.items.reduce(
      (sum, reg) => sum + (Number(reg.totalAmount) || 0),
      0
    );

    grandTotalParticipants += eventParticipantSum;
    grandTotalFees += eventFeeSum;

    lines.push(`"===================================================================================================="`);
    lines.push(`"EVENT ${eventNum}: ${group.eventTitle.toUpperCase()} (${group.eventCode}) - ${group.items.length} REGISTRATIONS | ${eventParticipantSum} TOTAL PARTICIPANTS"`);
    lines.push(`"===================================================================================================="`);
    lines.push('"SL No","Primary Participant / Captain Name","College Name","No. of Participants","Team Members Roster","Mobile Number","Email Address","Team Name","Registration Code","Fee Amount (₹)","UTR Ref Number"');

    group.items.forEach((reg, index) => {
      const primaryName = reg.participants?.[0]?.fullName || reg.college?.contactPerson || 'N/A';
      const collegeName = reg.college?.collegeName || 'N/A';
      const pCount = reg.participantCount || reg.participants?.length || 1;

      const mobile = reg.participants?.[0]?.mobile || reg.college?.contactMobile || 'N/A';
      const email = reg.participants?.[0]?.email || reg.college?.contactEmail || 'N/A';
      const teamName = reg.teamName || (reg.participants && reg.participants.length > 1 ? `${primaryName}'s Team` : 'Solo Entry');

      // Team Members roster string
      let teamMembersStr = '';
      if (reg.participants && reg.participants.length > 0) {
        teamMembersStr = reg.participants
          .filter((p, pIdx) => pIdx === 0 || Boolean(p.fullName && p.fullName.trim()))
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
        pCount.toString(),
        clean(teamMembersStr),
        clean(mobile),
        clean(email),
        clean(teamName),
        clean(reg.registrationCode || reg.id),
        clean(reg.totalAmount || 0),
        clean(reg.utrNumber || 'N/A'),
      ].join(','));
    });

    // Event Total Summary Row
    lines.push([
      '""',
      `"TOTAL FOR ${group.eventCode}"`,
      '""',
      `"${eventParticipantSum} Participants"`,
      '""',
      '""',
      '""',
      '""',
      '""',
      `"₹${eventFeeSum.toLocaleString('en-IN')}"`,
      '""'
    ].join(','));

    lines.push(''); // Blank row between events
    eventNum++;
  });

  // Grand Summary at Bottom of Document
  lines.push(`"===================================================================================================="`);
  lines.push(`"SUMMARY TOTALS ACROSS ALL ${eventGroupsMap.size} EVENTS"`);
  lines.push(`"GRAND TOTAL PARTICIPANTS: ${grandTotalParticipants} PARTICIPATING MEMBERS"`);
  lines.push(`"GRAND TOTAL REVENUE CLEARED: ₹${grandTotalFees.toLocaleString('en-IN')}"`);
  lines.push(`"===================================================================================================="`);

  const csvContent = '\uFEFF' + lines.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const fileNameScope = excludeSmch ? 'Non_SMCH_Colleges' : 'All_Colleges';
  link.download = `Celestia26_Verified_Registrations_By_Event_${fileNameScope}_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  if (showToast) {
    showToast(
      `Exported verified CSV! Total Participants: ${grandTotalParticipants} across ${eventGroupsMap.size} events (${excludeSmch ? 'Non-SMCH Only' : 'All Colleges'}).`
    );
  }
}
