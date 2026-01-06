import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral' | 'outline' | 'default' | 'info' | 'secondary';
  size?: 'sm' | 'md';
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {

    const variants = {
      primary: 'bg-gyn-blue-medium/10 text-gyn-blue-medium border border-gyn-blue-medium/20 dark:bg-hud-primary/10 dark:text-hud-primary dark:border-hud-primary/30 dark:shadow-[0_0_10px_rgba(0,240,255,0.2)]',
      success: 'bg-green-100 text-green-700 border border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/30 dark:shadow-[0_0_10px_rgba(74,222,128,0.2)]',
      warning: 'bg-yellow-100 text-yellow-700 border border-yellow-200 dark:bg-yellow-500/10 dark:text-yellow-400 dark:border-yellow-500/30',
      danger: 'bg-red-100 text-red-700 border border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/30 dark:shadow-[0_0_10px_rgba(248,113,113,0.2)]',
      neutral: 'bg-gray-100 text-gray-700 border border-gray-200 dark:bg-white/5 dark:text-gray-300 dark:border-white/10',
      outline: 'bg-transparent border border-gray-300 text-gray-600 dark:border-white/20 dark:text-gray-400',
      default: 'bg-gray-100 text-gray-700 border border-gray-200 dark:bg-white/5 dark:text-gray-300 dark:border-white/10',
      info: 'bg-blue-100 text-blue-700 border border-blue-200 dark:bg-hud-secondary/10 dark:text-hud-secondary dark:border-hud-secondary/30',
      secondary: 'bg-gray-100 text-gray-600 border border-gray-200 dark:bg-slate-700 dark:text-gray-300 dark:border-slate-600'
    };

    const sizes = {
      sm: 'px-2 py-0.5 text-[10px]',
      md: 'px-2.5 py-0.5 text-xs'
    };

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-full font-bold uppercase tracking-wider',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';
