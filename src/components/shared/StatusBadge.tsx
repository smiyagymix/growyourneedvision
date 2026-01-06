import React from 'react';

export type StatusType = 'active' | 'inactive' | 'pending' | 'error' | 'success' | 'warning';

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label, className = '' }) => {
  const styles = {
    active: 'bg-green-100 text-green-800 border-green-200',
    success: 'bg-green-100 text-green-800 border-green-200',
    inactive: 'bg-gray-100 text-gray-800 border-gray-200',
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    warning: 'bg-orange-100 text-orange-800 border-orange-200',
    error: 'bg-red-100 text-red-800 border-red-200',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status]} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
        status === 'active' || status === 'success' ? 'bg-green-500' :
        status === 'inactive' ? 'bg-gray-500' :
        status === 'pending' || status === 'warning' ? 'bg-yellow-500' :
        'bg-red-500'
      }`} />
      {label || status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};
