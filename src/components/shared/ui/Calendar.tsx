
import React from 'react';
import { OwnerIcon } from '../OwnerIcons';

interface CalendarProps {
    events?: { date: number; title: string; type: 'meeting' | 'launch' | 'other' }[];
}

export const Calendar: React.FC<CalendarProps> = ({ events = [] }) => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  // Generate calendar grid
  const dates = Array.from({ length: 35 }, (_, i) => i + 1 > 31 ? i - 30 : i + 1);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gyn-blue-dark">October 2024</h3>
          <div className="flex gap-2">
              <button className="p-1 hover:bg-gray-200 rounded"><OwnerIcon name="ChevronLeft" className="w-4 h-4 text-gray-600" /></button>
              <button className="p-1 hover:bg-gray-200 rounded"><OwnerIcon name="ChevronRight" className="w-4 h-4 text-gray-600" /></button>
          </div>
      </div>
      <div className="grid grid-cols-7 text-center bg-gray-50/50 border-b border-gray-100">
          {days.map(d => <div key={d} className="py-2 text-[10px] font-bold text-gray-400 uppercase">{d}</div>)}
      </div>
      <div className="grid grid-cols-7">
          {dates.map((d, i) => {
              const dayEvents = events.filter(e => e.date === d && i < 31); // Simple matching for demo month
              return (
                <div key={i} className="h-20 border-b border-r border-gray-50 p-1 relative hover:bg-blue-50/30 transition-colors cursor-pointer group">
                    <span className={`text-xs font-bold ${dayEvents.length > 0 ? 'bg-gyn-blue-medium text-white rounded-full w-6 h-6 flex items-center justify-center' : 'text-gray-700'}`}>{d}</span>
                    {dayEvents.map((ev, idx) => (
                        <div key={idx} className={`mt-1 text-[9px] px-1 py-0.5 rounded truncate border ${ev.type === 'meeting' ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-blue-100 text-blue-700 border-blue-200'}`}>
                            {ev.title}
                        </div>
                    ))}
                </div>
              );
          })}
      </div>
    </div>
  );
};
