import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  UserCheck, 
  UserPlus, 
  CreditCard, 
  ShieldCheck, 
  QrCode, 
  RefreshCw, 
  LogOut, 
  Users, 
  Building, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  X, 
  Plus, 
  Phone, 
  Mail, 
  Award, 
  Sparkles, 
  Zap, 
  FileText,
  BadgeCheck,
  ChevronRight,
  Filter,
  Edit3,
  Trash2
} from 'lucide-react';
import { RegistrationSubmission, ParticipantMember } from '../types/registration';
import { supabaseRegistrationService } from '../services/supabaseRegistrationService';
import { eventDayService } from '../services/eventDayService';
import { EVENTS_DATA } from '../data/festivalData';
import { clearAuthSession } from '../lib/authProfiles';

interface RegistrationDeskPageProps {
  onExit: () => void;
  onNavigateToOnSpot?: () => void;
  onNavigateToAdmin?: () => void;
}

export const RegistrationDeskPage: React.FC<RegistrationDeskPageProps> = ({
  onExit,
  onNavigateToOnSpot,
  onNavigateToAdmin,
}) => {
  const [registrations, setRegistrations] = useState<RegistrationSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEventId, setSelectedEventId] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'all' | 'checked_in' | 'partial' | 'not_checked_in'>('all');
  
  // Active inspected registration
  const [selectedReg, setSelectedReg] = useState<RegistrationSubmission | null>(null);
  
  // Modals & Drawers
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  
  // New Team Member Form
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberMobile, setNewMemberMobile] = useState('');
  const [newMemberGender, setNewMemberGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [newMemberAge, setNewMemberAge] = useState('20');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('Team Member');
  const [addMemberError, setAddMemberError] = useState('');
  const [isAddingMember, setIsAddingMember] = useState(false);

  // Edit Team Member Form State
  const [editingMemberIndex, setEditingMemberIndex] = useState<number | null>(null);
  const [editMemberName, setEditMemberName] = useState('');
  const [editMemberMobile, setEditMemberMobile] = useState('');
  const [editMemberGender, setEditMemberGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [editMemberRole, setEditMemberRole] = useState('Team Member');
  const [isSavingEditMember, setIsSavingEditMember] = useState(false);

  // Manual Badge Number Input State per participant
  const [customBadgeInputs, setCustomBadgeInputs] = useState<Record<number, string>>({});

  // Venue Statistics
  const [metrics, setMetrics] = useState({
    totalRegisteredParticipants: 0,
    totalPresentParticipants: 0,
    totalAbsentParticipants: 0,
    idCardsIssued: 0,
    idCardsPending: 0,
    onSpotRegistrationsCount: 0,
  });

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [volunteerName, setVolunteerName] = useState<string>(() => {
    return sessionStorage.getItem('celestia_volunteer_name') || 'RegDesk Volunteer';
  });

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Auth Verification
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return (
      sessionStorage.getItem('celestia_regdesk_auth') === 'true' ||
      sessionStorage.getItem('celestia_admin_auth') === 'true' ||
      sessionStorage.getItem('celestia_admin1_auth') === 'true'
    );
  });

  // Load Data
  const loadData = async () => {
    setRefreshing(true);
    try {
      const allCloud = await supabaseRegistrationService.fetchAdminRegistrations();
      setRegistrations(allCloud || []);
      const m = await eventDayService.fetchEventDayVenueMetrics();
      setMetrics(m);
    } catch (e) {
      console.warn('Error loading registrations for reg desk:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  // Handle Volunteer Name saving
  const handleVolunteerNameChange = (name: string) => {
    setVolunteerName(name);
    sessionStorage.setItem('celestia_volunteer_name', name);
  };

  // Filtered List
  const filteredRegistrations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return registrations.filter((r) => {
      // Event filter
      if (selectedEventId !== 'ALL') {
        const matchesEvent = 
          r.eventId?.toLowerCase() === selectedEventId.toLowerCase() ||
          r.eventCode?.toLowerCase() === selectedEventId.toLowerCase();
        if (!matchesEvent) return false;
      }

      // Check-In Status filter
      const checkInStatus = r.checkInStatus || eventDayService.computeTeamCheckInStatus(r.participants);
      if (statusFilter === 'checked_in' && checkInStatus !== 'CHECKED_IN') return false;
      if (statusFilter === 'partial' && checkInStatus !== 'PARTIAL') return false;
      if (statusFilter === 'not_checked_in' && checkInStatus !== 'NOT_CHECKED_IN') return false;

      // Text Query filter
      if (!query) return true;

      const codeMatch = (r.registrationCode || '').toLowerCase().includes(query) || (r.id || '').toLowerCase().includes(query);
      const teamMatch = (r.teamName || '').toLowerCase().includes(query);
      const collegeMatch = (r.college?.collegeName || '').toLowerCase().includes(query);
      const eventMatch = (r.eventTitle || '').toLowerCase().includes(query) || (r.eventCode || '').toLowerCase().includes(query);
      
      const captain = r.participants?.[0];
      const captainNameMatch = (captain?.fullName || '').toLowerCase().includes(query);
      const captainMobileMatch = (captain?.mobile || '').includes(query) || (r.college?.contactMobile || '').includes(query);

      const anyMemberMatch = (r.participants || []).some((p) => 
        (p.fullName || '').toLowerCase().includes(query) || (p.mobile || '').includes(query)
      );

      return codeMatch || teamMatch || collegeMatch || eventMatch || captainNameMatch || captainMobileMatch || anyMemberMatch;
    });
  }, [registrations, searchQuery, selectedEventId, statusFilter]);

  // Select Registration for Check-In
  const handleInspect = (reg: RegistrationSubmission) => {
    setSelectedReg(reg);
    window.scrollTo({ top: 320, behavior: 'smooth' });
  };

  // Toggle Attendance
  const handleToggleAttendance = async (participantIndex: number, currentStatus?: string) => {
    if (!selectedReg) return;
    const newStatus = currentStatus === 'PRESENT' ? 'NOT_ARRIVED' : 'PRESENT';
    const updated = await eventDayService.updateParticipantAttendance(
      selectedReg,
      participantIndex,
      newStatus,
      volunteerName
    );

    setSelectedReg(updated);
    setRegistrations((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    showToast(newStatus === 'PRESENT' ? 'Participant marked PRESENT ✓' : 'Participant marked ABSENT');

    // Update metrics
    const m = await eventDayService.fetchEventDayVenueMetrics();
    setMetrics(m);
  };

  // Toggle / Issue ID Badge
  const handleIssueIdCard = async (participantIndex: number, currentStatus?: string) => {
    if (!selectedReg) return;
    const newStatus = currentStatus === 'ISSUED' ? 'NOT_ISSUED' : 'ISSUED';
    const customBadge = customBadgeInputs[participantIndex] || undefined;

    const updated = await eventDayService.updateParticipantIdCard(
      selectedReg,
      participantIndex,
      newStatus,
      customBadge,
      volunteerName
    );

    setSelectedReg(updated);
    setRegistrations((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    showToast(newStatus === 'ISSUED' ? 'ID Badge Issued ✓' : 'ID Badge Revoked');

    // Clear input
    setCustomBadgeInputs((prev) => ({ ...prev, [participantIndex]: '' }));

    const m = await eventDayService.fetchEventDayVenueMetrics();
    setMetrics(m);
  };

  // 1-Tap Check-In All Present & Issue Badges
  const handle1TapCheckInAll = async () => {
    if (!selectedReg) return;
    const updated = await eventDayService.markAllMembersPresentAndIssued(selectedReg, volunteerName);
    setSelectedReg(updated);
    setRegistrations((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    showToast(`⚡ 1-Tap Check-In Complete! All ${updated.participants.length} members marked PRESENT & Issued Badges.`);

    const m = await eventDayService.fetchEventDayVenueMetrics();
    setMetrics(m);
  };

  // Add Arriving Team Member Handler
  const handleAddTeamMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReg) return;
    setAddMemberError('');

    if (!newMemberName.trim()) {
      setAddMemberError('Please enter full name of arriving participant.');
      return;
    }
    if (!newMemberMobile.trim() || newMemberMobile.length < 10) {
      setAddMemberError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setIsAddingMember(true);
    const newMember: ParticipantMember = {
      fullName: newMemberName.trim(),
      gender: newMemberGender,
      age: newMemberAge,
      mobile: newMemberMobile.trim(),
      email: newMemberEmail.trim() || `${newMemberMobile.trim()}@celestia.edu`,
      role: newMemberRole || 'Team Member',
    };

    const res = await eventDayService.addTeamMemberToRegistration(selectedReg, newMember, volunteerName);
    setIsAddingMember(false);

    if (res.success && res.updatedRegistration) {
      setSelectedReg(res.updatedRegistration);
      setRegistrations((prev) => prev.map((r) => (r.id === res.updatedRegistration!.id ? res.updatedRegistration! : r)));
      setShowAddMemberModal(false);
      showToast(res.message);

      // Reset form
      setNewMemberName('');
      setNewMemberMobile('');
      setNewMemberEmail('');
      setNewMemberRole('Team Member');

      const m = await eventDayService.fetchEventDayVenueMetrics();
      setMetrics(m);
    } else {
      setAddMemberError(res.message);
    }
  };

  // Open Edit Member Modal
  const handleOpenEditMember = (idx: number, p: ParticipantMember) => {
    setEditingMemberIndex(idx);
    setEditMemberName(p.fullName || '');
    setEditMemberMobile(p.mobile || '');
    setEditMemberGender((p.gender as any) || 'Male');
    setEditMemberRole(p.role || 'Team Member');
  };

  // Save Edit Member
  const handleSaveEditMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReg || editingMemberIndex === null) return;

    if (!editMemberName.trim()) {
      showToast('Please enter participant full name.');
      return;
    }

    setIsSavingEditMember(true);
    const res = await eventDayService.editTeamMemberInRegistration(
      selectedReg,
      editingMemberIndex,
      {
        fullName: editMemberName.trim(),
        mobile: editMemberMobile.trim(),
        gender: editMemberGender,
        role: editMemberRole,
      },
      volunteerName
    );

    setIsSavingEditMember(false);
    if (res.success && res.updatedRegistration) {
      setSelectedReg(res.updatedRegistration);
      setRegistrations((prev) => prev.map((r) => (r.id === res.updatedRegistration!.id ? res.updatedRegistration! : r)));
      setEditingMemberIndex(null);
      showToast(res.message);
    } else {
      showToast(res.message);
    }
  };

  // Delete Member
  const handleDeleteMember = async (idx: number, p: ParticipantMember) => {
    if (!selectedReg) return;
    if (!window.confirm(`Are you sure you want to remove "${p.fullName}" from this team roster?`)) {
      return;
    }

    const res = await eventDayService.deleteTeamMemberFromRegistration(selectedReg, idx, volunteerName);
    if (res.success && res.updatedRegistration) {
      setSelectedReg(res.updatedRegistration);
      setRegistrations((prev) => prev.map((r) => (r.id === res.updatedRegistration!.id ? res.updatedRegistration! : r)));
      showToast(res.message);

      const m = await eventDayService.fetchEventDayVenueMetrics();
      setMetrics(m);
    } else {
      showToast(res.message);
    }
  };

  const [passcodeInput, setPasscodeInput] = useState('');
  const [authError, setAuthError] = useState('');

  const handlePasscodeUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const clean = passcodeInput.trim();

    if (clean === 'regdeskcelestia@' || clean === '24032004psss' || clean.toLowerCase() === 'regdesk') {
      setIsAuthenticated(true);
      sessionStorage.setItem('celestia_regdesk_auth', 'true');
      sessionStorage.setItem('celestia_active_role', clean === '24032004psss' ? 'admin' : 'regdesk');
      showToast('Registration Desk Unlocked');
      loadData();
    } else {
      setAuthError('Incorrect passcode. Please enter authorized Registration Desk key.');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#050714] text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full p-6 rounded-2xl bg-[#0B102B] border border-[#D4AF37]/50 text-center space-y-5 shadow-2xl animate-scale-up">
          <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-br from-[#D4AF37] to-[#AA7C11] flex items-center justify-center text-slate-950 font-bold shadow-lg">
            <UserCheck className="w-7 h-7" />
          </div>

          <div>
            <h2 className="text-xl font-bold font-cinzel text-white">Registration Desk Passcode Required</h2>
            <p className="text-xs text-slate-300 mt-1">
              Enter authorized access key or passcode to unlock venue check-in desk
            </p>
          </div>

          {authError && (
            <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold">
              {authError}
            </div>
          )}

          <form onSubmit={handlePasscodeUnlock} className="space-y-3">
            <input
              type="password"
              required
              autoFocus
              value={passcodeInput}
              onChange={(e) => setPasscodeInput(e.target.value)}
              placeholder="Enter Registration Desk Passcode..."
              className="w-full px-4 py-3 rounded-xl bg-black/60 border border-[#D4AF37]/50 text-white font-mono text-sm text-center focus:outline-none focus:border-[#D4AF37]"
            />

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[#D4AF37] text-slate-950 font-bold text-xs uppercase tracking-wider hover:bg-[#F5E7C4] transition-colors shadow-lg cursor-pointer"
            >
              Unlock Registration Desk
            </button>
          </form>

          <button
            onClick={onExit}
            className="text-xs text-slate-400 hover:text-slate-200 underline pt-2 block mx-auto"
          >
            ← Return to Main Website
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050714] text-[#E5E9F0] pb-24 font-sans selection:bg-[#D4AF37]/30">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-4 right-4 z-50 bg-[#0B102A] text-emerald-300 border border-emerald-500/40 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-bold animate-bounce">
          <Sparkles className="w-4 h-4 text-[#D4AF37]" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#080D26]/90 backdrop-blur-md border-b border-[#D4AF37]/25 px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#AA7C11] flex items-center justify-center text-slate-950 font-black shadow-lg">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-white font-cinzel tracking-wide">
                  Registration Check-In Desk
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                  LIVE VENUE
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Pre-registered Attendees · Team Expansion · Attendance & ID Card Distribution
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Volunteer Profile Input */}
            <div className="hidden sm:flex items-center gap-2 bg-black/40 border border-[#D4AF37]/30 rounded-lg px-2.5 py-1 text-xs">
              <span className="text-slate-400 text-[10px] font-mono">Volunteer:</span>
              <input
                type="text"
                value={volunteerName}
                onChange={(e) => handleVolunteerNameChange(e.target.value)}
                className="bg-transparent text-white font-bold text-xs focus:outline-none w-28"
                placeholder="Your Name"
              />
            </div>

            {onNavigateToOnSpot && (
              <button
                onClick={onNavigateToOnSpot}
                className="px-3 py-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>On-Spot Desk</span>
              </button>
            )}

            <button
              onClick={loadData}
              disabled={refreshing}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={() => {
                clearAuthSession();
                onExit();
              }}
              className="p-2 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 pt-4 space-y-6">
        {/* LIVE VENUE COUNTER METRICS BAR */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3 rounded-xl bg-[#0B102B] border border-white/10">
            <span className="text-[10px] uppercase font-mono text-slate-400 block">Total Registered</span>
            <span className="text-lg font-bold text-white font-mono">{metrics.totalRegisteredParticipants}</span>
          </div>

          <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30">
            <span className="text-[10px] uppercase font-mono text-emerald-300 block">Present Checked-In</span>
            <span className="text-lg font-bold text-emerald-400 font-mono">{metrics.totalPresentParticipants}</span>
          </div>

          <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30">
            <span className="text-[10px] uppercase font-mono text-amber-300 block">Awaiting Arrival</span>
            <span className="text-lg font-bold text-amber-400 font-mono">{metrics.totalAbsentParticipants}</span>
          </div>

          <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30">
            <span className="text-[10px] uppercase font-mono text-cyan-300 block">ID Badges Issued</span>
            <span className="text-lg font-bold text-cyan-400 font-mono">{metrics.idCardsIssued}</span>
          </div>

          <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30">
            <span className="text-[10px] uppercase font-mono text-indigo-300 block">ID Badges Pending</span>
            <span className="text-lg font-bold text-indigo-400 font-mono">{metrics.idCardsPending}</span>
          </div>

          <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/30">
            <span className="text-[10px] uppercase font-mono text-purple-300 block">On-Spot Entries</span>
            <span className="text-lg font-bold text-purple-400 font-mono">{metrics.onSpotRegistrationsCount}</span>
          </div>
        </div>

        {/* SEARCH & FILTER BAR */}
        <div className="p-4 rounded-2xl bg-[#0B102B] border border-[#D4AF37]/30 space-y-3 shadow-xl">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Reg ID (C26-...), Captain Name, Mobile Number, or College..."
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-black/60 border border-white/15 text-white text-xs font-mono placeholder:text-slate-500 focus:outline-none focus:border-[#D4AF37]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Event Filter */}
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full sm:w-56 px-3 py-2.5 rounded-xl bg-black/60 border border-white/15 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
            >
              <option value="ALL">All Events ({EVENTS_DATA.length})</option>
              {EVENTS_DATA.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.code} · {ev.title}
                </option>
              ))}
            </select>

            {/* Check-In Status Filter */}
            <div className="flex items-center gap-1 bg-black/50 p-1 rounded-xl border border-white/10 w-full sm:w-auto overflow-x-auto">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  statusFilter === 'all' ? 'bg-[#D4AF37] text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter('checked_in')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  statusFilter === 'checked_in' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Checked In
              </button>
              <button
                onClick={() => setStatusFilter('partial')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  statusFilter === 'partial' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Partial
              </button>
              <button
                onClick={() => setStatusFilter('not_checked_in')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  statusFilter === 'not_checked_in' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Not Checked In
              </button>
            </div>
          </div>
        </div>

        {/* ACTIVE INSPECTED REGISTRATION DESK WORKSPACE */}
        {selectedReg && (
          <div className="p-5 rounded-2xl bg-[#080E2A] border-2 border-[#D4AF37]/60 space-y-5 shadow-2xl animate-fade-in relative">
            <button
              onClick={() => setSelectedReg(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/10 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Registration Summary Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-base font-bold text-[#E6C57D]">
                    {selectedReg.registrationCode || selectedReg.id}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${
                    selectedReg.registrationSource === 'ON_SPOT' || (selectedReg.registrationCode && selectedReg.registrationCode.includes('SPOT'))
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                      : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                  }`}>
                    {selectedReg.registrationSource === 'ON_SPOT' || (selectedReg.registrationCode && selectedReg.registrationCode.includes('SPOT')) ? 'ON_SPOT' : 'ONLINE'}
                  </span>

                  {/* Team Check-in status badge */}
                  {(() => {
                    const st = selectedReg.checkInStatus || eventDayService.computeTeamCheckInStatus(selectedReg.participants);
                    if (st === 'CHECKED_IN') {
                      return <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">✓ ALL PRESENT</span>;
                    }
                    if (st === 'PARTIAL') {
                      return <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold">⚠ PARTIAL ATTENDANCE</span>;
                    }
                    return <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 text-[10px] font-bold">NOT CHECKED IN</span>;
                  })()}
                </div>

                <h2 className="text-lg font-bold text-white font-cinzel">
                  {selectedReg.eventTitle} ({selectedReg.eventCode})
                </h2>
                <div className="flex items-center gap-3 text-xs text-slate-300">
                  <span className="flex items-center gap-1">
                    <Building className="w-3.5 h-3.5 text-[#D4AF37]" />
                    {selectedReg.college?.collegeName}
                  </span>
                  {selectedReg.teamName && (
                    <span className="flex items-center gap-1 font-semibold text-amber-200">
                      <Users className="w-3.5 h-3.5 text-amber-400" />
                      Team: {selectedReg.teamName}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handle1TapCheckInAll}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Zap className="w-4 h-4 text-yellow-300" />
                  <span>1-Tap Check-In All Present</span>
                </button>

                {selectedReg.eventType !== 'Solo' && (
                  <button
                    onClick={() => setShowAddMemberModal(true)}
                    className="px-3 py-2.5 rounded-xl bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30 text-[#F5E7C4] border border-[#D4AF37]/50 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-[#D4AF37]" />
                    <span>+ Add Arriving Member</span>
                  </button>
                )}
              </div>
            </div>

            {/* Financial & Fee Status Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs bg-black/40 p-3 rounded-xl border border-white/10">
              <div>
                <span className="text-slate-400 text-[10px] uppercase block font-mono">Total Fee</span>
                <span className="font-bold text-white text-sm font-mono">₹{selectedReg.totalAmount}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase block font-mono">Amount Paid</span>
                <span className="font-bold text-emerald-400 text-sm font-mono">₹{selectedReg.paidAmount || 0}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase block font-mono">Pending Balance</span>
                <span className={`font-bold text-sm font-mono ${selectedReg.pendingAmount && selectedReg.pendingAmount > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                  ₹{selectedReg.pendingAmount || 0}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase block font-mono">Payment Status</span>
                <span className="font-bold text-amber-300 font-mono text-xs">{selectedReg.paymentStatus}</span>
              </div>
            </div>

            {/* PARTICIPANTS ROSTER & ATTENDANCE ACTIONS */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white text-xs uppercase font-mono tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#D4AF37]" />
                  Participant Roster ({selectedReg.participants?.length || 0} Members)
                </h3>
                <span className="text-[11px] text-slate-400">
                  Mark attendance and assign physical ID badges individually
                </span>
              </div>

              <div className="space-y-2">
                {(selectedReg.participants || []).map((p, idx) => {
                  const isPresent = p.attendanceStatus === 'PRESENT';
                  const isIssued = p.idCardStatus === 'ISSUED';

                  return (
                    <div
                      key={p.participantId || idx}
                      className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isPresent
                          ? 'bg-emerald-950/20 border-emerald-500/30'
                          : 'bg-black/40 border-white/10'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-white/10 text-slate-300 flex items-center justify-center font-mono text-xs font-bold">
                            {idx + 1}
                          </span>
                          <span className="font-bold text-white text-sm">{p.fullName}</span>
                          {idx === 0 && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[9px] font-bold font-mono">
                              CAPTAIN
                            </span>
                          )}
                          <span className="text-xs text-slate-400 font-mono">({p.gender || 'Member'})</span>

                          {/* Quick Edit & Delete Member Controls */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditMember(idx, p)}
                            className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-amber-300 transition-colors ml-1"
                            title="Edit Participant Details"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {(selectedReg.participants?.length || 0) > 1 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteMember(idx, p)}
                              className="p-1 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                              title="Delete Participant"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-500" />
                            {p.mobile}
                          </span>
                          {p.role && <span className="text-slate-500">· {p.role}</span>}
                        </div>
                      </div>

                      {/* Attendance & ID Card Action Controls */}
                      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                        {/* Attendance Toggle */}
                        <button
                          onClick={() => handleToggleAttendance(idx, p.attendanceStatus)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                            isPresent
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 hover:bg-emerald-500/30'
                              : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
                          }`}
                        >
                          <CheckCircle2 className={`w-3.5 h-3.5 ${isPresent ? 'text-emerald-400' : 'text-slate-500'}`} />
                          <span>{isPresent ? 'PRESENT ✓' : 'Mark Present'}</span>
                        </button>

                        {/* ID Card Badge Toggle */}
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            placeholder="Wristband # (Opt)"
                            value={customBadgeInputs[idx] || ''}
                            onChange={(e) => setCustomBadgeInputs({ ...customBadgeInputs, [idx]: e.target.value })}
                            className="w-24 px-2 py-1 rounded bg-black/80 border border-white/20 text-white text-[11px] font-mono focus:outline-none focus:border-[#D4AF37]"
                          />
                          <button
                            onClick={() => handleIssueIdCard(idx, p.idCardStatus)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                              isIssued
                                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 hover:bg-cyan-500/30'
                                : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
                            }`}
                          >
                            <BadgeCheck className={`w-3.5 h-3.5 ${isIssued ? 'text-cyan-400' : 'text-slate-500'}`} />
                            <span>{isIssued ? `Badge #${p.idCardNumber || 'Issued'}` : 'Issue Badge'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* REGISTRATIONS LIST DATA TABLE */}
        <div className="p-4 rounded-2xl bg-[#0B102B] border border-white/10 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <h3 className="font-bold text-white text-xs uppercase font-mono tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#D4AF37]" />
              Event Registrations ({filteredRegistrations.length})
            </h3>
            <span className="text-[11px] text-slate-400">
              Click any registration to open venue check-in desk
            </span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#D4AF37]" />
              <p className="text-xs font-mono">Loading venue registrations database...</p>
            </div>
          ) : filteredRegistrations.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <AlertTriangle className="w-6 h-6 mx-auto text-amber-400" />
              <p className="text-sm font-bold text-white">No registrations match query</p>
              <p className="text-xs text-slate-400">Try adjusting your search query or filters.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredRegistrations.map((reg) => {
                const isSelected = selectedReg?.id === reg.id;
                const checkInSt = reg.checkInStatus || eventDayService.computeTeamCheckInStatus(reg.participants);
                const captain = reg.participants?.[0];

                return (
                  <div
                    key={reg.id}
                    onClick={() => handleInspect(reg)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-[#121A45] border-[#D4AF37] ring-1 ring-[#D4AF37]'
                        : 'bg-black/40 border-white/10 hover:border-white/25 hover:bg-black/60'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#E6C57D]">
                          {reg.registrationCode || reg.id}
                        </span>
                        <span className="text-xs font-bold text-white font-cinzel">
                          {reg.eventTitle} ({reg.eventCode})
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono border ${
                          reg.registrationSource === 'ON_SPOT' || (reg.registrationCode && reg.registrationCode.includes('SPOT'))
                            ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                            : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                        }`}>
                          {reg.registrationSource === 'ON_SPOT' || (reg.registrationCode && reg.registrationCode.includes('SPOT')) ? 'ON_SPOT' : 'ONLINE'}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-300">
                        <span>Captain: {captain?.fullName || 'N/A'} ({captain?.mobile || reg.college?.contactMobile || 'N/A'})</span>
                        <span>· {reg.college?.collegeName}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Attendance badge */}
                      {checkInSt === 'CHECKED_IN' ? (
                        <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold">
                          ✓ ALL PRESENT
                        </span>
                      ) : checkInSt === 'PARTIAL' ? (
                        <span className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold">
                          ⚠ PARTIAL
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded bg-slate-800 text-slate-400 border border-slate-700 text-xs font-bold">
                          Awaiting Check-In
                        </span>
                      )}

                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* ADD ARRIVING TEAM MEMBER MODAL */}
      {showAddMemberModal && selectedReg && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#0B102B] border border-[#D4AF37]/50 rounded-2xl p-5 space-y-4 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="font-bold text-white text-sm font-cinzel flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-[#D4AF37]" />
                Add Arriving Team Member
              </h3>
              <button
                onClick={() => setShowAddMemberModal(false)}
                className="p-1 rounded-lg bg-white/10 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Adding member to existing registration <span className="font-mono text-[#E6C57D]">{selectedReg.registrationCode || selectedReg.id}</span> ({selectedReg.eventTitle}).
            </p>

            {addMemberError && (
              <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs">
                {addMemberError}
              </div>
            )}

            <form onSubmit={handleAddTeamMemberSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 text-[10px] uppercase font-mono block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  placeholder="e.g. Arjun Kumar"
                  className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/20 text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 text-[10px] uppercase font-mono block mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={newMemberMobile}
                    onChange={(e) => setNewMemberMobile(e.target.value.replace(/\D/g, ''))}
                    placeholder="10-digit mobile"
                    className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/20 text-white font-mono focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="text-slate-400 text-[10px] uppercase font-mono block mb-1">Gender</label>
                  <select
                    value={newMemberGender}
                    onChange={(e) => setNewMemberGender(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/20 text-white focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-400 text-[10px] uppercase font-mono block mb-1">Role / Designation</label>
                <input
                  type="text"
                  value={newMemberRole}
                  onChange={(e) => setNewMemberRole(e.target.value)}
                  placeholder="e.g. Performer, Vocalist, Accompanist"
                  className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/20 text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddMemberModal(false)}
                  className="px-4 py-2 rounded-lg bg-white/10 text-slate-300 font-bold hover:bg-white/15"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAddingMember}
                  className="px-4 py-2 rounded-lg bg-[#D4AF37] text-slate-950 font-bold hover:bg-[#F5E7C4] transition-colors flex items-center gap-1.5"
                >
                  {isAddingMember ? 'Saving...' : 'Add & Mark Present'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT TEAM MEMBER MODAL */}
      {editingMemberIndex !== null && selectedReg && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#0B102B] border border-[#D4AF37]/50 rounded-2xl p-5 space-y-4 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="font-bold text-white text-sm font-cinzel flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-[#D4AF37]" />
                Edit Participant Details
              </h3>
              <button
                onClick={() => setEditingMemberIndex(null)}
                className="p-1 rounded-lg bg-white/10 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditMemberSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 text-[10px] uppercase font-mono block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={editMemberName}
                  onChange={(e) => setEditMemberName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/20 text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 text-[10px] uppercase font-mono block mb-1">Mobile Number</label>
                  <input
                    type="tel"
                    maxLength={10}
                    value={editMemberMobile}
                    onChange={(e) => setEditMemberMobile(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/20 text-white font-mono focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="text-slate-400 text-[10px] uppercase font-mono block mb-1">Gender</label>
                  <select
                    value={editMemberGender}
                    onChange={(e) => setEditMemberGender(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/20 text-white focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-400 text-[10px] uppercase font-mono block mb-1">Role / Designation</label>
                <input
                  type="text"
                  value={editMemberRole}
                  onChange={(e) => setEditMemberRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/20 text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingMemberIndex(null)}
                  className="px-4 py-2 rounded-lg bg-white/10 text-slate-300 font-bold hover:bg-white/15"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEditMember}
                  className="px-4 py-2 rounded-lg bg-[#D4AF37] text-slate-950 font-bold hover:bg-[#F5E7C4] transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {isSavingEditMember ? 'Saving...' : 'Save Member Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
