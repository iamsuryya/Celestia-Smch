export type RegistrationStep = 
  | 'landing'
  | 'account'
  | 'college'
  | 'event'
  | 'participants'
  | 'review'
  | 'payment'
  | 'confirmation'
  | 'dashboard';

export type PaymentStatus = 'Pending' | 'Submitted' | 'Verified' | 'Rejected';
export type RegistrationStatus = 'Draft' | 'Submitted' | 'Confirmed' | 'Rejected';

export interface UserAccount {
  id: string;
  fullName: string;
  email: string;
  mobile: string;
  createdAt: string;
}

export interface CollegeDetails {
  collegeName: string;
  city: string;
  state: string;
  contactPerson: string;
  contactMobile: string;
  contactEmail: string;
  isCollegeDelegation: boolean;
  // Host College Waiver (Srinivasan Medical College and Hospital Trichy)
  isHostCollege?: boolean;
  hostRegisterNumber?: string;
  hostBatch?: string;
  hostDepartment?: string;
  hostPasscode?: string;
}

export interface ParticipantMember {
  fullName: string;
  gender: 'Male' | 'Female' | 'Other' | 'Prefer not to say';
  age: string;
  mobile: string;
  email: string;
  idCardFileName?: string;
  idCardFileData?: string;
  idCardFile?: File;
  idCardStoragePath?: string;
  role?: string; // e.g. "Team Leader", "Performer", "Accompanist"
  registerNumber?: string;
  batch?: string;
}

export interface RegistrationSubmission {
  id: string; // e.g. C26-131026-1-1
  registrationCode?: string;
  userId: string;
  eventId: string;
  eventTitle: string;
  eventCode: string;
  eventCategory: string;
  eventType: 'Solo' | 'Duo' | 'Team';
  venue: string;
  dateStr: string;
  duration: string;
  
  // College details
  college: CollegeDetails;
  isHostCollege?: boolean;
  
  // Participants details
  teamName?: string;
  participants: ParticipantMember[];
  
  // Payment info
  feePerUnit: number;
  feeType: 'per_head' | 'per_team';
  totalAmount: number;
  utrNumber?: string;
  paymentScreenshotName?: string;
  paymentScreenshotFile?: File;
  paymentScreenshotPath?: string;
  paymentScreenshotData?: string;
  paymentConfirmed: boolean;
  
  // Statuses
  paymentStatus: PaymentStatus;
  registrationStatus: RegistrationStatus;
  createdAt: string;
}
