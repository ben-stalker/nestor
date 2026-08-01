import { lazy, Suspense } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import AppShell from './core/AppShell';
import HomePage from './features/home';
import CalendarPage from './calendar';
import FoodPage from './food';
import VehiclePage from './vehicles';
import FamilyHub from './family/FamilyHub';
import MePage from './me/MePage';
import HousePage from './house/HousePage';
import FinancePage from './finance/FinancePage';
import PetsPage from './pets/PetsPage';
import BoardPage from './board/BoardPage';
import ContactsPage from './contacts/ContactsPage';
import EvPage from './ev/EvPage';
import PluginsPage from './plugins/PluginsPage';
import YouTubeBrowsePage from './plugins/youtubePlayer/YouTubeBrowsePage';
import AdminPage from './admin/AdminPage';
import { useActiveProfile } from './core/hooks/useActiveProfile';
import PageTransition from './shared/PageTransition';

const UIGallery = lazy(() => import('./shared/ui/__gallery__'));

function HomeRedirect() {
  return <HomePage />;
}

function MeRoute() {
  const profile = useActiveProfile();
  if (!profile) return <HomePage />;
  return <MePage profile={profile} />;
}

/**
 * AnimatedRoutes — renders Routes inside AnimatePresence so that
 * PageTransition wrappers can animate out on route change.
 */
function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        {import.meta.env.DEV && (
          <Route
            path="/ui"
            element={
              <Suspense fallback={null}>
                <UIGallery />
              </Suspense>
            }
          />
        )}
        <Route element={<AppShell />}>
          <Route
            index
            element={
              <PageTransition>
                <HomeRedirect />
              </PageTransition>
            }
          />
          <Route
            path="/me"
            element={
              <PageTransition>
                <MeRoute />
              </PageTransition>
            }
          />
          <Route
            path="/calendar"
            element={
              <PageTransition>
                <CalendarPage />
              </PageTransition>
            }
          />
          <Route
            path="/food"
            element={
              <PageTransition>
                <FoodPage />
              </PageTransition>
            }
          />
          <Route
            path="/vehicles"
            element={
              <PageTransition>
                <VehiclePage />
              </PageTransition>
            }
          />
          <Route
            path="/family"
            element={
              <PageTransition>
                <FamilyHub />
              </PageTransition>
            }
          />
          <Route
            path="/house"
            element={
              <PageTransition>
                <HousePage />
              </PageTransition>
            }
          />
          <Route
            path="/finance"
            element={
              <PageTransition>
                <FinancePage />
              </PageTransition>
            }
          />
          <Route
            path="/pets"
            element={
              <PageTransition>
                <PetsPage />
              </PageTransition>
            }
          />
          <Route
            path="/ev"
            element={
              <PageTransition>
                <EvPage />
              </PageTransition>
            }
          />
          <Route
            path="/board"
            element={
              <PageTransition>
                <BoardPage />
              </PageTransition>
            }
          />
          <Route
            path="/contacts"
            element={
              <PageTransition>
                <ContactsPage />
              </PageTransition>
            }
          />
          <Route
            path="/admin/plugins"
            element={
              <PageTransition>
                <PluginsPage />
              </PageTransition>
            }
          />
          <Route
            path="/admin/:section"
            element={
              <PageTransition>
                <AdminPage />
              </PageTransition>
            }
          />
          <Route
            path="/admin"
            element={
              <PageTransition>
                <AdminPage />
              </PageTransition>
            }
          />
          <Route
            path="/plugins/youtube-player"
            element={
              <PageTransition>
                <YouTubeBrowsePage />
              </PageTransition>
            }
          />
          <Route
            path="*"
            element={
              <PageTransition>
                <main className="flex min-h-screen items-center justify-center bg-warm text-primary">
                  <p className="text-body text-secondary">Page not found</p>
                </main>
              </PageTransition>
            }
          />
        </Route>
      </Routes>
    </AnimatePresence>
  );
}

export default function Router() {
  return <AnimatedRoutes />;
}
