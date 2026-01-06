
import React from 'react';

interface LineChartProps {
  data: number[];
  labels?: string[];
  color?: string;
  height?: number;
}

export const SimpleLineChart: React.FC<LineChartProps> = ({ 
    data, 
    labels,
    color = '#3041c7', 
    height = 200 
}) => {
  const max = Math.max(...data);
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - (val / max) * 80; // 80% height to leave room
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="w-full" style={{ height }}>
      <div className="w-full h-full relative">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
            {/* Area Fill */}
            <path 
                d={`M0,100 ${points.split(' ').map((p, i) => `L${p}`).join(' ')} L100,100 Z`} 
                fill={color} 
                opacity="0.1" 
            />
            {/* Line */}
            <polyline 
                fill="none" 
                stroke={color} 
                strokeWidth="2" 
                points={points} 
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
            />
            {/* Dots */}
            {data.map((val, i) => {
                const x = (i / (data.length - 1)) * 100;
                const y = 100 - (val / max) * 80;
                return (
                    <circle 
                        key={i} 
                        cx={x} 
                        cy={y} 
                        r="3" 
                        fill="white" 
                        stroke={color} 
                        strokeWidth="2" 
                        vectorEffect="non-scaling-stroke"
                        className="opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                    >
                        <title>{val}</title>
                    </circle>
                );
            })}
        </svg>
        {labels && (
            <div className="flex justify-between mt-2 text-[10px] text-gray-400 font-mono">
                {labels.map((label, i) => (
                    <span key={i}>{label}</span>
                ))}
            </div>
        )}
      </div>
    </div>
  );
};
