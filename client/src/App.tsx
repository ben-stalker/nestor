import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';

const UIGallery = lazy(() => import('./shared/ui/__gallery__'));

export default function App() {
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
      <Route
        path="*"
        element={
          <div className="flex min-h-screen items-center justify-center bg-gray-950 text-white">
            <div className="text-center">
              <h1 className="text-6xl font-bold tracking-tight">Nestor</h1>
              <p className="mt-4 text-lg text-gray-400">Your family&#39;s home hub</p>
            </div>
          </div>
        }
      />
    </Routes>
  );
}
