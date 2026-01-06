import React, { useState, useEffect, useRef } from 'react';
import { useClickOutside } from '../../../hooks/useClickOutside';

interface ContextMenuItem {
  label: string;
  action: () => void;
  danger?: boolean;
}

interface ContextMenuProps {
  children: React.ReactNode;
  items: ContextMenuItem[];
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ children, items }) => {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const menuRef = useRef<HTMLDivElement>(null);

  useClickOutside(menuRef, () => setVisible(false));

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setVisible(true);
    setPosition({ x: e.pageX, y: e.pageY });
  };

  return (
    <div onContextMenu={handleContextMenu} className="relative">
      {children}
      {visible && (
        <div 
            ref={menuRef}
            className="fixed z-[100] w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1 animate-scaleIn"
            style={{ top: position.y, left: position.x }}
        >
            {items.map((item, idx) => (
                <button
                    type="button"
                    key={idx}
                    onClick={(e) => {
                        e.stopPropagation();
                        item.action();
                        setVisible(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${item.danger ? 'text-red-600' : 'text-gray-700'}`}
                >
                    {item.label}
                </button>
            ))}
        </div>
      )}
    </div>
  );
};