import { Route, Routes } from 'react-router-dom';

export default function App() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 text-white">
      <Routes>
        <Route
          path="*"
          element={
            <div className="text-center">
              <h1 className="text-6xl font-bold tracking-tight">Nestor</h1>
              <p className="mt-4 text-lg text-gray-400">Your family&#39;s home hub</p>
            </div>
          }
        />
      </Routes>
    </div>
  );
}
