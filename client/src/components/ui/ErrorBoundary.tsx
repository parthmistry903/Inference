import React from 'react';
import { Button } from './Button';


interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { hasError: false, message: '' };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error.message };
  }

  public render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="flex min-h-screen items-center justify-center p-6 surface-dots">
        <div className="max-w-md rounded-2xl border border-[#2A2420] bg-[#131110] p-8 text-center shadow-2xl">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#2A2420] bg-[#1B1916] text-[#E85C5C]">
            <span className="font-mono text-2xl font-bold">!</span>
          </div>
          <h1 className="font-display text-2xl font-medium text-[#EDEAE5]">Something went wrong</h1>
          <p className="mt-3 font-sans text-sm font-medium text-[#928D88]">
            {import.meta.env.DEV ? this.state.message : 'Inference hit an unexpected error.'}
          </p>
          <Button className="mt-6" onClick={() => window.location.reload()}>
            Reload Page
          </Button>
        </div>
      </div>
    );
  }
}
