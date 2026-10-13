import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  saveGuestImageToIndexedDB, 
  loadAllGuestImagesFromIndexedDB, 
  deleteGuestImageFromIndexedDB, 
  clearAllGuestImagesFromIndexedDB 
} from '../utils/imageUtils';

interface TextOverride {
  originalText: string;
  newText: string;
  selector?: string;
}

interface EditorContextType {
  isEditorLoggedIn: boolean;
  isEditModeActive: boolean;
  loginModalOpen: boolean;
  totalOverridesCount: number;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  loginEditor: (passkey: string) => boolean;
  logoutEditor: () => void;
  toggleEditMode: () => void;
  saveChanges: () => void;
  persistAllGuestsToServer: () => Promise<boolean>;
  resetAllOverrides: () => void;
  deleteSelectedElement: () => void;
  hasUnsavedChanges: boolean;
  // Guest photo management
  guestImages: Record<string, string>;
  setGuestPhoto: (guestId: string, dataUrl: string) => void;
  removeGuestPhoto: (guestId: string) => void;
  getGuestPhoto: (guestId: string, defaultPhoto?: string) => string;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

const STORAGE_KEY_AUTH = 'celestia_inline_editor_auth';
const STORAGE_KEY_OVERRIDES = 'celestia_inline_editor_overrides';
const STORAGE_KEY_GUEST_IMAGES = 'celestia_guest_images';

// Helper to sanitize any accidental "actress" to "Actor" for Rio Raj
const sanitizeOverridesMap = (map: Record<string, string>): Record<string, string> => {
  const result: Record<string, string> = {};
  for (const [key, val] of Object.entries(map)) {
    if (typeof val === 'string') {
      result[key] = val.replace(/\bactress\b/gi, 'Actor');
    } else {
      result[key] = val;
    }
  }
  return result;
};

export const EditorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isEditorLoggedIn, setIsEditorLoggedIn] = useState<boolean>(false);
  const [isEditModeActive, setIsEditModeActive] = useState<boolean>(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [overridesMap, setOverridesMap] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_OVERRIDES);
      return saved ? sanitizeOverridesMap(JSON.parse(saved)) : {};
    } catch {
      return {};
    }
  });

  const [guestImages, setGuestImages] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_GUEST_IMAGES);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Track active target element for deletion
  const [selectedEl, setSelectedEl] = useState<HTMLElement | null>(null);

  // Load guest photos from server file / IndexedDB on mount and sync
  useEffect(() => {
    // 1. Fetch server-persisted guest config
    fetch('/api/guest-data')
      .then((res) => (res.ok ? res.json() : null))
      .then((serverData) => {
        if (serverData?.savedImages && Object.keys(serverData.savedImages).length > 0) {
          setGuestImages((prev) => ({ ...serverData.savedImages, ...prev }));
        }
        if (serverData?.overridesMap && Object.keys(serverData.overridesMap).length > 0) {
          setOverridesMap((prev) => ({ ...sanitizeOverridesMap(serverData.overridesMap), ...prev }));
        }
      })
      .catch(() => {});

    // 2. Load from IndexedDB and auto-persist to server disk
    loadAllGuestImagesFromIndexedDB()
      .then((stored) => {
        if (stored && Object.keys(stored).length > 0) {
          setGuestImages((prev) => {
            const merged = { ...prev, ...stored };
            // Auto persist to server disk so every user gets permanent access
            fetch('/api/persist-guest-data', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                guestImages: merged,
                overridesMap,
              }),
            }).catch(() => {});
            return merged;
          });
        }
      })
      .catch((e) => console.warn('Could not read guest photos from IndexedDB:', e));
  }, []);

  // Apply stored overrides on DOM mount and navigation mutations
  useEffect(() => {
    const applyOverridesToDom = () => {
      const keys = Object.keys(overridesMap);
      if (keys.length === 0) return;

      // 1. Element-level exact text matching
      const editables = document.querySelectorAll<HTMLElement>('[data-original-text]');
      editables.forEach((el) => {
        const orig = el.getAttribute('data-original-text');
        if (orig && overridesMap[orig] !== undefined) {
          if (el.innerText !== overridesMap[orig]) {
            el.innerText = overridesMap[orig];
          }
        }
      });

      // 2. Text node-level replacement
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null
      );

      let node: Node | null;
      while ((node = walker.nextNode())) {
        const text = node.nodeValue?.trim();
        if (text && overridesMap[text] !== undefined) {
          const raw = node.nodeValue || '';
          const leadingWs = raw.match(/^\s*/)?.[0] || '';
          const trailingWs = raw.match(/\s*$/)?.[0] || '';
          node.nodeValue = leadingWs + overridesMap[text] + trailingWs;
        }
      }
    };

    applyOverridesToDom();

    const observer = new MutationObserver(() => {
      applyOverridesToDom();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: false,
    });

    return () => observer.disconnect();
  }, [overridesMap]);

  // When Edit Mode is active, make elements contentEditable
  useEffect(() => {
    if (!isEditorLoggedIn || !isEditModeActive) {
      // Remove contentEditable from any elements
      const editableElements = document.querySelectorAll('[data-celestia-editable="true"]');
      editableElements.forEach((el) => {
        el.removeAttribute('contenteditable');
        el.removeAttribute('data-celestia-editable');
        (el as HTMLElement).classList.remove(
          'celestia-editor-active-target',
          'celestia-editor-hoverable'
        );
      });
      return;
    }

    const eligibleTags = ['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'SPAN', 'DIV', 'A', 'BUTTON', 'LI', 'LABEL'];

    const attachEditable = () => {
      // Don't make editor controls editable
      const editorToolbar = document.getElementById('celestia-inline-editor-toolbar');
      const editorModal = document.getElementById('celestia-editor-login-modal');

      const elements = document.querySelectorAll<HTMLElement>(
        eligibleTags.map(tag => `${tag}:not(#celestia-inline-editor-toolbar *):not(#celestia-editor-login-modal *)`).join(',')
      );

      elements.forEach((el) => {
        // Skip elements inside editor toolbar/modals
        if (editorToolbar && editorToolbar.contains(el)) return;
        if (editorModal && editorModal.contains(el)) return;
        if (el.closest('#celestia-inline-editor-toolbar') || el.closest('#celestia-editor-login-modal')) return;

        // Skip SVG or script tags
        if (el.tagName === 'SVG' || el.tagName === 'PATH' || el.tagName === 'SCRIPT') return;

        // Check if element has direct text or only a few text children
        const hasText = Array.from(el.childNodes).some(
          (child) => child.nodeType === Node.TEXT_NODE && child.nodeValue?.trim().length! > 0
        );

        if (hasText) {
          el.setAttribute('contenteditable', 'true');
          el.setAttribute('data-celestia-editable', 'true');
          el.classList.add('celestia-editor-hoverable');
          el.spellcheck = false;

          // Record original text if not already saved
          if (!el.getAttribute('data-original-text')) {
            el.setAttribute('data-original-text', el.innerText.trim());
          }
        }
      });
    };

    attachEditable();

    const handleInput = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target && target.getAttribute('data-celestia-editable') === 'true') {
        setHasUnsavedChanges(true);
      }
    };

    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target && target.getAttribute('data-celestia-editable') === 'true') {
        setSelectedEl(target);
      }
    };

    document.addEventListener('input', handleInput);
    document.addEventListener('focusin', handleFocus);

    // Keep reapplying when route or DOM components re-render
    const observer = new MutationObserver(() => {
      attachEditable();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      document.removeEventListener('input', handleInput);
      document.removeEventListener('focusin', handleFocus);
      observer.disconnect();
    };
  }, [isEditorLoggedIn, isEditModeActive]);

  const openLoginModal = () => setLoginModalOpen(true);
  const closeLoginModal = () => setLoginModalOpen(false);

  const loginEditor = (passkey: string): boolean => {
    // Standard passes: celestia2026, admin, edit, celestia
    const normalized = passkey.trim().toLowerCase();
    if (normalized === 'celestia2026' || normalized === 'admin' || normalized === 'editor' || normalized === 'edit') {
      setIsEditorLoggedIn(true);
      setIsEditModeActive(true);
      localStorage.setItem(STORAGE_KEY_AUTH, 'true');
      setLoginModalOpen(false);
      return true;
    }
    return false;
  };

  const logoutEditor = () => {
    setIsEditorLoggedIn(false);
    setIsEditModeActive(false);
    localStorage.removeItem(STORAGE_KEY_AUTH);
  };

  const toggleEditMode = () => {
    setIsEditModeActive((prev) => !prev);
  };

  const setGuestPhoto = (guestId: string, dataUrl: string) => {
    setGuestImages((prev) => {
      const updated = { ...prev, [guestId]: dataUrl };
      try {
        localStorage.setItem(STORAGE_KEY_GUEST_IMAGES, JSON.stringify(updated));
      } catch (storageErr) {
        // Handle QuotaExceededError gracefully without crashing
        console.warn('localStorage quota reached for guest images. Photo is safely stored in IndexedDB and active memory cache.');
      }
      return updated;
    });
    // Reliably persist to IndexedDB (virtually unlimited quota)
    saveGuestImageToIndexedDB(guestId, dataUrl).catch((err) => {
      console.warn('IndexedDB save warning:', err);
    });
    setHasUnsavedChanges(true);
  };

  const removeGuestPhoto = (guestId: string) => {
    setGuestImages((prev) => {
      const updated = { ...prev };
      delete updated[guestId];
      try {
        localStorage.setItem(STORAGE_KEY_GUEST_IMAGES, JSON.stringify(updated));
      } catch (err) {
        console.warn('localStorage update warning:', err);
      }
      return updated;
    });
    deleteGuestImageFromIndexedDB(guestId).catch((err) => {
      console.warn('IndexedDB delete warning:', err);
    });
    setHasUnsavedChanges(true);
  };

  const getGuestPhoto = (guestId: string, defaultPhoto: string = ''): string => {
    return guestImages[guestId] || defaultPhoto;
  };

  const persistAllGuestsToServer = async (): Promise<boolean> => {
    try {
      const sanitized = sanitizeOverridesMap(overridesMap);
      const res = await fetch('/api/persist-guest-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestImages,
          overridesMap: sanitized,
        }),
      });
      if (res.ok) {
        setHasUnsavedChanges(false);
        return true;
      }
    } catch (err) {
      console.warn('Persist to server warning:', err);
    }
    return false;
  };

  const saveChanges = () => {
    const editables = document.querySelectorAll<HTMLElement>('[data-celestia-editable="true"]');
    const newOverrides: Record<string, string> = { ...overridesMap };

    editables.forEach((el) => {
      const orig = el.getAttribute('data-original-text');
      const current = el.innerText.trim();
      if (orig && current !== orig) {
        newOverrides[orig] = current;
      }
    });

    const sanitized = sanitizeOverridesMap(newOverrides);
    setOverridesMap(sanitized);

    try {
      localStorage.setItem(STORAGE_KEY_OVERRIDES, JSON.stringify(sanitized));
    } catch (err) {
      console.warn('Could not persist text overrides to localStorage:', err);
    }
    try {
      localStorage.setItem(STORAGE_KEY_GUEST_IMAGES, JSON.stringify(guestImages));
    } catch (err) {
      console.warn('localStorage quota reached during save. Images remain safely saved in IndexedDB.');
    }

    // Also persist permanently to server disk so all website visitors see them
    persistAllGuestsToServer().catch(() => {});
    setHasUnsavedChanges(false);
  };

  const resetAllOverrides = () => {
    try {
      localStorage.removeItem(STORAGE_KEY_OVERRIDES);
      localStorage.removeItem(STORAGE_KEY_GUEST_IMAGES);
    } catch (err) {
      console.warn('Error clearing localStorage:', err);
    }
    clearAllGuestImagesFromIndexedDB().catch(() => {});
    setOverridesMap({});
    setGuestImages({});
    setHasUnsavedChanges(false);
    window.location.reload();
  };

  const deleteSelectedElement = () => {
    if (selectedEl) {
      // Clear its text content or hide it
      const orig = selectedEl.getAttribute('data-original-text') || selectedEl.innerText.trim();
      selectedEl.innerText = '';
      if (orig) {
        const newMap = { ...overridesMap, [orig]: '' };
        setOverridesMap(newMap);
        localStorage.setItem(STORAGE_KEY_OVERRIDES, JSON.stringify(newMap));
      }
      setHasUnsavedChanges(false);
    }
  };

  return (
    <EditorContext.Provider
      value={{
        isEditorLoggedIn,
        isEditModeActive,
        loginModalOpen,
        totalOverridesCount: Object.keys(overridesMap).length + Object.keys(guestImages).length,
        openLoginModal,
        closeLoginModal,
        loginEditor,
        logoutEditor,
        toggleEditMode,
        saveChanges,
        persistAllGuestsToServer,
        resetAllOverrides,
        deleteSelectedElement,
        hasUnsavedChanges,
        guestImages,
        setGuestPhoto,
        removeGuestPhoto,
        getGuestPhoto,
      }}
    >
      {children}
    </EditorContext.Provider>
  );
};

export const useInlineEditor = () => {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error('useInlineEditor must be used within an EditorProvider');
  }
  return context;
};
