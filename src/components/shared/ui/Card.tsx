import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'flat';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', padding = 'md', children, ...props }, ref) => {

    const variants = {
      default: 'bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 dark:bg-material-gunmetal dark:border-white/10 dark:shadow-glass',
      glass: 'bg-white/70 backdrop-blur-xl border border-white/50 shadow-lg dark:bg-material-gunmetal/60 dark:border-white/10 dark:shadow-glass-edge',
      flat: 'bg-gray-50 border border-gray-200 dark:bg-material-obsidian dark:border-white/5'
    };

    const paddings = {
      none: 'p-0',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8'
    };

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-2xl transition-all duration-300',
          variants[variant],
          paddings[padding],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
