import { cn } from '../../utils/cn';

interface ScorePillProps {
  score: number;
  className?: string;
}

interface StatusBadgeProps {
  status: 'pending' | 'shortlisted' | 'rejected' | 'review' | 'active' | 'closed' | 'queued' | 'processing' | 'completed' | 'partial';
  className?: string;
}

export function ScorePill({ score, className }: ScorePillProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 font-mono text-[13px] font-bold',
        className,
      )}
      style={{ color: '#F0EDE8' }}
    >
      {Math.round(score)}
    </span>
  );
}

const statusStyles: Record<StatusBadgeProps['status'], { label: string; bg: string; text: string; border?: string }> = {
  active:      { label: 'Active',      bg: 'rgba(45,93,87,0.18)', text: '#5BBDB0' },
  shortlisted: { label: 'Shortlisted', bg: 'rgba(45,93,87,0.15)', text: '#4BAFA3' },
  pending:     { label: 'Pending',     bg: 'rgba(100,92,84,0.15)', text: '#918880' },
  completed:   { label: 'Completed',   bg: 'rgba(40,40,40,0.6)', text: '#706B65' },
  rejected:    { label: 'Rejected',    bg: 'transparent', text: '#9A4545' },
  review:      { label: 'In Review',   bg: 'rgba(100,92,84,0.15)', text: '#918880' },
  closed:      { label: 'Closed',      bg: 'transparent', text: '#635E59' },
  queued:      { label: 'Queued',      bg: 'rgba(100,92,84,0.15)', text: '#918880' },
  processing:  { label: 'Processing',  bg: 'rgba(45,93,87,0.18)', text: '#5BBDB0' },
  partial:     { label: 'Partial',     bg: 'rgba(100,92,84,0.15)', text: '#918880' },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const { label, bg, text, border } = statusStyles[status];
  return (
    <span
      className={cn(
        'inline-flex items-center rounded px-2 py-0.5 text-[10.5px] font-semibold tracking-wide uppercase',
        className,
      )}
      style={{ backgroundColor: bg, color: text, border: border ? `1px solid ${border}` : undefined }}
    >
      {label}
    </span>
  );
}
