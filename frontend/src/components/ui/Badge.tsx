import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  children?: React.ReactNode;
}

export function Badge({ className, variant = 'default', children, ...props }: BadgeProps) {
  const variants = {
    default: 'bg-[#4B5320] text-white hover:bg-[#3D441A] border-transparent',
    secondary: 'bg-[#F5F2ED] text-[#2C2C2C] hover:bg-[#EAE6E1] border-transparent',
    destructive: 'bg-red-500 text-white hover:bg-red-600 border-transparent',
    outline: 'text-[#2C2C2C] border border-[#E5E0D8]',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
