import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
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
import { useActiveProfile } from './core/hooks/useActiveProfile';

const UIGallery = lazy(() => import('./shared/ui/__gallery__'));

function HomeRedirect() {
  const profile = useActiveProfile();
  if (profile?.type === 'child' || profile?.type === 'toddler') {
    return <Navigate to="/me" replace />;
  }
  return <HomePage />;
}

function MeRoute() {
  const profile = useActiveProfile();
  if (!profile) return <HomePage />;
  return <MePage profile={profile} />;
}

function Placeholder({ name }: { name: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-warm text-primary">
      <div className="text-center">
        <h1 className="text-h1 font-bold tracking-tight">{name}</h1>
        <p className="mt-2 text-body text-secondary">Coming soon</p>
      </div>
    </main>
  );
}

export default function Router() {
  return (
    <Routes>
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
        <Route index element={<HomeRedirect />} />
        <Route path="/me" element={<MeRoute />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/food" element={<FoodPage />} />
        <Route path="/vehicles" element={<VehiclePage />} />
        <Route path="/family" element={<FamilyHub />} />
        <Route path="/house" element={<HousePage />} />
        <Route path="/finance" element={<FinancePage />} />
        <Route path="/pets" element={<PetsPage />} />
        <Route path="/ev" element={<Placeholder name="EV" />} />
        <Route path="/board" element={<BoardPage />} />
        <Route path="/contacts" element={<ContactsPage />} />
        <Route
          path="*"
          element={
            <main className="flex min-h-screen items-center justify-center bg-warm text-primary">
              <p className="text-body text-secondary">Page not found</p>
            </main>
          }
        />
      </Route>
    </Routes>
  );
}
