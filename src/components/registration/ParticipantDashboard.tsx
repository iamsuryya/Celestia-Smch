import React, { useState } from 'react';
import { User, Mail, Phone, Building2, PlusCircle, LogOut, Edit2, ShieldCheck, Sparkles, AlertCircle, FileText } from 'lucide-react';
import { useRegistration } from '../../context/RegistrationContext';
import { RegistrationCard } from './RegistrationCard';
import { FESTIVAL_METADATA } from '../../data/festivalData';

export const ParticipantDashboard: React.FC = () => {
  const { 
    currentUser, 
    collegeDetails, 
    myRegistrations, 
    startNewRegistration, 
    logoutUser, 
    goToStep, 
    setViewReceiptRegistration 
  } = useRegistration();

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto text-center py-16 px-4">
        <div className="celestial-glass rounded-2xl p-8 border border-white/10 space-y-4">
          <AlertCircle className="w-8 h-8 text-[#D4AF37] mx-auto" />
          <h2 className="font-cinzel text-xl font-bold text-white">Sign In Required</h2>
          <p className="text-xs text-slate-300">
            Please sign in to view your participant profile and registered competitions.
          </p>
          <button
            onClick={() => goToStep('account')}
            className="w-full py-2.5 px-4 text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-[#F5E7C4] to-[#D4AF37] text-[#070B1B] rounded-lg cursor-pointer"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-8">
      
      {/* Top Banner / Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-white/10 gap-4">
        <div>
          <div className="text-[11px] font-mono text-[#D4AF37] uppercase tracking-wider mb-1">
            Participant Portal · {FESTIVAL_METADATA.edition}
          </div>
          <h1 className="font-cinzel text-2xl sm:text-3xl font-bold text-white">
            Welcome, {currentUser.fullName}
          </h1>
          <p className="text-xs text-slate-300 mt-0.5">
            Manage your registered competitions, download verification receipts, or book new slots.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => startNewRegistration()}
            className="py-2.5 px-4 text-xs font-bold tracking-wider uppercase text-[#070B1B] bg-gradient-to-r from-[#F5E7C4] via-[#E6C57D] to-[#D4AF37] hover:brightness-110 active:scale-95 rounded-lg transition-all shadow-md shadow-[#D4AF37]/25 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Registration</span>
          </button>

          <button
            type="button"
            onClick={logoutUser}
            className="py-2.5 px-3.5 text-xs font-semibold text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Sign out of registration session"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* 1. PROFILE SECTION */}
      <div className="celestial-glass rounded-2xl p-6 sm:p-8 border border-[#D4AF37]/25 relative">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-[#D4AF37]" />
            <h2 className="font-cinzel text-base font-bold text-white">
              DELEGATE PROFILE & INSTITUTION
            </h2>
          </div>
          <button
            type="button"
            onClick={() => goToStep('college')}
            className="text-xs text-[#E6C57D] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit Profile</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs sm:text-sm">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Delegate Name</span>
            <span className="font-semibold text-white mt-0.5 block">{currentUser.fullName}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Email Address</span>
            <span className="text-slate-200 mt-0.5 block">{currentUser.email}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Mobile Number</span>
            <span className="text-slate-200 font-mono mt-0.5 block">{currentUser.mobile}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Affiliated College</span>
            <span className="font-semibold text-[#F5E7C4] mt-0.5 block">
              {collegeDetails?.collegeName || 'Not configured'}
            </span>
            {collegeDetails?.city && (
              <span className="text-[11px] text-slate-400">{collegeDetails.city}, {collegeDetails.state}</span>
            )}
          </div>
        </div>
      </div>

      {/* 2. MY REGISTRATIONS SECTION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-cinzel text-xl font-bold text-white">
              My Registrations ({myRegistrations.length})
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live status tracking for your submitted competition slots
            </p>
          </div>
        </div>

        {myRegistrations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {myRegistrations.map((reg) => (
              <RegistrationCard
                key={reg.id}
                registration={reg}
                onViewReceipt={(r) => setViewReceiptRegistration(r)}
              />
            ))}
          </div>
        ) : (
          <div className="celestial-glass rounded-2xl p-10 text-center border border-white/10 max-w-md mx-auto space-y-3">
            <Sparkles className="w-8 h-8 text-[#D4AF37] mx-auto opacity-70" />
            <h3 className="font-cinzel text-lg font-bold text-white">No Competitions Registered Yet</h3>
            <p className="text-xs text-slate-400">
              Select an event to register yourself or your college delegation for Celestia'26.
            </p>
            <button
              type="button"
              onClick={() => startNewRegistration()}
              className="mt-2 py-2.5 px-5 text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-[#F5E7C4] to-[#D4AF37] text-[#070B1B] rounded-lg cursor-pointer"
            >
              Browse & Register Events
            </button>
          </div>
        )}
      </div>

      {/* Institutional Guidelines Notice */}
      <div className="p-4 rounded-xl bg-[#080D24] border border-white/5 text-xs text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
          <span>Official delegate passes will be issued upon reporting at the Main Stage desk on November 3, 2026.</span>
        </div>
        <span className="text-[11px] text-[#E6C57D]">Deadline: {FESTIVAL_METADATA.registrationDeadlineFormatted}</span>
      </div>
    </div>
  );
};
