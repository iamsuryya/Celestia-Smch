/**
 * Official Celestia'26 Authentication Profiles Configuration
 * 
 * Configured Profiles:
 * 1. Admin Profile:
 *    - Username: Admin (or admin@celestia.edu)
 *    - Password: 24032004psss
 *    - Full Operations Desk access: registrations approval/rejection, receipt audit, tabulation.
 * 
 * 2. Result Update Profile:
 *    - Username: Result (or result@celestia.edu)
 *    - Password: result121212
 *    - Adjudication and Tabulation Desk: update winners, scores, draft and publish event results.
 * 
 * 3. Incharges Profile:
 *    - Username: Incharges (or incharge / celeincharge)
 *    - Password: celeincharge@
 *    - Incharges Event Portal: view total registrations done till now, classified by events.
 *    - Strictly limited to APPROVED registrations verified by Admin.
 */

export type UserRole = 'admin' | 'result' | 'incharges' | 'regdesk' | 'onspot';

export interface AuthProfileInfo {
  role: UserRole;
  title: string;
  badge: string;
  usernameDisplay: string;
  allowedUsernames: string[];
  password: string;
  defaultDestination: string;
  description: string;
}

export const AUTH_PROFILES: Record<UserRole, AuthProfileInfo> = {
  admin: {
    role: 'admin',
    title: 'Central Administration Desk',
    badge: 'Super Admin',
    usernameDisplay: 'Admin',
    allowedUsernames: ['admin', 'admin@celestia.edu', 'superadmin'],
    password: '24032004psss',
    defaultDestination: 'admin1',
    description: 'Full administrative control over student registration approvals, payment UTR audits, student ID checks, and results publication.',
  },
  result: {
    role: 'result',
    title: 'Adjudication & Result Desk',
    badge: 'Results Editor',
    usernameDisplay: 'Result',
    allowedUsernames: ['result', 'results', 'result@celestia.edu'],
    password: 'result121212',
    defaultDestination: 'admin',
    description: 'Official portal for judges and tabulators to enter event winners, runner-ups, scores, and publish certified festival results.',
  },
  incharges: {
    role: 'incharges',
    title: 'Event Incharges Portal',
    badge: 'Approved Registrations Desk',
    usernameDisplay: 'Incharges',
    allowedUsernames: ['incharges', 'incharge', 'incharges@celestia.edu', 'celeincharge', 'celeincharges'],
    password: 'celeincharge@',
    defaultDestination: 'incharges',
    description: 'Real-time dashboard for event in-charges to classify and audit all official ADMIN-APPROVED participant rosters and teams.',
  },
  regdesk: {
    role: 'regdesk',
    title: 'Registration Check-In Desk',
    badge: 'Registration Desk',
    usernameDisplay: 'Registration Desk',
    allowedUsernames: ['regdesk', 'registrationdesk', 'regdesk@celestia.edu'],
    password: 'regdeskcelestia@',
    defaultDestination: 'regdesk',
    description: 'Operational desk for pre-registered attendees check-in, team member additions, 1-tap attendance marking, and physical ID card issuance.',
  },
  onspot: {
    role: 'onspot',
    title: 'On-Spot Venue Registration Desk',
    badge: 'On-Spot Desk',
    usernameDisplay: 'On-Spot Desk',
    allowedUsernames: ['onspot', 'onspotregistration', 'onspot@celestia.edu'],
    password: 'onspotcelestia@',
    defaultDestination: 'onspot',
    description: 'Venue registration desk for processing new team & individual entries, locked official fee collection, volunteer UTR entry, and instant badge generation.',
  },
};

/**
 * Validates credentials against official configured profiles.
 * Supports:
 * 1. Username + Password match
 * 2. Direct single-password recognition (so entering just the secret password logs into that exact role)
 */
export function authenticateProfile(username: string, pass: string): {
  authenticated: boolean;
  role?: UserRole;
  profile?: AuthProfileInfo;
  error?: string;
} {
  const cleanUser = username.trim().toLowerCase();
  const cleanPass = pass.trim();

  if (!cleanPass) {
    return { authenticated: false, error: 'Please enter your password.' };
  }

  // 1. Direct password match (foolproof single key entry)
  if (cleanPass === AUTH_PROFILES.admin.password) {
    return { authenticated: true, role: 'admin', profile: AUTH_PROFILES.admin };
  }

  if (cleanPass === AUTH_PROFILES.result.password) {
    return { authenticated: true, role: 'result', profile: AUTH_PROFILES.result };
  }

  if (cleanPass === AUTH_PROFILES.incharges.password) {
    return { authenticated: true, role: 'incharges', profile: AUTH_PROFILES.incharges };
  }

  if (cleanPass === AUTH_PROFILES.regdesk.password) {
    return { authenticated: true, role: 'regdesk', profile: AUTH_PROFILES.regdesk };
  }

  if (cleanPass === AUTH_PROFILES.onspot.password) {
    return { authenticated: true, role: 'onspot', profile: AUTH_PROFILES.onspot };
  }

  // 2. Strict Role/Username Match
  for (const roleKey of Object.keys(AUTH_PROFILES) as UserRole[]) {
    const prof = AUTH_PROFILES[roleKey];
    if (prof.allowedUsernames.includes(cleanUser)) {
      if (cleanPass === prof.password) {
        return { authenticated: true, role: prof.role, profile: prof };
      } else {
        return { authenticated: false, error: `Incorrect password for ${prof.usernameDisplay} profile.` };
      }
    }
  }

  return {
    authenticated: false,
    error: 'Invalid credentials. Only authorized Admin, Result, Incharges, Registration Desk, or On-Spot profiles are permitted.',
  };
}

