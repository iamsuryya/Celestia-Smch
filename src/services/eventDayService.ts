import { supabase } from '../lib/supabase';
import { 
  RegistrationSubmission, 
  ParticipantMember, 
  AuditLogEntry, 
  CheckInStatus,
  RegistrationSource 
} from '../types/registration';
import { EVENTS_DATA } from '../data/festivalData';
import { supabaseRegistrationService } from './supabaseRegistrationService';

/**
 * Event Day Operational Service
 * Handles volunteer check-ins, adding team members, ID card issuance, 
 * on-spot registration creation, and audit logging.
 */
class EventDayService {
  /**
   * Helper to format current local ISO timestamp
   */
  private getTimestamp(): string {
    return new Date().toISOString();
  }

  /**
   * Records an audit log entry to Supabase and LocalStorage
   */
  async logAuditEvent(
    action: string,
    volunteerRole: string,
    volunteerName: string,
    opts: {
      registrationId?: string;
      registrationCode?: string;
      participantId?: string;
      participantName?: string;
      details?: Record<string, any>;
    }
  ): Promise<void> {
    const entry: AuditLogEntry = {
      id: `LOG-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      action,
      registrationId: opts.registrationId,
      registrationCode: opts.registrationCode,
      participantId: opts.participantId,
      participantName: opts.participantName,
      volunteerRole,
      volunteerName,
      details: opts.details || {},
      createdAt: this.getTimestamp(),
    };

    // 1. Save to LocalStorage audit log cache
    try {
      const existingRaw = localStorage.getItem('celestia_audit_logs');
      const logs: AuditLogEntry[] = existingRaw ? JSON.parse(existingRaw) : [];
      logs.unshift(entry);
      localStorage.setItem('celestia_audit_logs', JSON.stringify(logs.slice(0, 500)));
    } catch (e) {
      console.warn('LocalStorage audit log notice:', e);
    }

    // 2. Persist to Supabase if connected
    if (supabase) {
      try {
        await supabase.from('celestia_audit_logs').insert([{
          action,
          registration_id: opts.registrationId,
          registration_code: opts.registrationCode,
          participant_id: opts.participantId,
          participant_name: opts.participantName,
          volunteer_role: volunteerRole,
          volunteer_name: volunteerName,
          details: opts.details || {},
          created_at: entry.createdAt,
        }]);
      } catch (err) {
        console.warn('Supabase audit log insert notice:', err);
      }
    }
  }

  /**
   * Fetches audit log entries for Central Admin review
   */
  async fetchAuditLogs(): Promise<AuditLogEntry[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('celestia_audit_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(200);

        if (!error && data) {
          return data.map((row) => ({
            id: row.id,
            action: row.action,
            registrationId: row.registration_id,
            registrationCode: row.registration_code,
            participantId: row.participant_id,
            participantName: row.participant_name,
            volunteerRole: row.volunteer_role,
            volunteerName: row.volunteer_name,
            details: row.details || {},
            createdAt: row.created_at,
          }));
        }
      } catch (err) {
        console.warn('Error fetching Supabase audit logs, falling back to local storage:', err);
      }
    }

    // Fallback: Read local audit logs
    try {
      const existingRaw = localStorage.getItem('celestia_audit_logs');
      return existingRaw ? JSON.parse(existingRaw) : [];
    } catch {
      return [];
    }
  }

  /**
   * Computes the overall check-in status of a registration based on participant attendance
   */
  computeTeamCheckInStatus(participants: ParticipantMember[]): CheckInStatus {
    if (!participants || participants.length === 0) return 'NOT_CHECKED_IN';
    const presentCount = participants.filter((p) => p.attendanceStatus === 'PRESENT').length;
    if (presentCount === 0) return 'NOT_CHECKED_IN';
    if (presentCount === participants.length) return 'CHECKED_IN';
    return 'PARTIAL';
  }

  /**
   * Adds an arriving team member to an EXISTING registration
   */
  async addTeamMemberToRegistration(
    reg: RegistrationSubmission,
    newMember: ParticipantMember,
    volunteerName: string
  ): Promise<{ success: boolean; message: string; updatedRegistration?: RegistrationSubmission }> {
    // 1. Check max event size
    const matchedEvent = EVENTS_DATA.find((e) => e.id.toLowerCase() === reg.eventId.toLowerCase() || e.code.toLowerCase() === reg.eventCode.toLowerCase());
    const maxTeamSize = matchedEvent?.maxParticipants || 25;

    const currentCount = reg.participants?.length || 0;
    if (currentCount >= maxTeamSize) {
      return {
        success: false,
        message: `Cannot add member: Maximum team size of ${maxTeamSize} reached for ${reg.eventTitle} (${reg.eventCode}).`,
      };
    }

    // 2. Duplicate participant check (by mobile or full name within team)
    const exists = (reg.participants || []).some(
      (p) => 
        (newMember.mobile && p.mobile && p.mobile.trim() === newMember.mobile.trim()) ||
        (p.fullName.trim().toLowerCase() === newMember.fullName.trim().toLowerCase())
    );

    if (exists) {
      return {
        success: false,
        message: `Participant "${newMember.fullName}" (Mobile: ${newMember.mobile}) is already in this team roster.`,
      };
    }

    const memberWithMeta: ParticipantMember = {
      ...newMember,
      participantId: `P-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      attendanceStatus: 'PRESENT', // Added at venue desk -> auto mark present
      checkedInAt: this.getTimestamp(),
      checkedInBy: volunteerName,
      idCardStatus: 'NOT_ISSUED',
    };

    const updatedParticipants = [...(reg.participants || []), memberWithMeta];
    const newParticipantCount = updatedParticipants.length;
    const newCheckInStatus = this.computeTeamCheckInStatus(updatedParticipants);

    const updatedReg: RegistrationSubmission = {
      ...reg,
      participantCount: newParticipantCount,
      participants: updatedParticipants,
      checkInStatus: newCheckInStatus,
      checkedInAt: reg.checkedInAt || this.getTimestamp(),
      checkedInBy: reg.checkedInBy || volunteerName,
    };

    // 3. Save to Supabase
    if (supabase && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(reg.id)) {
      try {
        await supabase
          .from('registrations')
          .update({
            participant_count: newParticipantCount,
            check_in_status: newCheckInStatus,
            checked_in_at: updatedReg.checkedInAt,
            checked_in_by: updatedReg.checkedInBy,
          })
          .eq('id', reg.id);

        // Insert new participant row
        await supabase.from('participants').insert([{
          registration_id: reg.id,
          full_name: memberWithMeta.fullName,
          gender: memberWithMeta.gender,
          age: Number(memberWithMeta.age) || 20,
          mobile: memberWithMeta.mobile,
          email: memberWithMeta.email,
          role: memberWithMeta.role || 'Team Member',
          attendance_status: 'PRESENT',
          checked_in_at: memberWithMeta.checkedInAt,
          checked_in_by: volunteerName,
          id_card_status: 'NOT_ISSUED',
        }]);
      } catch (err) {
        console.warn('Error saving added team member to Supabase:', err);
      }
    }

    // 4. Update LocalStorage cache & sync helpers
    this.updateLocalCache(updatedReg);

    // 5. Audit Log
    await this.logAuditEvent(
      'ADD_TEAM_MEMBER',
      'REGISTRATION_DESK',
      volunteerName,
      {
        registrationId: reg.id,
        registrationCode: reg.registrationCode,
        participantName: memberWithMeta.fullName,
        details: {
          addedMember: memberWithMeta.fullName,
          mobile: memberWithMeta.mobile,
          eventCode: reg.eventCode,
          newTotalCount: newParticipantCount,
        },
      }
    );

    return {
      success: true,
      message: `Successfully added "${memberWithMeta.fullName}" to ${reg.teamName || 'team'}. Roster now has ${newParticipantCount} members.`,
      updatedRegistration: updatedReg,
    };
  }

