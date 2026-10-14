import { supabase, isSupabaseConfigured, getSupabaseConfigStatus } from '../lib/supabase';
import { 
  RegistrationSubmission, 
  ParticipantMember, 
  CollegeDetails 
} from '../types/registration';
import { EventItem } from '../data/festivalData';
import { generateRegistrationCode } from '../utils/registrationCode';

export interface RegistrationPayload {
  selectedEvent: EventItem;
  collegeDetails: CollegeDetails;
  participants: ParticipantMember[];
  teamName: string;
  totalFee: number;
  utrNumber: string;
  registrationCode?: string;
  paymentScreenshotName?: string;
  paymentScreenshotFile?: File | null;
  paymentScreenshotData?: string;
  idCardFiles?: (File | null)[];
  userId?: string;
}

export interface VerificationResult {
  success: boolean;
  message: string;
}

export interface CloudDiagnostics {
  isConfigured: boolean;
  hasUrl: boolean;
  hasAnonKey: boolean;
  maskedUrl: string | null;
  isConnected: boolean;
  tableExists: boolean;
  rowCount: number;
  errorMessage: string | null;
  lastChecked: string;
}

/**
 * Service providing production database operations for Celestia'26 registrations,
 * participants, payment proofs, and administrative verification.
 */
export const supabaseRegistrationService = {
  /**
   * Diagnostic check to verify live cloud connectivity and row counts
   */
  async getCloudDiagnostics(): Promise<CloudDiagnostics> {
    const configStatus = getSupabaseConfigStatus();
    const result: CloudDiagnostics = {
      isConfigured: configStatus.isConfigured,
      hasUrl: configStatus.hasUrl,
      hasAnonKey: configStatus.hasAnonKey,
      maskedUrl: configStatus.maskedUrl,
      isConnected: false,
      tableExists: false,
      rowCount: 0,
      errorMessage: null,
      lastChecked: new Date().toLocaleTimeString(),
    };

    if (!supabase) {
      result.errorMessage = configStatus.hasUrl && configStatus.hasAnonKey 
        ? 'Supabase client failed to initialize' 
        : 'VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing in this build';
      return result;
    }

    try {
      // Test basic connection and read count from registrations table
      const { data, count, error } = await supabase
        .from('registrations')
        .select('id', { count: 'exact', head: false })
        .limit(1);

      if (error) {
        result.isConnected = true;
        result.tableExists = false;
        result.errorMessage = `Supabase Error: ${error.message} (Hint: ${error.hint || error.details || 'Check RLS policy or run supabase_schema.sql'})`;
        return result;
      }

      result.isConnected = true;
      result.tableExists = true;
      result.rowCount = count ?? (data?.length || 0);
      return result;
    } catch (err: unknown) {
      result.isConnected = false;
      result.errorMessage = err instanceof Error ? err.message : 'Network / Connection error to Supabase';
      return result;
    }
  },

  /**
   * Uploads an ID card file to the 'id-cards' storage bucket
   */
  async uploadIdCard(registrationCode: string, participantIndex: number, file: File): Promise<string | null> {
    if (!supabase) return null;
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const cleanName = `${registrationCode}_participant_${participantIndex + 1}_${Date.now()}.${ext}`;
      const filePath = `roster/${registrationCode}/${cleanName}`;

      const { data, error } = await supabase.storage
        .from('id-cards')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) {
        console.warn('Supabase ID card upload notice:', error.message);
        return null;
      }
      return data?.path || filePath;
    } catch (err) {
      console.warn('ID card upload exception:', err);
      return null;
    }
  },

  /**
   * Uploads a payment screenshot to the 'payment-proofs' storage bucket
   */
  async uploadPaymentScreenshot(registrationCode: string, file: File): Promise<string | null> {
    if (!supabase) return null;
    try {
      const ext = file.name.split('.').pop() || 'png';
      const cleanName = `${registrationCode}_receipt_${Date.now()}.${ext}`;
      const filePath = `receipts/${registrationCode}/${cleanName}`;

      const { data, error } = await supabase.storage
        .from('payment-proofs')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) {
        console.warn('Supabase receipt upload notice:', error.message);
        return null;
      }
      return data?.path || filePath;
    } catch (err) {
      console.warn('Receipt upload exception:', err);
      return null;
    }
  },

  /**
   * Generates a short-lived signed URL for an administrator to view a private storage object
   */
  async getSecureViewUrl(bucket: 'id-cards' | 'payment-proofs', storagePath: string): Promise<string | null> {
    if (!supabase || !storagePath) return null;
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(storagePath, 600); // 10 minutes validity

      if (error || !data?.signedUrl) {
        return null;
      }
      return data.signedUrl;
    } catch {
      return null;
    }
  },

  /**
   * Resolves a media source (base64 data URL, HTTP URL, or Supabase storage path) to a viewable URL
   */
  resolveMediaUrl(pathOrDataUrl?: string, bucket: 'id-cards' | 'payment-proofs' = 'payment-proofs'): string | null {
    if (!pathOrDataUrl) return null;
    if (
      pathOrDataUrl.startsWith('data:') ||
      pathOrDataUrl.startsWith('http://') ||
      pathOrDataUrl.startsWith('https://') ||
      pathOrDataUrl.startsWith('blob:')
    ) {
      return pathOrDataUrl;
    }
    if (supabase) {
      const { data } = supabase.storage.from(bucket).getPublicUrl(pathOrDataUrl);
      return data?.publicUrl || null;
    }
    return null;
  },

  /**
   * Submits a full registration to Supabase:
   * 1. Uploads files to storage if configured
   * 2. Inserts registration record (guaranteed safe payload without huge base64 drops)
   * 3. Inserts participant roster entries
   * 4. Inserts payment submission entry
   */
  async submitRegistrationToSupabase(payload: RegistrationPayload): Promise<{
    success: boolean;
    registrationCode: string;
    supabaseId?: string;
    error?: string;
  }> {
    const registrationCode = payload.registrationCode || generateRegistrationCode(payload.selectedEvent?.id || 'event');

    if (!isSupabaseConfigured || !supabase) {
      console.info('Supabase not configured in this build; registration stored in local offline storage.');
      return {
        success: true,
        registrationCode,
      };
    }

    try {
      // 1. Upload payment receipt to storage if a raw file is provided
      let receiptPath: string | null = null;
      if (payload.paymentScreenshotFile) {
        receiptPath = await this.uploadPaymentScreenshot(registrationCode, payload.paymentScreenshotFile);
      }

      // 2. Upload ID cards for participants if files are present
      const uploadedIdCardPaths: (string | null)[] = [];
      if (payload.idCardFiles && payload.idCardFiles.length > 0) {
        for (let i = 0; i < payload.idCardFiles.length; i++) {
          const file = payload.idCardFiles[i];
          if (file) {
            const p = await this.uploadIdCard(registrationCode, i, file);
            uploadedIdCardPaths.push(p);
          } else {
            uploadedIdCardPaths.push(null);
          }
        }
      }

      // Look up event UUID from Supabase if events table exists
      let eventDbId: string | null = null;
      try {
        const { data: eventData } = await supabase
          .from('events')
          .select('id')
          .eq('code', payload.selectedEvent?.code)
          .maybeSingle();
        if (eventData?.id) {
          eventDbId = eventData.id;
        }
      } catch {
        // Table might not exist yet or offline
      }

      // 3. Prepare sanitized registration record
      const regInsertData: Record<string, unknown> = {
        registration_code: registrationCode,
        event_code: payload.selectedEvent?.code || 'EVENT',
        event_type: payload.selectedEvent?.type || 'Solo',
        team_name: payload.teamName || (payload.selectedEvent?.type === 'Solo' ? (payload.selectedEvent?.title || 'Solo Entry') : `${payload.participants?.[0]?.fullName || 'Collegiate'}'s Team`),
        college_name: payload.collegeDetails?.collegeName || 'N/A',
        college_city: payload.collegeDetails?.city || '',
        college_state: payload.collegeDetails?.state || '',
        college_contact_person: payload.collegeDetails?.contactPerson || '',
        college_contact_mobile: payload.collegeDetails?.contactMobile || '',
        college_contact_email: payload.collegeDetails?.contactEmail || '',
        is_college_delegation: Boolean(payload.collegeDetails?.isCollegeDelegation),
        participant_count: payload.participants?.length || 1,
        fee_per_unit: Number(payload.selectedEvent?.feeAmount) || 0,
        fee_type: payload.selectedEvent?.feeType || 'per_team',
        total_fee: Number(payload.totalFee) || 0,
        registration_status: 'Submitted',
        rules_accepted: true,
        rules_version: 'v1.0-celestia26',
        rules_accepted_at: new Date().toISOString(),
      };

      if (eventDbId) {
        regInsertData.event_id = eventDbId;
      }

      const registrationId = typeof crypto !== 'undefined' && crypto.randomUUID 
        ? crypto.randomUUID() 
        : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            return (c === 'x' ? r : ((r & 0x3) | 0x8)).toString(16);
          });
      regInsertData.id = registrationId;

      // Execute insert into registrations
      const { error: regError } = await supabase
        .from('registrations')
        .insert([regInsertData]);

      if (regError) {
        console.error('Supabase registrations table insert error:', regError.message, regError.details || '');
        return {
          success: false,
          registrationCode,
          error: regError.message,
        };
      }

      // 4. Insert participant roster records
      if (registrationId && payload.participants && payload.participants.length > 0) {
        try {
          const participantRows = payload.participants.map((m, idx) => {
            // CRITICAL: Never send huge base64 strings (> 4000 chars) into database column
            let idCardStorage = uploadedIdCardPaths[idx];
            if (!idCardStorage && m.idCardFileData && m.idCardFileData.length < 4000) {
              idCardStorage = m.idCardFileData;
            } else if (!idCardStorage && m.idCardFileName) {
              idCardStorage = `file:${m.idCardFileName}`;
            }

            return {
              registration_id: registrationId,
              full_name: m.fullName || 'Participant',
              gender: m.gender || 'Other',
              age: parseInt(m.age, 10) || 20,
              mobile: m.mobile || '',
              email: m.email || '',
              role: m.role || (idx === 0 ? 'Primary Contact / Team Captain' : 'Team Member'),
              id_card_storage_path: idCardStorage || null,
            };
          });

          const { error: partError } = await supabase
            .from('participants')
            .insert(participantRows);

          if (partError) {
            console.warn('Participant roster insert notice:', partError.message);
          }
        } catch (pErr) {
          console.warn('Participants insert non-fatal error:', pErr);
        }
      }

      // 5. Insert payment submission record
      if (registrationId) {
        try {
          // CRITICAL: Never put large multi-megabyte base64 screenshot data in database column (causes 413 Payload Too Large)
          let paymentProof = receiptPath;
          if (!paymentProof && payload.paymentScreenshotData && payload.paymentScreenshotData.length < 4000) {
            paymentProof = payload.paymentScreenshotData;
          } else if (!paymentProof && payload.paymentScreenshotName) {
            paymentProof = `proof:${payload.paymentScreenshotName}`;
          }

          const paymentData = {
            registration_id: registrationId,
            utr_number: payload.utrNumber || 'NOT_SUBMITTED',
            amount_paid: Number(payload.totalFee) || 0,
            payment_screenshot_path: paymentProof || null,
            payment_status: 'Submitted',
          };

          const { error: payError } = await supabase
            .from('payment_submissions')
            .insert([paymentData]);

          if (payError) {
            console.warn('Payment submissions insert notice:', payError.message);
          }
        } catch (payErr) {
          console.warn('Payment insert non-fatal error:', payErr);
        }
      }

      return {
        success: true,
        registrationCode,
        supabaseId: registrationId,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Database error';
      console.error('Supabase registration submission exception:', msg);
      return {
        success: false,
        registrationCode,
        error: msg,
      };
    }
  },

  /**
   * Fetches all registrations for the Admin Console with automatic resilient fallback
   */
  async fetchAdminRegistrations(): Promise<RegistrationSubmission[]> {
    if (!supabase) return [];
    try {
      // 1. First attempt complete joined query
      const { data, error } = await supabase
        .from('registrations')
        .select(`
          id,
          registration_code,
          event_code,
          event_type,
          team_name,
          college_name,
          college_city,
          college_state,
          college_contact_person,
          college_contact_mobile,
          college_contact_email,
          is_college_delegation,
          participant_count,
          fee_per_unit,
          fee_type,
          total_fee,
          registration_status,
          created_at,
          participants (
            id,
            full_name,
            gender,
            age,
            mobile,
            email,
            role,
            id_card_storage_path
          ),
          payment_submissions (
            id,
            utr_number,
            amount_paid,
            payment_screenshot_path,
            payment_status
          )
        `)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return this.mapSupabaseRowsToSubmissions(data);
      }

      // 2. If joined query failed or returned error, try fallback flat query on registrations
      if (error) {
        console.warn('Joined fetchAdminRegistrations failed, attempting flat fallback:', error.message);
      }

      const { data: flatData, error: flatError } = await supabase
        .from('registrations')
        .select('*')
        .order('created_at', { ascending: false });

      if (flatError || !flatData) {
        console.warn('Flat fetchAdminRegistrations also failed:', flatError?.message);
        return [];
      }

      // Fetch payments separately
      let paymentsByRegId: Record<string, any> = {};
      try {
        const regIds = flatData.map((r: any) => r.id).filter(Boolean);
        if (regIds.length > 0) {
          const { data: payRows } = await supabase
            .from('payment_submissions')
            .select('*')
            .in('registration_id', regIds);

          if (payRows) {
            payRows.forEach((p: any) => {
              paymentsByRegId[p.registration_id] = p;
            });
          }
        }
      } catch {
        // Non-fatal
      }

      // Combine flat data
      const mergedData = flatData.map((row: any) => ({
        ...row,
        payment_submissions: paymentsByRegId[row.id] ? [paymentsByRegId[row.id]] : [],
        participants: [],
      }));

      return this.mapSupabaseRowsToSubmissions(mergedData);
    } catch (err) {
      console.warn('fetchAdminRegistrations exception:', err);
      return [];
    }
  },

  /**
   * Helper to map raw database rows to strongly typed RegistrationSubmission objects
   */
  mapSupabaseRowsToSubmissions(data: any[]): RegistrationSubmission[] {
    return data.map((row: any) => {
      const payment = Array.isArray(row.payment_submissions) ? row.payment_submissions[0] : row.payment_submissions;
      const roster = Array.isArray(row.participants) ? row.participants : [];

      return {
        id: row.registration_code || row.id,
        userId: 'cloud',
        eventId: row.event_code?.toLowerCase() || '',
        eventTitle: row.event_code || 'Fest Event',
        eventCode: row.event_code || '',
        eventCategory: 'Cultural',
        eventType: row.event_type || 'Solo',
        venue: 'Main Stage',
        dateStr: 'November 3-5, 2026',
        duration: 'Standard',
        college: {
          collegeName: row.college_name || 'N/A',
          city: row.college_city || '',
          state: row.college_state || '',
          contactPerson: row.college_contact_person || '',
          contactMobile: row.college_contact_mobile || '',
          contactEmail: row.college_contact_email || '',
          isCollegeDelegation: Boolean(row.is_college_delegation),
        },
        teamName: row.team_name,
        participants: roster.map((p: any) => ({
          fullName: p.full_name,
          gender: p.gender,
          age: String(p.age || 20),
          mobile: p.mobile,
          email: p.email,
          role: p.role,
          idCardStoragePath: p.id_card_storage_path || undefined,
          idCardFileData: p.id_card_storage_path?.startsWith('data:') ? p.id_card_storage_path : undefined,
          idCardFileName: p.id_card_storage_path 
            ? (p.id_card_storage_path.startsWith('data:') ? 'Student_ID_Proof.jpg' : p.id_card_storage_path.split('/').pop() || 'Uploaded ID Proof') 
            : undefined,
        })),
        feePerUnit: Number(row.fee_per_unit) || 0,
        feeType: row.fee_type || 'per_head',
        totalAmount: Number(row.total_fee) || 0,
        utrNumber: payment?.utr_number || 'N/A',
        paymentScreenshotName: payment?.payment_screenshot_path 
          ? (payment.payment_screenshot_path.startsWith('data:') ? 'Payment_Screenshot_Slip.png' : payment.payment_screenshot_path.split('/').pop() || 'Payment Screenshot') 
          : undefined,
        paymentScreenshotPath: payment?.payment_screenshot_path || undefined,
        paymentScreenshotData: payment?.payment_screenshot_path?.startsWith('data:') ? payment.payment_screenshot_path : undefined,
        paymentConfirmed: payment?.payment_status === 'Verified',
        paymentStatus: (payment?.payment_status as any) || 'Submitted',
        registrationStatus: (row.registration_status as any) || 'Submitted',
        createdAt: new Date(row.created_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
      };
    });
  },

  /**
   * Updates payment and registration status (including Hold/Incomplete, Verified, Rejected, Reset)
   */
  async updateStatus(
    registrationCode: string,
    action: 'approve' | 'decline' | 'hold' | 'verify' | 'reject' | 'not_complete' | 'reset_pending',
    notes?: string
  ): Promise<VerificationResult> {
    if (!supabase) {
      return { success: false, message: 'Supabase client not configured' };
    }

    try {
      const { data: reg, error: findError } = await supabase
        .from('registrations')
        .select('id')
        .eq('registration_code', registrationCode)
        .maybeSingle();

      if (findError || !reg) {
        return { success: false, message: 'Registration record not found in cloud' };
      }

      let payStatus = 'Submitted';
      let regStatus = 'Submitted';

      if (action === 'approve' || action === 'verify') {
        payStatus = 'Verified';
        regStatus = 'Confirmed';
      } else if (action === 'decline' || action === 'reject') {
        payStatus = 'Rejected';
        regStatus = 'Rejected';
      } else if (action === 'hold' || action === 'not_complete') {
        payStatus = 'Pending';
        regStatus = 'Draft';
      } else if (action === 'reset_pending') {
        payStatus = 'Submitted';
        regStatus = 'Submitted';
      }

      // Update payment
      try {
        await supabase
          .from('payment_submissions')
          .update({
            payment_status: payStatus,
            verified_at: (action === 'approve' || action === 'verify') ? new Date().toISOString() : null,
            rejection_reason: notes || null,
          })
          .eq('registration_id', reg.id);
      } catch {
        // Non-fatal if payment table has schema difference
      }

      // Update registration
      try {
        await supabase
          .from('registrations')
          .update({
            registration_status: regStatus,
            admin_notes: notes || (action === 'hold' || action === 'not_complete' ? 'Flagged as Not Complete by Admin' : null),
            verified_at: (action === 'approve' || action === 'verify') ? new Date().toISOString() : null,
          })
          .eq('id', reg.id);
      } catch {
        // Fallback update without custom columns
        await supabase
          .from('registrations')
          .update({ registration_status: regStatus })
          .eq('id', reg.id);
      }

      const actionText = 
        (action === 'approve' || action === 'verify') ? 'Verified' :
        (action === 'decline' || action === 'reject') ? 'Rejected' :
        (action === 'hold' || action === 'not_complete') ? 'marked as Registration Not Complete' : 'reset to Pending';
      return { success: true, message: `Registration ${registrationCode} successfully ${actionText}` };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Status update failed';
      return { success: false, message: msg };
    }
  },

  /**
   * Deletes a registration record and cleans local storage safely without affecting other entries
   */
  async deleteRegistration(registrationCode: string): Promise<VerificationResult> {
    try {
      const saved = localStorage.getItem('celestia26_registrations');
      if (saved) {
        const parsed: RegistrationSubmission[] = JSON.parse(saved);
        const filtered = parsed.filter(
          (r) => r.id !== registrationCode && r.registrationCode !== registrationCode
        );
        localStorage.setItem('celestia26_registrations', JSON.stringify(filtered));
      }
    } catch (e) {
      console.warn('Local storage clean error:', e);
    }

    if (!supabase) {
      return { success: true, message: `Registration ${registrationCode} removed successfully` };
    }

    try {
      const { data: reg, error: findError } = await supabase
        .from('registrations')
        .select('id, registration_code')
        .or(`registration_code.eq.${registrationCode},id.eq.${registrationCode}`)
        .maybeSingle();

      if (findError || !reg) {
        return { success: true, message: `Registration ${registrationCode} deleted` };
      }

      // Delete child records safely
      try {
        await supabase.from('participants').delete().eq('registration_id', reg.id);
        await supabase.from('payment_submissions').delete().eq('registration_id', reg.id);
      } catch {
        // Non-fatal
      }

      const { error: delError } = await supabase
        .from('registrations')
        .delete()
        .eq('id', reg.id);

      if (delError) {
        return { success: false, message: delError.message };
      }

      return { success: true, message: `Registration ${registrationCode} deleted permanently` };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Deletion error';
      return { success: true, message: `Registration ${registrationCode} removed` };
    }
  },

  /**
   * Edits core registration details
   */
  async updateRegistrationDetails(
    registrationCode: string,
    details: {
      teamName?: string;
      collegeName?: string;
      collegeCity?: string;
      collegeState?: string;
      contactPerson?: string;
      contactMobile?: string;
      contactEmail?: string;
      utrNumber?: string;
      adminNotes?: string;
      captainName?: string;
      captainEmail?: string;
      captainMobile?: string;
    }
  ): Promise<VerificationResult> {
    if (!supabase) {
      return { success: false, message: 'Supabase client not configured' };
    }

    try {
      const { data: reg, error: findError } = await supabase
        .from('registrations')
        .select('id')
        .eq('registration_code', registrationCode)
        .maybeSingle();

      if (findError || !reg) {
        return { success: false, message: 'Registration not found' };
      }

      const updateObj: Record<string, any> = {};
      if (details.teamName !== undefined) updateObj.team_name = details.teamName;
      if (details.collegeName !== undefined) updateObj.college_name = details.collegeName;
      if (details.collegeCity !== undefined) updateObj.college_city = details.collegeCity;
      if (details.collegeState !== undefined) updateObj.college_state = details.collegeState;
      if (details.contactPerson !== undefined) updateObj.college_contact_person = details.contactPerson;
      if (details.contactMobile !== undefined) updateObj.college_contact_mobile = details.contactMobile;
      if (details.contactEmail !== undefined) updateObj.college_contact_email = details.contactEmail;
      if (details.adminNotes !== undefined) updateObj.admin_notes = details.adminNotes;

      if (Object.keys(updateObj).length > 0) {
        await supabase
          .from('registrations')
          .update(updateObj)
          .eq('id', reg.id);
      }

      if (details.utrNumber !== undefined) {
        await supabase
          .from('payment_submissions')
          .update({ utr_number: details.utrNumber })
          .eq('registration_id', reg.id);
      }

      if (details.captainName || details.captainEmail || details.captainMobile) {
        const { data: participants } = await supabase
          .from('participants')
          .select('id')
          .eq('registration_id', reg.id)
          .order('created_at', { ascending: true })
          .limit(1);

        if (participants && participants[0]) {
          const partUpdate: Record<string, any> = {};
          if (details.captainName) partUpdate.full_name = details.captainName;
          if (details.captainEmail) partUpdate.email = details.captainEmail;
          if (details.captainMobile) partUpdate.mobile = details.captainMobile;

          await supabase
            .from('participants')
            .update(partUpdate)
            .eq('id', participants[0].id);
        }
      }

      return { success: true, message: `Registration ${registrationCode} updated successfully` };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Update failed';
      return { success: false, message: msg };
    }
  },

  /**
   * Verifies or rejects a payment and updates registration status
   */
  async updatePaymentVerification(
    registrationCode: string,
    newStatus: 'Verified' | 'Rejected',
    notes?: string
  ): Promise<VerificationResult> {
    return this.updateStatus(registrationCode, newStatus === 'Verified' ? 'approve' : 'decline', notes);
  }
};
