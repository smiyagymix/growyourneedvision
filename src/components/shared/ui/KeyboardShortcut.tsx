import React from 'react';

interface KeyboardShortcutProps {
  keys: string[];
}

export const KeyboardShortcut: React.FC<KeyboardShortcutProps> = ({ keys }) => {
  return (
    <div className="flex items-center gap-1">
      {keys.map((k, i) => (
        <React.Fragment key={i}>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-bold text-gray-500 bg-gray-100 border border-gray-300 rounded shadow-[0_1px_0_rgba(0,0,0,0.1)] uppercase font-mono">
                {k}
            </kbd>
            {i < keys.length - 1 && <span className="text-xs text-gray-400">+</span>}
        </React.Fragment>
      ))}
    </div>
  );
};