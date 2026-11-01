import React, { useState, useEffect } from 'react';
import { 
  UserPlus, 
  Users, 
  User, 
  Building, 
  CreditCard, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  LogOut, 
  X, 
  Plus, 
  Trash2, 
  Phone, 
  Mail, 
  Sparkles, 
  FileText,
  BadgeCheck,
  Check
} from 'lucide-react';
import { EVENTS_DATA, EventItem } from '../data/festivalData';
import { ParticipantMember, RegistrationSubmission } from '../types/registration';
import { eventDayService } from '../services/eventDayService';
import { clearAuthSession } from '../lib/authProfiles';

interface OnSpotRegistrationPageProps {
  onExit: () => void;
  onNavigateToRegDesk?: () => void;
}

export const OnSpotRegistrationPage: React.FC<OnSpotRegistrationPageProps> = ({
  onExit,
  onNavigateToRegDesk,
}) => {
  const [activeTab, setActiveTab] = useState<'team' | 'individual'>('team');
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  
  // Form State
  const [collegeName, setCollegeName] = useState('');
  const [captainName, setCaptainName] = useState('');
  const [captainMobile, setCaptainMobile] = useState('');
  const [captainEmail, setCaptainEmail] = useState('');
  const [teamName, setTeamName] = useState('');
  const [utrNumber, setUtrNumber] = useState('');
  const [paidAmountInput, setPaidAmountInput] = useState<string>('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [rulesAccepted, setRulesAccepted] = useState(true);

  // Additional Team Members Roster
  const [teamMembers, setTeamMembers] = useState<ParticipantMember[]>([]);
  
  // States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [createdReg, setCreatedReg] = useState<RegistrationSubmission | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [volunteerName, setVolunteerName] = useState<string>(() => {
    return sessionStorage.getItem('celestia_volunteer_name') || 'On-Spot Volunteer';
  });

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Auth Verification
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return (
      sessionStorage.getItem('celestia_onspot_auth') === 'true' ||
      sessionStorage.getItem('celestia_admin_auth') === 'true' ||
      sessionStorage.getItem('celestia_admin1_auth') === 'true'
    );
  });

  // Selected Event Details
  const selectedEvent = EVENTS_DATA.find(
    (e) => e.id.toLowerCase() === selectedEventId.toLowerCase() || e.code.toLowerCase() === selectedEventId.toLowerCase()
  );

  // Computed Total Registration Fee based on official catalog
  const computedTotalFee = (() => {
    if (!selectedEvent) return 0;
    const isHost = collegeName.toLowerCase().includes('srinivasan');
    if (isHost) return 0;

    const totalCount = activeTab === 'team' ? 1 + teamMembers.length : 1;
    if (selectedEvent.feeType === 'per_head') {
      return selectedEvent.feeAmount * totalCount;
    }
    return selectedEvent.feeAmount;
  })();

  // Synchronize default paid amount to total fee when event changes
  useEffect(() => {
    if (computedTotalFee > 0) {
      setPaidAmountInput(String(computedTotalFee));
    } else {
      setPaidAmountInput('0');
    }
  }, [computedTotalFee]);

  // Check duplicate on phone or team name input change
  useEffect(() => {
    const checkDuplicate = async () => {
      if (!selectedEventId || !captainMobile || captainMobile.length < 10) {
        setDuplicateWarning(null);
        return;
      }
      const dup = await eventDayService.checkDuplicateOnSpot(captainMobile, selectedEventId, teamName);
      if (dup.isDuplicate) {
        setDuplicateWarning(dup.reason || 'Existing registration found for this phone/team.');
      } else {
        setDuplicateWarning(null);
      }
    };
    const timer = setTimeout(checkDuplicate, 400);
    return () => clearTimeout(timer);
  }, [captainMobile, selectedEventId, teamName]);

  // Add Member to Roster
  const handleAddMember = () => {
    if (!selectedEvent) return;
    const currentTotal = 1 + teamMembers.length;
    const maxSize = selectedEvent.maxParticipants || 25;
    if (currentTotal >= maxSize) {
      setErrorMsg(`Maximum team size of ${maxSize} reached for ${selectedEvent.title}.`);
      return;
    }
    setErrorMsg('');
    setTeamMembers((prev) => [
      ...prev,
      {
        fullName: '',
        gender: 'Male',
        age: '20',
        mobile: '',
        email: '',
        role: 'Team Member',
      },
    ]);
  };

  // Remove Member
  const handleRemoveMember = (idx: number) => {
    setTeamMembers((prev) => prev.filter((_, i) => i !== idx));
  };

  // Update Member Field
  const handleUpdateMember = (idx: number, field: keyof ParticipantMember, value: string) => {
    setTeamMembers((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
  };

  // Submit New On-Spot Registration
  const handleSubmitOnSpot = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedEvent) {
      setErrorMsg('Please select an event.');
      return;
    }
    if (!collegeName.trim()) {
      setErrorMsg('Please enter College Name.');
      return;
    }
    if (!captainName.trim()) {
      setErrorMsg('Please enter Captain / Participant Full Name.');
      return;
    }
    if (!captainMobile.trim() || captainMobile.length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!utrNumber.trim()) {
      setErrorMsg('Please enter payment UTR / Transaction Reference number.');
      return;
    }
    if (!rulesAccepted) {
      setErrorMsg('Event rules acceptance is mandatory.');
      return;
    }

    // Combine captain + team members into final roster
    const captainMember: ParticipantMember = {
      fullName: captainName.trim(),
      gender: 'Male',
      age: '20',
      mobile: captainMobile.trim(),
      email: captainEmail.trim() || `${captainMobile.trim()}@celestia.edu`,
      role: activeTab === 'team' ? 'Team Captain' : 'Participant',
    };

    const roster: ParticipantMember[] = [captainMember];

    if (activeTab === 'team') {
      for (let i = 0; i < teamMembers.length; i++) {
        const tm = teamMembers[i];
        if (!tm.fullName.trim()) {
          setErrorMsg(`Please enter name for Team Member #${i + 2}.`);
          return;
        }
        roster.push({
          ...tm,
          fullName: tm.fullName.trim(),
          mobile: tm.mobile.trim() || captainMobile.trim(),
          email: tm.email.trim() || `${tm.mobile || captainMobile}@celestia.edu`,
        });
      }
    }

    const paidVal = Math.max(0, Number(paidAmountInput) || 0);
    const pendingVal = Math.max(0, computedTotalFee - paidVal);

    setIsSubmitting(true);
    const res = await eventDayService.createOnSpotRegistration({
      eventId: selectedEvent.id,
      collegeName: collegeName.trim(),
      captainName: captainName.trim(),
      captainMobile: captainMobile.trim(),
      captainEmail: captainEmail.trim(),
      teamName: activeTab === 'team' ? (teamName.trim() || `${captainName.trim()}'s Team`) : undefined,
      participants: roster,
      totalAmount: computedTotalFee,
      paidAmount: paidVal,
      pendingAmount: pendingVal,
      utrNumber: utrNumber.trim(),
      paymentNotes: paymentNotes.trim(),
      volunteerName,
    });

    setIsSubmitting(false);

    if (res.success && res.registration) {
      setCreatedReg(res.registration);
      showToast(res.message);

      // Reset form
      setCollegeName('');
      setCaptainName('');
      setCaptainMobile('');
      setCaptainEmail('');
      setTeamName('');
      setUtrNumber('');
      setTeamMembers([]);
    } else {
      setErrorMsg(res.message);
    }
  };

  const [passcodeInput, setPasscodeInput] = useState('');
  const [authError, setAuthError] = useState('');

  const handlePasscodeUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const clean = passcodeInput.trim();

    if (clean === 'onspotcelestia@' || clean === '24032004psss' || clean.toLowerCase() === 'onspot') {
      setIsAuthenticated(true);
      sessionStorage.setItem('celestia_onspot_auth', 'true');
      sessionStorage.setItem('celestia_active_role', clean === '24032004psss' ? 'admin' : 'onspot');
      showToast('On-Spot Desk Unlocked');
    } else {
      setAuthError('Incorrect passcode. Please enter authorized On-Spot Desk key.');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#050714] text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full p-6 rounded-2xl bg-[#0B102B] border border-emerald-500/50 text-center space-y-5 shadow-2xl animate-scale-up">
          <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-slate-950 font-bold shadow-lg">
            <UserPlus className="w-7 h-7" />
          </div>

          <div>
            <h2 className="text-xl font-bold font-cinzel text-white">On-Spot Desk Passcode Required</h2>
            <p className="text-xs text-slate-300 mt-1">
              Enter authorized access key or passcode to unlock venue registration desk
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
              placeholder="Enter On-Spot Desk Passcode..."
              className="w-full px-4 py-3 rounded-xl bg-black/60 border border-emerald-500/50 text-white font-mono text-sm text-center focus:outline-none focus:border-emerald-500"
            />

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs uppercase tracking-wider hover:bg-emerald-400 transition-colors shadow-lg cursor-pointer"
            >
              Unlock On-Spot Desk
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
    <div className="min-h-screen bg-[#050714] text-[#E5E9F0] pb-24 font-sans selection:bg-emerald-500/30">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-4 right-4 z-50 bg-[#0B102A] text-emerald-300 border border-emerald-500/40 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-bold animate-bounce">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#080D26]/90 backdrop-blur-md border-b border-emerald-500/25 px-4 py-3">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-slate-950 font-black shadow-lg">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-white font-cinzel tracking-wide">
                  On-Spot Registration Desk
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold">
                  VENUE CREATION
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Create new venue registrations · Canonical fee locking · Direct Incharge Sync
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onNavigateToRegDesk && (
              <button
                onClick={onNavigateToRegDesk}
                className="px-3 py-1.5 rounded-lg bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30 text-[#F5E7C4] border border-[#D4AF37]/40 text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <span>Check-In Desk</span>
              </button>
            )}

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

      <main className="max-w-4xl mx-auto px-4 pt-6 space-y-6">
        {/* SUCCESS CONFIRMATION MODAL & TICKET PREVIEW */}
        {createdReg && (
          <div className="p-6 rounded-2xl bg-[#091428] border-2 border-emerald-500/60 space-y-4 shadow-2xl relative animate-scale-up">
            <button
              onClick={() => setCreatedReg(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/10 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <span className="text-xs font-mono font-bold text-emerald-300 uppercase">On-Spot Registration Successful</span>
                <h2 className="text-xl font-bold text-white font-cinzel">
                  {createdReg.registrationCode || createdReg.id}
                </h2>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-black/50 border border-white/10 space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2 text-slate-300">
                <div><span className="text-slate-400 block text-[10px] uppercase font-mono">Event:</span> <span className="font-bold text-white">{createdReg.eventTitle} ({createdReg.eventCode})</span></div>
                <div><span className="text-slate-400 block text-[10px] uppercase font-mono">College:</span> <span className="font-bold text-white">{createdReg.college?.collegeName}</span></div>
                <div><span className="text-slate-400 block text-[10px] uppercase font-mono">Captain:</span> <span className="font-bold text-white">{createdReg.participants?.[0]?.fullName}</span></div>
                <div><span className="text-slate-400 block text-[10px] uppercase font-mono">Fee Paid / UTR:</span> <span className="font-bold text-emerald-300">₹{createdReg.paidAmount} (UTR: {createdReg.utrNumber})</span></div>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-white uppercase font-mono block">Issued Participant ID Badges</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(createdReg.participants || []).map((p, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-white block">{p.fullName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{p.mobile}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold">
                      Badge #{p.idCardNumber}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setCreatedReg(null)}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs uppercase tracking-wider hover:bg-emerald-400 transition-colors"
              >
                + Register Next Participant
              </button>
            </div>
          </div>
        )}

        {/* REGISTRATION TYPE TABS */}
        <div className="p-1 rounded-2xl bg-[#0B102B] border border-white/10 flex items-center gap-1">
          <button
            onClick={() => {
              setActiveTab('team');
              setTeamMembers([]);
            }}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'team'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>NEW TEAM REGISTRATION</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('individual');
              setTeamMembers([]);
            }}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'individual'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-4 h-4" />
            <span>NEW INDIVIDUAL REGISTRATION</span>
          </button>
        </div>

        {/* NEW REGISTRATION FORM */}
        <form onSubmit={handleSubmitOnSpot} className="p-6 rounded-2xl bg-[#0B102B] border border-emerald-500/30 space-y-5 shadow-2xl">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {duplicateWarning && (
            <div className="p-3 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>{duplicateWarning}</span>
            </div>
          )}

          {/* SECTION 1: EVENT SELECTION */}
          <div className="space-y-2">
            <label className="text-slate-400 text-[10px] uppercase font-mono block font-bold">
              1. Select Festival Event *
            </label>
            <select
              required
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/20 text-white font-bold text-xs focus:outline-none focus:border-emerald-500"
            >
              <option value="">-- Choose Official Event ({EVENTS_DATA.length} Available) --</option>
              {EVENTS_DATA.filter((e) => activeTab === 'individual' ? e.type === 'Solo' : e.type !== 'Solo').map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.code} · {ev.title} ({ev.categoryDisplay}) - Fee: ₹{ev.feeAmount} ({ev.feeType === 'per_head' ? 'Per Head' : 'Per Team'})
                </option>
              ))}
            </select>

            {selectedEvent && (
              <div className="p-3 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between text-xs text-slate-300">
                <div>
                  <span className="font-bold text-white block">{selectedEvent.title} ({selectedEvent.code})</span>
                  <span className="text-[11px] text-slate-400">Venue: {selectedEvent.venue} · Type: {selectedEvent.type}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-mono">Official Fee</span>
                  <span className="font-bold text-emerald-400 font-mono text-sm">₹{selectedEvent.feeAmount} ({selectedEvent.feeType === 'per_head' ? 'Per Head' : 'Per Team'})</span>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 2: COLLEGE & CAPTAIN DETAILS */}
          <div className="space-y-3 pt-2 border-t border-white/10">
            <label className="text-slate-400 text-[10px] uppercase font-mono block font-bold">
              2. Participant & Collegiate Details
            </label>

            <div>
              <label className="text-slate-400 text-[10px] uppercase font-mono block mb-1">College Name *</label>
              <input
                type="text"
                required
                value={collegeName}
                onChange={(e) => setCollegeName(e.target.value)}
                placeholder="e.g. Srinivasan Medical College / St. Joseph's College"
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/20 text-white text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 text-[10px] uppercase font-mono block mb-1">
                  {activeTab === 'team' ? 'Captain / Leader Name *' : 'Participant Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={captainName}
                  onChange={(e) => setCaptainName(e.target.value)}
                  placeholder="Full Name"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/20 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-400 text-[10px] uppercase font-mono block mb-1">Mobile Number *</label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={captainMobile}
                  onChange={(e) => setCaptainMobile(e.target.value.replace(/\D/g, ''))}
                  placeholder="10-digit mobile number"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/20 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {activeTab === 'team' && (
              <div>
                <label className="text-slate-400 text-[10px] uppercase font-mono block mb-1">Team Name (Optional)</label>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="e.g. Thunder Dancers"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/20 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
            )}
          </div>

          {/* SECTION 3: ADDITIONAL TEAM MEMBERS (FOR TEAM REGISTRATIONS) */}
          {activeTab === 'team' && selectedEvent && (
            <div className="space-y-3 pt-2 border-t border-white/10">
              <div className="flex items-center justify-between">
                <label className="text-slate-400 text-[10px] uppercase font-mono block font-bold">
                  3. Team Members Roster (1 Captain + {teamMembers.length} Members = {1 + teamMembers.length} Total)
                </label>
                <button
                  type="button"
                  onClick={handleAddMember}
                  className="px-3 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Team Member</span>
                </button>
              </div>

              <div className="space-y-2">
                {teamMembers.map((tm, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-amber-300">Member #{idx + 2}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(idx)}
                        className="text-rose-400 hover:text-rose-300 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        required
                        placeholder="Member Full Name"
                        value={tm.fullName}
                        onChange={(e) => handleUpdateMember(idx, 'fullName', e.target.value)}
                        className="px-3 py-2 rounded-lg bg-black/60 border border-white/15 text-white text-xs focus:outline-none focus:border-emerald-500"
                      />
                      <input
                        type="tel"
                        maxLength={10}
                        placeholder="Mobile Number"
                        value={tm.mobile}
                        onChange={(e) => handleUpdateMember(idx, 'mobile', e.target.value.replace(/\D/g, ''))}
                        className="px-3 py-2 rounded-lg bg-black/60 border border-white/15 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 4: LOCKED FEE & PAYMENT UTR RECORDING */}
          <div className="space-y-3 pt-2 border-t border-white/10">
            <label className="text-slate-400 text-[10px] uppercase font-mono block font-bold">
              4. Locked Registration Fee & UTR Entry
            </label>

            <div className="p-4 rounded-xl bg-black/60 border border-emerald-500/40 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-mono block">Calculated Total Fee</span>
                <span className="text-lg font-bold text-white font-mono">₹{computedTotalFee}</span>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] uppercase font-mono block">Amount Received (₹) *</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={paidAmountInput}
                  onChange={(e) => setPaidAmountInput(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-black/80 border border-emerald-500/50 font-mono font-bold text-emerald-300 text-sm focus:outline-none"
                />
              </div>

              <div>
                <span className="text-slate-400 text-[10px] uppercase font-mono block">Bank UTR / Ref Number *</span>
                <input
                  type="text"
                  required
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value.toUpperCase().trim())}
                  placeholder="e.g. 667134329031 or CASH-DESK"
                  className="w-full px-3 py-1.5 rounded-lg bg-black/80 border border-emerald-500/50 font-mono font-bold text-white text-xs focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* RULES ACCEPTANCE */}
          <div className="pt-2 flex items-center gap-2">
            <input
              type="checkbox"
              id="rules"
              checked={rulesAccepted}
              onChange={(e) => setRulesAccepted(e.target.checked)}
              className="w-4 h-4 accent-emerald-500 rounded"
            />
            <label htmlFor="rules" className="text-xs text-slate-300 select-none cursor-pointer">
              Participant agrees to official Celestia'26 festival rules & code of conduct.
            </label>
          </div>

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                <span>Processing On-Spot Registration...</span>
              </>
            ) : (
              <>
                <BadgeCheck className="w-4 h-4 text-slate-950" />
                <span>Create On-Spot Registration & Issue Badges</span>
              </>
            )}
          </button>
        </form>
      </main>
    </div>
  );
};
