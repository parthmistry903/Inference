import type { ReactNode } from 'react';
import { Button } from './Button';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#2A2420] bg-[#1B1916] text-[#B07A3E] shadow-xl">
        {icon}
      </div>
      <h3 className="mt-5 font-display text-xl font-medium text-[#EDEAE5]">{title}</h3>
      <p className="mt-2 max-w-xs font-sans text-sm font-medium leading-6 text-[#928D88]">{description}</p>
      {action && (
        <Button className="mt-6" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
