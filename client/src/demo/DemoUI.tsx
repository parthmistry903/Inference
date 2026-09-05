/**
 * DEMO-ONLY · The visible parts of demo mode.
 *
 * Three pieces, all of them optional dressing over an app that already works:
 *   • DemoRibbon      — persistent corner pill with a data reset
 *   • DemoNotice      — inline callout above any form the demo refuses
 *   • DemoCredentials — one-line note above the pre-filled sign-in form
 */

import { useState } from 'react';
import { FlaskConical, RotateCcw } from 'lucide-react';
import { DEMO_CREDENTIALS } from './demoConfig';
import { resetDemo } from './store';

export function DemoRibbon() {
  const [busy, setBusy] = useState(false);

  const handleReset = () => {
    setBusy(true);
    resetDemo();
    window.setTimeout(() => window.location.reload(), 200);
  };

  return (
    <div className="fixed bottom-4 right-4 z-[60] flex items-center gap-2 rounded-full border border-[#2A2420] bg-[#131110]/90 px-3 py-2 shadow-xl backdrop-blur-md">
      <FlaskConical className="h-3.5 w-3.5 text-[#B07A3E]" />
      <span className="text-[11px] font-bold uppercase tracking-widest text-[#928D88]">Demo data</span>
      <span className="h-3 w-px bg-[#2A2420]" />
      <button
        type="button"
        onClick={handleReset}
        disabled={busy}
        title="Discard your changes and rebuild the sample dataset"
        className="flex items-center gap-1.5 text-[11px] font-semibold text-[#928D88] transition-colors hover:text-[#EDEAE5] disabled:opacity-50"
      >
        <RotateCcw className={`h-3 w-3 ${busy ? 'animate-spin' : ''}`} />
        Reset
      </button>
    </div>
  );
}

interface DemoNoticeProps {
  /** What this particular screen cannot do, and why. */
  children: React.ReactNode;
  className?: string;
}

export function DemoNotice({ children, className = '' }: DemoNoticeProps) {
  return (
    <div
      className={`flex items-start gap-3 rounded-2xl border border-[#B07A3E]/25 bg-[#B07A3E]/[0.07] p-4 ${className}`}
    >
      <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border border-[#B07A3E]/25 bg-[#B07A3E]/10">
        <FlaskConical className="h-3.5 w-3.5 text-[#B07A3E]" />
      </div>
      <div className="min-w-0 text-[13px] leading-relaxed text-[#928D88]">
        <p className="mb-0.5 text-[11px] font-bold uppercase tracking-widest text-[#B07A3E]">Demo mode</p>
        {children}
      </div>
    </div>
  );
}

/**
 * A single line above the sign-in form. The fields arrive pre-filled, so this
 * only has to say why, and show the credentials in case someone clears them.
 */
export function DemoCredentials() {
  return (
    <div className="mb-7 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-[#2A2420] bg-[#171512] px-4 py-3">
      <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#B07A3E]">
        <FlaskConical className="h-3.5 w-3.5" />
        Public demo
      </span>
      <span className="font-mono text-[12.5px] text-[#928D88]">
        {DEMO_CREDENTIALS.email} · {DEMO_CREDENTIALS.password}
      </span>
    </div>
  );
}
