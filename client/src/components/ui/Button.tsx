import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '../../utils/cn';
import { LoadingSpinner } from './LoadingSpinner';

export type ButtonVariant = 'primary' | 'glass' | 'danger' | 'ghost' | 'success';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "ref"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-[#B07A3E] text-[#0C0B09] shadow-[0_2px_10px_rgba(176,122,62,0.2)] border border-white/10 hover:brightness-110',
  glass:
    'glass-input text-primary hover:bg-white/5',
  danger:
    'bg-[#E85C5C] text-white shadow-[0_2px_10px_rgba(232,92,92,0.2)] border border-white/10 hover:brightness-110',
  success:
    'bg-verdigris text-obsidian shadow-[0_2px_10px_rgba(74,139,130,0.2)] border border-white/10 hover:brightness-110',
  ghost:
    'bg-transparent text-secondary hover:text-primary hover:bg-white/5',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-4 text-xs',
  md: 'h-10 px-5 text-sm',
  lg: 'h-12 px-7 text-base',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, children, variant = 'primary', size = 'md', isLoading = false, leftIcon, rightIcon, disabled, ...props }, ref) => (
    <motion.button
      ref={ref}
      disabled={disabled || isLoading}
      whileTap={{ scale: disabled || isLoading ? 1 : 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-full font-medium tracking-wide transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B07A3E] disabled:pointer-events-none disabled:opacity-50',
        sizeClasses[size],
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {isLoading ? (
        <LoadingSpinner size="sm" />
      ) : (
        <>
          {leftIcon}
          {children}
          {rightIcon}
        </>
      )}
    </motion.button>
  ),
);

Button.displayName = 'Button';
