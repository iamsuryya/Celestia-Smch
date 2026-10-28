import React from 'react';
import { ArrowLeft, X, Sparkles, LogOut } from 'lucide-react';
import { useRegistration } from '../../context/RegistrationContext';
import { StepIndicator } from './StepIndicator';
import { RegistrationLanding } from './RegistrationLanding';
import { AccountForm } from './AccountForm';
import { CollegeForm } from './CollegeForm';
import { EventSelector } from './EventSelector';
import { ParticipantForm } from './ParticipantForm';
import { RegistrationReview } from './RegistrationReview';
import { PaymentPage } from './PaymentPage';
import { RegistrationConfirmation } from './RegistrationConfirmation';
import { ParticipantDashboard } from './ParticipantDashboard';
import { ReceiptModal } from './ReceiptModal';
import { RegistrationStep } from '../../types/registration';

interface RegistrationWizardProps {
  onExit: () => void;
}

export const RegistrationWizard: React.FC<RegistrationWizardProps> = ({ onExit }) => {
  const { 
    currentStep, 
    goToStep, 
    currentUser, 
    collegeDetails, 
    selectedEvent, 
    participants,
    viewReceiptRegistration,
    setViewReceiptRegistration,
    logoutUser
  } = useRegistration();

  // Always scroll to top when changing registration step
  React.useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [currentStep]);

  const canNavigateTo = (step: RegistrationStep): boolean => {
    switch (step) {
      case 'landing':
        return true;
      case 'account':
        return true;
      case 'college':
        return !!currentUser;
      case 'event':
        return !!currentUser && !!collegeDetails;
      case 'participants':
        return !!currentUser && !!collegeDetails && !!selectedEvent;
      case 'review':
        return !!currentUser && !!collegeDetails && !!selectedEvent && participants.length > 0;
      case 'payment':
        return !!currentUser && !!collegeDetails && !!selectedEvent && participants.length > 0;
      case 'confirmation':
        return false;
      case 'dashboard':
        return !!currentUser;
      default:
        return false;
    }
  };

  return (
    <div className="relative z-20 min-h-screen pt-20 sm:pt-24 pb-12 sm:pb-20 px-2.5 sm:px-6">
      
      {/* Top Bar for Registration view */}
      <div className="max-w-6xl mx-auto flex items-center justify-between pb-3.5 sm:pb-6 mb-2 sm:mb-3 border-b border-white/5">
        <button
          type="button"
          onClick={onExit}
          className="text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-[#D4AF37]" />
          <span>Exit to Main Fest Site</span>
        </button>

        <div className="flex items-center gap-2.5">
          {currentUser && currentStep !== 'dashboard' && (
            <button
              type="button"
              onClick={() => goToStep('dashboard')}
              className="text-xs font-semibold text-[#E6C57D] hover:underline cursor-pointer"
            >
              My Dashboard
            </button>
          )}

          {currentUser && (
            <button
              type="button"
              onClick={logoutUser}
              className="py-1 px-2.5 rounded text-xs font-semibold text-rose-300 hover:text-white bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 transition-colors flex items-center gap-1 cursor-pointer"
              title={`Logout (${currentUser.fullName})`}
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span>Logout</span>
            </button>
          )}

          <button
            type="button"
            onClick={onExit}
            className="p-1.5 text-slate-400 hover:text-white rounded-md bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close registration"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Stepper (Only rendered for steps 1-7) */}
      <StepIndicator
        currentStep={currentStep}
        onStepClick={goToStep}
        canNavigateTo={canNavigateTo}
      />

      {/* Step Components Routing */}
      <main className="relative">
        {currentStep === 'landing' && <RegistrationLanding />}
        {currentStep === 'account' && <AccountForm />}
        {currentStep === 'college' && <CollegeForm />}
        {currentStep === 'event' && <EventSelector />}
        {currentStep === 'participants' && <ParticipantForm />}
        {currentStep === 'review' && <RegistrationReview />}
        {currentStep === 'payment' && <PaymentPage />}
        {currentStep === 'confirmation' && <RegistrationConfirmation />}
        {currentStep === 'dashboard' && <ParticipantDashboard />}
      </main>

      {/* Official Receipt Modal for preview and printing */}
      <ReceiptModal
        registration={viewReceiptRegistration}
        onClose={() => setViewReceiptRegistration(null)}
      />
    </div>
  );
};
