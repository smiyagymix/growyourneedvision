import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { interpolate } from '../../../lib/remotion-utils';

export interface WaveformProps {
    audioUrl: string;
    color: string;
    barCount: number;
    barWidth: number;
    barGap: number;
    height: number;
    position: { x: number; y: number };
}

export const AudioWaveform: React.FC<WaveformProps> = ({
    audioUrl,
    color,
    barCount,
    barWidth,
    barGap,
    height,
    position,
}) => {
    const frame = useCurrentFrame();
    const { durationInFrames } = useVideoConfig();

    const progress = frame / durationInFrames;

    // Simulate waveform data (in production, would use actual audio analysis)
    const generateWaveform = (): number[] => {
        const data: number[] = [];
        for (let i = 0; i < barCount; i++) {
            const time = (i / barCount) + progress;
            const amplitude = Math.abs(Math.sin(time * 10) * Math.cos(time * 3));
            data.push(amplitude);
        }
        return data;
    };

    const waveformData = generateWaveform();

    return (
        <div
            style={{
                position: 'absolute',
                left: position.x,
                top: position.y,
                display: 'flex',
                alignItems: 'flex-end',
                gap: barGap,
                height,
            }}
        >
            {waveformData.map((amplitude, index) => {
                const barHeight = interpolate(amplitude, [0, 1], [10, height]);

                return (
                    <div
                        key={index}
                        style={{
                            width: barWidth,
                            height: barHeight,
                            backgroundColor: color,
                            borderRadius: 2,
                            transition: 'height 0.1s ease-out',
                        }}
                    />
                );
            })}
        </div>
    );
};

export interface VolumeIndicatorProps {
    volume: number;
    color: string;
    position: { x: number; y: number };
}

export const VolumeIndicator: React.FC<VolumeIndicatorProps> = ({
    volume,
    color,
    position,
}) => {
    const frame = useCurrentFrame();

    const pulse = Math.sin(frame / 10) * 0.1 + 0.9;

    return (
        <div
            style={{
                position: 'absolute',
                left: position.x,
                top: position.y,
                width: 200,
                height: 20,
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                borderRadius: 10,
                overflow: 'hidden',
            }}
        >
            <div
                style={{
                    width: `${volume * 100}%`,
                    height: '100%',
                    backgroundColor: color,
                    transform: `scaleY(${pulse})`,
                    transformOrigin: 'center',
                    transition: 'width 0.2s ease-out',
                }}
            />
        </div>
    );
};
