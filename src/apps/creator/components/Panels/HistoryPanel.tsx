import React from 'react';
import { Clock, RotateCcw } from 'lucide-react';

export const HistoryPanel: React.FC = () => {
  // Mock history data
  const history = [
    { id: 1, action: 'Add Rectangle', time: '10:00 AM' },
    { id: 2, action: 'Move Layer', time: '10:01 AM' },
    { id: 3, action: 'Change Color', time: '10:02 AM' },
    { id: 4, action: 'Add Text', time: '10:05 AM' },
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-[#27272a] flex items-center gap-2">
        <Clock size={14} className="text-gray-400" />
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">History</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {history.map((item, index) => (
          <div 
            key={item.id}
            className={`px-4 py-2 text-xs border-b border-gray-800 hover:bg-gray-800 cursor-pointer flex justify-between items-center ${index === history.length - 1 ? 'bg-blue-900/20' : ''}`}
          >
            <span className="text-gray-300">{item.action}</span>
            <span className="text-gray-600 text-[10px]">{item.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
