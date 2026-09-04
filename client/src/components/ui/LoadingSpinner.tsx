import { cn } from '../../utils/cn';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-10 w-10' };

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  return (
    <span
      aria-label="Loading"
      className={cn(
        'inline-block animate-spin rounded-full border-[2px] border-[#B07A3E] border-r-transparent',
        sizes[size],
        className,
      )}
    />
  );
}
