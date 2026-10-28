import React, { useState } from 'react';
import { CosmicBackground } from './components/CosmicBackground';
import { Navbar, NavigationPage } from './components/Navbar';
import { Footer } from './components/Footer';
import { EventDetailModal } from './components/EventDetailModal';
import { RegistrationProvider, useRegistration } from './context/RegistrationContext';
import { ResultsProvider } from './context/ResultsContext';
import { EditorProvider } from './context/EditorContext';
import { RegistrationWizard } from './components/registration/RegistrationWizard';
import { HomePage } from './pages/HomePage';
import { EventsPage } from './pages/EventsPage';
import { SchedulePage } from './pages/SchedulePage';
import { ResultsPage } from './pages/ResultsPage';
import { EventGuestsPage } from './pages/EventGuestsPage';
import { AccommodationPage } from './pages/AccommodationPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { Admin1RegistrationsPage } from './pages/Admin1RegistrationsPage';
import { InchargesPortalPage } from './pages/InchargesPortalPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { ComboOffersPage } from './pages/ComboOffersPage';
import { ComboRegistrationWizard } from './components/registration/ComboRegistrationWizard';
import { ComboOffer } from './data/comboOffersData';
import { EventItem, CategoryInfo } from './data/festivalData';
import { isEventRegistrationOpen } from './utils/registrationStatus';

