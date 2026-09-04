import { useMemo, useEffect, useState } from 'react';
import { ArrowRight, Briefcase, FolderKanban, TrendingUp, Upload, Users, Clock, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion, useAnimation } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { BentoCard } from '../components/ui/BentoCard';
import { StatusBadge } from '../components/ui/Badge';
import { ProgressBar } from '../components/ui/ProgressBar';
import { api } from '../services/api';
import type { Batch, Job, Resume } from '../types';

type RecentBatch = Batch & { jobTitle: string };
const dateFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

function AnimatedNumber({ value }: { value: number | string }) {
  const [display, setDisplay] = useState(0);
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  
  useEffect(() => {
    let startTime: number;
    const duration = 1500;
    
    const animate = (time: number) => {
      if (!startTime) startTime = time;
      const progress = Math.min((time - startTime) / duration, 1);
      
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setDisplay(numericValue * easeProgress);
      
      if (progress < 1) requestAnimationFrame(animate);
    };
    
    requestAnimationFrame(animate);
  }, [numericValue]);

  if (typeof value === 'string' && value.includes('%')) {
    return <>{Math.round(display)}%</>;
  }
  if (typeof value === 'string' && value.includes('h')) {
    return <>{display.toFixed(1)}<span className="text-muted text-lg ml-1">hrs</span></>;
  }
  return <>{Math.round(display)}</>;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => api.get<Job[]>('/jobs?limit=100'),
  });
  const jobIds = useMemo(() => jobs.map((j) => j._id).join(','), [jobs]);

  const { data: allBatches = [], isLoading: batchesLoading } = useQuery({
    queryKey: ['dashboard-all-batches', jobIds],
    enabled: jobs.length > 0,
    queryFn: async (): Promise<RecentBatch[]> => {
      const batchesByJob = await Promise.all(
        jobs.map(async (job) => {
          const batches = await api.get<Batch[]>(`/batches?jobId=${job._id}&limit=200`);
          return batches.map((batch) => ({ ...batch, jobTitle: job.title }));
        }),
      );
      return batchesByJob.flat().sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    },
  });

  
  const recentBatches = useMemo(() => allBatches.slice(0, 5), [allBatches]);

  const allBatchIds = useMemo(() => allBatches.map(b => b._id), [allBatches]);
  const { data: allResumes = [] } = useQuery({
    queryKey: ['dashboard-resumes', allBatchIds],
    enabled: allBatches.length > 0,
    queryFn: async (): Promise<Resume[]> => {
      const results = await Promise.all(
        allBatches.map(b => api.get<Resume[]>(`/resumes?batchId=${b._id}&limit=500`).catch(() => [] as Resume[]))
      );
      return results.flat();
    },
  });

  const stats = useMemo(() => {
    const now = Date.now();
    const msIn7Days = 7 * 24 * 60 * 60 * 1000;
    const periodStart = now - msIn7Days;       
    const prevPeriodStart = now - 2 * msIn7Days; 

    
    const activeJobs = jobs.filter(j => j.status === 'active');
    const newJobsThisWeek = activeJobs.filter(
      j => new Date(j.createdAt).getTime() >= periodStart
    ).length;
    const newJobsPrevWeek = activeJobs.filter(
      j => {
        const t = new Date(j.createdAt).getTime();
        return t >= prevPeriodStart && t < periodStart;
      }
    ).length;
    const jobsTrend = newJobsThisWeek - newJobsPrevWeek;

    
    const totalCands = jobs.reduce((sum, j) => sum + (j.totalCandidates ?? 0), 0);
    const screened7d = allResumes.filter(
      r => new Date(r.createdAt).getTime() >= periodStart
    ).length;
    const screenedPrev7d = allResumes.filter(
      r => {
        const t = new Date(r.createdAt).getTime();
        return t >= prevPeriodStart && t < periodStart;
      }
    ).length;
    const screenedTrend = screened7d - screenedPrev7d;

    
    const scoredResumes = allResumes.filter(r => r.scoreBreakdown?.totalScore !== undefined);
    const passedResumes = scoredResumes.filter(r => (r.scoreBreakdown?.totalScore ?? 0) >= 70);
    const passRate = scoredResumes.length > 0
      ? Math.round((passedResumes.length / scoredResumes.length) * 100)
      : 0;

    const scored7d = allResumes.filter(
      r => r.scoreBreakdown?.totalScore !== undefined && new Date(r.createdAt).getTime() >= periodStart
    );
    const passed7d = scored7d.filter(r => (r.scoreBreakdown?.totalScore ?? 0) >= 70);
    const passRate7d = scored7d.length > 0 ? Math.round((passed7d.length / scored7d.length) * 100) : null;

    const scoredPrev7d = allResumes.filter(
      r => {
        const t = new Date(r.createdAt).getTime();
        return r.scoreBreakdown?.totalScore !== undefined && t >= prevPeriodStart && t < periodStart;
      }
    );
    const passedPrev7d = scoredPrev7d.filter(r => (r.scoreBreakdown?.totalScore ?? 0) >= 70);
    const passRatePrev7d = scoredPrev7d.length > 0
      ? Math.round((passedPrev7d.length / scoredPrev7d.length) * 100)
      : null;
    const passRateTrend =
      passRate7d !== null && passRatePrev7d !== null ? passRate7d - passRatePrev7d : null;

    
    const totalMinSaved = totalCands * 5;
    const hoursTotal = totalMinSaved / 60;
    const hours7d = (screened7d * 5) / 60;
    const hoursPrev7d = (screenedPrev7d * 5) / 60;
    const hoursTrend = hours7d - hoursPrev7d;

    
    const fmtNum  = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `${n}` : null);
    const fmtPct  = (n: number | null) => n !== null ? (n > 0 ? `+${n}%` : n < 0 ? `${n}%` : null) : null;
    const fmtHrs  = (n: number) => {
      if (n === 0) return null;
      const abs = Math.abs(n);
      const sign = n > 0 ? '+' : '-';
      return abs >= 1 ? `${sign}${abs.toFixed(1)}h` : `${sign}${Math.round(abs * 60)}m`;
    };

    return [
      { label: 'Active Postings', value: activeJobs.length, trend: fmtNum(jobsTrend) },
      { label: 'Total Screened',  value: totalCands,         trend: fmtNum(screenedTrend) },
      { label: 'Avg Pass Rate',   value: `${passRate}%`,     trend: fmtPct(passRateTrend) },
      { label: 'Time Saved',      value: `${hoursTotal.toFixed(1)}h`, trend: fmtHrs(hoursTrend) },
    ];
  }, [jobs, allResumes]);

  const firstJob = jobs[0];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="max-w-6xl mx-auto pb-12"
    >
      {}
      <div className="mb-10 pt-4">
        <h1 className="font-display text-[38px] font-normal tracking-tight text-primary">
          Welcome back.
        </h1>
        <p className="mt-2 text-secondary font-medium text-lg">
          Here's what's happening with your hiring pipeline.
        </p>
      </div>

      {}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, i) => (
          <BentoCard key={stat.label} glow className="p-6 flex flex-col justify-end">
            <div className="flex flex-col">
              {isLoading ? (
                <div className="h-14 w-24 animate-pulse rounded-lg bg-white/5 mb-2" />
              ) : (
                <div className="flex items-baseline gap-2">
                  <h3 className="font-display text-[52px] font-normal text-primary leading-none tracking-tight">
                    <AnimatedNumber value={stat.value} />
                  </h3>
                  {stat.trend && (
                    <span className={`text-xs font-semibold flex items-center ${
                      stat.trend.startsWith('-') ? 'text-[#9A4545]' : 'text-[#B07A3E]'
                    }`}>
                      <span className="text-[12px] leading-none mr-0.5">
                        {stat.trend.startsWith('-') ? '↓' : '↑'}
                      </span>
                      {stat.trend.replace('+', '')}
                    </span>
                  )}
                </div>
              )}
              <p className="mt-3 label-caps">{stat.label}</p>
            </div>
          </BentoCard>
        ))}
      </div>

      {/* Quick action cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <BentoCard onClick={() => navigate('/jobs')} glow className="group p-6">
          <div className="flex items-center gap-5">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-white/5 border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] group-hover:scale-110 transition-transform duration-300">
              <FolderKanban className="h-6 w-6 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display text-lg font-bold text-primary">Manage job postings</p>
              <p className="text-sm text-secondary mt-0.5">Create roles and configure criteria.</p>
            </div>
            <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-kinpaku group-hover:text-obsidian transition-colors">
              <ArrowRight className="h-4 w-4" />
            </div>
          </div>
        </BentoCard>

        <BentoCard onClick={() => navigate(firstJob ? `/jobs/${firstJob._id}/upload` : '/jobs')} glow className="group p-6">
          <div className="flex items-center gap-5">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-white/5 border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] group-hover:scale-110 transition-transform duration-300">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display text-lg font-bold text-primary">Upload resumes</p>
              <p className="text-sm text-secondary mt-0.5">Drop PDFs directly into a batch.</p>
            </div>
            <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-verdigris group-hover:text-obsidian transition-colors">
              <ArrowRight className="h-4 w-4" />
            </div>
          </div>
        </BentoCard>
      </div>

      {}
      <BentoCard className="p-0 overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-bold text-primary tracking-tight">Recent Processing</h2>
            <p className="text-sm text-secondary mt-1">Latest screening runs across all active roles.</p>
          </div>
          <Button variant="ghost" onClick={() => navigate('/jobs')}>
            View All
          </Button>
        </div>

        {isLoading || batchesLoading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-white/5 border border-white/5" />
            ))}
          </div>
        ) : recentBatches.length === 0 ? (
          <div className="p-12 text-center">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-white/5 mb-4">
              <AlertCircle className="h-8 w-8 text-muted" />
            </div>
            <h3 className="font-display text-lg font-bold text-primary">No batches yet</h3>
            <p className="mt-2 text-sm text-secondary max-w-sm mx-auto">
              Create a job and upload some resumes. The magic happens here.
            </p>
            <Button className="mt-6" variant="glass" onClick={() => navigate('/jobs')}>
              Get Started
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {recentBatches.map((batch) => {
              const completed = batch.status === 'completed' || batch.status === 'partial';
              const progress = batch.totalResumes > 0
                ? Math.round(((batch.processedResumes + batch.failedResumes) / batch.totalResumes) * 100)
                : 0;

              return (
                <button
                  key={batch._id}
                  type="button"
                  onClick={() => navigate(completed ? `/results/${batch._id}` : `/jobs/${batch.jobId}`)}
                  className="w-full group p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors text-left"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <StatusBadge status={batch.status} />
                      <span className="font-medium text-primary truncate">{batch.jobTitle}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted font-medium">
                      <span>{dateFormatter.format(new Date(batch.createdAt))}</span>
                      <span className="w-1 h-1 rounded-full bg-white/20" />
                      <span>{batch.processedResumes} screened</span>
                      {batch.failedResumes > 0 && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-white/20" />
                          <span className="text-[#E85C5C]">{batch.failedResumes} failed</span>
                        </>
                      )}
                    </div>
                    {!completed && (
                      <div className="mt-4 max-w-md">
                        <ProgressBar value={progress} animated={batch.status === 'processing'} colorized />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 sm:flex-col sm:items-end">
                    <span className="font-mono text-sm font-bold text-secondary">
                      {batch.processedResumes + batch.failedResumes} <span className="text-muted">/ {batch.totalResumes}</span>
                    </span>
                    <div className="flex items-center justify-center h-8 w-8 rounded-full border border-white/10 group-hover:bg-white/10 transition-colors">
                      <ArrowRight className="h-4 w-4 text-muted group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </BentoCard>
    </motion.div>
  );
}
