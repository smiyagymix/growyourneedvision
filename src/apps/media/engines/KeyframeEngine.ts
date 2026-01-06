import { interpolate } from '../../../lib/remotion-utils';

export interface Keyframe {
    frame: number;
    value: number;
    easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
}

export type AnimatableProperty =
    | 'opacity'
    | 'scale'
    | 'rotation'
    | 'x'
    | 'y'
    | 'blur'
    | 'brightness';

export interface AnimationTrack {
    property: AnimatableProperty;
    keyframes: Keyframe[];
}

export class KeyframeEngine {
    static getValueAtFrame(keyframes: Keyframe[], currentFrame: number): number {
        if (keyframes.length === 0) return 0;
        if (keyframes.length === 1) return keyframes[0].value;

        const sorted = [...keyframes].sort((a, b) => a.frame - b.frame);

        if (currentFrame <= sorted[0].frame) {
            return sorted[0].value;
        }

        if (currentFrame >= sorted[sorted.length - 1].frame) {
            return sorted[sorted.length - 1].value;
        }

        for (let i = 0; i < sorted.length - 1; i++) {
            const current = sorted[i];
            const next = sorted[i + 1];

            if (currentFrame >= current.frame && currentFrame <= next.frame) {
                return interpolate(
                    currentFrame,
                    [current.frame, next.frame],
                    [current.value, next.value],
                    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
                );
            }
        }

        return 0;
    }

    static addKeyframe(track: AnimationTrack, keyframe: Keyframe): AnimationTrack {
        return {
            ...track,
            keyframes: [...track.keyframes, keyframe].sort((a, b) => a.frame - b.frame),
        };
    }

    static removeKeyframe(track: AnimationTrack, frame: number): AnimationTrack {
        return {
            ...track,
            keyframes: track.keyframes.filter(k => k.frame !== frame),
        };
    }

    static updateKeyframe(
        track: AnimationTrack,
        frame: number,
        newValue: number
    ): AnimationTrack {
        return {
            ...track,
            keyframes: track.keyframes.map(k =>
                k.frame === frame ? { ...k, value: newValue } : k
            ),
        };
    }

    static createTrack(property: AnimatableProperty): AnimationTrack {
        return {
            property,
            keyframes: [],
        };
    }

    static getTransformString(tracks: AnimationTrack[], currentFrame: number): string {
        const transforms: string[] = [];

        tracks.forEach(track => {
            const value = this.getValueAtFrame(track.keyframes, currentFrame);

            switch (track.property) {
                case 'scale':
                    transforms.push(`scale(${value})`);
                    break;
                case 'rotation':
                    transforms.push(`rotate(${value}deg)`);
                    break;
                case 'x':
                    transforms.push(`translateX(${value}px)`);
                    break;
                case 'y':
                    transforms.push(`translateY(${value}px)`);
                    break;
            }
        });

        return transforms.join(' ');
    }

    static getStyleObject(tracks: AnimationTrack[], currentFrame: number): React.CSSProperties {
        const style: React.CSSProperties = {};

        tracks.forEach(track => {
            const value = this.getValueAtFrame(track.keyframes, currentFrame);

            switch (track.property) {
                case 'opacity':
                    style.opacity = value;
                    break;
                case 'blur':
                    style.filter = `blur(${value}px)`;
                    break;
                case 'brightness':
                    style.filter = `brightness(${value}%)`;
                    break;
            }
        });

        const transformTracks = tracks.filter(t =>
            ['scale', 'rotation', 'x', 'y'].includes(t.property)
        );

        if (transformTracks.length > 0) {
            style.transform = this.getTransformString(transformTracks, currentFrame);
        }

        return style;
    }
}
