import React from 'react';
import { OwnerIcon as Icon, IconName } from '../OwnerIcons';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: IconName;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon = 'InboxIcon',
  actionLabel,
  onAction,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center w-full min-h-[200px] animate-fadeIn ${className}`}>
      {/* Icon Container with Neumorphic/Glass Effect */}
      <div className="relative mb-6 group">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full blur-xl opacity-50 group-hover:opacity-80 transition-opacity"></div>
        <div className="relative w-20 h-20 bg-white/40 dark:bg-gray-800/40 backdrop-blur-md border border-white/60 dark:border-gray-700/60 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
          <Icon name={icon} className="w-10 h-10 text-gray-400 dark:text-gray-500 group-hover:text-gyn-blue-medium dark:group-hover:text-blue-400 transition-colors" />
        </div>
      </div>

      <h3 className="text-lg font-bold text-gray-700 dark:text-gray-200 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs leading-relaxed mb-6 mx-auto">
        {description}
      </p>

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-6 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gyn-blue-dark dark:text-blue-400 text-sm font-bold rounded-xl shadow-sm hover:shadow-md hover:border-gyn-blue-medium/30 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all active:scale-95 flex items-center gap-2 mx-auto"
        >
          <Icon name="PlusCircleIcon" className="w-4 h-4" />
          {actionLabel}
        </button>
      )}
    </div>
  );
};
