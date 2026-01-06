
import React from 'react';

export const Divider: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`h-px bg-gray-200 w-full my-4 ${className}`}></div>
);
