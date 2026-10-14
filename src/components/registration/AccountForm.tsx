import React, { useState } from 'react';
import { User, Mail, Phone, Lock, Check, AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { useRegistration } from '../../context/RegistrationContext';

export const AccountForm: React.FC = () => {
  const { currentUser, loginUser, goToStep } = useRegistration();

  const [mode, setMode] = useState<'signup' | 'login'>('signup');
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);

  // Form State
  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [mobile, setMobile] = useState(currentUser?.mobile || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedTerms, setAgreedTerms] = useState(false);

  // Validation errors
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateSignUp = () => {
    const errs: { [key: string]: string } = {};
    if (!fullName.trim() || fullName.trim().length < 2) {
      errs.fullName = 'Please enter your full legal name.';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      errs.email = 'Please provide a valid email address.';
    }
    const phoneClean = mobile.replace(/\D/g, '');
    if (phoneClean.length < 10) {
      errs.mobile = 'Please enter a valid 10-digit mobile number.';
    }
    if (!password || password.length < 6) {
      errs.password = 'Password must be at least 6 characters.';
    }
    if (password !== confirmPassword) {
      errs.confirmPassword = 'Passwords do not match.';
    }
    if (!agreedTerms) {
      errs.terms = 'You must agree to the festival participation guidelines and terms.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateLogin = () => {
    const errs: { [key: string]: string } = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      errs.email = 'Please provide a valid email address.';
    }
    if (!password) {
      errs.password = 'Password is required.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === 'signup') {
      if (!validateSignUp()) return;

      const newAccount = {
        id: `usr_${Date.now()}`,
        fullName: fullName.trim(),
        email: email.trim(),
        mobile: mobile.trim(),
        createdAt: new Date().toISOString(),
      };
      loginUser(newAccount);
      goToStep('college');
    } else {
      if (!validateLogin()) return;

      // Simulated local login
      const loggedAccount = {
        id: currentUser?.id || `usr_${Date.now()}`,
        fullName: fullName.trim(),
        email: email.trim(),
        mobile: mobile.trim(),
        createdAt: new Date().toISOString(),
      };
      loginUser(loggedAccount);
      goToStep('college');
    }
  };

  const handleForgotPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    setForgotSuccess(true);
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-4">
      <div className="celestial-glass rounded-2xl p-6 sm:p-10 border border-[#D4AF37]/30 shadow-2xl">
        
        {/* Toggle Mode: Sign Up / Sign In */}
        <div className="flex rounded-lg bg-[#070B1E] p-1 border border-white/10 mb-8">
          <button
            type="button"
            onClick={() => { setMode('signup'); setErrors({}); }}
            className={`flex-1 py-2.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              mode === 'signup'
                ? 'bg-gradient-to-r from-[#F5E7C4] to-[#D4AF37] text-[#070B1B] shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Create Registration Account
          </button>
          <button
            type="button"
            onClick={() => { setMode('login'); setErrors({}); }}
            className={`flex-1 py-2.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              mode === 'login'
                ? 'bg-gradient-to-r from-[#F5E7C4] to-[#D4AF37] text-[#070B1B] shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In Existing
          </button>
        </div>

        <div className="mb-6">
          <h2 className="font-cinzel text-2xl font-bold text-white">
            {mode === 'signup' ? 'Participant Account' : 'Welcome Back'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            {mode === 'signup' 
              ? 'Create a unified account to register yourself or your team for any Celestia event.' 
              : 'Sign in to access your registered events or book new competition slots.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Full Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Dr. / Mr. / Ms. Arjun Raman"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-[#080D24] border border-white/10 focus:border-[#D4AF37] rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
                />
              </div>
              {errors.fullName && (
                <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.fullName}
                </p>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Official Email Address *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="delegate@institution.edu.in"
                className="w-full pl-10 pr-3.5 py-2.5 bg-[#080D24] border border-white/10 focus:border-[#D4AF37] rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
              />
            </div>
            {errors.email && (
              <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.email}
              </p>
            )}
          </div>

          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Mobile Number (WhatsApp Enabled) *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  type="tel"
                  required
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-[#080D24] border border-white/10 focus:border-[#D4AF37] rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
                />
              </div>
              {errors.mobile && (
                <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.mobile}
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-[#080D24] border border-white/10 focus:border-[#D4AF37] rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
                />
              </div>
              {errors.password && (
                <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.password}
                </p>
              )}
            </div>

            {mode === 'signup' ? (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-[#080D24] border border-white/10 focus:border-[#D4AF37] rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.confirmPassword}
                  </p>
                )}
              </div>
            ) : (
              <div className="flex items-end pb-2">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-xs text-[#E6C57D] hover:underline cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
            )}
          </div>

          {mode === 'signup' && (
            <div className="pt-2">
              <label className="flex items-start gap-2.5 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedTerms}
                  onChange={(e) => setAgreedTerms(e.target.checked)}
                  className="mt-0.5 rounded border-white/20 text-[#D4AF37] focus:ring-[#D4AF37]"
                />
                <span className="leading-relaxed">
                  I agree to the Celestia'26 festival code of conduct and confirm that all contingent details provided are accurate.
                </span>
              </label>
              {errors.terms && (
                <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.terms}
                </p>
              )}
            </div>
          )}

          {/* Form Actions */}
          <div className="pt-4 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => goToStep('landing')}
              className="py-2.5 px-4 text-xs font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              type="submit"
              className="py-3 px-6 text-xs font-bold tracking-wider uppercase text-[#070B1B] bg-gradient-to-r from-[#F5E7C4] via-[#E6C57D] to-[#D4AF37] hover:brightness-110 active:scale-95 rounded-lg transition-all shadow-md shadow-[#D4AF37]/25 flex items-center gap-2 cursor-pointer"
            >
              <span>{mode === 'signup' ? 'Continue to College Details' : 'Sign In & Continue'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md p-6 bg-[#090E25] border border-[#D4AF37]/35 rounded-2xl shadow-2xl">
            <h3 className="font-cinzel text-xl font-bold text-white mb-2">Reset Account Password</h3>
            <p className="text-xs text-slate-300 mb-4">
              Enter your registered username or email address to receive password recovery guidance.
            </p>

            {!forgotSuccess ? (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                <input
                  type="text"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="Username or registered email"
                  className="w-full px-3.5 py-2.5 bg-[#050714] border border-white/15 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:border-[#D4AF37]"
                />
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => { setShowForgotModal(false); setForgotSuccess(false); }}
                    className="px-3 py-1.5 text-xs text-slate-400 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-bold text-[#070B1B] bg-gradient-to-r from-[#F5E7C4] to-[#D4AF37] rounded-md hover:brightness-110 transition-all cursor-pointer"
                  >
                    Send Guidance
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center py-4 space-y-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
                  <Check className="w-5 h-5" />
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Password recovery guidance has been generated for <strong className="text-white">{forgotEmail}</strong>.
                </p>
                <div className="p-3 rounded-xl bg-[#050714] border border-[#D4AF37]/30 text-xs text-slate-200 space-y-1 text-left">
                  <p className="font-semibold text-[#D4AF37]">Direct Support Contacts:</p>
                  <p>Email: <a href="mailto:celestiasmch@gmail.com" className="text-white hover:underline font-mono">celestiasmch@gmail.com</a></p>
                  <p>Phone / WhatsApp: <a href="tel:8075970766" className="text-white hover:underline font-mono">+91 8075970766</a></p>
                </div>
                <button
                  type="button"
                  onClick={() => { setShowForgotModal(false); setForgotSuccess(false); }}
                  className="px-4 py-1.5 text-xs font-semibold text-[#070B1B] bg-[#E6C57D] rounded-md hover:bg-[#d4af37] cursor-pointer"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
