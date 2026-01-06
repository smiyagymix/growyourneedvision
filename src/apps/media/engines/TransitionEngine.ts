import { interpolate, spring } from '../../../lib/remotion-utils';

export type TransitionType = 'fade' | 'slide' | 'zoom' | 'wipe' | 'dissolve' | 'blur';

export interface TransitionConfig {
    type: TransitionType;
    duration: number;
    easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'spring';
}

export class TransitionEngine {
    static fade(frame: number, duration: number): number {
        return interpolate(frame, [0, duration], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
        });
    }

    static slideIn(
        frame: number,
        duration: number,
        direction: 'left' | 'right' | 'top' | 'bottom'
    ): { x: number; y: number } {
        const progress = this.fade(frame, duration);

        switch (direction) {
            case 'left':
                return { x: interpolate(progress, [0, 1], [-100, 0]), y: 0 };
            case 'right':
                return { x: interpolate(progress, [0, 1], [100, 0]), y: 0 };
            case 'top':
                return { x: 0, y: interpolate(progress, [0, 1], [-100, 0]) };
            case 'bottom':
                return { x: 0, y: interpolate(progress, [0, 1], [100, 0]) };
        }
    }

    static zoom(frame: number, duration: number, from: number = 0.5, to: number = 1): number {
        return interpolate(frame, [0, duration], [from, to], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
        });
    }

    static wipe(
        frame: number,
        duration: number,
        direction: 'horizontal' | 'vertical'
    ): number {
        return interpolate(frame, [0, duration], [0, 100], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
        });
    }

    static spring(frame: number, fps: number): number {
        return spring({
            frame,
            fps,
            config: {
                damping: 200,
                stiffness: 100,
                mass: 0.5,
            },
        });
    }

    static applyTransition(
        frame: number,
        config: TransitionConfig,
        fps: number
    ): number {
        const { type, duration, easing = 'ease-in-out' } = config;

        let progress: number;

        if (easing === 'spring') {
            progress = this.spring(frame, fps);
        } else {
            progress = this.fade(frame, duration);
        }

        return progress;
    }
}
