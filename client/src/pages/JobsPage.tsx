import { useState } from 'react';
import { Briefcase, Plus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { JobCard } from '../components/jobs/JobCard';
import { JobForm } from '../components/jobs/JobForm';
import { Button } from '../components/ui/Button';
import { api } from '../services/api';
import type { Job } from '../types';

export default function JobsPage() {
  const [jobFormOpen, setJobFormOpen] = useState(false);
  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => api.get<Job[]>('/jobs?limit=100'),
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="max-w-6xl mx-auto pb-12"
    >
      {}
      <div className="mb-10 pt-4 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <h1 className="font-display text-[38px] font-normal tracking-tight text-primary leading-none mb-3">
            Jobs Workspace
          </h1>
          <p className="font-medium text-secondary text-lg">
            Manage postings, configure AI criteria, and screen candidates.
          </p>
        </div>
        <Button 
          size="lg" 
          onClick={() => setJobFormOpen(true)} 
          leftIcon={<Plus className="h-5 w-5" />}
        >
          New Job
        </Button>
      </div>

      {}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-[260px] animate-pulse rounded-3xl glass-card bg-white/5 border border-white/5" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
                <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card rounded-3xl p-16 text-center flex flex-col items-center justify-center min-h-[400px]"
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-b from-white/10 to-white/5 border border-white/10 shadow-[0_8px_32px_rgba(212,175,55,0.15)] mb-6">
            <Briefcase className="h-10 w-10 text-[#3A7A72]" />
          </div>
          <h2 className="font-display text-2xl font-bold text-primary tracking-tight">No job postings yet</h2>
          <p className="mt-3 max-w-md font-medium text-secondary mx-auto">
            Create your first job posting to start configuring your AI screening criteria.
          </p>
          <Button className="mt-8" size="lg" onClick={() => setJobFormOpen(true)}>
            Create First Job
          </Button>
        </motion.div>
      ) : (
        <motion.div layout className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {jobs.map((job) => (
              <motion.div
                layoutId={`job-${job._id}`}
                key={job._id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              >
                <JobCard job={job} />
              </motion.div>
            ))}
          </AnimatePresence>

          {}
          <motion.button
            layout
            type="button"
            onClick={() => setJobFormOpen(true)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="group flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/20 bg-white/5 p-6 h-[260px] transition-colors hover:bg-white/10 hover:border-[#3A7A72]/50 focus:outline-none focus:ring-2 focus:ring-[#3A7A72]"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/5 border border-white/10 group-hover:bg-[#3A7A72] transition-colors duration-300">
              <Plus className="h-6 w-6 text-muted group-hover:text-obsidian transition-colors" />
            </div>
            <p className="mt-4 font-semibold text-secondary group-hover:text-[#3A7A72] transition-colors tracking-wide">
              Create New Job
            </p>
          </motion.button>
        </motion.div>
      )}

      <JobForm open={jobFormOpen} onClose={() => setJobFormOpen(false)} />
    </motion.div>
  );
}
