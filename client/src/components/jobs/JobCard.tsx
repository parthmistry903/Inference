import { Briefcase, GraduationCap, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { StatusBadge } from '../ui/Badge';
import { BentoCard } from '../ui/BentoCard';
import type { Job } from '../../types';

interface JobCardProps {
  job: Job;
}

const educationLabels: Record<Job['minEducation'], string> = {
  any:        'Any',
  highschool: 'High School',
  bachelor:   'Bachelor',
  master:     'Master',
  phd:        'PhD',
};

const formatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export function JobCard({ job }: JobCardProps) {
  const navigate = useNavigate();
  const visibleSkills = job.requiredSkills.slice(0, 4);
  const extra = Math.max(0, job.requiredSkills.length - visibleSkills.length);

  return (
    <BentoCard
      glow
      onClick={() => navigate(`/jobs/${job._id}`)}
      className="group flex flex-col p-6 h-[260px]"
    >
      {}
      <div className="flex items-center justify-between gap-3 mb-4">
        {job.status === 'active' ? (
          <div className="h-1.5 w-1.5 rounded-full bg-[#5BBDB0]" />
        ) : (
          <StatusBadge status={job.status} />
        )}
        <span className="font-semibold text-xs text-muted">
          {job.batchCount ?? 0} batch{job.batchCount !== 1 ? 'es' : ''}
        </span>
      </div>

      {}
      <h2 className="font-display text-xl font-bold text-primary leading-normal tracking-tight">
        {job.title}
      </h2>

      {}
      <p className="mt-2 line-clamp-2 font-medium text-[13px] text-secondary leading-snug flex-grow">
        {job.description}
      </p>

      {}
      {visibleSkills.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {visibleSkills.map((skill) => (
            <span key={skill} className="rounded-md bg-transparent border border-[#2A2420] px-2 py-0.5 text-[11px] font-semibold text-[#5E5955] tracking-wide uppercase">
              {skill}
            </span>
          ))}
          {extra > 0 && (
            <span className="px-1 py-0.5 text-[11px] font-semibold text-[#635E59] tracking-wide uppercase">
              +{extra}
            </span>
          )}
        </div>
      )}

      {}
      <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between gap-3 text-xs font-semibold text-muted">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <Briefcase className="h-3.5 w-3.5" />
            {job.minExperienceYears}yr+
          </span>
          <span className="flex items-center gap-1.5">
            <GraduationCap className="h-3.5 w-3.5" />
            {educationLabels[job.minEducation]}
          </span>
        </div>
        <div className="flex items-center gap-2 group-hover:text-primary transition-colors">
          <span>{formatter.format(new Date(job.createdAt))}</span>
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </BentoCard>
  );
}
