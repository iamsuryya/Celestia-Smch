import React, { useState, useEffect } from 'react';
import { X, Sparkles, CheckCircle2, AlertCircle, Building2, User, Mail, Phone, Calendar } from 'lucide-react';
import { FESTIVAL_METADATA, EVENTS_DATA, EventItem } from '../data/festivalData';

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEvent?: EventItem | null;
}

export const RegistrationModal: React.FC<RegistrationModalProps> = ({
  isOpen,
  onClose,
  initialEvent,
}) => {
  const [collegeName, setCollegeName] = useState('');
  const [delegateName, setDelegateName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedEventId, setSelectedEventId] = useState<string>(initialEvent?.id || 'contingent');
  const [submitted, setSubmitted] = useState(false);
  const [refCode, setRefCode] = useState('');

  useEffect(() => {
    if (initialEvent) {
      setSelectedEventId(initialEvent.id);
    }
  }, [initialEvent]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!collegeName.trim() || !delegateName.trim() || !email.trim()) return;

    const randomNum = Math.floor(1000 + Math.random() * 9000);
    setRefCode(`CEL26-PRE-${randomNum}`);
    setSubmitted(true);
  };

  const handleReset = () => {
    setSubmitted(false);
    onClose();
  };

  const selectedEventObj = EVENTS_DATA.find((e) => e.id === selectedEventId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-[#03050E]/85 backdrop-blur-md cursor-pointer"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Surface */}
      <div 
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-xl my-auto bg-[#070B1E] border border-[#D4AF37]/35 rounded-2xl shadow-2xl overflow-hidden z-10"
      >
        {/* Header */}
        <div className="relative p-6 bg-gradient-to-b from-[#121B3D] to-[#070B1E] border-b border-[#D4AF37]/20">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#D4AF37] mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Celestia'26 Portal Notice</span>
          </div>
          <h2 className="font-cinzel text-2xl font-bold text-white">
            Registration Desk
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            {FESTIVAL_METADATA.collegeName}, Trichy · Deadline: {FESTIVAL_METADATA.registrationDeadlineFormatted}
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Official Stage Notice Banner */}
          <div className="p-4 rounded-xl bg-[#0F1738] border border-[#D4AF37]/30 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#E6C57D] shrink-0 mt-0.5" />
            <div className="text-xs text-slate-300 leading-relaxed">
              <span className="font-bold text-[#F5E7C4] block mb-0.5">
                Foundation & Visual Launch Phase
              </span>
              Official online registration submission, team roster allocation, and payment clearance will be linked in the subsequent phase. You may submit early delegate details below for priority slots and prompt notification.
            </div>
          </div>

          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {initialEvent && (
                <div className="p-3 rounded-lg bg-[#0A0F26] border border-white/10 text-xs">
                  <span className="text-slate-400">Target Event: </span>
                  <span className="font-semibold text-[#E6C57D]">{initialEvent.title}</span>
                  <span className="text-slate-400 ml-2">({initialEvent.code} · {initialEvent.registrationFee})</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Institution / College Name *
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={collegeName}
                    onChange={(e) => setCollegeName(e.target.value)}
                    placeholder="e.g. Madras Medical College, Chennai"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-[#090E25] border border-white/15 focus:border-[#D4AF37] rounded-lg text-white placeholder-slate-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Contact Delegate / Student Lead *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={delegateName}
                      onChange={(e) => setDelegateName(e.target.value)}
                      placeholder="e.g. Dr. / Mr. / Ms."
                      className="w-full pl-9 pr-3 py-2 text-sm bg-[#090E25] border border-white/15 focus:border-[#D4AF37] rounded-lg text-white placeholder-slate-500 focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Phone / WhatsApp Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full pl-9 pr-3 py-2 text-sm bg-[#090E25] border border-white/15 focus:border-[#D4AF37] rounded-lg text-white placeholder-slate-500 focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Official Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="delegate@college.edu.in"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-[#090E25] border border-white/15 focus:border-[#D4AF37] rounded-lg text-white placeholder-slate-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Target Competition / Delegation
                </label>
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-[#090E25] border border-white/15 focus:border-[#D4AF37] rounded-lg text-white focus:outline-none transition-colors"
                >
                  <option value="contingent">Full College Delegation (Multiple Competitions)</option>
                  {EVENTS_DATA.map((evt) => (
                    <option key={evt.id} value={evt.id}>
                      {evt.title} ({evt.code} · {evt.type} · {evt.registrationFee})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 px-4 text-xs font-bold tracking-wider uppercase text-[#070B1B] bg-gradient-to-r from-[#F5E7C4] via-[#E6C57D] to-[#D4AF37] hover:brightness-110 active:scale-[0.99] rounded-lg transition-all shadow-md shadow-[#D4AF37]/25 cursor-pointer"
                >
                  Request Early Slot & Priority Dispatch
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center py-6 space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>

              <h3 className="font-cinzel text-xl font-bold text-white">
                Pre-Registration Acknowledged
              </h3>

              <div className="p-3 rounded-lg bg-[#090E25] border border-[#D4AF37]/25 max-w-sm mx-auto">
                <div className="text-[11px] text-slate-400 uppercase tracking-widest">Early Reference Token</div>
                <div className="text-lg font-mono font-bold text-[#E6C57D] mt-0.5">{refCode}</div>
              </div>

              <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                Thank you, <strong className="text-white">{delegateName}</strong> from <strong className="text-white">{collegeName}</strong>. Our student cultural secretaries will dispatch the finalized registration dossier and spot allocation guidelines for {selectedEventObj ? <strong className="text-[#F5E7C4]">{selectedEventObj.title}</strong> : 'your college delegation'} to <span className="text-[#E6C57D]">{email}</span> before the <span className="text-[#F5E7C4]">{FESTIVAL_METADATA.registrationDeadlineFormatted}</span> deadline.
              </p>

              <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={handleReset}
                  className="py-2.5 px-6 text-xs font-semibold text-[#070B1B] bg-gradient-to-r from-[#F5E7C4] to-[#D4AF37] rounded-md transition-all cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