  /**
   * Edits an EXISTING team member's details (fullName, mobile, gender, role)
   */
  async editTeamMemberInRegistration(
    reg: RegistrationSubmission,
    participantIndex: number,
    updatedData: Partial<ParticipantMember>,
    volunteerName: string
  ): Promise<{ success: boolean; message: string; updatedRegistration?: RegistrationSubmission }> {
    const updatedParticipants = [...(reg.participants || [])];
    if (!updatedParticipants[participantIndex]) {
      return { success: false, message: 'Participant not found in roster.' };
    }

    const oldMember = updatedParticipants[participantIndex];
    const newMember: ParticipantMember = {
      ...oldMember,
      ...updatedData,
    };

    updatedParticipants[participantIndex] = newMember;

    const updatedReg: RegistrationSubmission = {
      ...reg,
      participants: updatedParticipants,
    };

    // Update Supabase
    if (supabase && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(reg.id)) {
      try {
        await supabase
          .from('participants')
          .update({
            full_name: newMember.fullName,
            mobile: newMember.mobile,
            gender: newMember.gender,
            role: newMember.role,
          })
          .eq('registration_id', reg.id)
          .eq('full_name', oldMember.fullName);
      } catch (err) {
        console.warn('Error updating team member in Supabase:', err);
      }
    }

    this.updateLocalCache(updatedReg);

    await this.logAuditEvent(
      'EDIT_TEAM_MEMBER',
      'REGISTRATION_DESK',
      volunteerName,
      {
        registrationId: reg.id,
        registrationCode: reg.registrationCode,
        participantName: newMember.fullName,
        details: {
          oldName: oldMember.fullName,
          newName: newMember.fullName,
          oldMobile: oldMember.mobile,
          newMobile: newMember.mobile,
        },
      }
    );

    return {
      success: true,
      message: `Updated participant details for "${newMember.fullName}".`,
      updatedRegistration: updatedReg,
    };
  }

