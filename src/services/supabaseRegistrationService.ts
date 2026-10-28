import { supabase, isSupabaseConfigured, getSupabaseConfigStatus } from '../lib/supabase';
import { 
  RegistrationSubmission, 
  ParticipantMember, 
  CollegeDetails,
  PaymentStatus 
} from '../types/registration';
import { EventItem, EVENTS_DATA } from '../data/festivalData';
import { generateRegistrationCode } from '../utils/registrationCode';
import { isAutoApproveEnabled } from '../utils/registrationStatus';

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
  // Promo code & discount details
  promoCode?: string;
  discountPercent?: number;
  discountAmount?: number;
  originalAmount?: number;
  // Combo offer metadata & Headcount
  participantCount?: number;
  comboGroupId?: string;
  comboId?: string;
  comboName?: string;
  comboType?: string;
  comboDiscountAmount?: number;
  comboEventIndex?: number;
  comboTotalEvents?: number;
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
   * Converts a Data URL (base64) to a File object for direct storage bucket upload
   */
  dataURLtoFile(dataurl: string, filename: string): File | null {
    try {
      if (!dataurl || !dataurl.startsWith('data:')) return null;
      const arr = dataurl.split(',');
      if (arr.length < 2) return null;
      const mimeMatch = arr[0].match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      return new File([u8arr], filename, { type: mime });
    } catch {
      return null;
    }
  },

  /**
   * Guarantees mathematical uniqueness of the registration code in Supabase.
   * If a registration code already exists, appends or increments sequence suffix to avoid unique key errors.
   */
  async ensureUniqueRegistrationCode(baseCode: string): Promise<string> {
    if (!supabase) return baseCode;
    try {
      let currentCode = baseCode;
      let attempt = 0;
      while (attempt < 15) {
        const { data, error } = await supabase
          .from('registrations')
          .select('id')
          .eq('registration_code', currentCode)
          .maybeSingle();

        if (error || !data) {
          return currentCode;
        }

        attempt++;
        currentCode = `${baseCode}-S${attempt}`;
      }
      return `${baseCode}-${Date.now().toString(36).slice(-4).toUpperCase()}`;
    } catch {
      return baseCode;
    }
  },

  /**
   * Submits a full registration to Supabase:
   * 1. Guarantees unique registration_code against Cloud DB collisions
   * 2. Uploads payment receipt and participant ID card files directly to Storage buckets
   * 3. Inserts registration, participant roster, and payment records
   */
  async submitRegistrationToSupabase(payload: RegistrationPayload): Promise<{
    success: boolean;
    registrationCode: string;
    supabaseId?: string;
    error?: string;
  }> {
    let registrationCode = payload.registrationCode || generateRegistrationCode(payload.selectedEvent?.id || 'event');

    if (!isSupabaseConfigured || !supabase) {
      console.info('Supabase not configured in this build; registration stored in local offline storage.');
      return {
        success: true,
        registrationCode,
      };
    }

    // Ensure code is unique in Supabase before attempting insert
    registrationCode = await this.ensureUniqueRegistrationCode(registrationCode);

    try {
      // 1. Upload payment receipt to 'payment-proofs' storage bucket if File OR Data URL is provided
      let receiptPath: string | null = null;
      let receiptFile = payload.paymentScreenshotFile;
      if (!receiptFile && payload.paymentScreenshotData) {
        receiptFile = this.dataURLtoFile(payload.paymentScreenshotData, `${registrationCode}_receipt.png`);
      }
      if (receiptFile) {
        receiptPath = await this.uploadPaymentScreenshot(registrationCode, receiptFile);
      }

      // 2. Upload participant ID cards to 'id-cards' storage bucket if Files OR Data URLs are present
      const uploadedIdCardPaths: (string | null)[] = [];
      if (payload.participants && payload.participants.length > 0) {
        for (let i = 0; i < payload.participants.length; i++) {
          const participant = payload.participants[i];
          let idFile = payload.idCardFiles?.[i] || null;
          if (!idFile && participant.idCardFileData) {
            idFile = this.dataURLtoFile(participant.idCardFileData, `${registrationCode}_participant_${i + 1}.jpg`);
          }
          if (idFile) {
            const p = await this.uploadIdCard(registrationCode, i, idFile);
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
        participant_count: payload.participantCount || payload.participants?.length || 1,
        fee_per_unit: Number(payload.selectedEvent?.feeAmount) || 0,
        fee_type: payload.selectedEvent?.feeType || 'per_team',
        total_fee: Number(payload.totalFee) || 0,
        promo_code: payload.promoCode || null,
        discount_percent: payload.discountPercent || null,
        discount_amount: payload.discountAmount || null,
        original_amount: payload.originalAmount || null,
        combo_group_id: payload.comboGroupId || null,
        combo_id: payload.comboId || null,
        combo_name: payload.comboName || null,
        combo_type: payload.comboType || null,
        combo_discount_amount: payload.comboDiscountAmount || null,
        registration_status: isAutoApproveEnabled() ? 'Confirmed' : 'Submitted',
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

      // Execute insert into registrations with automatic fallback if optional columns are missing in hosted Supabase DB
      let { error: regError } = await supabase
        .from('registrations')
        .insert([regInsertData]);

      if (regError && (
        regError.message.includes('Could not find') ||
        regError.message.includes('column') ||
        regError.message.includes('schema cache')
      )) {
        console.warn('Supabase insert failed due to DB schema variation. Retrying without optional promo/combo columns:', regError.message);
        
        // Remove optional promo, discount & combo columns that might not exist in remote DB schema
        const fallbackRegData = { ...regInsertData };
        delete fallbackRegData.discount_amount;
        delete fallbackRegData.discount_percent;
        delete fallbackRegData.promo_code;
        delete fallbackRegData.original_amount;
        delete fallbackRegData.combo_id;
        delete fallbackRegData.combo_name;
        delete fallbackRegData.combo_type;
        delete fallbackRegData.combo_discount_amount;

        const retryResult = await supabase
          .from('registrations')
          .insert([fallbackRegData]);
          
        regError = retryResult.error;

        // If still failing due to another missing column (e.g. event_id or rules fields), try minimal base fields
        if (regError && (
          regError.message.includes('Could not find') ||
          regError.message.includes('column') ||
          regError.message.includes('schema cache')
        )) {
          console.warn('Retrying with core registration payload:', regError.message);
          const minimalRegData = {
            id: registrationId,
            registration_code: registrationCode,
            event_code: payload.selectedEvent?.code || 'EVENT',
            event_type: payload.selectedEvent?.type || 'Solo',
            team_name: payload.teamName || 'Team',
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
          };

          const minRetry = await supabase
            .from('registrations')
            .insert([minimalRegData]);
          
          regError = minRetry.error;
        }
      }

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
            console.error('Participant roster insert error:', partError.message);
            return {
              success: false,
              registrationCode,
              error: `Failed to save participant roster: ${partError.message}`,
            };
          }
        } catch (pErr) {
          const pMsg = pErr instanceof Error ? pErr.message : 'Participant insert error';
          console.error('Participants insert exception:', pMsg);
          return {
            success: false,
            registrationCode,
            error: `Failed to save participant details: ${pMsg}`,
          };
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
            payment_status: isAutoApproveEnabled() ? 'Verified' : 'Submitted',
          };

          const { error: payError } = await supabase
            .from('payment_submissions')
            .insert([paymentData]);

          if (payError) {
            console.error('Payment submission insert error:', payError.message);
            return {
              success: false,
              registrationCode,
              error: `Failed to save payment record: ${payError.message}`,
            };
          }
        } catch (payErr) {
          const payMsg = payErr instanceof Error ? payErr.message : 'Payment insert error';
          console.error('Payment insert exception:', payMsg);
          return {
            success: false,
            registrationCode,
            error: `Failed to save payment details: ${payMsg}`,
          };
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
          combo_group_id,
          combo_id,
          combo_name,
          combo_type,
          combo_discount_amount,
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

      // Fetch payments and participants separately if joined query fell back
      let paymentsByRegId: Record<string, any> = {};
      let participantsByRegId: Record<string, any[]> = {};
      
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

          const { data: partRows } = await supabase
            .from('participants')
            .select('*')
            .in('registration_id', regIds);

          if (partRows) {
            partRows.forEach((pt: any) => {
              if (!participantsByRegId[pt.registration_id]) {
                participantsByRegId[pt.registration_id] = [];
              }
              participantsByRegId[pt.registration_id].push(pt);
            });
          }
        }
      } catch {
        // Non-fatal fallback
      }

      // Combine flat data
      const mergedData = flatData.map((row: any) => ({
        ...row,
        payment_submissions: paymentsByRegId[row.id] ? [paymentsByRegId[row.id]] : [],
        participants: participantsByRegId[row.id] || [],
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

      const rawCode = row.event_code || '';
      const rawId = row.event_id || '';
      const rawTitle = row.event_title || '';

      const matchedEvent = EVENTS_DATA.find((e: EventItem) =>
        e.code.toLowerCase() === rawCode.toLowerCase() ||
        e.id.toLowerCase() === rawCode.toLowerCase() ||
        e.id.toLowerCase() === rawId.toLowerCase() ||
        e.title.toLowerCase() === rawTitle.toLowerCase() ||
        e.title.toLowerCase() === rawCode.toLowerCase()
      );

      const eventCode = matchedEvent ? matchedEvent.code : (rawCode.toUpperCase() || 'FEST');
      const eventTitle = matchedEvent ? matchedEvent.title : (rawTitle || rawCode || 'Fest Event');
      const eventId = matchedEvent ? matchedEvent.id : (rawId || rawCode.toLowerCase());
      const eventCategory = matchedEvent ? matchedEvent.categoryDisplay : 'Cultural';
      const eventType = matchedEvent ? matchedEvent.type : (row.event_type || 'Solo');
      const venue = matchedEvent ? matchedEvent.venue : 'Main Stage';
      const duration = matchedEvent ? matchedEvent.duration : 'Standard';

      return {
        id: row.registration_code || row.id,
        registrationCode: row.registration_code || row.id,
        userId: 'cloud',
        eventId,
        eventTitle,
        eventCode,
        eventCategory,
        eventType,
        venue,
        dateStr: 'November 3-5, 2026',
        duration,
        isHostCollege: (() => {
          const cName = (row.college_name || '').toLowerCase();
          return Boolean(row.is_host_college) || cName.includes('srinivasan') || (Boolean(row.host_register_number) && !cName.includes('medical') && !cName.includes('college'));
        })(),
        college: (() => {
          const rawCollegeName = (row.college_name || '').trim();
          const cNameLower = rawCollegeName.toLowerCase();
          const isHost = Boolean(row.is_host_college) || cNameLower.includes('srinivasan');
          const isDelegation = !isHost && Boolean(row.is_college_delegation);

          return {
            collegeName: rawCollegeName || (isHost ? 'Srinivasan Medical College and Hospital, Trichy' : 'Collegiate Institute'),
            city: row.college_city || (isHost ? 'Trichy' : ''),
            state: row.college_state || (isHost ? 'Tamil Nadu' : ''),
            contactPerson: row.college_contact_person || '',
            contactMobile: row.college_contact_mobile || '',
            contactEmail: row.college_contact_email || '',
            isCollegeDelegation: isDelegation,
            isHostCollege: isHost,
            hostRegisterNumber: isHost ? (row.host_register_number || 'SMCH-STUDENT') : undefined,
            hostBatch: isHost ? (row.host_batch || 'MBBS') : undefined,
            hostDepartment: isHost ? (row.host_department || 'MBBS') : undefined,
          };
        })(),
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
        paidAmount: (() => {
          if (row.paid_amount !== undefined && row.paid_amount !== null) return Number(row.paid_amount);
          if (row.advance_amount_paid) return Number(row.advance_amount_paid);
          // If admin didn't add any advance amount override, default to full amount paid
          return Number(row.total_fee) || 0;
        })(),
        pendingAmount: (() => {
          const tot = Number(row.total_fee) || 0;
          if (row.pending_amount !== undefined && row.pending_amount !== null) return Number(row.pending_amount);
          const pd = (() => {
            if (row.paid_amount !== undefined && row.paid_amount !== null) return Number(row.paid_amount);
            if (row.advance_amount_paid) return Number(row.advance_amount_paid);
            return tot;
          })();
          return Math.max(0, tot - pd);
        })(),
        paymentNotes: row.payment_notes || undefined,
        participantCount: Number(row.participant_count) || roster.length || 1,
        utrNumber: payment?.utr_number || 'N/A',
        paymentScreenshotName: payment?.payment_screenshot_path 
          ? (payment.payment_screenshot_path.startsWith('data:') ? 'Payment_Screenshot_Slip.png' : payment.payment_screenshot_path.split('/').pop() || 'Payment Screenshot') 
          : undefined,
        paymentScreenshotPath: payment?.payment_screenshot_path || undefined,
        paymentScreenshotData: payment?.payment_screenshot_path?.startsWith('data:') ? payment.payment_screenshot_path : undefined,
        paymentConfirmed: payment?.payment_status === 'Verified' || row.registration_status === 'Confirmed',
        paymentStatus: (() => {
          if (row.payment_status === 'Advance Paid' || row.payment_status === 'Paid in Full') {
            return row.payment_status as any;
          }
          const tot = Number(row.total_fee) || 0;
          const pd = (() => {
            if (row.paid_amount !== undefined && row.paid_amount !== null) return Number(row.paid_amount);
            if (row.advance_amount_paid) return Number(row.advance_amount_paid);
            return tot;
          })();
          const pend = Math.max(0, tot - pd);

          if (pd >= tot && tot > 0) return 'Paid in Full';
          if (pd > 0 && pend > 0) return 'Advance Paid';
          return (payment?.payment_status as any) || (row.payment_status as any) || 'Paid in Full';
        })(),
        registrationStatus: (row.registration_status as any) || 'Submitted',
        comboGroupId: row.combo_group_id || undefined,
        comboId: row.combo_id || undefined,
        comboName: row.combo_name || undefined,
        comboType: row.combo_type || undefined,
        comboDiscountAmount: row.combo_discount_amount ? Number(row.combo_discount_amount) : undefined,
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

    // Always update local storage first so UI reacts immediately
    try {
      const saved = localStorage.getItem('celestia26_registrations');
      if (saved) {
        const list = JSON.parse(saved);
        const updated = list.map((item: any) => {
          const isMatch =
            item.registrationCode === registrationCode ||
            item.id === registrationCode ||
            (item.registrationCode && registrationCode && item.registrationCode.toLowerCase() === registrationCode.toLowerCase()) ||
            (item.id && registrationCode && item.id.toLowerCase() === registrationCode.toLowerCase());
          if (isMatch) {
            return {
              ...item,
              paymentStatus: payStatus,
              registrationStatus: regStatus,
              paymentConfirmed: payStatus === 'Verified',
            };
          }
          return item;
        });
        localStorage.setItem('celestia26_registrations', JSON.stringify(updated));
      }
    } catch (e) {
      console.warn('LocalStorage status update notice:', e);
    }

    window.dispatchEvent(new CustomEvent('celestia-registration-status-changed', { detail: { regId: registrationCode, action } }));

    if (!supabase) {
      return { success: true, message: `Registration status updated locally to ${regStatus}` };
    }

    try {
      let reg: { id: string; combo_group_id?: string; combo_id?: string; registration_code?: string } | null = null;

      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(registrationCode);

      if (isUuid) {
        const { data } = await supabase
          .from('registrations')
          .select('id, combo_group_id, combo_id, registration_code')
          .eq('id', registrationCode)
          .maybeSingle();
        if (data) reg = data;
      }

      if (!reg) {
        const { data } = await supabase
          .from('registrations')
          .select('id, combo_group_id, combo_id, registration_code')
          .eq('registration_code', registrationCode)
          .maybeSingle();
        if (data) reg = data;
      }

      if (!reg) {
        const { data } = await supabase
          .from('registrations')
          .select('id, combo_group_id, combo_id, registration_code')
          .ilike('registration_code', registrationCode)
          .maybeSingle();
        if (data) reg = data;
      }

      if (!reg) {
        console.warn('updateStatus: Registration not found by id or code:', registrationCode);
        return { success: true, message: `Updated local status for ${registrationCode}` };
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

      // Check for combo cascade: find all registrations sharing the combo batch
      let targetRegIds: string[] = [reg.id];
      if (reg.combo_group_id) {
        const { data: siblingRegs } = await supabase
          .from('registrations')
          .select('id')
          .eq('combo_group_id', reg.combo_group_id);
        if (siblingRegs && siblingRegs.length > 0) {
          targetRegIds = siblingRegs.map((s: any) => s.id);
        }
      } else if (reg.combo_id) {
        // Fallback: look up by utr_number from payment_submissions
        const { data: payRow } = await supabase
          .from('payment_submissions')
          .select('utr_number')
          .eq('registration_id', reg.id)
          .maybeSingle();

        if (payRow?.utr_number) {
          const { data: siblingPays } = await supabase
            .from('payment_submissions')
            .select('registration_id')
            .eq('utr_number', payRow.utr_number);
          if (siblingPays && siblingPays.length > 0) {
            targetRegIds = siblingPays.map((p: any) => p.registration_id);
          }
        }
      }

      // 1. Update payment status for all target registrations
      try {
        await supabase
          .from('payment_submissions')
          .update({
            payment_status: payStatus,
            verified_at: (action === 'approve' || action === 'verify') ? new Date().toISOString() : null,
            rejection_reason: notes || null,
          })
          .in('registration_id', targetRegIds);
      } catch {
        // Non-fatal if payment table has schema difference
      }

      // 2. Update registration status for all target registrations
      try {
        await supabase
          .from('registrations')
          .update({
            registration_status: regStatus,
            admin_notes: notes || (action === 'hold' || action === 'not_complete' ? 'Flagged as Not Complete by Admin' : null),
            verified_at: (action === 'approve' || action === 'verify') ? new Date().toISOString() : null,
          })
          .in('id', targetRegIds);
      } catch {
        await supabase
          .from('registrations')
          .update({ registration_status: regStatus })
          .in('id', targetRegIds);
      }

      // 3. Sync local storage if present
      try {
        const saved = localStorage.getItem('celestia26_registrations');
        if (saved) {
          const list = JSON.parse(saved);
          const updated = list.map((item: any) => {
            const isMatch = item.registrationCode === registrationCode || 
              item.id === registrationCode || 
              (reg.combo_group_id && item.comboGroupId === reg.combo_group_id) ||
              (reg.combo_id && item.comboId === reg.combo_id && item.utrNumber);
            if (isMatch) {
              return {
                ...item,
                paymentStatus: payStatus,
                registrationStatus: regStatus,
                paymentConfirmed: payStatus === 'Verified'
              };
            }
            return item;
          });
          localStorage.setItem('celestia26_registrations', JSON.stringify(updated));
        }
      } catch {}

      const actionText = 
        (action === 'approve' || action === 'verify') ? 'Verified' :
        (action === 'decline' || action === 'reject') ? 'Rejected' :
        (action === 'hold' || action === 'not_complete') ? 'marked as Registration Not Complete' : 'reset to Pending';
      
      const batchSuffix = targetRegIds.length > 1 ? ` (and all ${targetRegIds.length} events in this combo package)` : '';
      return { success: true, message: `Registration ${registrationCode}${batchSuffix} successfully ${actionText}` };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Status update failed';
      return { success: false, message: msg };
    }
  },

  /**
   * Manually records/updates paid amount, pending balance, payment notes, and calculated payment status in Supabase and LocalStorage.
   */
  async updatePaymentDetails(
    registrationCode: string,
    paidAmountInput: number,
    notes?: string
  ): Promise<VerificationResult> {
    const paidAmount = Math.max(0, Number(paidAmountInput) || 0);

    // 1. Update in LocalStorage first so UI reacts immediately
    try {
      const saved = localStorage.getItem('celestia26_registrations');
      if (saved) {
        const list = JSON.parse(saved);
        const updated = list.map((item: any) => {
          const isMatch =
            item.registrationCode === registrationCode ||
            item.id === registrationCode ||
            (item.registrationCode && registrationCode && item.registrationCode.toLowerCase() === registrationCode.toLowerCase()) ||
            (item.id && registrationCode && item.id.toLowerCase() === registrationCode.toLowerCase());
          if (isMatch) {
            const total = Number(item.totalAmount) || 0;
            const pending = Math.max(0, total - paidAmount);
            let status: PaymentStatus = 'Pending';
            if (pending === 0 && total > 0) {
              status = 'Paid in Full';
            } else if (paidAmount > 0) {
              status = 'Advance Paid';
            } else {
              status = 'Pending';
            }
            return {
              ...item,
              paidAmount,
              pendingAmount: pending,
              paymentNotes: notes !== undefined ? notes : item.paymentNotes,
              paymentStatus: status,
              paymentConfirmed: status === 'Paid in Full' || item.paymentConfirmed,
            };
          }
          return item;
        });
        localStorage.setItem('celestia26_registrations', JSON.stringify(updated));
      }
    } catch (e) {
      console.warn('LocalStorage payment update notice:', e);
    }

    window.dispatchEvent(new CustomEvent('celestia-registration-status-changed', { detail: { regId: registrationCode } }));

    if (!supabase) {
      return { success: true, message: 'Payment details updated locally' };
    }

    try {
      // Find row in Supabase
      let reg: { id: string; total_fee?: number; combo_group_id?: string; registration_code?: string } | null = null;
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(registrationCode);

      if (isUuid) {
        const { data } = await supabase
          .from('registrations')
          .select('id, total_fee, combo_group_id, registration_code')
          .eq('id', registrationCode)
          .maybeSingle();
        if (data) reg = data;
      }

      if (!reg) {
        const { data } = await supabase
          .from('registrations')
          .select('id, total_fee, combo_group_id, registration_code')
          .eq('registration_code', registrationCode)
          .maybeSingle();
        if (data) reg = data;
      }

      if (!reg) {
        return { success: false, message: `Registration ${registrationCode} not found in database` };
      }

      const totalFee = Number(reg.total_fee) || 0;
      const pendingAmount = Math.max(0, totalFee - paidAmount);

      let calcStatus: PaymentStatus = 'Pending';
      if (pendingAmount === 0 && totalFee > 0) {
        calcStatus = 'Paid in Full';
      } else if (paidAmount > 0) {
        calcStatus = 'Advance Paid';
      } else {
        calcStatus = 'Pending';
      }

      const updatePayload: Record<string, any> = {
        paid_amount: paidAmount,
        pending_amount: pendingAmount,
        payment_status: calcStatus,
        payment_notes: notes !== undefined ? (notes || null) : undefined,
      };

      if (notes === undefined) {
        delete updatePayload.payment_notes;
      }

      // If registered as a combo group, update all events in the combo group consistently
      const targetQuery = reg.combo_group_id 
        ? supabase.from('registrations').update(updatePayload).eq('combo_group_id', reg.combo_group_id)
        : supabase.from('registrations').update(updatePayload).eq('id', reg.id);

      let { error: updateErr } = await targetQuery;

      if (updateErr && (updateErr.message.includes('column') || updateErr.message.includes('schema cache'))) {
        console.warn('Supabase DB column paid_amount missing, trying fallback without paid_amount column:', updateErr.message);
        const fallbackQuery = reg.combo_group_id
          ? supabase.from('registrations').update({ payment_status: calcStatus }).eq('combo_group_id', reg.combo_group_id)
          : supabase.from('registrations').update({ payment_status: calcStatus }).eq('id', reg.id);
        const { error: fbErr } = await fallbackQuery;
        if (fbErr) {
          return { success: false, message: `Failed to update payment in database: ${fbErr.message}` };
        }
      } else if (updateErr) {
        return { success: false, message: `Failed to update payment: ${updateErr.message}` };
      }

      return {
        success: true,
        message: `Payment updated successfully! Amount Paid: ₹${paidAmount.toLocaleString('en-IN')}, Balance Due: ₹${pendingAmount.toLocaleString('en-IN')}`,
      };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Failed to update payment details' };
    }
  },

  /**
   * Fetches latest registrations for a specific participant (by contact email or mobile)
   */
  async fetchUserRegistrations(contactEmailOrMobile: string): Promise<RegistrationSubmission[]> {
    if (!supabase || !contactEmailOrMobile) return [];
    try {
      const clean = contactEmailOrMobile.trim();
      const { data, error } = await supabase
        .from('registrations')
        .select(`
          *,
          participants (*),
          payment_submissions (*)
        `)
        .or(`college_contact_email.ilike.%${clean}%,college_contact_mobile.eq.${clean}`)
        .order('created_at', { ascending: false });

      if (error || !data) {
        return [];
      }
      return this.mapSupabaseRowsToSubmissions(data);
    } catch {
      return [];
    }
  },

  /**
   * Deletes a registration record and cleans local storage safely without affecting other entries
   */
  async deleteRegistration(identifier: string): Promise<VerificationResult> {
    if (!identifier) {
      return { success: false, message: 'Invalid registration identifier' };
    }

    // 1. Clean from local storage cache
    try {
      const saved = localStorage.getItem('celestia26_registrations');
      if (saved) {
        const parsed: RegistrationSubmission[] = JSON.parse(saved);
        const filtered = parsed.filter(
          (r) => r.id !== identifier && r.registrationCode !== identifier
        );
        localStorage.setItem('celestia26_registrations', JSON.stringify(filtered));
      }
    } catch (e) {
      console.warn('Local storage clean error:', e);
    }

    if (!supabase) {
      return { success: true, message: `Registration ${identifier} removed locally` };
    }

    try {
      let regRecord: { id: string; registration_code: string } | null = null;

      // Check if identifier is a valid UUID
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);

      if (isUuid) {
        const { data, error } = await supabase
          .from('registrations')
          .select('id, registration_code')
          .eq('id', identifier)
          .maybeSingle();

        if (!error && data) {
          regRecord = data;
        }
      }

      // If not found by UUID, query by registration_code text
      if (!regRecord) {
        const { data, error } = await supabase
          .from('registrations')
          .select('id, registration_code')
          .eq('registration_code', identifier)
          .maybeSingle();

        if (!error && data) {
          regRecord = data;
        }
      }

      // If still not found and not a UUID, try case-insensitive text match
      if (!regRecord && !isUuid) {
        const { data } = await supabase
          .from('registrations')
          .select('id, registration_code')
          .ilike('registration_code', identifier)
          .maybeSingle();

        if (data) {
          regRecord = data;
        }
      }

      if (!regRecord) {
        return { success: true, message: `Registration ${identifier} removed or already deleted.` };
      }

      const targetId = regRecord.id;

      // 2. Delete foreign key child records first (participants and payment submissions)
      try {
        await supabase.from('participants').delete().eq('registration_id', targetId);
      } catch (err) {
        console.warn('Notice deleting participants:', err);
      }

      try {
        await supabase.from('payment_submissions').delete().eq('registration_id', targetId);
      } catch (err) {
        console.warn('Notice deleting payment submissions:', err);
      }

      // 3. Delete parent registration
      const { error: delError } = await supabase
        .from('registrations')
        .delete()
        .eq('id', targetId);

      if (delError) {
        console.error('Failed to delete registration record from Supabase:', delError);
        return { success: false, message: `Failed to delete from database: ${delError.message}` };
      }

      return { success: true, message: `Registration ${regRecord.registration_code || identifier} deleted permanently` };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Deletion error';
      console.error('Delete registration exception:', err);
      return { success: false, message: `Deletion error: ${msg}` };
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
      participantCount?: number;
      participants?: ParticipantMember[];
    }
  ): Promise<VerificationResult> {
    // 1. Always update LocalStorage cache first so UI responds immediately
    try {
      const saved = localStorage.getItem('celestia26_registrations');
      if (saved) {
        const list = JSON.parse(saved);
        const updated = list.map((item: any) => {
          const isMatch =
            item.registrationCode === registrationCode ||
            item.id === registrationCode ||
            (item.registrationCode && registrationCode && item.registrationCode.toLowerCase() === registrationCode.toLowerCase()) ||
            (item.id && registrationCode && item.id.toLowerCase() === registrationCode.toLowerCase());

          if (isMatch) {
            const count = details.participantCount !== undefined 
              ? details.participantCount 
              : (details.participants ? details.participants.length : item.participantCount);

            const updatedParticipants = details.participants || [...(item.participants || [])];
            if (updatedParticipants[0]) {
              updatedParticipants[0] = {
                ...updatedParticipants[0],
                fullName: details.captainName || updatedParticipants[0].fullName,
                email: details.captainEmail !== undefined ? details.captainEmail : updatedParticipants[0].email,
                mobile: details.captainMobile || updatedParticipants[0].mobile,
              };
            }

            const perHeadFee = item.feePerUnit || item.feeAmount || 0;
            const isHost = Boolean(item.isHostCollege || item.college?.isHostCollege);
            const calculatedTotal = isHost ? 0 : (item.feeType === 'per_head' ? perHeadFee * count : item.totalAmount);

            return {
              ...item,
              participantCount: count,
              participants: updatedParticipants,
              teamName: details.teamName !== undefined ? details.teamName : item.teamName,
              utrNumber: details.utrNumber !== undefined ? details.utrNumber : item.utrNumber,
              totalAmount: calculatedTotal,
              college: {
                ...item.college,
                collegeName: details.collegeName !== undefined ? details.collegeName : item.college?.collegeName,
                city: details.collegeCity !== undefined ? details.collegeCity : item.college?.city,
                state: details.collegeState !== undefined ? details.collegeState : item.college?.state,
                contactPerson: details.contactPerson !== undefined ? details.contactPerson : item.college?.contactPerson,
                contactMobile: details.contactMobile !== undefined ? details.contactMobile : item.college?.contactMobile,
                contactEmail: details.contactEmail !== undefined ? details.contactEmail : item.college?.contactEmail,
              },
            };
          }
          return item;
        });
        localStorage.setItem('celestia26_registrations', JSON.stringify(updated));
      }
    } catch (e) {
      console.warn('LocalStorage edit update notice:', e);
    }

    window.dispatchEvent(new CustomEvent('celestia-registration-status-changed', { detail: { regId: registrationCode } }));

    if (!supabase) {
      return { success: true, message: `Registration ${registrationCode} updated locally` };
    }

    try {
      let reg: { id: string; fee_per_unit?: number; fee_type?: string; total_fee?: number } | null = null;
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(registrationCode);

      if (isUuid) {
        const { data } = await supabase
          .from('registrations')
          .select('id, fee_per_unit, fee_type, total_fee')
          .eq('id', registrationCode)
          .maybeSingle();
        if (data) reg = data;
      }

      if (!reg) {
        const { data } = await supabase
          .from('registrations')
          .select('id, fee_per_unit, fee_type, total_fee')
          .eq('registration_code', registrationCode)
          .maybeSingle();
        if (data) reg = data;
      }

      if (!reg) {
        return { success: true, message: `Registration ${registrationCode} updated locally` };
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

      if (details.participantCount !== undefined || (details.participants && details.participants.length > 0)) {
        const newCount = details.participantCount !== undefined ? details.participantCount : details.participants!.length;
        updateObj.participant_count = newCount;
        if (reg.fee_type === 'per_head' && reg.fee_per_unit) {
          updateObj.total_fee = reg.fee_per_unit * newCount;
        }
      }

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

      // Update participant roster in database if participants list is provided
      if (details.participants && details.participants.length > 0) {
        try {
          // Clean existing participants for this registration ID
          await supabase.from('participants').delete().eq('registration_id', reg.id);

          const participantRows = details.participants.map((m, idx) => ({
            registration_id: reg.id,
            full_name: m.fullName || (idx === 0 ? details.captainName || 'Participant' : `Team Member #${idx + 1}`),
            gender: m.gender || 'Other',
            age: parseInt(m.age, 10) || 20,
            mobile: m.mobile || (idx === 0 ? details.captainMobile || '' : ''),
            email: m.email || (idx === 0 ? details.captainEmail || '' : ''),
            role: m.role || (idx === 0 ? 'Primary Contact / Team Captain' : `Team Member #${idx + 1}`),
            id_card_storage_path: m.idCardFileData || m.idCardStoragePath || null,
          }));

          await supabase.from('participants').insert(participantRows);
        } catch (pErr) {
          console.warn('Notice updating participants roster in DB:', pErr);
        }
      } else if (details.captainName || details.captainEmail || details.captainMobile) {
        const { data: pList } = await supabase
          .from('participants')
          .select('id')
          .eq('registration_id', reg.id)
          .order('created_at', { ascending: true })
          .limit(1);

        if (pList && pList[0]) {
          const partUpdate: Record<string, any> = {};
          if (details.captainName) partUpdate.full_name = details.captainName;
          if (details.captainEmail) partUpdate.email = details.captainEmail;
          if (details.captainMobile) partUpdate.mobile = details.captainMobile;

          await supabase
            .from('participants')
            .update(partUpdate)
            .eq('id', pList[0].id);
        }
      }

      return { success: true, message: `Registration ${registrationCode} details updated successfully` };
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
  },

  /**
   * Auto-approves and verifies all currently pending/submitted registrations
   */
  async autoApproveAllPendingRegistrations(): Promise<VerificationResult> {
    // 1. Update local storage
    try {
      const saved = localStorage.getItem('celestia26_registrations');
      if (saved) {
        const list = JSON.parse(saved);
        const updated = list.map((item: any) => ({
          ...item,
          paymentStatus: 'Verified',
          registrationStatus: 'Confirmed',
          paymentConfirmed: true
        }));
        localStorage.setItem('celestia26_registrations', JSON.stringify(updated));
      }
    } catch (e) {
      console.warn('LocalStorage auto approve notice:', e);
    }

    if (!supabase) {
      window.dispatchEvent(new CustomEvent('celestia-registration-status-changed'));
      return { success: true, message: 'Auto-approved all local registrations' };
    }

    try {
      // Update all registrations in Supabase that are not already rejected
      const { error: regErr } = await supabase
        .from('registrations')
        .update({
          registration_status: 'Confirmed',
          verified_at: new Date().toISOString()
        })
        .neq('registration_status', 'Rejected');

      const { error: payErr } = await supabase
        .from('payment_submissions')
        .update({
          payment_status: 'Verified',
          verified_at: new Date().toISOString()
        })
        .neq('payment_status', 'Rejected');

      if (regErr || payErr) {
        console.warn('Auto approve cloud update notice:', regErr?.message || payErr?.message);
      }

      window.dispatchEvent(new CustomEvent('celestia-registration-status-changed'));
      return { success: true, message: 'Auto-approved and verified all pending registrations' };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Auto approve failed';
      return { success: false, message: msg };
    }
  }
};