function AppContent() {
  const [currentPage, setCurrentPage] = useState<NavigationPage>(() => {
    // Support direct navigation to /admin, /admin1, /incharges or hash variations
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    if (path.includes('incharges') || hash.includes('incharges')) {
      return 'incharges';
    }
    if (path.includes('admin1') || hash.includes('admin1') || path.includes('celestiasmch') || hash.includes('celestiasmch')) {
      return 'admin1';
    }
    if (path.includes('admin') || hash.includes('admin')) {
      return 'admin';
    }
    if (path === '/combos' || hash === '#/combos' || hash === '#combos') return 'combos';
    if (path === '/schedule' || hash === '#/schedule' || hash === '#schedule') return 'schedule';
    if (path === '/accommodation' || hash === '#/accommodation' || hash === '#accommodation' || path === '/accomodation' || hash === '#/accomodation' || hash === '#accomodation') return 'accommodation';
    if (path === '/results' || hash === '#/results' || hash === '#results') return 'results';
    if (path === '/guests' || hash === '#/guests' || hash === '#guests') return 'guests';
    if (path === '/events' || hash === '#/events' || hash === '#events') return 'events';
    return 'home';
  });
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [activeModalEvent, setActiveModalEvent] = useState<EventItem | null>(null);
  const [isRegisteringView, setIsRegisteringView] = useState(false);
  const [activeComboWizard, setActiveComboWizard] = useState<{ combo: ComboOffer; selectedEvents: EventItem[] } | null>(null);

  const { currentUser, startNewRegistration, goToStep, logoutUser } = useRegistration();

  // Listen to popstate / hashchange to allow direct route /admin, /admin1, /incharges typing
  React.useEffect(() => {
    const handleUrlChange = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      if (path.includes('incharges') || hash.includes('incharges')) {
        setCurrentPage('incharges');
        setIsRegisteringView(false);
      } else if (path.includes('admin1') || hash.includes('admin1') || path.includes('celestiasmch') || hash.includes('celestiasmch')) {
        setCurrentPage('admin1');
        setIsRegisteringView(false);
      } else if (path.includes('admin') || hash.includes('admin')) {
        setCurrentPage('admin');
        setIsRegisteringView(false);
      }
    };
    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  const handleNavigate = (page: NavigationPage) => {
    setIsRegisteringView(false);
    setActiveComboWizard(null);
    setCurrentPage(page);
    // Update hash for accessible deep-linking without disrupting SPA
    if (page === 'admin') {
      window.history.pushState(null, '', '#/admin');
    } else if (page === 'admin1') {
      window.history.pushState(null, '', '#/admin1');
    } else if (page === 'incharges') {
      window.history.pushState(null, '', '#/incharges');
    } else if (page === 'home') {
      window.history.pushState(null, '', window.location.pathname);
    } else {
      window.history.pushState(null, '', `/#/${page}`);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectCategoryFromHome = (categoryId: CategoryInfo['id']) => {
    setIsRegisteringView(false);
    setActiveComboWizard(null);
    setSelectedCategoryFilter(categoryId);
    setCurrentPage('events');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenRegister = (event?: EventItem) => {
    if (event) {
      if (!isEventRegistrationOpen(event.id) || !isEventRegistrationOpen(event.code)) {
        alert(`Registration for ${event.title} (${event.code}) has been stopped by the Admin.`);
        return;
      }
    }
    setActiveModalEvent(null);
    setActiveComboWizard(null);
    startNewRegistration(event?.id);
    setIsRegisteringView(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenDashboard = () => {
    setActiveModalEvent(null);
    setActiveComboWizard(null);
    goToStep('dashboard');
    setIsRegisteringView(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#050714] text-[#E5E9F0] relative selection:bg-[#D4AF37]/30 selection:text-[#FFF7D6]">
      {/* Dynamic layered cosmic background */}
      <CosmicBackground />

      {/* Top Navigation */}
      <Navbar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onOpenRegister={() => handleOpenRegister()}
        userFullName={currentUser?.fullName}
        onOpenDashboard={handleOpenDashboard}
        onLogout={logoutUser}
      />

      {/* Main Page Content or Registration Flow */}
      {isRegisteringView ? (
        <RegistrationWizard onExit={() => setIsRegisteringView(false)} />
      ) : activeComboWizard ? (
        <main className="relative z-10 min-h-[calc(100vh-250px)]">
          <ComboRegistrationWizard
            combo={activeComboWizard.combo}
            selectedEvents={activeComboWizard.selectedEvents}
            onCancel={() => setActiveComboWizard(null)}
            onComplete={() => {
              setActiveComboWizard(null);
              handleNavigate('home');
            }}
          />
        </main>
      ) : (
        <main className="relative z-10 min-h-[calc(100vh-250px)]">
          {currentPage === 'home' && (
            <HomePage
              onNavigate={handleNavigate}
              onSelectCategory={handleSelectCategoryFromHome}
              onViewEventDetails={(ev) => setActiveModalEvent(ev)}
              onOpenRegister={(ev) => handleOpenRegister(ev)}
            />
          )}

          {currentPage === 'combos' && (
            <ComboOffersPage
              onNavigateHome={() => handleNavigate('home')}
              onSelectComboForWizard={(combo, selectedEvents) => {
                setActiveComboWizard({ combo, selectedEvents });
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          )}

          {currentPage === 'events' && (
            <EventsPage
              selectedCategory={selectedCategoryFilter}
              onCategoryChange={(cat) => setSelectedCategoryFilter(cat)}
              onViewDetails={(ev) => setActiveModalEvent(ev)}
              onRegister={(ev) => handleOpenRegister(ev)}
            />
          )}

          {currentPage === 'guests' && (
            <EventGuestsPage
              onNavigate={handleNavigate}
              onOpenRegister={() => handleOpenRegister()}
            />
          )}

          {currentPage === 'schedule' && (
            <SchedulePage
              onViewEventDetails={(ev) => setActiveModalEvent(ev)}
              onOpenRegister={(ev) => handleOpenRegister(ev)}
            />
          )}

          {currentPage === 'accommodation' && (
            <AccommodationPage
              onNavigate={handleNavigate}
              onOpenRegister={() => handleOpenRegister()}
            />
          )}

          {currentPage === 'results' && <ResultsPage />}

          {currentPage === 'admin' && (
            <AdminDashboardPage
              onNavigateToPublicResults={() => handleNavigate('results')}
              onExitAdmin={() => handleNavigate('home')}
              onNavigateToAdmin1={() => handleNavigate('admin1')}
            />
          )}

          {currentPage === 'admin1' && (
            <Admin1RegistrationsPage
              onExit={() => handleNavigate('home')}
              onNavigateToTabulation={() => handleNavigate('admin')}
            />
          )}

          {currentPage === 'incharges' && (
            <InchargesPortalPage
              onExit={() => handleNavigate('home')}
              onNavigateToAdmin={() => handleNavigate('admin1')}
            />
          )}

          {currentPage === 'about' && <AboutPage />}

          {currentPage === 'contact' && (
            <ContactPage
              onNavigate={handleNavigate}
              onOpenRegister={() => handleOpenRegister()}
            />
          )}
        </main>
      )}

      {/* Reusable Event Detail Modal */}
      <EventDetailModal
        event={activeModalEvent}
        onClose={() => setActiveModalEvent(null)}
        onRegister={(ev) => handleOpenRegister(ev)}
      />

      {/* Footer (shown on main website views, hidden when in admin, admin1, incharges, combo wizard or registering) */}
      {!isRegisteringView && !activeComboWizard && currentPage !== 'admin' && currentPage !== 'admin1' && currentPage !== 'incharges' && (
        <Footer
          onNavigate={handleNavigate}
          onOpenRegister={() => handleOpenRegister()}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <RegistrationProvider>
      <ResultsProvider>
        <EditorProvider>
          <AppContent />
        </EditorProvider>
      </ResultsProvider>
    </RegistrationProvider>
  );
}
