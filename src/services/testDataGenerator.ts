import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { EVENTS_DATA, EventItem } from '../data/festivalData';
import { RegistrationSubmission } from '../types/registration';
import { supabaseRegistrationService } from './supabaseRegistrationService';

export interface TestGeneratorResult {
  success: boolean;
  totalAttempted: number;
  successCount: number;
  failureCount: number;
  errors: string[];
  records: Array<{
    code: string;
    eventTitle: string;
    collegeName: string;
    participantCount: number;
    utrNumber: string;
    totalFee: number;
    isHost: boolean;
    status: string;
  }>;
}

export interface TestPurgeResult {
  success: boolean;
  deletedCount: number;
  message: string;
}

/**
 * Creates a real lightweight synthetic PNG File object for storage bucket uploads
 */
function createSyntheticImageFile(filename: string, textLine1: string, textLine2: string): File {
  if (typeof document !== 'undefined') {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 250;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Dark gradient background
        const grad = ctx.createLinearGradient(0, 0, 400, 250);
        grad.addColorStop(0, '#0E163B');
        grad.addColorStop(1, '#050714');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 400, 250);

        // Gold border
        ctx.strokeStyle = '#D4AF37';
        ctx.lineWidth = 4;
        ctx.strokeRect(10, 10, 380, 230);

        // Header text
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 15px sans-serif';
        ctx.fillText(textLine1.slice(0, 35), 25, 60);

        // Subtitle text
        ctx.fillStyle = '#D4AF37';
        ctx.font = '13px monospace';
        ctx.fillText(textLine2.slice(0, 38), 25, 100);

        ctx.fillStyle = '#10B981';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText('CELESTIA 26 TEST VERIFIED ATTACHMENT', 25, 180);

        const dataUrl = canvas.toDataURL('image/png');
        const b64 = dataUrl.split(',')[1];
        const bstr = atob(b64);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        return new File([u8arr], filename, { type: 'image/png' });
      }
    } catch {}
  }
  // Fallback 1px dummy
  const dummyText = `CELESTIA26_TEST_${filename}`;
  return new File([dummyText], filename, { type: 'image/png' });
}

// 9 Fictional Colleges (including Host College for waiver testing)
const TEST_COLLEGES = [
  { name: 'Madras Medical College, Chennai', city: 'Chennai', state: 'Tamil Nadu', isHost: false },
  { name: 'Stanley Medical College, Chennai', city: 'Stanley', state: 'Tamil Nadu', isHost: false },
  { name: 'Kilpauk Medical College, Chennai', city: 'Kilpauk', state: 'Tamil Nadu', isHost: false },
  { name: 'Christian Medical College, Vellore', city: 'Vellore', state: 'Tamil Nadu', isHost: false },
  { name: 'Government Medical College, Trichy', city: 'Trichy', state: 'Tamil Nadu', isHost: false },
  { name: 'PSG Institute of Medical Sciences, Coimbatore', city: 'Coimbatore', state: 'Tamil Nadu', isHost: false },
  { name: 'JIPMER, Puducherry', city: 'Puducherry', state: 'Puducherry', isHost: false },
  { name: 'St. John\'s Medical College, Bangalore', city: 'Bangalore', state: 'Karnataka', isHost: false },
  { name: 'Srinivasan Medical College and Hospital, Trichy', city: 'Trichy', state: 'Tamil Nadu', isHost: true },
];

// Synthetic Indian Names for test roster generation
const SYNTHETIC_NAMES = [
  'Aravind Swaminathan', 'Priya Venkatesh', 'Kavya Sundaram', 'Rohan Mehta', 'Ananya Sharma',
  'Karthik Raja', 'Sneha Menon', 'Deepak Kumar', 'Meera Nair', 'Siddharth Varma',
  'Divya Ramakrishnan', 'Gautam Adiga', 'Ishita Banerji', 'Pranav Kulkarni', 'Tarun Nambiar',
  'Harini Natarajan', 'Rahul Bose', 'Shalini Hegde', 'Varun Kapoor', 'Pooja Reddy',
  'Aditya Deshmukh', 'Bhavana Iyer', 'Chaitanya Rao', 'Deepika Pillai', 'Eashwar Subramanian'
];

