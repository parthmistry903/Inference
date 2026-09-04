import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { BentoCard } from '../ui/BentoCard';
import type { BatchAnalytics } from '../../types';
import { ProgressBar } from '../ui/ProgressBar';

interface AnalyticsSectionProps {
  analytics?: BatchAnalytics;
  isLoading: boolean;
}

const BAR_COLORS = ['#3A7A72', 'var(--verdigris-patina)', '#4a5568', '#718096', '#a0aec0'];

const tooltipStyle = {
  background: 'rgba(11, 11, 11, 0.8)',
  backdropFilter: 'blur(12px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px',
  color: 'var(--champagne)',
  fontFamily: 'Inter, sans-serif',
  fontWeight: 600,
  fontSize: '12px',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
};

export function AnalyticsSection({ analytics, isLoading }: AnalyticsSectionProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="h-[220px] animate-pulse rounded-3xl glass-card bg-white/5 border border-white/5" />
        <div className="h-[300px] animate-pulse rounded-3xl glass-card bg-white/5 border border-white/5" />
      </div>
    );
  }

  const maxSkillCount = Math.max(1, ...(analytics?.topSkills.map((s) => s.count) ?? [1]));

  return (
    <div className="flex flex-col gap-6">
      {}
      <BentoCard glow className="p-6">
        <p className="text-xs font-bold uppercase tracking-wider text-muted mb-6">Score Distribution</p>
        <div className="h-[160px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analytics?.scoreDistribution ?? []} barCategoryGap="20%">
              <XAxis
                dataKey="range"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--text-muted)', fontSize: 11, fontWeight: 600, fontFamily: 'Inter' }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'Inter' }}
                width={20}
              />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255, 255, 255, 0.05)', radius: 6 }} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {(analytics?.scoreDistribution ?? []).map((entry, i) => (
                  <Cell key={entry.range} fill={BAR_COLORS[i % 2]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </BentoCard>

      {}
      <BentoCard glow className="p-6">
        <p className="text-xs font-bold uppercase tracking-wider text-muted mb-6">Top Skills Detected</p>
        <div className="space-y-5">
          {(analytics?.topSkills ?? []).map((skill, i) => (
            <div key={skill.skill}>
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="truncate text-[13px] font-semibold text-primary">{skill.skill}</span>
                <span className="font-mono text-[11px] font-semibold text-secondary">{skill.count}</span>
              </div>
              <ProgressBar value={(skill.count / maxSkillCount) * 100} colorized={false} className="h-1.5" />
            </div>
          ))}
          {(!analytics?.topSkills || analytics.topSkills.length === 0) && (
            <p className="text-sm font-medium text-secondary text-center py-4">No skills detected yet.</p>
          )}
        </div>
      </BentoCard>
    </div>
  );
}
