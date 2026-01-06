
import React from 'react';

interface BarChartProps {
  data: number[];
  labels?: string[];
  color?: string;
  height?: number;
}

export const SimpleBarChart: React.FC<BarChartProps> = ({ 
    data, 
    labels,
    color = '#3041c7', 
    height = 200 
}) => {
  const max = Math.max(...data);

  return (
    <div className="w-full flex items-end justify-between gap-2" style={{ height }}>
        {data.map((val, i) => (
            <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                <div 
                    className="w-full rounded-t-md transition-all duration-500 group-hover:opacity-80 relative"
                    style={{ 
                        height: `${(val / max) * 100}%`, 
                        backgroundColor: color 
                    }}
                >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        {val}
                    </div>
                </div>
                {labels && (
                    <span className="text-[10px] text-gray-400 font-mono mt-2 truncate w-full text-center">
                        {labels[i]}
                    </span>
                )}
            </div>
        ))}
    </div>
  );
};
