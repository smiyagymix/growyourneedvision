
import React from 'react';

interface GradientTextProps {
  children: React.ReactNode;
  from?: string;
  to?: string;
  via?: string;
  className?: string;
}

export const GradientText: React.FC<GradientTextProps> = ({ 
  children, 
  from = 'from-gyn-blue-light', 
  to = 'to-gyn-blue-medium', 
  via,
  className = '' 
}) => {
  const gradientClass = via 
    ? `bg-gradient-to-r ${from} via-${via} ${to}` 
    : `bg-gradient-to-r ${from} ${to}`;

  return (
    <span className={`text-transparent bg-clip-text ${gradientClass} ${className}`}>
      {children}
    </span>
  );
};
