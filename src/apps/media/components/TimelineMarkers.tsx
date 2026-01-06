import React from 'react';

export interface TimelineMarker {
    id: string;
    frame: number;
    label: string;
    color: string;
    type: 'scene' | 'cut' | 'note' | 'custom';
}

export interface TimelineMarkersProps {
    markers: TimelineMarker[];
    durationInFrames: number;
    onMarkerClick?: (marker: TimelineMarker) => void;
}

export const TimelineMarkers: React.FC<TimelineMarkersProps> = ({
    markers,
    durationInFrames,
    onMarkerClick,
}) => {
    return (
        <div style={{ position: 'relative', width: '100%', height: '30px' }}>
            {markers.map(marker => {
                const position = (marker.frame / durationInFrames) * 100;

                return (
                    <div
                        key={marker.id}
                        onClick={() => onMarkerClick?.(marker)}
                        style={{
                            position: 'absolute',
                            left: `${position}%`,
                            top: 0,
                            width: '2px',
                            height: '100%',
                            backgroundColor: marker.color,
                            cursor: 'pointer',
                        }}
                        title={marker.label}
                    >
                        <div
                            style={{
                                position: 'absolute',
                                top: '-20px',
                                left: '-10px',
                                width: '20px',
                                height: '20px',
                                borderRadius: '50%',
                                backgroundColor: marker.color,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '10px',
                                color: 'white',
                                fontWeight: 'bold',
                            }}
                        >
                            {marker.type === 'scene' ? 'S' : marker.type === 'cut' ? 'C' : 'N'}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export class MarkerManager {
    static createMarker(
        frame: number,
        label: string,
        type: TimelineMarker['type'] = 'custom',
        color: string = '#3b82f6'
    ): TimelineMarker {
        return {
            id: `marker-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            frame,
            label,
            color,
            type,
        };
    }

    static sortMarkers(markers: TimelineMarker[]): TimelineMarker[] {
        return [...markers].sort((a, b) => a.frame - b.frame);
    }

    static getMarkerAt(markers: TimelineMarker[], frame: number, tolerance: number = 5): TimelineMarker | null {
        return markers.find(m => Math.abs(m.frame - frame) <= tolerance) || null;
    }

    static getMarkersBetween(markers: TimelineMarker[], startFrame: number, endFrame: number): TimelineMarker[] {
        return markers.filter(m => m.frame >= startFrame && m.frame <= endFrame);
    }

    static exportMarkers(markers: TimelineMarker[], fps: number): string {
        return markers.map(m => {
            const time = m.frame / fps;
            return `${time.toFixed(2)}s - ${m.label} (${m.type})`;
        }).join('\n');
    }

    static importMarkers(data: string, fps: number): TimelineMarker[] {
        const lines = data.split('\n');
        const markers: TimelineMarker[] = [];

        lines.forEach(line => {
            const match = line.match(/^([\d.]+)s - (.+) \((\w+)\)$/);
            if (match) {
                const [, timeStr, label, type] = match;
                const frame = Math.round(parseFloat(timeStr) * fps);
                markers.push(this.createMarker(frame, label, type as TimelineMarker['type']));
            }
        });

        return markers;
    }
}
