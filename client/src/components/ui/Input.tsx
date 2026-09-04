import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'h-11 w-full rounded-xl glass-input px-3.5 font-medium text-primary placeholder-muted outline-none',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';

export const TextArea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'min-h-[100px] w-full resize-y rounded-xl glass-input px-3.5 py-3 font-medium text-primary placeholder-muted outline-none',
        className,
      )}
      {...props}
    />
  ),
);
TextArea.displayName = 'TextArea';

interface LabeledFieldProps {
  label: string;
  error?: string;
  children: React.ReactNode;
}

export function LabeledField({ label, error, children }: LabeledFieldProps) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-secondary">
        {label}
      </span>
      {children}
      <AnimatePresence>
        {error && (
          <motion.span
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-2 block text-[13px] font-medium text-[#E85C5C]"
          >
            {error}
          </motion.span>
        )}
      </AnimatePresence>
    </label>
  );
}
