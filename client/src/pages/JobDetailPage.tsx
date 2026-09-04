import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Briefcase, GraduationCap, Power, Trash2, Upload, AlertCircle } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { BentoCard } from '../components/ui/BentoCard';
import { StatusBadge } from '../components/ui/Badge';
import { BatchCard } from '../components/batch/BatchCard';
import { JobForm } from '../components/jobs/JobForm';
import { api } from '../services/api';
import type { Batch, Job } from '../types';

export default function JobDetailPage() {
  const { jobId = '' } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: () => api.delete<void>(`/jobs/${jobId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      navigate('/jobs');
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (newStatus: 'active' | 'closed') =>
      api.put<Job>(`/jobs/${jobId}`, { status: newStatus }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['jobs', jobId] }),
  });

  const { data: job, isLoading: jobLoading } = useQuery({
    queryKey: ['jobs', jobId],
    queryFn: () => api.get<Job>(`/jobs/${jobId}`),
    enabled: Boolean(jobId),
  });
  const { data: batches = [], isLoading: batchesLoading } = useQuery({
    queryKey: ['batches', { jobId }],
    queryFn: () => api.get<Batch[]>(`/batches?jobId=${jobId}&limit=100`),
    enabled: Boolean(jobId),
  });

  if (jobLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="h-64 animate-pulse rounded-3xl glass-card bg-white/5 border border-white/5" />
        <div className="grid gap-6 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-3xl glass-card bg-white/5 border border-white/5" />
          ))}
        </div>
      </div>
    );
  }
  if (!job) return <p className="font-medium text-center text-secondary py-12">Job not found.</p>;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-5xl mx-auto pb-12"
    >
      {}
      <BentoCard glow className="p-8 md:p-10 mb-10 overflow-visible relative z-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#3A7A72]/5 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 relative z-10">
          <div className="min-w-0 max-w-2xl flex-1">
            <div className="flex items-center gap-4 mb-4">
              <StatusBadge status={job.status} />
              <span className="text-xs font-semibold text-muted tracking-wide uppercase">
                {batches.length} Batch{batches.length !== 1 ? 'es' : ''}
              </span>
            </div>
            
            <h1 className="font-display text-[38px] font-normal text-primary tracking-tight leading-tight">
              {job.title}
            </h1>
            <p className="mt-4 text-lg text-secondary leading-relaxed font-medium max-w-xl">
              {job.description}
            </p>

            {job.requiredSkills.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {job.requiredSkills.map((skill) => (
                  <span key={skill} className="rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-xs font-semibold text-secondary tracking-wide uppercase shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                    {skill}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-8 flex flex-wrap gap-6 text-sm font-semibold text-secondary">
              <span className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#3A7A72]/10 text-[#3A7A72]">
                  <Briefcase className="h-4 w-4" />
                </div>
                {job.minExperienceYears} year{job.minExperienceYears !== 1 ? 's' : ''} req.
              </span>
              <span className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-verdigris/10 text-verdigris">
                  <GraduationCap className="h-4 w-4" />
                </div>
                {job.minEducation}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3 min-w-[200px]">
            <Button size="lg" onClick={() => navigate(`/jobs/${jobId}/upload`)} leftIcon={<Upload className="h-5 w-5" />}>
              Upload Resumes
            </Button>
            <Button variant="glass" onClick={() => setEditOpen(true)}>
              Edit Criteria
            </Button>
            <div className="h-px bg-white/5 my-2" />
            <Button
              variant="glass"
              onClick={() => toggleStatusMutation.mutate(job.status === 'active' ? 'closed' : 'active')}
              disabled={toggleStatusMutation.isPending}
              className={job.status === 'active' ? 'text-[#EDEAE5] hover:bg-white/5 border-white/10' : 'text-verdigris hover:bg-verdigris/10 border-verdigris/20'}
              leftIcon={<Power className="h-4 w-4" />}
            >
              {job.status === 'active' ? 'Close Job' : 'Reopen Job'}
            </Button>
            <Button
              variant="glass"
              onClick={() => setDeleteConfirm(true)}
              className="text-[#E85C5C] hover:bg-[#E85C5C]/10 border-[#E85C5C]/20"
              leftIcon={<Trash2 className="h-4 w-4" />}
            >
              Delete Job
            </Button>
          </div>
        </div>
      </BentoCard>

      {}
      <div>
        <div className="mb-6 flex items-end justify-between gap-4 px-2">
          <div>
            <h2 className="font-display text-[28px] font-normal text-primary tracking-tight">Screening Runs</h2>
            <p className="text-secondary font-medium mt-1">Upload batches of resumes to evaluate candidates.</p>
          </div>
        </div>

        {batchesLoading ? (
          <div className="grid gap-6 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-40 animate-pulse rounded-3xl glass-card bg-white/5 border border-white/5" />
            ))}
          </div>
        ) : batches.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card rounded-3xl p-16 text-center border border-white/5 border-dashed"
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-b from-white/10 to-white/5 border border-white/10 shadow-[0_8px_32px_rgba(74,139,130,0.15)] mb-6">
              <Upload className="h-8 w-8 text-verdigris" />
            </div>
            <h3 className="font-display text-2xl font-bold text-primary tracking-tight">No batches yet</h3>
            <p className="mt-2 text-secondary font-medium max-w-sm mx-auto">
              Upload resumes to begin AI screening for this role.
            </p>
            <Button size="lg" className="mt-8" onClick={() => navigate(`/jobs/${jobId}/upload`)} leftIcon={<Upload className="h-5 w-5" />}>
              Start First Batch
            </Button>
          </motion.div>
        ) : (
          <motion.div layout className="grid gap-6 md:grid-cols-2">
            <AnimatePresence>
              {batches.map((batch, index) => (
                <motion.div
                  layoutId={`batch-${batch._id}`}
                  key={batch._id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                >
                  <BatchCard batch={batch} index={index} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      <JobForm open={editOpen} onClose={() => setEditOpen(false)} job={job} />

      {}
      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-3xl glass-card p-8 border border-white/10 text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-[#E85C5C]" />
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#E85C5C]/10 mb-4">
                <AlertCircle className="h-6 w-6 text-[#E85C5C]" />
              </div>
              <h3 className="font-display text-2xl font-bold text-primary">Delete this job?</h3>
              <p className="mt-3 text-sm text-secondary leading-relaxed">
                This will permanently delete <strong className="text-primary">{job.title}</strong> and all its associated batches and screened resumes. This action cannot be undone.
              </p>
              <div className="mt-8 flex gap-4">
                <Button
                  variant="glass"
                  size="lg"
                  className="flex-1"
                  onClick={() => setDeleteConfirm(false)}
                  disabled={deleteMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  size="lg"
                  className="flex-1"
                  onClick={() => deleteMutation.mutate()}
                  disabled={deleteMutation.isPending}
                  isLoading={deleteMutation.isPending}
                >
                  Yes, Delete Job
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