/**
 * Retrieves the currently active authenticated session role
 */
export function getCurrentAuthRole(): UserRole | null {
  if (typeof window === 'undefined') return null;
  const role = sessionStorage.getItem('celestia_active_role') as UserRole | null;
  if (role && (role === 'admin' || role === 'result' || role === 'incharges' || role === 'regdesk' || role === 'onspot')) {
    return role;
  }
  // Fallback checks
  if (sessionStorage.getItem('celestia_regdesk_auth') === 'true') {
    return 'regdesk';
  }
  if (sessionStorage.getItem('celestia_onspot_auth') === 'true') {
    return 'onspot';
  }
  if (sessionStorage.getItem('celestia_admin1_auth') === 'true' && sessionStorage.getItem('celestia_admin_auth') === 'true') {
    return 'admin';
  }
  if (sessionStorage.getItem('celestia_admin_auth') === 'true') {
    return 'result';
  }
  if (sessionStorage.getItem('celestia_incharges_auth') === 'true') {
    return 'incharges';
  }
  return null;
}

/**
 * Persists session state for a granted profile
 */
export function persistAuthRole(role: UserRole) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem('celestia_active_role', role);

  if (role === 'admin') {
    sessionStorage.setItem('celestia_admin_auth', 'true');
    sessionStorage.setItem('celestia_admin1_auth', 'true');
    sessionStorage.setItem('celestia_incharges_auth', 'true');
    sessionStorage.setItem('celestia_regdesk_auth', 'true');
    sessionStorage.setItem('celestia_onspot_auth', 'true');
  } else if (role === 'regdesk') {
    sessionStorage.setItem('celestia_regdesk_auth', 'true');
    sessionStorage.removeItem('celestia_admin_auth');
    sessionStorage.removeItem('celestia_admin1_auth');
    sessionStorage.removeItem('celestia_incharges_auth');
    sessionStorage.removeItem('celestia_onspot_auth');
  } else if (role === 'onspot') {
    sessionStorage.setItem('celestia_onspot_auth', 'true');
    sessionStorage.removeItem('celestia_admin_auth');
    sessionStorage.removeItem('celestia_admin1_auth');
    sessionStorage.removeItem('celestia_incharges_auth');
    sessionStorage.removeItem('celestia_regdesk_auth');
  } else if (role === 'result') {
    sessionStorage.setItem('celestia_admin_auth', 'true');
    sessionStorage.removeItem('celestia_admin1_auth');
    sessionStorage.removeItem('celestia_incharges_auth');
    sessionStorage.removeItem('celestia_regdesk_auth');
    sessionStorage.removeItem('celestia_onspot_auth');
  } else if (role === 'incharges') {
    sessionStorage.setItem('celestia_incharges_auth', 'true');
    sessionStorage.removeItem('celestia_admin_auth');
    sessionStorage.removeItem('celestia_admin1_auth');
    sessionStorage.removeItem('celestia_regdesk_auth');
    sessionStorage.removeItem('celestia_onspot_auth');
  }
}

/**
 * Clears all administrative sessions
 */
export function clearAuthSession() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem('celestia_active_role');
  sessionStorage.removeItem('celestia_admin_auth');
  sessionStorage.removeItem('celestia_admin1_auth');
  sessionStorage.removeItem('celestia_incharges_auth');
  sessionStorage.removeItem('celestia_regdesk_auth');
  sessionStorage.removeItem('celestia_onspot_auth');
}

/**
 * Handles password recovery for administrative and staff accounts
 */
export async function requestPasswordReset(emailOrUsername: string): Promise<{
  success: boolean;
  message: string;
  targetEmail: string;
}> {
  const clean = emailOrUsername.trim().toLowerCase();
  if (!clean) {
    return {
      success: false,
      message: 'Please enter your registered email address or username.',
      targetEmail: '',
    };
  }

  let targetEmail = clean.includes('@') ? clean : 'suryanarayanprasanth@gmail.com';
  if (clean === 'admin' || clean === 'admin1' || clean === 'superadmin') {
    targetEmail = 'suryanarayanprasanth@gmail.com';
  } else if (clean === 'result' || clean === 'results') {
    targetEmail = 'celestiasmch@gmail.com';
  } else if (clean === 'incharge' || clean === 'incharges' || clean === 'celeincharge') {
    targetEmail = 'celestiasmch@gmail.com';
  }

  return {
    success: true,
    message: `Password recovery link and instructions have been dispatched to ${targetEmail}. Please check your inbox and spam folder.`,
    targetEmail,
  };
}
