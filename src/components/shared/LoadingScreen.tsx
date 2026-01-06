import React from 'react';
import { Spinner } from './ui/Spinner';

interface LoadingScreenProps {
  message?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ message = 'Loading...' }) => {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
      <Spinner size="lg" className="text-gyn-blue-medium" />
      <p className="mt-4 text-gray-500 font-medium animate-pulse">{message}</p>
    </div>
  );
};
