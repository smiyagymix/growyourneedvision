
import React from 'react';

interface TypographyProps {
  children: React.ReactNode;
  className?: string;
}

export const Heading1: React.FC<TypographyProps> = ({ children, className = '' }) => (
  <h1 className={`text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gyn-blue-dark to-gyn-blue-medium drop-shadow-sm ${className}`}>
    {children}
  </h1>
);

export const Heading2: React.FC<TypographyProps> = ({ children, className = '' }) => (
  <h2 className={`text-2xl font-bold text-gyn-blue-dark ${className}`}>
    {children}
  </h2>
);

export const Heading3: React.FC<TypographyProps> = ({ children, className = '' }) => (
  <h3 className={`text-lg font-bold text-gray-800 ${className}`}>
    {children}
  </h3>
);

export const Text: React.FC<TypographyProps & { variant?: 'default' | 'muted' | 'small' }> = ({ children, className = '', variant = 'default' }) => {
  const styles = {
    default: 'text-sm text-gray-700',
    muted: 'text-sm text-gray-500',
    small: 'text-xs text-gray-500',
  };
  return <p className={`${styles[variant]} ${className}`}>{children}</p>;
};

export const Caption: React.FC<TypographyProps> = ({ children, className = '' }) => (
  <span className={`text-[10px] font-bold uppercase tracking-wider text-gray-400 ${className}`}>
    {children}
  </span>
);
