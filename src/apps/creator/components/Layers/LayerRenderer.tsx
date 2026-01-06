import React from 'react';
import { Layer } from '../../types/editor';
import { TextLayer } from './TextLayer';
import { ShapeLayer } from './ShapeLayer';
import { ImageLayer } from './ImageLayer';
import { GroupLayer } from './GroupLayer';

interface LayerRendererProps {
  layer: Layer;
}

export const LayerRenderer: React.FC<LayerRendererProps> = React.memo(({ layer }) => {
  const style: React.CSSProperties = {
    position: 'absolute',
    left: layer.x,
    top: layer.y,
    width: layer.width,
    height: layer.height,
    transform: `rotate(${layer.rotation || 0}deg)`,
    zIndex: layer.index || 0,
    // We don't handle selection borders here, that's for the SelectionOverlay
  };

  const renderContent = () => {
    switch (layer.type) {
      case 'text':
        return <TextLayer layer={layer} />;
      case 'rect':
      case 'circle':
        return <ShapeLayer layer={layer} />;
      case 'image':
        return <ImageLayer layer={layer} />;
      case 'group':
        return <GroupLayer layer={layer} />;
      default:
        return null;
    }
  };

  return (
    <div className="absolute" style={style} data-layer-id={layer.id}>
      {renderContent()}
    </div>
  );
});
