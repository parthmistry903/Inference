import { useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, ChevronLeft, ChevronRight, XCircle } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { BentoCard } from '../ui/BentoCard';
import { Button } from '../ui/Button';
import { ProgressBar } from '../ui/ProgressBar';
import { ScorePill, StatusBadge } from '../ui/Badge';
import { api, getApiErrorMessage } from '../../services/api';
import { useToast } from '../ui/Toast';
import { cn } from '../../utils/cn';
import type { PaginationMeta, Resume } from '../../types';

interface ResumeTableProps {
  resumes: Resume[];
  meta?: PaginationMeta;
  isLoading: boolean;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (limit: number) => void;
  onOpenResume: (resume: Resume) => void;
}

export function ResumeTable({ resumes, meta, isLoading, page, limit, onPageChange, onPageSizeChange, onOpenResume }: ResumeTableProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Resume['hrStatus'] }) => api.put<Resume>(`/resumes/${id}/status`, { hrStatus: status }),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: ['resumes'] }),
    onError: (error) => toast(getApiErrorMessage(error), 'error'),
  });
  
  const bulkMutation = useMutation({
    mutationFn: (status: Resume['hrStatus']) => api.patch<{ updated: number }>('/resumes/bulk-status', { resumeIds: Array.from(selected), hrStatus: status }),
    onSuccess: async () => {
      setSelected(new Set());
      await queryClient.invalidateQueries({ queryKey: ['resumes'] });
      toast('Bulk update complete', 'success');
    },
    onError: (error) => toast(getApiErrorMessage(error), 'error'),
  });

  if (isLoading) {
    return <div className="h-[600px] animate-pulse rounded-3xl glass-card bg-white/5 border border-white/5" />;
  }

  const total = meta?.total ?? resumes.length;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 bg-white/5 text-secondary text-xs uppercase tracking-wider font-semibold">
              <th className="px-6 py-4 font-semibold w-12">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-[#2A2420] bg-[#131110] accent-[#3A7A72] cursor-pointer transition-all"
                  checked={resumes.length > 0 && resumes.every((resume) => selected.has(resume._id))}
                  onChange={(event) => setSelected(current => {
                    const next = new Set(current);
                    if (event.target.checked) resumes.forEach(r => next.add(r._id));
                    else resumes.forEach(r => next.delete(r._id));
                    return next;
                  })}
                />
              </th>
              <th className="px-6 py-4">#</th>
              <th className="px-6 py-4">Candidate</th>
              <th className="px-6 py-4">Score</th>
              <th className="px-6 py-4">Skills Match</th>
              <th className="px-6 py-4">Experience</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {resumes.map((resume) => {
              const skillsScore = resume.scoreBreakdown?.skillsScore ?? 0;
              const isSelected = selected.has(resume._id);
              
              return (
                <tr
                  key={resume._id}
                  className={cn(
                    "group cursor-pointer transition-colors duration-200",
                    isSelected ? "bg-[#3A7A72]/10" : "hover:bg-white/5"
                  )}
                  onClick={() => onOpenResume(resume)}
                >
                  <td 
                    className="px-6 py-4" 
                    onClick={(event) => {
                      event.stopPropagation();
                      setSelected((current) => {
                        const next = new Set(current);
                        if (next.has(resume._id)) next.delete(resume._id);
                        else next.add(resume._id);
                        return next;
                      });
                    }}
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-[#2A2420] bg-[#131110] accent-[#3A7A72] cursor-pointer transition-all"
                      checked={isSelected}
                      readOnly
                    />
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-muted">{resume.rank ?? '-'}</td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-primary">{resume.extractedData?.candidateName ?? 'Unknown Candidate'}</p>
                    <p className="text-xs text-muted mt-0.5">{resume.extractedData?.email ?? 'No email'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <ScorePill score={resume.scoreBreakdown?.totalScore ?? 0} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="w-28 flex flex-col gap-1.5">
                      <p className="font-mono text-xs font-semibold text-secondary">{skillsScore}/40</p>
                      <ProgressBar value={(skillsScore / 40) * 100} />
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs font-medium text-secondary">{resume.extractedData?.totalExperienceYears ?? 0} yrs</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={resume.hrStatus} />
                  </td>
                  <td className="px-6 py-4 text-right" onClick={(event) => event.stopPropagation()}>
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-verdigris/10 text-verdigris hover:bg-verdigris/20 transition-colors"
                        title="Shortlist"
                        onClick={() => statusMutation.mutate({ id: resume._id, status: 'shortlisted' })}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </button>
                      <button
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E85C5C]/10 text-[#E85C5C] hover:bg-[#E85C5C]/20 transition-colors"
                        title="Reject"
                        onClick={() => statusMutation.mutate({ id: resume._id, status: 'rejected' })}
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 bg-white/5 px-6 py-4">
        <span className="text-sm font-medium text-secondary">
          Showing <span className="text-primary font-semibold">{from}-{to}</span> of <span className="text-primary font-semibold">{total}</span>
        </span>
        <div className="flex items-center gap-3">
          <select 
            className="h-9 rounded-xl glass-input px-3 py-0 text-sm font-medium text-primary outline-none focus:ring-2 focus:ring-[#3A7A72]" 
            value={limit} 
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
          >
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
          </select>
          <div className="flex gap-1">
            <Button variant="glass" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)} className="h-9 w-9 p-0">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="glass" size="sm" disabled={page >= (meta?.totalPages ?? 1)} onClick={() => onPageChange(page + 1)} className="h-9 w-9 p-0">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {selected.size > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 50, x: '-50%' }}
              animate={{ opacity: 1, y: 0, x: '-50%' }}
              exit={{ opacity: 0, y: 50, x: '-50%' }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="fixed bottom-8 left-1/2 z-[100] flex items-center gap-4 rounded-full glass-card border border-[#3A7A72]/30 bg-[#3A7A72]/10 px-6 py-3 shadow-[0_8px_32px_rgba(58,122,114,0.2)] backdrop-blur-xl"
            >
              <span className="text-sm font-bold text-[#EDEAE5] tracking-wide uppercase">{selected.size} selected</span>
              <div className="h-4 w-px bg-[#EDEAE5]/20 mx-1" />
              <Button size="sm" variant="success" onClick={() => bulkMutation.mutate('shortlisted')} className="shadow-none">Shortlist All</Button>
              <Button size="sm" variant="danger" onClick={() => bulkMutation.mutate('rejected')} className="shadow-none">Reject All</Button>
              <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())} className="text-secondary hover:text-primary">Clear</Button>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
