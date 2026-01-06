import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { OwnerIcon as Icon } from '../OwnerIcons';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'glow';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  icon?: string;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, leftIcon, rightIcon, icon, children, disabled, type = 'button', ...props }, ref) => {

    const variants = {
      primary: 'bg-gradient-to-r from-gyn-blue-dark to-gyn-blue-medium text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 dark:from-hud-primary dark:to-hud-secondary dark:text-material-obsidian dark:shadow-hud-glow',
      secondary: 'bg-white text-gyn-blue-dark border border-gray-200 hover:bg-gray-50 shadow-sm hover:shadow-md dark:bg-slate-800 dark:text-white dark:border-slate-700 dark:hover:bg-slate-700',
      ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gyn-blue-dark dark:text-gray-400 dark:hover:bg-slate-800 dark:hover:text-white',
      danger: 'bg-red-500 text-white hover:bg-red-600 shadow-md dark:bg-red-600 dark:hover:bg-red-700',
      outline: 'bg-transparent border-2 border-gyn-blue-medium text-gyn-blue-medium hover:bg-gyn-blue-medium/5 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-900/20',
      glow: 'bg-hud-primary/10 text-hud-primary border border-hud-primary/50 shadow-[0_0_15px_rgba(0,240,255,0.3)] hover:bg-hud-primary hover:text-black hover:shadow-[0_0_25px_rgba(0,240,255,0.6)] transition-all duration-300'
    };

    const sizes = {
      xs: 'h-6 px-2 text-[10px]',
      sm: 'h-8 px-3 text-xs',
      md: 'h-10 px-4 text-sm',
      lg: 'h-12 px-6 text-base',
      icon: 'h-10 w-10 p-2 flex items-center justify-center'
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'relative inline-flex items-center justify-center rounded-xl font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gyn-blue-medium/50 disabled:opacity-50 disabled:pointer-events-none disabled:shadow-none',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        {!isLoading && icon && <Icon name={icon as any} className={cn("mr-2 w-4 h-4", size === 'sm' && "w-3 h-3", size === 'lg' && "w-5 h-5")} />}
        {!isLoading && leftIcon && <span className="mr-2">{leftIcon}</span>}
        {children}
        {!isLoading && rightIcon && <span className="ml-2">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
