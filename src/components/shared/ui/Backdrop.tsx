
import React from 'react';

interface BackdropProps {
  onClick?: () => void;
  blur?: boolean;
  opacity?: 'light' | 'medium' | 'dark';
  zIndex?: number;
}

export const Backdrop: React.FC<BackdropProps> = ({ 
  onClick, 
  blur = true, 
  opacity = 'medium',
  zIndex = 40 
}) => {
  const opacityClasses = {
    light: 'bg-black/20',
    medium: 'bg-black/40',
    dark: 'bg-black/70',
  };

  return (
    <div
      onClick={onClick}
      className={`fixed inset-0 ${opacityClasses[opacity]} ${blur ? 'backdrop-blur-sm' : ''} transition-opacity animate-fadeIn`}
      style={{ zIndex }}
    />
  );
};
