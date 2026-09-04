import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { BentoCard } from './components/ui/BentoCard';
import { Button } from './components/ui/Button';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { ToastProvider } from './components/ui/Toast';
import { AuthGuard } from './components/auth/AuthGuard';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import JobsPage from './pages/JobsPage';
import JobDetailPage from './pages/JobDetailPage';
import UploadPage from './pages/UploadPage';
import ResultsPage from './pages/ResultsPage';
import { queryClient } from './services/queryClient';
import { AnonymousPageAnalytics } from './components/AnonymousPageAnalytics';
/* DEMO-ONLY:START */
import { DemoRibbon } from './demo/DemoUI';
/* DEMO-ONLY:END */

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <BrowserRouter>
          <AnonymousPageAnalytics />
          {/* DEMO-ONLY:START */}
          <DemoRibbon />
          {/* DEMO-ONLY:END */}
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/dashboard" element={<AuthGuard><DashboardPage /></AuthGuard>} />
              <Route path="/jobs" element={<AuthGuard><JobsPage /></AuthGuard>} />
              <Route path="/jobs/:jobId" element={<AuthGuard><JobDetailPage /></AuthGuard>} />
              <Route path="/jobs/:jobId/upload" element={<AuthGuard><UploadPage /></AuthGuard>} />
              <Route path="/results/:batchId" element={<AuthGuard><ResultsPage /></AuthGuard>} />
              <Route
                path="*"
                element={
                  <div className="flex min-h-screen items-center justify-center p-6 bg-obsidian bg-dots-grid">
                    <BentoCard glow className="max-w-md p-10 text-center flex flex-col items-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E85C5C]/10 border border-[#E85C5C]/20 mb-6">
                        <span className="text-xl font-bold text-[#E85C5C]">!</span>
                      </div>
                      <h1 className="mb-4 font-display text-[5rem] font-black leading-none text-primary tracking-tighter">
                        404
                      </h1>
                      <p className="mb-8 font-medium text-secondary text-lg">
                        The page you are looking for does not exist or has been moved.
                      </p>
                      <Button size="lg" onClick={() => { window.location.href = '/dashboard'; }}>
                        Return to Dashboard
                      </Button>
                    </BentoCard>
                  </div>
                }
              />
            </Routes>
          </ErrorBoundary>
        </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
}
