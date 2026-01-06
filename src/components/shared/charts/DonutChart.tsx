
import React from 'react';

interface DonutSegment {
  value: number;
  color: string;
  label: string;
}

interface DonutChartProps {
  data: DonutSegment[];
  size?: number;
  thickness?: number;
}

export const DonutChart: React.FC<DonutChartProps> = ({ data, size = 200, thickness = 20 }) => {
  const total = data.reduce((acc, item) => acc + item.value, 0);
  let currentAngle = 0;

  const radius = size / 2;
  const innerRadius = radius - thickness;

  // Helper to calculate SVG path for arc
  const getArcPath = (startAngle: number, endAngle: number) => {
    const outerStart = polarToCartesian(radius, radius, radius, endAngle);
    const outerEnd = polarToCartesian(radius, radius, radius, startAngle);
    const innerStart = polarToCartesian(radius, radius, innerRadius, endAngle);
    const innerEnd = polarToCartesian(radius, radius, innerRadius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    
    // Create donut segment path with inner and outer arcs
    const d = [
      "M", outerStart.x, outerStart.y,
      "A", radius, radius, 0, largeArcFlag, 0, outerEnd.x, outerEnd.y,
      "L", innerEnd.x, innerEnd.y,
      "A", innerRadius, innerRadius, 0, largeArcFlag, 1, innerStart.x, innerStart.y,
      "Z"
    ].join(" ");
    return d;
  };

  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  };

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform">
        {data.map((item, i) => {
          const sliceAngle = total > 0 ? (item.value / total) * 360 : 0;
          const path = getArcPath(currentAngle, currentAngle + sliceAngle);
          currentAngle += sliceAngle;
          
          // SVG strokes are centered on path, so we simulate thickness with stroke-width
          // A true donut path is more complex, simplified here with thick stroke circle
          const circleCircumference = 2 * Math.PI * (radius - thickness / 2);
          
          // Using simple circle stroke dasharray approach for cleaner code in this snippet context
          // Reset angle for simplicity in this specific implementation pattern
          const dashArrayValue = total > 0 ? (item.value / total) * circleCircumference : 0;
          const dashOffsetValue = -1 * (currentAngle - sliceAngle) / 360 * circleCircumference;

          return (
             <circle
                key={i}
                r={radius - thickness / 2}
                cx={radius}
                cy={radius}
                fill="transparent"
                stroke={item.color}
                strokeWidth={thickness}
                strokeDasharray={`${dashArrayValue} ${circleCircumference}`}
                strokeDashoffset={dashOffsetValue}
                transform={`rotate(-90 ${radius} ${radius})`}
                className="transition-all duration-1000 ease-out hover:opacity-80 cursor-pointer"
             >
                 <title>{item.label}: {item.value}</title>
             </circle>
          );
        })}
      </svg>
      {/* Legend Overlay or Center Text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-bold text-gray-800">{total}</span>
          <span className="text-[10px] text-gray-500 uppercase tracking-wider">Total</span>
      </div>
    </div>
  );
};
