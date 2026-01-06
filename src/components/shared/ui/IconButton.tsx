
import React from 'react';
import { OwnerIcon } from '../OwnerIcons';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'ghost' | 'glass' | 'filled';
}

export const IconButton: React.FC<IconButtonProps> = ({ name, size = 'md', variant = 'ghost', className = '', ...props }) => {
  const sizes = {
    sm: "p-1.5",
    md: "p-2.5",
    lg: "p-3.5",
  };
  
  const variants = {
    ghost: "text-gray-400 hover:text-gyn-blue-medium hover:bg-gray-100/50",
    glass: "bg-white/40 backdrop-blur-sm border border-white/50 text-gyn-blue-dark hover:bg-white/60 shadow-sm",
    filled: "bg-gyn-blue-light text-gyn-blue-dark hover:bg-gyn-blue-medium hover:text-white",
  };

  return (
    <button type="button" className={`rounded-lg transition-colors ${sizes[size]} ${variants[variant]} ${className}`} {...props}>
      <OwnerIcon name={name} className="w-5 h-5" />
    </button>
  );
};