  /**
   * Deletes a team member from an existing registration roster
   */
  async deleteTeamMemberFromRegistration(
    reg: RegistrationSubmission,
    participantIndex: number,
    volunteerName: string
  ): Promise<{ success: boolean; message: string; updatedRegistration?: RegistrationSubmission }> {
    const currentParticipants = reg.participants || [];
    if (!currentParticipants[participantIndex]) {
      return { success: false, message: 'Participant not found in roster.' };
    }

    if (currentParticipants.length <= 1) {
      return {
        success: false,
        message: 'Cannot delete the only member in a registration roster.',
      };
    }

    const deletedMember = currentParticipants[participantIndex];
    const updatedParticipants = currentParticipants.filter((_, idx) => idx !== participantIndex);
    const newParticipantCount = updatedParticipants.length;
    const newCheckInStatus = this.computeTeamCheckInStatus(updatedParticipants);

    const updatedReg: RegistrationSubmission = {
      ...reg,
      participantCount: newParticipantCount,
      participants: updatedParticipants,
      checkInStatus: newCheckInStatus,
    };

    if (supabase && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(reg.id)) {
      try {
        await supabase
          .from('registrations')
          .update({
            participant_count: newParticipantCount,
            check_in_status: newCheckInStatus,
          })
          .eq('id', reg.id);

        await supabase
          .from('participants')
          .delete()
          .eq('registration_id', reg.id)
          .eq('full_name', deletedMember.fullName);
      } catch (err) {
        console.warn('Error deleting member from Supabase:', err);
      }
    }

    this.updateLocalCache(updatedReg);

    await this.logAuditEvent(
      'DELETE_TEAM_MEMBER',
      'REGISTRATION_DESK',
      volunteerName,
      {
        registrationId: reg.id,
        registrationCode: reg.registrationCode,
        participantName: deletedMember.fullName,
        details: {
          removedMember: deletedMember.fullName,
        },
      }
    );

    return {
      success: true,
      message: `Removed member "${deletedMember.fullName}" from team roster.`,
      updatedRegistration: updatedReg,
    };
  }

