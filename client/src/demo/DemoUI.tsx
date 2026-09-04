/**
 * DEMO-ONLY · The visible parts of demo mode.
 *
 * Three pieces, all of them optional dressing over an app that already works:
 *   • DemoRibbon      — persistent corner pill with a data reset
 *   • DemoNotice      — inline callout above any form the demo refuses
 *   • DemoCredentials — sign-in card with a one-click fill
 */

import { useState } from 'react';
import { FlaskConical, RotateCcw, Copy, Check } from 'lucide-react';
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

interface DemoCredentialsProps {
  onFill: (email: string, password: string) => void;
}

export function DemoCredentials({ onFill }: DemoCredentialsProps) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${DEMO_CREDENTIALS.email} / ${DEMO_CREDENTIALS.password}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard blocked — the credentials are on screen anyway.
    }
  };

  return (
    <div className="mb-8 rounded-2xl border border-[#2A2420] bg-[#171512] p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[#B07A3E]">
          <FlaskConical className="h-3.5 w-3.5" />
          Public demo
        </p>
        <button
          type="button"
          onClick={copy}
          className="flex items-center gap-1.5 text-[11px] font-semibold text-[#635E59] transition-colors hover:text-[#EDEAE5]"
        >
          {copied ? <Check className="h-3 w-3 text-[#3A7A72]" /> : <Copy className="h-3 w-3" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      <dl className="space-y-1.5 font-mono text-[13px]">
        <div className="flex items-center justify-between gap-4">
          <dt className="text-[#635E59]">email</dt>
          <dd className="truncate text-[#EDEAE5]">{DEMO_CREDENTIALS.email}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-[#635E59]">password</dt>
          <dd className="text-[#EDEAE5]">{DEMO_CREDENTIALS.password}</dd>
        </div>
      </dl>

      <button
        type="button"
        onClick={() => onFill(DEMO_CREDENTIALS.email, DEMO_CREDENTIALS.password)}
        className="mt-4 w-full rounded-xl border border-[#2A2420] bg-[#0C0B09] py-2.5 text-[12px] font-bold uppercase tracking-widest text-[#928D88] transition-colors hover:border-[#B07A3E]/40 hover:text-[#EDEAE5]"
      >
        Fill credentials
      </button>

      <p className="mt-4 text-[12px] leading-relaxed text-[#635E59]">
        Runs entirely in your browser against a seeded dataset — no backend, no API keys. Screening,
        decisions and CSV export are live; uploads and record creation are switched off.
      </p>
    </div>
  );
}
