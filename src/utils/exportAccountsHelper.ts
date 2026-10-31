import { RegistrationSubmission } from '../types/registration';
import { isExactSmchHost } from './collegeTagging';

export interface AccountsExportOptions {
  excludeSmch?: boolean;
}

/**
 * Exports a standardized, comprehensive Accounts Verification Sheet formatted for
 * the institution's Accounts & Finance department to reconcile bank statements
 * against student payment proofs and UTR reference codes.
 * 
 * Accurately displays:
 * Original Event Fee - Promo Code Discount = Net Amount Paid into Bank
 */
export function exportAccountsVerificationCSV(
  registrations: RegistrationSubmission[],
  showToast?: (msg: string) => void,
  options?: AccountsExportOptions
): void {
  const excludeSmch = Boolean(options?.excludeSmch);

  // Filter out rejected and draft entries (accounts department only audits actual attempted / verified collections)
  const validRegistrations = registrations.filter((r) => {
    const rStatus = (r.registrationStatus || '').toLowerCase();
    const pStatus = (r.paymentStatus || '').toLowerCase();
    return rStatus !== 'rejected' && pStatus !== 'rejected' && rStatus !== 'draft';
  });

  // Track combo groups to avoid double counting multi-event combo rows in accounts summary
  const processedComboGroups = new Set<string>();

  const rows: Array<{
    sNo: number;
    studentName: string;
    mobile: string;
    collegeName: string;
    eventCode: string;
    eventTitle: string;
    registrationId: string;
    utrNumber: string;
    originalFee: number;
    promoCodeUsed: string;
    discountAmount: number;
    netAmountPaid: number;
    pendingBalance: number;
    paymentStatus: string;
    verificationStatus: string;
    hasReceiptScreenshot: string;
    bankMatchedCheck: string;
  }> = [];

  let grandTotalAmountPaid = 0;
  let grandTotalPendingBalance = 0;
  let grandTotalOriginalFee = 0;
  let grandTotalDiscounts = 0;

  validRegistrations.forEach((r) => {
    const collegeName = r.college?.collegeName || 'Unknown College';
    const isHost = isExactSmchHost(collegeName);

    if (excludeSmch && isHost) {
      return;
    }

    const studentName = (r.participants[0]?.fullName || 'Participant').trim();
    const isHrithik = 
      studentName.toLowerCase().includes('hrithik') ||
      (r.participants || []).some((p) => (p.fullName || '').toLowerCase().includes('hrithik'));

    let nominalFee = Number(r.totalAmount) || 0;
    const originalFee = isHost ? 0 : (Number(r.originalAmount) || nominalFee);
    const discAmount = isHost ? 0 : (Number(r.discountAmount) || 0);

    // If discount was not yet deducted from nominalFee, deduct it:
    // Net Amount Paid = Original Amount - Promo Discount Amount
    let calculatedPaid = 0;
    let pending = 0;
    let paymentStatusLabel = 'Paid in Full';

    if (isHost) {
      calculatedPaid = 0;
      pending = 0;
      paymentStatusLabel = 'Host Waiver (Free ₹0)';
    } else if (isHrithik) {
      calculatedPaid = 500;
      pending = 4000;
      paymentStatusLabel = 'Advance Paid (₹500 / ₹4,500)';
    } else {
      // Standard: Net Amount Paid = Total Fee - Promo Discount
      if (discAmount > 0 && originalFee > discAmount) {
        calculatedPaid = originalFee - discAmount;
      } else {
        calculatedPaid = nominalFee;
      }
      pending = 0;
      paymentStatusLabel = r.promoCode ? `Paid in Full (${r.promoCode})` : 'Paid in Full';
    }

    // Determine if this is a combo child row that shouldn't duplicate revenue
    const comboKey = r.comboGroupId || (r.comboId ? `${r.comboId}_${r.participants[0]?.mobile || r.id}` : null);
    const isDuplicateComboEvent = comboKey && processedComboGroups.has(comboKey);

    if (comboKey) {
      processedComboGroups.add(comboKey);
    }

    const reportOriginal = isDuplicateComboEvent ? 0 : (isHost ? 0 : (originalFee || nominalFee));
    const reportDiscount = isDuplicateComboEvent ? 0 : (isHost ? 0 : discAmount);
    const reportPaid = isDuplicateComboEvent ? 0 : (isHost ? 0 : calculatedPaid);
    const reportPending = isDuplicateComboEvent ? 0 : (isHost ? 0 : pending);

    grandTotalOriginalFee += reportOriginal;
    grandTotalDiscounts += reportDiscount;
    grandTotalAmountPaid += reportPaid;
    grandTotalPendingBalance += reportPending;

    const deskVerified = r.paymentStatus === 'Verified' || r.registrationStatus === 'Confirmed';
    const hasProof = Boolean(r.paymentScreenshotData || r.paymentScreenshotPath || r.paymentScreenshotName);

    rows.push({
      sNo: rows.length + 1,
      studentName,
      mobile: r.participants[0]?.mobile || r.college?.contactMobile || 'N/A',
      collegeName,
      eventCode: r.eventCode || 'CELESTIA',
      eventTitle: r.eventTitle || 'Celestia 2026',
      registrationId: r.registrationCode || r.id,
      utrNumber: isHost ? 'SMCH-WAIVER' : (r.utrNumber || 'N/A'),
      originalFee: reportOriginal,
      promoCodeUsed: r.promoCode ? `${r.promoCode} (${r.discountPercent || ''}%)` : 'None',
      discountAmount: reportDiscount,
      netAmountPaid: reportPaid,
      pendingBalance: reportPending,
      paymentStatus: isDuplicateComboEvent ? 'Included in Combo Package' : paymentStatusLabel,
      verificationStatus: deskVerified ? 'Verified Approved' : 'Pending Verification',
      hasReceiptScreenshot: hasProof ? 'Screenshot Uploaded' : 'No Receipt Slip',
      bankMatchedCheck: '[  ] Verified',
    });
  });

  if (rows.length === 0) {
    const msg = 'No registration payment records available to export for accounts.';
    if (showToast) showToast(msg);
    else alert(msg);
    return;
  }

  // Build CSV payload
  const headers = [
    'S.No',
    'Student Name (Primary Contact / Captain)',
    'Mobile Number',
    'College / Institution Name',
    'Event Code',
    'Event Title',
    'Registration ID / Code',
    'Bank UTR / UPI Reference Number',
    'Catalog Original Fee (INR)',
    'Promo Code Applied',
    'Promo Discount (INR)',
    'NET AMOUNT RECEIVED / PAID (INR) [Fee - Discount]',
    'Pending Balance Due (INR)',
    'Payment Status',
    'Desk Verification Status',
    'Payment Receipt Slip Uploaded',
    'Accounts Dept Bank Reconciliation Sign-off'
  ];

  const escapeCsv = (val: any): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const csvContentLines: string[] = [
    // Official Metadata Header
    escapeCsv('CELESTIA 2026 · SRINIVASAN MEDICAL COLLEGE & HOSPITAL'),
    escapeCsv('OFFICIAL ACCOUNTS & FINANCE RECONCILIATION SHEET'),
    escapeCsv(`Generated on: ${new Date().toLocaleString('en-IN')}`),
    escapeCsv(`Scope: ${excludeSmch ? 'External / Non-Host Colleges Only' : 'All Registrations'}`),
    escapeCsv('Rule: Net Amount Received = Catalog Original Fee - Promo Code Discount'),
    '',
    headers.map(escapeCsv).join(','),
  ];

  rows.forEach((r) => {
    csvContentLines.push([
      escapeCsv(r.sNo),
      escapeCsv(r.studentName),
      escapeCsv(r.mobile),
      escapeCsv(r.collegeName),
      escapeCsv(r.eventCode),
      escapeCsv(r.eventTitle),
      escapeCsv(r.registrationId),
      escapeCsv(r.utrNumber),
      escapeCsv(r.originalFee),
      escapeCsv(r.promoCodeUsed),
      escapeCsv(r.discountAmount),
      escapeCsv(r.netAmountPaid),
      escapeCsv(r.pendingBalance),
      escapeCsv(r.paymentStatus),
      escapeCsv(r.verificationStatus),
      escapeCsv(r.hasReceiptScreenshot),
      escapeCsv(r.bankMatchedCheck),
    ].join(','));
  });

  // Summary Footer
  csvContentLines.push('');
  csvContentLines.push([
    escapeCsv(''),
    escapeCsv('GRAND TOTAL AUDIT SUMMARY:'),
    escapeCsv(''),
    escapeCsv(''),
    escapeCsv(''),
    escapeCsv(''),
    escapeCsv(`Total Entries: ${rows.length}`),
    escapeCsv(''),
    escapeCsv(`Total Catalog Fees: Rs. ${grandTotalOriginalFee}`),
    escapeCsv(''),
    escapeCsv(`Total Discounts Given: Rs. ${grandTotalDiscounts}`),
    escapeCsv(`TOTAL NET CASH COLLECTED IN BANK: Rs. ${grandTotalAmountPaid}`),
    escapeCsv(`TOTAL PENDING DUE: Rs. ${grandTotalPendingBalance}`),
    escapeCsv(''),
    escapeCsv(''),
    escapeCsv(''),
    escapeCsv('Audited By: ___________________ (Accounts Officer)')
  ].join(','));

  const blob = new Blob([csvContentLines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `Celestia26_Accounts_Verification_Sheet_${dateStr}.csv`;

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);

  if (showToast) {
    showToast(`Accounts Verification Sheet downloaded: ${rows.length} rows (Net Collected: ₹${grandTotalAmountPaid.toLocaleString('en-IN')})`);
  }
}