  /**
   * Toggles individual participant attendance status (PRESENT / NOT_ARRIVED)
   */
  async updateParticipantAttendance(
    reg: RegistrationSubmission,
    participantIndex: number,
    newStatus: 'NOT_ARRIVED' | 'PRESENT',
    volunteerName: string
  ): Promise<RegistrationSubmission> {
    const updatedParticipants = [...(reg.participants || [])];
    if (!updatedParticipants[participantIndex]) return reg;

    const p = updatedParticipants[participantIndex];
    updatedParticipants[participantIndex] = {
      ...p,
      attendanceStatus: newStatus,
      checkedInAt: newStatus === 'PRESENT' ? this.getTimestamp() : undefined,
      checkedInBy: newStatus === 'PRESENT' ? volunteerName : undefined,
    };

    const newCheckInStatus = this.computeTeamCheckInStatus(updatedParticipants);
    const updatedReg: RegistrationSubmission = {
      ...reg,
      participants: updatedParticipants,
      checkInStatus: newCheckInStatus,
      checkedInAt: newCheckInStatus !== 'NOT_CHECKED_IN' ? (reg.checkedInAt || this.getTimestamp()) : undefined,
      checkedInBy: newCheckInStatus !== 'NOT_CHECKED_IN' ? (reg.checkedInBy || volunteerName) : undefined,
    };

    // Update Supabase
    if (supabase && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(reg.id)) {
      try {
        await supabase
          .from('registrations')
          .update({
            check_in_status: newCheckInStatus,
            checked_in_at: updatedReg.checkedInAt || null,
            checked_in_by: updatedReg.checkedInBy || null,
          })
          .eq('id', reg.id);

        // Update matching participant row by name/mobile or index
        await supabase
          .from('participants')
          .update({
            attendance_status: newStatus,
            checked_in_at: newStatus === 'PRESENT' ? this.getTimestamp() : null,
            checked_in_by: newStatus === 'PRESENT' ? volunteerName : null,
          })
          .eq('registration_id', reg.id)
          .eq('full_name', p.fullName);
      } catch (err) {
        console.warn('Error updating attendance in Supabase:', err);
      }
    }

    this.updateLocalCache(updatedReg);

    await this.logAuditEvent(
      newStatus === 'PRESENT' ? 'MARK_PRESENT' : 'MARK_ABSENT',
      'REGISTRATION_DESK',
      volunteerName,
      {
        registrationId: reg.id,
        registrationCode: reg.registrationCode,
        participantName: p.fullName,
        details: {
          participantName: p.fullName,
          status: newStatus,
          teamName: reg.teamName,
        },
      }
    );

    return updatedReg;
  }

  /**
   * 1-Tap Action: Mark all members present and issue badges for arriving group
   */
  async markAllMembersPresentAndIssued(
    reg: RegistrationSubmission,
    volunteerName: string
  ): Promise<RegistrationSubmission> {
    const timestamp = this.getTimestamp();
    let badgeSeq = 1;

    const updatedParticipants = (reg.participants || []).map((p, idx) => {
      const badgeNo = p.idCardNumber || `C26-${reg.eventCode}-${String(idx + 1).padStart(2, '0')}`;
      return {
        ...p,
        attendanceStatus: 'PRESENT' as const,
        checkedInAt: p.checkedInAt || timestamp,
        checkedInBy: p.checkedInBy || volunteerName,
        idCardStatus: 'ISSUED' as const,
        idCardNumber: badgeNo,
        idCardIssuedAt: p.idCardIssuedAt || timestamp,
        idCardIssuedBy: p.idCardIssuedBy || volunteerName,
      };
    });

    const updatedReg: RegistrationSubmission = {
      ...reg,
      participants: updatedParticipants,
      checkInStatus: 'CHECKED_IN',
      checkedInAt: reg.checkedInAt || timestamp,
      checkedInBy: reg.checkedInBy || volunteerName,
    };

    if (supabase && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(reg.id)) {
      try {
        await supabase
          .from('registrations')
          .update({
            check_in_status: 'CHECKED_IN',
            checked_in_at: timestamp,
            checked_in_by: volunteerName,
          })
          .eq('id', reg.id);

        for (const p of updatedParticipants) {
          await supabase
            .from('participants')
            .update({
              attendance_status: 'PRESENT',
              checked_in_at: timestamp,
              checked_in_by: volunteerName,
              id_card_status: 'ISSUED',
              id_card_number: p.idCardNumber,
              id_card_issued_at: timestamp,
              id_card_issued_by: volunteerName,
            })
            .eq('registration_id', reg.id)
            .eq('full_name', p.fullName);
        }
      } catch (err) {
        console.warn('Error bulk updating attendance in Supabase:', err);
      }
    }

    this.updateLocalCache(updatedReg);

    await this.logAuditEvent(
      'BULK_CHECK_IN_ALL',
      'REGISTRATION_DESK',
      volunteerName,
      {
        registrationId: reg.id,
        registrationCode: reg.registrationCode,
        details: {
          teamName: reg.teamName,
          totalMembersCheckedIn: updatedParticipants.length,
        },
      }
    );

    return updatedReg;
  }

