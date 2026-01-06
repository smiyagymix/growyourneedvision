import React from 'react';
import { Layer } from '../../types/editor';
import { LayerItem } from './LayerItem';

interface LayerListProps {
  layers: Layer[];
  selectedIds: string[];
  onSelect: (id: string, multi: boolean) => void;
  onToggleVisibility: (id: string) => void;
  onToggleLock: (id: string) => void;
}

export const LayerList: React.FC<LayerListProps> = ({
  layers, selectedIds, onSelect, onToggleVisibility, onToggleLock
}) => {
  // Reverse layers for display so top layer is at top of list
  const displayLayers = [...layers].reverse();

  return (
    <div className="flex-1 overflow-y-auto">
      {displayLayers.map((layer) => (
        <LayerItem
          key={layer.id}
          layer={layer}
          isSelected={selectedIds.includes(layer.id)}
          onSelect={onSelect}
          onToggleVisibility={onToggleVisibility}
          onToggleLock={onToggleLock}
        />
      ))}
      {layers.length === 0 && (
        <div className="p-4 text-center text-gray-500 text-xs">
          No layers
        </div>
      )}
    </div>
  );
};
