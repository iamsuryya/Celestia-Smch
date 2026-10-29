import React, { useState } from 'react';
import { Building2, MapPin, User, Phone, Mail, AlertCircle, ArrowRight, ArrowLeft, CheckCircle2, ShieldAlert, GraduationCap, KeyRound, Eye, EyeOff } from 'lucide-react';
import { useRegistration } from '../../context/RegistrationContext';
import { CollegeDetails } from '../../types/registration';
import { getSmchPasscode } from '../../utils/registrationStatus';

export const CollegeForm: React.FC = () => {
  const { currentUser, collegeDetails, saveCollegeDetails, selectedEvent, goToStep } = useRegistration();

  const [isHostCollege, setIsHostCollege] = useState(collegeDetails?.isHostCollege ?? false);
  const [hostRegisterNumber, setHostRegisterNumber] = useState(collegeDetails?.hostRegisterNumber || '');
  const [hostBatch, setHostBatch] = useState(collegeDetails?.hostBatch || '');
  const [hostDepartment, setHostDepartment] = useState(collegeDetails?.hostDepartment || '');
  const [hostPasscode, setHostPasscode] = useState(collegeDetails?.hostPasscode || '');
  const [showPasscode, setShowPasscode] = useState(false);

  const [collegeName, setCollegeName] = useState(
    collegeDetails?.collegeName || 
    (isHostCollege ? 'Srinivasan Medical College and Hospital, Trichy' : '')
  );
  const [city, setCity] = useState(collegeDetails?.city || (isHostCollege ? 'Trichy' : ''));
  const [state, setState] = useState(collegeDetails?.state || 'Tamil Nadu');
  const [contactPerson, setContactPerson] = useState(
    collegeDetails?.contactPerson || currentUser?.fullName || ''
  );
  const [contactMobile, setContactMobile] = useState(
    collegeDetails?.contactMobile || currentUser?.mobile || ''
  );
  const [contactEmail, setContactEmail] = useState(
    collegeDetails?.contactEmail || currentUser?.email || ''
  );
  const [isCollegeDelegation, setIsCollegeDelegation] = useState(collegeDetails?.isCollegeDelegation ?? false);

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Re-sync fields if collegeDetails or currentUser updates from context
  React.useEffect(() => {
    if (collegeDetails) {
      if (collegeDetails.collegeName) setCollegeName(collegeDetails.collegeName);
      if (collegeDetails.city) setCity(collegeDetails.city);
      if (collegeDetails.state) setState(collegeDetails.state);
      if (collegeDetails.contactPerson) setContactPerson(collegeDetails.contactPerson);
      if (collegeDetails.contactMobile) setContactMobile(collegeDetails.contactMobile);
      if (collegeDetails.contactEmail) setContactEmail(collegeDetails.contactEmail);
      if (typeof collegeDetails.isHostCollege === 'boolean') setIsHostCollege(collegeDetails.isHostCollege);
      if (typeof collegeDetails.isCollegeDelegation === 'boolean') setIsCollegeDelegation(collegeDetails.isCollegeDelegation);
    } else if (currentUser) {
      if (currentUser.fullName && currentUser.fullName !== 'Collegiate Delegate' && !contactPerson) {
        setContactPerson(currentUser.fullName);
      }
      if (currentUser.mobile && currentUser.mobile !== '9876543210' && !contactMobile) {
        setContactMobile(currentUser.mobile);
      }
      if (currentUser.email && !contactEmail) {
        setContactEmail(currentUser.email);
      }
    }
  }, [collegeDetails, currentUser]);

  const handleHostCollegeToggle = (checked: boolean) => {
    setIsHostCollege(checked);
    if (checked) {
      setCollegeName('Srinivasan Medical College and Hospital, Trichy');
      setCity('Trichy');
      setState('Tamil Nadu');
    } else {
      if (collegeName === 'Srinivasan Medical College and Hospital, Trichy') {
        setCollegeName('');
        setCity('');
      }
    }
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy.hostRegisterNumber;
      delete copy.hostBatch;
      delete copy.hostPasscode;
      return copy;
    });
  };

  const validate = () => {
    const errs: { [key: string]: string } = {};
    if (!collegeName.trim() || collegeName.trim().length < 3) {
      errs.collegeName = 'Please enter your institution or college name (at least 3 characters).';
    }
    if (!city.trim()) {
      errs.city = 'Please enter your campus city/location.';
    }
    if (!state.trim()) {
      errs.state = 'Please specify your state.';
    }
    if (!contactPerson.trim()) {
      errs.contactPerson = 'Please enter representative contact name.';
    }
    const phoneClean = contactMobile.replace(/\D/g, '');
    if (phoneClean.length < 10) {
      errs.contactMobile = 'Please enter a valid 10-digit contact mobile number.';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!contactEmail.trim() || !emailRegex.test(contactEmail.trim())) {
      errs.contactEmail = 'Please provide a valid contact email.';
    }

    // Host college specific validation
    if (isHostCollege) {
      if (!hostRegisterNumber.trim() || hostRegisterNumber.trim().length < 2) {
        errs.hostRegisterNumber = 'Please enter your Register Number.';
      }
      if (!hostBatch.trim()) {
        errs.hostBatch = 'Please select your batch.';
      }
      const correctCode = getSmchPasscode();
      if (!hostPasscode.trim() || hostPasscode.trim().toUpperCase() !== correctCode.toUpperCase()) {
        errs.hostPasscode = `Incorrect passcode. Correct passcode is required for free waiver.`;
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const correctCode = getSmchPasscode();
    const isVerifiedHost = isHostCollege && hostPasscode.trim().toUpperCase() === correctCode.toUpperCase();

    const details: CollegeDetails = {
      collegeName: isVerifiedHost ? 'Srinivasan Medical College and Hospital, Trichy' : collegeName.trim(),
      city: isVerifiedHost ? 'Trichy' : city.trim(),
      state: isVerifiedHost ? 'Tamil Nadu' : state.trim(),
      contactPerson: contactPerson.trim(),
      contactMobile: contactMobile.trim(),
      contactEmail: contactEmail.trim(),
      isCollegeDelegation,
      isHostCollege: isVerifiedHost,
      hostRegisterNumber: isVerifiedHost ? hostRegisterNumber.trim() : undefined,
      hostBatch: isVerifiedHost ? hostBatch.trim() : undefined,
      hostDepartment: isVerifiedHost ? hostDepartment.trim() : undefined,
      hostPasscode: isVerifiedHost ? hostPasscode.trim() : undefined,
    };

    saveCollegeDetails(details);

    if (selectedEvent) {
      goToStep('participants');
    } else {
      goToStep('event');
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-4">
      <div className="celestial-glass rounded-2xl p-6 sm:p-10 border border-[#D4AF37]/30 shadow-2xl">
        <div className="mb-6">
          <div className="text-[11px] font-mono text-[#D4AF37] uppercase tracking-wider mb-1">
            Step 2 · Institutional Profile
          </div>
          <h2 className="font-cinzel text-2xl font-bold text-white">
            College & Delegation Details
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            This information will be linked to your contingent ID and reused across all your event registrations.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* 1. First question: Are you a student from Srinivasan Medical College & Hospital? */}
          <div className={`p-4 sm:p-5 rounded-xl border transition-all ${
            isHostCollege 
              ? 'bg-[#0E163B] border-[#D4AF37] shadow-lg shadow-[#D4AF37]/15' 
              : 'bg-[#090E25] border-white/10 hover:border-white/20'
          }`}>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isHostCollege}
                onChange={(e) => handleHostCollegeToggle(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-white/30 text-[#D4AF37] focus:ring-[#D4AF37] accent-[#D4AF37] cursor-pointer"
              />
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-[#D4AF37]" />
                    Are you a student from Srinivasan Medical College & Hospital?
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    Host Student Waiver
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-1">
                  Check this box if you are a student from SMCH. Uncheck if you belong to any other college.
                </p>
              </div>
            </label>

            {/* Host Details & Passcode Verification - Appears when checked */}
            {isHostCollege && (
              <div className="mt-4 pt-3.5 border-t border-[#D4AF37]/30 space-y-3">
                {/* Warning Card */}
                <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-rose-100 leading-relaxed font-medium">
                    Only students from Srinivasan Medical College should choose this option. Others using this without authorization and not paying the registration fee will face immediate disqualification.
                  </p>
                </div>

                <div className="space-y-3 pt-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#F5E7C4] mb-1">
                        Register Number *
                      </label>
                      <input
                        type="text"
                        required
                        value={hostRegisterNumber}
                        onChange={(e) => setHostRegisterNumber(e.target.value)}
                        placeholder="e.g. 522112048"
                        className="w-full px-3 py-2 bg-[#060A1D] border border-white/15 focus:border-[#D4AF37] rounded-lg text-xs font-mono text-white placeholder-slate-500 focus:outline-none"
                      />
                      {errors.hostRegisterNumber && (
                        <p className="text-[10px] text-rose-400 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> {errors.hostRegisterNumber}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[#F5E7C4] mb-1">
                        Batch *
                      </label>
                      <select
                        value={hostBatch}
                        onChange={(e) => setHostBatch(e.target.value)}
                        className="w-full px-3 py-2 bg-[#060A1D] border border-white/15 focus:border-[#D4AF37] rounded-lg text-xs text-white focus:outline-none"
                      >
                        <option value="">Select Batch</option>
                        <option value="1st MBBS">1st MBBS</option>
                        <option value="2nd yr MBBS">2nd yr MBBS</option>
                        <option value="3rd yr MBBS">3rd yr MBBS</option>
                        <option value="Final yr MBBS">Final yr MBBS</option>
                        <option value="CRMI">CRMI</option>
                        <option value="Post Graduates">Post Graduates</option>
                      </select>
                      {errors.hostBatch && (
                        <p className="text-[10px] text-rose-400 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> {errors.hostBatch}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#F5E7C4] mb-1">
                      Host Verification Passcode *
                    </label>
                    <div className="relative">
                      <KeyRound className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                      <input
                        type={showPasscode ? "text" : "password"}
                        required
                        value={hostPasscode}
                        onChange={(e) => setHostPasscode(e.target.value)}
                        placeholder="Enter host passcode"
                        className="w-full pl-9 pr-10 py-2 bg-[#060A1D] border border-white/15 focus:border-[#D4AF37] rounded-lg text-xs font-mono text-white placeholder-slate-500 focus:outline-none uppercase"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasscode(!showPasscode)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-white cursor-pointer"
                        title={showPasscode ? "Hide passcode" : "Show passcode"}
                      >
                        {showPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Live Verification Status Box */}
                    {hostPasscode.trim().toUpperCase() === getSmchPasscode().toUpperCase() ? (
                      <div className="mt-2 p-2.5 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fade-in">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>✓ Passcode Verified! Recognized as SMCH Host Student — Registration Fee: ₹0 (Free Waiver)</span>
                      </div>
                    ) : hostPasscode.trim().length > 0 ? (
                      <div className="mt-2 p-2.5 rounded-lg bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        <span>Incorrect passcode. Please enter valid host passcode for fee waiver, or uncheck above if you are from another college.</span>
                      </div>
                    ) : (
                      <div className="mt-2 p-2.5 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs flex items-center gap-2">
                        <KeyRound className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>Enter host passcode to unlock SMCH free entry waiver. Uncheck above if you are from another college.</span>
                      </div>
                    )}

                    {errors.hostPasscode && (
                      <p className="text-[10px] text-rose-400 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {errors.hostPasscode}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 2. College & Institution Fields (Normally asked when not SMCH host, or pre-filled display for SMCH) */}
          {!isHostCollege ? (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  College / Institution Full Name *
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={collegeName}
                    onChange={(e) => setCollegeName(e.target.value)}
                    placeholder="e.g. Madras Medical College, Chennai"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-[#080D24] border border-white/10 focus:border-[#D4AF37] rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
                  />
                </div>
                {errors.collegeName && (
                  <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.collegeName}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    City / Location *
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Chennai / Coimbatore"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-[#080D24] border border-white/10 focus:border-[#D4AF37] rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
                    />
                  </div>
                  {errors.city && (
                    <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {errors.city}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    State *
                  </label>
                  <select
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#080D24] border border-white/10 focus:border-[#D4AF37] rounded-lg text-sm text-white focus:outline-none transition-colors"
                  >
                    <option value="Tamil Nadu">Tamil Nadu</option>
                    <option value="Karnataka">Karnataka</option>
                    <option value="Kerala">Kerala</option>
                    <option value="Andhra Pradesh">Andhra Pradesh</option>
                    <option value="Telangana">Telangana</option>
                    <option value="Puducherry">Puducherry</option>
                    <option value="Maharashtra">Maharashtra</option>
                    <option value="Other States">Other Indian State</option>
                  </select>
                  {errors.state && (
                    <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {errors.state}
                    </p>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="p-3.5 rounded-xl bg-[#0E163B]/60 border border-[#D4AF37]/30 text-xs text-[#F5E7C4] flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#D4AF37]" />
                <span><strong>Institution:</strong> Srinivasan Medical College & Hospital, Trichy</span>
              </span>
              <span className="text-[10px] text-emerald-400 font-semibold uppercase font-mono">SMCH Host</span>
            </div>
          )}

          <div className="pt-2 border-t border-white/10">
            <span className="text-[11px] font-semibold tracking-wider text-[#D4AF37] uppercase block mb-3">
              College Representative / Contact Point
            </span>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Representative / Lead Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  placeholder="e.g. Cultural Secretary / Faculty Advisor / Lead"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-[#080D24] border border-white/10 focus:border-[#D4AF37] rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
                />
              </div>
              {errors.contactPerson && (
                <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.contactPerson}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Contact Mobile *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                  <input
                    type="tel"
                    required
                    value={contactMobile}
                    onChange={(e) => setContactMobile(e.target.value)}
                    placeholder="+91 98765 XXXXX"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-[#080D24] border border-white/10 focus:border-[#D4AF37] rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
                  />
                </div>
                {errors.contactMobile && (
                  <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.contactMobile}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Contact Email *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="rep@college.edu.in"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-[#080D24] border border-white/10 focus:border-[#D4AF37] rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
                  />
                </div>
                {errors.contactEmail && (
                  <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.contactEmail}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => goToStep('account')}
              className="py-2.5 px-4 text-xs font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              type="submit"
              className="py-3 px-6 text-xs font-bold tracking-wider uppercase text-[#070B1B] bg-gradient-to-r from-[#F5E7C4] via-[#E6C57D] to-[#D4AF37] hover:brightness-110 active:scale-95 rounded-lg transition-all shadow-md shadow-[#D4AF37]/25 flex items-center gap-2 cursor-pointer"
            >
              <span>{selectedEvent ? 'Continue to Participants' : 'Continue to Event Selection'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
