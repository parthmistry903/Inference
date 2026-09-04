import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

interface ProgressBarProps {
  value: number;
  className?: string;
  animated?: boolean;
  colorized?: boolean;
}

export function ProgressBar({ value, className }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div className={cn('h-1.5 overflow-hidden rounded bg-white/5', className)}>
      <motion.div
        className="h-full rounded"
        initial={{ width: 0 }}
        animate={{ width: `${clamped}%` }}
        transition={{ type: 'spring', stiffness: 50, damping: 15 }}
        style={{ background: '#2D5D57' }}
      />
    </div>
  );
}
