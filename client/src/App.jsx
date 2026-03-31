import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { getMe } from '@/lib/api';
import ErrorBoundary from '@/components/ErrorBoundary';
import Home from '@/pages/Home';
import Dashboard from '@/pages/Dashboard';
import Builder from '@/pages/Builder';
import Analyze from '@/pages/Analyze';
import Updater from '@/pages/Updater';
import ATSChecker from '@/pages/ATSChecker';

// Protected route wrapper — redirects to home if not authenticated
function ProtectedRoute({ children }) {
  const [status, setStatus] = useState('loading'); // loading | authenticated | unauthenticated

  useEffect(() => {
    getMe()
      .then(() => setStatus('authenticated'))
      .catch(() => setStatus('unauthenticated'));
  }, []);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
        <div className="animate-spin h-8 w-8 border-2 border-white border-t-transparent rounded-full" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/" replace />;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/builder/:id"
          element={
            <ProtectedRoute>
              <ErrorBoundary>
                <Builder />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />
        <Route
          path="/analyze/:id"
          element={
            <ProtectedRoute>
              <ErrorBoundary>
                <Analyze />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />
        <Route
          path="/updater"
          element={
            <ProtectedRoute>
              <Updater />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ats-checker"
          element={
            <ProtectedRoute>
              <ErrorBoundary>
                <ATSChecker />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />
        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}

export default App;
