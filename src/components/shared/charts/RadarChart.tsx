
import React from 'react';

interface RadarChartProps {
  data: Record<string, number>; // Key: Label, Value: 0-100
  size?: number;
  color?: string;
}

export const RadarChart: React.FC<RadarChartProps> = ({ 
  data, 
  size = 300, 
  color = 'rgba(48, 65, 199, 0.5)' 
}) => {
  const keys = Object.keys(data);
  const total = keys.length;
  const radius = size / 2;
  const center = size / 2;
  
  const angleSlice = (Math.PI * 2) / total;

  // Calculate coordinates
  const points = keys.map((key, i) => {
    const value = data[key] / 100; // Normalize to 0-1
    const r = radius * value;
    const angle = i * angleSlice - Math.PI / 2; // Start from top
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
      label: key
    };
  });

  const pathData = points.map(p => `${p.x},${p.y}`).join(' ');

  // Background Levels
  const levels = [0.2, 0.4, 0.6, 0.8, 1];

  return (
    <svg width={size} height={size} className="overflow-visible">
      {/* Grid */}
      {levels.map((level, lvlIdx) => (
        <polygon 
          key={lvlIdx}
          points={keys.map((_, i) => {
            const r = radius * level;
            const angle = i * angleSlice - Math.PI / 2;
            return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
          }).join(' ')}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="1"
        />
      ))}

      {/* Axes */}
      {keys.map((_, i) => {
        const angle = i * angleSlice - Math.PI / 2;
        const x = center + radius * Math.cos(angle);
        const y = center + radius * Math.sin(angle);
        return <line key={i} x1={center} y1={center} x2={x} y2={y} stroke="#e5e7eb" strokeWidth="1" />;
      })}

      {/* Data Polygon */}
      <polygon points={pathData} fill={color} stroke={color.replace('0.5', '1')} strokeWidth="2" fillOpacity="0.3" />

      {/* Labels */}
      {points.map((p, i) => (
        <text 
          key={i} 
          x={p.x} 
          y={p.y} 
          textAnchor="middle" 
          dy={p.y < center ? -10 : 20}
          className="text-[10px] font-bold fill-gray-500 uppercase"
        >
          {p.label}
        </text>
      ))}
    </svg>
  );
};
