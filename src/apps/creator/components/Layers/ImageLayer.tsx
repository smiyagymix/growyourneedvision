import React from 'react';
import { Layer } from '../../types/editor';

interface ImageLayerProps {
  layer: Layer;
}

export const ImageLayer: React.FC<ImageLayerProps> = ({ layer }) => {
  return (
    <img
      src={layer.src}
      alt={layer.name}
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        opacity: layer.opacity ?? 1,
        pointerEvents: 'none',
        borderRadius: layer.borderRadius || 0,
      }}
      draggable={false}
    />
  );
};