  /**
   * Updates physical ID Card issuance status for a participant
   */
  async updateParticipantIdCard(
    reg: RegistrationSubmission,
    participantIndex: number,
    newStatus: 'NOT_ISSUED' | 'ISSUED',
    customBadgeNo?: string,
    volunteerName: string = 'Volunteer'
  ): Promise<RegistrationSubmission> {
    const updatedParticipants = [...(reg.participants || [])];
    if (!updatedParticipants[participantIndex]) return reg;

    const p = updatedParticipants[participantIndex];
    const generatedBadge = customBadgeNo?.trim() || p.idCardNumber || `C26-${reg.eventCode}-${String(participantIndex + 1).padStart(2, '0')}`;

    updatedParticipants[participantIndex] = {
      ...p,
      idCardStatus: newStatus,
      idCardNumber: newStatus === 'ISSUED' ? generatedBadge : undefined,
      idCardIssuedAt: newStatus === 'ISSUED' ? this.getTimestamp() : undefined,
      idCardIssuedBy: newStatus === 'ISSUED' ? volunteerName : undefined,
    };

    const updatedReg: RegistrationSubmission = {
      ...reg,
      participants: updatedParticipants,
    };

    if (supabase && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(reg.id)) {
      try {
        await supabase
          .from('participants')
          .update({
            id_card_status: newStatus,
            id_card_number: newStatus === 'ISSUED' ? generatedBadge : null,
            id_card_issued_at: newStatus === 'ISSUED' ? this.getTimestamp() : null,
            id_card_issued_by: newStatus === 'ISSUED' ? volunteerName : null,
          })
          .eq('registration_id', reg.id)
          .eq('full_name', p.fullName);
      } catch (err) {
        console.warn('Error updating ID card status in Supabase:', err);
      }
    }

    this.updateLocalCache(updatedReg);

    await this.logAuditEvent(
      newStatus === 'ISSUED' ? 'ISSUE_ID_CARD' : 'REVOKE_ID_CARD',
      'REGISTRATION_DESK',
      volunteerName,
      {
        registrationId: reg.id,
        registrationCode: reg.registrationCode,
        participantName: p.fullName,
        details: {
          badgeNumber: generatedBadge,
          status: newStatus,
        },
      }
    );

    return updatedReg;
  }

  /**
   * Checks whether a phone number or team name is already registered for an event (duplicate prevention)
   */
  async checkDuplicateOnSpot(
    mobile: string,
    eventId: string,
    teamName?: string
  ): Promise<{ isDuplicate: boolean; existingRegistration?: RegistrationSubmission; reason?: string }> {
    const cleanMobile = mobile.trim();
    const cleanTeam = (teamName || '').trim().toLowerCase();

    try {
      const allCloud = await supabaseRegistrationService.fetchAdminRegistrations();
      const existing = (allCloud || []).find((r) => {
        const matchesEvent = r.eventId?.toLowerCase() === eventId.toLowerCase() || r.eventCode?.toLowerCase() === eventId.toLowerCase();
        if (!matchesEvent) return false;

        const matchesPhone = r.college?.contactMobile === cleanMobile || (r.participants || []).some((p) => p.mobile === cleanMobile);
        const matchesTeam = cleanTeam && r.teamName && r.teamName.trim().toLowerCase() === cleanTeam;

        return matchesPhone || matchesTeam;
      });

      if (existing) {
        return {
          isDuplicate: true,
          existingRegistration: existing,
          reason: `Found existing registration "${existing.registrationCode || existing.id}" for ${existing.eventTitle} (${existing.eventCode}).`,
        };
      }
    } catch (e) {
      console.warn('Error checking duplicates:', e);
    }

    return { isDuplicate: false };
  }

