
import React from 'react';

interface AvatarProps {
  src?: string;
  initials?: string;
  size?: 'sm' | 'md' | 'lg';
  status?: 'online' | 'offline' | 'busy';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ src, initials = 'U', size = 'md', status, className }) => {
  const sizes = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-16 h-16 text-lg",
  };

  const statusColors = {
    online: "bg-green-500",
    offline: "bg-gray-400",
    busy: "bg-red-500",
  };

  return (
    <div className={`relative inline-block ${className || ''}`}>
      <div className={`${sizes[size]} rounded-full overflow-hidden border-2 border-white dark:border-slate-700 shadow-sm bg-gray-100 dark:bg-slate-700 flex items-center justify-center font-bold text-gray-500 dark:text-gray-300`}>
        {src ? <img src={src} alt="Avatar" className="w-full h-full object-cover" /> : initials}
      </div>
      {status && (
        <span className={`absolute bottom-0 right-0 block w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-slate-800 ${statusColors[status]}`} />
      )}
    </div>
  );
};
