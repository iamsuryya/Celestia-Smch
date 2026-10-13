import React from 'react';
import { User, Building2, Calendar, Users, FileCheck2, CreditCard, CheckCircle2 } from 'lucide-react';
import { RegistrationStep } from '../../types/registration';

interface StepIndicatorProps {
  currentStep: RegistrationStep;
  onStepClick?: (step: RegistrationStep) => void;
  canNavigateTo: (step: RegistrationStep) => boolean;
}

interface StepItem {
  key: RegistrationStep;
  label: string;
  number: number;
  icon: React.ComponentType<{ className?: string }>;
}

const STEPS: StepItem[] = [
  { key: 'account', label: 'Account', number: 1, icon: User },
  { key: 'college', label: 'College', number: 2, icon: Building2 },
  { key: 'event', label: 'Event', number: 3, icon: Calendar },
  { key: 'participants', label: 'Participants', number: 4, icon: Users },
  { key: 'review', label: 'Review', number: 5, icon: FileCheck2 },
  { key: 'payment', label: 'Payment', number: 6, icon: CreditCard },
  { key: 'confirmation', label: 'Confirmed', number: 7, icon: CheckCircle2 },
];

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  currentStep,
  onStepClick,
  canNavigateTo,
}) => {
  if (currentStep === 'landing' || currentStep === 'dashboard') {
    return null;
  }

  const currentStepIndex = STEPS.findIndex((s) => s.key === currentStep);

  return (
    <div className="w-full max-w-4xl mx-auto mb-4 sm:mb-8 px-2 sm:px-4">
      {/* Mobile condensed bar */}
      <div className="md:hidden flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-[#080D24] border border-[#D4AF37]/25 mb-3 sm:mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-r from-[#F5E7C4] to-[#D4AF37] text-[#070B1B] font-bold text-xs flex items-center justify-center">
            {currentStepIndex + 1}
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400">Step {currentStepIndex + 1} of {STEPS.length}</div>
            <div className="text-sm font-semibold text-white capitalize">{STEPS[currentStepIndex]?.label}</div>
          </div>
        </div>
        <div className="text-xs text-[#D4AF37] font-mono">
          {Math.round(((currentStepIndex + 1) / STEPS.length) * 100)}%
        </div>
      </div>

      {/* Desktop expanded stepper */}
      <nav aria-label="Progress" className="hidden md:block">
        <ol className="flex items-center justify-between relative">
          {/* Background progress connector bar */}
          <div className="absolute top-1/2 left-4 right-4 -translate-y-1/2 h-[2px] bg-white/10 z-0" />
          <div 
            className="absolute top-1/2 left-4 -translate-y-1/2 h-[2px] bg-gradient-to-r from-[#D4AF37] to-[#F5E7C4] z-0 transition-all duration-300"
            style={{ width: `${Math.max(0, (currentStepIndex / (STEPS.length - 1)) * 100)}%` }}
          />

          {STEPS.map((step, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isCurrent = step.key === currentStep;
            const isClickable = canNavigateTo(step.key);
            const Icon = step.icon;

            return (
              <li key={step.key} className="relative z-10 flex flex-col items-center">
                <button
                  type="button"
                  disabled={!isClickable}
                  onClick={() => isClickable && onStepClick?.(step.key)}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-gradient-to-r from-[#F5E7C4] via-[#E6C57D] to-[#D4AF37] text-[#070B1B] shadow-md shadow-[#D4AF37]/35 ring-4 ring-[#D4AF37]/20 scale-110'
                      : isCompleted
                      ? 'bg-[#152048] border border-[#D4AF37] text-[#E6C57D] hover:scale-105'
                      : 'bg-[#080D24] border border-white/15 text-slate-500 cursor-not-allowed'
                  }`}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </button>
                <span
                  className={`mt-2 text-[11px] font-medium tracking-wider uppercase whitespace-nowrap transition-colors ${
                    isCurrent
                      ? 'text-[#F5E7C4] font-bold'
                      : isCompleted
                      ? 'text-slate-300'
                      : 'text-slate-500'
                  }`}
                >
                  {step.label}
                </span>
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
};
