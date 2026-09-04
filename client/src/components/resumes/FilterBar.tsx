import { Search, SlidersHorizontal, RotateCcw } from 'lucide-react';
import { Button } from '../ui/Button';

interface FilterBarProps {
  search: string;
  minScore: number;
  maxScore: number;
  hrStatus: string;
  onChange: (updates: Partial<{ search: string; minScore: number; maxScore: number; hrStatus: string }>) => void;
  onReset: () => void;
}

export function FilterBar({ search, minScore, maxScore, hrStatus, onChange, onReset }: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      {}
      <div className="relative min-w-[240px] flex-1">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          type="text"
          className="h-10 w-full rounded-xl glass-input pl-11 pr-4 text-sm font-medium text-primary placeholder-muted focus:ring-2 focus:ring-[#3A7A72] outline-none transition-all"
          placeholder="Search by candidate name or email…"
          value={search}
          onChange={(e) => onChange({ search: e.target.value })}
        />
      </div>

      {}
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-secondary mr-1">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Score
        </span>
        <input
          aria-label="Minimum score"
          type="number"
          min="0"
          max="100"
          className="h-10 w-16 rounded-xl glass-input text-center text-sm font-semibold text-primary outline-none focus:ring-2 focus:ring-[#3A7A72] transition-all"
          value={minScore}
          onChange={(e) => onChange({ minScore: Math.min(Number(e.target.value), maxScore) })}
        />
        <span className="font-bold text-muted">–</span>
        <input
          aria-label="Maximum score"
          type="number"
          min="0"
          max="100"
          className="h-10 w-16 rounded-xl glass-input text-center text-sm font-semibold text-primary outline-none focus:ring-2 focus:ring-[#3A7A72] transition-all"
          value={maxScore}
          onChange={(e) => onChange({ maxScore: Math.max(Number(e.target.value), minScore) })}
        />
      </div>

      {}
      <select
        className="h-10 rounded-xl glass-input px-4 font-medium text-sm text-primary outline-none transition-all focus:ring-2 focus:ring-[#3A7A72]"
        value={hrStatus}
        onChange={(e) => onChange({ hrStatus: e.target.value })}
      >
        <option value="">All statuses</option>
        <option value="pending">Pending</option>
        <option value="shortlisted">Shortlisted</option>
        <option value="rejected">Rejected</option>
        <option value="review">In Review</option>
      </select>

      <Button variant="ghost" size="sm" onClick={onReset} className="h-10 text-muted hover:text-primary px-3">
        <RotateCcw className="h-4 w-4 mr-2" />
        Reset
      </Button>
    </div>
  );
}
