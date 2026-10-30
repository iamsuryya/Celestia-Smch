import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Users, 
  Eye, 
  Edit3, 
  CheckCircle, 
  CheckCircle2,
  AlertCircle, 
  Clock, 
  PauseCircle, 
  XCircle, 
  Trash2, 
  Download, 
  Search, 
  Filter, 
  RefreshCw, 
  ExternalLink, 
  Building2, 
  CreditCard, 
  FileText, 
  Calendar, 
  ArrowLeft, 
  X, 
  Sparkles,
  Save,
  Check,
  AlertTriangle,
  UserCheck,
  Image as ImageIcon,
  FileImage,
  ZoomIn,
  RotateCcw,
  FileQuestion,
  Phone,
  Mail,
  MapPin,
  User,
  GraduationCap,
  Sliders,
  Play,
  Square,
  KeyRound,
  Database,
  Cloud,
  CloudOff,
  Info,
  Copy,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Building,
  LogOut,
  Layers,
  Tag,
  Percent,
  Plus,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { useRegistration } from '../context/RegistrationContext';
import { RegistrationSubmission, ParticipantMember, PromoCode, PaymentStatus } from '../types/registration';
import { EVENTS_DATA } from '../data/festivalData';
import { promoCodeService } from '../services/promoCodeService';
import { 
  isEventRegistrationOpen, 
  setEventRegistrationOpen, 
  setAllEventsRegistrationOpen, 
  getEventRegistrationStatusMap,
  getSmchPasscode,
  setSmchPasscode,
  isAutoApproveEnabled,
  setAutoApproveEnabled
} from '../utils/registrationStatus';
import { 
  isSupabaseConfigured, 
  supabase,
  setCustomSupabaseCredentials,
  clearCustomSupabaseCredentials 
} from '../lib/supabase';
import { supabaseRegistrationService, CloudDiagnostics } from '../services/supabaseRegistrationService';
import { 
  authenticateProfile, 
  persistAuthRole, 
  clearAuthSession, 
  getCurrentAuthRole, 
  UserRole,
  AUTH_PROFILES,
  requestPasswordReset
} from '../lib/authProfiles';
import { InchargesPortalPage } from './InchargesPortalPage';
import { testDataGenerator, TestGeneratorResult, TestPurgeResult } from '../services/testDataGenerator';
import { exportVerifiedByEventCSV } from '../utils/exportVerifiedHelper';

interface Admin1RegistrationsPageProps {
  onExit: () => void;
  onNavigateToTabulation?: () => void;
}

export type DeskStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'NOT_COMPLETE';

/**
 * Maps a registration to one of the 4 explicit admin desk states:
 * 1. PENDING: Admin didn't do anything yet (default state for submitted entries)
 * 2. VERIFIED: Admin clicked the Verified button
 * 3. REJECTED: Admin clicked the Reject button
 * 4. NOT_COMPLETE: The person didn't complete registration (draft / incomplete / flagged)
 */
export function getDeskStatus(reg: RegistrationSubmission): DeskStatus {
  if (reg.paymentStatus === 'Verified' || reg.registrationStatus === 'Confirmed') {
    return 'VERIFIED';
  }
  if (reg.paymentStatus === 'Rejected' || reg.registrationStatus === 'Rejected') {
    return 'REJECTED';
  }
  if (
    reg.registrationStatus === 'Draft' || 
    !reg.paymentConfirmed || 
    reg.utrNumber === 'NOT_SUBMITTED'
  ) {
    return 'NOT_COMPLETE';
  }
  return 'PENDING';
}

