import React from 'react';
import { PaymentStatus, RegistrationStatus } from '../../types/registration';

interface StatusBadgeProps {
  type: 'payment' | 'registration';
  status: PaymentStatus | RegistrationStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ type, status }) => {
  const getBadgeStyles = () => {
    switch (status) {
      case 'Confirmed':
      case 'Verified':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      case 'Submitted':
      case 'Pending':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'Draft':
        return 'bg-slate-500/15 text-slate-300 border-slate-500/30';
      case 'Rejected':
        return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
      default:
        return 'bg-slate-500/15 text-slate-300 border-slate-500/30';
    }
  };

  const getLabel = () => {
    if (status === 'Verified' || status === 'Confirmed') return 'Verified';
    if (status === 'Rejected') return 'Rejected';
    if (status === 'Draft') return 'Not Complete';
    return 'Pending';
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-semibold border ${getBadgeStyles()}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      <span>{getLabel()}</span>
    </span>
  );
};
