import { useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '../ui/Button';
import { api } from '../../services/api';
import type { Batch } from '../../types';

interface BatchProgressProps {
  batchId: string;
}

function elapsedLabel(startedAt: number | null): string {
  if (!startedAt) return '0m 0s';
  const seconds = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

export function BatchProgress({ batchId }: BatchProgressProps) {
  const navigate = useNavigate();
  const { data: batch } = useQuery({
    queryKey: ['batch-progress', batchId],
    queryFn: () => api.get<Batch>(`/batches/${batchId}`),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === 'completed' || status === 'partial' ? false : 2000;
    },
  });
  const progress = batch
    ? {
        total: batch.totalResumes,
        processed: batch.processedResumes,
        failed: batch.failedResumes,
        status: batch.status,
        startedAt: batch.startedAt ? new Date(batch.startedAt).getTime() : null,
      }
    : null;
  const isCompleted = progress?.status === 'completed' || progress?.status === 'partial';
  const percentage = progress && progress.total > 0 ? Math.round(((progress.processed + progress.failed) / progress.total) * 100) : 0;
  const [elapsed, setElapsed] = useState('0m 0s');
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - percentage / 100);

  useEffect(() => {
    const timer = window.setInterval(() => setElapsed(elapsedLabel(progress?.startedAt ?? null)), 1000);
    return () => window.clearInterval(timer);
  }, [progress?.startedAt]);

  return (
    <div
      className="relative mx-auto max-w-[520px] rounded-2xl border border-[#2A2420] bg-[#131110] p-10 text-center shadow-2xl"
      style={{ borderColor: isCompleted ? '#3A7A72' : '#2A2420' }}
    >
      {}
      {!isCompleted && (
        <span className="absolute left-5 top-5 flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#B07A3E] opacity-75" />
          <span className="relative h-3 w-3 rounded-full bg-[#B07A3E]" />
        </span>
      )}

      {}
      <div className="mb-6 flex flex-col items-center gap-3">
        {isCompleted && (
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#3A7A72] shadow-lg">
            <CheckCircle2 className="h-8 w-8 animate-fade-in text-[#131110]" />
          </div>
        )}
        <h2 className="font-display text-2xl font-black text-[#EDEAE5]">
          {isCompleted ? 'Screening complete!' : 'AI is screening your resumes'}
        </h2>
      </div>

      {}
      <div className="relative mx-auto h-44 w-44">
        <svg viewBox="0 0 160 160" className="-rotate-90 overflow-visible">
          {}
          <circle cx="80" cy="80" r={radius} stroke="#1B1916" strokeWidth="10" fill="none" />
          {}
          <circle
            cx="80"
            cy="80"
            r={radius}
            stroke={isCompleted ? '#3A7A72' : '#B07A3E'}
            strokeWidth="10"
            fill="none"
            strokeLinecap="butt"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className="transition-[stroke-dashoffset] duration-700"
            style={{ filter: isCompleted ? 'drop-shadow(0px 0px 8px rgba(58,122,114,0.4))' : 'drop-shadow(0px 0px 8px rgba(176,122,62,0.4))' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-[2rem] font-black text-[#EDEAE5] leading-none">{percentage}%</span>
          <span className="mt-1 font-sans text-xs font-bold uppercase tracking-widest text-[#928D88]">done</span>
        </div>
      </div>

      {}
      <div className="mt-6 space-y-1">
        <p className="font-sans text-sm font-bold text-[#928D88]">
          {progress?.processed ?? 0} / {progress?.total ?? 0} resumes processed
        </p>
        {(progress?.failed ?? 0) > 0 && (
          <p className="font-sans text-sm font-bold text-[#FFB3C6]">
            {progress?.failed ?? 0} failed
          </p>
        )}
        <p className="font-sans text-xs text-[#928D88]">Elapsed: {elapsed}</p>
      </div>

      {isCompleted && (
        <div className="mt-8">
          <Button onClick={() => navigate(`/results/${batchId}`)}>
            View Results →
          </Button>
        </div>
      )}
    </div>
  );
}
