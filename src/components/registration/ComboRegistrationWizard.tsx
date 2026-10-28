import React, { useState, useEffect, useMemo } from 'react';
import { 
  CheckCircle, 
  ArrowLeft, 
  ArrowRight, 
  User, 
  Building2, 
  Upload, 
  AlertCircle, 
  Tag, 
  Trash2,
  FileText,
  UserPlus,
  Info,
  CheckCircle2,
  Copy,
  Check,
  Layers,
  ShieldAlert,
  Users,
  ChevronRight,
  Zap,
  Crown,
  Tv,
  Music,
  ShieldCheck
} from 'lucide-react';
import { ComboOffer, getEventComboType } from '../../data/comboOffersData';
import { EventItem, EVENTS_DATA, FESTIVAL_METADATA } from '../../data/festivalData';
import { useRegistration } from '../../context/RegistrationContext';
import { RegistrationSubmission, PromoCode, ParticipantMember } from '../../types/registration';
import { supabaseRegistrationService } from '../../services/supabaseRegistrationService';
import { promoCodeService } from '../../services/promoCodeService';
import { isEventRegistrationOpen } from '../../utils/registrationStatus';

interface ComboRegistrationWizardProps {
  combo: ComboOffer;
  selectedEvents?: EventItem[];
  onCancel: () => void;
  onComplete: () => void;
}

export interface EventParticipantEntry {
  eventId: string;
  eventTitle: string;
  eventType: 'Solo' | 'Duo' | 'Team';
  eventCategory: string;
  captainName: string;
  captainPhone: string;
  captainEmail?: string;
  totalParticipantsCount?: number;
}

