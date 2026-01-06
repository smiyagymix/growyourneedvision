import { interpolate } from 'remotion/no-react';

export interface MotionPreset {
    name: string;
    description: string;
    animate: (frame: number, duration: number) => React.CSSProperties;
}

export const MOTION_PRESETS: MotionPreset[] = [
    {
        name: 'Fade  In',
        description: 'Simple fade in animation',
        animate: (frame, duration) => ({
            opacity: interpolate(frame, [0, duration], [0, 1]),
        }),
    },
    {
        name: 'Slide In Left',
        description: 'Slide in from the left',
        animate: (frame, duration) => ({
            transform: `translateX(${interpolate(frame, [0, duration], [-100, 0])}px)`,
            opacity: interpolate(frame, [0, duration * 0.5], [0, 1]),
        }),
    },
    {
        name: 'Slide In Right',
        description: 'Slide in from the right',
        animate: (frame, duration) => ({
            transform: `translateX(${interpolate(frame, [0, duration], [100, 0])}px)`,
            opacity: interpolate(frame, [0, duration * 0.5], [0, 1]),
        }),
    },
    {
        name: 'Slide In Top',
        description: 'Slide in from the top',
        animate: (frame, duration) => ({
            transform: `translateY(${interpolate(frame, [0, duration], [-100, 0])}px)`,
            opacity: interpolate(frame, [0, duration * 0.5], [0, 1]),
        }),
    },
    {
        name: 'Slide In Bottom',
        description: 'Slide in from the bottom',
        animate: (frame, duration) => ({
            transform: `translateY(${interpolate(frame, [0, duration], [100, 0])}px)`,
            opacity: interpolate(frame, [0, duration * 0.5], [0, 1]),
        }),
    },
    {
        name: 'Zoom In',
        description: 'Zoom in from small',
        animate: (frame, duration) => ({
            transform: `scale(${interpolate(frame, [0, duration], [0.5, 1])})`,
            opacity: interpolate(frame, [0, duration * 0.3], [0, 1]),
        }),
    },
    {
        name: 'Zoom Out',
        description: 'Zoom out from large',
        animate: (frame, duration) => ({
            transform: `scale(${interpolate(frame, [0, duration], [1.5, 1])})`,
            opacity: interpolate(frame, [0, duration * 0.3], [0, 1]),
        }),
    },
    {
        name: 'Rotate In',
        description: 'Rotate while fading in',
        animate: (frame, duration) => ({
            transform: `rotate(${interpolate(frame, [0, duration], [-180, 0])}deg) scale(${interpolate(frame, [0, duration], [0.5, 1])})`,
            opacity: interpolate(frame, [0, duration * 0.5], [0, 1]),
        }),
    },
    {
        name: 'Bounce In',
        description: 'Bounce in with elastic effect',
        animate: (frame, duration) => {
            const progress = frame / duration;
            const bounce = Math.sin(progress * Math.PI * 3) * (1 - progress) * 0.2;
            const scale = interpolate(frame, [0, duration], [0, 1]) + bounce;
            return {
                transform: `scale(${scale})`,
                opacity: interpolate(frame, [0, duration * 0.3], [0, 1]),
            };
        },
    },
    {
        name: 'Swing In',
        description: 'Swing in like a pendulum',
        animate: (frame, duration) => {
            const progress = frame / duration;
            const swing = Math.sin(progress * Math.PI * 2) * (1 - progress) * 20;
            return {
                transform: `rotate(${swing}deg)`,
                opacity: interpolate(frame, [0, duration * 0.3], [0, 1]),
            };
        },
    },
    {
        name: 'Flip In X',
        description: 'Flip along X axis',
        animate: (frame, duration) => ({
            transform: `rotateX(${interpolate(frame, [0, duration], [-90, 0])}deg)`,
            opacity: interpolate(frame, [0, duration * 0.5], [0, 1]),
        }),
    },
    {
        name: 'Flip In Y',
        description: 'Flip along Y axis',
        animate: (frame, duration) => ({
            transform: `rotateY(${interpolate(frame, [0, duration], [90, 0])}deg)`,
            opacity: interpolate(frame, [0, duration * 0.5], [0, 1]),
        }),
    },
];

export class MotionPresetsManager {
    static getPreset(name: string): MotionPreset | null {
        return MOTION_PRESETS.find(p => p.name === name) || null;
    }

    static getAllPresets(): MotionPreset[] {
        return MOTION_PRESETS;
    }

    static applyPreset(presetName: string, frame: number, duration: number = 30): React.CSSProperties {
        const preset = this.getPreset(presetName);
        return preset ? preset.animate(frame, duration) : {};
    }

    static createCustomPreset(
        name: string,
        description: string,
        animateFunction: (frame: number, duration: number) => React.CSSProperties
    ): MotionPreset {
        return {
            name,
            description,
            animate: animateFunction,
        };
    }
}
