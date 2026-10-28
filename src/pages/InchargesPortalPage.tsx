import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Calendar, 
  CheckCircle, 
  Search, 
  Download, 
  Printer, 
  Phone, 
  MapPin, 
  ShieldCheck, 
  LogOut, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp, 
  Copy, 
  Check, 
  Clock, 
  Lock, 
  MessageCircle, 
  List, 
  Grid, 
  AlertCircle, 
  Eye, 
  X, 
  GraduationCap, 
  Building,
  Award,
  FileText,
  ExternalLink,
  CreditCard
} from 'lucide-react';
import { EVENTS_DATA, EventItem } from '../data/festivalData';
import { RegistrationSubmission, ParticipantMember } from '../types/registration';
import { supabaseRegistrationService } from '../services/supabaseRegistrationService';
import { clearAuthSession } from '../lib/authProfiles';

interface InchargesPortalPageProps {
  onExit: () => void;
  onNavigateToAdmin?: () => void;
}

interface IdProofModalData {
  participant: ParticipantMember;
  teamName: string;
  collegeName: string;
  idUrl: string | null;
}

export const InchargesPortalPage: React.FC<InchargesPortalPageProps> = ({
  onExit,
  onNavigateToAdmin,
}) => {
  const [registrations, setRegistrations] = useState<RegistrationSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEventId, setSelectedEventId] = useState<string>('ALL');
  const [queueFilter, setQueueFilter] = useState<'all' | 'checked_in' | 'awaiting'>('all');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'pending' | 'advance_paid' | 'paid_in_full'>('all');
  const [regTypeFilter, setRegTypeFilter] = useState<'all' | 'individual' | 'combo'>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [showRulesDrawer, setShowRulesDrawer] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // ID Card Viewer Modal State
  const [activeIdModal, setActiveIdModal] = useState<IdProofModalData | null>(null);

  // Payment Proof Modal State
  const [activePaymentModal, setActivePaymentModal] = useState<{
    reg: RegistrationSubmission;
    paymentUrl: string | null;
  } | null>(null);

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return (
      sessionStorage.getItem('celestia_incharges_auth') === 'true' ||
      sessionStorage.getItem('celestia_admin_auth') === 'true' ||
      sessionStorage.getItem('celestia_admin1_auth') === 'true'
    );
  });
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');

  // Event day on-venue check-ins (persisted in localStorage for stage coordinators)
  const [checkins, setCheckins] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('celestia_stage_checkins');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleInchargesLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const trimmed = passwordInput.trim();

    if (trimmed === 'celeincharge@' || trimmed === '24032004psss') {
      setIsAuthenticated(true);
      sessionStorage.setItem('celestia_incharges_auth', 'true');
      sessionStorage.setItem('celestia_active_role', trimmed === '24032004psss' ? 'admin' : 'incharges');
      showToast('Incharges Portal Unlocked');
      loadApprovedRegistrations();
    } else {
      setAuthError('Incorrect password. Please enter the authorized Incharges access key.');
    }
  };

  // Fetch registrations and strictly filter to ADMIN APPROVED
  const loadApprovedRegistrations = async () => {
    try {
      setRefreshing(true);
      const allCloud = await supabaseRegistrationService.fetchAdminRegistrations();
      
      // Strict rule: Only show registrations verified and approved by admin
      const approvedOnly = (allCloud || []).filter((r) => {
        const pStatus = (r.paymentStatus || '').toLowerCase();
        const rStatus = (r.registrationStatus || '').toLowerCase();
        const isApproved = pStatus === 'verified' || rStatus === 'confirmed' || pStatus === 'approved';
        const isRejected = pStatus === 'rejected' || rStatus === 'rejected';
        const isIncomplete = pStatus === 'not complete' || pStatus === 'hold';
        return isApproved && !isRejected && !isIncomplete;
      });

      // Canonical event & collegiate resolution to guarantee 100% accurate classification
      const sanitized = approvedOnly.map((r) => {
        const matched = EVENTS_DATA.find((e) =>
          e.id.toLowerCase() === r.eventId?.toLowerCase() ||
          e.code.toLowerCase() === r.eventCode?.toLowerCase() ||
          e.title.toLowerCase() === r.eventTitle?.toLowerCase()
        );

        const collegeName = (r.college?.collegeName || '').trim();
        const collegeNameLower = collegeName.toLowerCase();
        
        // Strict host detection: Only Srinivasan Medical College and Hospital Trichy
        const isSmchHost = 
          Boolean(r.isHostCollege) || 
          Boolean(r.college?.isHostCollege) ||
          collegeNameLower.includes('srinivasan') ||
          (Boolean(r.college?.hostRegisterNumber) && !collegeNameLower.includes('medical') && !collegeNameLower.includes('college'));

        // Host students are NEVER an external college delegation
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
          eventId: matched ? matched.id : r.eventId,
          eventCode: matched ? matched.code : r.eventCode,
          eventTitle: matched ? matched.title : r.eventTitle,
          eventCategory: matched ? matched.categoryDisplay : r.eventCategory,
          eventType: matched ? matched.type : r.eventType,
          venue: matched ? matched.venue : r.venue,
          isHostCollege: isSmchHost,
          college: updatedCollege,
        };
      });

      setRegistrations(sanitized);
    } catch (err) {
      console.error('Error loading approved registrations for incharges:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadApprovedRegistrations();
  }, []);

  const toggleCheckin = (regCode: string) => {
    setCheckins((prev) => {
      const updated = { ...prev, [regCode]: !prev[regCode] };
      try {
        localStorage.setItem('celestia_stage_checkins', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    showToast(`Registration Code ${code} copied`);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleLogout = () => {
    clearAuthSession();
    onExit();
  };

  // Map each event with its approved registration count
  const eventStats = useMemo(() => {
    const counts: Record<string, number> = {};
    const participantCounts: Record<string, number> = {};

    EVENTS_DATA.forEach((ev) => {
      counts[ev.id] = 0;
      participantCounts[ev.id] = 0;
    });

    registrations.forEach((reg) => {
      const evId = reg.eventId || '';
      const matched = EVENTS_DATA.find((e) => e.id === evId || e.code.toUpperCase() === reg.eventCode?.toUpperCase());
      const key = matched ? matched.id : evId;
      if (counts[key] !== undefined) {
        counts[key] += 1;
        participantCounts[key] += reg.participantCount || reg.participants?.length || 1;
      }
    });

    return { counts, participantCounts };
  }, [registrations]);

  // Selected event metadata
  const currentEvent = useMemo(() => {
    if (selectedEventId === 'ALL') return null;
    return EVENTS_DATA.find((e) => e.id === selectedEventId) || null;
  }, [selectedEventId]);

  // Registrations matching the selected event, regType, and search query
  const eventFilteredRegistrations = useMemo(() => {
    return registrations.filter((reg) => {
      const ev = EVENTS_DATA.find((e) => e.id === reg.eventId || e.code.toUpperCase() === reg.eventCode?.toUpperCase());

      // Filter by Event
      if (selectedEventId !== 'ALL') {
        if (!ev || ev.id !== selectedEventId) return false;
      }

      // Filter by Registration Type (All vs Individual vs Combo)
      const isCombo = Boolean(reg.comboId || reg.comboGroupId || reg.comboName);
      if (regTypeFilter === 'combo' && !isCombo) return false;
      if (regTypeFilter === 'individual' && isCombo) return false;

      // Filter by Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const code = (reg.registrationCode || reg.id || '').toLowerCase();
        const teamMatch = (reg.teamName || '').toLowerCase().includes(q);
        const collegeMatch = (reg.college?.collegeName || '').toLowerCase().includes(q);
        const cityMatch = (reg.college?.city || '').toLowerCase().includes(q);
        const hostRegMatch = (reg.college?.hostRegisterNumber || '').toLowerCase().includes(q);
        const eventTitleMatch = (ev?.title || reg.eventTitle || '').toLowerCase().includes(q);
        const comboMatch = (reg.comboName || '').toLowerCase().includes(q);
        const participantMatch = reg.participants?.some(
          (p) =>
            p.fullName?.toLowerCase().includes(q) ||
            p.mobile?.toLowerCase().includes(q) ||
            p.email?.toLowerCase().includes(q)
        );

        return Boolean(code.includes(q) || teamMatch || collegeMatch || cityMatch || hostRegMatch || eventTitleMatch || comboMatch || participantMatch);
      }

      return true;
    });
  }, [registrations, selectedEventId, regTypeFilter, searchQuery]);

  // Stage Queue counts for segmented filter tabs
  const queueCounts = useMemo(() => {
    const total = eventFilteredRegistrations.length;
    const checkedIn = eventFilteredRegistrations.filter((r) => Boolean(checkins[r.registrationCode || r.id])).length;
    const awaiting = total - checkedIn;
    return { total, checkedIn, awaiting };
  }, [eventFilteredRegistrations, checkins]);

  // Financial & Payment Balance counts for Incharges Desk
  const paymentCounts = useMemo(() => {
    let pendingCount = 0;
    let advanceCount = 0;
    let fullCount = 0;
    let totalOutstanding = 0;
    let totalCollected = 0;
    const processedCombos = new Set<string>();

    eventFilteredRegistrations.forEach((r) => {
      const tot = Number(r.totalAmount) || 0;
      const pd = Number(r.paidAmount !== undefined ? r.paidAmount : tot);
      const pend = Math.max(0, tot - pd);
      const st = r.paymentStatus || (pend === 0 && tot > 0 ? 'Paid in Full' : (pd > 0 ? 'Advance Paid' : 'Pending'));

      if (st === 'Paid in Full' || (pd >= tot && tot > 0)) {
        fullCount++;
      } else if (st === 'Advance Paid' || pd > 0) {
        advanceCount++;
      } else {
        pendingCount++;
      }

      if (r.comboGroupId) {
        if (!processedCombos.has(r.comboGroupId)) {
          processedCombos.add(r.comboGroupId);
          totalCollected += pd;
          totalOutstanding += pend;
        }
      } else {
        totalCollected += pd;
        totalOutstanding += pend;
      }
    });

    return { pendingCount, advanceCount, fullCount, totalOutstanding, totalCollected };
  }, [eventFilteredRegistrations]);

  // Final filtered registrations after applying stage queue arrival filter AND payment status filter
  const finalRegistrations = useMemo(() => {
    return eventFilteredRegistrations.filter((r) => {
      // Stage arrival queue filter
      if (queueFilter === 'checked_in' && !checkins[r.registrationCode || r.id]) return false;
      if (queueFilter === 'awaiting' && checkins[r.registrationCode || r.id]) return false;

      // Payment balance status filter
      if (paymentFilter !== 'all') {
        const tot = Number(r.totalAmount) || 0;
        const pd = Number(r.paidAmount !== undefined ? r.paidAmount : tot);
        const pend = Math.max(0, tot - pd);
        const st = r.paymentStatus || (pend === 0 && tot > 0 ? 'Paid in Full' : (pd > 0 ? 'Advance Paid' : 'Pending'));

        if (paymentFilter === 'pending' && st !== 'Pending' && st !== 'Submitted') return false;
        if (paymentFilter === 'advance_paid' && st !== 'Advance Paid') return false;
        if (paymentFilter === 'paid_in_full' && st !== 'Paid in Full' && st !== 'Verified') return false;
      }

      return true;
    });
  }, [eventFilteredRegistrations, queueFilter, paymentFilter, checkins]);

  // Helper to open Student ID Proof Modal
  const openIdProofModal = (participant: ParticipantMember, reg: RegistrationSubmission) => {
    const rawPath = participant.idCardFileData || participant.idCardStoragePath;
    const resolvedUrl = supabaseRegistrationService.resolveMediaUrl(rawPath, 'id-cards');
    setActiveIdModal({
      participant,
      teamName: reg.teamName || 'Solo Performer',
      collegeName: reg.college?.collegeName || 'College Student',
      idUrl: resolvedUrl,
    });
  };

  // Helper to open Payment Proof Slip Modal
  const openPaymentModal = (reg: RegistrationSubmission) => {
    const rawPath = reg.paymentScreenshotData || reg.paymentScreenshotPath;
    const resolvedUrl = supabaseRegistrationService.resolveMediaUrl(rawPath, 'payment-proofs');
    setActivePaymentModal({
      reg,
      paymentUrl: resolvedUrl,
    });
  };

  // Helper to generate WhatsApp summoning URL
  const getWhatsAppLink = (mobile: string | undefined, captainName: string, eventTitle: string) => {
    if (!mobile) return '#';
    const cleanNumber = mobile.replace(/\D/g, '');
    const phoneWithCode = cleanNumber.length === 10 ? `91${cleanNumber}` : cleanNumber;
    const message = encodeURIComponent(
      `Hello ${captainName}, this is the Celestia'26 ${eventTitle} Event In-Charge. Your event slot is approaching! Please report immediately to the Backstage Green Room with your team members.`
    );
    return `https://wa.me/${phoneWithCode}?text=${message}`;
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (finalRegistrations.length === 0) {
      showToast('No registrations in current view to export');
      return;
    }

    const headers = [
      'Call Number',
      'Registration Code',
      'Event Title',
      'Event Code',
      'Team / Solo Name',
      'College Name',
      'College City',
      'Participant Count',
      'Primary Contact Name',
      'Contact Mobile',
      'All Participants',
      'Stage Check-in',
    ];

    const rows = finalRegistrations.map((r, idx) => {
      const ev = EVENTS_DATA.find((e) => e.id === r.eventId || e.code.toUpperCase() === r.eventCode?.toUpperCase());
      const leader = r.participants?.[0];
      const memberList = (r.participants || [])
        .map((p, i) => `${i + 1}. ${p.fullName} (${p.role || 'Member'}, ${p.mobile || 'No Mobile'})`)
        .join('; ');
      const code = r.registrationCode || r.id;

      return [
        idx + 1,
        code,
        ev?.title || r.eventTitle || 'Event',
        ev?.code || r.eventCode || '',
        `"${(r.teamName || 'Solo Entry').replace(/"/g, '""')}"`,
        `"${(r.college?.collegeName || '').replace(/"/g, '""')}"`,
        `"${(r.college?.city || '').replace(/"/g, '""')}"`,
        r.participants?.length || 1,
        `"${(leader?.fullName || '').replace(/"/g, '""')}"`,
        leader?.mobile || '',
        `"${memberList.replace(/"/g, '""')}"`,
        checkins[code] ? 'Checked In' : 'Awaiting Arrival',
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Celestia26_StageRoster_${selectedEventId !== 'ALL' ? selectedEventId : 'AllEvents'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${finalRegistrations.length} approved records to CSV`);
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isAuthenticated) {
    return (
      <div className="relative z-10 pt-20 sm:pt-28 pb-12 sm:pb-24 px-3 sm:px-6 lg:px-8 max-w-md mx-auto min-h-[70vh] flex items-center justify-center">
        <div className="w-full celestial-glass rounded-2xl p-6 sm:p-8 border border-emerald-500/40 shadow-2xl relative overflow-hidden">
          <div className="text-center mb-6">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300 mb-4">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <span className="text-[11px] font-mono tracking-widest uppercase text-emerald-400 block font-semibold mb-1">
              APPROVED STAGE CALL DESK
            </span>
            <h2 className="font-cinzel text-2xl font-bold text-white tracking-wide">
              Event Incharges Portal
            </h2>
            <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
              Official backstage portal for Celestia'26 student coordinators to manage verified rosters and stage attendance.
            </p>
          </div>

          <form onSubmit={handleInchargesLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase text-slate-300 mb-1.5">
                Incharges Access Password
              </label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Enter authorized password"
                className="w-full px-4 py-2.5 rounded-xl bg-[#070B1C]/90 border border-white/15 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                autoFocus
              />
            </div>

            {authError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
                {authError}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider text-[#050714] bg-gradient-to-r from-emerald-300 via-emerald-400 to-[#D4AF37] hover:brightness-110 transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
            >
              Access Incharges Desk
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-white/10 text-center">
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

  return (
    <div className="relative z-10 pt-20 sm:pt-28 pb-16 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto print:p-0 print:pt-2">
      
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#101736] border border-[#D4AF37] text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-medium animate-fade-in">
          <CheckCircle className="w-4 h-4 text-[#D4AF37]" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Banner / Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-5 border-b border-white/10 print:hidden">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              INCHARGES DESK
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-blue-500/15 border border-blue-500/30 text-blue-300">
              <Lock className="w-3 h-3 text-blue-300" />
              <span>Read-Only Official Roster</span>
            </span>
          </div>
          <h1 className="font-cinzel text-2xl sm:text-3xl font-extrabold text-white tracking-wide">
            Event Stage Call & Roster Desk
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            View verified participants, inspect student ID proofs, summon captains via WhatsApp/Call, and track stage attendance.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={loadApprovedRegistrations}
            disabled={refreshing}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-200 transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
            title="Refresh database"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#D4AF37] ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Syncing...' : 'Refresh'}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-200 transition-colors flex items-center gap-2 cursor-pointer"
            title="Print Official Stage Attendance Sheet"
          >
            <Printer className="w-3.5 h-3.5 text-blue-400" />
            <span>Print Call Sheet</span>
          </button>



          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-200 transition-colors flex items-center gap-2 cursor-pointer"
            title="Export CSV"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>


          <button
            type="button"
            onClick={handleLogout}
            className="px-3 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/35 text-xs font-medium text-rose-300 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Printable Sheet Header (Only visible when printing) */}
      <div className="hidden print:block mb-6 border-b pb-4 text-black">
        <h1 className="text-xl font-bold uppercase">Celestia'26 · Official Event Stage Call Sheet</h1>
        <p className="text-xs">
          Event: {currentEvent ? `${currentEvent.title} (${currentEvent.code})` : 'All Approved Events'} · 
          Total Approved: {finalRegistrations.length} Teams · 
          Printed on: {new Date().toLocaleString()}
        </p>
      </div>

      {/* Easy Event Selector Bar */}
      <div className="my-5 p-4 sm:p-5 rounded-2xl celestial-glass border border-[#D4AF37]/30 shadow-xl space-y-4 print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <label className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider block mb-1">
              Select Your Event
            </label>
            <p className="text-xs text-slate-400">
              Pick your assigned event to instantly focus on its stage roster, timings, and coordinator contacts.
            </p>
          </div>

          {/* Large Dropdown Selector */}
          <div className="sm:w-80">
            <select
              value={selectedEventId}
              onChange={(e) => {
                setSelectedEventId(e.target.value);
                setQueueFilter('all');
              }}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#060919] border-2 border-[#D4AF37]/60 text-sm font-semibold text-white focus:outline-none focus:border-[#D4AF37] cursor-pointer"
            >
              <option value="ALL">Show All Events ({registrations.length} Approved Teams)</option>
              {EVENTS_DATA.map((ev, idx) => (
                <option key={ev.id} value={ev.id}>
                  #{idx + 1} {ev.code} — {ev.title} ({eventStats.counts[ev.id] || 0} Teams)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Selected Event Briefing Banner */}
        {currentEvent && (
          <div className="p-4 rounded-xl bg-[#0A122C]/90 border border-purple-500/40 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded font-mono text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                    #{EVENTS_DATA.indexOf(currentEvent) + 1} {currentEvent.code}
                  </span>
                  <h3 className="font-cinzel text-lg font-bold text-white tracking-wide">
                    {currentEvent.title}
                  </h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-slate-300 font-mono">
                    {currentEvent.type}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-300 mt-1 flex-wrap font-mono">
                  <span>Venue: <strong className="text-white">{currentEvent.venue}</strong></span>
                  <span>·</span>
                  <span>Time Limit: <strong className="text-[#E6C57D]">{currentEvent.duration}</strong></span>
                  <span>·</span>
                  <span>Fee: <strong className="text-emerald-400">{currentEvent.registrationFee}</strong></span>
                </div>
              </div>

              {/* Event Metrics Pills */}
              <div className="flex items-center gap-2 font-mono text-xs shrink-0">
                <div className="px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-center">
                  <span className="text-[10px] text-slate-400 block uppercase">Approved Teams</span>
                  <strong className="text-white text-sm">{eventFilteredRegistrations.length}</strong>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-center">
                  <span className="text-[10px] text-emerald-400 block uppercase">Checked In</span>
                  <strong className="text-emerald-300 text-sm">{queueCounts.checkedIn}</strong>
                </div>
              </div>
            </div>

            {/* Event Incharges Contacts */}
            <div className="flex items-center justify-between text-xs flex-wrap gap-2 pt-1">
              <div className="flex items-center gap-2 text-slate-300">
                <Users className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span className="font-medium text-slate-400">Event In-Charges:</span>
                <span className="text-white">
                  {(currentEvent.incharges || []).map((inc) => `${inc.name} (${inc.phone})`).join(' · ') || 'Assigned Coordinators'}
                </span>
              </div>

              {/* Rules & Criteria Toggle Button */}
              <button
                type="button"
                onClick={() => setShowRulesDrawer(!showRulesDrawer)}
                className="text-xs text-[#D4AF37] hover:underline flex items-center gap-1 cursor-pointer font-medium"
              >
                <span>{showRulesDrawer ? 'Hide Rules & Criteria' : 'View Rules & Judging Criteria'}</span>
                {showRulesDrawer ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Collapsible Rules Drawer */}
            {showRulesDrawer && (
              <div className="p-3.5 rounded-xl bg-black/60 border border-white/10 mt-2 space-y-3 text-xs">
                <div>
                  <h4 className="font-bold text-[#E6C57D] uppercase font-mono text-[11px] mb-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-[#E6C57D]" />
                    Official Rules & Regulations:
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px] leading-relaxed">
                    {currentEvent.rules.map((rule, idx) => (
                      <li key={idx} className={rule.includes('time limit') ? 'text-amber-300 font-semibold' : ''}>
                        {rule}
                      </li>
                    ))}
                  </ul>
                </div>

                {currentEvent.judgingCriteria && currentEvent.judgingCriteria.length > 0 && (
                  <div className="pt-2 border-t border-white/10">
                    <h4 className="font-bold text-emerald-400 uppercase font-mono text-[11px] mb-1.5 flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-emerald-400" />
                      Judging Criteria:
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {currentEvent.judgingCriteria.map((crit, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-mono">
                          {crit}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Registration Format Filter Tabs (All / Individual / Combo Packages) */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-white/10">
          <div className="flex items-center gap-1.5 bg-[#050816] p-1 rounded-xl border border-[#D4AF37]/30">
            <span className="text-[10px] text-slate-400 font-mono px-2 uppercase font-bold tracking-wider">Format:</span>
            <button
              type="button"
              onClick={() => setRegTypeFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                regTypeFilter === 'all'
                  ? 'bg-white/20 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Formats ({registrations.length})
            </button>
            <button
              type="button"
              onClick={() => setRegTypeFilter('individual')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                regTypeFilter === 'individual'
                  ? 'bg-blue-500/25 text-blue-300 border border-blue-500/40 font-bold'
                  : 'text-slate-400 hover:text-blue-300'
              }`}
            >
              👤 Individual
            </button>
            <button
              type="button"
              onClick={() => setRegTypeFilter('combo')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                regTypeFilter === 'combo'
                  ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40 font-bold'
                  : 'text-slate-400 hover:text-amber-300'
              }`}
            >
              ⚡ Combo Packages
            </button>
          </div>
        </div>

        {/* Payment Balance Status Segmented Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-white/10">
          <div className="flex items-center gap-1.5 bg-[#050816] p-1 rounded-xl border border-amber-500/40">
            <span className="text-[10px] text-amber-300 font-mono px-2 uppercase font-bold tracking-wider">Payment Balance:</span>
            <button
              type="button"
              onClick={() => setPaymentFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                paymentFilter === 'all'
                  ? 'bg-white/20 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Balances
            </button>
            <button
              type="button"
              onClick={() => setPaymentFilter('pending')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                paymentFilter === 'pending'
                  ? 'bg-rose-500/25 text-rose-300 border border-rose-500/40 font-bold'
                  : 'text-slate-400 hover:text-rose-300'
              }`}
            >
              🔴 Unpaid ({paymentCounts.pendingCount})
            </button>
            <button
              type="button"
              onClick={() => setPaymentFilter('advance_paid')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                paymentFilter === 'advance_paid'
                  ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40 font-bold'
                  : 'text-slate-400 hover:text-amber-300'
              }`}
            >
              🟡 Advance Paid ({paymentCounts.advanceCount})
            </button>
            <button
              type="button"
              onClick={() => setPaymentFilter('paid_in_full')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                paymentFilter === 'paid_in_full'
                  ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 font-bold'
                  : 'text-slate-400 hover:text-emerald-300'
              }`}
            >
              🟢 Paid in Full ({paymentCounts.fullCount})
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-emerald-400">
              Collected: <strong>₹{paymentCounts.totalCollected.toLocaleString('en-IN')}</strong>
            </span>
            <span>·</span>
            <span className="text-amber-300">
              Outstanding Balance: <strong className="text-amber-400 font-bold">₹{paymentCounts.totalOutstanding.toLocaleString('en-IN')}</strong>
            </span>
          </div>
        </div>

        {/* Feature 3: Sleek Stage Queue Segmented Controls (All / Checked-In / Awaiting Arrival) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1 border-t border-white/10">
          <div className="flex items-center gap-1.5 bg-[#050816] p-1 rounded-xl border border-white/10">
            <button
              type="button"
              onClick={() => setQueueFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                queueFilter === 'all'
                  ? 'bg-white/15 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>All Teams</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/40 font-mono text-slate-300">
                {queueCounts.total}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setQueueFilter('checked_in')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                queueFilter === 'checked_in'
                  ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 font-bold'
                  : 'text-slate-400 hover:text-emerald-300'
              }`}
            >
              <Check className="w-3 h-3 text-emerald-400" />
              <span>Checked In</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-950/60 font-mono text-emerald-300">
                {queueCounts.checkedIn}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setQueueFilter('awaiting')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                queueFilter === 'awaiting'
                  ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40 font-bold'
                  : 'text-slate-400 hover:text-amber-300'
              }`}
            >
              <Clock className="w-3 h-3 text-amber-400" />
              <span>Awaiting Arrival</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-950/60 font-mono text-amber-300">
                {queueCounts.awaiting}
              </span>
            </button>
          </div>

          {/* View Mode Toggle: Cards vs Table */}
          <div className="flex items-center gap-1 bg-[#050816] p-1 rounded-xl border border-white/10 shrink-0 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-[#D4AF37] text-black font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Cards View</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-[#D4AF37] text-black font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Call Sheet Table</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by participant name, phone, team name, college, or register number..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#060919] border border-white/15 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-[#D4AF37]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Roster Display */}
      {loading ? (
        <div className="p-16 text-center celestial-glass rounded-2xl border border-white/10">
          <RefreshCw className="w-8 h-8 text-[#D4AF37] animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-300 font-mono">Loading approved event participants...</p>
        </div>
      ) : finalRegistrations.length === 0 ? (
        <div className="p-16 text-center celestial-glass rounded-2xl border border-white/10">
          <CheckCircle className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <h3 className="font-cinzel text-lg font-bold text-white mb-1">
            No Teams Found in this View
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            {queueFilter === 'checked_in'
              ? 'No teams have been marked as checked-in yet. Use the "Mark Arrival" button when teams report backstage.'
              : queueFilter === 'awaiting'
              ? 'Great news! All teams in this event have checked-in on stage.'
              : 'No approved registrations match your selected filters.'}
          </p>
          {queueFilter !== 'all' && (
            <button
              type="button"
              onClick={() => setQueueFilter('all')}
              className="mt-4 px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-white cursor-pointer font-medium"
            >
              Show All Teams
            </button>
          )}
        </div>
      ) : viewMode === 'table' ? (
        /* ------------------------------------------------------------- */
        /* VIEW 1: COMPACT CALL SHEET TABLE (Desk & Laptop Friendly)      */
        /* ------------------------------------------------------------- */
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#06091A] shadow-2xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0B122C] text-slate-300 font-mono text-[11px] uppercase tracking-wider border-b border-white/10">
              <tr>
                <th className="py-3 px-3 text-center">Lot</th>
                <th className="py-3 px-3">Reg Code</th>
                <th className="py-3 px-3">Team / Participant</th>
                <th className="py-3 px-3">College & City</th>
                <th className="py-3 px-3">Captain Contact</th>
                <th className="py-3 px-3">Roster Members & ID Proof</th>
                <th className="py-3 px-3 text-center">Stage Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {finalRegistrations.map((reg, idx) => {
                const code = reg.registrationCode || reg.id;
                const isCheckedIn = Boolean(checkins[code]);
                const leader = reg.participants?.[0];
                const members = reg.participants || [];

                return (
                  <tr
                    key={code}
                    className={`hover:bg-white/5 transition-colors ${
                      isCheckedIn ? 'bg-emerald-950/20' : ''
                    }`}
                  >
                    {/* Lot Sequence Number */}
                    <td className="py-3 px-3 text-center font-mono font-bold text-[#D4AF37] text-sm">
                      #{idx + 1}
                    </td>

                    {/* Registration Code */}
                    <td className="py-3 px-3 font-mono font-semibold text-white whitespace-nowrap">
                      {code}
                    </td>

                    {/* Team Name */}
                    <td className="py-3 px-3">
                      <div className="font-bold text-white">{reg.teamName || 'Solo Entry'}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {reg.eventTitle} ({reg.eventCode})
                      </div>
                      {(reg.comboName || reg.comboId || reg.comboGroupId) && (
                        <div className="mt-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-extrabold bg-amber-500/25 text-amber-300 border border-amber-400/60 shadow-sm">
                            ⚡ COMBO CODE: {reg.comboId ? reg.comboId.toUpperCase() : 'COMBO'} ({reg.comboName || 'Combo Offer'})
                          </span>
                        </div>
                      )}
                    </td>

                    {/* College & Location */}
                    <td className="py-3 px-3">
                      <div className="text-slate-200 font-medium">{reg.college?.collegeName || 'N/A'}</div>
                      <div className="text-[10px] text-slate-400">
                        {[reg.college?.city, reg.college?.state].filter(Boolean).join(', ')}
                      </div>
                    </td>

                    {/* Captain Contact with 1-Tap WhatsApp, Call & Payment Proof */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="text-white font-medium">{leader?.fullName || 'N/A'}</div>
                      {leader?.mobile ? (
                        <div className="flex items-center gap-2 mt-1">
                          <a
                            href={`tel:${leader.mobile}`}
                            className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:underline font-mono"
                            title="Call Captain"
                          >
                            <Phone className="w-3 h-3 text-emerald-400" />
                            <span>{leader.mobile}</span>
                          </a>

                          <a
                            href={getWhatsAppLink(leader.mobile, leader.fullName, reg.eventTitle)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40"
                            title="Summon on WhatsApp"
                          >
                            <MessageCircle className="w-3 h-3 text-emerald-300" />
                          </a>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-[10px]">No phone</span>
                      )}

                      {/* Payment Slip Button */}
                      <button
                        type="button"
                        onClick={() => openPaymentModal(reg)}
                        className="mt-1.5 px-2 py-0.5 rounded bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/35 text-[10px] font-mono text-emerald-300 flex items-center gap-1 cursor-pointer transition-colors"
                        title="View Payment Proof Slip"
                      >
                        <CreditCard className="w-3 h-3 text-emerald-400" />
                        <span>Payment Slip</span>
                      </button>
                    </td>

                    {/* Feature 1: Members List with View ID Button */}
                    <td className="py-3 px-3">
                      <div className="text-[10px] text-slate-400 font-mono mb-1">
                        Headcount: <strong className="text-white">{reg.participantCount || members.length || 1}</strong>
                      </div>
                      <div className="text-[11px] text-slate-300 space-y-1">
                        {members.map((m, i) => (
                          <div key={i} className="flex items-center justify-between gap-2 max-w-xs">
                            <span className="truncate">
                              <span className="text-slate-400 font-mono">{i + 1}.</span> {m.fullName}
                            </span>
                            <button
                              type="button"
                              onClick={() => openIdProofModal(m, reg)}
                              className="px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-[#D4AF37] text-[10px] flex items-center gap-1 shrink-0 cursor-pointer font-mono"
                              title="Inspect Student College ID Proof"
                            >
                              <Eye className="w-3 h-3" />
                              <span>ID</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    </td>

                    {/* Stage Check-In Toggle */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => toggleCheckin(code)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                          isCheckedIn
                            ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20'
                            : 'bg-white/10 hover:bg-white/15 text-slate-300 border border-white/15'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{isCheckedIn ? 'Checked In' : 'Mark Arrival'}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* ------------------------------------------------------------- */
        /* VIEW 2: LARGE CARDS VIEW (Stage & Mobile Friendly)             */
        /* ------------------------------------------------------------- */
        <div className="space-y-4">
          {finalRegistrations.map((reg, idx) => {
            const ev = EVENTS_DATA.find((e) => e.id === reg.eventId || e.code.toUpperCase() === reg.eventCode?.toUpperCase());
            const code = reg.registrationCode || reg.id;
            const isCheckedIn = Boolean(checkins[code]);
            const leader = reg.participants?.[0];
            const members = reg.participants || [];
            const college = reg.college;

            return (
              <div
                key={code}
                className={`rounded-2xl p-4 sm:p-5 border transition-all ${
                  isCheckedIn 
                    ? 'border-emerald-500/60 bg-[#07162C]/80 shadow-lg shadow-emerald-500/10' 
                    : 'border-white/10 bg-[#06091A] hover:border-[#D4AF37]/40'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  {/* Left Column: Lot Order, Team, College, and Event */}
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Big Lot Call Sequence Tag */}
                      <span className="px-2.5 py-0.5 rounded-md font-mono text-xs font-extrabold bg-[#D4AF37] text-black">
                        CALL #{idx + 1}
                      </span>
                      <span className="px-2 py-0.5 rounded font-mono text-xs font-semibold bg-white/10 text-slate-300">
                        {ev?.title || reg.eventTitle} ({ev?.code || reg.eventCode})
                      </span>
                      {(reg.comboName || reg.comboId || reg.comboGroupId) && (
                        <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-extrabold bg-amber-500/25 text-amber-300 border border-amber-400/60 flex items-center gap-1 shadow-sm">
                          <span>⚡ COMBO CODE: {reg.comboId ? reg.comboId.toUpperCase() : 'COMBO'} ({reg.comboName || 'Combo Offer'})</span>
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-emerald-400" />
                        <span>Approved</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-cinzel text-xl sm:text-2xl font-bold text-white tracking-wide">
                        {reg.teamName || 'Solo Performer'}
                      </h3>
                      <button
                        type="button"
                        onClick={() => handleCopyCode(code)}
                        className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-[#D4AF37] flex items-center gap-1 cursor-pointer transition-colors"
                        title="Copy Code"
                      >
                        <span>{code}</span>
                        {copiedCode === code ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3 text-slate-400" />
                        )}
                      </button>
                    </div>

                    {/* College Details */}
                    <div className="flex items-center gap-3 text-xs text-slate-300 flex-wrap">
                      <div className="flex items-center gap-1 text-slate-200">
                        <Building className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span className="font-semibold">{college?.collegeName || 'N/A'}</span>
                      </div>
                      {college?.city && (
                        <div className="flex items-center gap-1 text-slate-400 text-[11px]">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{[college.city, college.state].filter(Boolean).join(', ')}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Captain Calling, Payment Slip & Stage Check-In */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0 flex-wrap">
                    {/* View Payment Proof Slip */}
                    <button
                      type="button"
                      onClick={() => openPaymentModal(reg)}
                      className="px-3 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      title="Inspect Payment Proof Slip"
                    >
                      <CreditCard className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Payment Slip</span>
                    </button>

                    {/* 1-Tap Captain WhatsApp Summoning */}
                    {leader?.mobile && (
                      <a
                        href={getWhatsAppLink(leader.mobile, leader.fullName, ev?.title || reg.eventTitle)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                        title="Summon Captain on WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4 text-emerald-300" />
                        <span>WhatsApp Captain</span>
                      </a>
                    )}

                    {/* 1-Tap Direct Call */}
                    {leader?.mobile && (
                      <a
                        href={`tel:${leader.mobile}`}
                        className="px-3.5 py-2.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                        title="Call Captain"
                      >
                        <Phone className="w-4 h-4 text-blue-300" />
                        <span>Call</span>
                      </a>
                    )}

                    {/* Stage Check-In Toggle */}
                    <button
                      type="button"
                      onClick={() => toggleCheckin(code)}
                      className={`px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        isCheckedIn
                          ? 'bg-emerald-500 text-black hover:bg-emerald-400 shadow-md shadow-emerald-500/20'
                          : 'bg-white/10 hover:bg-white/15 text-slate-200 border border-white/15'
                      }`}
                    >
                      <Check className={`w-4 h-4 ${isCheckedIn ? 'text-black' : 'text-slate-400'}`} />
                      <span>{isCheckedIn ? 'Checked-In on Stage' : 'Mark Arrival'}</span>
                    </button>
                  </div>
                </div>

                {/* Feature 1: Participant Roster with View ID Proof button */}
                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-2.5">
                    <span className="uppercase tracking-wider font-semibold text-slate-300">
                      Team Roster ({reg.participantCount || members.length || 1} Student{(reg.participantCount || members.length || 1) !== 1 ? 's' : ''})
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Primary Contact: {leader?.fullName || 'N/A'} {leader?.mobile ? `(${leader.mobile})` : ''}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {members.map((member, mIdx) => (
                      <div
                        key={mIdx}
                        className="p-3 rounded-xl bg-[#030612] border border-white/10 flex flex-col justify-between space-y-2"
                      >
                        <div className="flex items-start justify-between gap-1.5">
                          <span className="text-xs font-bold text-white">
                            {member.fullName}
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                            mIdx === 0 
                              ? 'bg-[#D4AF37]/20 text-[#F5E7C4] border border-[#D4AF37]/30 font-semibold' 
                              : 'bg-white/5 text-slate-400'
                          }`}>
                            {member.role || (mIdx === 0 ? 'Leader' : 'Member')}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1 border-t border-white/5">
                          <div className="flex items-center gap-2">
                            {member.gender && <span>{member.gender}</span>}
                            {member.age && <span>{member.age} yrs</span>}
                          </div>

                          {/* Feature 1: Direct ID Proof Modal Trigger */}
                          <button
                            type="button"
                            onClick={() => openIdProofModal(member, reg)}
                            className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/15 border border-white/15 text-[#D4AF37] hover:text-[#F5E7C4] text-[10px] flex items-center gap-1 font-mono cursor-pointer transition-colors"
                            title="Inspect Student College ID Proof"
                          >
                            <Eye className="w-3 h-3" />
                            <span>View ID</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Feature 1: Student College ID Proof Inspection Modal */}
      {activeIdModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-fade-in"
          onClick={() => setActiveIdModal(null)}
        >
          <div 
            className="w-full max-w-lg rounded-2xl bg-[#090D22] border-2 border-[#D4AF37]/60 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 bg-[#0E1538] border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-cinzel text-sm sm:text-base font-bold text-white leading-tight">
                    {activeIdModal.participant.fullName}
                  </h3>
                  <span className="text-[11px] text-slate-300 font-mono block">
                    {activeIdModal.participant.role || 'Participant'} · {activeIdModal.collegeName}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveIdModal(null)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: Image Preview or Fallback */}
            <div className="p-4 sm:p-5 overflow-y-auto flex-1 flex flex-col items-center justify-center bg-black/40 min-h-[260px]">
              {activeIdModal.idUrl ? (
                <div className="w-full space-y-3 text-center">
                  <div className="max-h-[60vh] rounded-xl overflow-hidden border border-white/15 bg-black/60 p-2 flex items-center justify-center">
                    <img 
                      src={activeIdModal.idUrl} 
                      alt={`College ID Proof of ${activeIdModal.participant.fullName}`}
                      className="max-h-[50vh] w-auto max-w-full object-contain rounded"
                    />
                  </div>

                  <a
                    href={activeIdModal.idUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-[#D4AF37] hover:underline font-mono"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open Full Image in New Tab</span>
                  </a>
                </div>
              ) : (
                <div className="p-8 text-center max-w-sm space-y-2">
                  <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
                  <h4 className="font-bold text-white text-sm">No Digital ID Card Uploaded</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    This participant did not attach an ID photo during registration. Please check their physical college badge or institutional identity card on-stage.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-[#060A1C] border-t border-white/10 flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>Team: {activeIdModal.teamName}</span>
              <button
                type="button"
                onClick={() => setActiveIdModal(null)}
                className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium cursor-pointer transition-colors"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feature: Verified Payment Proof Slip Modal */}
      {activePaymentModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-fade-in"
          onClick={() => setActivePaymentModal(null)}
        >
          <div 
            className="w-full max-w-lg rounded-2xl bg-[#090D22] border-2 border-emerald-500/60 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 bg-[#0E1538] border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-cinzel text-sm sm:text-base font-bold text-white leading-tight">
                    Payment Proof Receipt
                  </h3>
                  <span className="text-[11px] text-emerald-300 font-mono block">
                    Verified Remittance · {activePaymentModal.reg.eventTitle} ({activePaymentModal.reg.eventCode})
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActivePaymentModal(null)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: Payment Details & Slip Image */}
            <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4 bg-black/40">
              {/* Payment Summary Info Box */}
              <div className="p-3.5 rounded-xl bg-[#040817] border border-white/10 grid grid-cols-2 gap-3 text-xs font-mono">
                <div>
                  <span className="text-slate-400 text-[10px] block uppercase">Reg Code</span>
                  <strong className="text-white text-xs">{activePaymentModal.reg.registrationCode || activePaymentModal.reg.id}</strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block uppercase">UTR / Ref Number</span>
                  <strong className="text-amber-300 text-xs break-all">{activePaymentModal.reg.utrNumber || 'N/A'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block uppercase">Total Remittance</span>
                  <strong className="text-emerald-300 text-sm">₹{activePaymentModal.reg.totalAmount?.toLocaleString() || '0'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block uppercase">Status</span>
                  <strong className="text-emerald-400 text-xs">✓ Verified by Admin</strong>
                </div>
                {activePaymentModal.reg.comboName && (
                  <div className="col-span-2 pt-1 border-t border-white/10">
                    <span className="text-[10px] text-amber-400 uppercase font-bold block">Package Offer</span>
                    <span className="text-white text-xs">⚡ {activePaymentModal.reg.comboName} (Shared remittance proof for all package events)</span>
                  </div>
                )}
              </div>

              {/* Payment Slip Screenshot */}
              <div className="text-center space-y-2">
                <span className="text-[11px] font-mono text-slate-400 block uppercase tracking-wider">UPI / Bank Remittance Screenshot:</span>
                {activePaymentModal.paymentUrl ? (
                  <div className="rounded-xl overflow-hidden border border-white/15 bg-black/60 p-2 flex flex-col items-center justify-center">
                    <img 
                      src={activePaymentModal.paymentUrl} 
                      alt={`Payment Proof for ${activePaymentModal.reg.registrationCode}`}
                      className="max-h-[45vh] w-auto max-w-full object-contain rounded"
                    />
                    <a
                      href={activePaymentModal.paymentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-[#D4AF37] hover:underline font-mono mt-2"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open High-Res Slip in New Tab</span>
                    </a>
                  </div>
                ) : (
                  <div className="p-6 rounded-xl bg-black/40 border border-white/10 text-center text-xs text-slate-400 space-y-1">
                    <AlertCircle className="w-8 h-8 text-amber-400 mx-auto mb-1" />
                    <p className="text-white font-semibold">Offline Cash / Direct Counter Clearance</p>
                    <p className="text-[11px]">This entry was confirmed with UTR {activePaymentModal.reg.utrNumber} at the central registration desk.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-[#060A1C] border-t border-white/10 flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>Captain: {activePaymentModal.reg.participants?.[0]?.fullName || 'N/A'}</span>
              <button
                type="button"
                onClick={() => setActivePaymentModal(null)}
                className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium cursor-pointer transition-colors"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Security Footer Notice */}
      <div className="mt-8 pt-4 border-t border-white/10 text-center text-xs text-slate-400 font-mono print:hidden">
        Celestia'26 Event Incharges Portal · Read-Only Stage Access · Authorized Coordinators
      </div>
    </div>
  );
};
