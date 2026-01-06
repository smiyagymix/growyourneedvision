
import React from 'react';
import { Tooltip } from '../ui/Tooltip';

interface HeatmapProps {
  data: number[]; // Array of 365 days (roughly)
}

export const Heatmap: React.FC<HeatmapProps> = ({ data }) => {
  const getColor = (val: number) => {
    if (val === 0) return 'bg-gray-100';
    if (val < 3) return 'bg-green-200';
    if (val < 6) return 'bg-green-400';
    if (val < 9) return 'bg-green-600';
    return 'bg-green-800';
  };

  // Group by weeks (cols) for 7 rows
  const weeks = [];
  for (let i = 0; i < data.length; i += 7) {
    weeks.push(data.slice(i, i + 7));
  }

  return (
    <div className="flex gap-1 overflow-x-auto pb-2">
      {weeks.map((week, wIdx) => (
        <div key={wIdx} className="flex flex-col gap-1">
          {week.map((dayVal, dIdx) => (
            <Tooltip key={dIdx} text={`${dayVal} contributions`}>
              <div 
                className={`w-3 h-3 rounded-sm ${getColor(dayVal)} hover:ring-1 hover:ring-gray-400 transition-all`}
              />
            </Tooltip>
          ))}
        </div>
      ))}
    </div>
  );
};
