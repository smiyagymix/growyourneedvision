
import React, { useState, useEffect } from 'react';
import { OwnerIcon } from '../OwnerIcons';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            // This logic usually lifts state up, assuming simple toggle here
        }
        if (e.key === 'Escape' && isOpen) {
            onClose();
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh] bg-black/60 backdrop-blur-sm animate-fadeIn">
        <div className="w-full max-w-xl bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col animate-scaleIn">
            <div className="flex items-center px-4 border-b border-gray-100">
                <OwnerIcon name="SearchIcon" className="w-5 h-5 text-gray-400" />
                <input 
                    autoFocus
                    className="w-full p-4 text-lg bg-transparent border-none focus:outline-none text-gray-800 placeholder-gray-400"
                    placeholder="Type a command or search..."
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                />
                <button type="button" onClick={onClose} className="text-xs bg-gray-100 px-2 py-1 rounded border border-gray-200 text-gray-500">ESC</button>
            </div>
            <div className="max-h-[300px] overflow-y-auto p-2">
                <div className="text-xs font-bold text-gray-400 px-3 py-2 uppercase tracking-wider">Suggestions</div>
                {['Go to Dashboard', 'Create New Tenant', 'View Analytics', 'System Settings'].map((cmd, i) => (
                    <button type="button" key={i} className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-gyn-blue-medium hover:text-white transition-colors flex items-center gap-3 text-sm text-gray-700 group">
                        <OwnerIcon name={i % 2 === 0 ? 'ArrowRightIcon' : 'CogIcon'} className="w-4 h-4 text-gray-400 group-hover:text-white" />
                        {cmd}
                    </button>
                ))}
            </div>
            <div className="p-2 bg-gray-50 border-t border-gray-100 text-xs text-gray-500 flex justify-between px-4">
                <span><strong>↑↓</strong> to navigate</span>
                <span><strong>↵</strong> to select</span>
            </div>
        </div>
    </div>
  );
};
