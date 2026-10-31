import React, { useState, useMemo } from 'react';
import { 
  X, 
  Download, 
  Copy, 
  Check, 
  Phone, 
  Users, 
  Building2, 
  Filter, 
  Share2, 
  MessageCircle, 
  Sparkles,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';
import { RegistrationSubmission } from '../../types/registration';
import { EVENTS_DATA } from '../../data/festivalData';
import { 
  ContactItem, 
  extractContactsFromRegistrations, 
  downloadVCardFile, 
  getCommaSeparatedPhoneNumbers,
  sanitizePhoneNumber 
} from '../../utils/contactExporter';

interface CaptainContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  registrations: RegistrationSubmission[];
  initialEventCode?: string;
  isInchargeView?: boolean;
}

export const CaptainContactModal: React.FC<CaptainContactModalProps> = ({
  isOpen,
  onClose,
  registrations,
  initialEventCode = 'ALL',
  isInchargeView = false,
}) => {
  const [selectedEventCode, setSelectedEventCode] = useState<string>(initialEventCode);
  const [roleFilter, setRoleFilter] = useState<'CAPTAINS_SOLO' | 'ALL_PARTICIPANTS'>('CAPTAINS_SOLO');
  const [institutionFilter, setInstitutionFilter] = useState<'ALL' | 'HOST_ONLY' | 'OTHER_ONLY'>('ALL');
  const [onlyVerified, setOnlyVerified] = useState<boolean>(isInchargeView);
  const [copiedNumbers, setCopiedNumbers] = useState(false);
  const [copiedShareText, setCopiedShareText] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Extract contacts based on current filters
  const contacts: ContactItem[] = useMemo(() => {
    const list = extractContactsFromRegistrations(registrations, {
      eventCode: selectedEventCode,
      roleFilter,
      institutionFilter,
      onlyVerified,
    });

    if (!searchTerm.trim()) return list;
    const q = searchTerm.toLowerCase();
    return list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.collegeName.toLowerCase().includes(q) ||
        (c.teamName && c.teamName.toLowerCase().includes(q)) ||
        c.eventCode.toLowerCase().includes(q)
    );
  }, [registrations, selectedEventCode, roleFilter, institutionFilter, onlyVerified, searchTerm]);

  if (!isOpen) return null;

  const handleDownloadVcf = () => {
    if (contacts.length === 0) return;
    const eventLabel = selectedEventCode === 'ALL' ? 'AllEvents' : selectedEventCode;
    const roleLabel = roleFilter === 'CAPTAINS_SOLO' ? 'Captains' : 'AllDelegates';
    const filename = `Celestia26_${eventLabel}_${roleLabel}_Contacts.vcf`;
    downloadVCardFile(contacts, filename);
  };

  const handleCopyNumbers = async () => {
    if (contacts.length === 0) return;
    const text = getCommaSeparatedPhoneNumbers(contacts, true);
    await navigator.clipboard.writeText(text);
    setCopiedNumbers(true);
    setTimeout(() => setCopiedNumbers(false), 2500);
  };

  const handleCopyShareSummary = async () => {
    if (contacts.length === 0) return;
    const eventName = selectedEventCode === 'ALL' ? 'All Celestia\'26 Events' : selectedEventCode;
    const lines = [
      `📱 *CELESTIA'26 - CONTACT GROUP FOR INCHARGES*`,
      `🎯 Event: ${eventName}`,
      `👥 Total Contacts: ${contacts.length}`,
      `📅 Generated: ${new Date().toLocaleDateString('en-IN')}`,
      `---------------------------------`,
      ...contacts.slice(0, 30).map((c, i) => 
        `${i + 1}. *${c.name}* (${c.eventCode}${c.teamName ? ` - ${c.teamName}` : ''})\n   📞 +91 ${c.phone} | 🏛️ ${c.collegeName}`
      ),
      contacts.length > 30 ? `\n...and ${contacts.length - 30} more contacts in the attached .VCF file.` : '',
      `---------------------------------`,
      `💡 *How to save:* Download the attached .vcf file and tap it on your phone to add all contacts to your address book instantly.`
    ];

    await navigator.clipboard.writeText(lines.join('\n'));
    setCopiedShareText(true);
    setTimeout(() => setCopiedShareText(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-[#090E26] border border-[#D4AF37]/40 shadow-2xl shadow-black/80 overflow-hidden text-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-white/10 bg-gradient-to-r from-[#0E163B] via-[#090E26] to-[#121A45] flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center shrink-0 shadow-lg shadow-[#D4AF37]/10">
              <Smartphone className="w-5 h-5 text-[#D4AF37]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-[#D4AF37]">
                  Mobile Address Book Exporter (.VCF)
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Universal Android & iOS Format
                </span>
              </div>
              <h2 className="font-cinzel text-xl sm:text-2xl font-bold text-white tracking-wide mt-0.5">
                Save Captains & Leaders Contact Group
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Export captain and participant phone numbers as a single contact group to send to event in-charges.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters & Options Strip */}
        <div className="p-4 sm:p-5 border-b border-white/10 bg-black/25 flex flex-col gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {/* Event Filter */}
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1">
                Event Selection
              </label>
              <select
                value={selectedEventCode}
                onChange={(e) => setSelectedEventCode(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#0E163B] border border-white/15 text-xs text-white focus:outline-none focus:border-[#D4AF37] cursor-pointer"
              >
                <option value="ALL">All Events ({EVENTS_DATA.length})</option>
                {EVENTS_DATA.map((ev) => (
                  <option key={ev.code} value={ev.code}>
                    {ev.code} · {ev.title} ({ev.type})
                  </option>
                ))}
              </select>
            </div>

            {/* Role Filter */}
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1">
                Contact Scope
              </label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-[#0E163B] border border-white/15 text-xs text-white focus:outline-none focus:border-[#D4AF37] cursor-pointer font-medium"
              >
                <option value="CAPTAINS_SOLO">👑 Team Captains & Solo Leaders</option>
                <option value="ALL_PARTICIPANTS">👥 All Registered Members (Full Roster)</option>
              </select>
            </div>

            {/* Institution Filter */}
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1">
                College Category
              </label>
              <select
                value={institutionFilter}
                onChange={(e) => setInstitutionFilter(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-[#0E163B] border border-white/15 text-xs text-white focus:outline-none focus:border-[#D4AF37] cursor-pointer"
              >
                <option value="ALL">All Colleges</option>
                <option value="OTHER_ONLY">🎓 Other Colleges Only</option>
                <option value="HOST_ONLY">🏥 SMCH Host College Only</option>
              </select>
            </div>

            {/* Verification Scope Checkbox */}
            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2 p-2 rounded-xl bg-[#0E163B] border border-white/15 text-xs text-slate-300 cursor-pointer hover:border-[#D4AF37]/50 transition-colors">
                <input
                  type="checkbox"
                  checked={onlyVerified}
                  onChange={(e) => setOnlyVerified(e.target.checked)}
                  className="rounded text-[#D4AF37] focus:ring-0 cursor-pointer"
                />
                <span className="font-medium text-xs">Verified & Approved Only</span>
              </label>
            </div>
          </div>

          {/* Quick Search inside modal */}
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter preview list by participant name, phone, team name, or college..."
              className="w-full pl-3.5 pr-8 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#D4AF37]"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Content Preview Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Summary Box */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-[#0E163B] to-purple-500/15 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-lg font-mono shrink-0 border border-emerald-500/35">
                {contacts.length}
              </div>
              <div>
                <div className="font-semibold text-white text-sm">
                  {contacts.length} Contact{contacts.length !== 1 ? 's' : ''} Ready for Export
                </div>
                <div className="text-xs text-slate-300">
                  {selectedEventCode === 'ALL' ? 'Across all events' : `Filtered for ${selectedEventCode}`} · {roleFilter === 'CAPTAINS_SOLO' ? 'Captains and individual registrants' : 'All participants'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleCopyNumbers}
                disabled={contacts.length === 0}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-semibold text-slate-200 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                title="Copy comma-separated phone numbers for WhatsApp broadcasts"
              >
                {copiedNumbers ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300">Numbers Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Copy Numbers</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleCopyShareSummary}
                disabled={contacts.length === 0}
                className="px-3 py-1.5 rounded-xl bg-[#25D366]/20 hover:bg-[#25D366]/30 border border-[#25D366]/40 text-xs font-semibold text-[#A7F3D0] transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                title="Copy ready-to-share message for WhatsApp in-charges group"
              >
                {copiedShareText ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Message Copied!</span>
                  </>
                ) : (
                  <>
                    <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
                    <span>Share Text</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* How It Works Callout */}
          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-xs text-blue-200 flex items-start gap-2.5">
            <Smartphone className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="text-white">How In-charges Use the .VCF File:</strong> Click <strong>Download .VCF (Address Book)</strong> below and share it with event in-charges over WhatsApp. When they tap the file on their iPhone or Android phone, their phone will automatically prompt: <em>"Add {contacts.length} contacts to Contacts"</em> with each student's name, team, and event clearly labeled.
            </div>
          </div>

          {/* Contact Preview Table */}
          {contacts.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-black/20 border border-white/5">
              <Users className="w-10 h-10 text-slate-500 mx-auto mb-2 opacity-50" />
              <div className="text-sm font-semibold text-slate-300">No contacts match the current filters</div>
              <div className="text-xs text-slate-500 mt-1">
                Try selecting "All Events" or clearing the search query.
              </div>
            </div>
          ) : (
            <div className="border border-white/10 rounded-2xl overflow-hidden bg-black/25">
              <div className="max-h-80 overflow-y-auto divide-y divide-white/5">
                {contacts.map((contact, idx) => (
                  <div 
                    key={contact.id || idx}
                    className="p-3 hover:bg-white/5 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <span className="w-6 h-6 rounded-lg bg-white/5 text-slate-400 font-mono text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-white truncate">
                            {contact.name}
                          </span>
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-[#D4AF37]/20 text-[#F5E7C4] border border-[#D4AF37]/30">
                            {contact.eventCode}
                          </span>
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-purple-500/20 text-purple-300">
                            {contact.role}
                          </span>
                          {contact.isHostCollege ? (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-emerald-500/20 text-emerald-300">
                              SMCH Host
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-sky-950/60 text-sky-300 border border-sky-500/30">
                              Other College
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate mt-0.5">
                          {contact.teamName ? `Team: ${contact.teamName} · ` : ''}{contact.collegeName}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <div className="font-mono text-emerald-300 text-xs font-semibold">
                        {contact.formattedPhone}
                      </div>
                      <a
                        href={`https://wa.me/91${contact.phone}?text=${encodeURIComponent(
                          `Hello ${contact.name}, this is Celestia'26 desk regarding your event ${contact.eventCode}.`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg bg-[#25D366]/20 text-[#25D366] hover:bg-[#25D366]/30 transition-colors"
                        title="Chat on WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                      </a>
                      <a
                        href={`tel:+91${contact.phone}`}
                        className="p-1.5 rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition-colors"
                        title="Direct Phone Call"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-white/10 bg-black/40 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            Selected: <strong className="text-white font-mono">{contacts.length}</strong> contacts from{' '}
            <strong className="text-[#D4AF37]">{selectedEventCode === 'ALL' ? 'all events' : selectedEventCode}</strong>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              Close
            </button>

            <button
              type="button"
              onClick={handleDownloadVcf}
              disabled={contacts.length === 0}
              className="px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-emerald-950 bg-gradient-to-r from-emerald-300 via-emerald-400 to-teal-400 hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/25 disabled:opacity-50"
            >
              <Download className="w-4 h-4 text-emerald-950" />
              <span>Download .VCF (Address Book)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
