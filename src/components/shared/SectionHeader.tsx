import React from 'react';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, subtitle, className = '' }) => {
  return (
    <div className={`mb-6 p-4 rounded-xl bg-gradient-to-r from-gyn-blue-dark to-deepBlue shadow-lg border border-white/10 ${className}`}>
      <h2 className="text-lg font-bold text-white tracking-wide">{title}</h2>
      {subtitle && <p className="text-sm text-blue-100 mt-1 font-medium opacity-90">{subtitle}</p>}
    </div>
  );
};
