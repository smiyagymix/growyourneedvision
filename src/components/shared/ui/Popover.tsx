import React, { useState, useRef } from 'react';
import { useClickOutside } from '../../../hooks/useClickOutside';

interface PopoverProps {
  trigger: React.ReactNode;
  content: React.ReactNode;
  position?: 'bottom-left' | 'bottom-right' | 'top-center';
}

export const Popover: React.FC<PopoverProps> = ({ trigger, content, position = 'bottom-left' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useClickOutside(ref, () => setIsOpen(false));

  const positions = {
      'bottom-left': 'top-full left-0 mt-2',
      'bottom-right': 'top-full right-0 mt-2',
      'top-center': 'bottom-full left-1/2 -translate-x-1/2 mb-2'
  };

  return (
    <div className="relative inline-block" ref={ref}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {trigger}
      </div>
      {isOpen && (
        <div className={`absolute z-50 min-w-[200px] bg-white rounded-xl shadow-xl border border-gray-100 animate-fadeIn ${positions[position]}`}>
          {content}
        </div>
      )}
    </div>
  );
};