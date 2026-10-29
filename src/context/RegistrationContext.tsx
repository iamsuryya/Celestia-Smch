import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  RegistrationStep, 
  UserAccount, 
  CollegeDetails, 
  ParticipantMember, 
  RegistrationSubmission,
  PromoCode
} from '../types/registration';
import { EventItem, EVENTS_DATA } from '../data/festivalData';
import { supabaseRegistrationService } from '../services/supabaseRegistrationService';
import { promoCodeService } from '../services/promoCodeService';
import { isSupabaseConfigured } from '../lib/supabase';
import { generateRegistrationCode } from '../utils/registrationCode';
import { isAutoApproveEnabled, isEventRegistrationOpen, isGlobalRegistrationOpen } from '../utils/registrationStatus';

interface RegistrationContextType {
  currentStep: RegistrationStep;
  goToStep: (step: RegistrationStep) => void;
  
  // Auth state
  currentUser: UserAccount | null;
  loginUser: (user: UserAccount) => void;
  logoutUser: () => void;
  
  // Reusable College Profile
  collegeDetails: CollegeDetails | null;
  saveCollegeDetails: (details: CollegeDetails) => void;
  
  // Current Draft Registration
  selectedEvent: EventItem | null;
  selectEvent: (event: EventItem) => void;
  teamName: string;
  setTeamName: (name: string) => void;
  participants: ParticipantMember[];
  setParticipants: React.Dispatch<React.SetStateAction<ParticipantMember[]>>;
  
  // Payment Draft
  utrNumber: string;
  setUtrNumber: (utr: string) => void;
  paymentScreenshotName: string;
  setPaymentScreenshotName: (name: string) => void;
  paymentScreenshotFile: File | null;
  setPaymentScreenshotFile: (file: File | null) => void;
  paymentScreenshotData: string;
  setPaymentScreenshotData: (data: string) => void;
  paymentConfirmed: boolean;
  setPaymentConfirmed: (confirmed: boolean) => void;
  
  // Promo Code State & Actions
  appliedPromoCode: PromoCode | null;
  applyPromoCode: (codeStr: string, scopeContext?: 'individual' | 'combo') => Promise<{ success: boolean; message: string; promo?: PromoCode }>;
  removePromoCode: () => void;
  
  // Fee Calculation
  calculateTotalFee: (event: EventItem | null, participantCount: number, customPromo?: PromoCode | null) => number;
  calculateDiscountAmount: (event: EventItem | null, participantCount: number, customPromo?: PromoCode | null) => number;
  
  // Completed Registrations List
  myRegistrations: RegistrationSubmission[];
  activeRegistration: RegistrationSubmission | null;
  setActiveRegistration: (reg: RegistrationSubmission | null) => void;
  
  // Actions
  submitRegistration: () => Promise<RegistrationSubmission | null>;
  addCompletedRegistrations: (submissions: RegistrationSubmission[]) => void;
  refreshUserRegistrations: () => Promise<void>;
  deleteRegistration: (id: string) => Promise<boolean>;
  startNewRegistration: (preselectedEventId?: string) => void;
  viewReceiptRegistration: RegistrationSubmission | null;
  setViewReceiptRegistration: (reg: RegistrationSubmission | null) => void;
}

const RegistrationContext = createContext<RegistrationContextType | undefined>(undefined);

const USER_STORAGE_KEY = 'celestia26_user';
const COLLEGE_STORAGE_KEY = 'celestia26_college';
const REGISTRATIONS_STORAGE_KEY = 'celestia26_registrations';

