import React from 'react';
import { useCurrentFrame } from 'remotion';
import { interpolate } from '../../../lib/remotion-utils';

export interface ParticleProps {
    x: number;
    y: number;
    size: number;
    color: string;
    lifetime: number;
    velocity: { x: number; y: number };
}

export interface ParticleSystemProps {
    particleCount: number;
    startFrame: number;
    endFrame: number;
    emitterPosition: { x: number; y: number };
    colors: string[];
}

export const ParticleSystem: React.FC<ParticleSystemProps> = ({
    particleCount,
    startFrame,
    endFrame,
    emitterPosition,
    colors,
}) => {
    const frame = useCurrentFrame();

    if (frame < startFrame || frame > endFrame) {
        return null;
    }

    const particles: ParticleProps[] = [];

    for (let i = 0; i < particleCount; i++) {
        const birthFrame = startFrame + (i / particleCount) * 20;
        const age = frame - birthFrame;

        if (age < 0) continue;

        const lifetime = 60;
        const progress = Math.min(1, age / lifetime);

        const angle = (Math.PI * 2 * i) / particleCount;
        const spread = 200;

        particles.push({
            x: emitterPosition.x + Math.cos(angle) * spread * progress,
            y: emitterPosition.y + Math.sin(angle) * spread * progress - (age * 2),
            size: interpolate(progress, [0, 0.3, 1], [0, 20, 0]),
            color: colors[i % colors.length],
            lifetime,
            velocity: {
                x: Math.cos(angle) * 5,
                y: Math.sin(angle) * 5 - 2,
            },
        });
    }

    return (
        <div style={{ position: 'absolute', width: '100%', height: '100%', pointerEvents: 'none' }}>
            {particles.map((particle, index) => (
                <div
                    key={index}
                    style={{
                        position: 'absolute',
                        left: particle.x,
                        top: particle.y,
                        width: particle.size,
                        height: particle.size,
                        borderRadius: '50%',
                        backgroundColor: particle.color,
                        opacity: interpolate(
                            (frame - (startFrame + (index / particleCount) * 20)) / particle.lifetime,
                            [0, 0.5, 1],
                            [0, 1, 0]
                        ),
                    }}
                />
            ))}
        </div>
    );
};
