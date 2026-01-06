
import React from 'react';

interface TimelineEvent {
  date: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  status?: 'success' | 'warning' | 'neutral';
}

interface TimelineProps {
  events: TimelineEvent[];
}

export const Timeline: React.FC<TimelineProps> = ({ events }) => {
  return (
    <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-300 before:to-transparent">
      {events.map((event, i) => (
        <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
          {/* Icon/Dot */}
          <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-gray-200 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
             {event.icon || <div className={`w-3 h-3 rounded-full ${event.status === 'success' ? 'bg-green-500' : event.status === 'warning' ? 'bg-orange-500' : 'bg-gray-400'}`}></div>}
          </div>
          
          {/* Card */}
          <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between space-x-2 mb-1">
              <div className="font-bold text-gyn-blue-dark">{event.title}</div>
              <time className="font-mono text-xs text-gray-500">{event.date}</time>
            </div>
            {event.description && <div className="text-gray-600 text-sm">{event.description}</div>}
          </div>
        </div>
      ))}
    </div>
  );
};
