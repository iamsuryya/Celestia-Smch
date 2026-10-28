import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Trash2, 
  ArrowLeft, 
  ArrowRight, 
  AlertCircle, 
  Sparkles, 
  Building2, 
  Upload, 
  FileText, 
  CheckCircle2, 
  ShieldCheck,
  ChevronRight,
  Info,
  GraduationCap
} from 'lucide-react';
import { useRegistration } from '../../context/RegistrationContext';
import { ParticipantMember } from '../../types/registration';
import { isEventRegistrationOpen } from '../../utils/registrationStatus';

export const ParticipantForm: React.FC = () => {
  const { 
    selectedEvent, 
    collegeDetails, 
    participants, 
    setParticipants, 
    teamName, 
    setTeamName, 
    goToStep 
  } = useRegistration();

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  if (!selectedEvent) {
    return (
      <div className="max-w-md mx-auto text-center py-12 text-slate-300">
        <p>No event selected. Please choose an event first.</p>
        <button
          onClick={() => goToStep('event')}
          className="mt-4 px-4 py-2 bg-[#D4AF37] text-[#070B1B] rounded font-semibold text-xs cursor-pointer"
        >
          Select Event
        </button>
      </div>
    );
  }

  const isSolo = selectedEvent.type === 'Solo';
  const isDuo = selectedEvent.type === 'Duo';
  const isTeam = selectedEvent.type === 'Team';

  const maxCount = selectedEvent.maxParticipants;

  // Handle input text changes for a participant
  const handleMemberChange = (index: number, field: keyof ParticipantMember, value: string) => {
    setParticipants((prev) => {
      const updated = [...prev];
      if (!updated[index]) return prev;
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });

    // Clear specific field error on change
    const errKey = `${field}_${index}`;
    if (errors[errKey]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[errKey];
        return copy;
      });
    }
  };

  // Handle ID Card file upload for individual participant or team captain
  const handleIdCardUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        [`idCard_${index}`]: 'File size exceeds 5MB limit. Please upload a smaller file.',
      }));
      return;
    }

    // Clear error
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy[`idCard_${index}`];
      return copy;
    });

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setParticipants((prev) => {
        const updated = [...prev];
        if (!updated[index]) return prev;
        updated[index] = {
          ...updated[index],
          idCardFileName: file.name,
          idCardFileData: dataUrl,
          idCardFile: file,
        };
        return updated;
      });
    };
    reader.readAsDataURL(file);
  };

  // Remove uploaded ID card
  const handleRemoveIdCard = (index: number) => {
    setParticipants((prev) => {
      const updated = [...prev];
      if (!updated[index]) return prev;
      updated[index] = {
        ...updated[index],
        idCardFileName: undefined,
        idCardFileData: undefined,
      };
      return updated;
    });
  };

  // Add another team member (optional)
  const addMember = () => {
    if (maxCount !== null && participants.length >= maxCount) return;
    setParticipants((prev) => [
      ...prev,
      {
        fullName: '',
        gender: 'Male',
        age: '',
        mobile: '',
        email: '',
        role: isDuo ? 'Participant 2' : `Team Member #${prev.length + 1}`,
      },
    ]);
  };

  // Remove a specific team member
  const removeMember = (index: number) => {
    if (index === 0) return; // Cannot remove captain
    setParticipants((prev) => prev.filter((_, idx) => idx !== index));
    // Clean up any errors for this index
    setErrors((prev) => {
      const updated: { [key: string]: string } = {};
      Object.keys(prev).forEach((k) => {
        if (!k.endsWith(`_${index}`)) {
          updated[k] = prev[k];
        }
      });
      return updated;
    });
  };

  // Validate form before proceeding
  const validate = () => {
    const errs: { [key: string]: string } = {};

    // For team / duo, team name is required
    if (!isSolo && !teamName.trim()) {
      errs.teamName = 'Please provide a team / contingent entry name.';
    }

    if (maxCount !== null && participants.length > maxCount) {
      errs.count = `Maximum ${maxCount} participant(s) allowed for ${selectedEvent.title}. Currently: ${participants.length}.`;
    }

    // 1. Validate Captain (Index 0) or Individual Participant
    const leader = participants[0];
    if (!leader) {
      errs.leader = 'Primary participant details are required.';
    } else {
      // Full Name (REQUIRED)
      if (!leader.fullName.trim() || leader.fullName.trim().length < 2) {
        errs.name_0 = `${isSolo ? 'Participant' : 'Team Captain'} full legal name is required.`;
      }

      // Age (REQUIRED)
      if (!leader.age || isNaN(Number(leader.age)) || Number(leader.age) < 15 || Number(leader.age) > 60) {
        errs.age_0 = 'Please enter a valid age between 15 and 60.';
      }

      // Mobile (REQUIRED: 10 digits)
      const phoneClean = leader.mobile.replace(/\D/g, '');
      if (phoneClean.length < 10) {
        errs.mobile_0 = `Valid 10-digit mobile number required for ${isSolo ? 'participant' : 'captain'}.`;
      }

      // Email (REQUIRED)
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!leader.email.trim() || !emailRegex.test(leader.email.trim())) {
        errs.email_0 = `Valid email address required for ${isSolo ? 'participant' : 'captain'}.`;
      }

      // ID Card Upload (REQUIRED for Solo and Captain)
      if (!leader.idCardFileName) {
        errs.idCard_0 = `Student College ID Card / Bonafide Certificate upload is required for ${isSolo ? 'individual participant' : 'team captain'}.`;
      }
    }

    // 2. Validate other team members (index >= 1) IF they were added
    // For other team members:
    // REQUIRED: Full Name, Gender, Age, Mobile
    // OPTIONAL: Email
    // NO ID card upload required
    // NO College Roll Number
    participants.slice(1).forEach((m, offset) => {
      const idx = offset + 1;

      // Full Name (REQUIRED)
      if (!m.fullName.trim() || m.fullName.trim().length < 2) {
        errs[`name_${idx}`] = `Full name is required for team member #${idx + 1}.`;
      }

      // Age (REQUIRED)
      if (!m.age || isNaN(Number(m.age)) || Number(m.age) < 15 || Number(m.age) > 60) {
        errs[`age_${idx}`] = `Valid age required for member #${idx + 1}.`;
      }

      // Mobile (REQUIRED)
      const phoneClean = m.mobile.replace(/\D/g, '');
      if (phoneClean.length < 10) {
        errs[`mobile_${idx}`] = `Valid 10-digit mobile required for member #${idx + 1}.`;
      }

      // Email (OPTIONAL: validate format only if provided)
      if (m.email.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(m.email.trim())) {
          errs[`email_${idx}`] = `Invalid email format for member #${idx + 1}. Leave blank if not available.`;
        }
      }
    });

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleProceed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEventRegistrationOpen(selectedEvent.id) || !isEventRegistrationOpen(selectedEvent.code)) {
      alert(`Registration for ${selectedEvent.title} (${selectedEvent.code}) has been stopped by the Admin.`);
      return;
    }
    if (!validate()) return;
    goToStep('review');
  };

  // Option to explicitly skip adding team members and continue with only captain
  const handleSkipTeamMembers = () => {
    // Keep only captain
    setParticipants((prev) => [prev[0]]);

    // Validate only captain & team name
    const errs: { [key: string]: string } = {};
    if (!isSolo && !teamName.trim()) {
      errs.teamName = 'Please provide a team / contingent entry name.';
    }

    const leader = participants[0];
    if (leader) {
      if (!leader.fullName.trim() || leader.fullName.trim().length < 2) {
        errs.name_0 = 'Team Captain full legal name is required.';
      }
      if (!leader.age || isNaN(Number(leader.age)) || Number(leader.age) < 15 || Number(leader.age) > 60) {
        errs.age_0 = 'Please enter a valid age between 15 and 60.';
      }
      const phoneClean = leader.mobile.replace(/\D/g, '');
      if (phoneClean.length < 10) {
        errs.mobile_0 = 'Valid 10-digit mobile number required for team captain.';
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!leader.email.trim() || !emailRegex.test(leader.email.trim())) {
        errs.email_0 = 'Valid email address required for team captain.';
      }
      if (!leader.idCardFileName) {
        errs.idCard_0 = 'Student College ID Card / Bonafide Certificate is required for the team captain.';
      }
    }

    setErrors(errs);
    if (Object.keys(errs).length === 0) {
      goToStep('review');
    }
  };

  const leader = participants[0] || {
    fullName: '',
    gender: 'Male',
    age: '',
    mobile: '',
    email: '',
    role: isSolo ? 'Solo Performer' : 'Team Captain',
  };

  const additionalMembers = participants.slice(1);

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 space-y-6">
      
      {/* Header */}
      <div className="text-center max-w-xl mx-auto">
        <div className="text-[11px] font-mono text-[#D4AF37] uppercase tracking-wider mb-1">
          Step 4 · Participant Details
        </div>
        <h2 className="font-cinzel text-2xl sm:text-4xl font-bold text-white mb-2">
          {selectedEvent.title} Roster
        </h2>
        <div className="flex items-center justify-center gap-2 text-xs text-slate-300">
          <span className="font-semibold text-[#F5E7C4]">{selectedEvent.type} Event</span>
          <span aria-hidden="true">·</span>
          <span>
            {isSolo
              ? 'Individual Participant Entry'
              : 'Team Captain required; additional team members can be added now or skipped'}
          </span>
        </div>
      </div>

      {(!isEventRegistrationOpen(selectedEvent.id) || !isEventRegistrationOpen(selectedEvent.code)) && (
        <div className="p-4 rounded-xl bg-rose-950/80 border-2 border-rose-500 text-rose-200 text-xs sm:text-sm font-semibold flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <div>
            <strong className="block text-white text-sm">Registration Stopped by Admin</strong>
            <span>Registration for {selectedEvent.title} ({selectedEvent.code}) has been closed by festival management. You cannot proceed or submit new entries.</span>
          </div>
        </div>
      )}

      {/* College Notice Bar */}
      {collegeDetails && (
        <div className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs ${
          collegeDetails.isHostCollege
            ? 'bg-[#0E163B] border-[#D4AF37]/50 text-white shadow-md'
            : 'bg-[#080D24] border border-white/10 text-slate-300'
        }`}>
          <div className="flex items-center gap-2">
            {collegeDetails.isHostCollege ? (
              <GraduationCap className="w-4 h-4 text-[#D4AF37] shrink-0" />
            ) : (
              <Building2 className="w-4 h-4 text-[#D4AF37] shrink-0" />
            )}
            <span>
              Representing: <strong className="text-white">{collegeDetails.collegeName}</strong>
              {collegeDetails.isHostCollege && (
                <span className="ml-2 font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  SMCH Host Student · Reg: {collegeDetails.hostRegisterNumber || 'Provided'}
                </span>
              )}
            </span>
          </div>
          <span className={`text-[11px] font-mono font-bold ${collegeDetails.isHostCollege ? 'text-emerald-400' : 'text-[#E6C57D]'}`}>
            {collegeDetails.isHostCollege ? '₹0 Fee (Host Waiver Applied)' : `Fee: ${selectedEvent.registrationFee}`}
          </span>
        </div>
      )}

      <form onSubmit={handleProceed} className="space-y-6">
        
        {/* Team Name for Duo / Team */}
        {!isSolo && (
          <div className="celestial-glass rounded-xl p-5 border border-[#D4AF37]/25 space-y-2">
            <label className="block text-xs font-semibold text-slate-200">
              Team / Entry Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={teamName}
              onChange={(e) => {
                setTeamName(e.target.value);
                if (errors.teamName) {
                  setErrors((prev) => {
                    const copy = { ...prev };
                    delete copy.teamName;
                    return copy;
                  });
                }
              }}
              placeholder="e.g. Celestial Beats / Pulse Crew / SMCH Duo"
              className="w-full px-3.5 py-2.5 bg-[#080D24] border border-white/10 focus:border-[#D4AF37] rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
            />
            {errors.teamName && (
              <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.teamName}
              </p>
            )}
          </div>
        )}

        {/* Global Roster Error */}
        {errors.count && (
          <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errors.count}</span>
          </div>
        )}

        {/* =========================================================================
            CARD 1: INDIVIDUAL PARTICIPANT (Solo) OR TEAM CAPTAIN (Duo / Team)
            Required: Full Name, Gender, Age, Mobile, Email, ID Card Upload
            Removed: College Roll Number
        ========================================================================= */}
        <div className="celestial-glass rounded-xl p-5 sm:p-6 border border-white/10 space-y-4 relative">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#121B3D] border border-[#D4AF37]/35 flex items-center justify-center text-xs font-bold text-[#E6C57D]">
                1
              </div>
              <span className="font-semibold text-sm text-white">
                {isSolo 
                  ? 'Individual Participant Details' 
                  : isDuo 
                  ? 'Team Captain / Participant 1' 
                  : 'Team Captain / Primary Contact'}
              </span>
            </div>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#D4AF37]/15 text-[#E6C57D] border border-[#D4AF37]/30">
              Required
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Full Legal Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={leader.fullName}
                onChange={(e) => handleMemberChange(0, 'fullName', e.target.value)}
                placeholder="e.g. Priya Sundaram"
                className="w-full px-3.5 py-2 bg-[#080D24] border border-white/10 focus:border-[#D4AF37] rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
              />
              {errors.name_0 && (
                <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.name_0}
                </p>
              )}
            </div>

            {/* Gender */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Gender <span className="text-rose-400">*</span>
              </label>
              <select
                value={leader.gender}
                onChange={(e) => handleMemberChange(0, 'gender', e.target.value as any)}
                className="w-full px-3.5 py-2 bg-[#080D24] border border-white/10 focus:border-[#D4AF37] rounded-lg text-sm text-white focus:outline-none transition-colors"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>

            {/* Age */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Age <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                min={15}
                max={60}
                required
                value={leader.age}
                onChange={(e) => handleMemberChange(0, 'age', e.target.value)}
                placeholder="e.g. 21"
                className="w-full px-3.5 py-2 bg-[#080D24] border border-white/10 focus:border-[#D4AF37] rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
              />
              {errors.age_0 && (
                <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.age_0}
                </p>
              )}
            </div>

            {/* Mobile */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Mobile Number <span className="text-rose-400">*</span>
              </label>
              <input
                type="tel"
                required
                value={leader.mobile}
                onChange={(e) => handleMemberChange(0, 'mobile', e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3.5 py-2 bg-[#080D24] border border-white/10 focus:border-[#D4AF37] rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
              />
              {errors.mobile_0 && (
                <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.mobile_0}
                </p>
              )}
            </div>

            {/* Email ID */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Email ID <span className="text-rose-400">*</span>
              </label>
              <input
                type="email"
                required
                value={leader.email}
                onChange={(e) => handleMemberChange(0, 'email', e.target.value)}
                placeholder="student@college.edu.in"
                className="w-full px-3.5 py-2 bg-[#080D24] border border-white/10 focus:border-[#D4AF37] rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
              />
              {errors.email_0 && (
                <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.email_0}
                </p>
              )}
            </div>

            {/* ID Card Upload (REQUIRED for Solo / Captain) */}
            <div className="sm:col-span-2 pt-2 border-t border-white/5">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  Student College ID Card / Bonafide Certificate <span className="text-rose-400">*</span>
                </label>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#D4AF37]/15 text-[#E6C57D] border border-[#D4AF37]/30">
                  Required
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mb-2.5">
                Upload student ID card or bonafide certificate for eligibility verification (JPG, PNG, or PDF up to 5MB).
              </p>

              {leader.idCardFileName ? (
                <div className="p-3.5 rounded-lg bg-[#080D24] border border-[#D4AF37]/40 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center shrink-0 text-[#E6C57D]">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate max-w-xs sm:max-w-md">
                        {leader.idCardFileName}
                      </p>
                      <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
                        <CheckCircle2 className="w-3 h-3" /> Uploaded & Ready
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <label className="py-1 px-2.5 rounded bg-white/5 hover:bg-white/10 text-[11px] font-medium text-slate-200 cursor-pointer transition-colors">
                      Replace
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.pdf,image/*,application/pdf"
                        onChange={(e) => handleIdCardUpload(0, e)}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => handleRemoveIdCard(0)}
                      className="p-1.5 rounded text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Remove file"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-white/15 hover:border-[#D4AF37]/50 rounded-xl bg-[#080D24]/60 hover:bg-[#080D24] transition-all cursor-pointer group">
                    <Upload className="w-6 h-6 text-slate-400 group-hover:text-[#D4AF37] mb-1.5 transition-colors" />
                    <span className="text-xs font-medium text-slate-200 group-hover:text-white">
                      Click to upload ID Card / Certificate
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5">
                      JPG, PNG, or PDF (Max: 5MB)
                    </span>
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf,image/*,application/pdf"
                      onChange={(e) => handleIdCardUpload(0, e)}
                      className="hidden"
                    />
                  </label>
                  {errors.idCard_0 && (
                    <p className="text-[11px] text-rose-400 mt-1.5 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" /> {errors.idCard_0}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* =========================================================================
            SECTION: ADDITIONAL TEAM MEMBERS (OPTIONAL)
            Only for Duo / Team events
            Details are OPTIONAL to add.
            If added:
              REQUIRED: Full Name, Gender, Age, Mobile
              OPTIONAL: Email ID
              NO ID card upload
              NO College Roll Number
            User can SKIP adding team members and continue!
        ========================================================================= */}
        {!isSolo && (
          <div className="space-y-4">
            
            {/* Header banner indicating Optional status */}
            <div className="p-4 rounded-xl bg-[#0B1028] border border-[#D4AF37]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <Info className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-xs sm:text-sm font-semibold text-white flex items-center gap-2">
                    <span>Add Team Members — Optional</span>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      Optional
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    You can add team member details now or skip this step. Additional roster members can be verified at the registration desk.
                  </p>
                </div>
              </div>

              {/* Quick Skip button if members are present or user wants to proceed */}
              {additionalMembers.length > 0 && (
                <button
                  type="button"
                  onClick={handleSkipTeamMembers}
                  className="shrink-0 text-xs text-[#E6C57D] hover:text-[#F5E7C4] hover:underline flex items-center gap-1 cursor-pointer self-end sm:self-center"
                >
                  <span>Skip Members & Continue</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* List of added team members */}
            {additionalMembers.map((member, subIdx) => {
              const index = subIdx + 1;
              const memberLabel = isDuo ? 'Participant 2' : `Team Member #${index + 1}`;

              return (
                <div 
                  key={index} 
                  className="celestial-glass rounded-xl p-5 sm:p-6 border border-white/10 space-y-4 relative"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-white/5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#121B3D] border border-white/20 flex items-center justify-center text-xs font-bold text-slate-300">
                        {index + 1}
                      </div>
                      <span className="font-semibold text-sm text-white">
                        {memberLabel}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        (Optional Member)
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeMember(index)}
                      className="text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 px-2 py-1 rounded flex items-center gap-1 cursor-pointer transition-colors"
                      title="Remove member"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Full Name (REQUIRED if member added) */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Full Legal Name <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={member.fullName}
                        onChange={(e) => handleMemberChange(index, 'fullName', e.target.value)}
                        placeholder="e.g. Arun Kumar"
                        className="w-full px-3.5 py-2 bg-[#080D24] border border-white/10 focus:border-[#D4AF37] rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
                      />
                      {errors[`name_${index}`] && (
                        <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> {errors[`name_${index}`]}
                        </p>
                      )}
                    </div>

                    {/* Gender (REQUIRED if member added) */}
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Gender <span className="text-rose-400">*</span>
                      </label>
                      <select
                        value={member.gender}
                        onChange={(e) => handleMemberChange(index, 'gender', e.target.value as any)}
                        className="w-full px-3.5 py-2 bg-[#080D24] border border-white/10 focus:border-[#D4AF37] rounded-lg text-sm text-white focus:outline-none transition-colors"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                      </select>
                    </div>

                    {/* Age (REQUIRED if member added) */}
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Age <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="number"
                        min={15}
                        max={60}
                        required
                        value={member.age}
                        onChange={(e) => handleMemberChange(index, 'age', e.target.value)}
                        placeholder="e.g. 21"
                        className="w-full px-3.5 py-2 bg-[#080D24] border border-white/10 focus:border-[#D4AF37] rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
                      />
                      {errors[`age_${index}`] && (
                        <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> {errors[`age_${index}`]}
                        </p>
                      )}
                    </div>

                    {/* Mobile (REQUIRED if member added) */}
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Mobile Number <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={member.mobile}
                        onChange={(e) => handleMemberChange(index, 'mobile', e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full px-3.5 py-2 bg-[#080D24] border border-white/10 focus:border-[#D4AF37] rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
                      />
                      {errors[`mobile_${index}`] && (
                        <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> {errors[`mobile_${index}`]}
                        </p>
                      )}
                    </div>

                    {/* Email (OPTIONAL for other team members) */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-medium text-slate-300">
                          Email ID
                        </label>
                        <span className="text-[10px] text-slate-500 font-mono">Optional</span>
                      </div>
                      <input
                        type="email"
                        value={member.email}
                        onChange={(e) => handleMemberChange(index, 'email', e.target.value)}
                        placeholder="optional@college.edu.in"
                        className="w-full px-3.5 py-2 bg-[#080D24] border border-white/10 focus:border-[#D4AF37] rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
                      />
                      {errors[`email_${index}`] && (
                        <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> {errors[`email_${index}`]}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Clear button: + Add Team Member */}
            {(maxCount === null || participants.length < maxCount) && (
              <div className="pt-1 text-center">
                <button
                  type="button"
                  onClick={addMember}
                  className="py-2.5 px-5 text-xs font-semibold text-[#F5E7C4] hover:text-white bg-[#0F173C] hover:bg-[#162152] border border-[#D4AF37]/35 rounded-lg transition-all inline-flex items-center gap-2 cursor-pointer shadow-sm hover:border-[#D4AF37]"
                >
                  <UserPlus className="w-4 h-4 text-[#D4AF37]" />
                  <span>+ Add Team Member {additionalMembers.length > 0 ? `(${participants.length} added)` : ''}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Form Bottom Controls */}
        <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => goToStep('event')}
            className="w-full sm:w-auto py-2.5 px-4 text-xs font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Change Event</span>
          </button>

          <div className="w-full sm:w-auto flex items-center gap-3">
            {/* If Duo/Team and no extra members added, or if user wants to skip extra members */}
            {!isSolo && additionalMembers.length === 0 && (
              <span className="hidden md:inline-block text-[11px] text-slate-400 font-mono">
                Team members optional
              </span>
            )}

            <button
              type="submit"
              className="w-full sm:w-auto py-3 px-6 text-xs font-bold tracking-wider uppercase text-[#070B1B] bg-gradient-to-r from-[#F5E7C4] via-[#E6C57D] to-[#D4AF37] hover:brightness-110 active:scale-95 rounded-lg transition-all shadow-md shadow-[#D4AF37]/25 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Continue to Review</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
