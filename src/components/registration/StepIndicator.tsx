import React from 'react';
import { User, Building2, Calendar, Users, FileCheck2, CreditCard, CheckCircle2 } from 'lucide-react';
import { RegistrationStep } from '../../types/registration';

interface StepIndicatorProps {
  currentStep: RegistrationStep;
  onStepClick?: (step: RegistrationStep) => void;
  canNavigateTo: (step: RegistrationStep) => boolean;
}

interface SimplifiedStep {
  id: number;
  label: string;
  keys: RegistrationStep[];
}

const DISPLAY_STEPS: SimplifiedStep[] = [
  { id: 1, label: 'Event', keys: ['event'] },
  { id: 2, label: 'Details', keys: ['account', 'college', 'participants'] },
  { id: 3, label: 'Payment', keys: ['payment'] },
  { id: 4, label: 'Review', keys: ['review', 'confirmation'] },
];

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  currentStep,
  onStepClick,
  canNavigateTo,
}) => {
  if (currentStep === 'landing' || currentStep === 'dashboard') {
    return null;
  }

  // Determine current active simplified step (1, 2, 3, or 4)
  let activeStepId = 1;
  if (['account', 'college', 'participants'].includes(currentStep)) activeStepId = 2;
  if (currentStep === 'payment') activeStepId = 3;
  if (['review', 'confirmation'].includes(currentStep)) activeStepId = 4;

  return (
    <div className="w-full max-w-2xl mx-auto mb-6 px-2">
      {/* 4-Step Stepper with connecting line (Matching Screens 4 & 5 of reference image) */}
      <div className="relative flex items-center justify-between">
        {/* Connector Line */}
        <div className="absolute top-4 left-6 right-6 h-[2px] bg-white/10 z-0" />
        <div
          className="absolute top-4 left-6 h-[2px] bg-gradient-to-r from-[#D4AF37] to-[#F5E7C4] z-0 transition-all duration-300"
          style={{ width: `${((activeStepId - 1) / 3) * 100}%` }}
        />

        {DISPLAY_STEPS.map((step) => {
          const isCompleted = step.id < activeStepId;
          const isCurrent = step.id === activeStepId;
          const targetKey = step.keys[0];
          const isClickable = canNavigateTo(targetKey);

          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center">
              <button
                type="button"
                disabled={!isClickable}
                onClick={() => isClickable && onStepClick?.(targetKey)}
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-gradient-to-r from-[#F8E7C4] via-[#E8CB8B] to-[#D4AF37] text-[#060B1E] shadow-lg shadow-[#D4AF37]/35 ring-4 ring-[#D4AF37]/20 scale-110'
                    : isCompleted
                    ? 'bg-[#182352] border border-[#D4AF37] text-[#E6C57D]'
                    : 'bg-[#080D24] border border-white/20 text-slate-400'
                }`}
              >
                {step.id}
              </button>
              <span
                className={`mt-1.5 text-[11px] font-semibold tracking-wider uppercase transition-colors ${
                  isCurrent
                    ? 'text-[#F5E7C4]'
                    : isCompleted
                    ? 'text-slate-300'
                    : 'text-slate-500'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
