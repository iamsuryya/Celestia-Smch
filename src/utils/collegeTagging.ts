/**
 * Institutional classification and host college tagging utilities for Celestia'26
 * 
 * Strict Rule: Only exact "Srinivasan Medical College and Hospital" (SMCH, Trichy)
 * is classified as Host College. All other institutions (including Dhanalakshmi Srinivasan)
 * are categorized as "Other College".
 */

import { RegistrationSubmission } from '../types/registration';

/**
 * Checks if a college name corresponds strictly to Srinivasan Medical College and Hospital (Host).
 * Explicitly excludes sister/other institutions like Dhanalakshmi Srinivasan.
 */
export function isExactSmchHost(collegeName?: string): boolean {
  if (!collegeName) return false;
  const name = collegeName.trim().toLowerCase();

  // Exclude sister/other Dhanalakshmi colleges
  if (name.includes('dhanalakshmi')) {
    return false;
  }

  // Exact matches for Srinivasan Medical College & Hospital
  if (
    name.includes('srinivasan medical') ||
    name.includes('srinivasan institute of medical') ||
    name === 'smch' ||
    name.startsWith('smch ') ||
    name.endsWith(' smch') ||
    name.includes('smch,') ||
    name.includes('smch -') ||
    name.includes('smch trichy') ||
    name.includes('smch, trichy')
  ) {
    return true;
  }

  return false;
}

export interface CollegeClassification {
  isHost: boolean;
  isDelegation: boolean;
  badgeLabel: string;
  badgeClasses: string;
  categoryTag: 'HOST_COLLEGE' | 'DELEGATION' | 'OTHER_COLLEGE';
}

/**
 * Returns canonical institutional classification and UI badge styling for any registration.
 */
export function getCollegeClassification(reg: RegistrationSubmission): CollegeClassification {
  const collegeName = (reg.college?.collegeName || '').trim();
  const hostMatch = isExactSmchHost(collegeName);

  // If college matches exact SMCH
  if (hostMatch) {
    return {
      isHost: true,
      isDelegation: false,
      badgeLabel: 'SMCH Host · Free ₹0',
      badgeClasses: 'bg-emerald-500/25 text-emerald-300 font-mono font-bold border border-emerald-500/40',
      categoryTag: 'HOST_COLLEGE',
    };
  }

  // If marked as official college delegation
  if (reg.college?.isCollegeDelegation) {
    return {
      isHost: false,
      isDelegation: true,
      badgeLabel: 'Official College Delegation',
      badgeClasses: 'bg-purple-500/20 text-purple-300 font-mono border border-purple-500/30',
      categoryTag: 'DELEGATION',
    };
  }

  // All other external colleges
  return {
    isHost: false,
    isDelegation: false,
    badgeLabel: 'Other College',
    badgeClasses: 'bg-sky-950/60 text-sky-300 font-mono border border-sky-500/40',
    categoryTag: 'OTHER_COLLEGE',
  };
}
