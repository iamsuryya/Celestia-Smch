import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Unlock, 
  Trophy, 
  Users, 
  Eye, 
  Edit3, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  RotateCcw, 
  Sparkles, 
  ExternalLink,
  ChevronRight,
  Filter,
  Save,
  Trash2,
  X,
  FileText,
  Database,
  RefreshCw,
  Tag,
  Percent,
  Plus,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { useResults } from '../context/ResultsContext';
import { useRegistration } from '../context/RegistrationContext';
import { EVENTS_DATA, EventItem } from '../data/festivalData';
import { EventResultItem } from '../types/results';
import { RegistrationSubmission, PromoCode } from '../types/registration';
import { promoCodeService } from '../services/promoCodeService';
import { 
  isSupabaseConfigured, 
  getSupabaseConfigStatus, 
  testSupabaseConnection,
  supabase
} from '../lib/supabase';
import { supabaseRegistrationService } from '../services/supabaseRegistrationService';
import { 
  authenticateProfile, 
  persistAuthRole, 
  clearAuthSession, 
  getCurrentAuthRole, 
  UserRole,
  AUTH_PROFILES 
} from '../lib/authProfiles';

interface AdminDashboardPageProps {
  onNavigateToPublicResults: () => void;
  onExitAdmin: () => void;
  onNavigateToAdmin1?: () => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({
  onNavigateToPublicResults,
  onExitAdmin,
  onNavigateToAdmin1,
}) => {
  const { 
    results, 
    updateResult, 
    publishResult, 
    unpublishResult, 
    loadDemoResult, 
    clearResult, 
    resetAllResults,
    publishedCount,
    draftCount
  } = useResults();

  const { myRegistrations } = useRegistration();
  const [cloudRegistrations, setCloudRegistrations] = useState<RegistrationSubmission[]>([]);
  const [loadingRegistrations, setLoadingRegistrations] = useState<boolean>(false);

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return (
      sessionStorage.getItem('celestia_admin_auth') === 'true' ||
      sessionStorage.getItem('celestia_admin1_auth') === 'true'
    );
  });
  const [activeRole, setActiveRole] = useState<UserRole | null>(() => getCurrentAuthRole());
  const [roleTab, setRoleTab] = useState<UserRole>('result');
  const [loginUsername, setLoginUsername] = useState('Result');
  const [authMode, setAuthMode] = useState<'profile_pass' | 'supabase_auth'>('profile_pass');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [passkeyInput, setPasskeyInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);

  // Active Tab: 'results' | 'registrations' | 'promocodes' | 'overview'
  const [activeTab, setActiveTab] = useState<'results' | 'registrations' | 'promocodes' | 'overview'>('results');

  // Promo Codes State
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loadingPromos, setLoadingPromos] = useState<boolean>(false);
  const [newCodeName, setNewCodeName] = useState<string>('');
  const [newCodeDiscount, setNewCodeDiscount] = useState<string>('');
  const [newCodeDesc, setNewCodeDesc] = useState<string>('');
  const [isCreatingPromo, setIsCreatingPromo] = useState<boolean>(false);

  const loadPromoCodes = async () => {
    setLoadingPromos(true);
    try {
      const data = await promoCodeService.getPromoCodes();
      setPromoCodes(data);
    } catch {
      // ignore
    } finally {
      setLoadingPromos(false);
    }
  };

  // Load cloud registrations & promo codes
  const loadCloudRegistrations = async () => {
    setLoadingRegistrations(true);
    try {
      const data = await supabaseRegistrationService.fetchAdminRegistrations();
      setCloudRegistrations(data);
    } catch {
      // ignore
    } finally {
      setLoadingRegistrations(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadCloudRegistrations();
      loadPromoCodes();

      const unsubscribe = promoCodeService.subscribeToRealtimePromos((updatedCodes) => {
        setPromoCodes(updatedCodes);
      });

      return () => {
        unsubscribe();
      };
    }
  }, [isAuthenticated]);

  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    const discountVal = parseFloat(newCodeDiscount);
    if (!newCodeName.trim()) {
      showToast('Please enter a promo code string (e.g. CELESTIA20)');
      return;
    }
    if (isNaN(discountVal) || discountVal <= 0 || discountVal > 100) {
      showToast('Discount percentage must be between 1% and 100%');
      return;
    }

    setIsCreatingPromo(true);
    try {
      const res = await promoCodeService.createPromoCode(newCodeName, discountVal, newCodeDesc);
      showToast(res.message);
      if (res.success) {
        setNewCodeName('');
        setNewCodeDiscount('');
        setNewCodeDesc('');
        loadPromoCodes();
      }
    } catch {
      showToast('Failed to create promo code.');
    } finally {
      setIsCreatingPromo(false);
    }
  };

  const handleTogglePromoStatus = async (id: string, currentActive: boolean) => {
    const nextActive = !currentActive;
    const res = await promoCodeService.togglePromoCodeStatus(id, nextActive);
    showToast(res.message);
    loadPromoCodes();
  };

  const handleDeletePromo = async (id: string) => {
    if (window.confirm('Delete this promo code permanently?')) {
      const res = await promoCodeService.deletePromoCode(id);
      showToast(res.message);
      loadPromoCodes();
    }
  };

  // Combine cloud registrations with local registrations, deduplicating by ID
  const allRegistrations: RegistrationSubmission[] = React.useMemo(() => {
    const map = new Map<string, RegistrationSubmission>();
    // Add local registrations first
    myRegistrations.forEach((r) => map.set(r.id, r));
    // Overwrite or augment with cloud registrations
    cloudRegistrations.forEach((r) => map.set(r.id, r));
    return Array.from(map.values());
  }, [myRegistrations, cloudRegistrations]);

  const registrations: RegistrationSubmission[] = allRegistrations;

  // Filter for Results
  const [statusFilter, setStatusFilter] = useState<'all' | 'PUBLISHED' | 'DRAFT'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Modal for editing an event result
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<{
    status: 'DRAFT' | 'PUBLISHED';
    winnerName: string;
    winnerCollege: string;
    winnerPrize: string;
    runnerUpName: string;
    runnerUpCollege: string;
    runnerUpPrize: string;
    secondRunnerUpName: string;
    secondRunnerUpCollege: string;
    hasSecondRunnerUp: boolean;
    hasSpecialAward: boolean;
    specialAwardTitle: string;
    specialAwardName: string;
    specialAwardCollege: string;
    note: string;
  }>({
    status: 'DRAFT',
    winnerName: '',
    winnerCollege: '',
    winnerPrize: '',
    runnerUpName: '',
    runnerUpCollege: '',
    runnerUpPrize: '',
    secondRunnerUpName: '',
    secondRunnerUpCollege: '',
    hasSecondRunnerUp: false,
    hasSpecialAward: false,
    specialAwardTitle: '',
    specialAwardName: '',
    specialAwardCollege: '',
    note: '',
  });

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotInput, setForgotInput] = useState('');
  const [forgotResult, setForgotResult] = useState<{ success: boolean; message: string; targetEmail: string } | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    const enteredUser = (loginUsername || adminEmail).trim();
    const enteredPass = (passkeyInput || adminPassword).trim();

    const authResult = authenticateProfile(enteredUser, enteredPass);
    if (authResult.authenticated && authResult.role) {
      persistAuthRole(authResult.role);
      setActiveRole(authResult.role);
      setIsAuthenticated(true);

      if (authResult.role === 'incharges') {
        showToast('Incharges profile: Forwarding to Incharges Portal');
        if (onNavigateToAdmin1) {
          onNavigateToAdmin1();
        }
      } else if (authResult.role === 'result') {
        setActiveTab('results');
        showToast('Result Update Desk Unlocked');
      } else {
        showToast('Central Admin Adjudication Unlocked');
      }
      return;
    }

    if (authMode === 'supabase_auth') {
      if (!adminEmail.trim() || !adminPassword) {
        setAuthError('Please enter both administrator email and password.');
        return;
      }
      setIsSubmittingAuth(true);
      try {
        if (!supabase) {
          throw new Error('Supabase client not initialized.');
        }
        const { data, error } = await supabase.auth.signInWithPassword({
          email: adminEmail.trim(),
          password: adminPassword,
        });

        if (error) {
          throw error;
        }

        if (data.session) {
          setIsAuthenticated(true);
          persistAuthRole('admin');
          setActiveRole('admin');
          showToast(`Authenticated as ${data.user?.email || 'Admin'}`);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Authentication failed';
        setAuthError(`Supabase Auth error: ${msg}. You may also log in with your Profile password.`);
      } finally {
        setIsSubmittingAuth(false);
      }
    } else {
      setAuthError(authResult.error || 'Invalid credentials. Only authorized Admin or Result profiles are permitted.');
    }
  };

  const handleVerifyRegistration = async (regId: string, status: 'Verified' | 'Rejected') => {
    const res = await supabaseRegistrationService.updatePaymentVerification(regId, status);
    showToast(res.success ? res.message : `Marked as ${status}`);

    // Update local storage instantly
    try {
      const saved = localStorage.getItem('celestia26_registrations');
      if (saved) {
        const list: RegistrationSubmission[] = JSON.parse(saved);
        const updated = list.map((r) =>
          (r.id === regId || r.registrationCode === regId)
            ? {
                ...r,
                paymentStatus: status,
                registrationStatus: status === 'Verified' ? 'Confirmed' : 'Rejected',
                paymentConfirmed: status === 'Verified',
              }
            : r
        );
        localStorage.setItem('celestia26_registrations', JSON.stringify(updated));
      }
    } catch (e) {
      console.warn('Could not update localStorage:', e);
    }

    // Dispatch global event for instant UI sync
    window.dispatchEvent(new CustomEvent('celestia-registration-status-changed', { detail: { regId, status } }));

    loadCloudRegistrations();
    setCloudRegistrations((prev) =>
      prev.map((r) =>
        (r.id === regId || r.registrationCode === regId)
          ? {
              ...r,
              paymentStatus: status,
              registrationStatus: status === 'Verified' ? 'Confirmed' : 'Rejected',
              paymentConfirmed: status === 'Verified',
            }
          : r
      )
    );
  };

  const [deleteConfirmReg, setDeleteConfirmReg] = useState<RegistrationSubmission | null>(null);

  const handleDeleteReg = async () => {
    if (!deleteConfirmReg) return;
    const regId = deleteConfirmReg.id;
    await supabaseRegistrationService.deleteRegistration(regId);
    showToast(`Registration ${regId} deleted permanently (other entries unaffected)`);
    setDeleteConfirmReg(null);
    loadCloudRegistrations();
    setCloudRegistrations((prev) => prev.filter((r) => r.id !== regId));
  };

  const handleLogout = async () => {
    setIsAuthenticated(false);
    clearAuthSession();
    setActiveRole(null);
    setPasskeyInput('');
    setAdminPassword('');
    if (supabase) {
      await supabase.auth.signOut().catch(() => {});
    }
    showToast('Logged out of Tabulation Console');
  };

  // Supabase Connection Diagnostic State
  const [testingSupabase, setTestingSupabase] = useState(false);
  const [supabaseTestStatus, setSupabaseTestStatus] = useState<{
    tested: boolean;
    success: boolean;
    message: string;
    url: string | null;
  } | null>(null);

  const handleTestSupabaseConnection = async () => {
    setTestingSupabase(true);
    try {
      const res = await testSupabaseConnection();
      setSupabaseTestStatus({
        tested: true,
        success: res.success,
        message: res.message,
        url: res.url,
      });
      showToast(res.success ? 'Supabase connection verified successfully!' : `Connection check: ${res.message}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error testing connection';
      setSupabaseTestStatus({
        tested: true,
        success: false,
        message: msg,
        url: null,
      });
      showToast('Supabase connection test failed');
    } finally {
      setTestingSupabase(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (eventId: string) => {
    const res = results.find((r) => r.eventId === eventId);
    const event = EVENTS_DATA.find((e) => e.id === eventId);

    setEditingEventId(eventId);
    setEditFormData({
      status: res?.status || 'DRAFT',
      winnerName: res?.winner?.participantName || '',
      winnerCollege: res?.winner?.collegeName || '',
      winnerPrize: res?.winner?.prizeAmount || (event?.prizes?.winner || ''),
      runnerUpName: res?.runnerUp?.participantName || '',
      runnerUpCollege: res?.runnerUp?.collegeName || '',
      runnerUpPrize: res?.runnerUp?.prizeAmount || (event?.prizes?.runnerUp || ''),
      secondRunnerUpName: res?.secondRunnerUp?.participantName || '',
      secondRunnerUpCollege: res?.secondRunnerUp?.collegeName || '',
      hasSecondRunnerUp: Boolean(res?.secondRunnerUp),
      hasSpecialAward: Boolean(res?.specialAwards && res.specialAwards.length > 0),
      specialAwardTitle: res?.specialAwards?.[0]?.awardTitle || '',
      specialAwardName: res?.specialAwards?.[0]?.participantName || '',
      specialAwardCollege: res?.specialAwards?.[0]?.collegeName || '',
      note: res?.note || '',
    });
  };

  const handleSaveResult = (publishDirectly: boolean) => {
    if (!editingEventId) return;

    const event = EVENTS_DATA.find((e) => e.id === editingEventId);

    const updatedStatus: 'DRAFT' | 'PUBLISHED' = publishDirectly ? 'PUBLISHED' : editFormData.status;

    // Validation if publishing
    if (updatedStatus === 'PUBLISHED') {
      if (!editFormData.winnerName.trim() || !editFormData.winnerCollege.trim()) {
        alert('Please enter Winner Participant Name and College Name before publishing.');
        return;
      }
    }

    const payload: Partial<EventResultItem> = {
      status: updatedStatus,
      publishedAt: updatedStatus === 'PUBLISHED' ? new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }) : undefined,
      winner: editFormData.winnerName.trim() ? {
        participantName: editFormData.winnerName.trim(),
        collegeName: editFormData.winnerCollege.trim(),
        prizeAmount: editFormData.winnerPrize.trim() || undefined,
      } : undefined,
      runnerUp: editFormData.runnerUpName.trim() ? {
        participantName: editFormData.runnerUpName.trim(),
        collegeName: editFormData.runnerUpCollege.trim(),
        prizeAmount: editFormData.runnerUpPrize.trim() || undefined,
      } : undefined,
      secondRunnerUp: editFormData.hasSecondRunnerUp && editFormData.secondRunnerUpName.trim() ? {
        participantName: editFormData.secondRunnerUpName.trim(),
        collegeName: editFormData.secondRunnerUpCollege.trim(),
      } : undefined,
      specialAwards: editFormData.hasSpecialAward && editFormData.specialAwardTitle.trim() ? [
        {
          awardTitle: editFormData.specialAwardTitle.trim(),
          participantName: editFormData.specialAwardName.trim(),
          collegeName: editFormData.specialAwardCollege.trim(),
        }
      ] : undefined,
      note: editFormData.note.trim() || undefined,
    };

    updateResult(editingEventId, payload);
    setEditingEventId(null);
    showToast(`${event?.title || 'Event'} results ${updatedStatus === 'PUBLISHED' ? 'PUBLISHED to public site' : 'saved as DRAFT'}.`);
  };

  // If not authenticated, render secure gatekeeper screen
  if (!isAuthenticated) {
    return (
      <div className="relative z-10 pt-20 sm:pt-28 pb-12 sm:pb-24 px-3 sm:px-6 lg:px-8 max-w-md mx-auto min-h-[70vh] flex items-center justify-center">
        <div className="w-full celestial-glass rounded-2xl p-6 sm:p-8 border border-[#D4AF37]/35 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#D4AF37]/20 via-[#D4AF37] to-[#D4AF37]/20" />
          
          <div className="text-center mb-6">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center text-[#E6C57D] mb-4">
              <Lock className="w-7 h-7" />
            </div>
            <span className="text-[11px] font-mono tracking-widest uppercase text-[#D4AF37] block font-semibold mb-1">
              RESULTS & TABULATION ROUTE (/admin)
            </span>
            <h2 className="font-cinzel text-2xl font-bold text-white tracking-wide">
              Adjudication Console
            </h2>
            <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
              Official portal for judges and tabulators to certify winners, runners-up, scores, and manage festival announcements.
            </p>
          </div>

          {/* Profile Selector Tabs */}
          <div className="flex rounded-xl bg-black/40 p-1 mb-4 border border-white/10 text-xs">
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
              Result Desk
            </button>
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
                placeholder="Username (Result / Admin / Incharges)"
                className="w-full px-4 py-2.5 rounded-xl bg-[#070B1C]/90 border border-white/15 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Security Password</span>
                <span className="text-[10px] text-slate-400 lowercase font-mono">
                  {roleTab === 'result' && 'Results Desk'}
                  {roleTab === 'admin' && 'Admin Console'}
                  {roleTab === 'incharges' && 'Incharges Portal'}
                </span>
              </label>
              <input
                type="password"
                value={passkeyInput}
                onChange={(e) => setPasskeyInput(e.target.value)}
                placeholder="Enter authorized password"
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

          {/* Secure Console Notice */}
          <div className="mt-5 pt-4 border-t border-white/10 text-center">
            <span className="text-[11px] text-slate-400 font-mono flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Official Celestia'26 Operations Console</span>
            </span>
          </div>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={onExitAdmin}
              className="text-xs text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              ← Return to Public Website
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Filtered results list
  const filteredEvents = EVENTS_DATA.filter((event) => {
    const res = results.find((r) => r.eventId === event.id);
    if (statusFilter !== 'all' && res?.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && event.category !== categoryFilter) return false;
    return true;
  });

  return (
    <div className="relative z-10 pt-20 sm:pt-24 pb-12 sm:pb-24 px-2.5 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-[#0E163B] border border-[#D4AF37] text-white shadow-2xl flex items-center gap-3 animate-fade-in text-xs font-medium">
          <Sparkles className="w-4 h-4 text-[#D4AF37]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Admin Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 mb-8 border-b border-white/10 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-mono tracking-widest uppercase text-[#D4AF37] font-semibold">
              CELESTIA'26 ADMIN PORTAL · SECURED
            </span>
          </div>
          <h1 className="font-cinzel text-2xl sm:text-4xl font-bold text-white tracking-wide">
            Tabulation & Control Console
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Official Adjudication System for Srinivasan Medical College and Hospital, Trichy
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          {onNavigateToAdmin1 && (
            <button
              onClick={onNavigateToAdmin1}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25 border border-[#D4AF37]/40 text-xs font-semibold text-[#F5E7C4] transition-colors cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Registration Operations (ADMIN-1)</span>
            </button>
          )}

          <button
            onClick={onNavigateToPublicResults}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#121B3E] hover:bg-[#182454] border border-[#D4AF37]/30 text-xs font-medium text-[#F5E7C4] transition-colors cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>View Public Results Page</span>
            <ExternalLink className="w-3 h-3 text-[#D4AF37]" />
          </button>

          <button
            onClick={onExitAdmin}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            Back to Site
          </button>

          <button
            onClick={handleLogout}
            className="px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-xs font-mono text-red-300 transition-colors cursor-pointer flex items-center gap-1"
          >
            <Unlock className="w-3 h-3" />
            <span>Lock</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="p-4 rounded-xl bg-[#090E26]/80 border border-white/10">
          <div className="text-[11px] font-mono text-slate-300 uppercase">Total Events</div>
          <div className="font-cinzel text-2xl font-bold text-white mt-1">12</div>
          <div className="text-[11px] text-[#E6C57D] mt-0.5">All official stages</div>
        </div>

        <div className="p-4 rounded-xl bg-[#090E26]/80 border border-emerald-500/30">
          <div className="text-[11px] font-mono text-emerald-300 uppercase">Published Live</div>
          <div className="font-cinzel text-2xl font-bold text-emerald-400 mt-1">
            {publishedCount} <span className="text-sm font-sans text-slate-300 font-normal">/ 12</span>
          </div>
          <div className="text-[11px] text-emerald-300/80 mt-0.5">Visible on public results</div>
        </div>

        <div className="p-4 rounded-xl bg-[#090E26]/80 border border-amber-500/30">
          <div className="text-[11px] font-mono text-amber-300 uppercase">Draft / Pending</div>
          <div className="font-cinzel text-2xl font-bold text-amber-400 mt-1">
            {draftCount} <span className="text-sm font-sans text-slate-300 font-normal">/ 12</span>
          </div>
          <div className="text-[11px] text-amber-300/80 mt-0.5">Shows unannounced notice</div>
        </div>

        <div className="p-4 rounded-xl bg-[#090E26]/80 border border-[#D4AF37]/30">
          <div className="text-[11px] font-mono text-[#D4AF37] uppercase">Registrations</div>
          <div className="font-cinzel text-2xl font-bold text-white mt-1">
            {registrations.length}
          </div>
          <div className="text-[11px] text-slate-300 mt-0.5">Active attendee records</div>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex border-b border-white/10 mb-8 gap-4 sm:gap-8">
        <button
          onClick={() => setActiveTab('results')}
          className={`pb-3 text-xs sm:text-sm font-semibold tracking-wide cursor-pointer transition-all flex items-center gap-2 border-b-2 ${
            activeTab === 'results'
              ? 'border-[#D4AF37] text-[#F5E7C4]'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>Results & Tabulation Engine</span>
        </button>

        <button
          onClick={() => setActiveTab('registrations')}
          className={`pb-3 text-xs sm:text-sm font-semibold tracking-wide cursor-pointer transition-all flex items-center gap-2 border-b-2 ${
            activeTab === 'registrations'
              ? 'border-[#D4AF37] text-[#F5E7C4]'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Registrations Audit ({registrations.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('promocodes')}
          className={`pb-3 text-xs sm:text-sm font-semibold tracking-wide cursor-pointer transition-all flex items-center gap-2 border-b-2 ${
            activeTab === 'promocodes'
              ? 'border-[#D4AF37] text-[#F5E7C4]'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>Promo Codes & Discounts ({promoCodes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 text-xs sm:text-sm font-semibold tracking-wide cursor-pointer transition-all flex items-center gap-2 border-b-2 ${
            activeTab === 'overview'
              ? 'border-[#D4AF37] text-[#F5E7C4]'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Operations & Preset Controls</span>
        </button>
      </div>

      {/* ================= TAB 1: RESULTS & TABULATION ================= */}
      {activeTab === 'results' && (
        <div>
          {/* Controls Bar */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 p-4 rounded-xl bg-[#090E26] border border-white/10">
            {/* Filter by Status & Category */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                <Filter className="w-3 h-3 text-[#D4AF37]" /> Filter:
              </span>
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                  statusFilter === 'all'
                    ? 'bg-[#D4AF37] text-[#050714] font-bold'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                All Status
              </button>
              <button
                onClick={() => setStatusFilter('PUBLISHED')}
                className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                  statusFilter === 'PUBLISHED'
                    ? 'bg-emerald-500 text-black font-bold'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                Published ({publishedCount})
              </button>
              <button
                onClick={() => setStatusFilter('DRAFT')}
                className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                  statusFilter === 'DRAFT'
                    ? 'bg-amber-500 text-black font-bold'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                Draft ({draftCount})
              </button>
            </div>

            {/* Global Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (window.confirm('Reset all 12 events to initial Draft status?')) {
                    resetAllResults();
                    showToast('All events reset to Draft (Results will be announced after event)');
                  }
                }}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset All to Unannounced</span>
              </button>
            </div>
          </div>

          {/* Events Results Table */}
          <div className="celestial-glass rounded-2xl overflow-hidden border border-white/10 shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 bg-black/40 text-[11px] font-mono uppercase tracking-wider text-[#D4AF37]">
                    <th className="py-3.5 px-4">Event Code</th>
                    <th className="py-3.5 px-4">Event Name & Category</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4">🥇 Winner / 🥈 Runner-Up</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredEvents.map((event) => {
                    const res = results.find((r) => r.eventId === event.id);
                    const isPublished = res?.status === 'PUBLISHED';
                    const hasWinner = Boolean(res?.winner?.participantName);

                    return (
                      <tr key={event.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-4 px-4 font-mono font-bold text-[#E6C57D]">
                          {event.code}
                          <div className="text-[10px] text-slate-400 font-sans font-normal uppercase">
                            {event.type}
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          <div className="font-semibold text-white text-sm">
                            {event.title}
                          </div>
                          <div className="text-slate-400 text-xs">
                            {event.categoryDisplay}
                          </div>
                        </td>

                        <td className="py-4 px-4 text-center">
                          {isPublished ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                              <CheckCircle className="w-3 h-3" />
                              PUBLISHED
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium bg-amber-500/10 text-amber-300 border border-amber-500/30">
                              <Clock className="w-3 h-3" />
                              DRAFT
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-4 max-w-xs">
                          {hasWinner ? (
                            <div className="space-y-1">
                              <div className="text-slate-200">
                                <strong className="text-[#D4AF37]">🥇 1st:</strong> {res?.winner?.participantName}{' '}
                                <span className="text-slate-400 text-[11px]">({res?.winner?.collegeName})</span>
                              </div>
                              {res?.runnerUp && (
                                <div className="text-slate-300 text-[11px]">
                                  <strong>🥈 2nd:</strong> {res.runnerUp.participantName}{' '}
                                  <span className="text-slate-400">({res.runnerUp.collegeName})</span>
                                </div>
                              )}
                              {res?.secondRunnerUp && (
                                <div className="text-slate-400 text-[10px]">
                                  <strong>🥉 3rd:</strong> {res.secondRunnerUp.participantName}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-300 italic text-[11px]">
                              Results unannounced ("Will be announced after event")
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            {/* Edit / Enter Result */}
                            <button
                              onClick={() => handleOpenEdit(event.id)}
                              className="px-2.5 py-1.5 rounded-lg bg-[#D4AF37]/15 hover:bg-[#D4AF37]/30 border border-[#D4AF37]/40 text-[#F5E7C4] text-xs font-medium transition-colors cursor-pointer flex items-center gap-1"
                              title="Enter/Edit Adjudication"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>Edit</span>
                            </button>

                            {/* One-click Toggle Publish */}
                            {isPublished ? (
                              <button
                                onClick={() => {
                                  unpublishResult(event.id);
                                  showToast(`${event.title} reverted to DRAFT`);
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-medium transition-colors cursor-pointer"
                                title="Revert to Draft"
                              >
                                Unpublish
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  if (!hasWinner) {
                                    handleOpenEdit(event.id);
                                  } else {
                                    publishResult(event.id);
                                    showToast(`${event.title} PUBLISHED to public website`);
                                  }
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 text-xs font-medium transition-colors cursor-pointer"
                                title="Publish Result Live"
                              >
                                Publish
                              </button>
                            )}

                            {/* Quick Sample Demo Fill */}
                            <button
                              onClick={() => {
                                loadDemoResult(event.id);
                                showToast(`Loaded sample result for ${event.title}`);
                              }}
                              className="px-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-[11px] transition-colors cursor-pointer"
                              title="Quick-fill sample test podium"
                            >
                              Demo
                            </button>

                            {/* Clear */}
                            {hasWinner && (
                              <button
                                onClick={() => {
                                  clearResult(event.id);
                                  showToast(`Cleared results for ${event.title}`);
                                }}
                                className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors cursor-pointer"
                                title="Clear results"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: REGISTRATIONS AUDIT ================= */}
      {activeTab === 'registrations' && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-[#090E26] border border-white/10 flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="font-cinzel text-base font-bold text-white flex items-center gap-2">
                <span>Live Registration Submissions</span>
                {loadingRegistrations && (
                  <RefreshCw className="w-3.5 h-3.5 text-[#D4AF37] animate-spin" />
                )}
              </h3>
              <p className="text-xs text-slate-400">
                Audit entries received from individual attendees, captains, and college contingents.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={loadCloudRegistrations}
                disabled={loadingRegistrations}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-200 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 text-[#D4AF37] ${loadingRegistrations ? 'animate-spin' : ''}`} />
                <span>Refresh Cloud Data</span>
              </button>
              <div className="text-xs font-mono text-[#D4AF37]">
                Total Records: {registrations.length}
              </div>
            </div>
          </div>

          {registrations.length === 0 ? (
            <div className="py-16 text-center rounded-2xl bg-[#080D21]/60 border border-white/10">
              <Users className="w-10 h-10 text-slate-500 mx-auto mb-3" />
              <h4 className="text-white font-medium text-sm">No registrations submitted yet</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                When participants complete the registration checkout flow, their entries, college affiliation, and payment verification tags will appear here.
              </p>
            </div>
          ) : (
            <div className="celestial-glass rounded-2xl overflow-hidden border border-white/10 shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/10 bg-black/40 text-[11px] font-mono uppercase tracking-wider text-[#D4AF37]">
                      <th className="py-3 px-4">Reg ID</th>
                      <th className="py-3 px-4">Event Code</th>
                      <th className="py-3 px-4">Primary Contact / Captain</th>
                      <th className="py-3 px-4">Institution</th>
                      <th className="py-3 px-4">Participants</th>
                      <th className="py-3 px-4">Fee Paid</th>
                      <th className="py-3 px-4">Status & UTR</th>
                      <th className="py-3 px-4 text-right">Admin Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {registrations.map((reg) => (
                      <tr key={reg.id} className="hover:bg-white/[0.02]">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-200">
                          {reg.id}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[#E6C57D]">
                          {reg.eventCode}
                          <div className="text-[10px] text-slate-400 font-sans">{reg.eventType}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-white">{reg.participants[0]?.fullName || 'Participant'}</div>
                          <div className="text-slate-400 text-[11px]">{reg.participants[0]?.email || 'N/A'}</div>
                          <div className="text-slate-500 text-[11px] font-mono">{reg.participants[0]?.mobile || 'N/A'}</div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-300">
                          <div>{reg.college?.collegeName || 'N/A'}</div>
                          <div className="text-slate-500 text-[11px]">{reg.college?.city}, {reg.college?.state}</div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-300">
                          {reg.participants.length} member(s)
                        </td>
                        <td className="py-3.5 px-4 font-mono text-emerald-400 font-bold">
                          ₹{reg.totalAmount}
                          {reg.promoCode && (
                            <span className="block text-[10px] text-[#E6C57D] font-normal font-sans">
                              Code: {reg.promoCode} ({reg.discountPercent}% OFF)
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase ${
                            reg.paymentStatus === 'Verified'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : reg.paymentStatus === 'Rejected'
                              ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}>
                            {reg.paymentStatus}
                          </span>
                          <div className="text-[10px] font-mono text-slate-400 mt-1">
                            UTR: {reg.utrNumber || 'N/A'}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            {reg.paymentStatus !== 'Verified' && (
                               <button
                                 type="button"
                                 onClick={() => handleVerifyRegistration(reg.id, 'Verified')}
                                 className="px-2.5 py-1 rounded-md bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-medium transition-colors cursor-pointer"
                                 title="Approve payment & confirm entry"
                               >
                                 Approve
                               </button>
                             )}
                            {reg.paymentStatus !== 'Rejected' && (
                               <button
                                 type="button"
                                 onClick={() => handleVerifyRegistration(reg.id, 'Rejected')}
                                 className="px-2.5 py-1 rounded-md bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/30 text-[11px] transition-colors cursor-pointer"
                                 title="Reject entry or invalid payment"
                               >
                                 Reject
                               </button>
                             )}
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmReg(reg)}
                              className="p-1 rounded-md bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-[11px] transition-colors cursor-pointer"
                              title="Delete duplicate or erroneous registration"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 3: PROMO CODES & DISCOUNTS ================= */}
      {activeTab === 'promocodes' && (
        <div className="space-y-6">
          {/* Header & Create Card */}
          <div className="p-5 rounded-2xl bg-[#090E26] border border-[#D4AF37]/30 celestial-glass shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 flex-wrap gap-2">
              <div>
                <h3 className="font-cinzel text-lg font-bold text-white flex items-center gap-2">
                  <Tag className="w-5 h-5 text-[#D4AF37]" />
                  <span>Promo Code & Discount Management</span>
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Create percentage-based discount codes for festival registrants and toggle them active/inactive instantly.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Realtime Sync Active
                </span>
                <button
                  type="button"
                  onClick={loadPromoCodes}
                  disabled={loadingPromos}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-200 flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-[#D4AF37] ${loadingPromos ? 'animate-spin' : ''}`} />
                  <span>Refresh Codes</span>
                </button>
              </div>
            </div>

            {/* Create New Promo Code Form */}
            <form onSubmit={handleCreatePromo} className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
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
                  className="w-full px-3 py-2 rounded-xl bg-[#050714] border border-white/15 focus:border-[#D4AF37] text-xs font-mono text-white placeholder-slate-500 uppercase focus:outline-none"
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
                    className="w-full px-3 py-2 pr-8 rounded-xl bg-[#050714] border border-white/15 focus:border-[#D4AF37] text-xs font-mono text-white placeholder-slate-500 focus:outline-none"
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
                  placeholder="e.g. 20% Early bird discount offer"
                  className="w-full px-3 py-2 rounded-xl bg-[#050714] border border-white/15 focus:border-[#D4AF37] text-xs text-white placeholder-slate-500 focus:outline-none"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={isCreatingPromo || !newCodeName.trim() || !newCodeDiscount}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#F5E7C4] via-[#E6C57D] to-[#D4AF37] hover:brightness-110 text-[#050714] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isCreatingPromo ? 'Creating...' : 'Create Code'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Promo Codes Table */}
          <div className="celestial-glass rounded-2xl overflow-hidden border border-white/10 shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 bg-black/40 text-[11px] font-mono uppercase tracking-wider text-[#D4AF37]">
                    <th className="py-3 px-4">Code Name</th>
                    <th className="py-3 px-4">Discount Rate</th>
                    <th className="py-3 px-4">Campaign Description</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Total Redemptions</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {promoCodes.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No promo codes found. Use the form above to add your first discount code.
                      </td>
                    </tr>
                  ) : (
                    promoCodes.map((p) => (
                      <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-base text-[#F5E7C4]">
                          {p.code}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-emerald-400 text-sm">
                          {p.discountPercent}% OFF
                        </td>
                        <td className="py-3.5 px-4 text-slate-300">
                          {p.description || 'N/A'}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {p.isActive ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                              <CheckCircle className="w-3 h-3" /> ACTIVE
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-amber-500/20 text-amber-300 border border-amber-500/40">
                              <Clock className="w-3 h-3" /> DEACTIVATED
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono text-slate-200 font-bold">
                          {p.redemptionCount} use(s)
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleTogglePromoStatus(p.id, p.isActive)}
                              className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1 ${
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
                              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 cursor-pointer transition-colors"
                              title="Delete promo code"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 4: OPERATIONS & PRESET CONTROLS ================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-[#090E26] border border-[#D4AF37]/30">
              <h3 className="font-cinzel text-lg font-bold text-white mb-2 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-[#D4AF37]" />
                Event-Wise Public Rules Check
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                The public results system has been configured with strict adherence to festival regulations:
              </p>
              <ul className="text-xs text-slate-300 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Zero College-Wise Ranking:</strong> No college leaderboards or rolling trophy tables appear on the public portal.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Event-Wise Exclusivity:</strong> Every result is displayed purely under its individual event card (12 events total).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>No Invented Winners:</strong> Events without confirmed jury sign-off cleanly display <em>"Results will be announced after the event."</em></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Draft / Published State:</strong> Only results marked <strong>PUBLISHED</strong> are surfaced to attendees.</span>
                </li>
              </ul>
            </div>

            <div className="p-6 rounded-2xl bg-[#090E26] border border-white/10">
              <h3 className="font-cinzel text-lg font-bold text-white mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                Rapid Demonstration Tools
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                Quickly test how the public interface responds between unannounced and published stages:
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    // Publish sample winners for 3 events
                    loadDemoResult('seraphia');
                    loadDemoResult('nrityara');
                    loadDemoResult('starfusion');
                    showToast('Published 3 sample events (Seraphia, Nrityara, Starfusion). Others remain unannounced.');
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#D4AF37]/20 to-[#D4AF37]/10 hover:from-[#D4AF37]/30 hover:to-[#D4AF37]/20 border border-[#D4AF37]/40 text-xs font-bold text-[#F5E7C4] transition-all cursor-pointer text-left flex items-center justify-between"
                >
                  <span>Publish 3 Verified Sample Events (Keep 9 Pending)</span>
                  <ChevronRight className="w-4 h-4 text-[#D4AF37]" />
                </button>

                <button
                  onClick={() => {
                    resetAllResults();
                    showToast('All 12 events reset to unannounced state');
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-300 transition-all cursor-pointer text-left flex items-center justify-between"
                >
                  <span>Reset All to Unannounced ("Announced after event")</span>
                  <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                </button>

                <button
                  onClick={onNavigateToPublicResults}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#121B3E] hover:bg-[#182454] border border-[#D4AF37]/30 text-xs font-semibold text-white transition-all cursor-pointer text-left flex items-center justify-between"
                >
                  <span>Open Public Results Page Now</span>
                  <ExternalLink className="w-3.5 h-3.5 text-[#D4AF37]" />
                </button>
              </div>
            </div>
          </div>

          {/* Supabase Cloud Connection & Diagnostics Card */}
          <div className="p-6 rounded-2xl bg-[#090E26] border border-[#D4AF37]/40 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 mb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-cinzel text-lg font-bold text-white">
                      Supabase Cloud Integration Status
                    </h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase ${
                      isSupabaseConfigured 
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      {isSupabaseConfigured ? 'CLIENT INITIALIZED' : 'OFFLINE FALLBACK'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Official PostgreSQL Database & Authentication layer for Celestia'26
                  </p>
                </div>
              </div>

              <button
                onClick={handleTestSupabaseConnection}
                disabled={testingSupabase}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37]/20 to-[#D4AF37]/10 hover:from-[#D4AF37]/30 hover:to-[#D4AF37]/20 border border-[#D4AF37]/40 text-xs font-bold text-[#F5E7C4] transition-all cursor-pointer flex items-center justify-center gap-2 self-start md:self-auto disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testingSupabase ? 'animate-spin' : ''}`} />
                <span>{testingSupabase ? 'Testing Connection...' : 'Test Cloud Connection'}</span>
              </button>
            </div>

            {/* Test Status Banner */}
            {supabaseTestStatus && (
              <div className={`p-3.5 rounded-xl mb-4 text-xs flex items-start gap-2.5 border ${
                supabaseTestStatus.success
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                  : 'bg-amber-950/40 border-amber-500/40 text-amber-200'
              }`}>
                {supabaseTestStatus.success ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-semibold">
                    {supabaseTestStatus.success ? 'Connection Verified' : 'Connection Check Feedback'}
                  </div>
                  <div className="text-[11px] opacity-90 mt-0.5">
                    {supabaseTestStatus.message}
                  </div>
                </div>
              </div>
            )}

            {/* Connection Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs mb-4">
              <div className="p-3 rounded-xl bg-[#060A1D] border border-white/5">
                <div className="text-[10px] font-mono text-slate-400 uppercase">Project Endpoint</div>
                <div className="font-mono text-white text-[11px] truncate mt-1">
                  https://kzqhvqtntsotfoitxibr.supabase.co
                </div>
                <div className="text-[10px] text-emerald-400 mt-0.5">Cloud instance active</div>
              </div>

              <div className="p-3 rounded-xl bg-[#060A1D] border border-white/5">
                <div className="text-[10px] font-mono text-slate-400 uppercase">Browser Client Key</div>
                <div className="font-mono text-white text-[11px] truncate mt-1">
                  sb_publishable_745...wbq
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Publishable anon scope</div>
              </div>

              <div className="p-3 rounded-xl bg-[#060A1D] border border-white/5">
                <div className="text-[10px] font-mono text-slate-400 uppercase">Security Isolation</div>
                <div className="font-mono text-emerald-400 text-[11px] truncate mt-1">
                  SECRET KEY SAFE
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Never exposed to client</div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#060A1D] border border-white/10 text-xs text-slate-300">
              <div className="font-semibold text-white mb-1 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
                Next Step: Database Tables & Row Level Security (RLS)
              </div>
              <p className="text-[11px] leading-relaxed text-slate-400">
                The client connection is active. When you are ready to migrate live registrations, the SQL schema script will create the tables (<code className="text-[#F5E7C4]">registrations</code>, <code className="text-[#F5E7C4]">team_members</code>, <code className="text-[#F5E7C4]">payments</code>, <code className="text-[#F5E7C4]">results</code>) and configure private storage buckets (<code className="text-[#F5E7C4]">id_cards</code>, <code className="text-[#F5E7C4]">payment_proofs</code>) with strict RLS policies.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ================= RESULT EDITOR MODAL ================= */}
      {editingEventId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="celestial-glass rounded-2xl max-w-2xl w-full border border-[#D4AF37]/40 shadow-2xl p-6 sm:p-8 my-8 relative">
            {/* Modal Header */}
            {(() => {
              const activeEv = EVENTS_DATA.find((e) => e.id === editingEventId);
              return (
                <div className="flex items-start justify-between pb-4 mb-6 border-b border-white/10">
                  <div>
                    <div className="text-[11px] font-mono text-[#D4AF37] uppercase tracking-wider font-semibold">
                      Adjudication & Podium Entry · {activeEv?.code}
                    </div>
                    <h3 className="font-cinzel text-xl sm:text-2xl font-bold text-white mt-0.5">
                      {activeEv?.title}
                    </h3>
                    <div className="text-xs text-slate-300 mt-0.5">
                      {activeEv?.categoryDisplay} · Prize Pool: {activeEv?.prizes?.totalFormatted || 'Official Accolades'}
                    </div>
                  </div>
                  <button
                    onClick={() => setEditingEventId(null)}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              );
            })()}

            {/* Modal Form */}
            <div className="space-y-5 text-xs max-h-[65vh] overflow-y-auto pr-1">
              {/* Publication Status Selector */}
              <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between">
                <div>
                  <span className="font-bold text-white block">Publication State</span>
                  <span className="text-slate-400 text-[11px]">
                    Draft keeps results hidden; Published pushes immediately to public site.
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditFormData((prev) => ({ ...prev, status: 'DRAFT' }))}
                    className={`px-3 py-1.5 rounded-lg font-mono text-xs cursor-pointer transition-all ${
                      editFormData.status === 'DRAFT'
                        ? 'bg-amber-500 text-black font-bold shadow'
                        : 'bg-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    DRAFT
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditFormData((prev) => ({ ...prev, status: 'PUBLISHED' }))}
                    className={`px-3 py-1.5 rounded-lg font-mono text-xs cursor-pointer transition-all ${
                      editFormData.status === 'PUBLISHED'
                        ? 'bg-emerald-500 text-black font-bold shadow'
                        : 'bg-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    PUBLISHED
                  </button>
                </div>
              </div>

              {/* 🥇 WINNER DETAILS */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-[#D4AF37]/10 to-transparent border border-[#D4AF37]/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-cinzel text-sm font-bold text-[#F5E7C4] flex items-center gap-1.5">
                    🥇 WINNER (1st Place)
                  </span>
                  <span className="text-[11px] font-mono text-[#D4AF37]">
                    Official Prize: {EVENTS_DATA.find((e) => e.id === editingEventId)?.prizes?.winner || 'TBA'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-300 uppercase font-mono mb-1">
                      Participant / Team Name *
                    </label>
                    <input
                      type="text"
                      value={editFormData.winnerName}
                      onChange={(e) => setEditFormData({ ...editFormData, winnerName: e.target.value })}
                      placeholder="e.g. Aditya Narayanan"
                      className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-300 uppercase font-mono mb-1">
                      College Name *
                    </label>
                    <input
                      type="text"
                      value={editFormData.winnerCollege}
                      onChange={(e) => setEditFormData({ ...editFormData, winnerCollege: e.target.value })}
                      placeholder="e.g. Madras Medical College"
                      className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                </div>
              </div>

              {/* 🥈 RUNNER-UP DETAILS */}
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-cinzel text-sm font-bold text-slate-200 flex items-center gap-1.5">
                    🥈 RUNNER-UP (2nd Place)
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    Official Prize: {EVENTS_DATA.find((e) => e.id === editingEventId)?.prizes?.runnerUp || 'TBA'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-300 uppercase font-mono mb-1">
                      Participant / Team Name
                    </label>
                    <input
                      type="text"
                      value={editFormData.runnerUpName}
                      onChange={(e) => setEditFormData({ ...editFormData, runnerUpName: e.target.value })}
                      placeholder="e.g. Sneha Varadarajan"
                      className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-300 uppercase font-mono mb-1">
                      College Name
                    </label>
                    <input
                      type="text"
                      value={editFormData.runnerUpCollege}
                      onChange={(e) => setEditFormData({ ...editFormData, runnerUpCollege: e.target.value })}
                      placeholder="e.g. Stanley Medical College"
                      className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                </div>
              </div>

              {/* 🥉 OPTIONAL SECOND RUNNER-UP */}
              <div className="p-3.5 rounded-xl bg-black/30 border border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editFormData.hasSecondRunnerUp}
                      onChange={(e) => setEditFormData({ ...editFormData, hasSecondRunnerUp: e.target.checked })}
                      className="rounded accent-[#D4AF37]"
                    />
                    <span className="font-bold text-slate-300">
                      Include 🥉 Second Runner-Up (3rd Place)
                    </span>
                  </label>
                </div>

                {editFormData.hasSecondRunnerUp && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-[11px] text-slate-300 uppercase font-mono mb-1">
                        Participant / Team Name
                      </label>
                      <input
                        type="text"
                        value={editFormData.secondRunnerUpName}
                        onChange={(e) => setEditFormData({ ...editFormData, secondRunnerUpName: e.target.value })}
                        placeholder="3rd place participant"
                        className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-300 uppercase font-mono mb-1">
                        College Name
                      </label>
                      <input
                        type="text"
                        value={editFormData.secondRunnerUpCollege}
                        onChange={(e) => setEditFormData({ ...editFormData, secondRunnerUpCollege: e.target.value })}
                        placeholder="College name"
                        className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 🎖️ OPTIONAL SPECIAL AWARDS */}
              <div className="p-3.5 rounded-xl bg-black/30 border border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editFormData.hasSpecialAward}
                      onChange={(e) => setEditFormData({ ...editFormData, hasSpecialAward: e.target.checked })}
                      className="rounded accent-[#D4AF37]"
                    />
                    <span className="font-bold text-slate-300">
                      Include 🎖️ Special Jury Award
                    </span>
                  </label>
                </div>

                {editFormData.hasSpecialAward && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase font-mono mb-1">
                        Award Title
                      </label>
                      <input
                        type="text"
                        value={editFormData.specialAwardTitle}
                        onChange={(e) => setEditFormData({ ...editFormData, specialAwardTitle: e.target.value })}
                        placeholder="e.g. Best Vocalist"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-black/50 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase font-mono mb-1">
                        Recipient Name
                      </label>
                      <input
                        type="text"
                        value={editFormData.specialAwardName}
                        onChange={(e) => setEditFormData({ ...editFormData, specialAwardName: e.target.value })}
                        placeholder="Name"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-black/50 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase font-mono mb-1">
                        College Name
                      </label>
                      <input
                        type="text"
                        value={editFormData.specialAwardCollege}
                        onChange={(e) => setEditFormData({ ...editFormData, specialAwardCollege: e.target.value })}
                        placeholder="College"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-black/50 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => setEditingEventId(null)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveResult(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold cursor-pointer border border-white/10"
                >
                  Save as Draft
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveResult(true)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B38F26] text-[#050714] text-xs font-bold uppercase tracking-wider hover:brightness-110 cursor-pointer shadow-md shadow-[#D4AF37]/20 flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Publish Live Now</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Duplicate / Invalid Registration Confirmation Modal */}
      {deleteConfirmReg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#0B1028] border border-rose-500/40 rounded-2xl p-6 max-w-md w-full shadow-2xl relative space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/40 flex items-center justify-center text-rose-400">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-cinzel text-base font-bold text-white">Delete Duplicate Entry</h3>
                <span className="text-xs text-rose-300 font-mono">{deleteConfirmReg.id}</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to delete this registration for <strong>{deleteConfirmReg.participants[0]?.fullName || deleteConfirmReg.teamName}</strong> ({deleteConfirmReg.eventCode})?
              <br /><br />
              <span className="text-amber-300 font-medium block">
                * Note: Deleting this duplicate will NOT alter or shift the registration numbering of other events.
              </span>
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmReg(null)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteReg}
                className="px-4 py-2 rounded-xl font-bold text-xs uppercase text-white bg-rose-600 hover:bg-rose-500 transition-colors cursor-pointer"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Tabulation Footer */}
      <footer className="mt-12 pt-6 pb-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
        <div>
          Celestia'26 · Official Tabulation & Administration Console
        </div>
        <div className="flex items-center gap-1.5 text-slate-300">
          <span className="text-slate-400">Website created by</span>
          <span className="font-semibold text-[#F5E7C4] font-cinzel">Surya Narayan P</span>
        </div>
      </footer>
    </div>
  );
};
