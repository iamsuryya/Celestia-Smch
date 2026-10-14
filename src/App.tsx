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
import { EventItem, CategoryInfo } from './data/festivalData';

function AppContent() {
  const [currentPage, setCurrentPage] = useState<NavigationPage>(() => {
    // Support direct navigation to /admin, /admin1, /incharges or hash variations
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    if (path === '/incharges' || hash === '#/incharges' || hash === '#incharges') {
      return 'incharges';
    }
    if (path === '/admin1' || hash === '#/admin1' || hash === '#admin1') {
      return 'admin1';
    }
    if (path === '/admin' || hash === '#/admin' || hash === '#admin') {
      return 'admin';
    }
    if (path === '/schedule' || hash === '#/schedule' || hash === '#schedule') return 'schedule';
    if (path === '/accommodation' || hash === '#/accommodation' || hash === '#accommodation' || path === '/accomodation' || hash === '#/accomodation' || hash === '#accomodation') return 'accommodation';
    if (path === '/results' || hash === '#/results' || hash === '#results') return 'results';
    if (path === '/guests' || hash === '#/guests' || hash === '#guests') return 'guests';
    if (path === '/events' || hash === '#/events' || hash === '#events') return 'events';
    return 'home';
  });
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<CategoryInfo['id'] | 'all'>('all');
  const [activeModalEvent, setActiveModalEvent] = useState<EventItem | null>(null);
  const [isRegisteringView, setIsRegisteringView] = useState(false);

  const { currentUser, startNewRegistration, goToStep, logoutUser } = useRegistration();

  // Listen to popstate / hashchange to allow direct route /admin, /admin1, /incharges typing
  React.useEffect(() => {
    const handleUrlChange = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      if (path === '/incharges' || hash === '#/incharges' || hash === '#incharges') {
        setCurrentPage('incharges');
        setIsRegisteringView(false);
      } else if (path === '/admin1' || hash === '#/admin1' || hash === '#admin1') {
        setCurrentPage('admin1');
        setIsRegisteringView(false);
      } else if (path === '/admin' || hash === '#/admin' || hash === '#admin') {
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
    setSelectedCategoryFilter(categoryId);
    setCurrentPage('events');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenRegister = (event?: EventItem) => {
    setActiveModalEvent(null);
    startNewRegistration(event?.id);
    setIsRegisteringView(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenDashboard = () => {
    setActiveModalEvent(null);
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

      {/* Footer (shown on main website views, hidden when in admin, admin1, incharges or registering) */}
      {!isRegisteringView && currentPage !== 'admin' && currentPage !== 'admin1' && currentPage !== 'incharges' && (
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
