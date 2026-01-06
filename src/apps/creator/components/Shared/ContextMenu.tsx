import React, { useEffect, useRef } from 'react';

interface ContextMenuProps {
  x: number;
  y: number;
  items: { label: string; action: () => void; shortcut?: string }[];
  onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, items, onClose }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="fixed bg-gray-800 border border-gray-700 rounded shadow-xl py-1 z-50 min-w-[160px]"
      style={{ left: x, top: y }}
    >
      {items.map((item, index) => (
        <button
          type="button"
          key={index}
          onClick={() => {
            item.action();
            onClose();
          }}
          className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 flex justify-between items-center"
        >
          <span>{item.label}</span>
          {item.shortcut && <span className="text-xs text-gray-500 ml-4">{item.shortcut}</span>}
        </button>
      ))}
    </div>
  );
};
