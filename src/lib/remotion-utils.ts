import * as Remotion from 'remotion';

export const interpolate = (Remotion as any).interpolate as (
    input: number,
    inputRange: readonly number[],
    outputRange: readonly number[],
    options?: {
        extrapolateLeft?: 'clamp' | 'identity' | 'extend';
        extrapolateRight?: 'clamp' | 'identity' | 'extend';
        easing?: (t: number) => number;
    }
) => number;

export const spring = (Remotion as any).spring as (config: {
    frame: number;
    fps: number;
    config?: {
        damping?: number;
        mass?: number;
        stiffness?: number;
        overshootClamping?: boolean;
    };
    from?: number;
    to?: number;
    durationInFrames?: number;
    delay?: number;
}) => number;
