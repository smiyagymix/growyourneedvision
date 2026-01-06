
import React from 'react';

interface GaugeProps {
  value: number; // 0 to 100
  label?: string;
  size?: number;
  color?: string;
}

export const Gauge: React.FC<GaugeProps> = ({ value, label, size = 150, color = '#3b82f6' }) => {
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * Math.PI; // Half circle
  const safeValue = isNaN(value) ? 0 : value;
  const offset = circumference - (safeValue / 100) * circumference;

  return (
    <div className="relative flex flex-col items-center justify-end" style={{ width: size, height: size / 2 + 20 }}>
      <div className="relative overflow-hidden" style={{ width: size, height: size / 2 }}>
        <svg width={size} height={size / 2} className="block">
          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference} ${circumference}`}
            strokeLinecap="round"
            className="transform rotate-180 origin-bottom"
          />
          {/* Value */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transform rotate-180 origin-bottom transition-all duration-1000 ease-out"
          />
        </svg>
      </div>
      <div className="absolute bottom-0 flex flex-col items-center">
        <span className="text-3xl font-black text-gray-800">{value}%</span>
        {label && <span className="text-xs text-gray-500 uppercase font-bold">{label}</span>}
      </div>
    </div>
  );
};
