import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '../../utils/cn';

export interface BentoCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
  tilt?: boolean;
  glow?: boolean;
  onClick?: () => void;
  as?: any; 
}

export function BentoCard({
  children,
  className,
  tilt = true,
  glow = false,
  onClick,
  as = 'div',
  ...props
}: BentoCardProps) {
  const isInteractive = Boolean(onClick);

  return (
    <motion.div
      {...props}
      onClick={onClick}
      whileHover={isInteractive ? { scale: 1.02, y: -4 } : undefined}
      whileTap={isInteractive ? { scale: 0.98 } : undefined}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={cn(
        'glass-card rounded-3xl relative overflow-hidden',
        isInteractive && 'cursor-pointer',
        className,
      )}
    >
      {glow && (
        <div className="absolute inset-0 bg-gradient-to-tr from-kinpaku/5 via-transparent to-verdigris/5 opacity-0 transition-opacity duration-500 hover:opacity-100 pointer-events-none" />
      )}
      {children}
    </motion.div>
  );
}
