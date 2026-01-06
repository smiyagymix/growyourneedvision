
import React from 'react';

interface ProgressBarProps {
  progress: number; // 0 to 100
  color?: string;
  height?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress, color = 'bg-gyn-blue-medium', height = 'h-2' }) => {
  return (
    <div className={`w-full bg-gray-100 rounded-full overflow-hidden shadow-inner ${height}`}>
      <div 
        className={`h-full rounded-full transition-all duration-500 ${color}`} 
        style={{ width: `${progress}%` }}
      ></div>
    </div>
  );
};
