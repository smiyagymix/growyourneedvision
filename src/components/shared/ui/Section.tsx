
import React from 'react';

interface SectionProps {
  children: React.ReactNode;
  className?: string;
}

export const Section: React.FC<SectionProps> = ({ children, className = '' }) => {
  return (
    <section className={`w-full max-w-7xl mx-auto space-y-6 ${className}`}>
      {children}
    </section>
  );
};
