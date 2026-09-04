import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Trash2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { StatusBadge } from '../ui/Badge';
import { ProgressBar } from '../ui/ProgressBar';
import { BentoCard } from '../ui/BentoCard';
import { Button } from '../ui/Button';
import { api } from '../../services/api';
import type { Batch } from '../../types';

interface BatchCardProps {
  batch: Batch;
  index: number;
}

const formatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export function BatchCard({ batch, index }: BatchCardProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const completed = batch.status === 'completed' || batch.status === 'partial';
  const progress = batch.totalResumes > 0
    ? Math.round(((batch.processedResumes + batch.failedResumes) / batch.totalResumes) * 100)
    : 0;

  const deleteMutation = useMutation({
    mutationFn: () => api.delete<void>(`/batches/${batch._id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-recent-batches'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      setDeleteConfirm(false);
    },
  });

  return (
    <>
      <BentoCard glow className="p-5 flex flex-col group">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-display text-lg font-bold text-primary">Batch #{index + 1}</h3>
            <p className="mt-0.5 text-[13px] font-medium text-secondary">
              {formatter.format(new Date(batch.createdAt))}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={batch.status} />
            <button
              onClick={(e) => { e.stopPropagation(); setDeleteConfirm(true); }}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/5 bg-white/5 text-muted hover:border-[#E85C5C]/50 hover:bg-[#E85C5C]/10 hover:text-[#E85C5C] transition-colors"
              title="Delete batch"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div
          className={completed ? 'mt-auto cursor-pointer' : 'mt-auto'}
          role={completed ? 'button' : undefined}
          tabIndex={completed ? 0 : undefined}
          onClick={() => completed && navigate(`/results/${batch._id}`)}
          onKeyDown={(e) => completed && e.key === 'Enter' && navigate(`/results/${batch._id}`)}
        >
          {completed ? (
            <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/5 border border-white/5 group-hover:bg-white/10 transition-colors">
              <p className="font-medium text-sm text-secondary">
                <span className="text-primary font-bold">{batch.processedResumes}</span> screened
                {batch.failedResumes > 0 && (
                  <span className="text-[#E85C5C] ml-2 font-semibold">· {batch.failedResumes} failed</span>
                )}
              </p>
              <span className="flex items-center gap-2 text-sm font-semibold text-[#3A7A72] group-hover:text-[#5BA096] transition-colors">
                View Results <ArrowRight className="h-4 w-4" />
              </span>
            </div>
          ) : batch.status === 'processing' ? (
            <div className="space-y-3 bg-white/5 p-4 rounded-xl border border-white/5">
              <ProgressBar value={progress} animated />
              <p className="text-xs font-semibold text-secondary flex justify-between">
                <span>Processing candidates</span>
                <span>{batch.processedResumes + batch.failedResumes} / {batch.totalResumes}</span>
              </p>
            </div>
          ) : (
            <p className="text-sm font-medium text-muted p-3 bg-white/5 rounded-xl border border-white/5 text-center">
              Queued — processing starts shortly…
            </p>
          )}
        </div>
      </BentoCard>

      {}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm rounded-3xl glass-card p-8 text-center border border-white/10">
            <h3 className="font-display text-xl font-bold text-primary">Delete Batch #{index + 1}?</h3>
            <p className="mt-2 text-sm text-secondary">
              This will permanently delete this batch and all <span className="text-primary font-bold">{batch.totalResumes}</span> resumes inside it. This cannot be undone.
            </p>
            <div className="mt-8 flex gap-3">
              <Button
                variant="glass"
                className="flex-1"
                onClick={() => setDeleteConfirm(false)}
                disabled={deleteMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
                isLoading={deleteMutation.isPending}
              >
                Yes, Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
