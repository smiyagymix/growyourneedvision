import React from 'react';
import { Eye, EyeOff, Lock, Unlock, ChevronRight, ChevronDown } from 'lucide-react';
import { Layer } from '../../types/editor';

interface LayerItemProps {
  layer: Layer;
  isSelected: boolean;
  onSelect: (id: string, multi: boolean) => void;
  onToggleVisibility: (id: string) => void;
  onToggleLock: (id: string) => void;
  depth?: number;
}

export const LayerItem: React.FC<LayerItemProps> = ({ 
  layer, isSelected, onSelect, onToggleVisibility, onToggleLock, depth = 0 
}) => {
  return (
    <div 
      className={`flex items-center px-2 py-1 text-xs border-b border-gray-800 cursor-pointer hover:bg-gray-800 ${isSelected ? 'bg-blue-900/30 border-blue-800' : ''}`}
      style={{ paddingLeft: `${depth * 12 + 8}px` }}
      onClick={(e) => onSelect(layer.id, e.ctrlKey || e.metaKey)}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {layer.type === 'group' && (
          <ChevronRight size={12} className="text-gray-500" />
        )}
        <span className="truncate text-gray-300">{layer.name}</span>
      </div>
      
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          type="button"
          onClick={(e) => { e.stopPropagation(); onToggleLock(layer.id); }}
          className="p-1 hover:text-white text-gray-500"
        >
          {layer.locked ? <Lock size={12} /> : <Unlock size={12} />}
        </button>
        <button 
          type="button"
          onClick={(e) => { e.stopPropagation(); onToggleVisibility(layer.id); }}
          className="p-1 hover:text-white text-gray-500"
        >
          {layer.visible ? <Eye size={12} /> : <EyeOff size={12} />}
        </button>
      </div>
    </div>
  );
};
