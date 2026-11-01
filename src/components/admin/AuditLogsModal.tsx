import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Clock, FileText, Search, RefreshCw, UserCheck, UserPlus, BadgeCheck } from 'lucide-react';
import { AuditLogEntry } from '../../types/registration';
import { eventDayService } from '../../services/eventDayService';

interface AuditLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuditLogsModal: React.FC<AuditLogsModalProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await eventDayService.fetchAuditLogs();
      setLogs(data);
    } catch (e) {
      console.warn('Error loading audit logs:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadLogs();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredLogs = logs.filter((l) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      (l.action || '').toLowerCase().includes(q) ||
      (l.volunteerName || '').toLowerCase().includes(q) ||
      (l.volunteerRole || '').toLowerCase().includes(q) ||
      (l.registrationCode || l.registrationId || '').toLowerCase().includes(q) ||
      (l.participantName || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="max-w-4xl w-full max-h-[85vh] bg-[#080D26] border border-[#D4AF37]/50 rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-scale-up">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-[#0B102A] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/20 flex items-center justify-center text-[#E6C57D]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-cinzel">
                Volunteer Audit & Activity Log Trail
              </h2>
              <p className="text-xs text-slate-400">
                Timestamped operational logs for check-ins, team member additions, on-spot creations, and ID badges
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadLogs}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 transition-colors"
              title="Refresh Logs"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="p-3 bg-[#050818] border-b border-white/10">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by action, Reg Code, volunteer name, or participant..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-black/60 border border-white/15 text-white text-xs font-mono focus:outline-none focus:border-[#D4AF37]"
            />
          </div>
        </div>

        {/* Logs Body */}
        <div className="p-4 overflow-y-auto flex-1 space-y-2">
          {loading ? (
            <div className="p-12 text-center text-slate-400 font-mono text-xs space-y-2">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#D4AF37]" />
              <p>Loading audit trail records...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs font-mono space-y-1">
              <p className="text-white font-bold">No audit logs found.</p>
              <p>Volunteer actions will automatically populate here in real-time.</p>
            </div>
          ) : (
            filteredLogs.map((log) => {
              const dateStr = log.createdAt ? new Date(log.createdAt).toLocaleString('en-IN') : 'N/A';

              return (
                <div
                  key={log.id}
                  className="p-3 rounded-xl bg-black/40 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${
                        log.action === 'CREATE_ON_SPOT_REGISTRATION'
                          ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                          : log.action === 'ADD_TEAM_MEMBER'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      }`}>
                        {log.action}
                      </span>
                      {log.registrationCode && (
                        <span className="font-mono text-[#E6C57D] font-bold">
                          {log.registrationCode}
                        </span>
                      )}
                      {log.participantName && (
                        <span className="text-white font-semibold">
                          · Participant: {log.participantName}
                        </span>
                      )}
                    </div>

                    <p className="text-slate-400 text-[11px]">
                      By <strong className="text-white">{log.volunteerName}</strong> ({log.volunteerRole})
                    </p>
                  </div>

                  <div className="text-slate-400 font-mono text-[10px] flex items-center gap-1 shrink-0">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>{dateStr}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
