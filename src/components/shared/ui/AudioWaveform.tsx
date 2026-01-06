import React from 'react';

export const AudioWaveform: React.FC = () => {
  return (
    <div className="flex items-center gap-0.5 h-16 w-full bg-gray-900 rounded-lg p-2 overflow-hidden">
        {[...Array(60)].map((_, i) => (
            <div 
                key={i} 
                className="w-1 bg-cyan-500 rounded-full"
                style={{ height: `${Math.random() * 100}%`, opacity: Math.random() * 0.5 + 0.5 }}
            ></div>
        ))}
    </div>
  );
};