import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { Sidebar } from '../ui/Sidebar';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { useAuth } from '../../hooks/useAuth';

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center surface-dots">
        <div className="flex flex-col items-center gap-4">
          <LoadingSpinner size="lg" />
          <p className="font-sans text-sm font-bold uppercase tracking-widest text-[#928D88]">Loading…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
        <div className="min-h-screen bg-[#0C0B09]">
      <Sidebar />
      <main className="min-h-screen bg-[#0C0B09] md:ml-64">
        <div className="mx-auto w-full max-w-[1500px] px-5 pb-10 pt-20 md:p-8 xl:p-10">
          {children}
        </div>
      </main>
    </div>
  );
}
