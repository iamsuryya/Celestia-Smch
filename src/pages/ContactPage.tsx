import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2, MessageSquare, Compass, ExternalLink } from 'lucide-react';
import { FESTIVAL_METADATA } from '../data/festivalData';

export const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    college: '',
    email: '',
    phone: '',
    subject: 'General Fest Inquiry',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) return;
    setSubmitted(true);
  };

  const coordinators = [
    { name: 'Student Coordinator 1', role: 'Student Secretariat & Contingent Lead', dept: 'SMCH Fest Council', contact: '+91 9080813899' },
    { name: 'Student Coordinator 2', role: 'Registration & Cultural Secretary', dept: 'SMCH Fest Council', contact: '+91 9150272527' },
    { name: 'Festival Secretariat', role: 'Official Inquiries & Accounts', dept: 'Celestia Desk', contact: 'celestiasmch@gmail.com' },
    { name: 'Campus Hospitality', role: 'Transport & Accommodation', dept: 'Logistics Team', contact: '+91 9080813899' },
  ];

  return (
    <div className="relative z-10 pt-20 sm:pt-28 pb-12 sm:pb-20 px-3 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-8 sm:space-y-12">
      {/* Page Title */}
      <div className="text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-[#D4AF37] mb-2">
          <MessageSquare className="w-3.5 h-3.5" />
          <span>HELP DESK & CONVENORS</span>
        </div>
        <h1 className="font-cinzel text-2xl sm:text-5xl font-bold text-white mb-2 sm:mb-3">
          Contact & Travel Assistance
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl mx-auto">
          Get in touch with the Celestia'26 organizing desk for contingent slots, rulebook clarifications, lodging assistance, and transport logistics.
        </p>

        {/* Quick Direct Mobile Contact Badges */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
          <a
            href="tel:+919080813899"
            className="px-3.5 py-1.5 rounded-full bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25 border border-[#D4AF37]/40 text-xs text-[#F5E7C4] hover:text-white flex items-center gap-1.5 transition-colors font-mono"
          >
            <Phone className="w-3 h-3 text-[#D4AF37]" />
            <span>+91 9080813899</span>
          </a>
          <a
            href="tel:+919150272527"
            className="px-3.5 py-1.5 rounded-full bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25 border border-[#D4AF37]/40 text-xs text-[#F5E7C4] hover:text-white flex items-center gap-1.5 transition-colors font-mono"
          >
            <Phone className="w-3 h-3 text-[#D4AF37]" />
            <span>+91 9150272527</span>
          </a>
          <a
            href="mailto:celestiasmch@gmail.com"
            className="px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 text-xs text-slate-200 hover:text-white flex items-center gap-1.5 transition-colors font-mono"
          >
            <Mail className="w-3 h-3 text-[#E6C57D]" />
            <span>celestiasmch@gmail.com</span>
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-10">
        {/* Contact Form */}
        <div className="celestial-glass rounded-2xl p-5 sm:p-8 border border-[#D4AF37]/30">
          <h2 className="font-cinzel text-lg sm:text-2xl font-bold text-white mb-1.5">
            Send an Inquiry
          </h2>
          <p className="text-xs text-slate-300 mb-5">
            Our student secretariat will respond within 24 working hours.
          </p>

          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Your Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Dr. Priya Ramanathan"
                  className="w-full px-3 py-2.5 bg-[#080D24] border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#D4AF37] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Institution / College Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.college}
                  onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                  placeholder="e.g. Stanley Medical College"
                  className="w-full px-3 py-2.5 bg-[#080D24] border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#D4AF37] transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@domain.com"
                    className="w-full px-3 py-2.5 bg-[#080D24] border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#D4AF37] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98765 XXXXX"
                    className="w-full px-3 py-2.5 bg-[#080D24] border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#D4AF37] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Inquiry Topic
                </label>
                <select
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-3 py-2.5 bg-[#080D24] border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#D4AF37] transition-colors"
                >
                  <option value="General Fest Inquiry">General Fest Inquiry</option>
                  <option value="Contingent Bulk Registration">Contingent Bulk Registration</option>
                  <option value="Rulebook & Eligibility Clarification">Rulebook & Eligibility Clarification</option>
                  <option value="Accommodation & Green Room Assistance">Accommodation & Green Room Assistance</option>
                  <option value="Pro-Show & Star Night Access">Pro-Show & Star Night Access</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Message / Details *
                </label>
                <textarea
                  rows={4}
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Tell us your requirements, questions, or estimated contingent strength..."
                  className="w-full px-3 py-2.5 bg-[#080D24] border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#D4AF37] transition-colors resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 text-xs font-bold tracking-wider uppercase text-[#070B1B] bg-gradient-to-r from-[#F5E7C4] via-[#E6C57D] to-[#D4AF37] hover:brightness-110 active:scale-95 transition-all rounded-lg shadow-md shadow-[#D4AF37]/25 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Submit Inquiry</span>
              </button>
            </form>
          ) : (
            <div className="py-10 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-cinzel text-xl font-bold text-white">
                Inquiry Received
              </h3>
              <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                Thank you, <strong className="text-white">{formData.name}</strong>. The Celestia'26 secretarial team will review your query regarding <em>"{formData.subject}"</em> and contact you shortly at <span className="text-[#E6C57D]">{formData.email}</span>.
              </p>
              <button
                onClick={() => {
                  setSubmitted(false);
                  setFormData({ name: '', college: '', email: '', phone: '', subject: 'General Fest Inquiry', message: '' });
                }}
                className="text-xs text-[#D4AF37] hover:underline pt-2 cursor-pointer"
              >
                Send Another Note
              </button>
            </div>
          )}
        </div>

        {/* Coordinators & Logistics Info */}
        <div className="space-y-6">
          {/* Institution Location */}
          <div className="celestial-glass rounded-2xl p-6 sm:p-8 border border-white/10">
            <h3 className="font-cinzel text-lg font-bold text-white mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#D4AF37]" />
              <span>Campus Address</span>
            </h3>
            <p className="text-sm font-semibold text-[#F5E7C4] mb-1">
              {FESTIVAL_METADATA.collegeName}
            </p>
            <p className="text-xs text-slate-300 leading-relaxed">
              NH-45 Trichy-Chennai Highway, Samayapuram, Tiruchirappalli, Tamil Nadu 621112.
            </p>

            <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-300">
              <div className="p-2.5 rounded-lg bg-[#080D24]">
                <div className="text-[10px] uppercase text-[#D4AF37]">Trichy Junction (TPJ)</div>
                <div className="font-medium mt-0.5">~18 km (30 mins)</div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#080D24]">
                <div className="text-[10px] uppercase text-[#D4AF37]">Central Bus Stand</div>
                <div className="font-medium mt-0.5">~19 km (35 mins)</div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#080D24]">
                <div className="text-[10px] uppercase text-[#D4AF37]">Trichy Airport (TRZ)</div>
                <div className="font-medium mt-0.5">~22 km (40 mins)</div>
              </div>
            </div>
          </div>

          {/* Final Contact List */}
          <div className="celestial-glass rounded-2xl p-6 sm:p-8 border border-white/10 space-y-6">
            <h3 className="font-cinzel text-lg font-bold text-white mb-2 border-b border-white/10 pb-2">
              CELESTIA’26 – Final Contact List
            </h3>

            {/* Cultural Secretaries */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] mb-3">Cultural Secretaries</h4>
              <div className="space-y-2.5">
                {[
                  { name: 'Amlesh', phone: '+91 90808 13899', raw: '+919080813899' },
                  { name: 'Kaviya', phone: '+91 91502 72527', raw: '+919150272527' },
                ].map((item, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-[#080D24] border border-white/5 flex items-center justify-between">
                    <span className="text-sm font-semibold text-white">{item.name}</span>
                    <a href={`tel:${item.raw}`} className="text-xs font-mono text-[#E6C57D] hover:underline flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-[#D4AF37]" />
                      <span>{item.phone}</span>
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* Registration */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] mb-3">Registration</h4>
              <div className="space-y-2.5">
                {[
                  { name: 'Surya Narayan', phone: '+91 80759 70766', raw: '+918075970766' },
                  { name: 'Sharmila', phone: '+91 99940 48706', raw: '+919994048706' },
                  { name: 'Aparna', phone: '+91 96779 84191', raw: '+919677984191' },
                  { name: 'Dhanush P C', phone: '+91 82483 01304', raw: '+918248301304' },
                ].map((item, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-[#080D24] border border-white/5 flex items-center justify-between">
                    <span className="text-sm font-semibold text-white">{item.name}</span>
                    <a href={`tel:${item.raw}`} className="text-xs font-mono text-[#E6C57D] hover:underline flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-[#D4AF37]" />
                      <span>{item.phone}</span>
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* Transport */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] mb-3">Transport</h4>
              <div className="space-y-2.5">
                {[
                  { name: 'Mohammed Asif Kamal', phone: '+91 90033 26006', raw: '+919003326006' },
                  { name: 'Pooja Sushma', phone: '+91 63831 83246', raw: '+916383183246' },
                ].map((item, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-[#080D24] border border-white/5 flex items-center justify-between">
                    <span className="text-sm font-semibold text-white">{item.name}</span>
                    <a href={`tel:${item.raw}`} className="text-xs font-mono text-[#E6C57D] hover:underline flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-[#D4AF37]" />
                      <span>{item.phone}</span>
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* Accommodation and Food */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] mb-3">Accommodation and Food</h4>
              <div className="space-y-2.5">
                {[
                  { name: 'Rajamurugar V V', phone: '+91 63792 79332', raw: '+916379279332' },
                  { name: 'Parul S', phone: '+91 84384 17409', raw: '+918438417409' },
                  { name: 'Yogeshwaran', phone: '+91 63821 00725', raw: '+916382100725' },
                  { name: 'Kanagadharini', phone: '+91 63812 28064', raw: '+916381228064' },
                ].map((item, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-[#080D24] border border-white/5 flex items-center justify-between">
                    <span className="text-sm font-semibold text-white">{item.name}</span>
                    <a href={`tel:${item.raw}`} className="text-xs font-mono text-[#E6C57D] hover:underline flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-[#D4AF37]" />
                      <span>{item.phone}</span>
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