export const Admin1RegistrationsPage: React.FC<Admin1RegistrationsPageProps> = ({
  onExit,
  onNavigateToTabulation,
}) => {
  const { myRegistrations } = useRegistration();

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return (
      sessionStorage.getItem('celestia_admin_auth') === 'true' || 
      sessionStorage.getItem('celestia_admin1_auth') === 'true' ||
      sessionStorage.getItem('celestia_incharges_auth') === 'true'
    );
  });
  const [activeRole, setActiveRole] = useState<UserRole | null>(() => getCurrentAuthRole());
  const [viewingInchargesDesk, setViewingInchargesDesk] = useState(false);
  const [roleTab, setRoleTab] = useState<UserRole>('admin');
  const [loginUsername, setLoginUsername] = useState('Admin');
  const [authMode, setAuthMode] = useState<'profile_pass' | 'supabase_auth'>('profile_pass');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [passkeyInput, setPasskeyInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotInput, setForgotInput] = useState('');
  const [forgotResult, setForgotResult] = useState<{ success: boolean; message: string; targetEmail: string } | null>(null);
  const [isSubmittingForgot, setIsSubmittingForgot] = useState(false);

  // Registrations state
  const [cloudRegistrations, setCloudRegistrations] = useState<RegistrationSubmission[]>([]);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [cloudDiagnostics, setCloudDiagnostics] = useState<CloudDiagnostics | null>(null);
  const [isCheckingCloud, setIsCheckingCloud] = useState(false);
  const [showCloudModal, setShowCloudModal] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // Test Generator Suite State
  const [showTestGeneratorModal, setShowTestGeneratorModal] = useState(false);
  const [isGeneratingTest, setIsGeneratingTest] = useState(false);
  const [testGenResult, setTestGenResult] = useState<TestGeneratorResult | null>(null);
  const [isPurgingTest, setIsPurgingTest] = useState(false);
  const [testPurgeResult, setTestPurgeResult] = useState<TestPurgeResult | null>(null);

  const handleGenerate25TestRecords = async () => {
    setIsGeneratingTest(true);
    setTestGenResult(null);
    try {
      const res = await testDataGenerator.generate25TestRegistrations();
      setTestGenResult(res);
      showToast(`Generated ${res.successCount} test registrations successfully!`);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Generator failed';
      showToast(`Test generation error: ${msg}`);
    } finally {
      setIsGeneratingTest(false);
    }
  };

  const handlePurgeTestRecords = async () => {
    if (!window.confirm('Are you sure you want to delete all 25 test records? This operation removes only test entries with registration codes matching TEST-REG-2026-*.')) {
      return;
    }
    setIsPurgingTest(true);
    setTestPurgeResult(null);
    try {
      const res = await testDataGenerator.purgeTestRegistrations();
      setTestPurgeResult(res);
      showToast(res.message);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Purge failed';
      showToast(`Purge error: ${msg}`);
    } finally {
      setIsPurgingTest(false);
    }
  };

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'VERIFIED' | 'REJECTED' | 'NOT_COMPLETE'>('ALL');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<'ALL' | 'PENDING' | 'ADVANCE_PAID' | 'PAID_IN_FULL'>('ALL');
  const [regTypeFilter, setRegTypeFilter] = useState<'ALL' | 'INDIVIDUAL' | 'COMBO'>('ALL');
  const [institutionFilter, setInstitutionFilter] = useState<'ALL' | 'DELEGATION' | 'SMCH_HOST' | 'OTHER_COLLEGE'>('ALL');
  const [eventFilter, setEventFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'amount_desc' | 'amount_asc' | 'event' | 'college'>('newest');

  // Modals state
  const [inspectRegistration, setInspectRegistration] = useState<RegistrationSubmission | null>(null);
  const [paymentInputTotal, setPaymentInputTotal] = useState<number>(0);
  const [paymentInputPaid, setPaymentInputPaid] = useState<number>(0);
  const [paymentInputNotes, setPaymentInputNotes] = useState<string>('');
  const [isSavingPayment, setIsSavingPayment] = useState<boolean>(false);

  useEffect(() => {
    if (inspectRegistration) {
      const tot = Number(inspectRegistration.totalAmount) || 0;
      const initialPaid = inspectRegistration.paidAmount !== undefined 
        ? inspectRegistration.paidAmount 
        : (inspectRegistration.paymentConfirmed ? tot : 0);
      setPaymentInputTotal(tot);
      setPaymentInputPaid(initialPaid);
      setPaymentInputNotes(inspectRegistration.paymentNotes || '');
    }
  }, [inspectRegistration]);
  const [editingRegistration, setEditingRegistration] = useState<RegistrationSubmission | null>(null);
  const [rejectModalRegistration, setRejectModalRegistration] = useState<RegistrationSubmission | null>(null);
  const [rejectReasonInput, setRejectReasonInput] = useState('Payment UTR mismatch or invalid proof');
  const [incompleteModalRegistration, setIncompleteModalRegistration] = useState<RegistrationSubmission | null>(null);
  const [incompleteReasonInput, setIncompleteReasonInput] = useState('Missing required student credentials or incomplete fee remittance');
  const [deleteConfirmRegistration, setDeleteConfirmRegistration] = useState<RegistrationSubmission | null>(null);

  // Multi-selection & Bulk operations state (Main Admin Only)
  const [selectedRegIds, setSelectedRegIds] = useState<string[]>([]);
  const [showEventClassificationModal, setShowEventClassificationModal] = useState<boolean>(false);
  const [bulkDeleteConfirmModal, setBulkDeleteConfirmModal] = useState<boolean>(false);
  const [showExportScopeModal, setShowExportScopeModal] = useState<boolean>(false);

  // Promo Code Modal & Management State
  const [showPromoCodeModal, setShowPromoCodeModal] = useState<boolean>(false);
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loadingPromos, setLoadingPromos] = useState<boolean>(false);
  const [newCodeName, setNewCodeName] = useState<string>('');
  const [newCodeDiscount, setNewCodeDiscount] = useState<string>('');
  const [newCodeDesc, setNewCodeDesc] = useState<string>('');
  const [newCodeScope, setNewCodeScope] = useState<'individual' | 'combo' | 'all'>('individual');
  const [newCodeDiscountType, setNewCodeDiscountType] = useState<'percentage' | 'advance'>('percentage');
  const [newCodeAdvanceAmount, setNewCodeAdvanceAmount] = useState<string>('750');
  const [isCreatingPromo, setIsCreatingPromo] = useState<boolean>(false);
  const [editingPromoId, setEditingPromoId] = useState<string | null>(null);
  const [editPromoCode, setEditPromoCode] = useState<string>('');
  const [editPromoDiscount, setEditPromoDiscount] = useState<string>('');
  const [editPromoDesc, setEditPromoDesc] = useState<string>('');

  const handleStartEditPromo = (p: PromoCode) => {
    setEditingPromoId(p.id);
    setEditPromoCode(p.code);
    setEditPromoDiscount(String(p.discountPercent || 0));
    setEditPromoDesc(p.description || '');
  };

  const handleSavePromoEdit = async () => {
    if (!editingPromoId) return;
    const target = promoCodes.find(p => p.id === editingPromoId);
    if (!target) return;

    const discVal = parseFloat(editPromoDiscount) || 0;
    if (!editPromoCode.trim()) {
      showToast('Please enter a valid promo code string.');
      return;
    }
    if (isNaN(discVal) || discVal <= 0 || discVal > 100) {
      showToast('Discount percentage must be between 1% and 100%.');
      return;
    }

    try {
      const res = await promoCodeService.createPromoCode(
        editPromoCode,
        discVal,
        editPromoDesc,
        target.applicableScope || 'all',
        target.discountType || 'percentage',
        target.advanceAmount,
        target.id
      );
      showToast(res.message);
      setEditingPromoId(null);
      loadPromoCodes();
    } catch {
      showToast('Failed to update promo code.');
    }
  };

  const loadPromoCodes = async () => {
    setLoadingPromos(true);
    try {
      await promoCodeService.syncAllToSupabase();
      const data = await promoCodeService.getPromoCodes();
      setPromoCodes(data);
    } catch {
      // ignore
    } finally {
      setLoadingPromos(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadPromoCodes();
      const unsubscribe = promoCodeService.subscribeToRealtimePromos((updatedCodes) => {
        setPromoCodes(updatedCodes);
      });
      return () => {
        unsubscribe();
      };
    }
  }, [isAuthenticated]);

  const isMainAdmin = activeRole === 'admin';

  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMainAdmin) {
      showToast('Permission Denied: Only Main Central Admin can create promo codes.');
      return;
    }

    const discountVal = parseFloat(newCodeDiscount) || 0;
    const advanceVal = parseFloat(newCodeAdvanceAmount) || 0;

    if (!newCodeName.trim()) {
      showToast('Please enter a promo code string (e.g. CELESTIA20 or AP750)');
      return;
    }

    if (newCodeDiscountType === 'advance') {
      if (!advanceVal || advanceVal <= 0) {
        showToast('Please enter a valid advance payment amount in ₹ (e.g. 750)');
        return;
      }
    } else {
      if (isNaN(discountVal) || discountVal <= 0 || discountVal > 100) {
        showToast('Discount percentage must be between 1% and 100%');
        return;
      }
    }

    setIsCreatingPromo(true);
    try {
      const res = await promoCodeService.createPromoCode(
        newCodeName,
        discountVal,
        newCodeDesc,
        newCodeScope,
        newCodeDiscountType,
        advanceVal
      );
      showToast(res.message);
      if (res.success) {
        setNewCodeName('');
        setNewCodeDiscount('');
        setNewCodeDesc('');
        setNewCodeAdvanceAmount('750');
        loadPromoCodes();
      }
    } catch {
      showToast('Failed to create promo code.');
    } finally {
      setIsCreatingPromo(false);
    }
  };

  const handleTogglePromoStatus = async (id: string, currentActive: boolean) => {
    if (!isMainAdmin) {
      showToast('Permission Denied: Only Main Central Admin can activate or deactivate promo codes.');
      return;
    }
    const nextActive = !currentActive;
    const res = await promoCodeService.togglePromoCodeStatus(id, nextActive);
    showToast(res.message);
    loadPromoCodes();
  };

  const handleDeletePromo = async (id: string) => {
    if (!isMainAdmin) {
      showToast('Permission Denied: Only Main Central Admin can delete promo codes.');
      return;
    }
    if (window.confirm('Delete this promo code permanently?')) {
      const res = await promoCodeService.deletePromoCode(id);
      showToast(res.message);
      loadPromoCodes();
    }
  };

  // Inline row expansion & copy helper for organized verification
  const [expandedRowIds, setExpandedRowIds] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const toggleExpandRow = (regId: string) => {
    setExpandedRowIds((prev) => ({
      ...prev,
      [regId]: !prev[regId],
    }));
  };

  const handleToggleExpandAll = () => {
    const allExpanded = filteredRegistrations.length > 0 && filteredRegistrations.every((r) => expandedRowIds[r.id]);
    const nextMap: Record<string, boolean> = {};
    if (!allExpanded) {
      filteredRegistrations.forEach((r) => {
        nextMap[r.id] = true;
      });
    }
    setExpandedRowIds(nextMap);
  };

  const handleCopyText = (text: string | undefined, key: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast(`${label} copied to clipboard!`);
    setTimeout(() => setCopiedKey(null), 2200);
  };

  const handleSavePaymentDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspectRegistration) return;

    if (!isMainAdmin) {
      showToast('Permission Denied: Only Main Central Admin can edit registration fee or payment details.');
      return;
    }

    const total = Math.max(0, Number(paymentInputTotal) || 0);
    const paid = Math.max(0, Number(paymentInputPaid) || 0);

    if (paid > total && total > 0) {
      if (!window.confirm(`Amount paid (₹${paid}) exceeds total registration fee (₹${total}). Do you wish to proceed?`)) {
        return;
      }
    }

    setIsSavingPayment(true);
    try {
      const res = await supabaseRegistrationService.updatePaymentDetails(
        inspectRegistration.id,
        paid,
        paymentInputNotes,
        total
      );
      if (res.success) {
        showToast(res.message || 'Payment details updated successfully!');
        const pend = Math.max(0, total - paid);
        let st: PaymentStatus = 'Pending';
        if (pend === 0 && total > 0) st = 'Paid in Full';
        else if (paid > 0) st = 'Advance Paid';

        const updatedReg: RegistrationSubmission = {
          ...inspectRegistration,
          totalAmount: total,
          paidAmount: paid,
          pendingAmount: pend,
          paymentNotes: paymentInputNotes,
          paymentStatus: st,
          paymentConfirmed: st === 'Paid in Full' || inspectRegistration.paymentConfirmed,
        };

        setInspectRegistration(updatedReg);

        setCloudRegistrations((prev) =>
          prev.map((r) =>
            r.id === inspectRegistration.id || r.registrationCode === inspectRegistration.registrationCode
              ? updatedReg
              : r
          )
        );

        await loadData();
      } else {
        showToast(`Failed to update payment: ${res.message}`);
      }
    } catch (err: any) {
      showToast(`Error saving payment: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsSavingPayment(false);
    }
  };

  const getWhatsAppLink = (mobile: string | undefined, captainName: string, eventTitle: string | undefined, regCode: string) => {
    if (!mobile) return '#';
    const cleanNumber = mobile.replace(/\D/g, '');
    const phoneWithCode = cleanNumber.length === 10 ? `91${cleanNumber}` : cleanNumber;
    const message = encodeURIComponent(
      `Hello ${captainName || 'Student'}, this is Celestia'26 Admin Desk regarding your registration (${regCode}) for ${eventTitle || 'the fest'}.`
    );
    return `https://wa.me/${phoneWithCode}?text=${message}`;
  };

  // Event Registration On/Off Controls
  const [showRegistrationControls, setShowRegistrationControls] = useState<boolean>(false);
  const [eventRegMap, setEventRegMap] = useState<Record<string, boolean>>(() => getEventRegistrationStatusMap());
  const [smchCodeInput, setSmchCodeInput] = useState(getSmchPasscode());
  const [savedPasscodeSuccess, setSavedPasscodeSuccess] = useState(false);

  const handleSaveSmchPasscode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!smchCodeInput.trim()) return;
    setSmchPasscode(smchCodeInput.trim());
    setSavedPasscodeSuccess(true);
    showToast(`SMCH Passcode updated to: ${smchCodeInput.trim()}`);
    setTimeout(() => setSavedPasscodeSuccess(false), 3000);
  };

  const handleToggleEventReg = (eventId: string, eventCode: string, currentOpen: boolean) => {
    const nextState = !currentOpen;
    setEventRegistrationOpen(eventId, nextState);
    setEventRegistrationOpen(eventCode, nextState);
    setEventRegMap(getEventRegistrationStatusMap());
    showToast(
      nextState 
        ? `Registration REOPENED for ${eventCode}. Students can now register.`
        : `Registration STOPPED for ${eventCode}. New entries are now blocked.`
    );
  };

  const handleStopAllReg = () => {
    setAllEventsRegistrationOpen(false);
    setEventRegMap(getEventRegistrationStatusMap());
    showToast('Registration STOPPED for ALL events.');
  };

  const handleReopenAllReg = () => {
    setAllEventsRegistrationOpen(true);
    setEventRegMap(getEventRegistrationStatusMap());
    showToast('Registration REOPENED for ALL events.');
  };

  const handleSaveRegistrationSettings = () => {
    const current = getEventRegistrationStatusMap();
    localStorage.setItem('celestia_event_registration_status', JSON.stringify(current));
    window.dispatchEvent(new CustomEvent('celestia-registration-status-changed'));
    showToast('Registration settings saved and applied successfully across Celestia\'26 portal!');
  };

  const [autoApproveOn, setAutoApproveOn] = useState<boolean>(() => isAutoApproveEnabled());

  const handleToggleAutoApprove = async () => {
    const nextState = !autoApproveOn;
    setAutoApproveOn(nextState);
    setAutoApproveEnabled(nextState);

    if (nextState) {
      showToast('AUTO-APPROVE ENABLED! Auto-verifying all existing and incoming registrations...');
      setLoading(true);
      await supabaseRegistrationService.autoApproveAllPendingRegistrations();
      await loadData();
      setLoading(false);
    } else {
      showToast('Auto-Approve Disabled. New registrations require manual admin verification.');
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotInput.trim()) return;
    setIsSubmittingForgot(true);
    try {
      const res = await requestPasswordReset(forgotInput.trim());
      setForgotResult(res);
    } catch {
      setForgotResult({
        success: true,
        message: 'Password recovery request registered. Please check your inbox or contact the festival convener.',
        targetEmail: forgotInput.trim(),
      });
    } finally {
      setIsSubmittingForgot(false);
    }
  };

  // Image Lightbox Viewer
  const [activeLightbox, setActiveLightbox] = useState<{
    url: string;
    title: string;
    subtitle?: string;
    fileName?: string;
  } | null>(null);

  // Edit form state (Main Central Admin Only)
  const [editFormData, setEditFormData] = useState<{
    captainName: string;
    captainEmail: string;
    captainMobile: string;
    teamName: string;
    collegeName: string;
    collegeCity: string;
    collegeState: string;
    contactPerson: string;
    contactMobile: string;
    contactEmail: string;
    utrNumber: string;
    adminNotes: string;
    participantCount: number;
    participants: ParticipantMember[];
    isHostCollege: boolean;
    totalAmount: number;
    paidAmount: number;
    pendingAmount: number;
    paymentStatus: PaymentStatus;
    feePerUnit: number;
    feeType: 'per_head' | 'per_team';
  }>({
    captainName: '',
    captainEmail: '',
    captainMobile: '',
    teamName: '',
    collegeName: '',
    collegeCity: '',
    collegeState: '',
    contactPerson: '',
    contactMobile: '',
    contactEmail: '',
    utrNumber: '',
    adminNotes: '',
    participantCount: 1,
    participants: [],
    isHostCollege: false,
    totalAmount: 0,
    paidAmount: 0,
    pendingAmount: 0,
    paymentStatus: 'Pending',
    feePerUnit: 0,
    feeType: 'per_head',
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3800);
  };

  // Helper to resolve an image URL (Data URL, Public HTTP, or Storage path)
  const getMediaUrl = (pathOrDataUrl?: string, bucket: 'id-cards' | 'payment-proofs' = 'payment-proofs') => {
    return supabaseRegistrationService.resolveMediaUrl(pathOrDataUrl, bucket);
  };

  // Fetch registrations from Supabase
  const loadData = async () => {
    setLoading(true);
    setIsCheckingCloud(true);
    try {
      const [data, diag] = await Promise.all([
        supabaseRegistrationService.fetchAdminRegistrations(),
        supabaseRegistrationService.getCloudDiagnostics(),
      ]);
      setCloudRegistrations(data);
      setCloudDiagnostics(diag);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
      setIsCheckingCloud(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  // Merge cloud with local state and enforce canonical event properties matching EVENTS_DATA
  const allRegistrations: RegistrationSubmission[] = useMemo(() => {
    const map = new Map<string, RegistrationSubmission>();

    const sanitizeRegistration = (r: RegistrationSubmission): RegistrationSubmission => {
      // Find matching official event from master catalog
      const matched = EVENTS_DATA.find((e) =>
        e.id.toLowerCase() === r.eventId?.toLowerCase() ||
        e.code.toLowerCase() === r.eventCode?.toLowerCase() ||
        e.title.toLowerCase() === r.eventTitle?.toLowerCase() ||
        (r.registrationCode && r.registrationCode.endsWith(`-${EVENTS_DATA.indexOf(e) + 1}`))
      );

      let targetEventId = r.eventId;
      let targetEventCode = r.eventCode;
      let targetEventTitle = r.eventTitle;
      let targetCategory = r.eventCategory;
      let targetType = r.eventType;
      let targetVenue = r.venue;

      if (matched) {
        targetEventId = matched.id;
        targetEventCode = matched.code;
        targetEventTitle = matched.title;
        targetCategory = matched.categoryDisplay;
        targetType = matched.type;
        targetVenue = matched.venue;
      } else if (
        r.eventTitle?.toLowerCase().includes('symphora') ||
        r.eventId?.toLowerCase().includes('symphora')
      ) {
        const symphora = EVENTS_DATA.find((e) => e.id === 'symphora');
        if (symphora) {
          targetEventId = symphora.id;
          targetEventCode = symphora.code;
          targetEventTitle = symphora.title;
          targetCategory = symphora.categoryDisplay;
          targetType = symphora.type;
          targetVenue = symphora.venue;
        }
      }

      const collegeName = (r.college?.collegeName || '').trim();
      const collegeNameLower = collegeName.toLowerCase();
      
      const isSmchHost = 
        typeof r.college?.isHostCollege === 'boolean'
          ? r.college.isHostCollege
          : typeof r.isHostCollege === 'boolean'
          ? r.isHostCollege
          : ((collegeNameLower.includes('srinivasan medical') && !collegeNameLower.includes('dhanalakshmi')) || 
             (Boolean(r.college?.hostRegisterNumber) && r.college?.hostRegisterNumber !== 'SMCH-STUDENT' && !collegeNameLower.includes('dhanalakshmi')));

      const isOfficialDelegation = !isSmchHost && Boolean(r.college?.isCollegeDelegation);

      const updatedCollege = {
        ...r.college,
        collegeName: collegeName || (isSmchHost ? 'Srinivasan Medical College and Hospital, Trichy' : 'Collegiate Institute'),
        isHostCollege: isSmchHost,
        isCollegeDelegation: isOfficialDelegation,
        city: r.college?.city || (isSmchHost ? 'Trichy' : ''),
        state: r.college?.state || (isSmchHost ? 'Tamil Nadu' : ''),
        hostBatch: r.college?.hostBatch || (isSmchHost ? 'MBBS' : undefined),
        hostRegisterNumber: r.college?.hostRegisterNumber || (isSmchHost ? 'SMCH-STUDENT' : undefined),
      };

      return {
        ...r,
        eventId: targetEventId,
        eventCode: targetEventCode,
        eventTitle: targetEventTitle,
        eventCategory: targetCategory,
        eventType: targetType,
        venue: targetVenue,
        isHostCollege: isSmchHost,
        college: updatedCollege,
      };
    };

    myRegistrations.forEach((r) => {
      const key = r.registrationCode || r.id;
      map.set(key, sanitizeRegistration(r));
    });
    cloudRegistrations.forEach((r) => {
      const key = r.registrationCode || r.id;
      map.set(key, sanitizeRegistration(r));
    });
    return Array.from(map.values());
  }, [myRegistrations, cloudRegistrations]);

  // Filtered registrations
  const filteredRegistrations = useMemo(() => {
    const list = allRegistrations.filter((r) => {
      const deskStatus = getDeskStatus(r);

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const captain = r.participants[0]?.fullName.toLowerCase() || '';
        const college = r.college?.collegeName.toLowerCase() || '';
        const id = r.id.toLowerCase();
        const code = r.eventCode.toLowerCase();
        const title = r.eventTitle?.toLowerCase() || '';
        const utr = (r.utrNumber || '').toLowerCase();
        const mobile = (r.participants[0]?.mobile || '').toLowerCase();
        const team = (r.teamName || '').toLowerCase();
        const hostReg = (r.college?.hostRegisterNumber || '').toLowerCase();
        const hostBatch = (r.college?.hostBatch || '').toLowerCase();

        if (
          !id.includes(q) &&
          !captain.includes(q) &&
          !college.includes(q) &&
          !code.includes(q) &&
          !title.includes(q) &&
          !utr.includes(q) &&
          !mobile.includes(q) &&
          !team.includes(q) &&
          !hostReg.includes(q) &&
          !hostBatch.includes(q)
        ) {
          return false;
        }
      }

      // Status filter
      if (statusFilter !== 'ALL' && deskStatus !== statusFilter) {
        return false;
      }

      // Payment Status Filter (ALL / PENDING / ADVANCE_PAID / PAID_IN_FULL)
      if (paymentStatusFilter !== 'ALL') {
        const totalFee = Number(r.totalAmount) || 0;
        const paid = Number(r.paidAmount !== undefined ? r.paidAmount : totalFee);
        const pending = Math.max(0, totalFee - paid);
        let status = r.paymentStatus || (pending === 0 && totalFee > 0 ? 'Paid in Full' : (paid > 0 ? 'Advance Paid' : 'Pending'));

        if (paymentStatusFilter === 'PENDING' && status !== 'Pending' && status !== 'Submitted') return false;
        if (paymentStatusFilter === 'ADVANCE_PAID' && status !== 'Advance Paid') return false;
        if (paymentStatusFilter === 'PAID_IN_FULL' && status !== 'Paid in Full' && status !== 'Verified') return false;
      }

      // Institution filter
      if (institutionFilter !== 'ALL') {
        const isHost = Boolean(r.isHostCollege || r.college?.isHostCollege);
        const isDelegation = !isHost && Boolean(r.college?.isCollegeDelegation);
        if (institutionFilter === 'SMCH_HOST' && !isHost) return false;
        if (institutionFilter === 'DELEGATION' && !isDelegation) return false;
        if (institutionFilter === 'OTHER_COLLEGE' && (isHost || isDelegation)) return false;
      }

      // Event filter
      if (eventFilter !== 'ALL' && r.eventCode !== eventFilter) {
        return false;
      }

      // Registration Format Filter (ALL / INDIVIDUAL / COMBO)
      const isCombo = Boolean(r.comboId || r.comboGroupId || r.comboName);
      if (regTypeFilter === 'INDIVIDUAL' && isCombo) return false;
      if (regTypeFilter === 'COMBO' && !isCombo) return false;

      return true;
    });

    // Sort order
    return list.sort((a, b) => {
      if (sortBy === 'newest') {
        return (new Date(b.createdAt || '').getTime() || 0) - (new Date(a.createdAt || '').getTime() || 0);
      }
      if (sortBy === 'oldest') {
        return (new Date(a.createdAt || '').getTime() || 0) - (new Date(b.createdAt || '').getTime() || 0);
      }
      if (sortBy === 'amount_desc') {
        return (b.totalAmount || 0) - (a.totalAmount || 0);
      }
      if (sortBy === 'amount_asc') {
        return (a.totalAmount || 0) - (b.totalAmount || 0);
      }
      if (sortBy === 'event') {
        return (a.eventCode || '').localeCompare(b.eventCode || '');
      }
      if (sortBy === 'college') {
        return (a.college?.collegeName || '').localeCompare(b.college?.collegeName || '');
      }
      return 0;
    });
  }, [allRegistrations, searchTerm, statusFilter, paymentStatusFilter, regTypeFilter, institutionFilter, eventFilter, sortBy]);

  // Statistics
  const stats = useMemo(() => {
    let pending = 0;
    let verified = 0;
    let rejected = 0;
    let notComplete = 0;
    let totalRevenue = 0;
    let delegations = 0;
    let smchHosts = 0;
    let otherColleges = 0;
    let totalParticipants = 0;
    let withReceipt = 0;
    let comboEntries = 0;
    let individualEntries = 0;

    // Financial Payment Statistics
    let countPaidInFull = 0;
    let countAdvancePaid = 0;
    let countNoPayment = 0;
    let totalCollectedAmount = 0;
    let totalOutstandingBalance = 0;
    const processedComboGroups = new Set<string>();

    allRegistrations.forEach((r) => {
      const status = getDeskStatus(r);
      if (status === 'VERIFIED') {
        verified++;
        totalRevenue += r.totalAmount || 0;
      } else if (status === 'REJECTED') {
        rejected++;
      } else if (status === 'NOT_COMPLETE') {
        notComplete++;
      } else {
        pending++;
      }

      const totalFee = Number(r.totalAmount) || 0;
      const paid = Number(r.paidAmount !== undefined ? r.paidAmount : totalFee);
      const pend = Math.max(0, totalFee - paid);
      const payStatus = r.paymentStatus || (pend === 0 && totalFee > 0 ? 'Paid in Full' : (paid > 0 ? 'Advance Paid' : 'Pending'));

      if (payStatus === 'Paid in Full' || (paid >= totalFee && totalFee > 0)) {
        countPaidInFull++;
      } else if (payStatus === 'Advance Paid' || paid > 0) {
        countAdvancePaid++;
      } else {
        countNoPayment++;
      }

      // Avoid double counting combo package totals
      if (r.comboGroupId) {
        if (!processedComboGroups.has(r.comboGroupId)) {
          processedComboGroups.add(r.comboGroupId);
          totalCollectedAmount += paid;
          totalOutstandingBalance += pend;
        }
      } else {
        totalCollectedAmount += paid;
        totalOutstandingBalance += pend;
      }

      const isHost = Boolean(r.isHostCollege || r.college?.isHostCollege);
      const isDelegation = !isHost && Boolean(r.college?.isCollegeDelegation);

      if (isHost) {
        smchHosts++;
      } else if (isDelegation) {
        delegations++;
      } else {
        otherColleges++;
      }

      if (r.paymentScreenshotData || r.paymentScreenshotPath) {
        withReceipt++;
      }

      if (r.comboId || r.comboGroupId || r.comboName) {
        comboEntries++;
      } else {
        individualEntries++;
      }

      totalParticipants += r.participantCount || r.participants?.length || 1;
    });

    return {
      total: allRegistrations.length,
      pending,
      verified,
      rejected,
      notComplete,
      totalRevenue,
      delegations,
      smchHosts,
      otherColleges,
      totalParticipants,
      withReceipt,
      comboEntries,
      individualEntries,
      countPaidInFull,
      countAdvancePaid,
      countNoPayment,
      totalCollectedAmount,
      totalOutstandingBalance,
    };
  }, [allRegistrations]);

  // Actions
  const handleVerify = async (regId: string) => {
    const res = await supabaseRegistrationService.updateStatus(regId, 'verify');
    showToast(`Registration ${regId} VERIFIED successfully`);

    const targetReg = allRegistrations.find((r) => r.id === regId || r.registrationCode === regId);
    const comboGroupId = targetReg?.comboGroupId;
    const comboId = targetReg?.comboId;
    const utr = targetReg?.utrNumber;

    const isMatch = (r: RegistrationSubmission) => {
      if (r.id === regId || r.registrationCode === regId) return true;
      if (comboGroupId && r.comboGroupId === comboGroupId) return true;
      if (comboId && utr && r.comboId === comboId && r.utrNumber === utr) return true;
      return false;
    };

    // Update local storage instantly for immediate user page reflection across combo batch
    try {
      const saved = localStorage.getItem('celestia26_registrations');
      if (saved) {
        const list: RegistrationSubmission[] = JSON.parse(saved);
        const updated = list.map((r) => {
          if (!isMatch(r)) return r;
          const isPartial = (r.pendingAmount && r.pendingAmount > 0) || (r.paidAmount !== undefined && r.paidAmount < r.totalAmount);
          return {
            ...r,
            paymentStatus: isPartial ? ('Advance Paid' as const) : ('Verified' as const),
            registrationStatus: 'Confirmed' as const,
            paymentConfirmed: true
          };
        });
        localStorage.setItem('celestia26_registrations', JSON.stringify(updated));
      }
    } catch (e) {
      console.warn('Could not update localStorage on verify:', e);
    }

    // Dispatch global event so user dashboard updates without refresh
    window.dispatchEvent(new CustomEvent('celestia-registration-status-changed', { detail: { regId, status: 'Verified' } }));

    loadData();
    setCloudRegistrations((prev) =>
      prev.map((r) => {
        if (!isMatch(r)) return r;
        const isPartial = (r.pendingAmount && r.pendingAmount > 0) || (r.paidAmount !== undefined && r.paidAmount < r.totalAmount);
        return {
          ...r,
          paymentStatus: isPartial ? ('Advance Paid' as const) : ('Verified' as const),
          registrationStatus: 'Confirmed' as const,
          paymentConfirmed: true
        };
      })
    );
    if (inspectRegistration && isMatch(inspectRegistration)) {
      setInspectRegistration((prev) => {
        if (!prev) return null;
        const isPartial = (prev.pendingAmount && prev.pendingAmount > 0) || (prev.paidAmount !== undefined && prev.paidAmount < prev.totalAmount);
        return {
          ...prev,
          paymentStatus: isPartial ? ('Advance Paid' as const) : ('Verified' as const),
          registrationStatus: 'Confirmed' as const,
          paymentConfirmed: true
        };
      });
    }
  };

  const handleOpenRejectModal = (reg: RegistrationSubmission) => {
    setRejectModalRegistration(reg);
    setRejectReasonInput('Payment reference mismatch or invalid slip');
  };

  const handleConfirmReject = async () => {
    if (!rejectModalRegistration) return;
    const regId = rejectModalRegistration.id;
    const res = await supabaseRegistrationService.updateStatus(regId, 'reject', rejectReasonInput);
    showToast(`Registration ${regId} REJECTED`);
    setRejectModalRegistration(null);
    loadData();
    setCloudRegistrations((prev) =>
      prev.map((r) =>
        r.id === regId
          ? { ...r, paymentStatus: 'Rejected', registrationStatus: 'Rejected' }
          : r
      )
    );
    if (inspectRegistration && inspectRegistration.id === regId) {
      setInspectRegistration((prev) => prev ? { ...prev, paymentStatus: 'Rejected', registrationStatus: 'Rejected' } : null);
    }
  };

  const handleOpenIncompleteModal = (reg: RegistrationSubmission) => {
    setIncompleteModalRegistration(reg);
    setIncompleteReasonInput('Registration incomplete or missing mandatory student credentials');
  };

  const handleConfirmIncomplete = async () => {
    if (!incompleteModalRegistration) return;
    const regId = incompleteModalRegistration.id;
    const res = await supabaseRegistrationService.updateStatus(regId, 'not_complete', incompleteReasonInput);
    showToast(`Registration ${regId} marked as REGISTRATION NOT COMPLETE`);
    setIncompleteModalRegistration(null);
    loadData();
    setCloudRegistrations((prev) =>
      prev.map((r) =>
        r.id === regId
          ? { ...r, paymentStatus: 'Pending', registrationStatus: 'Draft' }
          : r
      )
    );
    if (inspectRegistration && inspectRegistration.id === regId) {
      setInspectRegistration((prev) => prev ? { ...prev, paymentStatus: 'Pending', registrationStatus: 'Draft' } : null);
    }
  };

  const handleResetToPending = async (regId: string) => {
    const res = await supabaseRegistrationService.updateStatus(regId, 'reset_pending');
    showToast(`Registration ${regId} reset to PENDING (Awaiting action)`);
    loadData();
    setCloudRegistrations((prev) =>
      prev.map((r) =>
        r.id === regId
          ? { ...r, paymentStatus: 'Submitted', registrationStatus: 'Submitted' }
          : r
      )
    );
    if (inspectRegistration && inspectRegistration.id === regId) {
      setInspectRegistration((prev) => prev ? { ...prev, paymentStatus: 'Submitted', registrationStatus: 'Submitted' } : null);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmRegistration) return;
    const targetReg = deleteConfirmRegistration;
    setLoading(true);
    const identifier = targetReg.id || targetReg.registrationCode || '';
    const res = await supabaseRegistrationService.deleteRegistration(identifier);
    showToast(res.message);
    setDeleteConfirmRegistration(null);
    if (inspectRegistration && (inspectRegistration.id === targetReg.id || inspectRegistration.registrationCode === targetReg.registrationCode)) {
      setInspectRegistration(null);
    }
    await loadData();
    setLoading(false);
  };

  const handleOpenEdit = (reg: RegistrationSubmission) => {
    if (!isMainAdmin) {
      showToast('Permission Denied: Only Main Central Admin can edit registration details.');
      return;
    }
    setEditingRegistration(reg);
    const count = reg.participantCount || reg.participants.length || 1;
    const initialParticipants = reg.participants && reg.participants.length > 0 
      ? JSON.parse(JSON.stringify(reg.participants))
      : [{
          fullName: reg.participants[0]?.fullName || '',
          gender: 'Male',
          age: '20',
          mobile: reg.participants[0]?.mobile || '',
          email: reg.participants[0]?.email || '',
          role: 'Team Captain / Primary Contact',
        }];

    // Canonical event lookup from master EVENTS_DATA
    const matchedEvent = EVENTS_DATA.find((e) =>
      e.id.toLowerCase() === reg.eventId?.toLowerCase() ||
      e.code.toLowerCase() === reg.eventCode?.toLowerCase() ||
      e.title.toLowerCase() === reg.eventTitle?.toLowerCase()
    );

    const isHost = Boolean(reg.isHostCollege || reg.college?.isHostCollege);
    const canonicalFeePerUnit = matchedEvent ? matchedEvent.feeAmount : (reg.feePerUnit || 0);
    const canonicalFeeType: 'per_head' | 'per_team' = matchedEvent ? matchedEvent.feeType : ((reg.feeType as any) || 'per_head');

    // Canonical calculation if totalAmount was 0 or missing, but student is NOT an SMCH host
    let currentTotal = Number(reg.totalAmount) || 0;
    if (isHost) {
      currentTotal = 0;
    } else if (currentTotal === 0 && canonicalFeePerUnit > 0) {
      currentTotal = canonicalFeeType === 'per_head' ? canonicalFeePerUnit * count : canonicalFeePerUnit;
    }

    const currentPaid = reg.paidAmount !== undefined 
      ? Number(reg.paidAmount) 
      : (reg.paymentConfirmed ? currentTotal : 0);
    
    const currentPending = reg.pendingAmount !== undefined 
      ? Number(reg.pendingAmount) 
      : Math.max(0, currentTotal - currentPaid);

    let initialPaymentStatus: PaymentStatus = reg.paymentStatus || 'Pending';
    if (isHost) {
      initialPaymentStatus = 'Paid in Full';
    } else if (currentPending === 0 && currentTotal > 0) {
      initialPaymentStatus = 'Paid in Full';
    } else if (currentPaid > 0) {
      initialPaymentStatus = 'Advance Paid';
    }

    setEditFormData({
      captainName: reg.participants[0]?.fullName || '',
      captainEmail: reg.participants[0]?.email || '',
      captainMobile: reg.participants[0]?.mobile || '',
      teamName: reg.teamName || '',
      collegeName: reg.college?.collegeName || '',
      collegeCity: reg.college?.city || '',
      collegeState: reg.college?.state || '',
      contactPerson: reg.college?.contactPerson || '',
      contactMobile: reg.college?.contactMobile || '',
      contactEmail: reg.college?.contactEmail || '',
      utrNumber: reg.utrNumber || '',
      adminNotes: reg.paymentNotes || '',
      participantCount: count,
      participants: initialParticipants,
      isHostCollege: isHost,
      totalAmount: currentTotal,
      paidAmount: currentPaid,
      pendingAmount: currentPending,
      paymentStatus: initialPaymentStatus,
      feePerUnit: canonicalFeePerUnit,
      feeType: canonicalFeeType,
    });
  };

  const handleToggleHostStatus = (newIsHost: boolean) => {
    setEditFormData((prev) => {
      let nextTotal = prev.totalAmount;
      let nextPaid = prev.paidAmount;
      let nextStatus = prev.paymentStatus;

      if (newIsHost) {
        nextTotal = 0;
        nextStatus = 'Paid in Full';
      } else {
        // Look up canonical event fee from EVENTS_DATA
        const matched = EVENTS_DATA.find((e) =>
          e.id.toLowerCase() === editingRegistration?.eventId?.toLowerCase() ||
          e.code.toLowerCase() === editingRegistration?.eventCode?.toLowerCase() ||
          e.title.toLowerCase() === editingRegistration?.eventTitle?.toLowerCase()
        );
        const perUnit = matched ? matched.feeAmount : (prev.feePerUnit || 0);
        const feeType = matched ? matched.feeType : (prev.feeType || 'per_head');
        nextTotal = feeType === 'per_head' ? perUnit * prev.participantCount : perUnit;
        
        const pend = Math.max(0, nextTotal - nextPaid);
        if (pend === 0 && nextTotal > 0) nextStatus = 'Paid in Full';
        else if (nextPaid > 0) nextStatus = 'Advance Paid';
        else nextStatus = 'Pending';
      }

      const nextPending = Math.max(0, nextTotal - nextPaid);

      return {
        ...prev,
        isHostCollege: newIsHost,
        totalAmount: nextTotal,
        pendingAmount: nextPending,
        paymentStatus: nextStatus,
      };
    });
  };

  const handleAddEditMember = () => {
    setEditFormData((prev) => {
      const nextParts = [...prev.participants];
      nextParts.push({
        fullName: '',
        gender: 'Male',
        age: '20',
        mobile: '',
        email: '',
        role: `Team Member #${nextParts.length + 1}`,
      });
      const targetCount = nextParts.length;

      let nextTotal = prev.totalAmount;
      if (!prev.isHostCollege && prev.feeType === 'per_head' && prev.feePerUnit > 0) {
        nextTotal = prev.feePerUnit * targetCount;
      }
      const nextPending = Math.max(0, nextTotal - prev.paidAmount);

      return {
        ...prev,
        participantCount: targetCount,
        participants: nextParts,
        totalAmount: nextTotal,
        pendingAmount: nextPending,
      };
    });
  };

  const handleRemoveEditMember = (index: number) => {
    if (index === 0) return; // Cannot remove captain
    setEditFormData((prev) => {
      const nextParts = prev.participants.filter((_, i) => i !== index);
      const targetCount = Math.max(1, nextParts.length);

      let nextTotal = prev.totalAmount;
      if (!prev.isHostCollege && prev.feeType === 'per_head' && prev.feePerUnit > 0) {
        nextTotal = prev.feePerUnit * targetCount;
      }
      const nextPending = Math.max(0, nextTotal - prev.paidAmount);

      return {
        ...prev,
        participantCount: targetCount,
        participants: nextParts,
        totalAmount: nextTotal,
        pendingAmount: nextPending,
      };
    });
  };

  const handleEditMemberChange = (index: number, field: keyof ParticipantMember, value: string) => {
    setEditFormData((prev) => {
      const nextParts = [...prev.participants];
      if (!nextParts[index]) return prev;
      nextParts[index] = { ...nextParts[index], [field]: value };
      let newCaptainName = prev.captainName;
      let newCaptainEmail = prev.captainEmail;
      let newCaptainMobile = prev.captainMobile;
      if (index === 0) {
        if (field === 'fullName') newCaptainName = value;
        if (field === 'email') newCaptainEmail = value;
        if (field === 'mobile') newCaptainMobile = value;
      }
      return {
        ...prev,
        captainName: newCaptainName,
        captainEmail: newCaptainEmail,
        captainMobile: newCaptainMobile,
        participants: nextParts,
      };
    });
  };

  const handleEditParticipantCountChange = (newCount: number) => {
    const target = Math.max(1, Math.min(50, newCount));
    setEditFormData((prev) => {
      const nextParts = [...prev.participants];
      while (nextParts.length < target) {
        nextParts.push({
          fullName: '',
          gender: 'Male',
          age: '20',
          mobile: '',
          email: '',
          role: `Team Member #${nextParts.length + 1}`,
        });
      }
      if (nextParts.length > target) {
        nextParts.splice(target);
      }

      let nextTotal = prev.totalAmount;
      if (!prev.isHostCollege && prev.feeType === 'per_head' && prev.feePerUnit > 0) {
        nextTotal = prev.feePerUnit * target;
      }
      const nextPending = Math.max(0, nextTotal - prev.paidAmount);

      return {
        ...prev,
        participantCount: target,
        participants: nextParts,
        totalAmount: nextTotal,
        pendingAmount: nextPending,
      };
    });
  };

  const handleEditTotalAmountChange = (newTotal: number) => {
    const val = Math.max(0, Number(newTotal) || 0);
    setEditFormData((prev) => {
      const pend = Math.max(0, val - prev.paidAmount);
      let st = prev.paymentStatus;
      if (pend === 0 && val > 0) st = 'Paid in Full';
      else if (prev.paidAmount > 0) st = 'Advance Paid';
      else st = 'Pending';
      return {
        ...prev,
        totalAmount: val,
        pendingAmount: pend,
        paymentStatus: st,
      };
    });
  };

  const handleEditPaidAmountChange = (newPaid: number) => {
    const val = Math.max(0, Number(newPaid) || 0);
    setEditFormData((prev) => {
      const pend = Math.max(0, prev.totalAmount - val);
      let st = prev.paymentStatus;
      if (pend === 0 && prev.totalAmount > 0) st = 'Paid in Full';
      else if (val > 0) st = 'Advance Paid';
      else st = 'Pending';
      return {
        ...prev,
        paidAmount: val,
        pendingAmount: pend,
        paymentStatus: st,
      };
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRegistration) return;

    if (!isMainAdmin) {
      showToast('Permission Denied: Only Main Central Admin can edit registration details.');
      return;
    }

    const updatedParticipants = [...editFormData.participants];
    if (updatedParticipants[0]) {
      updatedParticipants[0] = {
        ...updatedParticipants[0],
        fullName: editFormData.captainName,
        email: editFormData.captainEmail,
        mobile: editFormData.captainMobile,
      };
    }

    const res = await supabaseRegistrationService.updateRegistrationDetails(
      editingRegistration.id,
      {
        ...editFormData,
        participants: updatedParticipants,
      }
    );

    showToast(res.message);
    setEditingRegistration(null);

    // Optimistically update cloud & local list state
    const pend = Math.max(0, editFormData.totalAmount - editFormData.paidAmount);
    setCloudRegistrations((prev) =>
      prev.map((r) => {
        if (r.id === editingRegistration.id || r.registrationCode === editingRegistration.registrationCode) {
          return {
            ...r,
            teamName: editFormData.teamName,
            participantCount: editFormData.participantCount,
            participants: updatedParticipants,
            isHostCollege: editFormData.isHostCollege,
            totalAmount: editFormData.totalAmount,
            paidAmount: editFormData.paidAmount,
            pendingAmount: pend,
            paymentStatus: editFormData.paymentStatus,
            paymentNotes: editFormData.adminNotes,
            utrNumber: editFormData.utrNumber,
            feePerUnit: editFormData.feePerUnit,
            feeType: editFormData.feeType,
            college: {
              ...r.college,
              collegeName: editFormData.collegeName,
              city: editFormData.collegeCity,
              state: editFormData.collegeState,
              contactPerson: editFormData.contactPerson,
              contactMobile: editFormData.contactMobile,
              contactEmail: editFormData.contactEmail,
              isHostCollege: editFormData.isHostCollege,
            },
          };
        }
        return r;
      })
    );

    await loadData();
  };

  // Reusable CSV Generator for any list of registrations
  const exportCSVForList = (list: RegistrationSubmission[], filename: string) => {
    if (list.length === 0) {
      showToast('No registration data available to export.');
      return;
    }

    const headers = [
      'Registration ID',
      'Desk Status (Pending/Verified/Rejected/Not Complete)',
      'Event Code',
      'Event Title',
      'Event Type',
      'Event Category',
      'Team Name',
      'College Name',
      'City',
      'State',
      'College Representative',
      'College Mobile',
      'College Email',
      'College Delegation',
      'Total Participants',
      'Primary Contact Name',
      'Primary Contact Mobile',
      'Primary Contact Email',
      'Primary Contact Gender',
      'Primary Contact Age',
      'Total Fee Amount (INR)',
      'Fee Structure',
      'UTR Reference Number',
      'Payment Screenshot Attached',
      'ID Cards Uploaded Count',
      'Date Created',
      'All Participants Roster'
    ];

    const rows = list.map((r) => {
      const deskStatus = getDeskStatus(r);
      const idCardsCount = r.participants.filter(p => Boolean(p.idCardFileData || p.idCardStoragePath || p.idCardFileName)).length;
      const hasPaymentProof = Boolean(r.paymentScreenshotData || r.paymentScreenshotPath || r.paymentScreenshotName);

      const rosterSummary = r.participants
        .map((p, i) => `#${i + 1} ${p.fullName} (${p.role || 'Member'}, ${p.gender}, Age ${p.age}, ${p.mobile}${p.idCardFileData || p.idCardStoragePath ? ', ID Card attached' : ''})`)
        .join(' | ');

      return [
        `"${r.id}"`,
        `"${deskStatus}"`,
        `"${r.eventCode}"`,
        `"${r.eventTitle}"`,
        `"${r.eventType}"`,
        `"${r.eventCategory}"`,
        `"${r.teamName || ''}"`,
        `"${r.college?.collegeName || ''}"`,
        `"${r.college?.city || ''}"`,
        `"${r.college?.state || ''}"`,
        `"${r.college?.contactPerson || ''}"`,
        `"${r.college?.contactMobile || ''}"`,
        `"${r.college?.contactEmail || ''}"`,
        `"${r.college?.isCollegeDelegation ? 'Yes' : 'No'}"`,
        r.participants.length,
        `"${r.participants[0]?.fullName || ''}"`,
        `"${r.participants[0]?.mobile || ''}"`,
        `"${r.participants[0]?.email || ''}"`,
        `"${r.participants[0]?.gender || ''}"`,
        `"${r.participants[0]?.age || ''}"`,
        r.totalAmount,
        `"${r.feeType}"`,
        `"${r.utrNumber || ''}"`,
        `"${hasPaymentProof ? 'Yes' : 'No'}"`,
        `"${idCardsCount} of ${r.participants.length}"`,
        `"${r.createdAt}"`,
        `"${rosterSummary.replace(/"/g, '""')}"`
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export full registered data as CSV
  const handleExportCSV = () => {
    exportCSVForList(allRegistrations, `Celestia26_Admin1_Full_Registrations_${new Date().toISOString().slice(0, 10)}.csv`);
    showToast(`Exported ${allRegistrations.length} registrations to CSV`);
  };

  // Export ONLY Selected items as CSV
  const handleExportSelectedCSV = () => {
    if (selectedRegIds.length === 0) {
      showToast('Select at least one registration using checkboxes first');
      return;
    }
    const selectedList = allRegistrations.filter((r) => selectedRegIds.includes(r.id));
    exportCSVForList(selectedList, `Celestia26_Selected_${selectedList.length}_Registrations.csv`);
    showToast(`Exported ${selectedList.length} selected registrations to CSV`);
  };

  // Export Single Event Roster as CSV
  const handleExportSingleEventCSV = (eventCode: string) => {
    const eventRegs = allRegistrations.filter((r) => r.eventCode === eventCode);
    if (eventRegs.length === 0) {
      showToast(`No registrations found for event code ${eventCode}`);
      return;
    }
    exportCSVForList(eventRegs, `Celestia26_EventRoster_${eventCode}.csv`);
    showToast(`Exported ${eventRegs.length} entries for event ${eventCode}`);
  };

  // Export Event-Wise Classified Master CSV
  const handleExportClassifiedByEventsCSV = () => {
    if (allRegistrations.length === 0) {
      showToast('No registration data available to classify.');
      return;
    }

    const headers = [
      'Event Code',
      'Event Title',
      'Event Category',
      'Registration ID',
      'Desk Status',
      'College Name',
      'City',
      'State',
      'Team Name',
      'Primary Captain Name',
      'Captain Mobile',
      'Captain Email',
      'Total Participants',
      'Full Participant Roster',
      'Fee Amount (INR)',
      'UTR Reference Number',
      'Submission Date'
    ];

    const rows: string[] = [];

    EVENTS_DATA.forEach((ev) => {
      const regs = allRegistrations.filter((r) => r.eventCode === ev.code);
      if (regs.length > 0) {
        regs.forEach((r) => {
          const deskStatus = getDeskStatus(r);
          const rosterSummary = r.participants
            .map((p, i) => `#${i + 1} ${p.fullName} [${p.role || 'Member'}, ${p.gender}, Age ${p.age}, Ph: ${p.mobile}]`)
            .join(' | ');

          rows.push([
            `"${ev.code}"`,
            `"${ev.title}"`,
            `"${ev.category}"`,
            `"${r.id}"`,
            `"${deskStatus}"`,
            `"${r.college?.collegeName || ''}"`,
            `"${r.college?.city || ''}"`,
            `"${r.college?.state || ''}"`,
            `"${r.teamName || ''}"`,
            `"${r.participants[0]?.fullName || ''}"`,
            `"${r.participants[0]?.mobile || ''}"`,
            `"${r.participants[0]?.email || ''}"`,
            r.participants.length.toString(),
            `"${rosterSummary.replace(/"/g, '""')}"`,
            r.totalAmount.toString(),
            `"${r.utrNumber || ''}"`,
            `"${r.createdAt}"`
          ].join(','));
        });
      }
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Celestia26_Event_Wise_Classified_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported Event-Wise Classified Master CSV!');
  };

  // Download Single Registration Complete Text Dossier Report
  const handleExportSingleRegistration = (reg: RegistrationSubmission) => {
    const deskStatus = getDeskStatus(reg);
    let content = `=========================================================================\n`;
    content += `CELESTIA '26 - OFFICIAL REGISTRATION DOSSIER REPORT\n`;
    content += `Srinivasan Medical College & Hospital Intercollegiate Cultural Fest\n`;
    content += `=========================================================================\n\n`;
    content += `REGISTRATION ID: ${reg.id}\n`;
    content += `REGISTRATION CODE: ${reg.registrationCode || reg.id}\n`;
    content += `DESK STATUS: ${deskStatus}\n`;
    content += `SUBMISSION DATE: ${reg.createdAt}\n\n`;
    
    content += `--- 1. EVENT & COMPETITION DETAILS ---\n`;
    content += `Event Code: ${reg.eventCode}\n`;
    content += `Event Title: ${reg.eventTitle}\n`;
    content += `Event Type: ${reg.eventType}\n`;
    content += `Event Category: ${reg.eventCategory}\n`;
    content += `Venue: ${reg.venue}\n`;
    if (reg.teamName) content += `Registered Team Name: ${reg.teamName}\n`;
    content += `\n`;

    content += `--- 2. COLLEGE & DELEGATION DETAILS ---\n`;
    content += `College Name: ${reg.college?.collegeName || 'N/A'}\n`;
    content += `Location: ${reg.college?.city || ''}, ${reg.college?.state || ''}\n`;
    content += `Representative / HOD: ${reg.college?.contactPerson || 'N/A'}\n`;
    content += `Representative Mobile: ${reg.college?.contactMobile || 'N/A'}\n`;
    content += `Representative Email: ${reg.college?.contactEmail || 'N/A'}\n`;
    content += `Delegation Status: ${reg.college?.isCollegeDelegation ? 'Official College Delegation' : 'Individual Entry'}\n`;
    if (reg.college?.isHostCollege) {
      content += `SMCH Host Student Reg No: ${reg.college.hostRegisterNumber || 'N/A'}\n`;
      content += `SMCH Batch: ${reg.college.hostBatch || 'N/A'}\n`;
    }
    content += `\n`;

    content += `--- 3. PAYMENT REMITTANCE & FINANCIALS ---\n`;
    content += `Total Fee Amount: ₹${reg.totalAmount}\n`;
    content += `Fee Structure: ₹${reg.feePerUnit} (${reg.feeType})\n`;
    content += `UTR / Transaction ID: ${reg.utrNumber || 'N/A'}\n`;
    content += `Payment Confirmed: ${reg.paymentConfirmed ? 'YES' : 'NO'}\n`;
    content += `Payment Screenshot Proof Attached: ${reg.paymentScreenshotData || reg.paymentScreenshotPath ? 'YES' : 'NO'}\n`;
    content += `\n`;

    content += `--- 4. PARTICIPANT ROSTER (${reg.participants.length} MEMBERS) ---\n`;
    reg.participants.forEach((p, idx) => {
      content += `${idx + 1}. Full Name: ${p.fullName}\n`;
      content += `   Role: ${p.role || (idx === 0 ? 'Team Captain / Primary Contact' : 'Team Member')}\n`;
      content += `   Gender: ${p.gender} | Age: ${p.age}\n`;
      content += `   Mobile: ${p.mobile || 'N/A'} | Email: ${p.email || 'N/A'}\n`;
      content += `   ID Card File Uploaded: ${p.idCardFileData || p.idCardStoragePath ? 'YES' : 'NO'}\n\n`;
    });

    content += `=========================================================================\n`;
    content += `Generated on ${new Date().toLocaleString()} from Celestia '26 Admin Desk\n`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Celestia26_Dossier_${reg.id}_${reg.eventCode}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Dossier text report for ${reg.id} downloaded!`);
  };

  // Selection Toggle Handlers
  const isAllSelected = useMemo(() => {
    return filteredRegistrations.length > 0 && filteredRegistrations.every((r) => selectedRegIds.includes(r.id));
  }, [filteredRegistrations, selectedRegIds]);

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedRegIds([]);
    } else {
      setSelectedRegIds(filteredRegistrations.map((r) => r.id));
    }
  };

  const handleToggleSelectRow = (id: string) => {
    setSelectedRegIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Bulk Verify Selected Entries
  const handleBulkVerify = async () => {
    if (selectedRegIds.length === 0) return;
    setLoading(true);
    let count = 0;
    for (const id of selectedRegIds) {
      try {
        await supabaseRegistrationService.updateStatus(id, 'verify');
        count++;
      } catch (e) {
        console.error(`Error verifying ${id}:`, e);
      }
    }
    showToast(`Successfully VERIFIED ${count} selected registrations!`);
    setSelectedRegIds([]);
    await loadData();
  };

  // Bulk Delete Selected Entries
  const handleBulkDelete = async () => {
    if (selectedRegIds.length === 0) return;
    setLoading(true);
    let count = 0;
    for (const id of selectedRegIds) {
      try {
        await supabaseRegistrationService.deleteRegistration(id);
        count++;
      } catch (e) {
        console.error(`Error deleting ${id}:`, e);
      }
    }
    showToast(`Successfully DELETED ${count} selected registrations!`);
    setSelectedRegIds([]);
    setBulkDeleteConfirmModal(false);
    await loadData();
  };

  const handleLogout = () => {
    clearAuthSession();
    setIsAuthenticated(false);
    setActiveRole(null);
    setViewingInchargesDesk(false);
    setPasskeyInput('');
    setAdminPassword('');
    showToast('Logged out of Admin Desk');
  };

  // Auth Handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    // Check credentials against configured official profiles
    const enteredUser = (loginUsername || adminEmail).trim();
    const enteredPass = (passkeyInput || adminPassword).trim();

    const authResult = authenticateProfile(enteredUser, enteredPass);
    if (authResult.authenticated && authResult.role) {
      persistAuthRole(authResult.role);
      setActiveRole(authResult.role);
      setIsAuthenticated(true);

      if (authResult.role === 'incharges') {
        showToast('Logged in as Event Incharges');
        setViewingInchargesDesk(true);
      } else if (authResult.role === 'result') {
        showToast('Logged in as Result Update Desk');
        if (onNavigateToTabulation) {
          onNavigateToTabulation();
        }
      } else {
        showToast('Admin 1 Operations Desk Unlocked');
      }
      return;
    }

    if (authMode === 'supabase_auth') {
      if (!adminEmail.trim() || !adminPassword) {
        setAuthError('Please enter administrator email and password.');
        return;
      }
      setIsSubmittingAuth(true);
      try {
        if (!supabase) throw new Error('Supabase client not initialized.');
        const { data, error } = await supabase.auth.signInWithPassword({
          email: adminEmail.trim(),
          password: adminPassword,
        });
        if (error) throw error;
        if (data.session) {
          setIsAuthenticated(true);
          persistAuthRole('admin');
          setActiveRole('admin');
          showToast(`Logged in as Admin: ${data.user?.email}`);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Login failed';
        setAuthError(`Supabase Auth error: ${msg}. You may also log in with your Admin profile password.`);
      } finally {
        setIsSubmittingAuth(false);
      }
    } else {
      setAuthError(authResult.error || 'Invalid credentials. Only authorized Admin, Result, or Incharges profiles are permitted.');
    }
  };

  // Render Gatekeeper if unauthenticated
  if (!isAuthenticated) {
    return (
      <div className="relative z-10 pt-20 sm:pt-28 pb-12 sm:pb-24 px-3 sm:px-6 lg:px-8 max-w-md mx-auto min-h-[70vh] flex items-center justify-center">
        <div className="w-full celestial-glass rounded-2xl p-6 sm:p-8 border border-[#D4AF37]/40 shadow-2xl relative overflow-hidden">
          <div className="text-center mb-6">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#D4AF37]/20 border border-[#D4AF37]/50 flex items-center justify-center text-[#E6C57D] mb-4">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <span className="text-[11px] font-mono tracking-widest uppercase text-[#D4AF37] block font-semibold mb-1">
              AUTHORIZED OPERATIONS DESK
            </span>
            <h2 className="font-cinzel text-2xl font-bold text-white tracking-wide">
              Celestia'26 Portals
            </h2>
            <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
              Select your profile to authenticate. Incharges see approved registrations; Admin manages registrations & payments; Result updates tabulation.
            </p>
          </div>

          {/* Profile Selector Tabs */}
          <div className="flex rounded-xl bg-black/40 p-1 mb-4 border border-white/10 text-xs">
            <button
              type="button"
              onClick={() => {
                setRoleTab('admin');
                setLoginUsername('Admin');
                setAuthError('');
              }}
              className={`flex-1 py-1.5 rounded-lg font-medium transition-colors cursor-pointer text-center ${
                roleTab === 'admin' ? 'bg-[#D4AF37] text-black font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Admin Desk
            </button>
            <button
              type="button"
              onClick={() => {
                setRoleTab('result');
                setLoginUsername('Result');
                setAuthError('');
              }}
              className={`flex-1 py-1.5 rounded-lg font-medium transition-colors cursor-pointer text-center ${
                roleTab === 'result' ? 'bg-[#D4AF37] text-black font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Result
            </button>
            <button
              type="button"
              onClick={() => {
                setRoleTab('incharges');
                setLoginUsername('Incharges');
                setAuthError('');
              }}
              className={`flex-1 py-1.5 rounded-lg font-medium transition-colors cursor-pointer text-center ${
                roleTab === 'incharges' ? 'bg-emerald-400 text-black font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Incharges
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase text-slate-300 mb-1.5">
                Profile / Username
              </label>
              <input
                type="text"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                placeholder="Username (Admin / Result / Incharges)"
                className="w-full px-4 py-2.5 rounded-xl bg-[#070B1C]/90 border border-white/15 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-slate-300 mb-1.5">
                Security Password
              </label>
              <input
                type="password"
                value={passkeyInput}
                onChange={(e) => setPasskeyInput(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-4 py-2.5 rounded-xl bg-[#070B1C]/90 border border-white/15 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-[#D4AF37]"
                autoFocus
              />
            </div>

            {authError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmittingAuth}
              className={`w-full py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider text-[#050714] transition-all cursor-pointer shadow-lg disabled:opacity-50 ${
                roleTab === 'incharges'
                  ? 'bg-gradient-to-r from-emerald-300 via-emerald-400 to-[#D4AF37] hover:brightness-110 shadow-emerald-500/20'
                  : 'bg-gradient-to-r from-[#F5E7C4] via-[#D4AF37] to-[#B38F26] hover:brightness-110 shadow-[#D4AF37]/20'
              }`}
            >
              {isSubmittingAuth ? 'Authenticating...' : `Enter ${AUTH_PROFILES[roleTab].badge}`}
            </button>
          </form>

          {/* Secure Portal Info Notice (No passwords displayed) */}
          <div className="mt-5 pt-4 border-t border-white/10 text-center">
            <span className="text-[11px] text-slate-400 font-mono flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Protected Festival Operations Console</span>
            </span>
          </div>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={onExit}
              className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              ← Return to Main Fest Site
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If user is logged in as Event Incharge or Admin is previewing Incharges Desk
  if (activeRole === 'incharges' || viewingInchargesDesk) {
    return (
      <div>
        {activeRole === 'admin' && (
          <div className="bg-[#101736] border-b border-[#D4AF37]/30 px-4 py-2.5 flex items-center justify-between text-xs max-w-7xl mx-auto">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[#F5E7C4] font-medium font-mono">
                Admin Preview: Event Incharges Desk (Viewing Approved Only)
              </span>
            </div>
            <button
              type="button"
              onClick={() => setViewingInchargesDesk(false)}
              className="px-3 py-1 bg-[#D4AF37] hover:bg-[#E6C57D] text-black font-bold rounded-lg text-xs transition-colors cursor-pointer"
            >
              Back to Full Admin 1 Operations Desk
            </button>
          </div>
        )}
        <InchargesPortalPage
          onExit={onExit}
          onNavigateToAdmin={() => setViewingInchargesDesk(false)}
        />
      </div>
    );
  }

  return (
    <div className="relative z-10 pt-20 sm:pt-24 pb-12 sm:pb-24 px-2.5 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-[#0E163B] border border-[#D4AF37] text-white shadow-2xl flex items-center gap-3 animate-fade-in text-xs font-medium">
          <Sparkles className="w-4 h-4 text-[#D4AF37]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-6 mb-6 border-b border-white/10 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-mono tracking-widest uppercase text-[#D4AF37] font-semibold">
              CELESTIA'26 · ADMIN 1 REGISTRATION MANAGEMENT CONSOLE
            </span>
          </div>
          <h1 className="font-cinzel text-2xl sm:text-3xl font-bold text-white tracking-wide">
            Registration & Verification Desk
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
            Verify student ID cards, inspect payment screenshots, audit all entered columns, approve/reject/hold registrations, and download attendee datasets.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={handleToggleAutoApprove}
            className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              autoApproveOn
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60 shadow-lg shadow-emerald-500/20 animate-pulse'
                : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/15'
            }`}
            title="Toggle Auto-Approve mode. When ON, all new & existing registrations are automatically verified and approved."
          >
            {autoApproveOn ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Auto-Approve: ON</span>
              </>
            ) : (
              <>
                <ToggleLeft className="w-4 h-4 text-slate-400" />
                <span>Auto-Approve: OFF</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setShowTestGeneratorModal(true)}
            className="px-3.5 py-2 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/35 text-xs font-semibold text-purple-300 transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Open 25 Fictional Test Registration Generator"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Test Suite (25 Records)</span>
          </button>

          {isMainAdmin && (
            <button
              type="button"
              onClick={() => setShowPromoCodeModal(true)}
              className="px-3.5 py-2 rounded-xl bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30 border border-[#D4AF37]/50 text-xs font-semibold text-[#F5E7C4] transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-[#D4AF37]/10"
              title="Manage Promo Codes & Discounts"
            >
              <Tag className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Promo Codes ({promoCodes.length})</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setViewingInchargesDesk(true)}
            className="px-3.5 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/35 text-xs font-semibold text-emerald-300 transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Preview Incharges Approved Registrations Portal"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Incharges Approved Desk</span>
          </button>

          {onNavigateToTabulation && (
            <button
              type="button"
              onClick={onNavigateToTabulation}
              className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-200 transition-colors flex items-center gap-2 cursor-pointer"
            >
              <span>Main Tabulation Console (/admin)</span>
              <ExternalLink className="w-3.5 h-3.5 text-[#D4AF37]" />
            </button>
          )}

          <button
            type="button"
            onClick={handleLogout}
            className="px-3 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/35 text-xs font-medium text-rose-300 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Log out of Admin 1"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>

          <button
            type="button"
            onClick={onExit}
            className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            Exit Console
          </button>
        </div>
      </div>

      {/* Cloud Database Sync & Diagnostics Banner */}
      <div className={`p-4 rounded-2xl mb-6 border transition-all ${
        !cloudDiagnostics?.isConfigured
          ? 'bg-amber-500/10 border-amber-500/40 text-amber-200'
          : cloudDiagnostics.errorMessage
          ? 'bg-rose-500/10 border-rose-500/40 text-rose-200'
          : 'bg-[#0E163B] border-emerald-500/35 text-slate-200'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
              !cloudDiagnostics?.isConfigured
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : cloudDiagnostics.errorMessage
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
            }`}>
              {!cloudDiagnostics?.isConfigured ? (
                <CloudOff className="w-5 h-5" />
              ) : cloudDiagnostics.errorMessage ? (
                <AlertCircle className="w-5 h-5" />
              ) : (
                <Database className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-white text-sm">
                  {!cloudDiagnostics?.isConfigured
                    ? 'Cloud Database: Not Active in Current Web Build'
                    : cloudDiagnostics.errorMessage
                    ? 'Cloud Database: Connected, but Table Error Detected'
                    : 'Cloud Database: Live & Synchronized'}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                  !cloudDiagnostics?.isConfigured
                    ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                    : cloudDiagnostics.errorMessage
                    ? 'bg-rose-400/20 text-rose-300 border border-rose-400/30'
                    : 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30'
                }`}>
                  {!cloudDiagnostics?.isConfigured 
                    ? 'Local Mode Only' 
                    : cloudDiagnostics.errorMessage 
                    ? 'Schema Attention Needed' 
                    : 'Cloud Active'}
                </span>
              </div>

              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {!cloudDiagnostics?.isConfigured ? (
                  <>
                    Vite build variables (<code className="text-[#F5E7C4] font-mono">VITE_SUPABASE_URL</code>) are missing in this deployed build. 
                    Registrations submitted by visitors on external phones cannot reach this admin console. 
                    <strong className="text-white ml-1">
                      Currently displaying {myRegistrations.length} registrations saved locally in your own browser cache.
                    </strong>
                  </>
                ) : cloudDiagnostics.errorMessage ? (
                  <>
                    Supabase Project (<code className="text-[#F5E7C4] font-mono">{cloudDiagnostics.maskedUrl || 'configured'}</code>) reachable, but database reported: 
                    <span className="text-rose-300 font-mono text-[11px] block mt-0.5">{cloudDiagnostics.errorMessage}</span>
                  </>
                ) : (
                  <>
                    Synchronized with Supabase project (<code className="text-[#F5E7C4] font-mono">{cloudDiagnostics.maskedUrl}</code>). 
                    Found <strong className="text-emerald-300 font-mono">{cloudRegistrations.length}</strong> cloud records 
                    {myRegistrations.length > 0 && <span> + {myRegistrations.length} local browser test records</span>}.
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center shrink-0 flex-wrap">
            <button
              type="button"
              onClick={() => setShowCloudModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25 text-[#E6C57D] border border-[#D4AF37]/35 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Info className="w-3.5 h-3.5" />
              <span>{!cloudDiagnostics?.isConfigured ? 'Why are registrations missing?' : 'Database Setup Guide'}</span>
            </button>

            <button
              type="button"
              onClick={loadData}
              disabled={isCheckingCloud}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 border border-white/15 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isCheckingCloud ? 'animate-spin' : ''}`} />
              <span>{isCheckingCloud ? 'Testing...' : 'Check Live'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Status Definitions Notice Bar */}
      <div className="p-3.5 rounded-xl bg-black/40 border border-[#D4AF37]/30 mb-6 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-300">
          <ShieldCheck className="w-4 h-4 text-[#D4AF37] shrink-0" />
          <span className="font-medium text-white">Status Protocol:</span>
        </div>
        <div className="flex items-center gap-3 flex-wrap text-[11px]">
          <span className="flex items-center gap-1.5 text-amber-300">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <strong>Pending:</strong> Admin didn't take action yet
          </span>
          <span className="flex items-center gap-1.5 text-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <strong>Verified:</strong> Admin clicked Verified
          </span>
          <span className="flex items-center gap-1.5 text-rose-300">
            <span className="w-2 h-2 rounded-full bg-rose-400" />
            <strong>Rejected:</strong> Admin clicked Reject
          </span>
          <span className="flex items-center gap-1.5 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            <strong>Not Complete:</strong> Person didn't finish registration
          </span>
        </div>
      </div>

      {/* Statistics Bar - 8 Key Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 mb-6">
        <button
          type="button"
          onClick={() => { setStatusFilter('ALL'); setInstitutionFilter('ALL'); }}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            statusFilter === 'ALL' && institutionFilter === 'ALL'
              ? 'bg-[#121B3D] border-[#D4AF37] ring-1 ring-[#D4AF37]'
              : 'bg-[#090E26] border-white/10 hover:border-white/20'
          }`}
        >
          <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block">Total Entries</span>
          <span className="font-cinzel text-xl sm:text-2xl font-bold text-white mt-1 block">{stats.total}</span>
          <span className="text-[9px] text-slate-400 block truncate">{stats.totalParticipants} students</span>
        </button>

        <button
          type="button"
          onClick={() => { setStatusFilter('PENDING'); setInstitutionFilter('ALL'); }}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            statusFilter === 'PENDING'
              ? 'bg-amber-500/20 border-amber-500 ring-1 ring-amber-500'
              : 'bg-[#090E26] border-amber-500/25 hover:border-amber-500/40'
          }`}
        >
          <span className="text-[10px] uppercase font-mono tracking-wider text-amber-400 block flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            Pending Action
          </span>
          <span className="font-cinzel text-xl sm:text-2xl font-bold text-amber-300 mt-1 block">{stats.pending}</span>
          <span className="text-[9px] text-amber-300/80 block truncate">Needs desk review</span>
        </button>

        <button
          type="button"
          onClick={() => { setStatusFilter('VERIFIED'); setInstitutionFilter('ALL'); }}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            statusFilter === 'VERIFIED'
              ? 'bg-emerald-500/20 border-emerald-500 ring-1 ring-emerald-500'
              : 'bg-[#090E26] border-emerald-500/25 hover:border-emerald-500/40'
          }`}
        >
          <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-400 block">🟢 Verified</span>
          <span className="font-cinzel text-xl sm:text-2xl font-bold text-emerald-300 mt-1 block">{stats.verified}</span>
          <span className="text-[9px] text-emerald-400/80 block truncate">Approved rosters</span>
        </button>

        <button
          type="button"
          onClick={() => { setStatusFilter('REJECTED'); setInstitutionFilter('ALL'); }}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            statusFilter === 'REJECTED'
              ? 'bg-rose-500/20 border-rose-500 ring-1 ring-rose-500'
              : 'bg-[#090E26] border-rose-500/25 hover:border-rose-500/40'
          }`}
        >
          <span className="text-[10px] uppercase font-mono tracking-wider text-rose-400 block">🔴 Rejected</span>
          <span className="font-cinzel text-xl sm:text-2xl font-bold text-rose-300 mt-1 block">{stats.rejected}</span>
          <span className="text-[9px] text-rose-400/80 block truncate">Declined entries</span>
        </button>

        <button
          type="button"
          onClick={() => { setStatusFilter('NOT_COMPLETE'); setInstitutionFilter('ALL'); }}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            statusFilter === 'NOT_COMPLETE'
              ? 'bg-slate-500/20 border-slate-400 ring-1 ring-slate-400'
              : 'bg-[#090E26] border-slate-500/25 hover:border-slate-500/40'
          }`}
        >
          <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block">⚪ Incomplete</span>
          <span className="font-cinzel text-xl sm:text-2xl font-bold text-slate-300 mt-1 block">{stats.notComplete}</span>
          <span className="text-[9px] text-slate-400 block truncate">Draft / On hold</span>
        </button>

        <button
          type="button"
          onClick={() => { setStatusFilter('ALL'); setInstitutionFilter('DELEGATION'); }}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            institutionFilter === 'DELEGATION'
              ? 'bg-purple-500/20 border-purple-500 ring-1 ring-purple-500'
              : 'bg-[#090E26] border-purple-500/25 hover:border-purple-500/40'
          }`}
        >
          <span className="text-[10px] uppercase font-mono tracking-wider text-purple-400 block">🏛️ Delegations</span>
          <span className="font-cinzel text-xl sm:text-2xl font-bold text-purple-300 mt-1 block">{stats.delegations}</span>
          <span className="text-[9px] text-purple-300/80 block truncate">College official</span>
        </button>

        <button
          type="button"
          onClick={() => { setStatusFilter('ALL'); setInstitutionFilter('SMCH_HOST'); }}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            institutionFilter === 'SMCH_HOST'
              ? 'bg-teal-500/20 border-teal-500 ring-1 ring-teal-500'
              : 'bg-[#090E26] border-teal-500/25 hover:border-teal-500/40'
          }`}
        >
          <span className="text-[10px] uppercase font-mono tracking-wider text-teal-400 block">🏥 SMCH Host</span>
          <span className="font-cinzel text-xl sm:text-2xl font-bold text-teal-300 mt-1 block">{stats.smchHosts}</span>
          <span className="text-[9px] text-teal-300/80 block truncate">₹0 Waiver passes</span>
        </button>

        <div className="p-3 rounded-xl bg-[#090E26] border border-[#D4AF37]/35">
          <span className="text-[10px] uppercase font-mono tracking-wider text-[#D4AF37] block">Verified Fees</span>
          <span className="font-cinzel text-base sm:text-lg font-bold text-[#F5E7C4] mt-1 block">
            ₹{stats.totalRevenue.toLocaleString('en-IN')}
          </span>
          <span className="text-[9px] text-[#E6C57D]/70 block truncate">Cleared remittance</span>
        </div>
      </div>

      {/* Advance Payment & Financial Balances Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 celestial-glass">
          <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-400 block font-bold">Collected Revenue</span>
          <span className="font-cinzel text-lg sm:text-2xl font-extrabold text-emerald-300 mt-0.5 block font-mono">
            ₹{stats.totalCollectedAmount.toLocaleString('en-IN')}
          </span>
          <span className="text-[10px] text-emerald-400/80 block mt-0.5">Cleared + Advance Paid</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-amber-950/25 border border-amber-500/40 celestial-glass">
          <span className="text-[10px] uppercase font-mono tracking-wider text-amber-400 block font-bold">Outstanding Balance</span>
          <span className="font-cinzel text-lg sm:text-2xl font-extrabold text-amber-300 mt-0.5 block font-mono">
            ₹{stats.totalOutstandingBalance.toLocaleString('en-IN')}
          </span>
          <span className="text-[10px] text-amber-400/80 block mt-0.5">Pending due before event</span>
        </div>

        <button
          type="button"
          onClick={() => setPaymentStatusFilter(paymentStatusFilter === 'ADVANCE_PAID' ? 'ALL' : 'ADVANCE_PAID')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            paymentStatusFilter === 'ADVANCE_PAID'
              ? 'bg-amber-500/20 border-amber-400 ring-2 ring-amber-400/50'
              : 'bg-[#090E26] border-amber-500/25 hover:border-amber-500/50'
          }`}
        >
          <span className="text-[10px] uppercase font-mono tracking-wider text-amber-400 block font-bold">Advance Paid</span>
          <span className="font-cinzel text-lg sm:text-2xl font-extrabold text-amber-300 mt-0.5 block">
            {stats.countAdvancePaid}
          </span>
          <span className="text-[10px] text-amber-400/80 block mt-0.5">Partial deposit received</span>
        </button>

        <button
          type="button"
          onClick={() => setPaymentStatusFilter(paymentStatusFilter === 'PAID_IN_FULL' ? 'ALL' : 'PAID_IN_FULL')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            paymentStatusFilter === 'PAID_IN_FULL'
              ? 'bg-emerald-500/20 border-emerald-400 ring-2 ring-emerald-400/50'
              : 'bg-[#090E26] border-emerald-500/25 hover:border-emerald-500/50'
          }`}
        >
          <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-400 block font-bold">Paid in Full</span>
          <span className="font-cinzel text-lg sm:text-2xl font-extrabold text-emerald-300 mt-0.5 block">
            {stats.countPaidInFull}
          </span>
          <span className="text-[10px] text-emerald-400/80 block mt-0.5">Zero balance remaining</span>
        </button>
      </div>

      {/* Quick View Segmented Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-4 scrollbar-none">
        <button
          type="button"
          onClick={() => { setStatusFilter('ALL'); setInstitutionFilter('ALL'); }}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
            statusFilter === 'ALL' && institutionFilter === 'ALL'
              ? 'bg-white/20 text-white font-bold border border-white/30 shadow-sm'
              : 'bg-[#090E26] text-slate-300 hover:text-white border border-white/10'
          }`}
        >
          <span>All Submissions</span>
          <span className="px-1.5 py-0.2 rounded-full bg-black/40 text-[10px] font-mono">{stats.total}</span>
        </button>

        <button
          type="button"
          onClick={() => { setStatusFilter('PENDING'); setInstitutionFilter('ALL'); }}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
            statusFilter === 'PENDING'
              ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40 font-bold shadow-sm'
              : 'bg-[#090E26] text-slate-300 hover:text-amber-300 border border-white/10'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          <span>🟡 Needs Action</span>
          <span className="px-1.5 py-0.2 rounded-full bg-amber-950/60 text-amber-300 text-[10px] font-mono font-bold">{stats.pending}</span>
        </button>

        <button
          type="button"
          onClick={() => { setStatusFilter('VERIFIED'); setInstitutionFilter('ALL'); }}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
            statusFilter === 'VERIFIED'
              ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 font-bold shadow-sm'
              : 'bg-[#090E26] text-slate-300 hover:text-emerald-300 border border-white/10'
          }`}
        >
          <span>🟢 Verified Approved</span>
          <span className="px-1.5 py-0.2 rounded-full bg-emerald-950/60 text-emerald-300 text-[10px] font-mono font-bold">{stats.verified}</span>
        </button>

        <button
          type="button"
          onClick={() => { setStatusFilter('REJECTED'); setInstitutionFilter('ALL'); }}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
            statusFilter === 'REJECTED'
              ? 'bg-rose-500/25 text-rose-300 border border-rose-500/40 font-bold shadow-sm'
              : 'bg-[#090E26] text-slate-300 hover:text-rose-300 border border-white/10'
          }`}
        >
          <span>🔴 Rejected</span>
          <span className="px-1.5 py-0.2 rounded-full bg-rose-950/60 text-rose-300 text-[10px] font-mono font-bold">{stats.rejected}</span>
        </button>

        <button
          type="button"
          onClick={() => { setStatusFilter('NOT_COMPLETE'); setInstitutionFilter('ALL'); }}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
            statusFilter === 'NOT_COMPLETE'
              ? 'bg-slate-500/25 text-slate-200 border border-slate-500/40 font-bold shadow-sm'
              : 'bg-[#090E26] text-slate-300 hover:text-white border border-white/10'
          }`}
        >
          <span>⚪ Incomplete / Draft</span>
          <span className="px-1.5 py-0.2 rounded-full bg-black/40 text-slate-300 text-[10px] font-mono">{stats.notComplete}</span>
        </button>

        <button
          type="button"
          onClick={() => { setStatusFilter('ALL'); setInstitutionFilter('DELEGATION'); }}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
            institutionFilter === 'DELEGATION'
              ? 'bg-purple-500/25 text-purple-300 border border-purple-500/40 font-bold shadow-sm'
              : 'bg-[#090E26] text-slate-300 hover:text-purple-300 border border-white/10'
          }`}
        >
          <span>🏛️ College Delegations</span>
          <span className="px-1.5 py-0.2 rounded-full bg-purple-950/60 text-purple-300 text-[10px] font-mono font-bold">{stats.delegations}</span>
        </button>

        <button
          type="button"
          onClick={() => { setStatusFilter('ALL'); setInstitutionFilter('SMCH_HOST'); }}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
            institutionFilter === 'SMCH_HOST'
              ? 'bg-teal-500/25 text-teal-300 border border-teal-500/40 font-bold shadow-sm'
              : 'bg-[#090E26] text-slate-300 hover:text-teal-300 border border-white/10'
          }`}
        >
          <span>🏥 SMCH Host Students</span>
          <span className="px-1.5 py-0.2 rounded-full bg-teal-950/60 text-teal-300 text-[10px] font-mono font-bold">{stats.smchHosts}</span>
        </button>

        {/* Quick Format Filter Pills */}
        <button
          type="button"
          onClick={() => setRegTypeFilter('INDIVIDUAL')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
            regTypeFilter === 'INDIVIDUAL'
              ? 'bg-blue-500/25 text-blue-300 border border-blue-500/40 font-bold shadow-sm'
              : 'bg-[#090E26] text-slate-300 hover:text-blue-300 border border-white/10'
          }`}
        >
          <span>👤 Individual Only</span>
          <span className="px-1.5 py-0.2 rounded-full bg-blue-950/60 text-blue-300 text-[10px] font-mono font-bold">{stats.individualEntries}</span>
        </button>

        <button
          type="button"
          onClick={() => setRegTypeFilter('COMBO')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
            regTypeFilter === 'COMBO'
              ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40 font-bold shadow-sm'
              : 'bg-[#090E26] text-slate-300 hover:text-amber-300 border border-white/10'
          }`}
        >
          <span>⚡ Combo Packages</span>
          <span className="px-1.5 py-0.2 rounded-full bg-amber-950/60 text-amber-300 text-[10px] font-mono font-bold">{stats.comboEntries}</span>
        </button>
      </div>

      {/* Operations Toolbar */}
      <div className="p-4 rounded-2xl bg-[#090E26] border border-white/10 mb-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Reg ID, Code, Student Name, College, Mobile, UTR, Batch, Combo..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-black/40 border border-white/15 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#D4AF37]"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filters and Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Format (Individual vs Combo) Filter */}
          <select
            value={regTypeFilter}
            onChange={(e) => setRegTypeFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-xs text-slate-200 focus:outline-none focus:border-[#D4AF37] cursor-pointer"
          >
            <option value="ALL">All Formats ({allRegistrations.length})</option>
            <option value="INDIVIDUAL">👤 Individual ({stats.individualEntries})</option>
            <option value="COMBO">⚡ Combo Packages ({stats.comboEntries})</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-xs text-slate-200 focus:outline-none focus:border-[#D4AF37] cursor-pointer"
          >
            <option value="ALL">All Statuses ({allRegistrations.length})</option>
            <option value="PENDING">🟡 Pending ({stats.pending})</option>
            <option value="VERIFIED">🟢 Verified ({stats.verified})</option>
            <option value="REJECTED">🔴 Rejected ({stats.rejected})</option>
            <option value="NOT_COMPLETE">⚪ Not Complete ({stats.notComplete})</option>
          </select>

          {/* Payment Balance Filter */}
          <select
            value={paymentStatusFilter}
            onChange={(e) => setPaymentStatusFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl bg-black/40 border border-amber-500/35 text-xs text-amber-200 focus:outline-none focus:border-[#D4AF37] cursor-pointer font-medium"
          >
            <option value="ALL">All Payment Statuses</option>
            <option value="PAID_IN_FULL">🟢 Paid in Full ({stats.countPaidInFull})</option>
            <option value="ADVANCE_PAID">🟡 Advance Paid ({stats.countAdvancePaid})</option>
            <option value="PENDING">🔴 Unpaid / Pending ({stats.countNoPayment})</option>
          </select>

          {/* Institution Filter Dropdown */}
          <select
            value={institutionFilter}
            onChange={(e) => setInstitutionFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-xs text-slate-200 focus:outline-none focus:border-[#D4AF37] cursor-pointer"
          >
            <option value="ALL">All Institutions</option>
            <option value="DELEGATION">🏛️ Official Delegations ({stats.delegations})</option>
            <option value="SMCH_HOST">🏥 SMCH Host Students ({stats.smchHosts})</option>
            <option value="OTHER_COLLEGE">🎓 Other Colleges ({stats.otherColleges})</option>
          </select>

          {/* Event Filter */}
          <select
            value={eventFilter}
            onChange={(e) => setEventFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-xs text-slate-200 focus:outline-none focus:border-[#D4AF37] cursor-pointer"
          >
            <option value="ALL">All {EVENTS_DATA.length} Events</option>
            {EVENTS_DATA.map((ev) => (
              <option key={ev.code} value={ev.code}>{ev.code} ({ev.title})</option>
            ))}
          </select>

          {/* Sort Filter */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-xs text-slate-200 focus:outline-none focus:border-[#D4AF37] cursor-pointer"
          >
            <option value="newest">🕒 Newest First</option>
            <option value="oldest">⏳ Oldest First</option>
            <option value="amount_desc">💰 Fee: High to Low</option>
            <option value="amount_asc">🪙 Fee: Low to High</option>
            <option value="event">🎭 Event Code (A-Z)</option>
            <option value="college">🏫 College Name (A-Z)</option>
          </select>

          {/* Expand/Collapse All Rows Toggle */}
          <button
            type="button"
            onClick={handleToggleExpandAll}
            className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Expand or collapse all details inline"
          >
            <Layers className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>
              {filteredRegistrations.length > 0 && filteredRegistrations.every((r) => expandedRowIds[r.id])
                ? 'Collapse Rows'
                : 'Expand All'}
            </span>
          </button>

          {/* Refresh */}
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh submissions"
          >
            <RefreshCw className={`w-4 h-4 text-[#D4AF37] ${loading ? 'animate-spin' : ''}`} />
          </button>

          {/* Toggle Registration Controls Panel */}
          <button
            type="button"
            onClick={() => setShowRegistrationControls(!showRegistrationControls)}
            className={`px-3.5 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer border ${
              showRegistrationControls
                ? 'bg-[#15204C] text-[#F5E7C4] border-[#D4AF37]'
                : 'bg-white/5 hover:bg-white/10 text-slate-200 border-white/10'
            }`}
            title="Stop or reopen registrations per event"
          >
            <Sliders className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Registration Controls</span>
            {EVENTS_DATA.some(ev => isEventRegistrationOpen(ev.id) === false) && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-mono font-bold">
                {EVENTS_DATA.filter(ev => isEventRegistrationOpen(ev.id) === false).length} Stopped
              </span>
            )}
          </button>

          {/* Promo Code & Discount Management Button */}
          {isMainAdmin && (
            <button
              type="button"
              onClick={() => {
                loadPromoCodes();
                setShowPromoCodeModal(true);
              }}
              className="px-3.5 py-2 rounded-xl font-bold text-xs uppercase tracking-wider text-[#F5E7C4] bg-[#0E1538] hover:bg-[#152050] border border-[#D4AF37]/50 transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
              title="Manage discount promo codes and advance payment codes"
            >
              <Tag className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Promo Codes ({promoCodes.length})</span>
            </button>
          )}

          {/* Classify By Events Button */}
          <button
            type="button"
            onClick={() => setShowEventClassificationModal(true)}
            className="px-3.5 py-2 rounded-xl font-bold text-xs uppercase tracking-wider text-purple-200 bg-purple-900/40 hover:bg-purple-800/60 border border-purple-500/40 transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
            title="Classify and view registrations grouped by event"
          >
            <Layers className="w-3.5 h-3.5 text-purple-400" />
            <span>Classify By Events</span>
          </button>

          {/* Download Verified By Event CSV */}
          <button
            type="button"
            onClick={() => setShowExportScopeModal(true)}
            className="px-3.5 py-2 rounded-xl font-bold text-xs uppercase tracking-wider text-emerald-950 bg-gradient-to-r from-emerald-300 via-emerald-400 to-teal-400 hover:brightness-110 transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-500/20"
            title="Export only verified & approved registrations formatted event by event for Excel/Sheets"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-950" />
            <span>Verified By Event (Excel)</span>
          </button>

          {/* Download CSV */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl font-bold text-xs uppercase tracking-wider text-[#050714] bg-gradient-to-r from-[#F5E7C4] via-[#D4AF37] to-[#B38F26] hover:brightness-110 transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-[#D4AF37]/20"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download All (CSV)</span>
          </button>

        </div>
      </div>

      {/* Event Registration Control Panel (Visible when toggled) */}
      {showRegistrationControls && (
        <div className="mb-6 p-5 sm:p-6 rounded-2xl bg-[#090E26] border-2 border-[#D4AF37]/50 celestial-glass shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#D4AF37]" />
                <h3 className="font-cinzel text-base sm:text-lg font-bold text-white">
                  Event Registration Controls (Admin 1 Desk)
                </h3>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Registrations stay open for all events until you manually stop them. Stop or reopen registration for any event at any time.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleReopenAllReg}
                className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Open All Events</span>
              </button>
              <button
                type="button"
                onClick={handleStopAllReg}
                className="px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Square className="w-3.5 h-3.5" />
                <span>Stop All Events</span>
              </button>
            </div>
          </div>

          {/* Grid of all events with individual status & toggle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {EVENTS_DATA.map((ev, idx) => {
              const isOpen = isEventRegistrationOpen(ev.id);
              return (
                <div
                  key={ev.id}
                  className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                    isOpen
                      ? 'bg-[#0B102B]/80 border-white/10 hover:border-emerald-500/30'
                      : 'bg-rose-950/20 border-rose-500/40'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#D4AF37]">
                        #{idx + 1} {ev.code}
                      </span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                          isOpen
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        }`}
                      >
                        {isOpen ? 'OPEN' : 'STOPPED'}
                      </span>
                    </div>
                    <p className="text-xs text-white font-medium truncate mt-0.5">
                      {ev.title}
                    </p>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {ev.type} · {ev.registrationFee}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleEventReg(ev.id, ev.code, isOpen)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                      isOpen
                        ? 'bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 hover:brightness-110'
                        : 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 hover:brightness-110'
                    }`}
                  >
                    {isOpen ? 'Stop Reg' : 'Reopen Reg'}
                  </button>
                </div>
              );
            })}
          </div>

          {/* SMCH Host Passcode Management Box */}
          <div className="mt-5 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-cinzel text-sm font-bold text-[#F5E7C4] flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-[#D4AF37]" />
                Srinivasan Medical College Passcode Settings
              </h4>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                Active Code: {getSmchPasscode()}
              </span>
            </div>
            <p className="text-xs text-slate-300 mb-3">
              Students from Srinivasan Medical College entering this verification passcode during registration get free (₹0) entry fee waiver.
            </p>
            <form onSubmit={handleSaveSmchPasscode} className="flex flex-col sm:flex-row items-center gap-2">
              <input
                type="text"
                value={smchCodeInput}
                onChange={(e) => setSmchCodeInput(e.target.value)}
                placeholder="Enter passcode (e.g. CELESMCH)"
                className="w-full sm:w-64 px-3 py-2 bg-[#060A1D] border border-white/20 focus:border-[#D4AF37] rounded-lg text-xs font-mono text-white focus:outline-none"
              />
              <button
                type="submit"
                className="w-full sm:w-auto px-4 py-2 bg-[#D4AF37] hover:brightness-110 text-[#070B1B] font-bold text-xs uppercase tracking-wider rounded-lg transition-all cursor-pointer whitespace-nowrap shadow-sm"
              >
                Update Passcode
              </button>
              {savedPasscodeSuccess && (
                <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Saved!
                </span>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Main Registrations Table */}
      {filteredRegistrations.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-[#080D21]/60 border border-white/10">
          <Users className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <h4 className="text-white font-medium text-sm">No matching registrations found</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            Try adjusting your search query or status filter to see other submissions.
          </p>
        </div>
      ) : (
        <div className="celestial-glass rounded-2xl overflow-hidden border border-white/10 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-black/50 text-[11px] font-mono uppercase tracking-wider text-[#D4AF37]">
                  <th className="py-3.5 px-3 text-center w-12">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={handleToggleSelectAll}
                      className="rounded accent-[#D4AF37] cursor-pointer w-4 h-4"
                      title="Select / Deselect all visible rows"
                    />
                  </th>
                  <th className="py-3.5 px-3">Reg ID & Event</th>
                  <th className="py-3.5 px-3">Primary Captain</th>
                  <th className="py-3.5 px-3">College & City</th>
                  <th className="py-3.5 px-3">Roster & ID Proofs</th>
                  <th className="py-3.5 px-3">Payment & Receipt</th>
                  <th className="py-3.5 px-3 text-center">Desk Status</th>
                  <th className="py-3.5 px-3 text-center">Verify / Reject Action</th>
                  <th className="py-3.5 px-3 text-right">Dossier / Manage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredRegistrations.map((reg, index) => {
                  const isSelected = selectedRegIds.includes(reg.id);
                  const deskStatus = getDeskStatus(reg);
                  const isPending = deskStatus === 'PENDING';
                  const isVerified = deskStatus === 'VERIFIED';
                  const isRejected = deskStatus === 'REJECTED';
                  const isNotComplete = deskStatus === 'NOT_COMPLETE';

                  const paymentMediaUrl = getMediaUrl(
                    reg.paymentScreenshotData || reg.paymentScreenshotPath,
                    'payment-proofs'
                  );

                  const uploadedIdCount = reg.participants.filter(
                    (p) => Boolean(p.idCardFileData || p.idCardStoragePath || p.idCardFileName)
                  ).length;

                  return (
                    <React.Fragment key={reg.id}>
                      <tr className={`hover:bg-white/[0.03] transition-colors ${isSelected ? 'bg-[#D4AF37]/10' : ''}`}>
                      {/* Checkbox, Serial Number & Expand Toggle */}
                      <td className="py-3 px-3 text-center font-mono">
                        <div className="flex flex-col items-center justify-center gap-1">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectRow(reg.id)}
                            className="rounded accent-[#D4AF37] cursor-pointer w-4 h-4"
                          />
                          <button
                            type="button"
                            onClick={() => toggleExpandRow(reg.id)}
                            className={`p-1 rounded-md transition-all cursor-pointer ${
                              expandedRowIds[reg.id]
                                ? 'bg-[#D4AF37] text-black font-bold shadow-sm'
                                : 'bg-white/5 hover:bg-white/15 text-slate-300'
                            }`}
                            title={expandedRowIds[reg.id] ? 'Hide details' : 'Show all details inline'}
                          >
                            {expandedRowIds[reg.id] ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <span className="text-[10px] text-slate-400 font-bold">#{index + 1}</span>
                        </div>
                      </td>
                      {/* 1. Reg ID & Event */}
                      <td className="py-3 px-3 font-mono">
                        <div className="font-bold text-white text-xs">{reg.id}</div>
                        <div className="text-[11px] text-[#E6C57D] font-semibold">{reg.eventCode} · {reg.eventTitle}</div>
                        <div className="text-[10px] text-slate-400">{reg.eventType} · {reg.createdAt}</div>
                        {(reg.comboName || reg.comboId || reg.comboGroupId) && (
                          <div className="mt-1">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-extrabold bg-amber-500/25 text-amber-300 border border-amber-400/60 shadow-sm">
                              ⚡ COMBO CODE: {reg.comboId ? reg.comboId.toUpperCase() : 'COMBO'} ({reg.comboName || 'Combo Offer'})
                            </span>
                          </div>
                        )}
                      </td>

                      {/* 2. Primary Captain */}
                      <td className="py-3 px-3">
                        <div className="font-semibold text-white">{reg.participants[0]?.fullName || 'Participant'}</div>
                        <div className="text-slate-300 text-[11px] flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-[#D4AF37]/70" />
                          <span>{reg.participants[0]?.mobile || 'N/A'}</span>
                        </div>
                        <div className="text-slate-400 text-[10px] truncate max-w-[140px] mt-0.5">
                          {reg.participants[0]?.email || 'N/A'}
                        </div>
                      </td>

                      {/* 3. College & City */}
                      <td className="py-3 px-3">
                        <div className="text-slate-200 font-medium truncate max-w-[160px]" title={reg.college?.collegeName}>
                          {reg.college?.collegeName || 'N/A'}
                        </div>
                        <div className="text-slate-400 text-[11px] flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-500" />
                          <span>{reg.college?.city}, {reg.college?.state}</span>
                        </div>
                        {reg.college?.isHostCollege ? (
                          <div className="mt-1 flex flex-wrap items-center gap-1">
                            <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-500/25 text-emerald-300 font-mono font-bold border border-emerald-500/40">
                              SMCH Host · Free ₹0
                            </span>
                            {reg.college.hostRegisterNumber && (
                              <span className="text-[9px] font-mono text-[#F5E7C4]">
                                Reg: {reg.college.hostRegisterNumber}
                              </span>
                            )}
                          </div>
                        ) : reg.college?.isCollegeDelegation ? (
                          <span className="inline-block mt-1 px-1.5 py-0.2 rounded text-[9px] bg-purple-500/20 text-purple-300 font-mono border border-purple-500/30">
                            Official College Delegation
                          </span>
                        ) : (
                          <span className="inline-block mt-1 px-1.5 py-0.2 rounded text-[9px] bg-sky-500/15 text-sky-300 font-mono border border-sky-500/25">
                            Other College (Direct)
                          </span>
                        )}
                      </td>

                      {/* 4. Roster & ID Proofs */}
                      <td className="py-3 px-3">
                        <div className="font-mono text-white text-xs">
                          <strong className="text-[#E6C57D]">{reg.participantCount || reg.participants.length || 1}</strong> participant{(reg.participantCount || reg.participants.length || 1) !== 1 ? 's' : ''}
                        </div>
                        {reg.teamName && (
                          <div className="text-[10px] text-slate-300 truncate max-w-[130px]" title={reg.teamName}>
                            Team: {reg.teamName}
                          </div>
                        )}
                        
                        {/* ID Cards Uploaded Indicator & Quick View */}
                        <div className="mt-1.5 flex items-center gap-1.5">
                          {uploadedIdCount > 0 ? (
                            <button
                              type="button"
                              onClick={() => setInspectRegistration(reg)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-[#D4AF37]/15 text-[#F5E7C4] border border-[#D4AF37]/30 hover:bg-[#D4AF37]/25 transition-colors cursor-pointer"
                              title="Inspect uploaded ID cards"
                            >
                              <FileImage className="w-3 h-3 text-[#D4AF37]" />
                              <span>{uploadedIdCount}/{reg.participants.length} IDs (View)</span>
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-500 italic">
                              No IDs uploaded
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 5. Payment & Receipt */}
                      <td className="py-3 px-3">
                        <div className="text-emerald-400 font-bold font-mono text-xs">
                          {reg.college?.isHostCollege ? '₹0 (Host Pass)' : `₹${reg.totalAmount}`}
                        </div>
                        <div className="text-[10px] font-mono text-slate-300 truncate max-w-[120px]" title={reg.utrNumber}>
                          {reg.college?.isHostCollege ? 'Waiver: SMCH-FREE' : `UTR: ${reg.utrNumber || 'N/A'}`}
                        </div>

                        {/* Payment Screenshot Thumbnail & Button */}
                        <div className="mt-1.5">
                          {paymentMediaUrl ? (
                            <button
                              type="button"
                              onClick={() => setActiveLightbox({
                                url: paymentMediaUrl,
                                title: `Payment Receipt Slip · ${reg.id}`,
                                subtitle: `UTR: ${reg.utrNumber} · Amount: ₹${reg.totalAmount} · ${reg.college?.collegeName}`,
                                fileName: reg.paymentScreenshotName || 'receipt_screenshot.png'
                              })}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 transition-colors cursor-pointer"
                              title="Click to view payment screenshot"
                            >
                              <ImageIcon className="w-3 h-3 text-emerald-400" />
                              <span>View Slip 🔍</span>
                            </button>
                          ) : (
                            <span className="text-[10px] text-amber-400/80 italic">
                              No slip uploaded
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 6. Desk Status Badge */}
                      <td className="py-3 px-3 text-center">
                        {isVerified ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                              <CheckCircle className="w-3 h-3" />
                              VERIFIED
                            </span>
                            <span className="text-[9px] text-emerald-400/80 mt-0.5">Admin Approved</span>
                          </div>
                        ) : isRejected ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                              <XCircle className="w-3 h-3" />
                              REJECTED
                            </span>
                            <span className="text-[9px] text-rose-400/80 mt-0.5">Admin Rejected</span>
                          </div>
                        ) : isNotComplete ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-500/20 text-slate-300 border border-slate-500/40">
                              <AlertCircle className="w-3 h-3" />
                              NOT COMPLETE
                            </span>
                            <span className="text-[9px] text-slate-400 mt-0.5">Student Draft</span>
                          </div>
                        ) : (
                          <div className="inline-flex flex-col items-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                              <Clock className="w-3 h-3" />
                              PENDING
                            </span>
                            <span className="text-[9px] text-amber-400/80 mt-0.5">Awaiting Review</span>
                          </div>
                        )}
                      </td>

                      {/* 7. Verify / Reject Action */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          {/* 1. Verify Button */}
                          {!isVerified && (
                            <button
                              type="button"
                              onClick={() => handleVerify(reg.id)}
                              className="px-2.5 py-1 rounded-md bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                              title="Verify payment and approve registration"
                            >
                              <Check className="w-3 h-3" />
                              <span>Verify</span>
                            </button>
                          )}

                          {/* 2. Reject Button */}
                          {!isRejected && (
                            <button
                              type="button"
                              onClick={() => handleOpenRejectModal(reg)}
                              className="px-2.5 py-1 rounded-md bg-rose-500/15 hover:bg-rose-500/35 text-rose-300 border border-rose-500/40 text-[10px] font-semibold transition-colors cursor-pointer flex items-center gap-1"
                              title="Reject registration"
                            >
                              <X className="w-3 h-3" />
                              <span>Reject</span>
                            </button>
                          )}

                          {/* 3. Mark Not Complete / Hold Button */}
                          {!isNotComplete && (
                            <button
                              type="button"
                              onClick={() => handleOpenIncompleteModal(reg)}
                              className="px-2 py-1 rounded-md bg-slate-500/15 hover:bg-slate-500/30 text-slate-300 border border-slate-500/30 text-[10px] transition-colors cursor-pointer"
                              title="Mark as Registration Not Complete"
                            >
                              Hold / Incomplete
                            </button>
                          )}

                          {/* 4. Reset to Pending if already decided */}
                          {(isVerified || isRejected || isNotComplete) && (
                            <button
                              type="button"
                              onClick={() => handleResetToPending(reg.id)}
                              className="p-1 rounded-md bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white transition-colors cursor-pointer"
                              title="Reset back to Pending"
                            >
                              <RotateCcw className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </td>

                      {/* 8. Dossier / Manage */}
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Inline Details Toggle */}
                          <button
                            type="button"
                            onClick={() => toggleExpandRow(reg.id)}
                            className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer border flex items-center gap-1 ${
                              expandedRowIds[reg.id]
                                ? 'bg-[#D4AF37] text-black border-[#D4AF37] font-bold shadow-sm'
                                : 'bg-white/5 hover:bg-white/15 text-slate-200 border-white/15'
                            }`}
                            title="Expand all details inline"
                          >
                            <span>{expandedRowIds[reg.id] ? 'Close' : 'Details'}</span>
                            {expandedRowIds[reg.id] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>

                          {/* Inspect Modal Trigger */}
                          <button
                            type="button"
                            onClick={() => setInspectRegistration(reg)}
                            className="p-1.5 rounded-lg bg-[#D4AF37]/15 hover:bg-[#D4AF37]/30 text-[#E6C57D] hover:text-white transition-colors cursor-pointer border border-[#D4AF37]/30"
                            title="Open full inspector modal"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit Details (Main Admin Only) */}
                          {isMainAdmin && (
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(reg)}
                              className="p-1.5 rounded-lg bg-[#D4AF37]/15 hover:bg-[#D4AF37]/35 text-[#E6C57D] hover:text-white transition-colors cursor-pointer border border-[#D4AF37]/30"
                              title="Edit registration details & fee (Main Admin Only)"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-[#D4AF37]" />
                            </button>
                          )}

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmRegistration(reg)}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 transition-colors cursor-pointer border border-rose-500/20"
                            title="Delete registration permanently"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                      </tr>

                      {/* INLINE EXPANDED DOSSIER DRAWER WITH ALL DETAILS */}
                      {expandedRowIds[reg.id] && (
                      <tr key={`${reg.id}-expanded`} className="bg-[#050818]/95">
                        <td colSpan={9} className="p-0 border-y-2 border-[#D4AF37]/50 shadow-inner">
                          <div className="p-4 sm:p-6 space-y-4 bg-gradient-to-b from-[#090F2C] to-[#040716] text-xs">
                            
                            {/* Drawer Header: Key Metadata & Action Buttons */}
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-white/10">
                              <div className="flex items-center gap-2.5 flex-wrap">
                                <span className="font-mono text-xs font-bold text-[#D4AF37] bg-[#D4AF37]/15 border border-[#D4AF37]/35 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                                  <span>ID: {reg.id}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyText(reg.id, `reg-${reg.id}`, 'Registration ID')}
                                    className="hover:text-white transition-colors cursor-pointer"
                                    title="Copy Reg ID"
                                  >
                                    {copiedKey === `reg-${reg.id}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[#D4AF37]" />}
                                  </button>
                                </span>

                                {reg.registrationCode && (
                                  <span className="font-mono text-xs text-white bg-white/10 border border-white/15 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                                    <span>Code: {reg.registrationCode}</span>
                                    <button
                                      type="button"
                                      onClick={() => handleCopyText(reg.registrationCode, `code-${reg.id}`, 'Registration Code')}
                                      className="hover:text-[#D4AF37] transition-colors cursor-pointer"
                                      title="Copy Code"
                                    >
                                      {copiedKey === `code-${reg.id}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                                    </button>
                                  </span>
                                )}

                                <span className="text-slate-400 font-mono text-[11px]">
                                  Submitted: {reg.createdAt}
                                </span>

                                {/* Institution Badge */}
                                {reg.college?.isHostCollege ? (
                                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono font-bold text-xs flex items-center gap-1.5">
                                    <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
                                    <span>SMCH Host · MBBS {reg.college.hostBatch || 'Batch'} · Reg: {reg.college.hostRegisterNumber || 'Host Student'}</span>
                                  </span>
                                ) : reg.college?.isCollegeDelegation ? (
                                  <span className="px-2.5 py-1 rounded-lg bg-purple-500/20 border border-purple-500/40 text-purple-300 font-mono font-bold text-xs flex items-center gap-1.5">
                                    <Building className="w-3.5 h-3.5 text-purple-400" />
                                    <span>Official College Delegation</span>
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-1 rounded-lg bg-sky-500/20 border border-sky-500/40 text-sky-300 font-mono font-bold text-xs flex items-center gap-1.5">
                                    <Building className="w-3.5 h-3.5 text-sky-400" />
                                    <span>Direct College Entry</span>
                                  </span>
                                )}
                              </div>

                              {/* Action Buttons inside Drawer */}
                              <div className="flex items-center gap-2 flex-wrap">
                                {!isVerified && (
                                  <button
                                    type="button"
                                    onClick={() => handleVerify(reg.id)}
                                    className="px-3 py-1.5 rounded-lg bg-emerald-500 text-black font-bold text-xs hover:bg-emerald-400 transition-colors flex items-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Approve & Verify</span>
                                  </button>
                                )}

                                {!isRejected && (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenRejectModal(reg)}
                                    className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/35 border border-rose-500/40 text-rose-300 font-semibold text-xs transition-colors flex items-center gap-1 cursor-pointer"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                    <span>Reject</span>
                                  </button>
                                )}

                                {!isNotComplete && (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenIncompleteModal(reg)}
                                    className="px-2.5 py-1.5 rounded-lg bg-slate-500/20 hover:bg-slate-500/35 border border-slate-500/30 text-slate-300 text-xs transition-colors cursor-pointer"
                                  >
                                    Hold / Incomplete
                                  </button>
                                )}

                                {(isVerified || isRejected || isNotComplete) && (
                                  <button
                                    type="button"
                                    onClick={() => handleResetToPending(reg.id)}
                                    className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-slate-300 text-xs transition-colors flex items-center gap-1 cursor-pointer"
                                    title="Reset back to pending"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    <span>Reset Pending</span>
                                  </button>
                                )}

                                {isMainAdmin && (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEdit(reg)}
                                    className="px-2.5 py-1.5 rounded-lg bg-[#D4AF37]/20 hover:bg-[#D4AF37]/35 border border-[#D4AF37]/50 text-[#F5E7C4] text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                                    title="Edit registration, host waiver & fee (Main Admin Only)"
                                  >
                                    <Edit3 className="w-3.5 h-3.5 text-[#D4AF37]" />
                                    <span>Edit Registration</span>
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => handleExportSingleRegistration(reg)}
                                  className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs transition-colors flex items-center gap-1 cursor-pointer"
                                  title="Download complete text dossier"
                                >
                                  <Download className="w-3.5 h-3.5 text-[#D4AF37]" />
                                  <span>Dossier</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => toggleExpandRow(reg.id)}
                                  className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white text-xs cursor-pointer"
                                >
                                  Close
                                </button>
                              </div>
                            </div>

                            {/* 3 Detail Cards: Event, College & Payments */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              {/* Card 1: Event & Rules */}
                              <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-2">
                                <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                                  <span className="font-mono text-[10px] uppercase font-bold text-[#D4AF37] flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
                                    Event Details
                                  </span>
                                  <span className="px-1.5 py-0.2 rounded bg-white/10 text-[10px] font-mono text-slate-300">
                                    {reg.eventCode}
                                  </span>
                                </div>
                                <div className="space-y-1 text-slate-300">
                                  <div className="font-bold text-white text-sm">{reg.eventTitle}</div>
                                  <div className="text-[11px] text-slate-400">
                                    Format: <strong className="text-white">{reg.eventType}</strong> ({(reg.participantCount || reg.participants.length)} member{(reg.participantCount || reg.participants.length) !== 1 ? 's' : ''})
                                  </div>
                                  <div className="text-[11px] text-slate-400">
                                    Category: <strong className="text-[#E6C57D]">{reg.eventCategory}</strong>
                                  </div>
                                  <div className="text-[11px] text-slate-400">
                                    Venue: <strong className="text-white">{reg.venue}</strong>
                                  </div>
                                  {reg.teamName && (
                                    <div className="text-[11px] text-slate-400 pt-1">
                                      Team Name: <strong className="text-emerald-400 font-mono">{reg.teamName}</strong>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Card 2: College & Faculty Rep */}
                              <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-2">
                                <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                                  <span className="font-mono text-[10px] uppercase font-bold text-[#D4AF37] flex items-center gap-1">
                                    <Building2 className="w-3.5 h-3.5 text-[#D4AF37]" />
                                    Collegiate Profile
                                  </span>
                                  <span className="px-1.5 py-0.2 rounded bg-white/10 text-[10px] font-mono text-slate-300">
                                    {[reg.college?.city, reg.college?.state].filter(Boolean).join(', ') || 'Tamil Nadu'}
                                  </span>
                                </div>
                                <div className="space-y-1 text-slate-300">
                                  <div className="font-semibold text-white">{reg.college?.collegeName || 'N/A'}</div>
                                  <div className="text-[11px] text-slate-400">
                                    Representative / HOD: <strong className="text-white">{reg.college?.contactPerson || 'N/A'}</strong>
                                  </div>
                                  {reg.college?.contactMobile && (
                                    <div className="text-[11px] flex items-center gap-2">
                                      <span className="text-slate-400">Mobile:</span>
                                      <a href={`tel:${reg.college.contactMobile}`} className="text-emerald-400 hover:underline font-mono">
                                        {reg.college.contactMobile}
                                      </a>
                                    </div>
                                  )}
                                  {reg.college?.contactEmail && (
                                    <div className="text-[11px] text-slate-400 truncate">
                                      Email: <span className="text-slate-300">{reg.college.contactEmail}</span>
                                    </div>
                                  )}
                                  {reg.college?.isHostCollege && (
                                    <div className="mt-1 pt-1 border-t border-white/5 text-[11px] text-emerald-300 font-mono">
                                      SMCH Student Reg: <strong>{reg.college.hostRegisterNumber || 'Verified'}</strong> · Batch: <strong>{reg.college.hostBatch || 'MBBS'}</strong>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Card 3: Financials & Payment Proof Slip */}
                              <div className="p-3.5 rounded-xl bg-black/40 border border-[#D4AF37]/30 space-y-2">
                                <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                                  <span className="font-mono text-[10px] uppercase font-bold text-emerald-400 flex items-center gap-1">
                                    <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                                    Payment Audit
                                  </span>
                                  <span className="font-mono font-bold text-sm text-emerald-300">
                                    {reg.college?.isHostCollege ? '₹0 (Host Pass)' : `₹${reg.totalAmount}`}
                                  </span>
                                </div>

                                <div className="space-y-1.5 text-slate-300">
                                  <div className="flex items-center justify-between text-[11px]">
                                    <span className="text-slate-400">UPI / UTR Reference:</span>
                                    <span className="font-mono font-bold text-[#F5E7C4] flex items-center gap-1 bg-black/60 px-2 py-0.5 rounded border border-white/10">
                                      <span>{reg.utrNumber || 'N/A'}</span>
                                      {reg.utrNumber && reg.utrNumber !== 'NOT_SUBMITTED' && (
                                        <button
                                          type="button"
                                          onClick={() => handleCopyText(reg.utrNumber || '', `utr-${reg.id}`, 'UTR Number')}
                                          className="hover:text-white transition-colors cursor-pointer"
                                          title="Copy UTR"
                                        >
                                          {copiedKey === `utr-${reg.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
                                        </button>
                                      )}
                                    </span>
                                  </div>

                                  <div className="flex items-center justify-between text-[11px]">
                                    <span className="text-slate-400">Fee Rate:</span>
                                    <span className="font-mono text-slate-300">₹{reg.feePerUnit} ({reg.feeType})</span>
                                  </div>

                                  {/* Payment Proof Slip Thumbnail / Viewer */}
                                  <div className="pt-1 flex items-center justify-between">
                                    <span className="text-slate-400 text-[11px]">Screenshot Proof:</span>
                                    {paymentMediaUrl ? (
                                      <button
                                        type="button"
                                        onClick={() => setActiveLightbox({
                                          url: paymentMediaUrl,
                                          title: `Payment Receipt · ${reg.id}`,
                                          subtitle: `UTR: ${reg.utrNumber} · ₹${reg.totalAmount} · ${reg.college?.collegeName}`,
                                          fileName: reg.paymentScreenshotName || 'receipt.png'
                                        })}
                                        className="px-2.5 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-mono text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                                      >
                                        <ImageIcon className="w-3 h-3" />
                                        <span>View Screenshot 🔍</span>
                                      </button>
                                    ) : (
                                      <span className="text-[10px] text-amber-400/90 italic">
                                        No screenshot attached
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Participant Roster Table with ID Proof Buttons */}
                            <div className="rounded-xl border border-white/10 bg-black/40 overflow-hidden">
                              <div className="p-3 bg-white/5 border-b border-white/10 flex items-center justify-between flex-wrap gap-2">
                                <span className="font-mono text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                                  <Users className="w-3.5 h-3.5 text-[#D4AF37]" />
                                  <span>Full Participant Roster ({(reg.participantCount || reg.participants.length)} Student{(reg.participantCount || reg.participants.length) !== 1 ? 's' : ''})</span>
                                </span>
                                
                                {reg.participants[0]?.mobile && (
                                  <div className="flex items-center gap-2">
                                    <a
                                      href={getWhatsAppLink(reg.participants[0].mobile, reg.participants[0].fullName, reg.eventTitle, reg.registrationCode || reg.id)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="px-2.5 py-1 rounded-lg bg-emerald-600/25 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                                    >
                                      <MessageCircle className="w-3 h-3 text-emerald-300" />
                                      <span>WhatsApp Captain</span>
                                    </a>
                                    <a
                                      href={`tel:${reg.participants[0].mobile}`}
                                      className="px-2.5 py-1 rounded-lg bg-blue-600/25 hover:bg-blue-600/40 text-blue-300 border border-blue-500/40 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                                    >
                                      <Phone className="w-3 h-3 text-blue-300" />
                                      <span>Call Captain</span>
                                    </a>
                                  </div>
                                )}
                              </div>

                              <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                  <thead className="bg-[#0A102A] text-slate-400 text-[10px] uppercase font-mono tracking-wider border-b border-white/5">
                                    <tr>
                                      <th className="py-2 px-3 text-center">#</th>
                                      <th className="py-2 px-3">Student Name</th>
                                      <th className="py-2 px-3">Role</th>
                                      <th className="py-2 px-3">Mobile & WhatsApp</th>
                                      <th className="py-2 px-3">Email</th>
                                      <th className="py-2 px-3">Demographics</th>
                                      <th className="py-2 px-3 text-right">Student ID Proof</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-white/5">
                                    {reg.participants
                                      .filter((m, mIdx) => mIdx === 0 || Boolean(m.fullName && m.fullName.trim()))
                                      .map((m, mIdx) => {
                                      const idProofUrl = getMediaUrl(
                                        m.idCardFileData || m.idCardStoragePath,
                                        'id-cards'
                                      );

                                      return (
                                        <tr key={mIdx} className="hover:bg-white/5 transition-colors">
                                          <td className="py-2.5 px-3 text-center font-mono font-bold text-[#D4AF37]">
                                            {mIdx + 1}
                                          </td>
                                          <td className="py-2.5 px-3 font-semibold text-white">
                                            {m.fullName}
                                          </td>
                                          <td className="py-2.5 px-3 font-mono text-[11px]">
                                            <span className={`px-2 py-0.5 rounded ${
                                              mIdx === 0
                                                ? 'bg-[#D4AF37]/20 text-[#F5E7C4] border border-[#D4AF37]/35 font-bold'
                                                : 'bg-white/5 text-slate-300'
                                            }`}>
                                              {m.role || (mIdx === 0 ? 'Leader' : 'Member')}
                                            </span>
                                          </td>
                                          <td className="py-2.5 px-3 font-mono text-[11px]">
                                            {m.mobile ? (
                                              <div className="flex items-center gap-2">
                                                <a href={`tel:${m.mobile}`} className="text-slate-200 hover:text-emerald-400 hover:underline">
                                                  {m.mobile}
                                                </a>
                                                <a
                                                  href={getWhatsAppLink(m.mobile, m.fullName, reg.eventTitle, reg.registrationCode || reg.id)}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="p-1 rounded bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30"
                                                  title="WhatsApp Student"
                                                >
                                                  <MessageCircle className="w-3 h-3 text-emerald-300" />
                                                </a>
                                              </div>
                                            ) : (
                                              <span className="text-slate-500">N/A</span>
                                            )}
                                          </td>
                                          <td className="py-2.5 px-3 text-slate-300 text-[11px]">
                                            {m.email || 'N/A'}
                                          </td>
                                          <td className="py-2.5 px-3 text-slate-400 text-[11px] font-mono">
                                            {[m.gender, m.age ? `${m.age} yrs` : null].filter(Boolean).join(' · ') || 'N/A'}
                                          </td>
                                          <td className="py-2.5 px-3 text-right">
                                            {idProofUrl ? (
                                              <button
                                                type="button"
                                                onClick={() => setActiveLightbox({
                                                  url: idProofUrl,
                                                  title: `Student ID Card: ${m.fullName}`,
                                                  subtitle: `${m.role || 'Participant'} · ${reg.college?.collegeName || 'College Student'}`,
                                                  fileName: m.idCardFileName || 'student_id.png'
                                                })}
                                                className="px-2 py-0.5 rounded bg-[#D4AF37]/20 hover:bg-[#D4AF37]/35 text-[#F5E7C4] border border-[#D4AF37]/40 text-[10px] font-mono inline-flex items-center gap-1 cursor-pointer transition-colors"
                                              >
                                                <Eye className="w-3 h-3 text-[#D4AF37]" />
                                                <span>View ID Card</span>
                                              </button>
                                            ) : (
                                              <span className="text-[10px] text-slate-500 italic">No ID uploaded</span>
                                            )}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* FLOATING STICKY ACTION BAR FOR SELECTED ROWS (MAIN ADMIN ONLY) */}
      {selectedRegIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-11/12 max-w-2xl bg-[#090E26]/95 backdrop-blur-lg border-2 border-[#D4AF37] p-3.5 sm:p-4 rounded-2xl shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#D4AF37] text-black font-bold flex items-center justify-center text-xs">
              {selectedRegIds.length}
            </span>
            <span className="text-white font-semibold">Registrations Selected</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleExportSelectedCSV}
              className="px-3 py-1.5 rounded-lg bg-[#D4AF37] hover:brightness-110 text-black font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Selected (CSV)</span>
            </button>

            <button
              type="button"
              onClick={handleBulkVerify}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all flex items-center gap-1 cursor-pointer shadow-sm"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Verify Selected</span>
            </button>

            <button
              type="button"
              onClick={() => setBulkDeleteConfirmModal(true)}
              className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-all flex items-center gap-1 cursor-pointer shadow-sm"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedRegIds([])}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Clear selection"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 1: CHECK ALL COLUMNS / DOSSIER (EVERY SINGLE DETAIL VISIBLE) */}
      {/* ==================================================================== */}
      {inspectRegistration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-4xl celestial-glass rounded-2xl p-6 sm:p-8 border border-[#D4AF37]/50 shadow-2xl space-y-6 my-8 max-h-[92vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-white/10 gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono text-[#D4AF37] uppercase tracking-wider font-semibold">
                    COMPLETE REGISTRATION DOSSIER & DOCUMENT AUDIT
                  </span>
                  {(() => {
                    const status = getDeskStatus(inspectRegistration);
                    if (status === 'VERIFIED') {
                      return <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">VERIFIED</span>;
                    }
                    if (status === 'REJECTED') {
                      return <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">REJECTED</span>;
                    }
                    if (status === 'NOT_COMPLETE') {
                      return <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-slate-500/20 text-slate-300 border border-slate-500/40">NOT COMPLETE</span>;
                    }
                    return <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">PENDING REVIEW</span>;
                  })()}
                </div>
                <h3 className="font-cinzel text-xl sm:text-2xl font-bold text-white tracking-wide">
                  {inspectRegistration.id} · {inspectRegistration.eventCode} ({inspectRegistration.eventTitle})
                </h3>
                {(inspectRegistration.comboName || inspectRegistration.comboId || inspectRegistration.comboGroupId) && (
                  <div className="mt-1.5">
                    <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-mono font-extrabold bg-amber-500/25 text-amber-300 border border-amber-400/60 shadow-md">
                      ⚡ COMBO CODE: {inspectRegistration.comboId ? inspectRegistration.comboId.toUpperCase() : 'COMBO'} ({inspectRegistration.comboName || 'Combo Offer'})
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleExportSingleRegistration(inspectRegistration)}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#F5E7C4] via-[#D4AF37] to-[#B38F26] text-[#050714] text-xs font-bold transition-all hover:brightness-110 flex items-center gap-1.5 cursor-pointer shadow-md"
                  title="Download complete single registration report"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Single Report</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInspectRegistration(null)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="Close dossier"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Action Bar inside Dossier */}
            <div className="p-3.5 rounded-xl bg-[#070B1E] border border-white/10 flex items-center justify-between gap-3 flex-wrap">
              <span className="text-xs text-slate-300">
                <strong>Admin Decision:</strong> Mark status for this registrant
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleVerify(inspectRegistration.id)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/35 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Verify Registration</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenRejectModal(inspectRegistration)}
                  className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/35 text-rose-300 border border-rose-500/40 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Reject</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenIncompleteModal(inspectRegistration)}
                  className="px-3 py-1.5 rounded-lg bg-slate-500/20 hover:bg-slate-500/35 text-slate-300 border border-slate-500/30 text-xs transition-colors cursor-pointer"
                >
                  Mark Not Complete
                </button>
                <button
                  type="button"
                  onClick={() => handleResetToPending(inspectRegistration.id)}
                  className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs transition-colors cursor-pointer flex items-center gap-1"
                  title="Reset to Pending"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Pending</span>
                </button>
              </div>
            </div>

            {/* Section 1: Event & Rules Metadata */}
            <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-3">
              <h4 className="font-cinzel text-xs font-bold text-[#E6C57D] flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#D4AF37]" />
                <span>EVENT DETAILS & PARTICIPATION TYPE</span>
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] block">EVENT CODE</span>
                  <span className="font-bold text-[#D4AF37] font-mono text-sm">{inspectRegistration.eventCode}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">EVENT NAME</span>
                  <span className="font-semibold text-white">{inspectRegistration.eventTitle}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">PARTICIPATION TYPE</span>
                  <span className="text-slate-200">{inspectRegistration.eventType} ({inspectRegistration.participants.length} Participant{inspectRegistration.participants.length !== 1 ? 's' : ''})</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">SUBMISSION DATE</span>
                  <span className="text-slate-200 font-mono">{inspectRegistration.createdAt}</span>
                </div>
                {inspectRegistration.teamName && (
                  <div className="sm:col-span-2">
                    <span className="text-slate-400 text-[10px] block">REGISTERED TEAM NAME</span>
                    <span className="font-medium text-white">{inspectRegistration.teamName}</span>
                  </div>
                )}
                <div className="sm:col-span-2">
                  <span className="text-slate-400 text-[10px] block">EVENT CATEGORY & VENUE</span>
                  <span className="text-slate-300">{inspectRegistration.eventCategory} · {inspectRegistration.venue}</span>
                </div>
              </div>
            </div>

            {/* Section 2: College Affiliation */}
            <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-3">
              <h4 className="font-cinzel text-xs font-bold text-[#E6C57D] flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#D4AF37]" />
                <span>COLLEGE & INSTITUTION DETAILS</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="sm:col-span-2">
                  <span className="text-slate-400 text-[10px] block">COLLEGE / UNIVERSITY NAME</span>
                  <span className="text-white font-medium text-sm">{inspectRegistration.college?.collegeName || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">LOCATION</span>
                  <span className="text-slate-200">{inspectRegistration.college?.city}, {inspectRegistration.college?.state}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">COLLEGE REPRESENTATIVE / HOD</span>
                  <span className="text-slate-200 font-medium">{inspectRegistration.college?.contactPerson || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">REPRESENTATIVE MOBILE</span>
                  <span className="text-slate-200 font-mono">{inspectRegistration.college?.contactMobile || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">REPRESENTATIVE EMAIL</span>
                  <span className="text-slate-200">{inspectRegistration.college?.contactEmail || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">DELEGATION STATUS</span>
                  <span className={`inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-mono ${inspectRegistration.college?.isCollegeDelegation ? 'bg-purple-500/20 text-purple-300' : 'bg-slate-500/20 text-slate-300'}`}>
                    {inspectRegistration.college?.isCollegeDelegation ? 'Official College Delegation' : 'Individual Collegiate Entry'}
                  </span>
                </div>
              </div>

              {/* Host College Student Verification Card */}
              {inspectRegistration.college?.isHostCollege && (
                <div className="mt-3 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-emerald-500/20">
                    <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4 text-[#D4AF37]" />
                      SRINIVASAN MEDICAL COLLEGE (SMCH) HOST STUDENT WAIVER · ₹0
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-200 text-[10px] font-mono font-bold">
                      VERIFIED HOST ENTRY
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px]">
                    <div>
                      <span className="text-slate-400 block font-mono">STUDENT REGISTER NO:</span>
                      <span className="font-mono font-bold text-white text-xs">
                        {inspectRegistration.college.hostRegisterNumber || 'Provided during Registration'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-mono">MBBS BATCH / YEAR:</span>
                      <span className="font-semibold text-white">
                        {inspectRegistration.college.hostBatch || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-mono">DEPARTMENT / SECTION:</span>
                      <span className="text-slate-200">
                        {inspectRegistration.college.hostDepartment || 'MBBS'}
                      </span>
                    </div>
                  </div>
                  <p className="mt-2 text-[10px] text-amber-300 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 shrink-0" />
                    <span>Check physical SMCH ID card at registration helpdesk. If non-SMCH student misuses this, click Reject to disqualify.</span>
                  </p>
                </div>
              )}
            </div>

            {/* Section 3: Financial & Payment Verification (WITH ACTUAL PAYMENT SCREENSHOT) */}
            <div className="p-4 rounded-xl bg-black/40 border border-[#D4AF37]/35 space-y-4">
              <h4 className="font-cinzel text-xs font-bold text-[#E6C57D] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-[#D4AF37]" />
                  <span>PAYMENT REMITTANCE & UPLOADED SCREENSHOT AUDIT</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">
                  Fee: ₹{inspectRegistration.totalAmount}
                </span>
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] block">TOTAL REGISTRATION FEE</span>
                  <span className="font-bold text-white font-mono text-base">₹{inspectRegistration.totalAmount}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">AMOUNT PAID</span>
                  <span className="font-bold text-emerald-400 font-mono text-base">
                    ₹{inspectRegistration.paidAmount !== undefined ? inspectRegistration.paidAmount : (inspectRegistration.paymentConfirmed ? inspectRegistration.totalAmount : 0)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">PENDING BALANCE DUE</span>
                  <span className="font-bold text-amber-300 font-mono text-base">
                    ₹{inspectRegistration.pendingAmount !== undefined ? inspectRegistration.pendingAmount : Math.max(0, inspectRegistration.totalAmount - (inspectRegistration.paidAmount || 0))}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">UPI UTR / TRANSACTION ID</span>
                  <span className="font-mono text-[#F5E7C4] font-bold text-sm bg-black/50 px-2 py-1 rounded inline-block">
                    {inspectRegistration.utrNumber || 'None'}
                  </span>
                </div>
              </div>

              {/* Payment Details Management (Admin Editable) */}
              <div className="mt-3 p-4 rounded-xl bg-[#090E26] border border-amber-500/40 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <span className="font-bold text-amber-300 text-xs flex items-center gap-1.5 uppercase font-mono">
                    <CreditCard className="w-4 h-4 text-[#D4AF37]" />
                    Advance Payment & Balance Management (Admin Control)
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono border ${
                    (inspectRegistration.pendingAmount === 0 || inspectRegistration.paymentStatus === 'Paid in Full')
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : (inspectRegistration.paidAmount && inspectRegistration.paidAmount > 0) || inspectRegistration.paymentStatus === 'Advance Paid'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  }`}>
                    {inspectRegistration.pendingAmount === 0 || inspectRegistration.paymentStatus === 'Paid in Full'
                      ? 'PAID IN FULL'
                      : (inspectRegistration.paidAmount && inspectRegistration.paidAmount > 0) || inspectRegistration.paymentStatus === 'Advance Paid'
                      ? 'ADVANCE PAID'
                      : 'PENDING'}
                  </span>
                </div>

                <form onSubmit={handleSavePaymentDetails} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="text-slate-400 text-[10px] uppercase font-mono block mb-1">
                        Total Registration Fee (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        disabled={!isMainAdmin}
                        value={paymentInputTotal}
                        onChange={(e) => setPaymentInputTotal(Math.max(0, Number(e.target.value) || 0))}
                        className="w-full px-3 py-2 rounded-lg bg-black/60 border border-[#D4AF37]/50 font-mono font-bold text-white text-sm focus:outline-none focus:border-[#D4AF37] disabled:opacity-60"
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 text-[10px] uppercase font-mono block mb-1">
                        Amount Paid Received (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        disabled={!isMainAdmin}
                        value={paymentInputPaid}
                        onChange={(e) => setPaymentInputPaid(Math.max(0, Number(e.target.value) || 0))}
                        className="w-full px-3 py-2 rounded-lg bg-black/60 border border-amber-500/50 font-mono font-bold text-emerald-300 text-sm focus:outline-none focus:border-[#D4AF37] disabled:opacity-60"
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 text-[10px] uppercase font-mono block mb-1">
                        Calculated Pending Balance
                      </label>
                      <div className={`px-3 py-2 rounded-lg bg-black/50 border font-mono font-bold text-sm ${
                        Math.max(0, paymentInputTotal - paymentInputPaid) > 0
                          ? 'border-amber-500/50 text-amber-300'
                          : 'border-emerald-500/50 text-emerald-300'
                      }`}>
                        ₹{Math.max(0, paymentInputTotal - paymentInputPaid).toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-400 text-[10px] uppercase font-mono block mb-1">
                      Payment Remittance Notes / Remittance Reference
                    </label>
                    <input
                      type="text"
                      value={paymentInputNotes}
                      onChange={(e) => setPaymentInputNotes(e.target.value)}
                      placeholder="e.g. Paid ₹1000 advance via GPay, balance ₹2000 due at registration desk"
                      className="w-full px-3 py-1.5 rounded-lg bg-black/50 border border-white/15 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="submit"
                      disabled={isSavingPayment}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 hover:brightness-110 transition-all cursor-pointer shadow-md disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{isSavingPayment ? 'Saving Payment...' : 'Update Payment Details'}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Uploaded Payment Screenshot Visual Display */}
              <div className="pt-3 border-t border-white/10">
                <span className="text-xs font-semibold text-slate-200 block mb-2">
                  Uploaded Payment Screenshot / Remittance Slip:
                </span>

                {(() => {
                  const mediaUrl = getMediaUrl(
                    inspectRegistration.paymentScreenshotData || inspectRegistration.paymentScreenshotPath,
                    'payment-proofs'
                  );

                  if (mediaUrl) {
                    return (
                      <div className="p-3 rounded-xl bg-[#070B1E] border border-emerald-500/30 flex flex-col sm:flex-row items-center gap-4">
                        {/* Thumbnail with Click to Enlarge */}
                        <div 
                          onClick={() => setActiveLightbox({
                            url: mediaUrl,
                            title: `Payment Screenshot · ${inspectRegistration.id}`,
                            subtitle: `UTR: ${inspectRegistration.utrNumber} · Amount: ₹${inspectRegistration.totalAmount} · ${inspectRegistration.college?.collegeName}`,
                            fileName: inspectRegistration.paymentScreenshotName || 'receipt_slip.png'
                          })}
                          className="w-36 h-28 sm:w-44 sm:h-32 rounded-lg overflow-hidden border border-white/20 bg-black/60 shrink-0 relative group cursor-pointer"
                        >
                          <img 
                            src={mediaUrl} 
                            alt="Payment Slip" 
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform" 
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <span className="text-[10px] text-white font-bold flex items-center gap-1 bg-black/70 px-2 py-1 rounded">
                              <ZoomIn className="w-3 h-3" /> Click to Enlarge
                            </span>
                          </div>
                        </div>

                        {/* File details & actions */}
                        <div className="flex-1 space-y-1.5 w-full">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span className="text-xs font-semibold text-white">Payment Receipt Attached</span>
                          </div>
                          <span className="text-[11px] text-slate-300 font-mono block">
                            File: {inspectRegistration.paymentScreenshotName || 'payment_proof_receipt.png'}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            Click image or the button below to view full-resolution remittance proof.
                          </span>

                          <div className="pt-1 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setActiveLightbox({
                                url: mediaUrl,
                                title: `Payment Screenshot · ${inspectRegistration.id}`,
                                subtitle: `UTR: ${inspectRegistration.utrNumber} · Amount: ₹${inspectRegistration.totalAmount} · ${inspectRegistration.college?.collegeName}`,
                                fileName: inspectRegistration.paymentScreenshotName || 'receipt_slip.png'
                              })}
                              className="px-3 py-1.5 rounded-lg bg-[#D4AF37] hover:brightness-110 text-black text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                            >
                              <ZoomIn className="w-3.5 h-3.5" />
                              <span>View Full Size Screenshot</span>
                            </button>
                            <a
                              href={mediaUrl}
                              download={inspectRegistration.paymentScreenshotName || `${inspectRegistration.id}_receipt.png`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Download</span>
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>
                        No payment screenshot was uploaded by the student during registration. (UTR Number provided: <strong>{inspectRegistration.utrNumber || 'N/A'}</strong>)
                      </span>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Section 4: All Registered Participants & Their Uploaded ID Cards */}
            <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-cinzel text-xs font-bold text-[#E6C57D] flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#D4AF37]" />
                  <span>ALL REGISTERED PARTICIPANTS & STUDENT ID PROOFS ({inspectRegistration.participants.length} MEMBERS)</span>
                </h4>
                <span className="text-[10px] font-mono text-slate-400">
                  Audit each member's credentials and college ID
                </span>
              </div>

              <div className="space-y-3">
                {inspectRegistration.participants.map((p, idx) => {
                  const idMediaUrl = getMediaUrl(
                    p.idCardFileData || p.idCardStoragePath,
                    'id-cards'
                  );

                  return (
                    <div 
                      key={idx} 
                      className="p-3.5 rounded-xl bg-[#070B1E] border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                    >
                      {/* Left: Member info */}
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="w-6 h-6 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/50 text-[#F5E7C4] text-xs font-bold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <span className="font-bold text-white text-sm">{p.fullName}</span>
                          <span className="text-[11px] font-mono text-[#D4AF37] px-2 py-0.5 rounded bg-black/50 border border-white/10">
                            {p.role || (idx === 0 ? 'Team Captain / Primary Contact' : 'Team Member')}
                          </span>
                        </div>

                        <div className="text-xs text-slate-300 grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                          <div>
                            <span className="text-slate-500 text-[10px] block">GENDER & AGE</span>
                            <span>{p.gender}, Age {p.age}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 text-[10px] block">MOBILE</span>
                            <span className="font-mono text-white">{p.mobile || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 text-[10px] block">EMAIL</span>
                            <span className="text-slate-300">{p.email || 'N/A'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Uploaded ID Card Box */}
                      <div className="w-full md:w-auto shrink-0 pt-2 md:pt-0 border-t md:border-t-0 md:border-l border-white/10 md:pl-4">
                        {idMediaUrl ? (
                          <div className="flex items-center gap-3">
                            <div 
                              onClick={() => setActiveLightbox({
                                url: idMediaUrl,
                                title: `Student ID Card · ${p.fullName}`,
                                subtitle: `${p.role || 'Participant'} · ${inspectRegistration.college?.collegeName} · ${inspectRegistration.id}`,
                                fileName: p.idCardFileName || `id_card_${idx + 1}.jpg`
                              })}
                              className="w-20 h-16 rounded-lg overflow-hidden border border-[#D4AF37]/40 bg-black/80 relative group cursor-pointer shrink-0"
                            >
                              <img 
                                src={idMediaUrl} 
                                alt={`ID card of ${p.fullName}`} 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <ZoomIn className="w-3.5 h-3.5 text-white" />
                              </div>
                            </div>

                            <div className="space-y-1">
                              <span className="text-[11px] font-bold text-white block">ID Card Proof</span>
                              <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                                <Check className="w-3 h-3" /> Attached
                              </span>
                              <button
                                type="button"
                                onClick={() => setActiveLightbox({
                                  url: idMediaUrl,
                                  title: `Student ID Card · ${p.fullName}`,
                                  subtitle: `${p.role || 'Participant'} · ${inspectRegistration.college?.collegeName} · ${inspectRegistration.id}`,
                                  fileName: p.idCardFileName || `id_card_${idx + 1}.jpg`
                                })}
                                className="text-[10px] text-[#D4AF37] hover:underline font-semibold cursor-pointer block"
                              >
                                View ID Full Size 🔍
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 text-xs flex items-center gap-2">
                            <FileQuestion className="w-4 h-4 text-slate-500 shrink-0" />
                            <span className="text-[11px]">No ID card uploaded</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer Controls */}
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <span className="text-xs text-slate-400 font-mono">
                Registrant ID: {inspectRegistration.id}
              </span>
              <div className="flex items-center gap-2">
                {isMainAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      const regToEdit = inspectRegistration;
                      setInspectRegistration(null);
                      handleOpenEdit(regToEdit);
                    }}
                    className="px-4 py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/50 text-xs font-bold text-purple-200 transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-purple-300" />
                    <span>Edit Profile & Fee</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleExportSingleRegistration(inspectRegistration)}
                  className="px-4 py-2 rounded-xl bg-[#D4AF37] hover:brightness-110 text-xs font-bold text-black transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Single Report</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInspectRegistration(null)}
                  className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors cursor-pointer"
                >
                  Close Dossier
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* LIGHTBOX MODAL: FULL RESOLUTION PREVIEW FOR ID CARDS & RECEIPTS */}
      {/* ==================================================================== */}
      {activeLightbox && (
        <div 
          onClick={() => setActiveLightbox(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl max-h-[90vh] flex flex-col celestial-glass rounded-2xl overflow-hidden border border-[#D4AF37]/50 shadow-2xl"
          >
            {/* Header */}
            <div className="p-4 bg-black/70 border-b border-white/10 flex items-center justify-between gap-3">
              <div>
                <h4 className="font-cinzel text-base font-bold text-white">
                  {activeLightbox.title}
                </h4>
                {activeLightbox.subtitle && (
                  <span className="text-xs text-slate-300 block mt-0.5">
                    {activeLightbox.subtitle}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={activeLightbox.url}
                  download={activeLightbox.fileName || 'celestia_document.png'}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
                <button
                  type="button"
                  onClick={() => setActiveLightbox(null)}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Image Preview Box */}
            <div className="p-4 flex items-center justify-center bg-black/90 overflow-auto max-h-[75vh]">
              <img 
                src={activeLightbox.url} 
                alt={activeLightbox.title} 
                className="max-h-[70vh] max-w-full object-contain rounded-lg shadow-lg border border-white/10" 
              />
            </div>

            {/* Footer with filename */}
            <div className="p-3 bg-black/70 border-t border-white/10 text-center text-xs text-slate-400 font-mono">
              {activeLightbox.fileName || 'Uploaded Verification Proof'}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 2: REJECT REGISTRATION WITH REASON */}
      {/* ==================================================================== */}
      {rejectModalRegistration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm">
          <div className="relative w-full max-w-md celestial-glass rounded-2xl p-6 border border-rose-500/40 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-cinzel text-base font-bold text-white">Reject Registration</h3>
                <span className="text-xs text-slate-400 font-mono">{rejectModalRegistration.id}</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to <strong>REJECT</strong> this registration for <strong>{rejectModalRegistration.participants[0]?.fullName}</strong> ({rejectModalRegistration.eventCode})? Specify the reason:
            </p>

            <textarea
              rows={3}
              value={rejectReasonInput}
              onChange={(e) => setRejectReasonInput(e.target.value)}
              className="w-full p-3 rounded-xl bg-black/40 border border-white/15 text-xs text-white focus:outline-none focus:border-rose-400"
              placeholder="e.g. UTR mismatch with bank statement"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectModalRegistration(null)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-4 py-2 rounded-xl font-bold text-xs uppercase text-white bg-rose-600 hover:bg-rose-500 transition-colors cursor-pointer"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 3: MARK NOT COMPLETE / HOLD WITH REASON */}
      {/* ==================================================================== */}
      {incompleteModalRegistration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm">
          <div className="relative w-full max-w-md celestial-glass rounded-2xl p-6 border border-slate-500/40 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-500/20 text-slate-300 flex items-center justify-center shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-cinzel text-base font-bold text-white">Mark as Registration Not Complete</h3>
                <span className="text-xs text-slate-400 font-mono">{incompleteModalRegistration.id}</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Flagging this registration as <strong>Not Complete</strong> indicates the applicant has not finished their registration or has missing documentation.
            </p>

            <textarea
              rows={3}
              value={incompleteReasonInput}
              onChange={(e) => setIncompleteReasonInput(e.target.value)}
              className="w-full p-3 rounded-xl bg-black/40 border border-white/15 text-xs text-white focus:outline-none focus:border-slate-400"
              placeholder="e.g. Missing student ID card or pending fee proof"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIncompleteModalRegistration(null)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmIncomplete}
                className="px-4 py-2 rounded-xl font-bold text-xs uppercase text-white bg-slate-600 hover:bg-slate-500 transition-colors cursor-pointer"
              >
                Mark Incomplete
              </button>
            </div>
          </div>
        </div>
      )}

      {isMainAdmin && editingRegistration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-3xl celestial-glass rounded-2xl p-6 border border-[#D4AF37]/50 shadow-2xl space-y-4 my-8 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/50 flex items-center justify-center text-[#E6C57D]">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-cinzel text-base font-bold text-white flex items-center gap-2">
                    <span>Edit Profile & Financials · {editingRegistration.id}</span>
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#D4AF37]/15 text-[#F5E7C4] border border-[#D4AF37]/35">
                      Event: {editingRegistration.eventCode} ({editingRegistration.eventTitle})
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400">
                      Main Central Admin Control
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingRegistration(null)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              {/* SECTION 1: FINANCIAL AUDIT & FEE RECALCULATION (Main Central Admin Exclusive) */}
              <div className="p-4 rounded-xl bg-[#080E2A] border-2 border-[#D4AF37]/50 space-y-4 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#D4AF37]/20 flex items-center justify-center text-[#E6C57D]">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-[#F5E7C4] text-xs uppercase font-mono tracking-wider block">
                        Financial Audit & Fee Recalculation Desk
                      </span>
                      <span className="text-[10px] text-slate-300">
                        Toggle host status or manually adjust total fee, paid amount, and payment status
                      </span>
                    </div>
                  </div>

                  {/* Prominent SMCH Host Waiver Toggle */}
                  <label className={`inline-flex items-center gap-2.5 px-3 py-1.5 rounded-xl border transition-all cursor-pointer select-none ${
                    editFormData.isHostCollege
                      ? 'bg-emerald-950/50 border-emerald-500/70 text-emerald-200 shadow-sm shadow-emerald-500/20'
                      : 'bg-amber-950/40 border-[#D4AF37]/60 text-[#F5E7C4]'
                  }`}>
                    <input
                      type="checkbox"
                      checked={editFormData.isHostCollege}
                      onChange={(e) => handleToggleHostStatus(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 accent-emerald-500 cursor-pointer"
                    />
                    <div className="flex items-center gap-1.5 text-xs font-bold">
                      <GraduationCap className="w-4 h-4 text-[#D4AF37]" />
                      <span>{editFormData.isHostCollege ? 'SMCH Host Student (₹0 Fee Waiver)' : 'Other College / External (Pay Fee)'}</span>
                    </div>
                  </label>
                </div>

                {/* Event Official Fee Benchmark Banner */}
                {(() => {
                  const ev = EVENTS_DATA.find((e) =>
                    e.id.toLowerCase() === editingRegistration.eventId?.toLowerCase() ||
                    e.code.toLowerCase() === editingRegistration.eventCode?.toLowerCase() ||
                    e.title.toLowerCase() === editingRegistration.eventTitle?.toLowerCase()
                  );
                  const officialRate = ev ? ev.feeAmount : editFormData.feePerUnit;
                  const officialType = ev ? ev.feeType : editFormData.feeType;
                  const calculatedExpected = editFormData.isHostCollege 
                    ? 0 
                    : (officialType === 'per_head' ? officialRate * editFormData.participantCount : officialRate);

                  return (
                    <div className="p-3 rounded-lg bg-black/50 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
                      <div className="text-slate-300">
                        Official Festival Rule: <strong className="text-white">{ev?.title || editingRegistration.eventTitle}</strong> ({ev?.code || editingRegistration.eventCode})
                        <div className="text-slate-400 text-[10px] mt-0.5">
                          Standard Fee: <span className="text-[#E6C57D] font-mono font-bold">₹{officialRate}</span> ({officialType === 'per_head' ? 'Per Participant' : 'Per Team'}) × {editFormData.participantCount} member(s) = <strong className="text-emerald-300 font-mono font-bold">₹{calculatedExpected}</strong>
                        </div>
                      </div>

                      {!editFormData.isHostCollege && editFormData.totalAmount !== calculatedExpected && (
                        <button
                          type="button"
                          onClick={() => handleEditTotalAmountChange(calculatedExpected)}
                          className="px-2.5 py-1 rounded bg-[#D4AF37]/20 hover:bg-[#D4AF37]/35 border border-[#D4AF37]/50 text-[#F5E7C4] text-[10px] font-bold cursor-pointer shrink-0 self-start sm:self-center transition-colors"
                        >
                          Reset to Official Fee (₹{calculatedExpected})
                        </button>
                      )}
                    </div>
                  );
                })()}

                {/* Financial Controls Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Total Event Fee */}
                  <div className="p-3 rounded-xl bg-black/60 border border-white/15 space-y-1">
                    <label className="text-slate-300 text-[11px] font-semibold block">
                      Total Registration Fee (₹)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={10}
                      disabled={editFormData.isHostCollege}
                      value={editFormData.totalAmount}
                      onChange={(e) => handleEditTotalAmountChange(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 rounded-lg bg-[#050818] border border-white/20 text-white font-mono font-bold text-base disabled:opacity-60 focus:outline-none focus:border-[#D4AF37]"
                      required
                    />
                    <span className="text-[10px] text-slate-400 block font-mono">
                      {editFormData.isHostCollege ? 'Waived (SMCH Host ₹0)' : 'Payable by student/team'}
                    </span>
                  </div>

                  {/* Amount Paid */}
                  <div className="p-3 rounded-xl bg-black/60 border border-emerald-500/35 space-y-1">
                    <label className="text-emerald-300 text-[11px] font-semibold block">
                      Amount Paid So Far (₹)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={10}
                      value={editFormData.paidAmount}
                      onChange={(e) => handleEditPaidAmountChange(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 rounded-lg bg-[#050818] border border-emerald-500/50 text-emerald-300 font-mono font-bold text-base focus:outline-none focus:border-emerald-400"
                      required
                    />
                    
                    {/* Quick presets */}
                    <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleEditPaidAmountChange(0)}
                        className="px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-[9px] font-mono text-slate-300 cursor-pointer"
                      >
                        ₹0
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEditPaidAmountChange(editFormData.totalAmount)}
                        className="px-1.5 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-[9px] font-mono text-emerald-300 cursor-pointer font-bold"
                      >
                        Full (₹{editFormData.totalAmount})
                      </button>
                      {editFormData.totalAmount > 750 && (
                        <button
                          type="button"
                          onClick={() => handleEditPaidAmountChange(750)}
                          className="px-1.5 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-[9px] font-mono text-amber-300 cursor-pointer"
                        >
                          ₹750 Advance
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Calculated Balance Due Card */}
                  <div className={`p-3 rounded-xl border flex flex-col justify-between ${
                    editFormData.pendingAmount === 0 
                      ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300' 
                      : 'bg-amber-950/30 border-amber-500/40 text-amber-300'
                  }`}>
                    <div>
                      <span className="text-[11px] font-semibold block opacity-80">
                        Balance Due (Pending Amount)
                      </span>
                      <div className="font-mono font-black text-xl mt-1">
                        ₹{editFormData.pendingAmount.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <span className="text-[10px] font-mono mt-1 font-bold">
                      {editFormData.pendingAmount === 0 ? '✓ No Dues Pending' : '⚠️ Balance Pending at Desk'}
                    </span>
                  </div>
                </div>

                {/* Status & UTR Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-slate-300 text-[11px] font-semibold block mb-1">
                      Payment Verification Status
                    </label>
                    <select
                      value={editFormData.paymentStatus}
                      onChange={(e) => setEditFormData({ ...editFormData, paymentStatus: e.target.value as PaymentStatus })}
                      className="w-full px-3 py-2 rounded-lg bg-[#050818] border border-white/20 text-white font-semibold cursor-pointer"
                    >
                      <option value="Pending">⏳ Pending (Awaiting review or payment)</option>
                      <option value="Advance Paid">🪙 Advance Paid (Token / partial fee received)</option>
                      <option value="Paid in Full">💰 Paid in Full (100% amount remitted)</option>
                      <option value="Verified">✅ Verified (Approved by Admin)</option>
                      <option value="Rejected">❌ Rejected (Invalid slip or transaction)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-300 text-[11px] font-semibold block mb-1">
                      UTR / Transaction Reference Number
                    </label>
                    <input
                      type="text"
                      value={editFormData.utrNumber}
                      onChange={(e) => setEditFormData({ ...editFormData, utrNumber: e.target.value })}
                      placeholder="e.g. 628192837492 or CASH_DESK"
                      className="w-full px-3 py-2 rounded-lg bg-[#050818] border border-white/20 text-white font-mono"
                    />
                  </div>
                </div>

                {/* Admin Audit Notes */}
                <div>
                  <label className="text-slate-300 text-[11px] font-semibold block mb-1">
                    Administrative Audit Notes & Remittance Remarks
                  </label>
                  <input
                    type="text"
                    value={editFormData.adminNotes}
                    onChange={(e) => setEditFormData({ ...editFormData, adminNotes: e.target.value })}
                    placeholder="e.g. Verified non-host college fee paid in cash at registration desk"
                    className="w-full px-3 py-2 rounded-lg bg-[#050818] border border-white/20 text-white"
                  />
                </div>
              </div>

              {/* SECTION 2: PARTICIPANT COUNT & ROSTER EDITING */}
              <div className="p-4 rounded-xl bg-[#090E28] border border-[#D4AF37]/35 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#F5E7C4] text-xs flex items-center gap-1.5 uppercase font-mono">
                    <Users className="w-4 h-4 text-[#D4AF37]" />
                    Participant Count & Roster Members
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                    Event: {editingRegistration.eventCode}
                  </span>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <div>
                    <label className="text-slate-300 text-[11px] font-semibold block mb-1">
                      Total Number of Participants:
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={editFormData.participantCount}
                      onChange={(e) => handleEditParticipantCountChange(parseInt(e.target.value, 10) || 1)}
                      className="w-32 px-3 py-1.5 bg-[#050818] border border-[#D4AF37]/50 rounded-lg text-sm font-bold text-white text-center focus:outline-none"
                    />
                  </div>
                  <div className="text-[11px] text-slate-400 self-end pb-1">
                    Editing count automatically resizes roster slots and recalculates per-head fee.
                  </div>
                </div>

                {/* Editable List of Participants */}
                <div className="space-y-3 pt-2 border-t border-white/10">
                  <span className="text-[11px] font-semibold text-slate-300 block">
                    Participating Members List ({editFormData.participants.length} Members):
                  </span>

                  {editFormData.participants.map((member, idx) => (
                    <div 
                      key={idx} 
                      className="p-3 rounded-lg bg-[#050818] border border-white/10 space-y-2"
                    >
                      <div className="flex items-center justify-between pb-1 border-b border-white/5">
                        <span className="font-bold text-[#E6C57D] text-[11px] font-mono">
                          #{idx + 1} {idx === 0 ? 'Primary Captain / Participant' : `Team Member #${idx + 1}`}
                        </span>
                        {idx > 0 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveEditMember(idx)}
                            className="text-[10px] text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 px-2 py-0.5 rounded transition-colors cursor-pointer"
                          >
                            Remove Member
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div className="sm:col-span-2">
                          <label className="text-[10px] text-slate-400 block mb-0.5">Full Legal Name</label>
                          <input
                            type="text"
                            value={member.fullName}
                            onChange={(e) => handleEditMemberChange(idx, 'fullName', e.target.value)}
                            placeholder="Full Name"
                            className="w-full px-2.5 py-1.5 rounded bg-black/50 border border-white/15 text-white text-xs"
                            required={idx === 0}
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-400 block mb-0.5">Gender</label>
                          <select
                            value={member.gender || 'Male'}
                            onChange={(e) => handleEditMemberChange(idx, 'gender', e.target.value)}
                            className="w-full px-2 py-1.5 rounded bg-black/50 border border-white/15 text-white text-xs"
                          >
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-400 block mb-0.5">Age</label>
                          <input
                            type="number"
                            value={member.age || ''}
                            onChange={(e) => handleEditMemberChange(idx, 'age', e.target.value)}
                            placeholder="Age"
                            className="w-full px-2.5 py-1.5 rounded bg-black/50 border border-white/15 text-white text-xs font-mono"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-400 block mb-0.5">Mobile Number</label>
                          <input
                            type="tel"
                            value={member.mobile || ''}
                            onChange={(e) => handleEditMemberChange(idx, 'mobile', e.target.value)}
                            placeholder="Mobile"
                            className="w-full px-2.5 py-1.5 rounded bg-black/50 border border-white/15 text-white text-xs font-mono"
                            required={idx === 0}
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-400 block mb-0.5">Email ID</label>
                          <input
                            type="email"
                            value={member.email || ''}
                            onChange={(e) => handleEditMemberChange(idx, 'email', e.target.value)}
                            placeholder="Email"
                            className="w-full px-2.5 py-1.5 rounded bg-black/50 border border-white/15 text-white text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="pt-1 text-center">
                    <button
                      type="button"
                      onClick={handleAddEditMember}
                      className="py-1.5 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-[#E6C57D] border border-[#D4AF37]/30 transition-colors inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>+ Add Participant Member Slot</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* SECTION 3: PRIMARY CONTACT & TEAM INFO */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Primary Captain / Delegate Name</label>
                  <input
                    type="text"
                    value={editFormData.captainName}
                    onChange={(e) => handleEditMemberChange(0, 'fullName', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/15 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Captain Mobile</label>
                  <input
                    type="text"
                    value={editFormData.captainMobile}
                    onChange={(e) => handleEditMemberChange(0, 'mobile', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/15 text-white font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Captain Email</label>
                  <input
                    type="email"
                    value={editFormData.captainEmail}
                    onChange={(e) => handleEditMemberChange(0, 'email', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/15 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Team Name (if applicable)</label>
                  <input
                    type="text"
                    value={editFormData.teamName}
                    onChange={(e) => setEditFormData({ ...editFormData, teamName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/15 text-white"
                  />
                </div>
              </div>

              {/* SECTION 4: COLLEGE DETAILS */}
              <div className="pt-2 border-t border-white/10 space-y-3">
                <span className="font-semibold text-[#D4AF37] block">College Information</span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-3">
                    <label className="text-slate-400 block mb-1">College Name</label>
                    <input
                      type="text"
                      value={editFormData.collegeName}
                      onChange={(e) => setEditFormData({ ...editFormData, collegeName: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/15 text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">City</label>
                    <input
                      type="text"
                      value={editFormData.collegeCity}
                      onChange={(e) => setEditFormData({ ...editFormData, collegeCity: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/15 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">State</label>
                    <input
                      type="text"
                      value={editFormData.collegeState}
                      onChange={(e) => setEditFormData({ ...editFormData, collegeState: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/15 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Contact Officer</label>
                    <input
                      type="text"
                      value={editFormData.contactPerson}
                      onChange={(e) => setEditFormData({ ...editFormData, contactPerson: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/15 text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer Controls */}
              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                <div className="font-mono text-[11px] text-slate-300">
                  Final Fee: <strong className="text-emerald-400">₹{editFormData.totalAmount}</strong> · Paid: <strong className="text-white">₹{editFormData.paidAmount}</strong> · Due: <strong className={editFormData.pendingAmount > 0 ? 'text-amber-300' : 'text-emerald-400'}>₹{editFormData.pendingAmount}</strong>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingRegistration(null)}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl font-bold text-xs uppercase text-black bg-[#D4AF37] hover:brightness-110 flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Changes & Sync</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 5: DELETE RECORD CONFIRMATION */}
      {/* ==================================================================== */}
      {deleteConfirmRegistration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm">
          <div className="relative w-full max-w-md celestial-glass rounded-2xl p-6 border border-rose-500/40 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-cinzel text-base font-bold text-white">Confirm Record Deletion</h3>
                <span className="text-xs text-slate-400 font-mono">{deleteConfirmRegistration.id}</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to delete this registration for <strong>{deleteConfirmRegistration.participants[0]?.fullName}</strong> ({deleteConfirmRegistration.eventCode})? This will permanently remove the registration record, participant list, and payment submission from the database.
              <span className="text-amber-300 font-medium block mt-2">
                * Note: Deleting this entry will NOT affect the numbering or sequence of any other registrations or events.
              </span>
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmRegistration(null)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 rounded-xl font-bold text-xs uppercase text-white bg-rose-600 hover:bg-rose-500 transition-colors cursor-pointer"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 6: SUPABASE CLOUD SETUP & TROUBLESHOOTING GUIDE */}
      {/* ==================================================================== */}
      {showCloudModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-2xl celestial-glass rounded-2xl p-6 border border-[#D4AF37]/50 shadow-2xl space-y-5 my-8 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/50 flex items-center justify-center text-[#E6C57D]">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-cinzel text-lg font-bold text-white">Supabase Cloud Database Diagnostics</h3>
                  <span className="text-[11px] font-mono text-[#D4AF37]">Why aren't friends' registrations showing up?</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCloudModal(false)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Diagnostics Status Card */}
            <div className="p-4 rounded-xl bg-black/50 border border-white/15 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Build Supabase Status:</span>
                <span className={`font-mono font-bold px-2 py-0.5 rounded text-[10px] ${
                  cloudDiagnostics?.isConfigured 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}>
                  {cloudDiagnostics?.isConfigured ? 'Configured in Build' : 'Missing in Build (Local Mode)'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Project Endpoint:</span>
                <span className="font-mono text-white">{cloudDiagnostics?.maskedUrl || 'None detected in frontend bundle'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Cloud Database Records:</span>
                <span className="font-mono font-bold text-emerald-400">{cloudRegistrations.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Current Browser Local Test Records:</span>
                <span className="font-mono text-slate-300">{myRegistrations.length}</span>
              </div>
              {cloudDiagnostics?.errorMessage && (
                <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 font-mono text-[11px] mt-2">
                  <strong>Notice:</strong> {cloudDiagnostics.errorMessage}
                </div>
              )}
            </div>

            {/* Explanation of the Problem */}
            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <h4 className="font-cinzel text-sm font-bold text-white flex items-center gap-1.5">
                <Info className="w-4 h-4 text-[#D4AF37]" />
                <span>The Explanation (Why this happened)</span>
              </h4>
              <p>
                <strong>1. Why you only see 3 registrations (your own):</strong> When you test registrations on this laptop/browser, the site saves them in this browser's local memory (<code className="text-[#F5E7C4] font-mono">localStorage</code>). That is why your 3 tests show up.
              </p>
              <p>
                <strong>2. Why your friends' registrations didn't show up:</strong> When your friend registered on their phone, their phone generated a code, but the registration was saved in <em>their</em> phone's local cache because the hosted build on Render was missing the Supabase keys, or because the previous code sent large camera photo files that Supabase rejected.
              </p>
              <p>
                <strong>3. Why Supabase showed "Success. No rows returned":</strong> When you run SQL statements like <code className="text-[#F5E7C4] font-mono">CREATE TABLE</code> or <code className="text-[#F5E7C4] font-mono">CREATE POLICY</code>, PostgreSQL does not return rows—it prints <em>"Success. No rows returned."</em> That means your SQL executed perfectly!
              </p>
            </div>

            {/* 3 Steps to Fix */}
            <div className="space-y-3 pt-2 border-t border-white/10 text-xs text-slate-300">
              <h4 className="font-cinzel text-sm font-bold text-[#E6C57D] flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-[#D4AF37]" />
                <span>How to Make All Registrations Sync into Cloud Supabase</span>
              </h4>

              <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1.5">
                <span className="font-bold text-white block">Step 1: Check Environment Variables on Render</span>
                <p className="text-slate-300">
                  Open Render Dashboard → Click your Web Service → Go to <strong>Environment</strong> tab. Ensure both variables are added:
                </p>
                <div className="p-2 rounded bg-black/60 font-mono text-[11px] text-[#F5E7C4] space-y-1">
                  <div>VITE_SUPABASE_URL = https://your-project.supabase.co</div>
                  <div>VITE_SUPABASE_ANON_KEY = eyJhbGciOi... (use the <strong>anon / public</strong> key, not secret!)</div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-[#D4AF37]/35 space-y-1.5">
                <span className="font-bold text-[#F5E7C4] block">Step 2: Crucial — Trigger "Clear build cache & deploy"</span>
                <p className="text-slate-300">
                  In Vite React apps, environment variables starting with <code className="font-mono text-white">VITE_</code> are embedded into JavaScript <strong>at build time</strong>. If you added the variables after building, you must click:
                </p>
                <div className="p-2 rounded bg-amber-500/10 border border-amber-500/30 text-amber-200 font-medium">
                  Render Dashboard → <strong>Manual Deploy</strong> → <strong>Clear build cache & deploy</strong>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">Step 3: Run the Schema in Supabase SQL Editor</span>
                  <button
                    type="button"
                    onClick={() => {
                      const sql = `-- CELESTIA '26 SUPABASE DATABASE SCHEMA
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_code TEXT UNIQUE NOT NULL,
    event_code TEXT NOT NULL,
    event_type TEXT,
    team_name TEXT,
    college_name TEXT,
    college_city TEXT,
    college_state TEXT,
    college_contact_person TEXT,
    college_contact_mobile TEXT,
    college_contact_email TEXT,
    is_college_delegation BOOLEAN DEFAULT false,
    participant_count INTEGER DEFAULT 1,
    fee_per_unit NUMERIC DEFAULT 0,
    fee_type TEXT DEFAULT 'per_team',
    total_fee NUMERIC DEFAULT 0,
    registration_status TEXT DEFAULT 'Submitted',
    admin_notes TEXT,
    verified_at TIMESTAMPTZ,
    rules_accepted BOOLEAN DEFAULT true,
    rules_version TEXT DEFAULT 'v1.0-celestia26',
    rules_accepted_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS admin_notes TEXT;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS is_host_college BOOLEAN DEFAULT false;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS host_register_number TEXT;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS host_batch TEXT;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS host_department TEXT;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS paid_amount NUMERIC DEFAULT NULL;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS pending_amount NUMERIC DEFAULT NULL;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'Paid in Full';
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS payment_notes TEXT DEFAULT NULL;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS promo_code TEXT;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS discount_percent NUMERIC;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS discount_amount NUMERIC DEFAULT 0;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS original_amount NUMERIC;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS combo_group_id TEXT DEFAULT NULL;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS combo_id TEXT DEFAULT NULL;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS combo_name TEXT DEFAULT NULL;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS combo_type TEXT DEFAULT NULL;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS combo_discount_amount NUMERIC DEFAULT NULL;

CREATE TABLE IF NOT EXISTS public.participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id UUID REFERENCES public.registrations(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    gender TEXT,
    age INTEGER DEFAULT 20,
    mobile TEXT,
    email TEXT,
    role TEXT,
    id_card_storage_path TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.payment_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id UUID REFERENCES public.registrations(id) ON DELETE CASCADE,
    utr_number TEXT,
    amount_paid NUMERIC DEFAULT 0,
    payment_screenshot_path TEXT,
    payment_status TEXT DEFAULT 'Pending',
    verified_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.celestia_promo_codes (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    discount_percent NUMERIC DEFAULT 0,
    applicable_scope TEXT DEFAULT 'all',
    discount_type TEXT DEFAULT 'percentage',
    advance_amount NUMERIC DEFAULT 0,
    is_advance_payment BOOLEAN DEFAULT false,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    redemption_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.payment_submissions ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
ALTER TABLE public.payment_submissions ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;

ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.celestia_promo_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public insert to registrations" ON public.registrations;
CREATE POLICY "Allow public insert to registrations" ON public.registrations FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public insert to participants" ON public.participants;
CREATE POLICY "Allow public insert to participants" ON public.participants FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public insert to payment_submissions" ON public.payment_submissions;
CREATE POLICY "Allow public insert to payment_submissions" ON public.payment_submissions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access to celestia_promo_codes" ON public.celestia_promo_codes;
CREATE POLICY "Allow public access to celestia_promo_codes" ON public.celestia_promo_codes FOR ALL USING (true) WITH CHECK (true);`;
                      navigator.clipboard.writeText(sql);
                      setCopiedSql(true);
                      showToast('SQL Schema copied to clipboard!');
                      setTimeout(() => setCopiedSql(false), 3000);
                    }}
                    className="px-2.5 py-1 rounded bg-[#D4AF37]/20 text-[#F5E7C4] hover:bg-[#D4AF37]/30 border border-[#D4AF37]/40 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    {copiedSql ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedSql ? 'Copied!' : 'Copy SQL Schema'}</span>
                  </button>
                </div>
                <p className="text-slate-300">
                  Open your Supabase Dashboard → <strong>SQL Editor</strong> → click <strong>New Query</strong> → paste the copied SQL and click <strong>RUN</strong>.
                </p>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-white/10">
              <span className="text-[11px] text-slate-400 font-mono">
                Last checked: {cloudDiagnostics?.lastChecked || 'Just now'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    await loadData();
                    showToast('Live Cloud status refreshed');
                  }}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-white cursor-pointer"
                >
                  Retest Cloud Now
                </button>
                <button
                  type="button"
                  onClick={() => setShowCloudModal(false)}
                  className="px-5 py-2 rounded-xl bg-[#D4AF37] hover:brightness-110 text-xs font-bold text-black cursor-pointer"
                >
                  Close Guide
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 7: TEST DATA GENERATOR SUITE (25 FICTIONAL REGISTRATIONS) */}
      {/* ==================================================================== */}
      {showTestGeneratorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-4xl celestial-glass rounded-2xl p-6 border border-purple-500/50 shadow-2xl space-y-5 my-8 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/50 flex items-center justify-center text-purple-300">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-cinzel text-lg font-bold text-white">Test Suite — 25 Fictional Registrations Generator</h3>
                  <span className="text-[11px] font-mono text-purple-300">Safely test Admin Panel filters, search, rosters, and payment views</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTestGeneratorModal(false)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Test Generator Specifications Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-black/50 border border-white/10 space-y-1">
                <span className="text-slate-400 font-mono uppercase text-[10px] block">Dataset Size</span>
                <span className="font-bold text-white text-sm">25 Synthetic Registrations</span>
                <p className="text-slate-300 text-[11px]">Identified by prefix <code className="text-purple-300 font-mono">TEST-REG-2026-001</code> to <code className="text-purple-300 font-mono">025</code>.</p>
              </div>

              <div className="p-3.5 rounded-xl bg-black/50 border border-white/10 space-y-1">
                <span className="text-slate-400 font-mono uppercase text-[10px] block">Event Coverage</span>
                <span className="font-bold text-white text-sm">All 14 Festival Events</span>
                <p className="text-slate-300 text-[11px]">Covers Solo, Duo, and Group events respecting max participant limits.</p>
              </div>

              <div className="p-3.5 rounded-xl bg-black/50 border border-white/10 space-y-1">
                <span className="text-slate-400 font-mono uppercase text-[10px] block">Colleges & Remittance</span>
                <span className="font-bold text-white text-sm">9 Medical Colleges</span>
                <p className="text-slate-300 text-[11px]">Includes non-host college fees + SMCH Host zero-fee waiver verification.</p>
              </div>
            </div>

            {/* Control Actions Bar */}
            <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="font-semibold text-white text-sm flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-purple-400" />
                  <span>Execution Controls</span>
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  Generates full registration, participant roster, and payment records without altering existing data.
                </p>
              </div>

              <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                <button
                  type="button"
                  onClick={handleGenerate25TestRecords}
                  disabled={isGeneratingTest || isPurgingTest}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 via-indigo-500 to-[#D4AF37] hover:brightness-110 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
                >
                  <Play className={`w-4 h-4 ${isGeneratingTest ? 'animate-spin' : ''}`} />
                  <span>{isGeneratingTest ? 'Generating 25 Records...' : 'Generate 25 Test Records'}</span>
                </button>

                <button
                  type="button"
                  onClick={handlePurgeTestRecords}
                  disabled={isGeneratingTest || isPurgingTest}
                  className="px-4 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="Purge all 25 test records matching TEST-REG-2026- prefix"
                >
                  <Trash2 className="w-4 h-4 text-rose-400" />
                  <span>{isPurgingTest ? 'Purging Test Records...' : 'Purge All 25 Test Records'}</span>
                </button>
              </div>
            </div>

            {/* Purge Result Banner */}
            {testPurgeResult && (
              <div className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 ${
                testPurgeResult.success 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}>
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{testPurgeResult.message}</span>
              </div>
            )}

            {/* Live Generation Results Table / Summary */}
            {testGenResult && (
              <div className="space-y-3 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <h4 className="font-cinzel text-sm font-bold text-white flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Generation Summary ({testGenResult.successCount} of {testGenResult.totalAttempted} Records Created)</span>
                  </h4>
                  <span className="font-mono text-xs text-purple-300">
                    Failures: {testGenResult.failureCount}
                  </span>
                </div>

                {testGenResult.errors.length > 0 && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-1">
                    <strong>Insert Errors Encountered:</strong>
                    <ul className="list-disc list-inside font-mono text-[11px] space-y-0.5">
                      {testGenResult.errors.map((err, eIdx) => (
                        <li key={eIdx}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="overflow-x-auto rounded-xl border border-white/10 bg-black/40 max-h-60 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#0A0F2B] text-slate-300 font-mono text-[11px] uppercase tracking-wider sticky top-0 border-b border-white/10">
                      <tr>
                        <th className="py-2.5 px-3">Code</th>
                        <th className="py-2.5 px-3">Event Title</th>
                        <th className="py-2.5 px-3">College</th>
                        <th className="py-2.5 px-3">Participants</th>
                        <th className="py-2.5 px-3">Fee (INR)</th>
                        <th className="py-2.5 px-3">UTR Reference</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-mono text-[11px]">
                      {testGenResult.records.map((r, rIdx) => (
                        <tr key={rIdx} className="hover:bg-white/5 transition-colors">
                          <td className="py-2 px-3 font-bold text-purple-300">{r.code}</td>
                          <td className="py-2 px-3 text-white">{r.eventTitle}</td>
                          <td className="py-2 px-3 text-slate-300 truncate max-w-[160px]" title={r.collegeName}>{r.collegeName}</td>
                          <td className="py-2 px-3 text-slate-300">{r.participantCount} member(s)</td>
                          <td className="py-2 px-3 text-emerald-300">{r.isHost ? '₹0 (SMCH Waiver)' : `₹${r.totalFee}`}</td>
                          <td className="py-2 px-3 text-amber-300">{r.utrNumber}</td>
                          <td className="py-2 px-3">
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              {r.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs">
              <span className="text-slate-400 font-mono">
                Records appear instantly in Admin Desk list below.
              </span>
              <button
                type="button"
                onClick={() => setShowTestGeneratorModal(false)}
                className="px-5 py-2 rounded-xl bg-[#D4AF37] hover:brightness-110 text-xs font-bold text-black cursor-pointer"
              >
                Close Suite
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 8: EVENT CLASSIFICATION DESK & ROSTER MANAGER (MAIN ADMIN ONLY) */}
      {/* ==================================================================== */}
      {showEventClassificationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-5xl celestial-glass rounded-2xl p-6 border border-purple-500/50 shadow-2xl space-y-6 my-8 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/50 flex items-center justify-center text-purple-300 shrink-0">
                  <Layers className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-cinzel text-lg sm:text-xl font-bold text-white">
                    Event-Wise Classification Desk & Rosters
                  </h3>
                  <span className="text-xs text-purple-300 font-mono">
                    Registrations categorized under all {EVENTS_DATA.length} festival events
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <button
                  type="button"
                  onClick={handleExportClassifiedByEventsCSV}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-500 via-indigo-500 to-[#D4AF37] hover:brightness-110 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export All Classified CSV</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowEventClassificationModal(false)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Event Summary Overview Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-black/50 border border-white/10">
                <span className="text-[10px] uppercase font-mono text-slate-400 block">Total Festival Events</span>
                <span className="font-cinzel text-lg font-bold text-white mt-0.5 block">{EVENTS_DATA.length} Events</span>
              </div>
              <div className="p-3 rounded-xl bg-black/50 border border-purple-500/30">
                <span className="text-[10px] uppercase font-mono text-purple-300 block">Total Event Submissions</span>
                <span className="font-cinzel text-lg font-bold text-purple-200 mt-0.5 block">{allRegistrations.length} Registrations</span>
              </div>
              <div className="p-3 rounded-xl bg-black/50 border border-emerald-500/30">
                <span className="text-[10px] uppercase font-mono text-emerald-300 block">Total Festival Participants</span>
                <span className="font-cinzel text-lg font-bold text-emerald-200 mt-0.5 block">
                  {allRegistrations.reduce((acc, r) => acc + (r.participants?.length || 1), 0)} Students
                </span>
              </div>
              <div className="p-3 rounded-xl bg-black/50 border border-[#D4AF37]/30">
                <span className="text-[10px] uppercase font-mono text-[#D4AF37] block">Verified Registrations</span>
                <span className="font-cinzel text-lg font-bold text-[#F5E7C4] mt-0.5 block">
                  {allRegistrations.filter(r => getDeskStatus(r) === 'VERIFIED').length} Cleared
                </span>
              </div>
            </div>

            {/* Event Classification Cards List */}
            <div className="space-y-4">
              {EVENTS_DATA.map((ev, idx) => {
                const eventRegs = allRegistrations.filter((r) => r.eventCode === ev.code);
                const participantCount = eventRegs.reduce((sum, r) => sum + r.participants.length, 0);
                const verifiedCount = eventRegs.filter((r) => getDeskStatus(r) === 'VERIFIED').length;
                const pendingCount = eventRegs.filter((r) => getDeskStatus(r) === 'PENDING').length;

                return (
                  <div 
                    key={ev.id} 
                    className={`p-4 rounded-2xl border transition-all ${
                      eventRegs.length > 0 
                        ? 'bg-[#070B1E] border-purple-500/40 hover:border-purple-400' 
                        : 'bg-black/30 border-white/10 opacity-75'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded font-mono text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            #{idx + 1} {ev.code}
                          </span>
                          <span className="text-xs font-semibold text-white">{ev.title}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-slate-300 font-mono">
                            {ev.type}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          Category: <strong className="text-slate-200">{ev.category}</strong> · Fee: <strong className="text-emerald-400">{ev.registrationFee}</strong> · Venue: <strong className="text-slate-200">{ev.venue}</strong>
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 flex-wrap">
                        <div className="text-right mr-2 font-mono text-xs">
                          <span className="font-bold text-white block">{eventRegs.length} Regs ({participantCount} Students)</span>
                          <span className="text-[10px] text-emerald-400">{verifiedCount} Verified · {pendingCount} Pending</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleExportSingleEventCSV(ev.code)}
                          disabled={eventRegs.length === 0}
                          className="px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40"
                          title={`Export CSV for ${ev.code}`}
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download Roster</span>
                        </button>
                      </div>
                    </div>

                    {/* Registrations List under this event */}
                    {eventRegs.length === 0 ? (
                      <p className="text-xs text-slate-500 italic pt-3">
                        No registrations submitted for {ev.title} yet.
                      </p>
                    ) : (
                      <div className="mt-3 overflow-x-auto rounded-xl border border-white/10 bg-black/40">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-black/60 text-slate-400 font-mono text-[10px] uppercase tracking-wider">
                            <tr>
                              <th className="py-2 px-3">#</th>
                              <th className="py-2 px-3">Reg Code</th>
                              <th className="py-2 px-3">Primary Captain</th>
                              <th className="py-2 px-3">College</th>
                              <th className="py-2 px-3">Roster Members</th>
                              <th className="py-2 px-3">UTR</th>
                              <th className="py-2 px-3 text-center">Status</th>
                              <th className="py-2 px-3 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5 font-mono text-[11px]">
                            {eventRegs.map((r, rIdx) => {
                              const deskStatus = getDeskStatus(r);
                              return (
                                <tr key={r.id} className="hover:bg-white/5 transition-colors">
                                  <td className="py-2 px-3 font-bold text-slate-400">#{rIdx + 1}</td>
                                  <td className="py-2 px-3 font-bold text-[#D4AF37]">
                                    {r.id}
                                    {(r.comboName || r.comboId || r.comboGroupId) && (
                                      <span className="block text-[10px] font-mono font-extrabold text-amber-300">
                                        ⚡ COMBO: {r.comboId ? r.comboId.toUpperCase() : 'COMBO'} ({r.comboName || 'Combo Offer'})
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-2 px-3 text-white font-sans font-semibold">
                                    {r.participants[0]?.fullName}
                                    <span className="block text-[10px] text-slate-400 font-mono">{r.participants[0]?.mobile}</span>
                                  </td>
                                  <td className="py-2 px-3 text-slate-300 font-sans truncate max-w-[140px]" title={r.college?.collegeName}>
                                    {r.college?.collegeName}
                                  </td>
                                  <td className="py-2 px-3 text-slate-300 font-sans">
                                    <strong>{r.participants.length}</strong> ({r.participants.map(p => p.fullName).join(', ')})
                                  </td>
                                  <td className="py-2 px-3 text-amber-300">{r.utrNumber || 'N/A'}</td>
                                  <td className="py-2 px-3 text-center">
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                      deskStatus === 'VERIFIED' ? 'bg-emerald-500/20 text-emerald-300' :
                                      deskStatus === 'REJECTED' ? 'bg-rose-500/20 text-rose-300' :
                                      'bg-amber-500/20 text-amber-300'
                                    }`}>
                                      {deskStatus}
                                    </span>
                                  </td>
                                  <td className="py-2 px-3 text-right font-sans">
                                    <div className="flex items-center justify-end gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => setInspectRegistration(r)}
                                        className="p-1 rounded bg-[#D4AF37]/15 hover:bg-[#D4AF37]/30 text-[#E6C57D] cursor-pointer"
                                        title="View Dossier"
                                      >
                                        <Eye className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleExportSingleRegistration(r)}
                                        className="p-1 rounded bg-white/10 hover:bg-white/20 text-slate-300 cursor-pointer"
                                        title="Download Single Report"
                                      >
                                        <Download className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setDeleteConfirmRegistration(r)}
                                        className="p-1 rounded bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 cursor-pointer"
                                        title="Delete Entry"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-white/10">
              <span className="text-xs text-slate-400 font-mono">
                Classified Event View · Celestia '26 Admin Operations
              </span>
              <button
                type="button"
                onClick={() => setShowEventClassificationModal(false)}
                className="px-5 py-2 rounded-xl bg-[#D4AF37] hover:brightness-110 text-xs font-bold text-black cursor-pointer"
              >
                Close Event Classification
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 9: BULK DELETE CONFIRMATION (MAIN ADMIN ONLY) */}
      {/* ==================================================================== */}
      {bulkDeleteConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm">
          <div className="relative w-full max-w-md celestial-glass rounded-2xl p-6 border border-rose-500/50 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-cinzel text-base font-bold text-white">Confirm Bulk Deletion</h3>
                <span className="text-xs text-rose-400 font-mono font-bold">{selectedRegIds.length} Registrations Selected</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to permanently delete <strong>{selectedRegIds.length}</strong> selected registration entries? This will remove all their participant lists, payment proofs, and database records.
              <span className="text-amber-300 font-medium block mt-2">
                * Note: Remaining registrations will be continuously renumbered (#1, #2, #3...) without gaps or errors.
              </span>
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setBulkDeleteConfirmModal(false)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBulkDelete}
                className="px-4 py-2 rounded-xl font-bold text-xs uppercase text-white bg-rose-600 hover:bg-rose-500 transition-colors cursor-pointer"
              >
                Permanently Delete Selected
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 10: PROMO CODE & DISCOUNT MANAGEMENT MODAL */}
      {isMainAdmin && showPromoCodeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-4xl celestial-glass rounded-2xl p-5 sm:p-6 border border-[#D4AF37]/40 shadow-2xl space-y-5 my-8 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#E6C57D] flex items-center justify-center">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-cinzel text-lg font-bold text-white flex items-center gap-2">
                    <span>Promo Code & Discount Management</span>
                  </h3>
                  <p className="text-xs text-slate-300">
                    Create percentage discounts for participants and toggle them active or inactive instantly.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Realtime Active
                </span>
                <button
                  type="button"
                  onClick={() => setShowPromoCodeModal(false)}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {!isMainAdmin && (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-2.5">
                <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  <strong>Main Admin Privileges Required:</strong> Only Central Main Admin can add, edit, deactivate, or delete promo codes. Incharges are in Read-Only mode.
                </span>
              </div>
            )}

            {/* Create New Promo Code Form */}
            <div className="p-4 rounded-xl bg-[#070B1C] border border-white/10">
              <h4 className="text-xs font-mono uppercase text-[#D4AF37] font-bold mb-3 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                <span>Create New Discount Code</span>
              </h4>
              <form onSubmit={handleCreatePromo} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <fieldset disabled={!isMainAdmin} className={`col-span-full grid grid-cols-1 sm:grid-cols-4 gap-3 ${!isMainAdmin ? 'opacity-50 pointer-events-none' : ''}`}>
                  <div>
                    <label className="block text-[11px] font-mono text-slate-300 uppercase mb-1">
                      Promo Code String *
                    </label>
                    <input
                      type="text"
                      required
                      value={newCodeName}
                      onChange={(e) => setNewCodeName(e.target.value.toUpperCase())}
                      placeholder="e.g. CELESTIA20"
                      className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 focus:border-[#D4AF37] text-xs font-mono text-white placeholder-slate-500 uppercase focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-slate-300 uppercase mb-1">
                      Discount Percentage (%) *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max="100"
                        required
                        value={newCodeDiscount}
                        onChange={(e) => setNewCodeDiscount(e.target.value)}
                        placeholder="e.g. 20"
                        className="w-full px-3 py-2 pr-8 rounded-xl bg-black/60 border border-white/15 focus:border-[#D4AF37] text-xs font-mono text-white placeholder-slate-500 focus:outline-none"
                      />
                      <Percent className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-slate-300 uppercase mb-1">
                      Campaign Description
                    </label>
                    <input
                      type="text"
                      value={newCodeDesc}
                      onChange={(e) => setNewCodeDesc(e.target.value)}
                      placeholder="e.g. 20% Early bird offer"
                      className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 focus:border-[#D4AF37] text-xs text-white placeholder-slate-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      disabled={!isMainAdmin || isCreatingPromo || !newCodeName.trim() || !newCodeDiscount}
                      className="w-full py-2 px-4 rounded-xl bg-gradient-to-r from-[#F5E7C4] via-[#E6C57D] to-[#D4AF37] hover:brightness-110 text-[#050714] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{isCreatingPromo ? 'Creating...' : 'Create Code'}</span>
                    </button>
                  </div>
                </fieldset>
              </form>
            </div>

            {/* Promo Codes List Table */}
            <div className="rounded-xl overflow-hidden border border-white/10 bg-black/40">
              <div className="p-3 bg-black/60 border-b border-white/10 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-[#D4AF37]">
                    Active Promo Codes ({promoCodes.length})
                  </span>
                  <span className="text-[10px] text-emerald-300 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 hidden sm:inline-block">
                    DSU40 · DUO50 · IPL50
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      setLoadingPromos(true);
                      const res = await promoCodeService.syncAllToSupabase();
                      const updated = await promoCodeService.getPromoCodes();
                      setPromoCodes(updated);
                      setLoadingPromos(false);
                      showToast(
                        res.success
                          ? `Synced ${res.count} Promo Codes (DSU40, DUO50, IPL50) to Supabase! ${res.details ? `(${res.details})` : ''}`
                          : `Sync status: ${res.lastError || 'Saved to Cloud Backup'}`
                      );
                    }}
                    disabled={loadingPromos}
                    className="px-3 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                    title="Push all promo codes to Supabase Cloud Database"
                  >
                    <Cloud className={`w-3.5 h-3.5 ${loadingPromos ? 'animate-spin' : ''}`} />
                    <span>Sync All to Supabase Cloud</span>
                  </button>
                  <button
                    type="button"
                    onClick={loadPromoCodes}
                    disabled={loadingPromos}
                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-slate-300 flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 text-[#D4AF37] ${loadingPromos ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/10 bg-black/40 text-[10px] font-mono uppercase text-slate-400">
                      <th className="py-2.5 px-3">Code</th>
                      <th className="py-2.5 px-3">Discount</th>
                      <th className="py-2.5 px-3">Description</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-3 text-center">Redemptions</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {promoCodes.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-slate-400 italic">
                          No promo codes found. Create one above to get started.
                        </td>
                      </tr>
                    ) : (
                      promoCodes.map((p) => (
                        editingPromoId === p.id ? (
                          <tr key={p.id} className="bg-[#090F2C] border-y border-[#D4AF37]/50">
                            <td className="py-2.5 px-3">
                              <input
                                type="text"
                                value={editPromoCode}
                                onChange={(e) => setEditPromoCode(e.target.value.toUpperCase())}
                                className="w-28 px-2 py-1 bg-black/80 border border-[#D4AF37] rounded text-xs font-mono font-bold text-[#F5E7C4] uppercase"
                              />
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  min="1"
                                  max="100"
                                  value={editPromoDiscount}
                                  onChange={(e) => setEditPromoDiscount(e.target.value)}
                                  className="w-16 px-2 py-1 bg-black/80 border border-[#D4AF37] rounded text-xs font-mono font-bold text-emerald-400"
                                />
                                <span className="font-mono text-emerald-400">%</span>
                              </div>
                            </td>
                            <td className="py-2.5 px-3">
                              <input
                                type="text"
                                value={editPromoDesc}
                                onChange={(e) => setEditPromoDesc(e.target.value)}
                                className="w-full px-2 py-1 bg-black/80 border border-white/20 rounded text-xs text-white"
                              />
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className="text-[10px] font-mono text-amber-300 font-bold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30">
                                Editing
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono text-slate-300">
                              {p.redemptionCount}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={handleSavePromoEdit}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded transition-colors cursor-pointer"
                                >
                                  Save
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingPromoId(null)}
                                  className="px-2 py-1 bg-white/10 hover:bg-white/20 text-slate-300 text-xs rounded transition-colors cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          <tr key={p.id} className="hover:bg-white/[0.02]">
                            <td className="py-3 px-3 font-mono font-bold text-[#F5E7C4] text-sm">
                              {p.code}
                            </td>
                            <td className="py-3 px-3 font-mono font-bold text-emerald-400">
                              {p.discountPercent}% OFF
                            </td>
                            <td className="py-3 px-3 text-slate-300">
                              {p.description || 'N/A'}
                            </td>
                            <td className="py-3 px-3 text-center">
                              {p.isActive ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                  <CheckCircle className="w-3 h-3" /> ACTIVE
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                  <Clock className="w-3 h-3" /> DEACTIVATED
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-center font-mono text-slate-200">
                              {p.redemptionCount}
                            </td>
                            <td className="py-3 px-3 text-right">
                              {isMainAdmin ? (
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleStartEditPromo(p)}
                                    className="p-1 rounded-lg bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30 text-[#E6C57D] border border-[#D4AF37]/40 cursor-pointer"
                                    title="Edit promo code"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleTogglePromoStatus(p.id, p.isActive)}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1 ${
                                      p.isActive
                                        ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40'
                                        : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                                    }`}
                                  >
                                    {p.isActive ? (
                                      <>
                                        <ToggleRight className="w-3.5 h-3.5" /> Deactivate
                                      </>
                                    ) : (
                                      <>
                                        <ToggleLeft className="w-3.5 h-3.5" /> Activate
                                      </>
                                    )}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeletePromo(p.id)}
                                    className="p-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 cursor-pointer"
                                    title="Delete promo code"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                                  Read Only
                                </span>
                              )}
                            </td>
                          </tr>
                        )
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Supabase Table Setup Note */}
            <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-500/20 text-xs text-blue-200 space-y-1">
              <div className="font-bold font-mono text-[#D4AF37] flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5" />
                <span>Hosted Supabase Database Persistence Note</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                If running on a custom hosted Supabase project, ensure the <code className="text-[#F5E7C4] font-mono">celestia_promo_codes</code> table exists. All changes also sync to local storage immediately as a fail-safe fallback!
              </p>
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowPromoCodeModal(false)}
                className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-slate-200 cursor-pointer"
              >
                Close Promo Panel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: VERIFIED EXCEL EXPORT SCOPE SELECTOR */}
      {showExportScopeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-lg celestial-glass rounded-2xl p-6 border border-[#D4AF37]/50 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Download className="w-5 h-5 text-emerald-400" />
                <h3 className="font-cinzel text-lg font-bold text-white">
                  Verified Registrations Export Options
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowExportScopeModal(false)}
                className="p-1 rounded-lg bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Select which dataset scope you wish to generate and download as an Event-Wise Excel/CSV report:
            </p>

            <div className="space-y-3">
              {/* Option 1: All Verified Participants */}
              <button
                type="button"
                onClick={() => {
                  setShowExportScopeModal(false);
                  exportVerifiedByEventCSV(allRegistrations, showToast, { excludeSmch: false });
                }}
                className="w-full p-4 rounded-xl bg-[#090F2C] hover:bg-[#0E1742] border border-emerald-500/40 hover:border-emerald-400 transition-all text-left group cursor-pointer shadow-md"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-emerald-300 text-sm flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Option 1: All Verified Participants (All Institutions)</span>
                  </span>
                  <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                    Full Roster
                  </span>
                </div>
                <p className="text-xs text-slate-300 pl-6">
                  Includes all verified registrations across all colleges, including Srinivasan Medical College & Hospital.
                </p>
              </button>

              {/* Option 2: Exclude SMCH Host Students */}
              <button
                type="button"
                onClick={() => {
                  setShowExportScopeModal(false);
                  exportVerifiedByEventCSV(allRegistrations, showToast, { excludeSmch: true });
                }}
                className="w-full p-4 rounded-xl bg-[#090F2C] hover:bg-[#0E1742] border border-amber-500/40 hover:border-amber-400 transition-all text-left group cursor-pointer shadow-md"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-amber-300 text-sm flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-amber-400" />
                    <span>Option 2: Non-Host Colleges Only (Exclude SMCH Students)</span>
                  </span>
                  <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
                    External Only
                  </span>
                </div>
                <p className="text-xs text-slate-300 pl-6">
                  Excludes all students/registrations from Srinivasan Medical College & Hospital (Host College).
                </p>
              </button>
            </div>

            <div className="pt-3 border-t border-white/10 flex justify-end">
              <button
                type="button"
                onClick={() => setShowExportScopeModal(false)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin 1 Desk Footer */}
      <footer className="mt-12 pt-6 pb-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
        <div>
          Celestia'26 · Registration Operations Desk · Srinivasan Medical College & Hospital
        </div>
        <div className="flex items-center gap-1.5 text-slate-300">
          <span className="text-slate-400">Website created by</span>
          <span className="font-semibold text-[#F5E7C4] font-cinzel">Surya Narayan P</span>
        </div>
      </footer>
    </div>
  );
};