export const RegistrationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentStep, setCurrentStep] = useState<RegistrationStep>('landing');
  
  const goToStep = (step: RegistrationStep) => {
    setCurrentStep(step);
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
  };
  
  // Load persisted user if any
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const saved = localStorage.getItem(USER_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Load reusable college profile
  const [collegeDetails, setCollegeDetails] = useState<CollegeDetails | null>(() => {
    try {
      const saved = localStorage.getItem(COLLEGE_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Load completed registrations
  const [myRegistrations, setMyRegistrations] = useState<RegistrationSubmission[]>(() => {
    try {
      const saved = localStorage.getItem(REGISTRATIONS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Active registration being confirmed or previewed
  const [activeRegistration, setActiveRegistration] = useState<RegistrationSubmission | null>(null);
  const [viewReceiptRegistration, setViewReceiptRegistration] = useState<RegistrationSubmission | null>(null);

  // Draft event & participants state
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [teamName, setTeamName] = useState<string>('');
  const [participants, setParticipants] = useState<ParticipantMember[]>([]);

  // Payment draft state
  const [utrNumber, setUtrNumber] = useState<string>('');
  const [paymentScreenshotName, setPaymentScreenshotName] = useState<string>('');
  const [paymentScreenshotFile, setPaymentScreenshotFile] = useState<File | null>(null);
  const [paymentScreenshotData, setPaymentScreenshotData] = useState<string>('');
  const [paymentConfirmed, setPaymentConfirmed] = useState<boolean>(false);

  // Promo code state
  const [appliedPromoCode, setAppliedPromoCode] = useState<PromoCode | null>(null);

  // Real-time Promo Code Sync Listener & Poller
  useEffect(() => {
    const handleCodesUpdate = (latestCodes: PromoCode[]) => {
      setAppliedPromoCode((current) => {
        if (!current) return null;
        const match = latestCodes.find((p) => p.code.toUpperCase() === current.code.toUpperCase());
        // If code was deleted or deactivated by Admin, invalidate instantly
        if (!match || !match.isActive) {
          return null;
        }
        // If discount or description changed, update instantly
        if (match.discountPercent !== current.discountPercent || match.description !== current.description) {
          return match;
        }
        return current;
      });
    };

    const unsubscribeRealtime = promoCodeService.subscribeToRealtimePromos(handleCodesUpdate);
    
    // Initial fetch
    promoCodeService.getPromoCodes().then(handleCodesUpdate);

    const interval = setInterval(async () => {
      const latest = await promoCodeService.getPromoCodes();
      handleCodesUpdate(latest);
    }, 3000);

    return () => {
      unsubscribeRealtime();
      clearInterval(interval);
    };
  }, []);

  const loginUser = (user: UserAccount) => {
    setCurrentUser(user);
  };

  const logoutUser = () => {
    setCurrentUser(null);
    setCurrentStep('landing');
  };

  const saveCollegeDetails = (details: CollegeDetails) => {
    setCollegeDetails(details);
  };

  const selectEvent = (event: EventItem) => {
    if (!isEventRegistrationOpen(event.id) || !isEventRegistrationOpen(event.code)) {
      alert(`Registration for ${event.title} (${event.code}) has been stopped by the Admin.`);
      return;
    }

    setSelectedEvent(event);
    setTeamName('');
    
    // Helper to get clean user details without dummy defaults
    const cleanName = currentUser?.fullName && currentUser.fullName !== 'Collegiate Delegate' ? currentUser.fullName : '';
    const cleanMobile = currentUser?.mobile && currentUser.mobile !== '9876543210' ? currentUser.mobile : '';

    const initialCount = event.type === 'Solo' 
      ? 1 
      : (event.maxParticipants || event.minParticipants || 2);

    const initialParticipants: ParticipantMember[] = [];
    for (let i = 0; i < initialCount; i++) {
      if (i === 0) {
        initialParticipants.push({
          fullName: cleanName,
          gender: 'Male',
          age: '',
          mobile: cleanMobile,
          email: currentUser?.email || '',
          role: event.type === 'Solo' 
            ? 'Individual Participant' 
            : (event.id === 'twin-flare' || event.code === 'TWIN-FLARE' || event.type === 'Duo' ? 'Team Captain / Participant 1' : 'Team Captain / Primary Contact'),
        });
      } else {
        initialParticipants.push({
          fullName: '',
          gender: 'Male',
          age: '',
          mobile: '',
          email: '',
          role: event.id === 'twin-flare' || event.code === 'TWIN-FLARE' || event.type === 'Duo' ? `Participant ${i + 1}` : `Team Member #${i + 1}`,
        });
      }
    }
    setParticipants(initialParticipants);
  };

  const applyPromoCode = async (codeStr: string, scopeContext: 'individual' | 'combo' = 'individual') => {
    let originalAmt = 0;
    if (selectedEvent) {
      originalAmt = selectedEvent.feeType === 'per_head'
        ? selectedEvent.feeAmount * Math.max(participants.length, 1)
        : selectedEvent.feeAmount;
    }
    const res = await promoCodeService.validatePromoCode(codeStr, scopeContext, originalAmt);
    if (res.valid && res.promo) {
      // Single code constraint: Overwrite any existing promo code rather than compounding
      setAppliedPromoCode(res.promo);
      return { success: true, message: res.message, promo: res.promo };
    }
    return { success: false, message: res.message };
  };

  const removePromoCode = () => {
    setAppliedPromoCode(null);
  };

  const calculateDiscountAmount = (
    event: EventItem | null,
    participantCount: number,
    customPromo?: PromoCode | null
  ): number => {
    if (!event || collegeDetails?.isHostCollege) return 0;
    const promo = customPromo !== undefined ? customPromo : appliedPromoCode;
    if (!promo) return 0;

    const baseFee = event.feeType === 'per_head'
      ? event.feeAmount * Math.max(participantCount, 1)
      : event.feeAmount;

    if (promo.isAdvancePayment || promo.discountType === 'advance') {
      const adv = promo.advanceAmount || 0;
      return Math.max(0, baseFee - adv);
    }

    if (!promo.discountPercent) return 0;
    return Math.round(baseFee * (promo.discountPercent / 100));
  };

  const calculateTotalFee = (
    event: EventItem | null,
    participantCount: number,
    customPromo?: PromoCode | null
  ): number => {
    if (!event) return 0;
    if (collegeDetails?.isHostCollege) return 0;

    const baseFee = event.feeType === 'per_head'
      ? event.feeAmount * Math.max(participantCount, 1)
      : event.feeAmount;

    const promo = customPromo !== undefined ? customPromo : appliedPromoCode;
    if (promo && (promo.isAdvancePayment || promo.discountType === 'advance')) {
      const adv = promo.advanceAmount || 0;
      return Math.min(baseFee, adv);
    }

    const discount = calculateDiscountAmount(event, participantCount, customPromo);
    return Math.max(baseFee - discount, 0);
  };

  const submitRegistration = async (): Promise<RegistrationSubmission | null> => {
    if (!selectedEvent || !collegeDetails || !currentUser) return null;

    if (!isGlobalRegistrationOpen() || !isEventRegistrationOpen(selectedEvent.id) || !isEventRegistrationOpen(selectedEvent.code)) {
      throw new Error(`Registration for ${selectedEvent.title} (${selectedEvent.code}) has been stopped by the Admin. New entries are currently blocked.`);
    }

    const submissionId = generateRegistrationCode(selectedEvent.id);
    const isHost = Boolean(collegeDetails.isHostCollege);

    // Strict enforcement: For all participants not from Srinivasan Medical College & Hospital (Host), payment screenshot is compulsory
    if (!isHost && !paymentScreenshotFile && !paymentScreenshotData) {
      throw new Error('Payment screenshot is strictly compulsory for all non-host college registrations. Please upload your payment receipt before submitting.');
    }
    
    const baseFee = isHost ? 0 : (selectedEvent.feeType === 'per_head' ? selectedEvent.feeAmount * Math.max(participants.length, 1) : selectedEvent.feeAmount);
    const isAdv = !isHost && Boolean(appliedPromoCode?.isAdvancePayment || appliedPromoCode?.discountType === 'advance');
    const discountAmount = isHost ? 0 : calculateDiscountAmount(selectedEvent, participants.length);
    const totalAmount = isHost ? 0 : calculateTotalFee(selectedEvent, participants.length);
    const remainingBalance = isAdv ? Math.max(0, baseFee - totalAmount) : 0;

    const newSubmission: RegistrationSubmission = {
      id: submissionId,
      registrationCode: submissionId,
      userId: currentUser.id,
      eventId: selectedEvent.id,
      eventTitle: selectedEvent.title,
      eventCode: selectedEvent.code,
      eventCategory: selectedEvent.categoryDisplay,
      eventType: selectedEvent.type,
      venue: selectedEvent.venue,
      dateStr: "November 3-5, 2026",
      duration: selectedEvent.duration,
      college: collegeDetails,
      isHostCollege: isHost,
      teamName: teamName || (selectedEvent.type === 'Solo' ? selectedEvent.title : `${currentUser.fullName}'s Team`),
      participantCount: participants.length,
      participants: [...participants],
      feePerUnit: isHost ? 0 : selectedEvent.feeAmount,
      feeType: selectedEvent.feeType,
      promoCode: !isHost && appliedPromoCode ? appliedPromoCode.code : undefined,
      discountPercent: !isHost && appliedPromoCode ? appliedPromoCode.discountPercent : undefined,
      discountAmount: !isHost ? discountAmount : 0,
      originalAmount: !isHost ? baseFee : 0,
      isAdvancePayment: isAdv,
      advanceAmountPaid: isAdv ? (appliedPromoCode?.advanceAmount || totalAmount) : undefined,
      remainingBalance: isAdv ? remainingBalance : undefined,
      totalAmount: baseFee,
      paidAmount: isHost ? 0 : (isAdv ? (appliedPromoCode?.advanceAmount || totalAmount) : baseFee),
      pendingAmount: isHost ? 0 : (isAdv ? remainingBalance : 0),
      utrNumber: isHost 
        ? (utrNumber.trim() || 'SMCH-HOST-FREE') 
        : (utrNumber.trim() || 'NOT_SUBMITTED'),
      paymentScreenshotName: isHost ? 'smch_host_waiver.png' : (paymentScreenshotName || 'receipt_screenshot.png'),
      paymentScreenshotData: paymentScreenshotData || undefined,
      paymentConfirmed: isHost ? true : (isAutoApproveEnabled() ? true : paymentConfirmed),
      paymentStatus: (isHost || isAutoApproveEnabled()) ? 'Verified' : (isAdv ? 'Advance Paid' : 'Submitted'),
      registrationStatus: (isHost || isAutoApproveEnabled()) ? 'Confirmed' : 'Submitted',
      createdAt: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    };

    const currentPaymentFile = paymentScreenshotFile;
    const currentPaymentData = paymentScreenshotData;
    const currentParticipants = [...participants];

    // Dispatch and await Supabase cloud record insertion
    if (isSupabaseConfigured) {
      let res;
      try {
        res = await supabaseRegistrationService.submitRegistrationToSupabase({
          selectedEvent,
          collegeDetails,
          participants: currentParticipants,
          teamName,
          totalFee: totalAmount,
          utrNumber: utrNumber.trim() || 'NOT_SUBMITTED',
          registrationCode: submissionId,
          paymentScreenshotName: paymentScreenshotName || 'receipt_screenshot.png',
          paymentScreenshotFile: currentPaymentFile,
          paymentScreenshotData: currentPaymentData || undefined,
          idCardFiles: currentParticipants.map((p) => p.idCardFile || null),
          userId: currentUser.id,
          promoCode: newSubmission.promoCode,
          discountPercent: newSubmission.discountPercent,
          discountAmount: newSubmission.discountAmount,
          originalAmount: newSubmission.originalAmount,
        });
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Network error communicating with database';
        console.error('Supabase cloud submission exception:', errorMsg);
        throw new Error(`Cloud database write failed: ${errorMsg}`);
      }

      if (!res || !res.success || res.error) {
        const cloudError = res?.error || 'Database registration write unconfirmed by server';
        console.error('Registration cloud write unconfirmed:', cloudError);
        throw new Error(cloudError);
      }

      if (res.supabaseId) {
        newSubmission.id = res.supabaseId;
      }
    }

    // Increment redemption counter on applied promo code
    if (appliedPromoCode?.code) {
      promoCodeService.incrementRedemption(appliedPromoCode.code).catch(() => {});
    }

    // Append to local state ONLY after cloud write confirmation (or in offline-only mode)
    setMyRegistrations((prev) => [newSubmission, ...prev]);
    setActiveRegistration(newSubmission);

    // Clear draft payment inputs & promo code after successful confirmation
    setUtrNumber('');
    setPaymentScreenshotName('');
    setPaymentScreenshotFile(null);
    setPaymentScreenshotData('');
    setPaymentConfirmed(false);
    setAppliedPromoCode(null);

    return newSubmission;
  };

  const startNewRegistration = (preselectedEventId?: string) => {
    let successfullyPreselected = false;
    if (preselectedEventId) {
      const found = EVENTS_DATA.find((e) => e.id.toLowerCase() === preselectedEventId.toLowerCase() || e.code.toLowerCase() === preselectedEventId.toLowerCase());
      if (found) {
        if (!isEventRegistrationOpen(found.id) || !isEventRegistrationOpen(found.code)) {
          alert(`Registration for ${found.title} (${found.code}) has been stopped by the Admin.`);
          setSelectedEvent(null);
        } else {
          selectEvent(found);
          successfullyPreselected = true;
        }
      }
    } else {
      setSelectedEvent(null);
    }
    setTeamName('');
    setUtrNumber('');
    setPaymentScreenshotName('');
    setPaymentScreenshotFile(null);
    setPaymentScreenshotData('');
    setPaymentConfirmed(false);
    setAppliedPromoCode(null);

    // If user is already logged in and has college details, jump to participants if preselected, else event selector
    if (currentUser && collegeDetails) {
      if (successfullyPreselected) {
        setCurrentStep('participants');
      } else {
        setCurrentStep('event');
      }
    } else if (currentUser) {
      setCurrentStep('college');
    } else {
      setCurrentStep('account');
    }
  };

  const deleteRegistration = async (id: string): Promise<boolean> => {
    // 1. Remove from local state monotonically without shifting other entries
    setMyRegistrations((prev) => prev.filter((r) => r.id !== id && r.registrationCode !== id));
    if (activeRegistration && (activeRegistration.id === id || activeRegistration.registrationCode === id)) {
      setActiveRegistration(null);
    }
    if (viewReceiptRegistration && (viewReceiptRegistration.id === id || viewReceiptRegistration.registrationCode === id)) {
      setViewReceiptRegistration(null);
    }
    // 2. Remove from localStorage
    try {
      const saved = localStorage.getItem(REGISTRATIONS_STORAGE_KEY);
      if (saved) {
        const parsed: RegistrationSubmission[] = JSON.parse(saved);
        const filtered = parsed.filter((r) => r.id !== id && r.registrationCode !== id);
        localStorage.setItem(REGISTRATIONS_STORAGE_KEY, JSON.stringify(filtered));
      }
    } catch {}

    // 3. Remove from Supabase
    try {
      await supabaseRegistrationService.deleteRegistration(id);
    } catch (e) {
      console.warn('Supabase delete error:', e);
    }
    return true;
  };

  // Add multiple registrations at once (used for combo purchases)
  const addCompletedRegistrations = (submissions: RegistrationSubmission[]) => {
    setMyRegistrations((prev) => {
      const existingKeys = new Set(prev.map((r) => r.registrationCode || r.id));
      const freshSubmissions = submissions.filter((s) => !existingKeys.has(s.registrationCode || s.id));
      const updated = [...freshSubmissions, ...prev];
      try {
        localStorage.setItem(REGISTRATIONS_STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Real-time synchronization of participant registrations and verification status from cloud
  const refreshUserRegistrations = async () => {
    const contactKey = currentUser?.email || currentUser?.mobile;
    if (!contactKey) return;
    try {
      const cloudItems = await supabaseRegistrationService.fetchUserRegistrations(contactKey);
      if (cloudItems && cloudItems.length > 0) {
        setMyRegistrations((prev) => {
          const cloudMap = new Map(cloudItems.map((c) => [c.registrationCode || c.id, c]));
          const merged = prev.map((localItem) => {
            const key = localItem.registrationCode || localItem.id;
            const fromCloud = cloudMap.get(key);
            if (fromCloud) {
              return {
                ...localItem,
                paymentStatus: fromCloud.paymentStatus,
                registrationStatus: fromCloud.registrationStatus,
                paymentConfirmed: fromCloud.paymentConfirmed || fromCloud.paymentStatus === 'Verified',
              };
            }
            return localItem;
          });

          // Append any cloud registrations not found locally
          const localKeys = new Set(prev.map((p) => p.registrationCode || p.id));
          cloudItems.forEach((c) => {
            if (!localKeys.has(c.registrationCode || c.id)) {
              merged.push(c);
            }
          });

          try {
            localStorage.setItem(REGISTRATIONS_STORAGE_KEY, JSON.stringify(merged));
          } catch {}
          return merged;
        });
      }
    } catch {
      // Non-fatal
    }
  };

  // Active sync timer whenever user is logged in
  useEffect(() => {
    if (currentUser?.email || currentUser?.mobile) {
      refreshUserRegistrations();
      const syncInterval = setInterval(() => {
        refreshUserRegistrations();
      }, 3500);
      return () => clearInterval(syncInterval);
    }
  }, [currentUser?.email, currentUser?.mobile]);

  return (
    <RegistrationContext.Provider
      value={{
        currentStep,
        goToStep,
        currentUser,
        loginUser,
        logoutUser,
        collegeDetails,
        saveCollegeDetails,
        selectedEvent,
        selectEvent,
        teamName,
        setTeamName,
        participants,
        setParticipants,
        utrNumber,
        setUtrNumber,
        paymentScreenshotName,
        setPaymentScreenshotName,
        paymentScreenshotFile,
        setPaymentScreenshotFile,
        paymentScreenshotData,
        setPaymentScreenshotData,
        paymentConfirmed,
        setPaymentConfirmed,
        appliedPromoCode,
        applyPromoCode,
        removePromoCode,
        calculateTotalFee,
        calculateDiscountAmount,
        myRegistrations,
        activeRegistration,
        setActiveRegistration,
        submitRegistration,
        addCompletedRegistrations,
        refreshUserRegistrations,
        deleteRegistration,
        startNewRegistration,
        viewReceiptRegistration,
        setViewReceiptRegistration,
      }}
    >
      {children}
    </RegistrationContext.Provider>
  );
};

export const useRegistration = () => {
  const context = useContext(RegistrationContext);
  if (!context) {
    throw new Error('useRegistration must be used within a RegistrationProvider');
  }
  return context;
};
