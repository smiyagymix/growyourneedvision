
import React from 'react';

interface GlassContainerProps {
  children: React.ReactNode;
  className?: string;
  intensity?: 'low' | 'medium' | 'high';
  border?: boolean;
}

export const GlassContainer: React.FC<GlassContainerProps> = ({ 
  children, 
  className = '', 
  intensity = 'medium',
  border = true
}) => {
  const bgs = {
    low: 'bg-white/40 backdrop-blur-sm',
    medium: 'bg-white/60 backdrop-blur-md',
    high: 'bg-white/80 backdrop-blur-xl',
  };

  return (
    <div className={`${bgs[intensity]} ${border ? 'border border-white/50' : ''} shadow-glass-edge rounded-2xl ${className}`}>
      {children}
    </div>
  );
};
