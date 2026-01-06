import React from 'react';
import { Layer } from '../../types/editor';

interface TextLayerProps {
  layer: Layer;
}

export const TextLayer: React.FC<TextLayerProps> = ({ layer }) => {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        color: layer.fill || '#000000',
        fontSize: layer.fontSize || 16,
        fontFamily: layer.fontFamily || 'Inter',
        fontWeight: layer.fontWeight || 'normal',
        fontStyle: layer.fontStyle || 'normal',
        textAlign: layer.textAlign || 'left',
        textDecoration: layer.textDecoration || 'none',
        opacity: layer.opacity ?? 1,
        display: 'flex',
        alignItems: 'center', // Basic alignment
        justifyContent: layer.textAlign === 'center' ? 'center' : layer.textAlign === 'right' ? 'flex-end' : 'flex-start',
        whiteSpace: 'pre-wrap',
        pointerEvents: 'none', // Let events pass through to the selection overlay
      }}
    >
      {layer.text || 'Double click to edit'}
    </div>
  );
};
