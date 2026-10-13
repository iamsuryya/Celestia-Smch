import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  RegistrationStep, 
  UserAccount, 
  CollegeDetails, 
  ParticipantMember, 
  RegistrationSubmission 
} from '../types/registration';
import { EventItem, EVENTS_DATA } from '../data/festivalData';
import { supabaseRegistrationService } from '../services/supabaseRegistrationService';
import { generateRegistrationCode } from '../utils/registrationCode';

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
  
  // Fee Calculation
  calculateTotalFee: (event: EventItem | null, participantCount: number) => number;
  
  // Completed Registrations List
  myRegistrations: RegistrationSubmission[];
  activeRegistration: RegistrationSubmission | null;
  setActiveRegistration: (reg: RegistrationSubmission | null) => void;
  
  // Actions
  submitRegistration: () => RegistrationSubmission | null;
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

  // Persist user changes
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  }, [currentUser]);

  // Persist college details
  useEffect(() => {
    if (collegeDetails) {
      try {
        localStorage.setItem(COLLEGE_STORAGE_KEY, JSON.stringify(collegeDetails));
      } catch (err) {
        console.warn('Could not persist collegeDetails to localStorage:', err);
      }
    }
  }, [collegeDetails]);

  // Persist registrations safely
  useEffect(() => {
    try {
      localStorage.setItem(REGISTRATIONS_STORAGE_KEY, JSON.stringify(myRegistrations));
    } catch (err) {
      console.warn('Could not persist full registrations with screenshot payload to localStorage (quota reached). Retrying with lightweight records:', err);
      try {
        const lightweight = myRegistrations.map((r) => ({
          ...r,
          paymentScreenshotData: undefined, // remove bulky base64 if quota hit
          participants: r.participants.map((p) => ({ ...p, idCardFileData: undefined })),
        }));
        localStorage.setItem(REGISTRATIONS_STORAGE_KEY, JSON.stringify(lightweight));
      } catch (e2) {
        console.warn('Failed to persist lightweight registrations:', e2);
      }
    }
  }, [myRegistrations]);

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
    setSelectedEvent(event);
    setTeamName('');
    
    // Pre-populate with current user if solo
    if (event.type === 'Solo') {
      setParticipants([
        {
          fullName: currentUser?.fullName || '',
          gender: 'Male',
          age: '20',
          mobile: currentUser?.mobile || '',
          email: currentUser?.email || '',
          role: 'Individual Participant',
        }
      ]);
    } else if (event.type === 'Duo') {
      // Duo event: initialize with Team Captain (Participant 1); Participant 2 is optional to add
      setParticipants([
        {
          fullName: currentUser?.fullName || '',
          gender: 'Male',
          age: '20',
          mobile: currentUser?.mobile || '',
          email: currentUser?.email || '',
          role: 'Team Captain / Participant 1',
        }
      ]);
    } else {
      // Team event: initialize with only the Team Captain (1 member)
      // Additional team members are optional and added on-demand via "+ Add Team Member"
      setParticipants([
        {
          fullName: currentUser?.fullName || '',
          gender: 'Male',
          age: '20',
          mobile: currentUser?.mobile || '',
          email: currentUser?.email || '',
          role: 'Team Captain / Primary Contact',
        }
      ]);
    }
  };

  const calculateTotalFee = (event: EventItem | null, participantCount: number): number => {
    if (!event) return 0;
    // Free registration fee waiver for students of Srinivasan Medical College and Hospital Trichy
    if (collegeDetails?.isHostCollege) {
      return 0;
    }
    if (event.feeType === 'per_head') {
      return event.feeAmount * Math.max(participantCount, 1);
    }
    return event.feeAmount;
  };

  const submitRegistration = (): RegistrationSubmission | null => {
    if (!selectedEvent || !collegeDetails || !currentUser) return null;

    const submissionId = generateRegistrationCode(selectedEvent.id);
    const isHost = Boolean(collegeDetails.isHostCollege);
    const totalAmount = isHost ? 0 : calculateTotalFee(selectedEvent, participants.length);

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
      participants: [...participants],
      feePerUnit: isHost ? 0 : selectedEvent.feeAmount,
      feeType: selectedEvent.feeType,
      totalAmount,
      utrNumber: isHost 
        ? (utrNumber.trim() || 'SMCH-HOST-FREE') 
        : (utrNumber.trim() || 'NOT_SUBMITTED'),
      paymentScreenshotName: isHost ? 'smch_host_waiver.png' : (paymentScreenshotName || 'receipt_screenshot.png'),
      paymentScreenshotData: paymentScreenshotData || undefined,
      paymentConfirmed: isHost ? true : paymentConfirmed,
      paymentStatus: 'Submitted',
      registrationStatus: 'Submitted',
      createdAt: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    };

    const currentPaymentFile = paymentScreenshotFile;
    const currentPaymentData = paymentScreenshotData;
    const currentParticipants = [...participants];

    setMyRegistrations((prev) => [newSubmission, ...prev]);
    setActiveRegistration(newSubmission);
    
    // Asynchronously dispatch to Supabase
    supabaseRegistrationService.submitRegistrationToSupabase({
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
      idCardFiles: currentParticipants.map(p => p.idCardFile || null),
      userId: currentUser.id,
    }).then(res => {
      if (res?.registrationCode && res.registrationCode !== submissionId) {
        // Keep code consistent
      }
    }).catch(err => {
      console.warn('Supabase cloud registration dispatch:', err);
    });

    // Clear draft payment inputs
    setUtrNumber('');
    setPaymentScreenshotName('');
    setPaymentScreenshotFile(null);
    setPaymentScreenshotData('');
    setPaymentConfirmed(false);

    return newSubmission;
  };

  const startNewRegistration = (preselectedEventId?: string) => {
    if (preselectedEventId) {
      const found = EVENTS_DATA.find((e) => e.id === preselectedEventId);
      if (found) {
        selectEvent(found);
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

    // If user is already logged in and has college details, jump straight to event or participants
    if (currentUser && collegeDetails) {
      if (preselectedEventId) {
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

  return (
    <RegistrationContext.Provider
      value={{
        currentStep,
        goToStep: setCurrentStep,
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
        calculateTotalFee,
        myRegistrations,
        activeRegistration,
        setActiveRegistration,
        submitRegistration,
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