  /**
   * Creates a NEW On-Spot Venue Registration
   */
  async createOnSpotRegistration(
    params: {
      eventId: string;
      collegeName: string;
      captainName: string;
      captainMobile: string;
      captainEmail?: string;
      teamName?: string;
      participants: ParticipantMember[];
      totalAmount: number;
      paidAmount: number;
      pendingAmount: number;
      utrNumber: string;
      paymentNotes?: string;
      volunteerName: string;
    }
  ): Promise<{ success: boolean; message: string; registration?: RegistrationSubmission }> {
    const matchedEvent = EVENTS_DATA.find(
      (e) => e.id.toLowerCase() === params.eventId.toLowerCase() || e.code.toLowerCase() === params.eventId.toLowerCase()
    );

    if (!matchedEvent) {
      return { success: false, message: `Invalid event ID: ${params.eventId}` };
    }

    // 1. Validate team size
    const participantCount = params.participants.length || 1;
    const minSize = matchedEvent.minParticipants || 1;
    const maxSize = matchedEvent.maxParticipants || 25;

    if (matchedEvent.type === 'Team' && participantCount < minSize) {
      return {
        success: false,
        message: `${matchedEvent.title} requires a minimum of ${minSize} team members.`,
      };
    }
    if (participantCount > maxSize) {
      return {
        success: false,
        message: `${matchedEvent.title} allows a maximum of ${maxSize} team members.`,
      };
    }

    // 2. Generate unique Registration Code: e.g., C26-SPOT-101
    const timestampCode = Date.now().toString().slice(-4);
    const regCode = `C26-SPOT-${matchedEvent.code}-${timestampCode}`;
    const id = regCode;

    const formattedParticipants: ParticipantMember[] = params.participants.map((p, idx) => ({
      ...p,
      participantId: `P-${Date.now()}-${idx}`,
      attendanceStatus: 'PRESENT' as const, // On-Spot participants are checked in immediately
      checkedInAt: this.getTimestamp(),
      checkedInBy: params.volunteerName,
      idCardStatus: 'ISSUED' as const,
      idCardNumber: `C26-${matchedEvent.code}-${String(idx + 1).padStart(2, '0')}`,
      idCardIssuedAt: this.getTimestamp(),
      idCardIssuedBy: params.volunteerName,
    }));

    const newReg: RegistrationSubmission = {
      id,
      registrationCode: regCode,
      userId: `ONSPOT-${Date.now()}`,
      eventId: matchedEvent.id,
      eventCode: matchedEvent.code,
      eventTitle: matchedEvent.title,
      eventCategory: matchedEvent.categoryDisplay,
      eventType: matchedEvent.type,
      venue: matchedEvent.venue,
      dateStr: matchedEvent.duration || 'Day 1',
      duration: matchedEvent.duration || 'Standard',
      college: {
        collegeName: params.collegeName,
        city: 'Tamil Nadu',
        state: 'India',
        contactPerson: params.captainName,
        contactMobile: params.captainMobile,
        contactEmail: params.captainEmail || `${params.captainMobile}@celestia.edu`,
        isCollegeDelegation: false,
        isHostCollege: params.collegeName.toLowerCase().includes('srinivasan'),
      },
      teamName: matchedEvent.type !== 'Solo' ? (params.teamName || `${params.captainName}'s Team`) : undefined,
      participantCount,
      participants: formattedParticipants,
      feePerUnit: matchedEvent.feeAmount,
      feeType: matchedEvent.feeType,
      totalAmount: params.totalAmount,
      paidAmount: params.paidAmount,
      pendingAmount: params.pendingAmount,
      paymentNotes: params.paymentNotes || `On-Spot Desk Entry by ${params.volunteerName}`,
      utrNumber: params.utrNumber.trim(),
      paymentConfirmed: true,
      paymentStatus: params.pendingAmount === 0 ? 'Paid in Full' : 'Advance Paid',
      registrationStatus: 'Confirmed',
      registrationSource: 'ON_SPOT',
      checkInStatus: 'CHECKED_IN',
      checkedInAt: this.getTimestamp(),
      checkedInBy: params.volunteerName,
      createdAt: this.getTimestamp(),
    };

    // 3. Save to Supabase
    if (supabase) {
      try {
        const { data: regRow, error: regErr } = await supabase
          .from('registrations')
          .insert([{
            registration_code: regCode,
            event_code: matchedEvent.code,
            event_type: matchedEvent.type,
            team_name: newReg.teamName || null,
            college_name: params.collegeName,
            college_city: 'Tamil Nadu',
            college_state: 'India',
            college_contact_person: params.captainName,
            college_contact_mobile: params.captainMobile,
            college_contact_email: params.captainEmail || null,
            participant_count: participantCount,
            fee_per_unit: matchedEvent.feeAmount,
            fee_type: matchedEvent.feeType,
            total_fee: params.totalAmount,
            paid_amount: params.paidAmount,
            pending_amount: params.pendingAmount,
            payment_status: newReg.paymentStatus,
            registration_status: 'Confirmed',
            registration_source: 'ON_SPOT',
            check_in_status: 'CHECKED_IN',
            admin_notes: `On-Spot Entry by ${params.volunteerName}. UTR: ${params.utrNumber}`,
            verified_at: this.getTimestamp(),
            rules_accepted: true,
            rules_version: 'v1.0-onspot',
            rules_accepted_at: this.getTimestamp(),
            created_at: this.getTimestamp(),
          }])
          .select()
          .single();

        const dbRegId = regRow?.id || id;

        // Insert Participants
        const participantPayload = formattedParticipants.map((p) => ({
          registration_id: dbRegId,
          full_name: p.fullName,
          gender: p.gender || 'Male',
          age: Number(p.age) || 20,
          mobile: p.mobile,
          email: p.email || null,
          role: p.role || 'Member',
          attendance_status: 'PRESENT',
          checked_in_at: p.checkedInAt,
          checked_in_by: params.volunteerName,
          id_card_status: 'ISSUED',
          id_card_number: p.idCardNumber,
          id_card_issued_at: p.idCardIssuedAt,
          id_card_issued_by: params.volunteerName,
        }));

        await supabase.from('participants').insert(participantPayload);

        // Insert Payment Submission
        await supabase.from('payment_submissions').insert([{
          registration_id: dbRegId,
          utr_number: params.utrNumber,
          amount_paid: params.paidAmount,
          payment_status: 'Verified',
          verified_at: this.getTimestamp(),
        }]);

        if (regRow?.id) {
          newReg.id = regRow.id;
        }
      } catch (err) {
        console.warn('Error persisting on-spot registration to Supabase:', err);
      }
    }

    // 4. Cache in LocalStorage so all views immediately update
    this.updateLocalCache(newReg);

    // 5. Log Audit Event
    await this.logAuditEvent(
      'CREATE_ON_SPOT_REGISTRATION',
      'ON_SPOT_REGISTRATION',
      params.volunteerName,
      {
        registrationId: newReg.id,
        registrationCode: newReg.registrationCode,
        participantName: params.captainName,
        details: {
          eventCode: matchedEvent.code,
          eventTitle: matchedEvent.title,
          teamName: newReg.teamName,
          totalAmount: params.totalAmount,
          paidAmount: params.paidAmount,
          utrNumber: params.utrNumber,
        },
      }
    );

    return {
      success: true,
      message: `On-Spot Registration ${regCode} successfully created for ${matchedEvent.title}!`,
      registration: newReg,
    };
  }

