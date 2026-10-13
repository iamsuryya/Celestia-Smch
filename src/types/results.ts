export type ResultStatus = 'DRAFT' | 'PUBLISHED';

export interface WinnerEntry {
  participantName: string;
  collegeName: string;
  prizeAmount?: string;
}

export interface SpecialAwardEntry {
  awardTitle: string;
  participantName: string;
  collegeName: string;
}

export interface EventResultItem {
  eventId: string;
  eventCode: string;
  eventTitle: string;
  category: 'music' | 'dance' | 'fashion' | 'entertainment' | 'special' | 'media';
  categoryDisplay: string;
  status: ResultStatus;
  publishedAt?: string;
  winner?: WinnerEntry;
  runnerUp?: WinnerEntry;
  secondRunnerUp?: WinnerEntry;
  specialAwards?: SpecialAwardEntry[];
  note?: string;
}
