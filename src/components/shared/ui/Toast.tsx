
import React, { createContext, useContext, useState, useCallback } from 'react';
import { OwnerIcon } from '../OwnerIcons';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  addToast: (message: string, type: ToastType) => void;
  removeToast: (id: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 3000);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
        {toasts.map(toast => (
          <div 
            key={toast.id} 
            className={`
              flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border backdrop-blur-md min-w-[300px] animate-slideInRight
              ${toast.type === 'success' ? 'bg-green-50/90 border-green-200 text-green-800' : ''}
              ${toast.type === 'error' ? 'bg-red-50/90 border-red-200 text-red-800' : ''}
              ${toast.type === 'warning' ? 'bg-orange-50/90 border-orange-200 text-orange-800' : ''}
              ${toast.type === 'info' ? 'bg-blue-50/90 border-blue-200 text-blue-800' : ''}
            `}
          >
            <OwnerIcon 
                name={
                    toast.type === 'success' ? 'CheckCircleIcon' : 
                    toast.type === 'error' ? 'ExclamationCircle' : 
                    toast.type === 'warning' ? 'ExclamationTriangleIcon' : 'Bell'
                } 
                className="w-5 h-5" 
            />
            <span className="text-sm font-bold">{toast.message}</span>
            <button type="button" onClick={() => removeToast(toast.id)} className="ml-auto hover:opacity-70">
                <OwnerIcon name="X" className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
};