  /**
   * Helper to keep LocalStorage synced across all tabs and components
   */
  private updateLocalCache(updatedReg: RegistrationSubmission) {
    try {
      const saved = localStorage.getItem('celestia26_registrations');
      let list: RegistrationSubmission[] = saved ? JSON.parse(saved) : [];

      const idx = list.findIndex(
        (r) => r.id === updatedReg.id || r.registrationCode === updatedReg.registrationCode
      );

      if (idx >= 0) {
        list[idx] = updatedReg;
      } else {
        list.unshift(updatedReg);
      }

      localStorage.setItem('celestia26_registrations', JSON.stringify(list));
    } catch (e) {
      console.warn('LocalStorage update cache error:', e);
    }
  }

  /**
   * Computes venue attendance metrics for volunteer dashboards
   */
  async fetchEventDayVenueMetrics(): Promise<{
    totalRegisteredParticipants: number;
    totalPresentParticipants: number;
    totalAbsentParticipants: number;
    idCardsIssued: number;
    idCardsPending: number;
    onSpotRegistrationsCount: number;
  }> {
    let allRegs: RegistrationSubmission[] = [];
    try {
      allRegs = (await supabaseRegistrationService.fetchAdminRegistrations()) || [];
    } catch {
      const saved = localStorage.getItem('celestia26_registrations');
      allRegs = saved ? JSON.parse(saved) : [];
    }

    let totalReg = 0;
    let totalPresent = 0;
    let cardsIssued = 0;
    let onSpotCount = 0;

    allRegs.forEach((r) => {
      if (r.registrationSource === 'ON_SPOT' || (r.registrationCode && r.registrationCode.includes('SPOT'))) {
        onSpotCount++;
      }
      const roster = r.participants || [];
      const pCount = Math.max(roster.length, r.participantCount || 1);
      totalReg += pCount;

      roster.forEach((p) => {
        if (p.attendanceStatus === 'PRESENT') totalPresent++;
        if (p.idCardStatus === 'ISSUED') cardsIssued++;
      });
    });

    return {
      totalRegisteredParticipants: totalReg,
      totalPresentParticipants: totalPresent,
      totalAbsentParticipants: Math.max(0, totalReg - totalPresent),
      idCardsIssued: cardsIssued,
      idCardsPending: Math.max(0, totalReg - cardsIssued),
      onSpotRegistrationsCount: onSpotCount,
    };
  }
}

export const eventDayService = new EventDayService();
