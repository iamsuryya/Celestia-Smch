import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Calendar, 
  CheckCircle, 
  Search, 
  Filter, 
  Download, 
  Printer, 
  Phone, 
  Mail, 
  Building, 
  MapPin, 
  Sparkles, 
  ShieldCheck, 
  LogOut, 
  RefreshCw, 
  ChevronDown, 
  ChevronRight, 
  Copy, 
  Check, 
  Clock, 
  Tag, 
  UserCheck, 
  Layers,
  ArrowUpDown
} from 'lucide-react';
import { EVENTS_DATA, EventItem, CategoryInfo } from '../data/festivalData';
import { RegistrationSubmission, ParticipantMember } from '../types/registration';
import { supabaseRegistrationService } from '../services/supabaseRegistrationService';
import { clearAuthSession } from '../lib/authProfiles';

interface InchargesPortalPageProps {
  onExit: () => void;
  onNavigateToAdmin?: () => void;
}

export const InchargesPortalPage: React.FC<InchargesPortalPageProps> = ({
  onExit,
  onNavigateToAdmin,
}) => {
  const [registrations, setRegistrations] = useState<RegistrationSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedEventId, setSelectedEventId] = useState<string>('ALL');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return (
      sessionStorage.getItem('celestia_incharges_auth') === 'true' ||
      sessionStorage.getItem('celestia_admin_auth') === 'true' ||
      sessionStorage.getItem('celestia_admin1_auth') === 'true'
    );
  });
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);

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

  // Fetch registrations and filter strictly to ADMIN APPROVED
  const loadApprovedRegistrations = async () => {
    try {
      setRefreshing(true);
      const allCloud = await supabaseRegistrationService.fetchAdminRegistrations();
      
      // Strict rule: "This shld only show registrations and details which are approved by admin"
      // Status in system: paymentStatus === 'Verified' or registrationStatus === 'Confirmed'
      // Excludes: 'Submitted', 'Pending', 'Rejected', 'Hold', 'Not Complete'
      const approvedOnly = (allCloud || []).filter((r) => {
        const pStatus = (r.paymentStatus || '').toLowerCase();
        const rStatus = (r.registrationStatus || '').toLowerCase();
        const isApproved = pStatus === 'verified' || rStatus === 'confirmed' || pStatus === 'approved';
        const isRejected = pStatus === 'rejected' || rStatus === 'rejected';
        const isIncomplete = pStatus === 'not complete' || pStatus === 'hold';
        return isApproved && !isRejected && !isIncomplete;
      });

      setRegistrations(approvedOnly);
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
    showToast(`Registration Code ${code} copied to clipboard`);
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
      // Find matching event by id or code
      const matched = EVENTS_DATA.find((e) => e.id === evId || e.code.toUpperCase() === reg.eventCode?.toUpperCase());
      const key = matched ? matched.id : evId;
      if (counts[key] !== undefined) {
        counts[key] += 1;
        participantCounts[key] += reg.participants?.length || 1;
      }
    });

    return { counts, participantCounts };
  }, [registrations]);

  // Unique categories for pills
  const categories = [
    { id: 'ALL', label: 'All Categories' },
    { id: 'music', label: 'Music' },
    { id: 'dance', label: 'Dance' },
    { id: 'fashion', label: 'Fashion' },
    { id: 'entertainment', label: 'Entertainment' },
    { id: 'media', label: 'Digital & Media' },
    { id: 'special', label: 'Special' },
  ];

  // Filtered registrations according to current event / category / search
  const filteredRegistrations = useMemo(() => {
    return registrations.filter((reg) => {
      const ev = EVENTS_DATA.find((e) => e.id === reg.eventId || e.code.toUpperCase() === reg.eventCode?.toUpperCase());

      // Filter by Event
      if (selectedEventId !== 'ALL') {
        if (!ev || ev.id !== selectedEventId) return false;
      }

      // Filter by Category
      if (selectedCategory !== 'ALL') {
        if (!ev || ev.category !== selectedCategory) return false;
      }

      // Filter by Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const code = reg.registrationCode || reg.id || '';
        const codeMatch = code.toLowerCase().includes(q);
        const teamMatch = reg.teamName?.toLowerCase().includes(q);
        const collegeMatch = reg.college?.collegeName?.toLowerCase().includes(q);
        const eventTitleMatch = ev?.title.toLowerCase().includes(q) || reg.eventTitle?.toLowerCase().includes(q);
        const participantMatch = reg.participants?.some(
          (p) =>
            p.fullName?.toLowerCase().includes(q) ||
            p.mobile?.toLowerCase().includes(q) ||
            p.email?.toLowerCase().includes(q)
        );

        return Boolean(codeMatch || teamMatch || collegeMatch || eventTitleMatch || participantMatch);
      }

      return true;
    });
  }, [registrations, selectedEventId, selectedCategory, searchQuery]);

  // Total summary metrics
  const totalApprovedRegistrations = registrations.length;
  const totalApprovedParticipants = registrations.reduce(
    (acc, r) => acc + (r.participants?.length || 1),
    0
  );
  const totalCheckedIn = Object.values(checkins).filter(Boolean).length;

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredRegistrations.length === 0) {
      showToast('No registrations in current view to export');
      return;
    }

    const headers = [
      'Registration Code',
      'Event Title',
      'Event Code',
      'Category',
      'Team / Solo Name',
      'College Name',
      'College City',
      'College State',
      'Participant Count',
      'Leader / Contact Name',
      'Contact Mobile',
      'Contact Email',
      'All Participants',
      'Approval Status',
      'On-Stage Check-in',
    ];

    const rows = filteredRegistrations.map((r) => {
      const ev = EVENTS_DATA.find((e) => e.id === r.eventId || e.code.toUpperCase() === r.eventCode?.toUpperCase());
      const leader = r.participants?.[0];
      const memberList = (r.participants || [])
        .map((p, i) => `${i + 1}. ${p.fullName} (${p.role || 'Member'}, ${p.mobile})`)
        .join('; ');
      const code = r.registrationCode || r.id;

      return [
        code,
        ev?.title || r.eventTitle || 'Event',
        ev?.code || r.eventCode || '',
        ev?.categoryDisplay || ev?.category || '',
        r.teamName || 'Solo Entry',
        r.college?.collegeName || '',
        r.college?.city || '',
        r.college?.state || '',
        r.participants?.length || 1,
        leader?.fullName || '',
        leader?.mobile || '',
        leader?.email || '',
        `"${memberList.replace(/"/g, '""')}"`,
        'Approved by Admin',
        checkins[code] ? 'Checked In' : 'Pending Stage Call',
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Celestia26_Approved_${selectedEventId !== 'ALL' ? selectedEventId : 'AllEvents'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${filteredRegistrations.length} approved records to CSV`);
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
              APPROVED REGISTRATIONS DESK
            </span>
            <h2 className="font-cinzel text-2xl font-bold text-white tracking-wide">
              Event Incharges Portal
            </h2>
            <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
              Official portal for Celestia'26 event coordinators and committee in-charges to classify approved teams and conduct stage calls.
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
                placeholder="Enter security password"
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
    <div className="relative z-10 pt-20 sm:pt-28 pb-16 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto print:p-0 print:pt-4">
      
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#101736] border border-[#D4AF37] text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-medium animate-fade-in">
          <CheckCircle className="w-4 h-4 text-[#D4AF37]" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Banner / Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-white/10 print:hidden">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              INCHARGES DESK
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              Only Admin-Approved Registrations
            </span>
          </div>
          <h1 className="font-cinzel text-2xl sm:text-3xl font-extrabold text-white tracking-wide">
            Event Incharges Central Desk
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Real-time approved participant rosters classified by event. Use the quick classifier pills to isolate your specific event and coordinate stage calls.
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
            title="Print printable sheet for clipboard"
          >
            <Printer className="w-3.5 h-3.5 text-blue-400" />
            <span>Print Sheet</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25 border border-[#D4AF37]/40 text-xs font-semibold text-[#F5E7C4] transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#D4AF37]" />
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
        <h1 className="text-xl font-bold uppercase">Celestia'26 · Official Event Attendance Sheet</h1>
        <p className="text-xs">
          Event: {selectedEventId !== 'ALL' ? (EVENTS_DATA.find(e => e.id === selectedEventId)?.title || selectedEventId) : 'All Events'} · Total Approved: {filteredRegistrations.length} Entries · Printed on: {new Date().toLocaleString()}
        </p>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 my-6 print:hidden">
        <div className="p-4 rounded-2xl celestial-glass border border-white/10">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider">Approved Registrations</span>
            <Users className="w-4 h-4 text-[#D4AF37]" />
          </div>
          <div className="font-cinzel text-2xl sm:text-3xl font-extrabold text-white">
            {totalApprovedRegistrations}
          </div>
          <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            <span>Admin-verified submissions</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl celestial-glass border border-white/10">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider">Approved Students</span>
            <UserCheck className="w-4 h-4 text-blue-400" />
          </div>
          <div className="font-cinzel text-2xl sm:text-3xl font-extrabold text-blue-300">
            {totalApprovedParticipants}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Total individual attendee heads
          </div>
        </div>

        <div className="p-4 rounded-2xl celestial-glass border border-white/10">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider">Active Events</span>
            <Calendar className="w-4 h-4 text-purple-400" />
          </div>
          <div className="font-cinzel text-2xl sm:text-3xl font-extrabold text-purple-300">
            {Object.values(eventStats.counts).filter(c => c > 0).length} / 12
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Events with registered teams
          </div>
        </div>

        <div className="p-4 rounded-2xl celestial-glass border border-white/10">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider">Stage Checked-in</span>
            <Check className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="font-cinzel text-2xl sm:text-3xl font-extrabold text-emerald-300">
            {totalCheckedIn} / {totalApprovedRegistrations}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Marked present on stage
          </div>
        </div>
      </div>

      {/* Event Classifier Strip */}
      <div className="celestial-glass rounded-2xl p-4 sm:p-5 border border-[#D4AF37]/30 shadow-xl mb-6 space-y-4 print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#D4AF37]" />
            <h3 className="font-cinzel text-sm sm:text-base font-bold text-white tracking-wide">
              Event Classification & Quick Filter
            </h3>
          </div>
          <div className="text-xs text-slate-400 font-mono">
            Showing <strong className="text-white">{filteredRegistrations.length}</strong> of {totalApprovedRegistrations} approved entries
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setSelectedCategory(cat.id);
                setSelectedEventId('ALL');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-[#D4AF37] text-black shadow-md shadow-[#D4AF37]/30'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Individual Event Buttons with Approved Count Badges */}
        <div className="pt-2 border-t border-white/10">
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-2">
            Pick an event to classify:
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            <button
              type="button"
              onClick={() => setSelectedEventId('ALL')}
              className={`p-2.5 rounded-xl text-left border text-xs transition-all cursor-pointer flex flex-col justify-between ${
                selectedEventId === 'ALL'
                  ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-white shadow-sm shadow-[#D4AF37]/20'
                  : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300'
              }`}
            >
              <span className="font-bold truncate">All 12 Events</span>
              <span className="text-[10px] text-[#D4AF37] font-mono mt-1">
                {totalApprovedRegistrations} Approved
              </span>
            </button>

            {EVENTS_DATA.filter((ev) => selectedCategory === 'ALL' || ev.category === selectedCategory).map((ev) => {
              const count = eventStats.counts[ev.id] || 0;
              const isSelected = selectedEventId === ev.id;
              return (
                <button
                  key={ev.id}
                  type="button"
                  onClick={() => setSelectedEventId(ev.id)}
                  className={`p-2.5 rounded-xl text-left border text-xs transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-[#D4AF37] text-black font-bold border-[#D4AF37] shadow-md shadow-[#D4AF37]/30'
                      : count > 0
                      ? 'bg-[#101736] hover:bg-[#182354] border-[#D4AF37]/30 text-white'
                      : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-400'
                  }`}
                >
                  <span className="truncate leading-tight">{ev.title}</span>
                  <div className="flex items-center justify-between text-[10px] mt-1.5 font-mono">
                    <span className={isSelected ? 'text-black/80' : 'text-slate-400'}>{ev.code}</span>
                    <span className={`px-1.5 py-0.2 rounded font-bold ${
                      isSelected 
                        ? 'bg-black text-[#F5E7C4]' 
                        : count > 0 
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                        : 'bg-white/10 text-slate-400'
                    }`}>
                      {count}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search Bar */}
        <div className="pt-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by participant name, phone, team name, college, or registration code..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#060919] border border-white/15 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-[#D4AF37]"
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
      </div>

      {/* Registrations List */}
      {loading ? (
        <div className="p-16 text-center celestial-glass rounded-2xl border border-white/10">
          <RefreshCw className="w-8 h-8 text-[#D4AF37] animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-300 font-mono">Syncing approved festival registrations...</p>
        </div>
      ) : filteredRegistrations.length === 0 ? (
        <div className="p-16 text-center celestial-glass rounded-2xl border border-white/10">
          <CheckCircle className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <h3 className="font-cinzel text-lg font-bold text-white mb-1">
            No Approved Registrations Found
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            {registrations.length === 0
              ? 'There are no registrations marked as "Verified / Approved" by the central administrator yet. When the administrator approves registrations in /admin1, they will automatically appear here.'
              : 'No approved registrations match your selected event or search filters.'}
          </p>
          {(selectedEventId !== 'ALL' || selectedCategory !== 'ALL' || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setSelectedEventId('ALL');
                setSelectedCategory('ALL');
                setSearchQuery('');
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-white cursor-pointer font-medium"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRegistrations.map((reg) => {
            const ev = EVENTS_DATA.find((e) => e.id === reg.eventId || e.code.toUpperCase() === reg.eventCode?.toUpperCase());
            const code = reg.registrationCode || reg.id;
            const isCheckedIn = Boolean(checkins[code]);
            const leader = reg.participants?.[0];
            const members = reg.participants || [];
            const college = reg.college;

            return (
              <div
                key={code}
                className={`celestial-glass rounded-2xl p-5 border transition-all ${
                  isCheckedIn 
                    ? 'border-emerald-500/50 bg-[#07172C]/60 shadow-lg shadow-emerald-500/10' 
                    : 'border-white/10 hover:border-[#D4AF37]/40'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  {/* Left Column: Event & Team Identification */}
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#D4AF37]/20 text-[#F5E7C4] border border-[#D4AF37]/40">
                        {ev?.title || reg.eventTitle || 'Event'}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-white/10 text-slate-300">
                        {ev?.code || reg.eventCode || ''}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        <span>Admin Approved</span>
                      </span>
                      {college?.isCollegeDelegation && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          College Delegation
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <h4 className="font-cinzel text-lg sm:text-xl font-bold text-white tracking-wide">
                        {reg.teamName || 'Solo Entry'}
                      </h4>
                      <button
                        type="button"
                        onClick={() => handleCopyCode(code)}
                        className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-mono text-[#D4AF37] flex items-center gap-1 cursor-pointer transition-colors"
                        title="Copy Registration Code"
                      >
                        <span>{code}</span>
                        {copiedCode === code ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3 text-slate-400" />
                        )}
                      </button>
                    </div>

                    {/* College & Location */}
                    <div className="flex items-center gap-3 text-xs text-slate-300 flex-wrap">
                      <div className="flex items-center gap-1 text-slate-200">
                        <Building className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span className="font-medium">{college?.collegeName || 'N/A'}</span>
                      </div>
                      {(college?.city || college?.state) && (
                        <div className="flex items-center gap-1 text-slate-400 text-[11px]">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{[college?.city, college?.state].filter(Boolean).join(', ')}</span>
                        </div>
                      )}
                      {college?.contactPerson && (
                        <span className="text-[11px] text-slate-400">
                          (POC: {college.contactPerson} {college.contactMobile ? `· ${college.contactMobile}` : ''})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Stage Check-In & Action Controls */}
                  <div className="flex items-center gap-3 lg:self-center shrink-0">
                    <button
                      type="button"
                      onClick={() => toggleCheckin(code)}
                      className={`px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                        isCheckedIn
                          ? 'bg-emerald-500 text-black hover:bg-emerald-400 shadow-md shadow-emerald-500/20'
                          : 'bg-white/10 hover:bg-white/15 text-slate-200 border border-white/15'
                      }`}
                    >
                      <Check className={`w-4 h-4 ${isCheckedIn ? 'text-black' : 'text-slate-400'}`} />
                      <span>{isCheckedIn ? 'Checked-In on Stage' : 'Mark Stage Check-In'}</span>
                    </button>
                  </div>
                </div>

                {/* Participant Roster Table for Event Incharges */}
                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-2">
                    <span className="uppercase tracking-wider">
                      Participant Roster ({members.length} Member{members.length !== 1 ? 's' : ''})
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Registered: {reg.createdAt || 'N/A'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {members.map((member, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-[#060A1C]/80 border border-white/10 flex flex-col justify-between space-y-1.5"
                      >
                        <div className="flex items-start justify-between gap-1.5">
                          <span className="text-xs font-semibold text-white leading-tight">
                            {member.fullName}
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                            idx === 0 
                              ? 'bg-[#D4AF37]/20 text-[#F5E7C4] border border-[#D4AF37]/30' 
                              : 'bg-white/5 text-slate-400'
                          }`}>
                            {member.role || (idx === 0 ? 'Leader' : 'Member')}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-slate-400">
                          {member.gender && <span>{member.gender}</span>}
                          {member.age && <span>{member.age} yrs</span>}
                        </div>

                        {/* Contact info with one-touch phone click */}
                        <div className="space-y-0.5 pt-1 border-t border-white/5 text-[11px]">
                          {member.mobile && (
                            <a
                              href={`tel:${member.mobile}`}
                              className="text-emerald-400 hover:underline flex items-center gap-1 font-mono"
                            >
                              <Phone className="w-3 h-3 text-emerald-400 shrink-0" />
                              <span>{member.mobile}</span>
                            </a>
                          )}
                          {member.email && (
                            <a
                              href={`mailto:${member.email}`}
                              className="text-slate-300 hover:underline flex items-center gap-1 font-mono truncate"
                            >
                              <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{member.email}</span>
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Registration Audit Notes / Footer */}
                <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400 font-mono flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span>UTR: <strong className="text-slate-300">{reg.utrNumber || 'N/A'}</strong></span>
                    <span>·</span>
                    <span>Fee: <strong className="text-slate-300">₹{(reg.totalAmount || 0).toLocaleString('en-IN')}</strong></span>
                  </div>
                  <div className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    <span>Official Verified Entry</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Incharges Footer Note */}
      <div className="mt-12 text-center text-xs text-slate-400 font-mono border-t border-white/10 pt-6 print:hidden">
        <p>
          Logged in as <strong>Event Incharges</strong> · Only registrations approved by the Central Admin desk are displayed here.
        </p>
        <p className="mt-1 text-[11px] text-slate-400">
          For payment disputes or approval requests, contact the Central Admin Operations Desk at /admin1.
        </p>
      </div>
    </div>
  );
};
