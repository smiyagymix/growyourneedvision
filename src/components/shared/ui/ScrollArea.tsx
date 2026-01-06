import React from 'react';

interface ScrollAreaProps {
  children: React.ReactNode;
  className?: string;
  height?: string;
}

export const ScrollArea: React.FC<ScrollAreaProps> = ({ children, className = '', height = 'h-full' }) => {
  return (
    <div className={`overflow-y-auto gyn-scroll ${height} ${className}`}>
      {children}
    </div>
  );
};