
import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-white/60 backdrop-blur-xl rounded-2xl border border-white/50 shadow-glass-edge overflow-hidden flex flex-col ${className}`}>
      {children}
    </div>
  );
};
