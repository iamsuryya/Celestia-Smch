import React, { createContext, useContext, useState, useEffect } from 'react';
import { EventResultItem } from '../types/results';
import { INITIAL_EVENT_RESULTS } from '../data/initialResults';

interface ResultsContextType {
  results: EventResultItem[];
  getEventResult: (eventId: string) => EventResultItem | undefined;
  updateResult: (eventId: string, data: Partial<EventResultItem>) => void;
  publishResult: (eventId: string) => void;
  unpublishResult: (eventId: string) => void;
  loadDemoResult: (eventId: string) => void;
  clearResult: (eventId: string) => void;
  resetAllResults: () => void;
  publishedCount: number;
  draftCount: number;
}

const STORAGE_KEY = 'celestia_event_results_v2';

const ResultsContext = createContext<ResultsContextType | undefined>(undefined);

// Preset sample results for demonstration when admin clicks "Load Sample Result"
const DEMO_SAMPLES: Record<string, Partial<EventResultItem>> = {
  seraphia: {
    winner: {
      participantName: 'Aditya Narayanan',
      collegeName: 'Madras Medical College, Chennai',
      prizeAmount: '₹6,000',
    },
    runnerUp: {
      participantName: 'Sneha Varadarajan',
      collegeName: 'Stanley Medical College, Chennai',
      prizeAmount: '₹3,000',
    },
    secondRunnerUp: {
      participantName: 'Karthik Raja',
      collegeName: 'Srinivasan Medical College, Trichy',
    },
    specialAwards: [
      {
        awardTitle: 'Best Classical Rendition',
        participantName: 'Pooja Iyer',
        collegeName: 'PSG IMS&R, Coimbatore',
      },
    ],
  },
  symphora: {
    winner: {
      participantName: 'Rohit Matthew (Electric Violin)',
      collegeName: 'Christian Medical College, Vellore',
      prizeAmount: '₹7,000',
    },
    runnerUp: {
      participantName: 'Devanathan K. (Acoustic Guitar)',
      collegeName: 'PSG IMS&R, Coimbatore',
      prizeAmount: '₹3,000',
    },
  },
  nrityara: {
    winner: {
      participantName: 'Meenakshi Sundaresan',
      collegeName: 'Madurai Medical College',
      prizeAmount: '₹6,000',
    },
    runnerUp: {
      participantName: 'Ananya Ramesh',
      collegeName: 'Government Kilpauk Medical College',
      prizeAmount: '₹3,000',
    },
    specialAwards: [
      {
        awardTitle: 'Best Abhinaya & Expression',
        participantName: 'Kavya S.',
        collegeName: 'Thanjavur Medical College',
      },
    ],
  },
  starfusion: {
    winner: {
      participantName: 'Celestial Troopers Crew',
      collegeName: 'Tirunelveli Medical College',
      prizeAmount: '₹15,000',
    },
    runnerUp: {
      participantName: 'Astral Rhythm Collective',
      collegeName: 'Coimbatore Medical College',
      prizeAmount: '₹7,000',
    },
    secondRunnerUp: {
      participantName: 'Pulse X Beatmasters',
      collegeName: 'Srinivasan Medical College & Hospital',
    },
  },
  silhouette: {
    winner: {
      participantName: 'Dune Royalty Troupe',
      collegeName: 'PSG IMS&R, Coimbatore',
      prizeAmount: '₹15,000',
    },
    runnerUp: {
      participantName: 'Sultanate Aura Line',
      collegeName: 'SRM Medical College Hospital',
      prizeAmount: '₹10,000',
    },
  },
};

export const ResultsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [results, setResults] = useState<EventResultItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === INITIAL_EVENT_RESULTS.length) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return INITIAL_EVENT_RESULTS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(results));
    } catch (err) {
      console.error('Failed to save results to localStorage', err);
    }
  }, [results]);

  const getEventResult = (eventId: string) => {
    return results.find((r) => r.eventId === eventId);
  };

  const updateResult = (eventId: string, data: Partial<EventResultItem>) => {
    setResults((prev) =>
      prev.map((r) => {
        if (r.eventId === eventId) {
          return { ...r, ...data };
        }
        return r;
      })
    );
  };

  const publishResult = (eventId: string) => {
    setResults((prev) =>
      prev.map((r) => {
        if (r.eventId === eventId) {
          return {
            ...r,
            status: 'PUBLISHED',
            publishedAt: new Date().toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            }),
          };
        }
        return r;
      })
    );
  };

  const unpublishResult = (eventId: string) => {
    setResults((prev) =>
      prev.map((r) => {
        if (r.eventId === eventId) {
          return {
            ...r,
            status: 'DRAFT',
          };
        }
        return r;
      })
    );
  };

  const loadDemoResult = (eventId: string) => {
    const sample = DEMO_SAMPLES[eventId] || {
      winner: {
        participantName: 'First Place Winner',
        collegeName: 'Participating Medical College',
      },
      runnerUp: {
        participantName: 'Second Place Runner-Up',
        collegeName: 'Participating Medical College',
      },
    };

    setResults((prev) =>
      prev.map((r) => {
        if (r.eventId === eventId) {
          return {
            ...r,
            ...sample,
            status: 'PUBLISHED',
            publishedAt: new Date().toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            }),
          };
        }
        return r;
      })
    );
  };

  const clearResult = (eventId: string) => {
    setResults((prev) =>
      prev.map((r) => {
        if (r.eventId === eventId) {
          return {
            ...r,
            status: 'DRAFT',
            winner: undefined,
            runnerUp: undefined,
            secondRunnerUp: undefined,
            specialAwards: undefined,
            publishedAt: undefined,
            note: undefined,
          };
        }
        return r;
      })
    );
  };

  const resetAllResults = () => {
    setResults(INITIAL_EVENT_RESULTS);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  const publishedCount = results.filter((r) => r.status === 'PUBLISHED').length;
  const draftCount = results.filter((r) => r.status === 'DRAFT').length;

  return (
    <ResultsContext.Provider
      value={{
        results,
        getEventResult,
        updateResult,
        publishResult,
        unpublishResult,
        loadDemoResult,
        clearResult,
        resetAllResults,
        publishedCount,
        draftCount,
      }}
    >
      {children}
    </ResultsContext.Provider>
  );
};

export const useResults = () => {
  const context = useContext(ResultsContext);
  if (!context) {
    throw new Error('useResults must be used within a ResultsProvider');
  }
  return context;
};
