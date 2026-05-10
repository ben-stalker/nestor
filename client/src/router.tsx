import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import AppShell from './core/AppShell';

const UIGallery = lazy(() => import('./shared/ui/__gallery__'));

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
        <Route
          path="*"
          element={
            <main className="flex min-h-screen items-center justify-center bg-warm text-primary">
              <div className="text-center">
                <h1 className="text-display font-bold tracking-tight">Nestor</h1>
                <p className="mt-4 text-body text-secondary">Your family&#39;s home hub</p>
              </div>
            </main>
          }
        />
      </Route>
    </Routes>
  );
}
