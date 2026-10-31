import React, { useState, useMemo } from 'react';
import { 
  X, 
  RefreshCw, 
  Check, 
  AlertTriangle, 
  Building2, 
  ShieldCheck, 
  CheckCircle2, 
  Lock, 
  Tag, 
  ArrowRight,
  Filter,
  Search,
  Sparkles
} from 'lucide-react';
import { RegistrationSubmission } from '../../types/registration';
import { isExactSmchHost } from '../../utils/collegeTagging';
import { supabaseRegistrationService } from '../../services/supabaseRegistrationService';

interface CollegeAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  registrations: RegistrationSubmission[];
  onAuditCompleted: () => Promise<void>;
  showToast: (msg: string) => void;
}

export const CollegeAuditModal: React.FC<CollegeAuditModalProps> = ({
  isOpen,
  onClose,
  registrations,
  onAuditCompleted,
  showToast,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [auditFilter, setAuditFilter] = useState<'mismatched' | 'all'>('mismatched');

  // Categorize registrations
  const auditAnalysis = useMemo(() => {
    let smchHostCount = 0;
    let otherCollegeCount = 0;
    let delegationCount = 0;
    const mismatchedRecords: RegistrationSubmission[] = [];

    registrations.forEach((r) => {
      const collegeName = (r.college?.collegeName || '').trim();
      const isMarkedHost = Boolean(r.isHostCollege || r.college?.isHostCollege);
      const isHostExact = isExactSmchHost(collegeName);

      if (isHostExact) {
        smchHostCount++;
      } else if (r.college?.isCollegeDelegation) {
        delegationCount++;
      } else {
        otherCollegeCount++;
      }

      // If marked as host college, but college is NOT exact Srinivasan Medical College & Hospital
      if (isMarkedHost && !isHostExact) {
        mismatchedRecords.push(r);
      }
    });

    return {
      total: registrations.length,
      smchHostCount,
      otherCollegeCount,
      delegationCount,
      mismatchedRecords,
    };
  }, [registrations]);

  // Sync selectedIds with mismatched records when modal opens or records change
  React.useEffect(() => {
    if (isOpen) {
      setSelectedIds(auditAnalysis.mismatchedRecords.map((r) => r.id));
    }
  }, [isOpen, auditAnalysis.mismatchedRecords]);

  // Filter records for display
  const displayRecords = useMemo(() => {
    let list = auditFilter === 'mismatched' ? auditAnalysis.mismatchedRecords : registrations;
    if (!searchTerm.trim()) return list;
    const q = searchTerm.toLowerCase();
    return list.filter((r) => {
      const col = (r.college?.collegeName || '').toLowerCase();
      const cap = (r.participants[0]?.fullName || '').toLowerCase();
      const code = (r.registrationCode || r.id).toLowerCase();
      const ev = (r.eventCode || '').toLowerCase();
      return col.includes(q) || cap.includes(q) || code.includes(q) || ev.includes(q);
    });
  }, [auditFilter, auditAnalysis.mismatchedRecords, registrations, searchTerm]);

  if (!isOpen) return null;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(auditAnalysis.mismatchedRecords.map((r) => r.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleExecuteRetag = async () => {
    if (selectedIds.length === 0) {
      showToast('Please select at least one record to retag.');
      return;
    }

    setIsProcessing(true);
    try {
      const res = await supabaseRegistrationService.retagOtherCollegesBatch(selectedIds);
      showToast(res.message);
      await onAuditCompleted();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Retagging failed';
      showToast(`Error: ${msg}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-[#090E26] border border-[#D4AF37]/40 shadow-2xl shadow-black/80 overflow-hidden text-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-white/10 bg-gradient-to-r from-[#0E163B] via-[#090E26] to-[#141F4D] flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center shrink-0 shadow-lg shadow-sky-500/10">
              <Building2 className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-sky-400">
                  Institutional Classification Audit Tool
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Zero Financial Alteration Guaranteed
                </span>
              </div>
              <h2 className="font-cinzel text-xl sm:text-2xl font-bold text-white tracking-wide mt-0.5">
                Audit & Retag Other College Participants
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Categorize participants not from Srinivasan Medical College & Hospital as <strong>Other College</strong> while leaving all registration fees and payment records untouched.
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

        {/* Financial Immutability Assurance Banner */}
        <div className="px-4 sm:px-6 py-2.5 bg-amber-500/10 border-b border-amber-500/25 flex items-center gap-2 text-xs text-amber-200">
          <Lock className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>Safe Update Guarantee:</strong> Fee totals, advance amounts paid, UTR reference codes, and payment screenshot attachments will remain <strong>100% untouched</strong>. Only the institutional tag and host status are updated.
          </span>
        </div>

        {/* Metrics Grid */}
        <div className="p-4 sm:p-5 border-b border-white/10 bg-black/25">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                Total Submissions
              </div>
              <div className="text-xl font-bold font-mono text-white mt-1">
                {auditAnalysis.total}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">All registered entries</div>
            </div>

            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/25">
              <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-300">
                SMCH Host Students
              </div>
              <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
                {auditAnalysis.smchHostCount}
              </div>
              <div className="text-[10px] text-emerald-300/70 mt-0.5">Exact SMCH verified</div>
            </div>

            <div className={`p-3 rounded-2xl border transition-all ${
              auditAnalysis.mismatchedRecords.length > 0
                ? 'bg-amber-500/15 border-amber-500/40'
                : 'bg-white/5 border-white/10'
            }`}>
              <div className="text-[10px] font-mono uppercase tracking-wider text-amber-300 flex items-center justify-between">
                <span>Needs Retagging</span>
                {auditAnalysis.mismatchedRecords.length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                )}
              </div>
              <div className="text-xl font-bold font-mono text-amber-400 mt-1">
                {auditAnalysis.mismatchedRecords.length}
              </div>
              <div className="text-[10px] text-amber-200/70 mt-0.5">Non-SMCH flagged as Host</div>
            </div>

            <div className="p-3 rounded-2xl bg-sky-500/10 border border-sky-500/25">
              <div className="text-[10px] font-mono uppercase tracking-wider text-sky-300">
                Other Colleges
              </div>
              <div className="text-xl font-bold font-mono text-sky-400 mt-1">
                {auditAnalysis.otherCollegeCount}
              </div>
              <div className="text-[10px] text-sky-300/70 mt-0.5">External institutions</div>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 sm:px-6 py-3 border-b border-white/10 bg-black/15 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAuditFilter('mismatched')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                auditFilter === 'mismatched'
                  ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40 font-bold'
                  : 'bg-white/5 text-slate-300 hover:text-white border border-white/10'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Mismatched Non-SMCH ({auditAnalysis.mismatchedRecords.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setAuditFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                auditFilter === 'all'
                  ? 'bg-sky-500/25 text-sky-300 border border-sky-500/40 font-bold'
                  : 'bg-white/5 text-slate-300 hover:text-white border border-white/10'
              }`}
            >
              <span>View All Submissions ({registrations.length})</span>
            </button>
          </div>

          <div className="relative flex-1 max-w-xs">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search college, student, reg code..."
              className="w-full pl-3 pr-7 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#D4AF37]"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Records Preview Table */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {displayRecords.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-black/20 border border-white/5">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
              <div className="text-sm font-semibold text-white">
                {auditFilter === 'mismatched'
                  ? 'All Registrations Properly Categorized!'
                  : 'No records found'}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {auditFilter === 'mismatched'
                  ? 'There are currently no non-SMCH registrations mistakenly tagged as Host College.'
                  : 'Try clearing your search query.'}
              </div>
            </div>
          ) : (
            <div className="border border-white/10 rounded-2xl overflow-hidden bg-black/25">
              <div className="p-3 bg-white/5 border-b border-white/10 flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-300">
                  <input
                    type="checkbox"
                    checked={
                      auditAnalysis.mismatchedRecords.length > 0 &&
                      selectedIds.length === auditAnalysis.mismatchedRecords.length
                    }
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded text-[#D4AF37] focus:ring-0 cursor-pointer"
                  />
                  <span>Select All Mismatched ({auditAnalysis.mismatchedRecords.length})</span>
                </label>

                <div className="text-slate-400 text-[11px] font-mono">
                  Selected: <strong className="text-white">{selectedIds.length}</strong> records
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-white/5">
                {displayRecords.map((reg) => {
                  const collegeName = (reg.college?.collegeName || '').trim();
                  const isHostExact = isExactSmchHost(collegeName);
                  const isMarkedHost = Boolean(reg.isHostCollege || reg.college?.isHostCollege);
                  const isMismatched = isMarkedHost && !isHostExact;
                  const isSelected = selectedIds.includes(reg.id);

                  return (
                    <div 
                      key={reg.id}
                      className={`p-3.5 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs ${
                        isMismatched ? 'bg-amber-500/5 hover:bg-amber-500/10' : 'hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        {isMismatched && (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectOne(reg.id)}
                            className="rounded text-[#D4AF37] focus:ring-0 cursor-pointer mt-1"
                          />
                        )}

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-white">
                              {reg.participants[0]?.fullName || 'Participant'}
                            </span>
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-white/10 text-[#F5E7C4]">
                              {reg.registrationCode || reg.id}
                            </span>
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-purple-500/20 text-purple-300">
                              {reg.eventCode}
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-300 mt-1 flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <strong className="text-white">{collegeName || 'Unknown College'}</strong>
                            {reg.college?.city && (
                              <span className="text-slate-400">({reg.college.city}, {reg.college.state})</span>
                            )}
                          </div>

                          {/* Tag Comparison Strip */}
                          <div className="mt-2 flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] text-slate-400 font-mono">Current:</span>
                            {isMarkedHost ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/35">
                                SMCH Host
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-sky-950/60 text-sky-300 border border-sky-500/30">
                                Other College
                              </span>
                            )}

                            {isMismatched && (
                              <>
                                <ArrowRight className="w-3 h-3 text-amber-400" />
                                <span className="text-[10px] text-slate-400 font-mono">Will Change To:</span>
                                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-950/60 text-sky-300 border border-sky-500/40 flex items-center gap-1">
                                  <Tag className="w-3 h-3 text-sky-400" />
                                  <span>Other College</span>
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Preserved Financial Info */}
                      <div className="self-end md:self-center shrink-0 flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1 justify-end">
                            <Lock className="w-2.5 h-2.5 text-emerald-400" />
                            <span>Preserved Fee</span>
                          </div>
                          <div className="font-mono font-bold text-white text-xs mt-0.5">
                            ₹{reg.totalAmount}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {reg.paymentStatus || 'Submitted'}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-white/10 bg-black/40 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            {selectedIds.length > 0 ? (
              <span>
                Ready to retag <strong className="text-white font-mono">{selectedIds.length}</strong> non-SMCH participant(s) to <strong>Other College</strong>.
              </span>
            ) : (
              <span>No participants selected for retagging.</span>
            )}
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-300 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleExecuteRetag}
              disabled={isProcessing || selectedIds.length === 0}
              className="px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-500/25 disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Updating Database...</span>
                </>
              ) : (
                <>
                  <Tag className="w-4 h-4 text-sky-300" />
                  <span>Confirm & Retag ({selectedIds.length}) to Other College</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
