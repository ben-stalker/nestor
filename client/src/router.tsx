import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import AppShell from './core/AppShell';
import HomePage from './features/home';
import CalendarPage from './calendar';
import FoodPage from './food';

const UIGallery = lazy(() => import('./shared/ui/__gallery__'));

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
        <Route index element={<HomePage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/food" element={<FoodPage />} />
        <Route path="/vehicles" element={<Placeholder name="Travel" />} />
        <Route path="/family" element={<Placeholder name="Family" />} />
        <Route path="/house" element={<Placeholder name="House" />} />
        <Route path="/finance" element={<Placeholder name="Finance" />} />
        <Route path="/pets" element={<Placeholder name="Pets" />} />
        <Route path="/ev" element={<Placeholder name="EV" />} />
        <Route path="/board" element={<Placeholder name="Board" />} />
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
