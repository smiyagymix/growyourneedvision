
import React from 'react';

export const AudioVisualizer: React.FC = () => {
  return (
    <div className="flex items-end justify-center gap-1 h-20 w-full">
      {[...Array(20)].map((_, i) => (
        <div 
          key={i}
          className="w-2 bg-gradient-to-t from-gyn-blue-medium to-gyn-blue-light rounded-t-sm animate-pulse"
          style={{
            height: `${Math.max(10, Math.random() * 100)}%`,
            animationDuration: `${0.5 + Math.random() * 0.5}s`,
            opacity: 0.7 + Math.random() * 0.3
          }}
        ></div>
      ))}
    </div>
  );
};
