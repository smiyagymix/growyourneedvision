import React, { useState, useRef } from 'react';
import { useClickOutside } from '../../../hooks/useClickOutside';
import { OwnerIcon } from '../OwnerIcons';

interface DropdownItem {
  label: string;
  icon?: string;
  onClick: () => void;
  danger?: boolean;
}

interface DropdownMenuProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  align?: 'left' | 'right';
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({ trigger, items, align = 'left' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useClickOutside(ref, () => setIsOpen(false));

  return (
    <div className="relative inline-block text-left" ref={ref}>
      <div onClick={() => setIsOpen(!isOpen)}>
        {trigger}
      </div>

      {isOpen && (
        <div 
            className={`absolute z-50 mt-2 w-56 rounded-xl bg-white shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none animate-scaleIn ${align === 'right' ? 'right-0' : 'left-0'}`}
        >
          <div className="py-1 p-1">
            {items.map((item, index) => (
              <button
                type="button"
                key={index}
                onClick={() => {
                    item.onClick();
                    setIsOpen(false);
                }}
                className={`group flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${item.danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700 hover:bg-gray-100 hover:text-gyn-blue-dark'}`}
              >
                {item.icon && (
                  <OwnerIcon name={item.icon} className={`mr-3 h-4 w-4 ${item.danger ? 'text-red-500' : 'text-gray-400 group-hover:text-gyn-blue-medium'}`} />
                )}
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};