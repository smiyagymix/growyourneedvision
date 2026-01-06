import React from 'react';
import { Copy, Trash2, Lock, EyeOff } from 'lucide-react';

interface LayerActionsProps {
  onDuplicate: () => void;
  onDelete: () => void;
  onLock: () => void;
  onHide: () => void;
  hasSelection: boolean;
}

export const LayerActions: React.FC<LayerActionsProps> = ({
  onDuplicate, onDelete, onLock, onHide, hasSelection
}) => {
  return (
    <div className="flex items-center justify-between px-2 py-1 border-b border-gray-800 bg-gray-900">
      <button 
        type="button"
        onClick={onDuplicate}
        disabled={!hasSelection}
        className="p-1.5 text-gray-400 hover:text-white disabled:opacity-30"
        title="Duplicate"
      >
        <Copy size={14} />
      </button>
      <button 
        type="button"
        onClick={onLock}
        disabled={!hasSelection}
        className="p-1.5 text-gray-400 hover:text-white disabled:opacity-30"
        title="Lock"
      >
        <Lock size={14} />
      </button>
      <button 
        type="button"
        onClick={onHide}
        disabled={!hasSelection}
        className="p-1.5 text-gray-400 hover:text-white disabled:opacity-30"
        title="Hide"
      >
        <EyeOff size={14} />
      </button>
      <button 
        type="button"
        onClick={onDelete}
        disabled={!hasSelection}
        className="p-1.5 text-gray-400 hover:text-red-400 disabled:opacity-30"
        title="Delete"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
};
