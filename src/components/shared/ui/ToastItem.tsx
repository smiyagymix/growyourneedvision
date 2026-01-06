import React from 'react';
import { OwnerIcon } from '../OwnerIcons';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItemProps {
  id: number;
  message: string;
  type: ToastType;
  onClose: (id: number) => void;
}

export const ToastItem: React.FC<ToastItemProps> = ({ id, message, type, onClose }) => {
  return (
    <div 
      className={`
        flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border backdrop-blur-md min-w-[300px] animate-slideInRight
        ${type === 'success' ? 'bg-green-50/90 border-green-200 text-green-800' : ''}
        ${type === 'error' ? 'bg-red-50/90 border-red-200 text-red-800' : ''}
        ${type === 'warning' ? 'bg-orange-50/90 border-orange-200 text-orange-800' : ''}
        ${type === 'info' ? 'bg-blue-50/90 border-blue-200 text-blue-800' : ''}
      `}
    >
      <OwnerIcon 
          name={
              type === 'success' ? 'CheckCircleIcon' : 
              type === 'error' ? 'ExclamationCircle' : 
              type === 'warning' ? 'ExclamationTriangleIcon' : 'Bell'
          } 
          className="w-5 h-5" 
      />
      <span className="text-sm font-bold">{message}</span>
      <button type="button" onClick={() => onClose(id)} className="ml-auto hover:opacity-70">
          <OwnerIcon name="X" className="w-4 h-4" />
      </button>
    </div>
  );
};