/**
 * Utility to generate exactly 25 fictional test registrations for Celestia'26 Admin testing
 */
export const testDataGenerator = {
  /**
   * Generates exactly 25 test records in Supabase (or local storage if offline)
   */
  async generate25TestRegistrations(): Promise<TestGeneratorResult> {
    const result: TestGeneratorResult = {
      success: false,
      totalAttempted: 25,
      successCount: 0,
      failureCount: 0,
      errors: [],
      records: [],
    };

    const totalToGenerate = 25;

    for (let i = 1; i <= totalToGenerate; i++) {
      const padNum = String(i).padStart(3, '0');
      const regCode = `TEST-REG-2026-${padNum}`;
      
      // Select event deterministically across all 14 events
      const eventIndex = (i - 1) % EVENTS_DATA.length;
      const event: EventItem = EVENTS_DATA[eventIndex];

      // Select college (25th is host college SMCH for zero-fee test)
      const collegeObj = TEST_COLLEGES[(i - 1) % TEST_COLLEGES.length];
      const isHost = collegeObj.isHost;

      // Determine participant count matching event constraints
      let participantCount = 1;
      if (event.type === 'Duo') {
        participantCount = 2;
      } else if (event.type === 'Team') {
        const minP = event.minParticipants || 3;
        const maxP = event.maxParticipants || 8;
        // Vary participant count naturally within min & max
        participantCount = Math.min(minP + (i % (maxP - minP + 1)), maxP);
      }

      // Generate synthetic participants
      const participants = [];
      for (let pIdx = 0; pIdx < participantCount; pIdx++) {
        const nameIdx = (i * 3 + pIdx) % SYNTHETIC_NAMES.length;
        const fullName = `${SYNTHETIC_NAMES[nameIdx]} [TEST]`;
        const role = pIdx === 0 
          ? (participantCount === 1 ? 'Individual Participant' : 'Team Captain / Primary Contact') 
          : `Team Member ${pIdx + 1}`;
        const mobile = `+9198000${String(i * 100 + pIdx).padStart(5, '0')}`;
        const email = `test.student.${padNum}.${pIdx + 1}@test.celestia26.org`;
        
        participants.push({
          fullName,
          gender: pIdx % 2 === 0 ? 'Male' : 'Female',
          age: String(19 + (pIdx % 5)),
          mobile,
          email,
          role,
          idCardStoragePath: `roster/${regCode}/test_id_card_${pIdx + 1}.jpg`,
        });
      }

      // Calculate total fee (0 for host college)
      const feePerUnit = isHost ? 0 : event.feeAmount;
      const totalFee = isHost 
        ? 0 
        : (event.feeType === 'per_head' ? event.feeAmount * participantCount : event.feeAmount);

      const teamName = event.type === 'Solo' 
        ? `[TEST-DATA] ${event.title}` 
        : `[TEST-DATA] ${collegeObj.name.split(',')[0]} Team ${padNum}`;

      const utrNumber = isHost ? 'TEST-SMCH-HOST-WAIVER' : `TEST-UTR-2026-${String(9000 + i)}`;

      // Prepare database insert objects
      const regId = typeof crypto !== 'undefined' && crypto.randomUUID 
        ? crypto.randomUUID() 
        : `test-uuid-2026-${padNum}-0000-000000000000`;

      const regInsert = {
        id: regId,
        registration_code: regCode,
        event_code: event.code,
        event_type: event.type,
        team_name: teamName,
        college_name: collegeObj.name,
        college_city: collegeObj.city,
        college_state: collegeObj.state,
        college_contact_person: participants[0].fullName,
        college_contact_mobile: participants[0].mobile,
        college_contact_email: participants[0].email,
        is_college_delegation: true,
        participant_count: participantCount,
        fee_per_unit: feePerUnit,
        fee_type: event.feeType,
        total_fee: totalFee,
        registration_status: 'Submitted',
        rules_accepted: true,
        rules_version: 'v1.0-celestia26-test',
        rules_accepted_at: new Date().toISOString(),
      };

      if (!isSupabaseConfigured || !supabase) {
        // Local offline record creation
        try {
          const savedStr = localStorage.getItem('celestia26_registrations');
          const existing = savedStr ? JSON.parse(savedStr) : [];
          
          const localObj: RegistrationSubmission = {
            id: regCode,
            registrationCode: regCode,
            userId: 'test-user',
            eventId: event.id,
            eventTitle: event.title,
            eventCode: event.code,
            eventCategory: event.categoryDisplay,
            eventType: event.type,
            venue: event.venue,
            dateStr: 'Nov 3 - 5, 2026',
            duration: event.duration,
            college: {
              collegeName: collegeObj.name,
              city: collegeObj.city,
              state: collegeObj.state,
              contactPerson: participants[0].fullName,
              contactMobile: participants[0].mobile,
              contactEmail: participants[0].email,
              isCollegeDelegation: true,
              isHostCollege: isHost,
            },
            isHostCollege: isHost,
            teamName,
            participants: participants.map((p) => ({
              fullName: p.fullName,
              gender: p.gender as 'Male' | 'Female',
              age: p.age,
              mobile: p.mobile,
              email: p.email,
              role: p.role,
              idCardFileName: 'test_id_proof.jpg',
            })),
            feePerUnit,
            feeType: event.feeType,
            totalAmount: totalFee,
            utrNumber,
            paymentScreenshotName: 'test_payment_slip.png',
            paymentConfirmed: isHost,
            paymentStatus: 'Submitted',
            registrationStatus: 'Submitted',
            createdAt: new Date().toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            }),
          };

          existing.unshift(localObj);
          localStorage.setItem('celestia26_registrations', JSON.stringify(existing));

          result.successCount++;
          result.records.push({
            code: regCode,
            eventTitle: event.title,
            collegeName: collegeObj.name,
            participantCount,
            utrNumber,
            totalFee,
            isHost,
            status: 'Stored (Local Test Mode)',
          });
        } catch (e) {
          result.failureCount++;
          result.errors.push(`Record ${padNum} local storage failed: ${e}`);
        }
        continue;
      }

      // Execute Supabase inserts
      try {
        // 1. Upload payment receipt image Blob to 'payment-proofs' storage bucket
        let paymentScreenshotPath: string | null = null;
        try {
          const receiptFile = createSyntheticImageFile(
            `${regCode}_receipt.png`,
            `Celestia'26 Payment Receipt · ${regCode}`,
            `UTR: ${utrNumber} | Amount: Rs.${totalFee}`
          );
          paymentScreenshotPath = await supabaseRegistrationService.uploadPaymentScreenshot(regCode, receiptFile);
        } catch {
          paymentScreenshotPath = `receipts/${regCode}/test_receipt.png`;
        }

        // 2. Upload participant ID card image Blobs to 'id-cards' storage bucket
        const participantRows = [];
        for (let pIdx = 0; pIdx < participants.length; pIdx++) {
          const p = participants[pIdx];
          let uploadedPath: string | null = null;
          try {
            const idCardFile = createSyntheticImageFile(
              `${regCode}_id_card_${pIdx + 1}.png`,
              `Celestia'26 Student ID Card · ${regCode}`,
              `Name: ${p.fullName} | Role: ${p.role}`
            );
            uploadedPath = await supabaseRegistrationService.uploadIdCard(regCode, pIdx, idCardFile);
          } catch {
            uploadedPath = p.idCardStoragePath;
          }

          participantRows.push({
            registration_id: regId,
            full_name: p.fullName,
            gender: p.gender,
            age: parseInt(p.age, 10),
            mobile: p.mobile,
            email: p.email,
            role: p.role,
            id_card_storage_path: uploadedPath || p.idCardStoragePath,
          });
        }

        // 3. Insert registrations row
        const { error: regErr } = await supabase.from('registrations').insert([regInsert]);
        if (regErr) {
          result.failureCount++;
          result.errors.push(`Record ${padNum} (${regCode}) registration insert error: ${regErr.message}`);
          continue;
        }

        // 4. Insert participants rows
        const { error: partErr } = await supabase.from('participants').insert(participantRows);
        if (partErr) {
          console.warn(`Record ${padNum} participants insert notice:`, partErr.message);
        }

        // 5. Insert payment_submissions row
        const payRow = {
          registration_id: regId,
          utr_number: utrNumber,
          amount_paid: totalFee,
          payment_screenshot_path: paymentScreenshotPath || `receipts/${regCode}/test_receipt.png`,
          payment_status: 'Submitted',
        };

        const { error: payErr } = await supabase.from('payment_submissions').insert([payRow]);
        if (payErr) {
          console.warn(`Record ${padNum} payment insert notice:`, payErr.message);
        }

        result.successCount++;
        result.records.push({
          code: regCode,
          eventTitle: event.title,
          collegeName: collegeObj.name,
          participantCount,
          utrNumber,
          totalFee,
          isHost,
          status: 'Inserted (Supabase Cloud)',
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Insert exception';
        result.failureCount++;
        result.errors.push(`Record ${padNum} exception: ${msg}`);
      }
    }

    result.success = result.successCount === totalToGenerate;
    return result;
  },

  /**
   * Safely purges only the generated 25 test records without affecting genuine registrations
   */
  async purgeTestRegistrations(): Promise<TestPurgeResult> {
    let deletedCount = 0;

    // 1. Clean LocalStorage test records
    try {
      const savedStr = localStorage.getItem('celestia26_registrations');
      if (savedStr) {
        const parsed = JSON.parse(savedStr);
        const filtered = parsed.filter(
          (r: any) => 
            !String(r.id || '').startsWith('TEST-REG-2026-') &&
            !String(r.registrationCode || '').startsWith('TEST-REG-2026-') &&
            !String(r.teamName || '').includes('[TEST-DATA]')
        );
        deletedCount += (parsed.length - filtered.length);
        localStorage.setItem('celestia26_registrations', JSON.stringify(filtered));
      }
    } catch (err) {
      console.warn('LocalStorage test purge notice:', err);
    }

    if (!isSupabaseConfigured || !supabase) {
      return {
        success: true,
        deletedCount,
        message: `Successfully purged ${deletedCount} local test records.`,
      };
    }

    // 2. Clean Supabase Cloud test records
    try {
      // Find all test registrations by test registration_code pattern or team_name pattern
      const { data: testRegs, error: fetchErr } = await supabase
        .from('registrations')
        .select('id, registration_code')
        .or('registration_code.ilike.TEST-REG-2026-%,team_name.ilike.[TEST-DATA]%');

      if (fetchErr) {
        return {
          success: false,
          deletedCount: 0,
          message: `Failed to find test records in database: ${fetchErr.message}`,
        };
      }

      if (!testRegs || testRegs.length === 0) {
        return {
          success: true,
          deletedCount,
          message: 'No test records found in database to purge.',
        };
      }

      const testIds = testRegs.map((r) => r.id);

      // Delete child participant and payment rows
      await supabase.from('participants').delete().in('registration_id', testIds);
      await supabase.from('payment_submissions').delete().in('registration_id', testIds);

      // Delete parent registration rows
      const { error: delErr } = await supabase
        .from('registrations')
        .delete()
        .in('id', testIds);

      if (delErr) {
        return {
          success: false,
          deletedCount,
          message: `Failed to delete test registration rows: ${delErr.message}`,
        };
      }

      const totalCloudDeleted = testRegs.length;
      return {
        success: true,
        deletedCount: totalCloudDeleted + deletedCount,
        message: `Successfully deleted ${totalCloudDeleted} test database records and cleaned local test state.`,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Purge error';
      return {
        success: false,
        deletedCount,
        message: `Exception during test purge: ${msg}`,
      };
    }
  },
};
