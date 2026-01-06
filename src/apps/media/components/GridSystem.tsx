import React from 'react';

export interface GridProps {
    enabled: boolean;
    type: 'rule-of-thirds' | 'grid' | 'center' | 'golden-ratio';
    color: string;
    opacity: number;
}

export const GridOverlay: React.FC<GridProps> = ({ enabled, type, color, opacity }) => {
    if (!enabled) return null;

    const renderGrid = () => {
        switch (type) {
            case 'rule-of-thirds':
                return (
                    <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
                        {/* Vertical lines */}
                        <line x1="33.33%" y1="0%" x2="33.33%" y2="100%" stroke={color} strokeWidth="1" opacity={opacity} />
                        <line x1="66.66%" y1="0%" x2="66.66%" y2="100%" stroke={color} strokeWidth="1" opacity={opacity} />
                        {/* Horizontal lines */}
                        <line x1="0%" y1="33.33%" x2="100%" y2="33.33%" stroke={color} strokeWidth="1" opacity={opacity} />
                        <line x1="0%" y1="66.66%" x2="100%" y2="66.66%" stroke={color} strokeWidth="1" opacity={opacity} />
                    </svg>
                );

            case 'grid':
                return (
                    <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
                        {Array.from({ length: 9 }, (_, i) => (
                            <line
                                key={`v-${i}`}
                                x1={`${(i + 1) * 10}%`}
                                y1="0%"
                                x2={`${(i + 1) * 10}%`}
                                y2="100%"
                                stroke={color}
                                strokeWidth="1"
                                opacity={opacity}
                            />
                        ))}
                        {Array.from({ length: 9 }, (_, i) => (
                            <line
                                key={`h-${i}`}
                                x1="0%"
                                y1={`${(i + 1) * 10}%`}
                                x2="100%"
                                y2={`${(i + 1) * 10}%`}
                                stroke={color}
                                strokeWidth="1"
                                opacity={opacity}
                            />
                        ))}
                    </svg>
                );

            case 'center':
                return (
                    <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
                        <line x1="50%" y1="0%" x2="50%" y2="100%" stroke={color} strokeWidth="2" opacity={opacity} />
                        <line x1="0%" y1="50%" x2="100%" y2="50%" stroke={color} strokeWidth="2" opacity={opacity} />
                        <circle cx="50%" cy="50%" r="5" fill={color} opacity={opacity} />
                    </svg>
                );

            case 'golden-ratio':
                const phi = 1.618;
                const goldenX = (1 / phi) * 100;
                const goldenY = (1 / phi) * 100;

                return (
                    <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
                        <line x1={`${goldenX}%`} y1="0%" x2={`${goldenX}%`} y2="100%" stroke={color} strokeWidth="1" opacity={opacity} />
                        <line x1={`${100 - goldenX}%`} y1="0%" x2={`${100 - goldenX}%`} y2="100%" stroke={color} strokeWidth="1" opacity={opacity} />
                        <line x1="0%" y1={`${goldenY}%`} x2="100%" y2={`${goldenY}%`} stroke={color} strokeWidth="1" opacity={opacity} />
                        <line x1="0%" y1={`${100 - goldenY}%`} x2="100%" y2={`${100 - goldenY}%`} stroke={color} strokeWidth="1" opacity={opacity} />
                    </svg>
                );

            default:
                return null;
        }
    };

    return (
        <div style={{ position: 'absolute', width: '100%', height: '100%', pointerEvents: 'none' }}>
            {renderGrid()}
        </div>
    );
};

export interface SafeZone {
    title: string;
    percentage: number;
}

export const SAFE_ZONES: SafeZone[] = [
    { title: 'Action Safe (90%)', percentage: 90 },
    { title: 'Title Safe (80%)', percentage: 80 },
];

export const SafeZoneOverlay: React.FC<{ zone: SafeZone; color: string }> = ({ zone, color }) => {
    const offset = ((100 - zone.percentage) / 2);

    return (
        <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
            <rect
                x={`${offset}%`}
                y={`${offset}%`}
                width={`${zone.percentage}%`}
                height={`${zone.percentage}%`}
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeDasharray="5,5"
                opacity="0.5"
            />
        </svg>
    );
};
