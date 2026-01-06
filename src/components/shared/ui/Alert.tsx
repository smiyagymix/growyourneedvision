
import React from 'react';
import { OwnerIcon } from '../OwnerIcons';

interface AlertProps {
  type?: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
}

export const Alert: React.FC<AlertProps> = ({ type = 'info', title, message }) => {
  const styles = {
    info: { bg: 'bg-blue-50', border: 'border-blue-100', text: 'text-blue-800', icon: 'text-blue-500' },
    success: { bg: 'bg-green-50', border: 'border-green-100', text: 'text-green-800', icon: 'text-green-500' },
    warning: { bg: 'bg-orange-50', border: 'border-orange-100', text: 'text-orange-800', icon: 'text-orange-500' },
    error: { bg: 'bg-red-50', border: 'border-red-100', text: 'text-red-800', icon: 'text-red-500' },
  };

  const style = styles[type];

  return (
    <div className={`p-4 rounded-xl border ${style.bg} ${style.border} flex items-start gap-3`}>
      <OwnerIcon name="BellIcon" className={`w-5 h-5 mt-0.5 ${style.icon}`} />
      <div>
        <h4 className={`text-sm font-bold ${style.text}`}>{title}</h4>
        <p className={`text-xs opacity-90 mt-1 ${style.text}`}>{message}</p>
      </div>
    </div>
  );
};
