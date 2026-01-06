import React from 'react';

export type ShapeType = 'rectangle' | 'circle' | 'triangle' | 'line' | 'arrow' | 'star';

export interface ShapeProps {
    type: ShapeType;
    position: { x: number; y: number };
    size: { width: number; height: number };
    fill: string;
    stroke?: string;
    strokeWidth?: number;
    opacity?: number;
    rotation?: number;
}

export const Shape: React.FC<ShapeProps> = ({
    type,
    position,
    size,
    fill,
    stroke,
    strokeWidth = 2,
    opacity = 1,
    rotation = 0,
}) => {
    const renderShape = () => {
        switch (type) {
            case 'rectangle':
                return (
                    <div
                        style={{
                            width: size.width,
                            height: size.height,
                            backgroundColor: fill,
                            border: stroke ? `${strokeWidth}px solid ${stroke}` : 'none',
                        }}
                    />
                );

            case 'circle':
                return (
                    <div
                        style={{
                            width: size.width,
                            height: size.width,
                            borderRadius: '50%',
                            backgroundColor: fill,
                            border: stroke ? `${strokeWidth}px solid ${stroke}` : 'none',
                        }}
                    />
                );

            case 'triangle':
                return (
                    <div
                        style={{
                            width: 0,
                            height: 0,
                            borderLeft: `${size.width / 2}px solid transparent`,
                            borderRight: `${size.width / 2}px solid transparent`,
                            borderBottom: `${size.height}px solid ${fill}`,
                        }}
                    />
                );

            case 'line':
                return (
                    <div
                        style={{
                            width: size.width,
                            height: strokeWidth,
                            backgroundColor: fill,
                        }}
                    />
                );

            case 'arrow':
                return (
                    <svg width={size.width} height={size.height}>
                        <defs>
                            <marker
                                id="arrowhead"
                                markerWidth="10"
                                markerHeight="10"
                                refX="5"
                                refY="5"
                                orient="auto"
                            >
                                <polygon points="0 0, 10 5, 0 10" fill={fill} />
                            </marker>
                        </defs>
                        <line
                            x1="0"
                            y1={size.height / 2}
                            x2={size.width}
                            y2={size.height / 2}
                            stroke={fill}
                            strokeWidth={strokeWidth}
                            markerEnd="url(#arrowhead)"
                        />
                    </svg>
                );

            case 'star':
                return (
                    <svg width={size.width} height={size.height} viewBox="0 0 100 100">
                        <polygon
                            points="50,10 61,35 90,35 67,55 78,90 50,70 22,90 33,55 10,35 39,35"
                            fill={fill}
                            stroke={stroke}
                            strokeWidth={strokeWidth}
                        />
                    </svg>
                );

            default:
                return null;
        }
    };

    return (
        <div
            style={{
                position: 'absolute',
                left: position.x,
                top: position.y,
                opacity,
                transform: `rotate(${rotation}deg)`,
            }}
        >
            {renderShape()}
        </div>
    );
};

export interface ShapeOverlayProps {
    shapes: (ShapeProps & { id: string })[];
}

export const ShapeOverlay: React.FC<ShapeOverlayProps> = ({ shapes }) => {
    return (
        <div style={{ position: 'absolute', width: '100%', height: '100%', pointerEvents: 'none' }}>
            {shapes.map(shape => (
                <Shape key={shape.id} {...shape} />
            ))}
        </div>
    );
};

export class ShapeLibrary {
    static createCallout(position: { x: number; y: number }, text: string, color: string): (ShapeProps & { id: string })[] {
        return [
            {
                id: `callout-bg-${Date.now()}`,
                type: 'rectangle',
                position,
                size: { width: 200, height: 60 },
                fill: color,
                opacity: 0.9,
            },
            {
                id: `callout-arrow-${Date.now()}`,
                type: 'triangle',
                position: { x: position.x + 90, y: position.y + 60 },
                size: { width: 20, height: 15 },
                fill: color,
                opacity: 0.9,
            },
        ];
    }

    static createHighlight(position: { x: number; y: number }, size: { width: number; height: number }): ShapeProps & { id: string } {
        return {
            id: `highlight-${Date.now()}`,
            type: 'rectangle',
            position,
            size,
            fill: 'transparent',
            stroke: '#ffff00',
            strokeWidth: 4,
            opacity: 0.8,
        };
    }

    static createBadge(position: { x: number; y: number }, color: string): ShapeProps & { id: string } {
        return {
            id: `badge-${Date.now()}`,
            type: 'star',
            position,
            size: { width: 60, height: 60 },
            fill: color,
            opacity: 1,
        };
    }
}
