import React from 'react';
import { Layer } from '../../types/editor';
import { LayerRenderer } from './LayerRenderer';

interface GroupLayerProps {
  layer: Layer;
}

export const GroupLayer: React.FC<GroupLayerProps> = ({ layer }) => {
  // Groups render their children relative to the group's position
  // But in our flat layer model, children might be stored differently.
  // Assuming children are in layer.children for this implementation.
  
  if (!layer.children) return null;

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', opacity: layer.opacity ?? 1 }}>
      {layer.children.map((child) => (
        <LayerRenderer key={child.id} layer={child} />
      ))}
    </div>
  );
};
