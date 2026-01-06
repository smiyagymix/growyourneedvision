import React from 'react';
import { Layer } from '../../types/editor';

interface ShapeLayerProps {
  layer: Layer;
}

export const ShapeLayer: React.FC<ShapeLayerProps> = ({ layer }) => {
  // SVG-based rendering for complex shapes
  if (['triangle', 'star', 'polygon', 'arrow', 'line'].includes(layer.type)) {
    return (
      <svg
        width="100%"
        height="100%"
        style={{ opacity: layer.opacity ?? 1, pointerEvents: 'none' }}
      >
        {layer.type === 'triangle' && (
          <polygon
            points={`${layer.width / 2},0 ${layer.width},${layer.height} 0,${layer.height}`}
            fill={layer.fill || '#cccccc'}
            stroke={layer.stroke}
            strokeWidth={layer.strokeWidth || 1}
            strokeDasharray={layer.strokeDashArray}
            strokeLinecap={layer.strokeLineCap}
          />
        )}
        {layer.type === 'star' && (
          <polygon
            points={generateStarPoints(layer.width, layer.height, layer.points || 5, layer.innerRadius || 0.5)}
            fill={layer.fill || '#cccccc'}
            stroke={layer.stroke}
            strokeWidth={layer.strokeWidth || 1}
            strokeDasharray={layer.strokeDashArray}
          />
        )}
        {layer.type === 'polygon' && (
          <polygon
            points={generatePolygonPoints(layer.width, layer.height, layer.sides || 6)}
            fill={layer.fill || '#cccccc'}
            stroke={layer.stroke}
            strokeWidth={layer.strokeWidth || 1}
            strokeDasharray={layer.strokeDashArray}
          />
        )}
        {layer.type === 'arrow' && (
          <g>
            <line
              x1="0"
              y1={layer.height / 2}
              x2={layer.width - 20}
              y2={layer.height / 2}
              stroke={layer.stroke || '#000'}
              strokeWidth={layer.strokeWidth || 2}
              strokeLinecap="round"
            />
            <polygon
              points={`${layer.width},${layer.height / 2} ${layer.width - 20},${layer.height / 2 - 10} ${layer.width - 20},${layer.height / 2 + 10}`}
              fill={layer.stroke || '#000'}
            />
            {layer.arrowType === 'double' && (
              <polygon
                points={`0,${layer.height / 2} 20,${layer.height / 2 - 10} 20,${layer.height / 2 + 10}`}
                fill={layer.stroke || '#000'}
              />
            )}
          </g>
        )}
        {layer.type === 'line' && (
          <line
            x1="0"
            y1={layer.lineType === 'curved' ? layer.height / 2 : 0}
            x2={layer.width}
            y2={layer.lineType === 'curved' ? layer.height / 2 : layer.height}
            stroke={layer.stroke || '#000'}
            strokeWidth={layer.strokeWidth || 2}
            strokeDasharray={layer.strokeDashArray}
            strokeLinecap={layer.strokeLineCap || 'round'}
          />
        )}
        {layer.gradient && (
          <defs>
            <linearGradient id={`gradient-${layer.id}`} gradientTransform={`rotate(${layer.gradient.angle || 0})`}>
              {layer.gradient.stops.map((stop, i) => (
                <stop key={i} offset={`${stop.offset * 100}%`} stopColor={stop.color} />
              ))}
            </linearGradient>
          </defs>
        )}
      </svg>
    );
  }

  // CSS-based rendering for simple shapes
  const style: React.CSSProperties = {
    width: '100%',
    height: '100%',
    backgroundColor: layer.gradient ? undefined : (layer.fill || '#cccccc'),
    backgroundImage: layer.gradient ? `linear-gradient(${layer.gradient.angle || 0}deg, ${layer.gradient.stops.map(s => `${s.color} ${s.offset * 100}%`).join(', ')})` : undefined,
    border: layer.stroke ? `${layer.strokeWidth || 1}px ${layer.strokeDashArray ? 'dashed' : 'solid'} ${layer.stroke}` : 'none',
    opacity: layer.opacity ?? 1,
    borderRadius: layer.type === 'circle' ? '50%' : (layer.type === 'ellipse' ? '50%' : layer.borderRadius || 0),
    pointerEvents: 'none',
  };

  return <div style={style} />;
};

// Helper functions
function generateStarPoints(width: number, height: number, points: number, innerRadius: number): string {
  const outerRadius = Math.min(width, height) / 2;
  const innerR = outerRadius * innerRadius;
  const centerX = width / 2;
  const centerY = height / 2;
  const coords: string[] = [];

  for (let i = 0; i < points * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerR;
    const angle = (Math.PI * i) / points - Math.PI / 2;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    coords.push(`${x},${y}`);
  }

  return coords.join(' ');
}

function generatePolygonPoints(width: number, height: number, sides: number): string {
  const radius = Math.min(width, height) / 2;
  const centerX = width / 2;
  const centerY = height / 2;
  const coords: string[] = [];

  for (let i = 0; i < sides; i++) {
    const angle = (2 * Math.PI * i) / sides - Math.PI / 2;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    coords.push(`${x},${y}`);
  }

  return coords.join(' ');
}
