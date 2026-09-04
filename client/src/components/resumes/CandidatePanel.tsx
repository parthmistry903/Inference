import { useEffect, useMemo, useState } from 'react';
import { X, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/Button';
import { ScorePill } from '../ui/Badge';
import { TextArea } from '../ui/Input';
import { ProgressBar } from '../ui/ProgressBar';
import { api, getApiErrorMessage } from '../../services/api';
import { useToast } from '../ui/Toast';
import { cn } from '../../utils/cn';
import type { Resume } from '../../types';

interface CandidatePanelProps {
  resume: Resume | null;
  open: boolean;
  onClose: () => void;
}

const decisions: Resume['hrStatus'][] = ['pending', 'shortlisted', 'rejected', 'review'];
const decisionLabels: Record<Resume['hrStatus'], string> = {
  pending:     'Pending',
  shortlisted: 'Shortlisted',
  rejected:    'Rejected',
  review:      'In Review',
};

const decisionTheme: Record<Resume['hrStatus'], { color: string, bg: string, border: string }> = {
  pending:     { color: 'text-primary', bg: 'bg-transparent', border: 'border-transparent' },
  shortlisted: { color: 'text-[#B07A3E]', bg: 'bg-[#B07A3E]/15', border: 'border-[#B07A3E]/30' },
  rejected:    { color: 'text-[#E85C5C]', bg: 'bg-transparent', border: 'border-transparent' },
  review:      { color: 'text-primary', bg: 'bg-transparent', border: 'border-transparent' },
};

export function CandidatePanel({ resume, open, onClose }: CandidatePanelProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [note, setNote] = useState('');
  const [dirty, setDirty] = useState(false);

  const [optimisticStatus, setOptimisticStatus] = useState<Resume['hrStatus'] | null>(null);

  useEffect(() => {
    setNote(resume?.hrNote ?? '');
    setDirty(false);
    setOptimisticStatus(null);
  }, [resume?._id, resume?.hrNote, resume?.hrStatus]);

  const mutation = useMutation({
    mutationFn: (payload: { hrStatus: Resume['hrStatus']; hrNote?: string }) => {
      setOptimisticStatus(payload.hrStatus);
      return api.put<Resume>(`/resumes/${resume?._id}/status`, payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['resumes'] });
      toast('Candidate updated', 'success');
      setDirty(false);
    },
    onError: (error) => {
      setOptimisticStatus(null);
      toast(getApiErrorMessage(error), 'error');
    },
  });

  const retryMutation = useMutation({
    mutationFn: () => api.patch<Resume>(`/resumes/${resume?._id}/retry`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['resumes'] });
      toast('Re-queued for AI analysis. Check back in a moment.', 'success');
    },
    onError: (error) => {
      toast(getApiErrorMessage(error), 'error');
    },
  });

  const breakdown = useMemo(() => {
    if (!resume?.scoreBreakdown) return [];
    return [
      { label: 'Skills',     value: resume.scoreBreakdown.skillsScore,     max: 40 },
      { label: 'Experience', value: resume.scoreBreakdown.experienceScore, max: 30 },
      { label: 'Education',  value: resume.scoreBreakdown.educationScore,  max: 20 },
      { label: 'Fit',        value: resume.scoreBreakdown.fitScore,        max: 10 },
    ];
  }, [resume?.scoreBreakdown]);

  if (!resume) return null;
  const data = resume.extractedData;
  const score = resume.scoreBreakdown?.totalScore ?? 0;
  const aiSummary = data?.aiSummary?.trim();

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" 
            onClick={onClose} 
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full md:w-[480px] glass-card border-l border-white/10 overflow-hidden flex flex-col"
          >
            <div className="flex-1 overflow-y-auto scrollbar-thin p-6 md:p-8">
              {}
              <div className="flex items-start justify-between gap-4 mb-8">
                <div>
                  <h2 className="font-display text-2xl font-bold text-primary tracking-tight">
                    {data?.candidateName ?? 'Unknown Candidate'}
                  </h2>
                  <div className="mt-2 flex flex-col sm:flex-row gap-1 sm:gap-4 text-sm font-medium text-secondary">
                    <span>{data?.email || 'No email'}</span>
                    <span className="hidden sm:inline text-white/20">•</span>
                    <span>{data?.phone || 'No phone'}</span>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white/5 border border-white/10 text-muted hover:bg-white/10 hover:text-primary transition-colors"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {}
              <div className="flex flex-col items-center justify-center p-6 bg-white/5 border border-white/5 rounded-3xl mb-8">
                <ScorePill score={score} className="px-6 py-2 text-2xl" />
                <p className="mt-3 text-xs font-semibold text-secondary uppercase tracking-widest">Overall Match</p>
              </div>

              {}
              <div className="grid grid-cols-2 gap-4 mb-8">
                {breakdown.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-white/5 bg-white/5 p-4"
                  >
                    <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">{item.label}</p>
                    <p className="font-display text-2xl font-bold text-primary mb-3">
                      {item.value}<span className="text-sm font-medium text-muted">/{item.max}</span>
                    </p>
                    <ProgressBar value={(item.value / item.max) * 100} colorized className="h-1" />
                  </div>
                ))}
              </div>

              {}
              <section className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                  <p className="label-caps">AI SUMMARY</p>
                </div>
                {aiSummary ? (
                  <div className="rounded-2xl border border-kinpaku/20 bg-kinpaku/5 p-5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-kinpaku/10 rounded-full blur-[40px] pointer-events-none" />
                    <p className="text-sm leading-relaxed text-secondary relative z-10">
                      {aiSummary}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center flex flex-col items-center">
                    <AlertCircle className="h-8 w-8 text-muted mb-3" />
                    <p className="text-sm font-medium text-secondary mb-4">No summary generated. AI processing may have skipped or failed on this step.</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      leftIcon={<RefreshCw className={`h-4 w-4 ${retryMutation.isPending ? 'animate-spin' : ''}`} />}
                      isLoading={retryMutation.isPending}
                      onClick={() => retryMutation.mutate()}
                    >
                      Retry AI Analysis
                    </Button>
                  </div>
                )}
              </section>

              {}
              {(data?.skills ?? []).length > 0 && (
                <section className="mb-8">
                  <p className="label-caps mb-3">SKILLS</p>
                  <div className="flex flex-wrap gap-2">
                    {(data?.skills ?? []).map((skill) => (
                      <span key={skill} className="rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-xs font-semibold text-secondary tracking-wide uppercase">
                        {skill}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              {}
              <section className="mb-8 rounded-2xl border border-white/5 bg-white/5 p-5">
                <p className="font-bold text-primary">{data?.totalExperienceYears ?? 0} years experience</p>
                {(data?.previousCompanies?.length ?? 0) > 0 && (
                  <p className="mt-2 text-sm text-secondary">{data?.previousCompanies?.join(', ')}</p>
                )}
              </section>

              {}
              <section className="mb-8">
                <p className="label-caps mb-3">HR DECISION</p>
                <div className="flex flex-wrap gap-3">
                  {decisions.map((decision) => {
                    const currentStatus = optimisticStatus ?? resume.hrStatus;
                    const isActive = currentStatus === decision;
                    const theme = decisionTheme[decision];
                    return (
                      <button
                        type="button"
                        key={decision}
                        className={cn(
                          'rounded-full border px-5 py-2 text-xs font-bold tracking-wide transition-all duration-200',
                          isActive
                            ? cn(theme.bg, theme.border, theme.color)
                            : 'border-transparent bg-transparent text-secondary hover:text-primary',
                        )}
                        onClick={() => mutation.mutate({ hrStatus: decision, hrNote: note })}
                      >
                        {decisionLabels[decision]}
                      </button>
                    );
                  })}
                </div>
              </section>

              {}
              <section className="mb-4">
                <p className="label-caps mb-3">PRIVATE NOTE</p>
                <TextArea
                  value={note}
                  onChange={(e) => { setNote(e.target.value); setDirty(true); }}
                  onBlur={() => { if (dirty) mutation.mutate({ hrStatus: resume.hrStatus, hrNote: note }); }}
                  placeholder="Add private decision notes…"
                  className="bg-white/5 border-white/10 focus:bg-white/10"
                />
                <p className="mt-2 text-[11px] font-medium text-muted">Only visible to you · auto-saved on blur</p>
                <AnimatePresence>
                  {dirty && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                      <Button className="mt-4 w-full" isLoading={mutation.isPending} onClick={() => mutation.mutate({ hrStatus: resume.hrStatus, hrNote: note })}>
                        Save Note
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </section>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