export const ComboRegistrationWizard: React.FC<ComboRegistrationWizardProps> = ({
  combo,
  selectedEvents: initialSelectedEvents,
  onCancel,
  onComplete
}) => {
  const { currentUser, loginUser, collegeDetails, saveCollegeDetails, addCompletedRegistrations } = useRegistration();

  // Determine if combo requires an Event Selection Step
  const requiresEventSelection = useMemo(() => {
    if (combo.id === 'fashion-royale' || combo.id === 'viral-takeover') {
      return false; // Fixed combos
    }
    return true; // Celestia All-Access, Power Trio, Spotlight Squad, Solo Duo, etc.
  }, [combo.id]);

  // Step flow state:
  // 1 = Event Selection (if selectable)
  // 2 = Primary Registering Person & Student ID Card
  // 3 = Participant Details Forms
  // 4 = Review & Verification
  // 5 = Payment Gateway
  const [wizardStep, setWizardStep] = useState<number>(() => {
    if (combo.id === 'fashion-royale' || combo.id === 'viral-takeover') {
      return 2;
    }
    return 1;
  });

  // Selected events state (array of EventItem objects, supporting duplicate selections e.g. 2 AdBlitz teams)
  const [chosenEvents, setChosenEvents] = useState<EventItem[]>(() => {
    if (initialSelectedEvents && initialSelectedEvents.length > 0) {
      return initialSelectedEvents;
    }
    if (combo.id === 'fashion-royale') {
      return EVENTS_DATA.filter(e => e.id === 'silhouette' || e.id === 'elaris');
    }
    if (combo.id === 'viral-takeover') {
      return EVENTS_DATA.filter(e => e.id === 'mememania' || e.id === 'cineverse');
    }
    if (combo.id === 'power-trio-package') {
      const majorEvt = EVENTS_DATA.find(e => e.id === 'starfusion')!;
      const minorEvt1 = EVENTS_DATA.find(e => e.id === 'adblitz')!;
      const minorEvt2 = EVENTS_DATA.find(e => e.id === 'stellar-bid')!;
      return [majorEvt, minorEvt1, minorEvt2];
    }
    if (combo.id === 'spotlight-squad-package') {
      const majorEvt = EVENTS_DATA.find(e => e.id === 'starfusion')!;
      const soloEvt1 = EVENTS_DATA.find(e => e.id === 'seraphia')!;
      const soloEvt2 = EVENTS_DATA.find(e => e.id === 'eclipse')!;
      return [majorEvt, soloEvt1, soloEvt2];
    }
    return [];
  });

  // Celestia All-Access Specific Event Selection States
  const [allAccessMajorId, setAllAccessMajorId] = useState<string>('starfusion');
  const [allAccessMinor1Id, setAllAccessMinor1Id] = useState<string>('adblitz');
  const [allAccessMinor2Id, setAllAccessMinor2Id] = useState<string>('stellar-bid');
  const [allAccessSolo1Id, setAllAccessSolo1Id] = useState<string>('seraphia');
  const [allAccessSolo2Id, setAllAccessSolo2Id] = useState<string>('eclipse');

  // Power Trio Specific Event Selection States (1 Major + 2 Minor)
  const [powerTrioMajorId, setPowerTrioMajorId] = useState<string>('starfusion');
  const [powerTrioMinor1Id, setPowerTrioMinor1Id] = useState<string>('adblitz');
  const [powerTrioMinor2Id, setPowerTrioMinor2Id] = useState<string>('stellar-bid');

  // Spotlight Squad Specific Event Selection States (1 Major + 2 Solo)
  const [spotlightMajorId, setSpotlightMajorId] = useState<string>('starfusion');
  const [spotlightSolo1Id, setSpotlightSolo1Id] = useState<string>('seraphia');
  const [spotlightSolo2Id, setSpotlightSolo2Id] = useState<string>('eclipse');

  // Solo Duo & Triple Threat Single Participant Details (Single person for all solo events)
  const [soloComboPartName, setSoloComboPartName] = useState<string>(currentUser?.fullName || '');
  const [soloComboPartPhone, setSoloComboPartPhone] = useState<string>(currentUser?.mobile || '');

  // Standard Combo Event Picker States (e.g. Solo Duo, Triple Threat Solo, Minor/Major Combos)
  const [genericPickedEventIds, setGenericPickedEventIds] = useState<string[]>(() => {
    if (initialSelectedEvents && initialSelectedEvents.length > 0) {
      return initialSelectedEvents.map(e => e.id);
    }
    if (combo.eligibleEventIds) {
      const count = combo.minEventsToSelect || combo.maxEventsToSelect || 1;
      return combo.eligibleEventIds.slice(0, count);
    }
    return [];
  });

  // Account & College Profile state
  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [mobile, setMobile] = useState(currentUser?.mobile || '');
  const [collegeName, setCollegeName] = useState(collegeDetails?.collegeName || '');
  const [city, setCity] = useState(collegeDetails?.city || '');
  const [state, setState] = useState(collegeDetails?.state || 'Tamil Nadu');

  // Primary Student ID Card (Only ID Card required for the whole combo!)
  const [primaryIdCardFileName, setPrimaryIdCardFileName] = useState<string | undefined>();
  const [primaryIdCardFileData, setPrimaryIdCardFileData] = useState<string | undefined>();
  const [primaryIdCardFile, setPrimaryIdCardFile] = useState<File | undefined>();

  // Validation errors map
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form entries for event steps
  // Fashion Royale entries
  const [fashionRoyaleSilhouetteCount, setFashionRoyaleSilhouetteCount] = useState<number | ''>(7);
  const [fashionRoyaleSilhouetteCapName, setFashionRoyaleSilhouetteCapName] = useState<string>('');
  const [fashionRoyaleSilhouetteCapPhone, setFashionRoyaleSilhouetteCapPhone] = useState<string>('');

  const [elaris1Name, setElaris1Name] = useState<string>('');
  const [elaris1Phone, setElaris1Phone] = useState<string>('');
  const [elaris2Name, setElaris2Name] = useState<string>('');
  const [elaris2Phone, setElaris2Phone] = useState<string>('');
  const [elaris3Name, setElaris3Name] = useState<string>('');
  const [elaris3Phone, setElaris3Phone] = useState<string>('');

  // General Event Form Entries Map (keyed by `${eventId}_${instanceIdx}`)
  const [eventFormDataMap, setEventFormDataMap] = useState<Record<string, {
    captainName: string;
    captainPhone: string;
    totalParticipants?: number | '';
  }>>({});

  // Sync Primary Person Name/Phone into defaults
  useEffect(() => {
    if (fullName || mobile) {
      setFashionRoyaleSilhouetteCapName(prev => prev || fullName);
      setFashionRoyaleSilhouetteCapPhone(prev => prev || mobile);
      setElaris1Name(prev => prev || fullName);
      setElaris1Phone(prev => prev || mobile);
      setSoloComboPartName(prev => prev || fullName);
      setSoloComboPartPhone(prev => prev || mobile);
    }
  }, [fullName, mobile]);

  // Combo Promo Code States
  const [comboAppliedPromo, setComboAppliedPromo] = useState<PromoCode | null>(null);
  const [comboPromoInput, setComboPromoInput] = useState<string>('');
  const [comboPromoMsg, setComboPromoMsg] = useState<string>('');
  const [isValidatingComboPromo, setIsValidatingComboPromo] = useState<boolean>(false);

  // Payment state
  const [utrNumber, setUtrNumber] = useState('');
  const [paymentFile, setPaymentFile] = useState<File | null>(null);
  const [paymentPreviewData, setPaymentPreviewData] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Static UPI Payment QR Code candidates
  const [copiedUpi, setCopiedUpi] = useState(false);
  const qrCandidateUrls = useMemo(() => [
    '/payment_qr.png',
    '/Payment_qr.png',
    '/payment_qr.jpg',
    '/qr_code.png',
    '/qr.png'
  ], []);
  const [qrCandidateIndex, setQrCandidateIndex] = useState(0);
  const [allQrCandidatesFailed, setAllQrCandidatesFailed] = useState(false);

  const handleBankQrImgError = () => {
    if (qrCandidateIndex + 1 < qrCandidateUrls.length) {
      setQrCandidateIndex(prev => prev + 1);
    } else {
      setAllQrCandidatesFailed(true);
    }
  };

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(FESTIVAL_METADATA.paymentUpiIdPlaceholder);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };



  // Primary ID Card Upload
  const handlePrimaryIdCardUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5MB limit. Please upload a smaller photo or PDF.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setPrimaryIdCardFileName(file.name);
      setPrimaryIdCardFileData(dataUrl);
      setPrimaryIdCardFile(file);
    };
    reader.readAsDataURL(file);
  };

  // Helper to compute final ordered chosen events (Major ➔ Minor ➔ Solo)
  const orderedChosenEvents = useMemo(() => {
    let currentList = chosenEvents;
    if (combo.id === 'celestia-all-access' && (currentList.length === 0 || wizardStep === 1)) {
      const majorEvt = EVENTS_DATA.find(e => e.id === allAccessMajorId);
      const minorEvt1 = EVENTS_DATA.find(e => e.id === allAccessMinor1Id);
      const minorEvt2 = EVENTS_DATA.find(e => e.id === allAccessMinor2Id);
      const soloEvt1 = EVENTS_DATA.find(e => e.id === allAccessSolo1Id);
      const soloEvt2 = EVENTS_DATA.find(e => e.id === allAccessSolo2Id);
      currentList = [majorEvt, minorEvt1, minorEvt2, soloEvt1, soloEvt2].filter(Boolean) as EventItem[];
    } else if (combo.id === 'power-trio-package' && (currentList.length === 0 || wizardStep === 1)) {
      const majorEvt = EVENTS_DATA.find(e => e.id === powerTrioMajorId);
      const minorEvt1 = EVENTS_DATA.find(e => e.id === powerTrioMinor1Id);
      const minorEvt2 = EVENTS_DATA.find(e => e.id === powerTrioMinor2Id);
      currentList = [majorEvt, minorEvt1, minorEvt2].filter(Boolean) as EventItem[];
    } else if (combo.id === 'spotlight-squad-package' && (currentList.length === 0 || wizardStep === 1)) {
      const majorEvt = EVENTS_DATA.find(e => e.id === spotlightMajorId);
      const soloEvt1 = EVENTS_DATA.find(e => e.id === spotlightSolo1Id);
      const soloEvt2 = EVENTS_DATA.find(e => e.id === spotlightSolo2Id);
      currentList = [majorEvt, soloEvt1, soloEvt2].filter(Boolean) as EventItem[];
    } else if (combo.id === 'double-impact-minor' || combo.id === 'campus-clash-major') {
      const baseEvt = currentList[0] || (genericPickedEventIds.length > 0 ? EVENTS_DATA.find(e => genericPickedEventIds.includes(e.id)) : undefined) || (combo.eligibleEventIds?.[0] ? EVENTS_DATA.find(e => e.id === combo.eligibleEventIds![0]) : undefined) || EVENTS_DATA.find(e => e.id === 'adblitz');
      if (baseEvt) {
        currentList = [baseEvt, baseEvt];
      }
    } else if (combo.id === 'triple-takeover-minor' || combo.id === 'campus-domination-major') {
      const baseEvt = currentList[0] || (genericPickedEventIds.length > 0 ? EVENTS_DATA.find(e => genericPickedEventIds.includes(e.id)) : undefined) || (combo.eligibleEventIds?.[0] ? EVENTS_DATA.find(e => e.id === combo.eligibleEventIds![0]) : undefined) || EVENTS_DATA.find(e => e.id === 'adblitz');
      if (baseEvt) {
        currentList = [baseEvt, baseEvt, baseEvt];
      }
    } else if (currentList.length === 0 && genericPickedEventIds.length > 0) {
      currentList = genericPickedEventIds.map(id => EVENTS_DATA.find(e => e.id === id)).filter(Boolean) as EventItem[];
    }

    return [...currentList].sort((a, b) => {
      const typeA = getEventComboType(a);
      const typeB = getEventComboType(b);
      const rankMap: Record<string, number> = {
        major: 1,
        minor: 2,
        digital: 3,
        solo: 4
      };
      return (rankMap[typeA] || 9) - (rankMap[typeB] || 9);
    });
  }, [
    chosenEvents, combo.id, wizardStep,
    allAccessMajorId, allAccessMinor1Id, allAccessMinor2Id, allAccessSolo1Id, allAccessSolo2Id,
    powerTrioMajorId, powerTrioMinor1Id, powerTrioMinor2Id,
    spotlightMajorId, spotlightSolo1Id, spotlightSolo2Id,
    genericPickedEventIds
  ]);

  // Helper to compute individual event original fee based on whether it is per_head or per_team
  const getEventOriginalCost = (evt: EventItem, idx: number): number => {
    // 1. Team event with per_head fee (e.g. Starfusion or Silhouette)
    if (evt.feeType === 'per_head' && evt.type === 'Team') {
      if (combo.id === 'fashion-royale' && evt.id === 'silhouette') {
        const count = fashionRoyaleSilhouetteCount !== '' ? Number(fashionRoyaleSilhouetteCount) : 7;
        return (count || 7) * evt.feeAmount;
      }
      const rawCount = eventFormDataMap[`${evt.id}_${idx}`]?.totalParticipants;
      const count = (rawCount !== undefined && rawCount !== '') 
        ? Number(rawCount) 
        : (evt.minParticipants || 1);
      return (count || evt.minParticipants || 1) * evt.feeAmount;
    }
    // 2. Fixed per_team events (e.g. AdBlitz, Stellar Bid, Reflexia, Twin Flare) or Solo/Duo
    return evt.feeAmount;
  };

  // Compute pricing accurately based on package rules
  const calculatePricing = () => {
    let baseTotalOriginal = 0;
    orderedChosenEvents.forEach((evt, idx) => {
      baseTotalOriginal += getEventOriginalCost(evt, idx);
    });

    let defaultComboFee = combo.comboPrice;
    if (combo.id === 'fashion-royale') {
      const silCount = (fashionRoyaleSilhouetteCount !== '' ? Number(fashionRoyaleSilhouetteCount) : 7) || 7;
      defaultComboFee = silCount * 300;
      baseTotalOriginal = defaultComboFee + (3 * 250);
    } else if (combo.priceType === 'discount_percentage' && combo.discountPercentage) {
      const discountVal = Math.round((baseTotalOriginal * combo.discountPercentage) / 100);
      defaultComboFee = Math.max(0, baseTotalOriginal - discountVal);
    }

    let finalFee = defaultComboFee;
    let isAdv = false;
    let advanceAmount = 0;
    let remainingBalance = 0;

    if (comboAppliedPromo) {
      if (comboAppliedPromo.isAdvancePayment || comboAppliedPromo.discountType === 'advance') {
        isAdv = true;
        advanceAmount = comboAppliedPromo.advanceAmount || 0;
        finalFee = Math.min(defaultComboFee, advanceAmount);
        remainingBalance = Math.max(0, defaultComboFee - finalFee);
      } else if (comboAppliedPromo.discountPercent) {
        const promoDiscount = Math.round((defaultComboFee * comboAppliedPromo.discountPercent) / 100);
        finalFee = Math.max(0, defaultComboFee - promoDiscount);
      }
    }

    const totalDiscountVal = Math.max(0, baseTotalOriginal - finalFee);

    return {
      originalTotal: baseTotalOriginal > 0 ? baseTotalOriginal : (combo.originalEstimatedValue || combo.comboPrice),
      unDiscountedComboFee: defaultComboFee,
      finalFee: Math.max(0, finalFee),
      discountVal: totalDiscountVal,
      isAdvancePayment: isAdv,
      advanceAmountPaid: isAdv ? finalFee : undefined,
      remainingBalance: isAdv ? remainingBalance : undefined,
      appliedPromo: comboAppliedPromo
    };
  };

  const pricing = calculatePricing();

  const handleApplyComboPromo = async () => {
    if (!comboPromoInput.trim()) return;
    setIsValidatingComboPromo(true);
    setComboPromoMsg('');
    try {
      const res = await promoCodeService.validatePromoCode(comboPromoInput.trim(), 'combo', pricing.unDiscountedComboFee);
      setComboPromoMsg(res.message);
      if (res.valid && res.promo) {
        setComboAppliedPromo(res.promo);
        setComboPromoInput('');
      }
    } catch {
      setComboPromoMsg('Failed to validate promo code.');
    } finally {
      setIsValidatingComboPromo(false);
    }
  };

  const handleRemoveComboPromo = () => {
    setComboAppliedPromo(null);
    setComboPromoMsg('');
  };

  // Validate current step navigation
  const validateCurrentStep = (): boolean => {
    const errs: Record<string, string> = {};

    // Global Check: Verify none of the selected combo events are stopped by Admin
    const stoppedEvent = orderedChosenEvents.find(e => !isEventRegistrationOpen(e.id) || !isEventRegistrationOpen(e.code));
    if (stoppedEvent) {
      errs.stoppedEvent = `Registration for ${stoppedEvent.title} (${stoppedEvent.code}) has been stopped by the Admin. Please select an active event.`;
      setErrors(errs);
      return false;
    }

    // Step 1: Event Selection Step
    if (wizardStep === 1) {
      if (combo.id === 'celestia-all-access') {
        if (!allAccessMajorId) errs.allAccessMajor = 'Please select 1 Major Event.';
        if (!allAccessMinor1Id || !allAccessMinor2Id) errs.allAccessMinor = 'Please select exactly 2 Minor Events.';
        if (!allAccessSolo1Id || !allAccessSolo2Id) errs.allAccessSolo = 'Please select exactly 2 Solo Events.';
      } else if (combo.id === 'power-trio-package') {
        if (!powerTrioMajorId) errs.powerMajor = 'Please select 1 Major Event.';
        if (!powerTrioMinor1Id || !powerTrioMinor2Id) errs.powerMinor = 'Please select exactly 2 Minor Events.';
      } else if (combo.id === 'spotlight-squad-package') {
        if (!spotlightMajorId) errs.spotlightMajor = 'Please select 1 Major Event.';
        if (!spotlightSolo1Id || !spotlightSolo2Id) errs.spotlightSolo = 'Please select exactly 2 Solo Events.';
      } else if (combo.minEventsToSelect) {
        if (genericPickedEventIds.length < combo.minEventsToSelect) {
          errs.genericEvents = `Please select at least ${combo.minEventsToSelect} event(s) to activate this combo.`;
        }
      }

      setErrors(errs);
      return Object.keys(errs).length === 0;
    }

    // Step 2: Primary Account & Student ID Card
    if (wizardStep === 2) {
      if (!fullName.trim()) errs.fullName = 'Full Name is required.';
      if (!email.trim() || !email.includes('@')) errs.email = 'Valid email is required.';
      if (!mobile.trim() || mobile.replace(/\D/g, '').length < 10) errs.mobile = 'Valid 10-digit mobile required.';
      if (!collegeName.trim()) errs.collegeName = 'College Name is required.';
      if (!primaryIdCardFileName && !primaryIdCardFileData) errs.primaryIdCard = 'Student ID Card photo upload is required.';

      setErrors(errs);
      return Object.keys(errs).length === 0;
    }

    // Step 3: Event Forms Validation
    if (wizardStep === 3) {
      if (combo.id === 'fashion-royale') {
        if (!fashionRoyaleSilhouetteCapName.trim()) errs.silCapName = 'Silhouette Captain Full Name is required.';
        if (!fashionRoyaleSilhouetteCapPhone.trim()) errs.silCapPhone = 'Silhouette Captain Phone is required.';
        if (fashionRoyaleSilhouetteCount === '' || Number(fashionRoyaleSilhouetteCount) < 7) {
          errs.silCount = 'Silhouette requires a minimum of 7 team participants.';
        } else if (Number(fashionRoyaleSilhouetteCount) > 10) {
          errs.silCount = 'Silhouette allows a maximum of 10 team participants.';
        }

        if (!elaris1Name.trim()) errs.elaris1Name = 'Elaris Participant 1 Full Name is required.';
        if (!elaris1Phone.trim()) errs.elaris1Phone = 'Elaris Participant 1 Phone is required.';
        if (!elaris2Name.trim()) errs.elaris2Name = 'Elaris Participant 2 Full Name is required.';
        if (!elaris2Phone.trim()) errs.elaris2Phone = 'Elaris Participant 2 Phone is required.';
        if (!elaris3Name.trim()) errs.elaris3Name = 'Elaris Participant 3 Full Name is required.';
        if (!elaris3Phone.trim()) errs.elaris3Phone = 'Elaris Participant 3 Phone is required.';
      } else if (combo.id === 'solo-duo' || combo.id === 'triple-threat-solo') {
        if (!soloComboPartName.trim()) errs.soloPartName = 'Participant Full Name is required.';
        if (!soloComboPartPhone.trim() || soloComboPartPhone.replace(/\D/g, '').length < 10) {
          errs.soloPartPhone = 'Valid 10-digit mobile number is required.';
        }
      } else {
        orderedChosenEvents.forEach((evt, idx) => {
          const formData = eventFormDataMap[`${evt.id}_${idx}`] || {
            captainName: idx === 0 ? fullName : '',
            captainPhone: idx === 0 ? mobile : '',
            totalParticipants: evt.minParticipants || 1
          };

          if (!formData.captainName || !formData.captainName.trim()) {
            errs[`capName_${evt.id}_${idx}`] = `${evt.type === 'Solo' ? 'Participant' : 'Captain'} Name is required.`;
          }
          if (!formData.captainPhone || formData.captainPhone.replace(/\D/g, '').length < 10) {
            errs[`capPhone_${evt.id}_${idx}`] = 'Valid 10-digit phone number is required.';
          }
          if (evt.type === 'Team') {
            const minParts = evt.minParticipants || 1;
            const maxParts = evt.maxParticipants;
            if (formData.totalParticipants === '' || formData.totalParticipants === undefined || Number(formData.totalParticipants) < minParts) {
              errs[`totalParts_${evt.id}_${idx}`] = `Minimum ${minParts} team participants required for ${evt.title}.`;
            } else if (maxParts && Number(formData.totalParticipants) > maxParts) {
              errs[`totalParts_${evt.id}_${idx}`] = `Maximum ${maxParts} team participants allowed for ${evt.title}.`;
            }
          }
        });
      }

      setErrors(errs);
      return Object.keys(errs).length === 0;
    }

    return true;
  };

  // Next Step Action
  const handleNextStep = () => {
    if (!validateCurrentStep()) {
      scrollToTop();
      return;
    }

    // Step 1 Event Selection -> Lock Chosen Events -> Step 2
    if (wizardStep === 1) {
      if (combo.id === 'celestia-all-access') {
        const majorEvt = EVENTS_DATA.find(e => e.id === allAccessMajorId)!;
        const minorEvt1 = EVENTS_DATA.find(e => e.id === allAccessMinor1Id)!;
        const minorEvt2 = EVENTS_DATA.find(e => e.id === allAccessMinor2Id)!;
        const soloEvt1 = EVENTS_DATA.find(e => e.id === allAccessSolo1Id)!;
        const soloEvt2 = EVENTS_DATA.find(e => e.id === allAccessSolo2Id)!;

        setChosenEvents([majorEvt, minorEvt1, minorEvt2, soloEvt1, soloEvt2]);
      } else if (combo.id === 'power-trio-package') {
        const majorEvt = EVENTS_DATA.find(e => e.id === powerTrioMajorId)!;
        const minorEvt1 = EVENTS_DATA.find(e => e.id === powerTrioMinor1Id)!;
        const minorEvt2 = EVENTS_DATA.find(e => e.id === powerTrioMinor2Id)!;

        setChosenEvents([majorEvt, minorEvt1, minorEvt2]);
      } else if (combo.id === 'spotlight-squad-package') {
        const majorEvt = EVENTS_DATA.find(e => e.id === spotlightMajorId)!;
        const soloEvt1 = EVENTS_DATA.find(e => e.id === spotlightSolo1Id)!;
        const soloEvt2 = EVENTS_DATA.find(e => e.id === spotlightSolo2Id)!;

        setChosenEvents([majorEvt, soloEvt1, soloEvt2]);
      } else if (genericPickedEventIds.length > 0) {
        const pickedList = EVENTS_DATA.filter(e => genericPickedEventIds.includes(e.id));
        setChosenEvents(pickedList);
      }

      setWizardStep(2);
      scrollToTop();
      return;
    }

    // Step 2 Profile -> Save profile -> Step 3 Event Forms
    if (wizardStep === 2) {
      loginUser({
        id: currentUser?.id || `USER-${Date.now()}`,
        fullName,
        email,
        mobile,
        createdAt: currentUser?.createdAt || new Date().toISOString()
      });
      saveCollegeDetails({
        collegeName,
        city,
        state,
        contactPerson: fullName,
        contactMobile: mobile,
        contactEmail: email,
        isCollegeDelegation: false
      });

      setWizardStep(3);
      scrollToTop();
      return;
    }

    // Step 3 -> Step 4 Review
    if (wizardStep === 3) {
      setWizardStep(4);
      scrollToTop();
      return;
    }

    // Step 4 Review -> Step 5 Payment
    if (wizardStep === 4) {
      setWizardStep(5);
      scrollToTop();
      return;
    }
  };

  const handlePrevStep = () => {
    const minStep = requiresEventSelection ? 1 : 2;
    if (wizardStep <= minStep) {
      onCancel();
      return;
    }
    setWizardStep(prev => prev - 1);
    scrollToTop();
  };

  // Payment Screenshot Upload
  const handlePaymentScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPaymentFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPaymentPreviewData(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Final Registration Submission with double-click guard & Supabase recording
  const handleSubmitComboRegistrations = async () => {
    if (isSubmitting) return;

    const stoppedEvt = orderedChosenEvents.find(e => !isEventRegistrationOpen(e.id) || !isEventRegistrationOpen(e.code));
    if (stoppedEvt) {
      setSubmissionError(`Registration for ${stoppedEvt.title} (${stoppedEvt.code}) has been stopped by the Admin. No new entries can be submitted.`);
      scrollToTop();
      return;
    }

    if (!utrNumber.trim() || utrNumber.length < 6) {
      setSubmissionError('Please enter a valid UPI Reference / UTR Number (min 6 digits).');
      scrollToTop();
      return;
    }
    if (!paymentFile && !paymentPreviewData) {
      setSubmissionError('Please upload your payment screenshot proof.');
      scrollToTop();
      return;
    }

    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      const comboBatchId = `COMBO-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      const createdSubmissions: RegistrationSubmission[] = [];

      if (combo.id === 'fashion-royale') {
        const silCount = Number(fashionRoyaleSilhouetteCount) || 7;
        const silEvent = EVENTS_DATA.find(e => e.id === 'silhouette')!;
        const silPayload = {
          selectedEvent: silEvent,
          collegeDetails: { collegeName, city, state, contactPerson: fullName, contactMobile: mobile, contactEmail: email, isCollegeDelegation: false },
          participants: [{ fullName: fashionRoyaleSilhouetteCapName, gender: 'Male' as const, age: '20', mobile: fashionRoyaleSilhouetteCapPhone, email, role: 'Silhouette Captain' }],
          teamName: `${fashionRoyaleSilhouetteCapName}'s Silhouette Team`,
          participantCount: silCount,
          totalFee: pricing.finalFee,
          utrNumber,
          paymentScreenshotName: paymentFile?.name || 'combo-payment.png',
          paymentScreenshotData: paymentPreviewData || undefined,
          paymentScreenshotFile: paymentFile,
          idCardFiles: [primaryIdCardFile || null],
          userId: currentUser?.id || `USER-${Date.now()}`,
          comboGroupId: comboBatchId,
          comboId: combo.id,
          comboName: combo.name,
          comboType: combo.categoryTitle,
          comboDiscountAmount: pricing.discountVal,
          comboEventIndex: 1,
          comboTotalEvents: 4
        };
        const resSil = await supabaseRegistrationService.submitRegistrationToSupabase(silPayload);
        const silCode = resSil.registrationCode;

        createdSubmissions.push({
          id: silCode,
          registrationCode: silCode,
          userId: currentUser?.id || 'user',
          eventId: silEvent.id,
          eventTitle: silEvent.title,
          eventCode: silEvent.code,
          eventCategory: silEvent.categoryDisplay,
          eventType: silEvent.type,
          venue: silEvent.venue,
          dateStr: 'November 3-5, 2026',
          duration: silEvent.duration,
          college: silPayload.collegeDetails,
          teamName: silPayload.teamName,
          participantCount: silCount,
          participants: silPayload.participants,
          feePerUnit: 300,
          feeType: 'per_head',
          totalAmount: pricing.finalFee,
          utrNumber,
          paymentScreenshotName: paymentFile?.name || 'combo-payment.png',
          paymentScreenshotData: paymentPreviewData || undefined,
          paymentConfirmed: false,
          comboGroupId: comboBatchId,
          comboId: combo.id,
          comboName: combo.name,
          comboType: combo.categoryTitle,
          comboDiscountAmount: pricing.discountVal,
          paymentStatus: 'Submitted',
          registrationStatus: 'Submitted',
          createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        });

        // Submit 3 Elaris Entries
        const elarisEvt = EVENTS_DATA.find(e => e.id === 'elaris')!;
        const elarisParticipants = [
          { name: elaris1Name, phone: elaris1Phone },
          { name: elaris2Name, phone: elaris2Phone },
          { name: elaris3Name, phone: elaris3Phone }
        ];

        for (let i = 0; i < elarisParticipants.length; i++) {
          const p = elarisParticipants[i];
          const elarisPayload = {
            selectedEvent: elarisEvt,
            collegeDetails: { collegeName, city, state, contactPerson: fullName, contactMobile: mobile, contactEmail: email, isCollegeDelegation: false },
            participants: [{ fullName: p.name, gender: 'Male' as const, age: '20', mobile: p.phone, email, role: `Elaris Participant #${i + 1}` }],
            teamName: p.name,
            participantCount: 1,
            totalFee: 0, // Bonus Included in Combo
            utrNumber,
            paymentScreenshotName: paymentFile?.name || 'combo-payment.png',
            paymentScreenshotData: paymentPreviewData || undefined,
            paymentScreenshotFile: paymentFile,
            idCardFiles: [primaryIdCardFile || null],
            userId: currentUser?.id || `USER-${Date.now()}`,
            comboGroupId: comboBatchId,
            comboId: combo.id,
            comboName: combo.name,
            comboType: combo.categoryTitle,
            comboDiscountAmount: pricing.discountVal,
            comboEventIndex: i + 2,
            comboTotalEvents: 4
          };
          const resEla = await supabaseRegistrationService.submitRegistrationToSupabase(elarisPayload);
          createdSubmissions.push({
            id: resEla.registrationCode,
            registrationCode: resEla.registrationCode,
            userId: currentUser?.id || 'user',
            eventId: elarisEvt.id,
            eventTitle: elarisEvt.title,
            eventCode: elarisEvt.code,
            eventCategory: elarisEvt.categoryDisplay,
            eventType: elarisEvt.type,
            venue: elarisEvt.venue,
            dateStr: 'November 3-5, 2026',
            duration: elarisEvt.duration,
            college: elarisPayload.collegeDetails,
            teamName: elarisPayload.teamName,
            participantCount: 1,
            participants: elarisPayload.participants,
            feePerUnit: 250,
            feeType: 'per_head',
            totalAmount: 0,
            utrNumber,
            paymentScreenshotName: paymentFile?.name || 'combo-payment.png',
            paymentScreenshotData: paymentPreviewData || undefined,
            paymentConfirmed: false,
            comboGroupId: comboBatchId,
            comboId: combo.id,
            comboName: combo.name,
            comboType: combo.categoryTitle,
            comboDiscountAmount: pricing.discountVal,
            paymentStatus: 'Submitted',
            registrationStatus: 'Submitted',
            createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          });
        }
      } else if (combo.id === 'solo-duo' || combo.id === 'triple-threat-solo') {
        // Solo Duo & Triple Threat: Single participant for all solo events
        for (let idx = 0; idx < orderedChosenEvents.length; idx++) {
          const evt = orderedChosenEvents[idx];
          const payload = {
            selectedEvent: evt,
            collegeDetails: { collegeName, city, state, contactPerson: fullName, contactMobile: mobile, contactEmail: email, isCollegeDelegation: false },
            participants: [{ fullName: soloComboPartName || fullName, gender: 'Male' as const, age: '20', mobile: soloComboPartPhone || mobile, email, role: 'Solo Participant' }],
            teamName: soloComboPartName || fullName,
            participantCount: 1,
            totalFee: idx === 0 ? pricing.finalFee : 0,
            utrNumber,
            paymentScreenshotName: paymentFile?.name || 'combo-payment.png',
            paymentScreenshotData: paymentPreviewData || undefined,
            paymentScreenshotFile: paymentFile,
            idCardFiles: [primaryIdCardFile || null],
            userId: currentUser?.id || `USER-${Date.now()}`,
            comboGroupId: comboBatchId,
            comboId: combo.id,
            comboName: combo.name,
            comboType: combo.categoryTitle,
            comboDiscountAmount: pricing.discountVal,
            comboEventIndex: idx + 1,
            comboTotalEvents: orderedChosenEvents.length
          };
          const res = await supabaseRegistrationService.submitRegistrationToSupabase(payload);
          createdSubmissions.push({
            id: res.registrationCode,
            registrationCode: res.registrationCode,
            userId: currentUser?.id || 'user',
            eventId: evt.id,
            eventTitle: evt.title,
            eventCode: evt.code,
            eventCategory: evt.categoryDisplay,
            eventType: evt.type,
            venue: evt.venue,
            dateStr: 'November 3-5, 2026',
            duration: evt.duration,
            college: payload.collegeDetails,
            teamName: payload.teamName,
            participantCount: 1,
            participants: payload.participants,
            feePerUnit: evt.feeAmount,
            feeType: evt.feeType,
            totalAmount: idx === 0 ? pricing.finalFee : 0,
            utrNumber,
            paymentScreenshotName: paymentFile?.name || 'combo-payment.png',
            paymentScreenshotData: paymentPreviewData || undefined,
            paymentConfirmed: false,
            comboGroupId: comboBatchId,
            comboId: combo.id,
            comboName: combo.name,
            comboType: combo.categoryTitle,
            comboDiscountAmount: pricing.discountVal,
            paymentStatus: 'Submitted',
            registrationStatus: 'Submitted',
            createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          });
        }
      } else {
        // Submit entries for orderedChosenEvents
        for (let idx = 0; idx < orderedChosenEvents.length; idx++) {
          const evt = orderedChosenEvents[idx];
          const formData = eventFormDataMap[`${evt.id}_${idx}`] || {
            captainName: idx === 0 ? fullName : '',
            captainPhone: idx === 0 ? mobile : '',
            totalParticipants: evt.minParticipants || 1
          };

          const rawCount = formData.totalParticipants;
          const count = (rawCount !== undefined && rawCount !== '') ? Number(rawCount) : (evt.minParticipants || 1);

          const isMultiTeamCombo = combo.id === 'double-impact-minor' || combo.id === 'campus-clash-major' || combo.id === 'triple-takeover-minor' || combo.id === 'campus-domination-major';
          const calculatedTeamName = isMultiTeamCombo
            ? `${formData.captainName || fullName} (Team ${idx + 1} - ${evt.title})`
            : (formData.captainName ? `${formData.captainName}'s ${evt.title} Entry` : evt.title);

          const payload = {
            selectedEvent: evt,
            collegeDetails: { collegeName, city, state, contactPerson: fullName, contactMobile: mobile, contactEmail: email, isCollegeDelegation: false },
            participants: [{ fullName: formData.captainName || fullName, gender: 'Male' as const, age: '20', mobile: formData.captainPhone || mobile, email, role: evt.type === 'Solo' ? 'Solo Participant' : 'Team Captain' }],
            teamName: calculatedTeamName,
            participantCount: count,
            totalFee: idx === 0 ? pricing.finalFee : 0,
            utrNumber,
            paymentScreenshotName: paymentFile?.name || 'combo-payment.png',
            paymentScreenshotData: paymentPreviewData || undefined,
            paymentScreenshotFile: paymentFile,
            idCardFiles: [primaryIdCardFile || null],
            userId: currentUser?.id || `USER-${Date.now()}`,
            comboGroupId: comboBatchId,
            comboId: combo.id,
            comboName: combo.name,
            comboType: combo.categoryTitle,
            comboDiscountAmount: pricing.discountVal,
            comboEventIndex: idx + 1,
            comboTotalEvents: orderedChosenEvents.length
          };

          const res = await supabaseRegistrationService.submitRegistrationToSupabase(payload);
          createdSubmissions.push({
            id: res.registrationCode,
            registrationCode: res.registrationCode,
            userId: currentUser?.id || 'user',
            eventId: evt.id,
            eventTitle: evt.title,
            eventCode: evt.code,
            eventCategory: evt.categoryDisplay,
            eventType: evt.type,
            venue: evt.venue,
            dateStr: 'November 3-5, 2026',
            duration: evt.duration,
            college: payload.collegeDetails,
            teamName: payload.teamName,
            participantCount: count,
            participants: payload.participants,
            feePerUnit: evt.feeAmount,
            feeType: evt.feeType,
            totalAmount: idx === 0 ? pricing.finalFee : 0,
            utrNumber,
            paymentScreenshotName: paymentFile?.name || 'combo-payment.png',
            paymentScreenshotData: paymentPreviewData || undefined,
            paymentConfirmed: false,
            comboGroupId: comboBatchId,
            comboId: combo.id,
            comboName: combo.name,
            comboType: combo.categoryTitle,
            comboDiscountAmount: pricing.discountVal,
            paymentStatus: 'Submitted',
            registrationStatus: 'Submitted',
            createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          });
        }
      }

      // Add to local state so participant sees all combo registrations in My Registrations immediately
      if (createdSubmissions.length > 0 && addCompletedRegistrations) {
        addCompletedRegistrations(createdSubmissions);
      }

      setIsSuccess(true);
      setIsSubmitting(false);
      scrollToTop();
    } catch (err: any) {
      console.error('Error submitting combo registration:', err);
      setSubmissionError(err.message || 'Failed to submit registration. Please try again.');
      setIsSubmitting(false);
      scrollToTop();
    }
  };



  // RENDER STEP 1: EVENT SELECTION (IF APPLICABLE)
  const renderStep1EventSelection = () => {
    if (combo.id === 'celestia-all-access') {
      const majorEventsList = EVENTS_DATA.filter(e => getEventComboType(e) === 'major');
      const minorEventsList = EVENTS_DATA.filter(e => getEventComboType(e) === 'minor');
      const soloEventsList = EVENTS_DATA.filter(e => getEventComboType(e) === 'solo');

      return (
        <div className="space-y-6">
          <div className="bg-slate-900/90 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-6">
            <h3 className="text-xl font-extrabold text-white pb-3 border-b border-slate-800 flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-400" />
              <span>Step 2: Select Events for Celestia All Access Package</span>
            </h3>

            {/* 1. SELECT ONE MAJOR EVENT */}
            <div className="space-y-3">
              <label className="block text-sm font-bold text-amber-300">
                1. Which Major Event are you participating in? (Select 1) *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {majorEventsList.map(evt => (
                  <button
                    key={evt.id}
                    type="button"
                    onClick={() => setAllAccessMajorId(evt.id)}
                    className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                      allAccessMajorId === evt.id
                        ? 'bg-amber-950/60 border-amber-500 text-white shadow-lg'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-[10px] font-bold uppercase text-amber-400 block mb-1">Major Event</span>
                    <h5 className="font-bold text-sm text-white">{evt.title}</h5>
                    <span className="text-xs text-slate-400 block mt-0.5">{evt.categoryDisplay}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. SELECT TWO MINOR EVENTS (Duplicates Allowed) */}
            <div className="space-y-3 pt-4 border-t border-slate-800">
              <label className="block text-sm font-bold text-amber-300">
                2. Choose your two Minor Events (You can choose the same event twice for 2 different teams) *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-300 mb-1 font-semibold">Minor Event 1 *</label>
                  <select
                    value={allAccessMinor1Id}
                    onChange={e => setAllAccessMinor1Id(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:border-amber-500 focus:outline-none"
                  >
                    {minorEventsList.map(e => (
                      <option key={e.id} value={e.id}>{e.title} ({e.categoryDisplay})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1 font-semibold">Minor Event 2 *</label>
                  <select
                    value={allAccessMinor2Id}
                    onChange={e => setAllAccessMinor2Id(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:border-amber-500 focus:outline-none"
                  >
                    {minorEventsList.map(e => (
                      <option key={e.id} value={e.id}>{e.title} ({e.categoryDisplay})</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* 3. SELECT TWO SOLO EVENTS (Duplicates Allowed) */}
            <div className="space-y-3 pt-4 border-t border-slate-800">
              <label className="block text-sm font-bold text-amber-300">
                3. Choose your two Solo Events (You can choose the same event twice for 2 different solo entries) *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-300 mb-1 font-semibold">Solo Event 1 *</label>
                  <select
                    value={allAccessSolo1Id}
                    onChange={e => setAllAccessSolo1Id(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:border-amber-500 focus:outline-none"
                  >
                    {soloEventsList.map(e => (
                      <option key={e.id} value={e.id}>{e.title} ({e.categoryDisplay})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1 font-semibold">Solo Event 2 *</label>
                  <select
                    value={allAccessSolo2Id}
                    onChange={e => setAllAccessSolo2Id(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:border-amber-500 focus:outline-none"
                  >
                    {soloEventsList.map(e => (
                      <option key={e.id} value={e.id}>{e.title} ({e.categoryDisplay})</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (combo.id === 'power-trio-package') {
      const majorEventsList = EVENTS_DATA.filter(e => getEventComboType(e) === 'major');
      const minorEventsList = EVENTS_DATA.filter(e => getEventComboType(e) === 'minor');

      return (
        <div className="space-y-6">
          <div className="bg-slate-900/90 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-6">
            <h3 className="text-xl font-extrabold text-white pb-3 border-b border-slate-800 flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-400" />
              <span>Step 1: Select Events for Power Trio Package (1 Major + 2 Minor)</span>
            </h3>

            {/* 1. SELECT ONE MAJOR EVENT */}
            <div className="space-y-3">
              <label className="block text-sm font-bold text-amber-300">
                1. Which Major Event are you participating in? (Select 1) *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {majorEventsList.map(evt => (
                  <button
                    key={evt.id}
                    type="button"
                    onClick={() => setPowerTrioMajorId(evt.id)}
                    className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                      powerTrioMajorId === evt.id
                        ? 'bg-amber-950/60 border-amber-500 text-white shadow-lg'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-[10px] font-bold uppercase text-amber-400 block mb-1">Major Event</span>
                    <h5 className="font-bold text-sm text-white">{evt.title}</h5>
                    <span className="text-xs text-slate-400 block mt-0.5">{evt.categoryDisplay}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. SELECT TWO MINOR EVENTS (Dropdowns) */}
            <div className="space-y-3 pt-4 border-t border-slate-800">
              <label className="block text-sm font-bold text-amber-300">
                2. Choose your two Minor Events (You can choose the same event twice for 2 different teams) *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-300 mb-1 font-semibold">Minor Event 1 *</label>
                  <select
                    value={powerTrioMinor1Id}
                    onChange={e => setPowerTrioMinor1Id(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:border-amber-500 focus:outline-none"
                  >
                    {minorEventsList.map(e => (
                      <option key={e.id} value={e.id}>{e.title} ({e.categoryDisplay})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1 font-semibold">Minor Event 2 *</label>
                  <select
                    value={powerTrioMinor2Id}
                    onChange={e => setPowerTrioMinor2Id(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:border-amber-500 focus:outline-none"
                  >
                    {minorEventsList.map(e => (
                      <option key={e.id} value={e.id}>{e.title} ({e.categoryDisplay})</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (combo.id === 'spotlight-squad-package') {
      const majorEventsList = EVENTS_DATA.filter(e => getEventComboType(e) === 'major');
      const soloEventsList = EVENTS_DATA.filter(e => getEventComboType(e) === 'solo');

      return (
        <div className="space-y-6">
          <div className="bg-slate-900/90 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-6">
            <h3 className="text-xl font-extrabold text-white pb-3 border-b border-slate-800 flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-400" />
              <span>Step 1: Select Events for Spotlight Squad Package (1 Major + 2 Solo)</span>
            </h3>

            {/* 1. SELECT ONE MAJOR EVENT */}
            <div className="space-y-3">
              <label className="block text-sm font-bold text-amber-300">
                1. Which Major Event are you participating in? (Select 1) *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {majorEventsList.map(evt => (
                  <button
                    key={evt.id}
                    type="button"
                    onClick={() => setSpotlightMajorId(evt.id)}
                    className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                      spotlightMajorId === evt.id
                        ? 'bg-amber-950/60 border-amber-500 text-white shadow-lg'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-[10px] font-bold uppercase text-amber-400 block mb-1">Major Event</span>
                    <h5 className="font-bold text-sm text-white">{evt.title}</h5>
                    <span className="text-xs text-slate-400 block mt-0.5">{evt.categoryDisplay}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. SELECT TWO SOLO EVENTS (Dropdowns) */}
            <div className="space-y-3 pt-4 border-t border-slate-800">
              <label className="block text-sm font-bold text-amber-300">
                2. Choose your two Solo Events (You can choose the same event twice for 2 different solo entries) *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-300 mb-1 font-semibold">Solo Event 1 *</label>
                  <select
                    value={spotlightSolo1Id}
                    onChange={e => setSpotlightSolo1Id(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:border-amber-500 focus:outline-none"
                  >
                    {soloEventsList.map(e => (
                      <option key={e.id} value={e.id}>{e.title} ({e.categoryDisplay})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1 font-semibold">Solo Event 2 *</label>
                  <select
                    value={spotlightSolo2Id}
                    onChange={e => setSpotlightSolo2Id(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:border-amber-500 focus:outline-none"
                  >
                    {soloEventsList.map(e => (
                      <option key={e.id} value={e.id}>{e.title} ({e.categoryDisplay})</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Generic Event Selector for other packages
    const eligibleList = combo.eligibleEventIds
      ? EVENTS_DATA.filter(e => combo.eligibleEventIds?.includes(e.id))
      : EVENTS_DATA;

    const reqCount = combo.minEventsToSelect || combo.maxEventsToSelect || 1;

    return (
      <div className="space-y-6">
        <div className="bg-slate-900/90 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
          <h3 className="text-xl font-extrabold text-white pb-3 border-b border-slate-800">
            Select {reqCount} Event(s) for {combo.name}
          </h3>

          <p className="text-xs text-slate-300">
            Choose exactly {reqCount} event(s) from the list below to build your combo package.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {eligibleList.map(evt => {
              const isSelected = genericPickedEventIds.includes(evt.id);
              return (
                <div
                  key={evt.id}
                  onClick={() => {
                    if (isSelected) {
                      setGenericPickedEventIds(prev => prev.filter(id => id !== evt.id));
                    } else {
                      if (genericPickedEventIds.length >= reqCount) {
                        if (reqCount === 1) {
                          setGenericPickedEventIds([evt.id]);
                        } else {
                          alert(`You can select a maximum of ${reqCount} events.`);
                        }
                      } else {
                        setGenericPickedEventIds(prev => [...prev, evt.id]);
                      }
                    }
                  }}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    isSelected ? 'bg-amber-950/60 border-amber-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <span className="text-[10px] uppercase font-bold text-amber-400 block">{evt.type}</span>
                    <h5 className="font-bold text-sm text-white">{evt.title}</h5>
                    <span className="text-xs text-slate-400">{evt.categoryDisplay}</span>
                  </div>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isSelected ? 'bg-amber-500 border-amber-500 text-slate-950' : 'border-slate-700'}`}>
                    {isSelected && <Check className="w-3.5 h-3.5 font-bold" />}
                  </div>
                </div>
              );
            })}
          </div>
          {errors.genericEvents && <p className="text-xs text-rose-400">{errors.genericEvents}</p>}
        </div>
      </div>
    );
  };

  // RENDER STEP 2: PRIMARY REGISTERING PERSON & STUDENT ID CARD
  const renderStep2PrimaryProfile = () => (
    <div className="space-y-6">
      <div className="bg-slate-900/90 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
        <h3 className="text-lg font-extrabold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
          <User className="w-5 h-5 text-amber-400" />
          <span>Primary Registering Person Details</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Full Legal Name *</label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="e.g. Ananya Ramesh"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:border-amber-500 focus:outline-none"
            />
            {errors.fullName && <p className="text-xs text-rose-400 mt-1">{errors.fullName}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Email Address *</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="student@college.edu"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:border-amber-500 focus:outline-none"
            />
            {errors.email && <p className="text-xs text-rose-400 mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Mobile / WhatsApp Number *</label>
            <input
              type="tel"
              value={mobile}
              onChange={e => setMobile(e.target.value)}
              placeholder="10-digit mobile number"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:border-amber-500 focus:outline-none"
            />
            {errors.mobile && <p className="text-xs text-rose-400 mt-1">{errors.mobile}</p>}
          </div>
        </div>
      </div>

      <div className="bg-slate-900/90 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
        <h3 className="text-lg font-extrabold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
          <Building2 className="w-5 h-5 text-amber-400" />
          <span>College / Institution Details</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-300 mb-1">College Name *</label>
            <input
              type="text"
              value={collegeName}
              onChange={e => setCollegeName(e.target.value)}
              placeholder="Full name of your college or university"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:border-amber-500 focus:outline-none"
            />
            {errors.collegeName && <p className="text-xs text-rose-400 mt-1">{errors.collegeName}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">City *</label>
            <input
              type="text"
              value={city}
              onChange={e => setCity(e.target.value)}
              placeholder="e.g. Trichy / Chennai"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:border-amber-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Primary Student College ID Card Upload (Only ID Card required for the whole combo) */}
      <div className="bg-slate-900/90 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-3">
        <label className="block text-xs font-bold text-slate-200 flex items-center justify-between">
          <span>Primary Registering Student ID Card Photo *</span>
          <span className="text-[10px] text-amber-400 font-mono uppercase bg-amber-950 px-2 py-0.5 rounded border border-amber-500/30">
            Mandatory Once
          </span>
        </label>
        <p className="text-xs text-slate-400">
          Upload your physical student ID card photo or Bonafide certificate. As specified, <strong>only the ID card of the registering person is required</strong> for the entire combo!
        </p>

        {primaryIdCardFileName ? (
          <div className="p-3.5 rounded-xl bg-slate-950 border border-amber-500/40 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <FileText className="w-5 h-5 text-amber-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate max-w-xs sm:max-w-md">
                  {primaryIdCardFileName}
                </p>
                <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Student ID Card Photo Attached
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <label className="py-1 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 cursor-pointer transition-colors">
                Replace
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handlePrimaryIdCardUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        ) : (
          <div>
            <label className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-slate-700 hover:border-amber-500/60 rounded-2xl bg-slate-950 hover:bg-slate-900/60 transition-all cursor-pointer group">
              <Upload className="w-6 h-6 text-slate-400 group-hover:text-amber-400 mb-1.5 transition-colors" />
              <span className="text-xs font-bold text-slate-200 group-hover:text-white">
                Click to upload Student ID Card Photo
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5">
                JPG, PNG, or PDF up to 5MB
              </span>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={handlePrimaryIdCardUpload}
                className="hidden"
              />
            </label>
            {errors.primaryIdCard && (
              <p className="text-xs text-rose-400 mt-1.5 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {errors.primaryIdCard}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );

  // RENDER STEP 3: DYNAMIC EVENT FORMS (SPECIFIC PER COMBO)
  const renderStep3EventForms = () => {
    // 1. Fashion Royale Specific Flow
    if (combo.id === 'fashion-royale') {
      return (
        <div className="space-y-6">
          {/* Section A: Silhouette Registration */}
          <div className="bg-slate-900/90 p-6 rounded-2xl border border-amber-500/40 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-950 px-3 py-1 rounded-full border border-amber-500/30">
                Event 1: Silhouette Fashion Parade (Team Event)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Silhouette Captain Full Name *</label>
                <input
                  type="text"
                  value={fashionRoyaleSilhouetteCapName}
                  onChange={e => setFashionRoyaleSilhouetteCapName(e.target.value)}
                  placeholder="Captain Full Name"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:border-amber-500 focus:outline-none"
                />
                {errors.silCapName && <p className="text-xs text-rose-400 mt-1">{errors.silCapName}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Silhouette Captain Phone Number *</label>
                <input
                  type="tel"
                  value={fashionRoyaleSilhouetteCapPhone}
                  onChange={e => setFashionRoyaleSilhouetteCapPhone(e.target.value)}
                  placeholder="10-digit mobile number"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:border-amber-500 focus:outline-none"
                />
                {errors.silCapPhone && <p className="text-xs text-rose-400 mt-1">{errors.silCapPhone}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Total Number of Participants in Silhouette (Min 7 – Max 10, Captain Included) *
                </label>
                <input
                  type="number"
                  min={7}
                  max={10}
                  value={fashionRoyaleSilhouetteCount}
                  onChange={e => {
                    const raw = e.target.value;
                    if (raw === '') {
                      setFashionRoyaleSilhouetteCount('');
                    } else {
                      const parsed = parseInt(raw, 10);
                      setFashionRoyaleSilhouetteCount(isNaN(parsed) ? '' : parsed);
                    }
                  }}
                  onBlur={() => {
                    if (fashionRoyaleSilhouetteCount === '' || Number(fashionRoyaleSilhouetteCount) < 7) {
                      setFashionRoyaleSilhouetteCount(7);
                    } else if (Number(fashionRoyaleSilhouetteCount) > 10) {
                      setFashionRoyaleSilhouetteCount(10);
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:border-amber-500 focus:outline-none"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Note: Fee is ₹300 per head (Total = Number of participants × ₹300). Only captain details and total count are required for Silhouette team entries!
                </p>
                {errors.silCount && <p className="text-xs text-rose-400 mt-1">{errors.silCount}</p>}
              </div>
            </div>
          </div>

          {/* Section B: Elaris Registration (3 Participants) */}
          <div className="bg-slate-900/90 p-6 rounded-2xl border border-amber-500/40 shadow-xl space-y-6">
            <div className="pb-3 border-b border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-950 px-3 py-1 rounded-full border border-amber-500/30">
                Event 2: Elaris Fashion Walk (3 Solo Entries Included)
              </span>
              <p className="text-xs text-slate-300 mt-1">Enter details for 3 individual Elaris participants below:</p>
            </div>

            {/* Elaris Participant 1 */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <h5 className="text-xs font-bold text-amber-400 uppercase tracking-wider">Elaris Participant 1</h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={elaris1Name}
                    onChange={e => setElaris1Name(e.target.value)}
                    placeholder="Participant 1 Name"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-white text-sm"
                  />
                  {errors.elaris1Name && <p className="text-xs text-rose-400 mt-1">{errors.elaris1Name}</p>}
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    value={elaris1Phone}
                    onChange={e => setElaris1Phone(e.target.value)}
                    placeholder="10-digit mobile"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-white text-sm"
                  />
                  {errors.elaris1Phone && <p className="text-xs text-rose-400 mt-1">{errors.elaris1Phone}</p>}
                </div>
              </div>
            </div>

            {/* Elaris Participant 2 */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <h5 className="text-xs font-bold text-amber-400 uppercase tracking-wider">Elaris Participant 2</h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={elaris2Name}
                    onChange={e => setElaris2Name(e.target.value)}
                    placeholder="Participant 2 Name"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-white text-sm"
                  />
                  {errors.elaris2Name && <p className="text-xs text-rose-400 mt-1">{errors.elaris2Name}</p>}
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    value={elaris2Phone}
                    onChange={e => setElaris2Phone(e.target.value)}
                    placeholder="10-digit mobile"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-white text-sm"
                  />
                  {errors.elaris2Phone && <p className="text-xs text-rose-400 mt-1">{errors.elaris2Phone}</p>}
                </div>
              </div>
            </div>

            {/* Elaris Participant 3 */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <h5 className="text-xs font-bold text-amber-400 uppercase tracking-wider">Elaris Participant 3</h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={elaris3Name}
                    onChange={e => setElaris3Name(e.target.value)}
                    placeholder="Participant 3 Name"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-white text-sm"
                  />
                  {errors.elaris3Name && <p className="text-xs text-rose-400 mt-1">{errors.elaris3Name}</p>}
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    value={elaris3Phone}
                    onChange={e => setElaris3Phone(e.target.value)}
                    placeholder="10-digit mobile"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-white text-sm"
                  />
                  {errors.elaris3Phone && <p className="text-xs text-rose-400 mt-1">{errors.elaris3Phone}</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // 2. Solo Duo & Triple Threat Solo: Single participant for all selected solo events
    if (combo.id === 'solo-duo' || combo.id === 'triple-threat-solo') {
      return (
        <div className="space-y-6">
          <div className="bg-slate-900/90 p-6 rounded-2xl border border-amber-500/40 shadow-xl space-y-5">
            <div className="pb-3 border-b border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-950 px-3 py-1 rounded-full border border-amber-500/30">
                Single Solo Participant Confirmation
              </span>
              <h4 className="text-xl font-bold text-white mt-2">
                Participant Details for All Selected Solo Events
              </h4>
              <p className="text-xs text-slate-300 mt-1">
                Under the <strong>{combo.name}</strong> combo offer rules, a single participant is registered across all {orderedChosenEvents.length} selected solo events. We collect your details once and apply them automatically to every stage!
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Participant Full Legal Name *</label>
                <input
                  type="text"
                  value={soloComboPartName}
                  onChange={e => setSoloComboPartName(e.target.value)}
                  placeholder="Full Name"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:border-amber-500 focus:outline-none"
                />
                {errors.soloPartName && <p className="text-xs text-rose-400 mt-1">{errors.soloPartName}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Participant Mobile / WhatsApp *</label>
                <input
                  type="tel"
                  value={soloComboPartPhone}
                  onChange={e => setSoloComboPartPhone(e.target.value)}
                  placeholder="10-digit mobile"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:border-amber-500 focus:outline-none"
                />
                {errors.soloPartPhone && <p className="text-xs text-rose-400 mt-1">{errors.soloPartPhone}</p>}
              </div>
            </div>

            {/* Selected Events Breakdown for this participant */}
            <div className="mt-4 pt-4 border-t border-slate-800 space-y-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                Assigned Events for {soloComboPartName || fullName || 'Participant'}:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {orderedChosenEvents.map((evt, idx) => (
                  <div key={evt.id} className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-amber-400 block">Solo Event {idx + 1}</span>
                      <h5 className="font-bold text-sm text-white">{evt.title}</h5>
                      <span className="text-xs text-slate-400">{evt.categoryDisplay}</span>
                    </div>
                    <span className="text-xs text-emerald-400 font-semibold bg-emerald-950 px-2.5 py-1 rounded-md border border-emerald-500/30">
                      Enrolled
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // 3. Celestia All Access, Power Trio, Spotlight Squad & General Event Forms Flow
    return (
      <div className="space-y-6">
        {orderedChosenEvents.map((evt, idx) => {
          const key = `${evt.id}_${idx}`;
          const currentData = eventFormDataMap[key] || {
            captainName: idx === 0 ? fullName : '',
            captainPhone: idx === 0 ? mobile : '',
            totalParticipants: evt.minParticipants || 1
          };

          const isTeam = evt.type === 'Team';
          const isMultiTeamCombo = combo.id === 'double-impact-minor' || combo.id === 'campus-clash-major' || combo.id === 'triple-takeover-minor' || combo.id === 'campus-domination-major';

          return (
            <div key={key} className="bg-slate-900/90 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-950 px-3 py-1 rounded-full border border-amber-500/30">
                  {isMultiTeamCombo 
                    ? `Team ${idx + 1}: ${evt.title} (${evt.categoryDisplay} • ${evt.type})` 
                    : `${idx + 1}. ${evt.title} (${evt.categoryDisplay} • ${evt.type})`}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    {isMultiTeamCombo 
                      ? `Team ${idx + 1} Captain Full Name *` 
                      : (evt.type === 'Solo' ? 'Participant Full Name *' : 'Captain Full Name *')}
                  </label>
                  <input
                    type="text"
                    value={currentData.captainName}
                    onChange={e => {
                      const val = e.target.value;
                      setEventFormDataMap(prev => ({
                        ...prev,
                        [key]: { ...currentData, captainName: val }
                      }));
                    }}
                    placeholder={`Team ${idx + 1} Captain Name`}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:border-amber-500 focus:outline-none"
                  />
                  {errors[`capName_${evt.id}_${idx}`] && (
                    <p className="text-xs text-rose-400 mt-1">{errors[`capName_${evt.id}_${idx}`]}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    {isMultiTeamCombo 
                      ? `Team ${idx + 1} Captain Phone Number *` 
                      : 'Phone Number *'}
                  </label>
                  <input
                    type="tel"
                    value={currentData.captainPhone}
                    onChange={e => {
                      const val = e.target.value;
                      setEventFormDataMap(prev => ({
                        ...prev,
                        [key]: { ...currentData, captainPhone: val }
                      }));
                    }}
                    placeholder="10-digit mobile number"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:border-amber-500 focus:outline-none"
                  />
                  {errors[`capPhone_${evt.id}_${idx}`] && (
                    <p className="text-xs text-rose-400 mt-1">{errors[`capPhone_${evt.id}_${idx}`]}</p>
                  )}
                </div>

                {isTeam && (
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Total Number of Participants in {evt.title} (Captain Included, Min {evt.minParticipants || 1}) *
                    </label>
                    <input
                      type="number"
                      min={evt.minParticipants || 1}
                      max={evt.maxParticipants || 30}
                      value={currentData.totalParticipants !== undefined ? currentData.totalParticipants : (evt.minParticipants || 1)}
                      onChange={e => {
                        const raw = e.target.value;
                        if (raw === '') {
                          setEventFormDataMap(prev => ({
                            ...prev,
                            [key]: { ...currentData, totalParticipants: '' }
                          }));
                        } else {
                          const parsed = parseInt(raw, 10);
                          setEventFormDataMap(prev => ({
                            ...prev,
                            [key]: { ...currentData, totalParticipants: isNaN(parsed) ? '' : parsed }
                          }));
                        }
                      }}
                      onBlur={() => {
                        const val = currentData.totalParticipants;
                        const min = evt.minParticipants || 1;
                        const max = evt.maxParticipants || 30;
                        if (val === '' || val === undefined || Number(val) < min) {
                          setEventFormDataMap(prev => ({
                            ...prev,
                            [key]: { ...currentData, totalParticipants: min }
                          }));
                        } else if (Number(val) > max) {
                          setEventFormDataMap(prev => ({
                            ...prev,
                            [key]: { ...currentData, totalParticipants: max }
                          }));
                        }
                      }}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:border-amber-500 focus:outline-none"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      {evt.feeType === 'per_head' 
                        ? `Fee: ₹${evt.feeAmount} per head (Total event cost = Number of participants × ₹${evt.feeAmount})`
                        : `Fee: Fixed ₹${evt.feeAmount} per team (regardless of number of participants)`}
                    </p>
                    {errors[`totalParts_${evt.id}_${idx}`] && (
                      <p className="text-xs text-rose-400 mt-1">{errors[`totalParts_${evt.id}_${idx}`]}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // RENDER STEP 4: REVIEW & VERIFICATION
  const renderStep4Review = () => (
    <div className="space-y-6">
      <div className="bg-slate-900/90 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Tag className="w-5 h-5 text-amber-400" />
            <span>Review & Verify Registration Summary</span>
          </h3>
          <button
            type="button"
            onClick={() => setWizardStep(3)}
            className="text-xs font-bold text-amber-400 hover:text-amber-300 bg-amber-950 px-3 py-1.5 rounded-lg border border-amber-500/30 cursor-pointer"
          >
            Edit Details
          </button>
        </div>

        {/* Primary Person Profile */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs text-slate-300">
          <h4 className="font-extrabold text-amber-400 uppercase text-[11px]">Primary Registering Person</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            <p><strong>Name:</strong> {fullName}</p>
            <p><strong>Phone:</strong> {mobile}</p>
            <p><strong>Email:</strong> {email}</p>
            <p><strong>College:</strong> {collegeName} ({city})</p>
            {primaryIdCardFileName && (
              <p className="col-span-full text-emerald-400 flex items-center gap-1 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> ID Card Photo Attached: {primaryIdCardFileName}
              </p>
            )}
          </div>
        </div>

        {/* Selected Events Breakdown */}
        <div className="space-y-3">
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Registered Events & Participants:</span>
          {combo.id === 'fashion-royale' ? (
            <div className="space-y-3">
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-200 space-y-1">
                <div className="flex justify-between items-center">
                  <p className="font-bold text-amber-400 text-sm">1. Silhouette Fashion Parade (Team Event)</p>
                  <span className="text-slate-200 font-bold">
                    ₹{((Number(fashionRoyaleSilhouetteCount) || 7) * 300).toLocaleString()}
                    <span className="text-[10px] text-slate-400 font-normal ml-1">
                      ({fashionRoyaleSilhouetteCount || 7} × ₹300)
                    </span>
                  </span>
                </div>
                <p><strong>Captain:</strong> {fashionRoyaleSilhouetteCapName} ({fashionRoyaleSilhouetteCapPhone})</p>
                <p>
                  Total Participants in Silhouette: <strong>{fashionRoyaleSilhouetteCount || 7}</strong>{' '}
                  <span className="text-slate-400 text-[11px]">(₹300 per head)</span>
                </p>
              </div>
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-200 space-y-1">
                <div className="flex justify-between items-center">
                  <p className="font-bold text-amber-400 text-sm">2. Elaris Fashion Walk (3 Solo Entries Included)</p>
                  <span className="text-slate-200 font-bold">
                    ₹750
                    <span className="text-[10px] text-slate-400 font-normal ml-1">(3 × ₹250)</span>
                  </span>
                </div>
                <p>• Participant 1: {elaris1Name} ({elaris1Phone}) — ₹250</p>
                <p>• Participant 2: {elaris2Name} ({elaris2Phone}) — ₹250</p>
                <p>• Participant 3: {elaris3Name} ({elaris3Phone}) — ₹250</p>
              </div>
            </div>
          ) : combo.id === 'solo-duo' || combo.id === 'triple-threat-solo' ? (
            <div className="space-y-3">
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-200 space-y-2">
                <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                  <span className="font-bold text-amber-400 text-sm">
                    Participant: {soloComboPartName || fullName}
                  </span>
                  <span className="text-slate-400 font-mono">
                    {soloComboPartPhone || mobile}
                  </span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  Single participant registered across all {orderedChosenEvents.length} selected solo events:
                </p>
                <div className="space-y-1.5 pt-1">
                  {orderedChosenEvents.map((evt, idx) => (
                    <div key={evt.id} className="flex justify-between items-center py-1 border-b border-slate-900 text-slate-300">
                      <span>• Event {idx + 1}: <strong>{evt.title}</strong> ({evt.categoryDisplay})</span>
                      <span className="text-slate-200 font-medium">₹{evt.feeAmount}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            orderedChosenEvents.map((evt, idx) => {
              const formData = eventFormDataMap[`${evt.id}_${idx}`] || {
                captainName: idx === 0 ? fullName : '',
                captainPhone: idx === 0 ? mobile : '',
                totalParticipants: evt.minParticipants || 1
              };

              const rawCount = formData.totalParticipants;
              const count = (rawCount !== undefined && rawCount !== '') ? Number(rawCount) : (evt.minParticipants || 1);
              const eventOriginalCost = getEventOriginalCost(evt, idx);
              const isPerHeadTeam = evt.feeType === 'per_head' && evt.type === 'Team';

              return (
                <div key={`${evt.id}_${idx}`} className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-200 space-y-1">
                  <div className="flex justify-between font-bold text-amber-400 text-sm">
                    <span>{idx + 1}. {evt.title} ({evt.categoryDisplay})</span>
                    <span className="text-slate-200 font-bold">
                      ₹{eventOriginalCost.toLocaleString()}
                      {isPerHeadTeam && (
                        <span className="text-[10px] text-slate-400 font-normal ml-1">
                          ({count} × ₹{evt.feeAmount})
                        </span>
                      )}
                    </span>
                  </div>
                  <p><strong>{evt.type === 'Solo' ? 'Participant' : 'Captain'}:</strong> {formData.captainName || fullName} ({formData.captainPhone || mobile})</p>
                  {evt.type === 'Team' && (
                    <p>
                      Total Participants: <strong>{count}</strong>{' '}
                      <span className="text-slate-400 text-[11px]">
                        ({evt.feeType === 'per_head' ? `₹${evt.feeAmount} per head` : `₹${evt.feeAmount} per team`})
                      </span>
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Price Breakdown */}
        <div className="border-t border-slate-800 pt-4 space-y-2">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Original Total Value:</span>
            <span className="line-through">₹{pricing.originalTotal}</span>
          </div>
          {pricing.discountVal > 0 && (
            <div className="flex justify-between text-xs font-bold text-emerald-400">
              <span>Combo Package Discount:</span>
              <span>- ₹{pricing.discountVal}</span>
            </div>
          )}
          <div className="flex justify-between text-xl font-extrabold text-amber-400 pt-3 border-t border-slate-800">
            <span>Final Payable Amount:</span>
            <span>₹{pricing.finalFee.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );

  // RENDER STEP 5: PAYMENT GATEWAY
  const renderStep5Payment = () => (
    <div className="space-y-6">
      <div className="bg-slate-900/90 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-6">
        <div className="text-center">
          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider bg-amber-950 px-3 py-1 rounded-full border border-amber-500/30">
            Final Step: Remittance Gateway
          </span>
          <h3 className="text-2xl font-extrabold text-white mt-2">
            {pricing.isAdvancePayment ? `Pay Advance Amount ₹${pricing.finalFee.toLocaleString()}` : `Scan & Pay ₹${pricing.finalFee.toLocaleString()}`}
          </h3>
          <p className="text-xs text-slate-300 mt-1">
            Official UPI ID: <span className="text-amber-300 font-mono font-bold">{FESTIVAL_METADATA.paymentUpiIdPlaceholder}</span>
          </p>
        </div>

        {/* COMBO PROMO CODE INPUT CARD */}
        <div className="max-w-md mx-auto p-4 rounded-xl bg-slate-950 border border-amber-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-300 flex items-center gap-1.5 font-mono">
              <Tag className="w-3.5 h-3.5 text-amber-400" />
              <span>Have a Combo Promo Code or Advance Payment Code?</span>
            </span>
            {comboAppliedPromo && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                {comboAppliedPromo.isAdvancePayment ? `ADVANCE ₹${comboAppliedPromo.advanceAmount}` : `${comboAppliedPromo.discountPercent}% OFF`}
              </span>
            )}
          </div>

          {comboAppliedPromo ? (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <span className="font-bold text-emerald-300 font-mono">{comboAppliedPromo.code}</span>
                  <span className="text-slate-300 block text-[11px]">
                    {comboAppliedPromo.isAdvancePayment
                      ? `Advance Pay ₹${comboAppliedPromo.advanceAmount}. Remaining balance ₹${pricing.remainingBalance?.toLocaleString()} due on arrival.`
                      : `${comboAppliedPromo.description || `${comboAppliedPromo.discountPercent}% OFF`}`}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRemoveComboPromo}
                className="px-2.5 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-[11px] font-semibold transition-colors cursor-pointer shrink-0"
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={comboPromoInput}
                onChange={(e) => setComboPromoInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleApplyComboPromo();
                  }
                }}
                placeholder="e.g. AP750, SMCHSPECIAL15"
                className="flex-1 px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-700 focus:border-amber-400 text-xs font-mono text-white placeholder-slate-500 focus:outline-none uppercase"
              />
              <button
                type="button"
                onClick={handleApplyComboPromo}
                disabled={isValidatingComboPromo || !comboPromoInput.trim()}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#F5E7C4] to-[#D4AF37] hover:brightness-110 text-[#050714] font-bold text-xs transition-all disabled:opacity-50 cursor-pointer shrink-0"
              >
                {isValidatingComboPromo ? 'Checking...' : 'Apply Code'}
              </button>
            </div>
          )}

          {comboPromoMsg && (
            <p className={`text-[11px] font-mono ${comboPromoMsg.includes('applied') || comboPromoMsg.includes('OFF') ? 'text-emerald-400' : 'text-rose-300'}`}>
              {comboPromoMsg}
            </p>
          )}

          {pricing.isAdvancePayment && (
            <div className="p-3 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs space-y-1">
              <div className="font-bold flex items-center justify-between text-white">
                <span>Advance Payment Applied:</span>
                <span className="font-mono text-amber-300">Pay ₹{pricing.finalFee} Now</span>
              </div>
              <div className="flex items-center justify-between text-slate-300 text-[11px]">
                <span>Remaining Balance Due on Arrival:</span>
                <strong className="font-mono text-amber-400">₹{pricing.remainingBalance?.toLocaleString()}</strong>
              </div>
            </div>
          )}
        </div>

        {/* QR Code Container */}
        <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-950 border-2 border-amber-400/40 max-w-xs mx-auto shadow-2xl">
          <div className="w-56 h-56 rounded-xl bg-white p-2 flex flex-col items-center justify-center overflow-hidden">
            {!allQrCandidatesFailed ? (
              <img
                src={qrCandidateUrls[qrCandidateIndex]}
                alt="Static Official UPI QR"
                onError={handleBankQrImgError}
                className="w-full h-full object-contain rounded"
              />
            ) : (
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=upi://pay?pa=${FESTIVAL_METADATA.paymentUpiIdPlaceholder}&pn=SrinivasanMedicalCollege&am=${pricing.finalFee}&cu=INR`}
                alt="UPI QR Code"
                className="w-full h-full object-contain rounded"
              />
            )}
          </div>
          <span className="text-xs text-amber-300 font-extrabold mt-2">{FESTIVAL_METADATA.paymentBeneficiaryName}</span>
        </div>

        {/* Copy UPI Box */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 max-w-md mx-auto text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-mono">Official UPI ID</span>
            <span className="font-mono text-amber-300 font-bold select-all">{FESTIVAL_METADATA.paymentUpiIdPlaceholder}</span>
          </div>
          <button
            type="button"
            onClick={handleCopyUpi}
            className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
          >
            {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
            <span>{copiedUpi ? 'Copied' : 'Copy UPI'}</span>
          </button>
        </div>

        {/* Proof Input Fields */}
        <div className="space-y-4 max-w-md mx-auto bg-slate-950 p-5 rounded-2xl border border-slate-800">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              UPI Reference ID / UTR Number *
            </label>
            <input
              type="text"
              value={utrNumber}
              onChange={e => setUtrNumber(e.target.value)}
              placeholder="e.g. 429810192834"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Upload Payment Screenshot *
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handlePaymentScreenshotUpload}
              className="w-full text-xs text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-500 file:text-slate-950 hover:file:bg-amber-400 cursor-pointer"
            />
          </div>

          {submissionError && (
            <div className="p-3 bg-rose-950/80 border border-rose-500/50 rounded-xl text-rose-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{submissionError}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (isSuccess) {
    return (
      <div className="max-w-2xl mx-auto pt-28 pb-20 px-4 text-center">
        <div className="bg-slate-900 border border-emerald-500/50 p-8 rounded-3xl shadow-2xl space-y-6">
          <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/40">
            <CheckCircle className="w-10 h-10" />
          </div>

          <h2 className="text-3xl font-extrabold text-white">Combo Registration Submitted!</h2>
          <p className="text-slate-300 text-sm leading-relaxed">
            Your combo registration for <span className="text-amber-400 font-bold">{combo.name}</span> has been successfully recorded along with all captain details, participant counts, and ID cards. Our verification team will verify your payment UTR shortly.
          </p>

          <button
            onClick={onComplete}
            className="py-3 px-8 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-lg transition-all cursor-pointer"
          >
            Go to Home / Dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentDisplayStep = requiresEventSelection ? wizardStep : wizardStep - 1;
  const totalDisplaySteps = requiresEventSelection ? 5 : 4;

  return (
    <div className="relative z-20 max-w-4xl mx-auto pt-24 pb-20 px-4 text-white">
      {/* Top Navigation */}
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800">
        <button
          type="button"
          onClick={onCancel}
          className="text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700/80 hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-amber-400" />
          <span>Exit to Combo Offers</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-amber-400 bg-amber-950/80 px-3 py-1 rounded-full border border-amber-500/30">
            {combo.name}
          </span>
        </div>
      </div>

      {/* Progress Stepper Bar */}
      <div className="mb-8 bg-slate-900/90 border border-slate-800 p-4.5 rounded-2xl shadow-xl">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-2">
          <span>COMBO REGISTRATION WORKFLOW</span>
          <span className="text-amber-400 font-bold">Step {currentDisplayStep} of {totalDisplaySteps}</span>
        </div>

        <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
          <div 
            className="bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-400 h-2.5 transition-all duration-300"
            style={{ width: `${(currentDisplayStep / totalDisplaySteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Render Active Step */}
      {wizardStep === 1 && renderStep1EventSelection()}
      {wizardStep === 2 && renderStep2PrimaryProfile()}
      {wizardStep === 3 && renderStep3EventForms()}
      {wizardStep === 4 && renderStep4Review()}
      {wizardStep === 5 && renderStep5Payment()}

      {/* Footer Navigation Buttons */}
      <div className="mt-8 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={handlePrevStep}
          className="flex items-center gap-2 px-5 py-3 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-semibold transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        {wizardStep < 5 ? (
          <button
            type="button"
            onClick={handleNextStep}
            className="flex items-center gap-2 py-3 px-6 rounded-xl font-bold text-sm bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg transition-all cursor-pointer"
          >
            <span>Continue</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmitComboRegistrations}
            disabled={isSubmitting}
            className="flex items-center gap-2 py-3.5 px-8 rounded-xl font-extrabold text-sm bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/25 transition-all cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Submitting Registration...</span>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                <span>Submit Final Combo Registration</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
