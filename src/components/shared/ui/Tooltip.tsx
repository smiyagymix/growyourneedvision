
import React, { useState } from 'react';

interface TooltipProps {
  text: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const Tooltip: React.FC<TooltipProps> = ({ text, children, position = 'top' }) => {
  const [isVisible, setIsVisible] = useState(false);

  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className={`absolute z-50 px-2 py-1 text-xs font-bold text-white bg-black/90 rounded shadow-lg whitespace-nowrap animate-fadeIn ${positions[position]}`}>
          {text}
          <div className={`absolute w-2 h-2 bg-black/90 rotate-45 
            ${position === 'top' ? 'bottom-[-3px] left-1/2 -translate-x-1/2' : ''}
            ${position === 'bottom' ? 'top-[-3px] left-1/2 -translate-x-1/2' : ''}
            ${position === 'left' ? 'right-[-3px] top-1/2 -translate-y-1/2' : ''}
            ${position === 'right' ? 'left-[-3px] top-1/2 -translate-y-1/2' : ''}
          `}></div>
        </div>
      )}
    </div>
  );
};
