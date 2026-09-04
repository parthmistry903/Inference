import { useMemo, useState } from 'react';
import { Link, useSearchParams, useParams } from 'react-router-dom';
import { Download, Timer, TrendingUp, Users, BarChart3, ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { ScorePill } from '../components/ui/Badge';
import { FilterBar } from '../components/resumes/FilterBar';
import { ResumeTable } from '../components/resumes/ResumeTable';
import { AnalyticsSection } from '../components/resumes/AnalyticsSection';
import { CandidatePanel } from '../components/resumes/CandidatePanel';
import { BentoCard } from '../components/ui/BentoCard';
import { api, axiosInstance } from '../services/api';
import type { Batch, BatchAnalytics, Job, Resume } from '../types';

function formatTime(ms: number): string {
  if (!ms) return '0m';
  const minutes = Math.max(1, Math.round(ms / 60000));
  return `${minutes}m`;
}

export default function ResultsPage() {
  const { batchId = '' } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);

  const filters = {
    search:    searchParams.get('search') ?? '',
    minScore:  Number(searchParams.get('minScore') ?? 0),
    maxScore:  Number(searchParams.get('maxScore') ?? 100),
    hrStatus:  searchParams.get('hrStatus') ?? '',
    page:      Number(searchParams.get('page') ?? 1),
    limit:     Number(searchParams.get('limit') ?? 25),
  };

  const { data: batch } = useQuery({
    queryKey: ['batches', batchId],
    queryFn: () => api.get<Batch>(`/batches/${batchId}`),
    enabled: Boolean(batchId),
  });
  const { data: job } = useQuery({
    queryKey: ['jobs', batch?.jobId],
    queryFn: () => api.get<Job>(`/jobs/${batch?.jobId}`),
    enabled: Boolean(batch?.jobId),
  });
  const resumeUrl = useMemo(() => {
    const params = new URLSearchParams({
      batchId,
      page:     String(filters.page),
      limit:    String(filters.limit),
      minScore: String(filters.minScore),
      maxScore: String(filters.maxScore),
    });
    if (filters.search)   params.set('search', filters.search);
    if (filters.hrStatus) params.set('hrStatus', filters.hrStatus);
    return `/resumes?${params.toString()}`;
  }, [batchId, filters.hrStatus, filters.limit, filters.maxScore, filters.minScore, filters.page, filters.search]);

  const { data: resumeResponse, isLoading: resumesLoading } = useQuery({
    queryKey: ['resumes', { batchId, ...filters }],
    queryFn: () => api.getWithMeta<Resume[]>(resumeUrl),
    enabled: Boolean(batchId),
  });
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['analytics', batchId],
    queryFn: () => api.get<BatchAnalytics>(`/analytics/${batchId}`),
    enabled: Boolean(batchId),
  });

  const updateParams = (updates: Partial<typeof filters>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === '' || value === undefined) next.delete(key);
      else next.set(key, String(value));
    });
    if (!('page' in updates)) next.set('page', '1');
    setSearchParams(next);
  };

  const exportCsv = async (filter: 'all' | 'shortlisted') => {
    try {
      const response = await axiosInstance.get(`/resumes/export?batchId=${batchId}&filter=${filter}`, { responseType: 'blob' });
      const disposition = response.headers['content-disposition'];
      let filename = `Inference_${filter}_${batchId}.csv`;
      if (disposition?.includes('filename=')) {
        const m = /filename="([^"]+)"/.exec(disposition);
        if (m?.[1]) filename = m[1];
      }
      const blobUrl = URL.createObjectURL(response.data as Blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const statCards = [
    { label: 'Avg Score',        value: <ScorePill score={analytics?.averageScore ?? 0} />, icon: BarChart3,   description: 'Mean candidate score', color: 'white' },
    { label: 'Pass Rate',        value: `${analytics?.passRate ?? 0}%`,                     icon: TrendingUp,  description: 'Score ≥ 80', color: 'verdigris' },
    { label: 'Total Processed',  value: batch?.processedResumes ?? 0,                        icon: Users,       description: 'Completed resumes', color: 'white' },
    { label: 'Processing Time',  value: formatTime(analytics?.processingTimeMs ?? 0),        icon: Timer,       description: 'Batch duration', color: 'verdigris' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-[1400px] mx-auto pb-12"
    >
      {}
      <div className="mb-10 pt-4 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-muted mb-3">
            <Link to="/jobs" className="hover:text-primary transition-colors">Jobs</Link>
            <ChevronRight className="h-4 w-4" />
            {job ? (
              <Link to={`/jobs/${job._id}`} className="hover:text-primary transition-colors text-[#EDEAE5] truncate max-w-[200px]">
                {job.title}
              </Link>
            ) : (
              <span className="h-4 w-24 bg-white/10 rounded animate-pulse" />
            )}
            <ChevronRight className="h-4 w-4" />
            {job && batch ? (
              <span className="text-[#EDEAE5]">
                Batch / {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(batch.createdAt))}
              </span>
            ) : (
              <span>Batch {batchId.slice(-8)}</span>
            )}
          </div>
          <h1 className="font-display text-[38px] font-normal text-primary tracking-tight">
            Batch Results
          </h1>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="success" 
            onClick={() => void exportCsv('shortlisted')} 
            leftIcon={<Download className="h-4 w-4" />}
          >
            Export Shortlisted
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => void exportCsv('all')} 
            leftIcon={<Download className="h-4 w-4" />}
          >
            Export All
          </Button>
        </div>
      </div>

      {}
      <div className="mb-8 grid grid-cols-2 gap-6 md:grid-cols-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <BentoCard key={card.label} glow className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-white`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <div className="font-display text-3xl font-bold text-primary tracking-tight">{card.value}</div>
              <p className="mt-2 text-sm font-medium text-secondary">{card.label}</p>
              <p className="mt-1 text-xs text-muted">{card.description}</p>
            </BentoCard>
          );
        })}
      </div>

      {}
      <div className="flex flex-col gap-6 lg:flex-row items-start">
        <div className="min-w-0 flex-1 w-full space-y-6">
          <BentoCard className="p-4">
            <FilterBar
              search={filters.search}
              minScore={filters.minScore}
              maxScore={filters.maxScore}
              hrStatus={filters.hrStatus}
              onChange={updateParams}
              onReset={() => setSearchParams(new URLSearchParams())}
            />
          </BentoCard>
          <BentoCard className="p-0 overflow-hidden">
            <ResumeTable
              resumes={resumeResponse?.data ?? []}
              meta={resumeResponse?.meta}
              isLoading={resumesLoading}
              page={filters.page}
              limit={filters.limit}
              onPageChange={(page) => updateParams({ page })}
              onPageSizeChange={(limit) => updateParams({ limit, page: 1 })}
              onOpenResume={(resume) => setSelectedResume(resume)}
            />
          </BentoCard>
        </div>
        <aside className="w-full flex-shrink-0 lg:w-80 sticky top-20">
          <AnalyticsSection analytics={analytics} isLoading={analyticsLoading} />
        </aside>
      </div>

      <CandidatePanel
        resume={selectedResume}
        open={Boolean(selectedResume)}
        onClose={() => setSelectedResume(null)}
      />
    </motion.div>
  );
}
