
import React from 'react';

interface StatusIndicatorProps {
  status: 'online' | 'offline' | 'busy' | 'away' | 'maintenance';
  text?: string;
  size?: 'sm' | 'md';
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status, text, size = 'md' }) => {
  const colors = {
    online: 'bg-green-500',
    offline: 'bg-gray-400',
    busy: 'bg-red-500',
    away: 'bg-yellow-500',
    maintenance: 'bg-blue-500',
  };

  const labels = {
    online: 'Online',
    offline: 'Offline',
    busy: 'Busy',
    away: 'Away',
    maintenance: 'Maintenance',
  };

  return (
    <div className="flex items-center gap-2">
      <span className="relative flex h-3 w-3">
        {(status === 'online' || status === 'maintenance') && (
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${colors[status]}`}></span>
        )}
        <span className={`relative inline-flex rounded-full h-3 w-3 ${colors[status]}`}></span>
      </span>
      {text !== undefined ? (
          <span className={`font-bold text-gray-600 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>{text}</span>
      ) : (
          <span className={`font-bold text-gray-600 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>{labels[status]}</span>
      )}
    </div>
  );
};
