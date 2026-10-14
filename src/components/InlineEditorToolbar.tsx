import React, { useState } from 'react';
import { 
  Edit3, 
  Save, 
  Trash2, 
  RotateCcw, 
  LogOut, 
  Check, 
  Eye, 
  X, 
  Sparkles, 
  Lock, 
  HelpCircle,
  FileCheck,
  MousePointerClick,
  ShieldCheck
} from 'lucide-react';
import { useInlineEditor } from '../context/EditorContext';

export const InlineEditorToolbar: React.FC = () => {
  const {
    isEditorLoggedIn,
    isEditModeActive,
    loginModalOpen,
    totalOverridesCount,
    openLoginModal,
    closeLoginModal,
    loginEditor,
    logoutEditor,
    toggleEditMode,
    saveChanges,
    resetAllOverrides,
    hasUnsavedChanges,
  } = useInlineEditor();

  const [passkey, setPasskey] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showTips, setShowTips] = useState(false);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = loginEditor(passkey);
    if (success) {
      setErrorMsg('');
      setPasskey('');
    } else {
      setErrorMsg('Invalid authorization key. Please enter an authorized administrator passkey.');
    }
  };

  const handleSave = () => {
    saveChanges();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <>
      {/* 1. Quick Floating Editor Access Button (when not logged in) */}
      {!isEditorLoggedIn && (
        <button
          onClick={openLoginModal}
          id="celestia-editor-launch-badge"
          className="fixed bottom-4 right-4 z-40 bg-[#0E1538]/90 hover:bg-[#162152] text-[#F5E7C4] hover:text-white border border-[#D4AF37]/40 hover:border-[#D4AF37] shadow-xl backdrop-blur-md px-3 py-2 rounded-full flex items-center gap-2 text-xs font-medium cursor-pointer transition-all hover:scale-105 group"
          title="Click to log in to Live Text Editor"
        >
          <div className="w-5 h-5 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/50 flex items-center justify-center text-[#E6C57D]">
            <Edit3 className="w-3 h-3" />
          </div>
          <span>Editor Mode</span>
          <span className="hidden group-hover:inline text-[10px] text-slate-400 font-mono">
            (Click & Delete Texts)
          </span>
        </button>
      )}

      {/* 2. Floating Top/Bottom Control Bar (when logged in as Editor) */}
      {isEditorLoggedIn && (
        <div
          id="celestia-inline-editor-toolbar"
          className="fixed top-20 right-4 z-50 bg-[#070B1E]/95 border border-[#D4AF37]/50 shadow-2xl backdrop-blur-xl rounded-xl p-2.5 max-w-sm sm:max-w-md text-white transition-all animate-in fade-in slide-in-from-top-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <span className="text-xs font-bold tracking-wider text-[#E6C57D] font-cinzel">
                LIVE TEXT EDITOR ACTIVE
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowTips(!showTips)}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-white/5"
                title="How it works"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={logoutEditor}
                className="text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 px-2 py-0.5 rounded border border-rose-500/20 flex items-center gap-1 cursor-pointer transition-colors"
                title="Exit Editor Mode"
              >
                <LogOut className="w-3 h-3" />
                <span>Exit</span>
              </button>
            </div>
          </div>

          {/* Quick Instructions Banner */}
          <div className="bg-[#121B3E]/60 border border-[#D4AF37]/20 rounded-md p-2 mb-2.5 text-[11px] leading-relaxed text-slate-300">
            <div className="flex items-start gap-1.5">
              <MousePointerClick className="w-3.5 h-3.5 text-[#E6C57D] shrink-0 mt-0.5" />
              <div>
                <strong>Click any text</strong> to edit/delete words, or <strong>hover over guest portraits</strong> to upload photos directly. Click <strong>Save Edits</strong> to persist changes across the main website!
              </div>
            </div>
          </div>

          {/* Action Buttons Row */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Toggle Click-to-Edit Mode */}
            <button
              onClick={toggleEditMode}
              className={`px-2.5 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
                isEditModeActive
                  ? 'bg-amber-500/20 text-[#F5E7C4] border border-[#D4AF37]/50'
                  : 'bg-white/5 text-slate-400 hover:text-white border border-white/10'
              }`}
            >
              {isEditModeActive ? <Edit3 className="w-3.5 h-3.5 text-[#D4AF37]" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{isEditModeActive ? 'Editing Mode: ON' : 'Preview Mode'}</span>
            </button>

            {/* Save Changes */}
            <button
              onClick={handleSave}
              className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                hasUnsavedChanges
                  ? 'bg-gradient-to-r from-[#F5E7C4] via-[#E6C57D] to-[#D4AF37] text-[#070B1B] shadow-md shadow-[#D4AF37]/30 hover:brightness-110 animate-pulse'
                  : 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600/30'
              }`}
            >
              {saveSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>{hasUnsavedChanges ? 'Save Edits*' : 'Saved'}</span>
                </>
              )}
            </button>

            {/* Reset All Changes */}
            {totalOverridesCount > 0 && (
              <button
                onClick={() => {
                  if (window.confirm('Reset all edited and deleted texts back to original?')) {
                    resetAllOverrides();
                  }
                }}
                className="px-2 py-1.5 rounded text-xs text-slate-400 hover:text-rose-300 hover:bg-rose-950/30 border border-white/10 hover:border-rose-500/30 flex items-center gap-1 cursor-pointer transition-colors"
                title={`Reset ${totalOverridesCount} custom text changes`}
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* Expanded Help Modal */}
          {showTips && (
            <div className="mt-2.5 pt-2 border-t border-white/10 text-[11px] text-slate-300 space-y-1 bg-black/30 p-2 rounded">
              <p className="font-semibold text-[#E6C57D]">How it works:</p>
              <ul className="list-disc pl-4 space-y-0.5 text-slate-400">
                <li>Hover over any headline, paragraph, badge, or label. A dashed gold box will appear.</li>
                <li>Click directly on the letters you want to change.</li>
                <li>Press <span className="text-white font-mono">Backspace</span> to erase unwanted words, or type replacement text.</li>
                <li>Hover over any guest frame to click <strong>Upload Photo</strong> and pick a picture directly from your computer or phone.</li>
                <li>Click <strong>Save Edits</strong> to keep all changes stored across the site.</li>
              </ul>
            </div>
          )}
        </div>
      )}

      {/* 3. Editor Login Modal */}
      {loginModalOpen && (
        <div
          id="celestia-editor-login-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in"
        >
          <div className="bg-[#0B1028] border border-[#D4AF37]/40 rounded-2xl p-6 max-w-md w-full shadow-2xl relative text-left">
            <button
              onClick={closeLoginModal}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center text-[#E6C57D]">
                <Edit3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-cinzel text-lg font-bold gold-gradient-text">
                  Website Live Text Editor
                </h3>
                <p className="text-xs text-slate-400">
                  Instant click-and-delete mode for all page texts
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              Log in to turn on <strong>Inline Editing</strong>. Once logged in, every headline, paragraph, card title, and caption on the entire website can be clicked and backspaced or deleted directly on the screen!
            </p>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Editor Security Passkey
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    value={passkey}
                    onChange={(e) => setPasskey(e.target.value)}
                    placeholder="Enter security passkey"
                    className="w-full bg-[#050714] border border-[#D4AF37]/30 focus:border-[#D4AF37] rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                    autoFocus
                  />
                </div>
                {errorMsg && (
                  <p className="text-xs text-rose-400 mt-1.5">{errorMsg}</p>
                )}
                <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Authorized Celestia'26 content editing personnel only</span>
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeLoginModal}
                  className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold uppercase tracking-wider text-[#070B1B] bg-gradient-to-r from-[#F5E7C4] via-[#E6C57D] to-[#D4AF37] hover:brightness-110 rounded-lg shadow-md cursor-pointer"
                >
                  Unlock Live Editor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
