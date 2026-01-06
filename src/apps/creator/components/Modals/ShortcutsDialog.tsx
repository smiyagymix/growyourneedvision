import React from 'react';
import { X } from 'lucide-react';

interface ShortcutsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { key: 'V', action: 'Select Tool' },
  { key: 'R', action: 'Rectangle Tool' },
  { key: 'O', action: 'Circle Tool' },
  { key: 'T', action: 'Text Tool' },
  { key: 'P', action: 'Pen Tool' },
  { key: 'H', action: 'Hand Tool' },
  { key: 'Space', action: 'Pan Canvas' },
  { key: 'Ctrl + Z', action: 'Undo' },
  { key: 'Ctrl + Shift + Z', action: 'Redo' },
  { key: 'Delete', action: 'Delete Selection' },
  { key: 'Ctrl + C', action: 'Copy' },
  { key: 'Ctrl + V', action: 'Paste' },
  { key: 'Ctrl + G', action: 'Group' },
  { key: 'Ctrl + Shift + G', action: 'Ungroup' },
];

export const ShortcutsDialog: React.FC<ShortcutsDialogProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#1f1f22] border border-[#27272a] rounded-lg w-[500px] shadow-2xl max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-[#27272a]">
          <h3 className="text-sm font-bold text-white">Keyboard Shortcuts</h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={16} />
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-4">
            {SHORTCUTS.map((shortcut, index) => (
              <div key={index} className="flex justify-between items-center p-2 bg-gray-800/50 rounded">
                <span className="text-xs text-gray-300">{shortcut.action}</span>
                <kbd className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-200 font-mono border border-gray-600">
                  {shortcut.key}
                </kbd>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
