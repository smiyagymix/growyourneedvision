import React from 'react';
import { useCurrentFrame } from 'remotion';
import { interpolate } from '../../../lib/remotion-utils';

export interface TextOverlayProps {
    text: string;
    position: { x: number; y: number };
    fontSize: number;
    fontFamily: string;
    color: string;
    backgroundColor?: string;
    startFrame: number;
    endFrame: number;
    animation?: 'fade' | 'slide' | 'zoom' | 'typewriter';
    strokeColor?: string;
    strokeWidth?: number;
}

export const TextOverlay: React.FC<TextOverlayProps> = ({
    text,
    position,
    fontSize,
    fontFamily,
    color,
    backgroundColor,
    startFrame,
    endFrame,
    animation = 'fade',
    strokeColor,
    strokeWidth = 0,
}) => {
    const frame = useCurrentFrame();

    if (frame < startFrame || frame > endFrame) {
        return null;
    }

    const animationDuration = 20;
    const enterProgress = interpolate(
        frame - startFrame,
        [0, animationDuration],
        [0, 1],
        { extrapolateRight: 'clamp' }
    );

    const exitProgress = interpolate(
        frame - (endFrame - animationDuration),
        [0, animationDuration],
        [1, 0],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    );

    const opacity = Math.min(enterProgress, exitProgress);

    let transform = '';
    let displayText = text;

    switch (animation) {
        case 'slide':
            const slideX = interpolate(enterProgress, [0, 1], [50, 0]);
            transform = `translateX(${slideX}px)`;
            break;
        case 'zoom':
            const scale = interpolate(enterProgress, [0, 1], [0.5, 1]);
            transform = `scale(${scale})`;
            break;
        case 'typewriter':
            const visibleChars = Math.floor(enterProgress * text.length);
            displayText = text.slice(0, visibleChars);
            break;
    }

    const textStyle: React.CSSProperties = {
        position: 'absolute',
        left: position.x,
        top: position.y,
        fontSize,
        fontFamily,
        color,
        opacity,
        transform,
        fontWeight: 'bold',
        ...(strokeColor && {
            WebkitTextStroke: `${strokeWidth}px ${strokeColor}`,
        }),
        ...(backgroundColor && {
            backgroundColor,
            padding: '10px 20px',
            borderRadius: '8px',
        }),
    };

    return <div style={textStyle}>{displayText}</div>;
};

export class TextOverlayManager {
    static create(props: Omit<TextOverlayProps, 'animation'>): TextOverlayProps {
        return {
            ...props,
            animation: 'fade',
        };
    }

    static withAnimation(
        overlay: TextOverlayProps,
        animation: TextOverlayProps['animation']
    ): TextOverlayProps {
        return { ...overlay, animation };
    }

    static withStroke(
        overlay: TextOverlayProps,
        strokeColor: string,
        strokeWidth: number
    ): TextOverlayProps {
        return { ...overlay, strokeColor, strokeWidth };
    }
}
