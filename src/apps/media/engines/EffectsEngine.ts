import { interpolate } from '../../../lib/remotion-utils';

export type EffectType = 'blur' | 'brightness' | 'contrast' | 'saturate' | 'grayscale' | 'sepia' | 'hue-rotate' | 'invert';

export interface Effect {
    type: EffectType;
    intensity: number;
    startFrame: number;
    endFrame: number;
}

export interface EffectStack {
    effects: Effect[];
}

export class EffectsEngine {
    static applyBlur(intensity: number): string {
        return `blur(${intensity}px)`;
    }

    static applyBrightness(intensity: number): string {
        return `brightness(${intensity}%)`;
    }

    static applyContrast(intensity: number): string {
        return `contrast(${intensity}%)`;
    }

    static applySaturate(intensity: number): string {
        return `saturate(${intensity}%)`;
    }

    static applyGrayscale(intensity: number): string {
        return `grayscale(${intensity}%)`;
    }

    static applySepia(intensity: number): string {
        return `sepia(${intensity}%)`;
    }

    static applyHueRotate(degrees: number): string {
        return `hue-rotate(${degrees}deg)`;
    }

    static applyInvert(intensity: number): string {
        return `invert(${intensity}%)`;
    }

    static buildFilterString(effects: Effect[], currentFrame: number): string {
        const activeEffects = effects.filter(
            effect => currentFrame >= effect.startFrame && currentFrame <= effect.endFrame
        );

        const filters = activeEffects.map(effect => {
            const progress = interpolate(
                currentFrame,
                [effect.startFrame, effect.endFrame],
                [0, effect.intensity],
                { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
            );

            switch (effect.type) {
                case 'blur':
                    return this.applyBlur(progress);
                case 'brightness':
                    return this.applyBrightness(100 + progress);
                case 'contrast':
                    return this.applyContrast(100 + progress);
                case 'saturate':
                    return this.applySaturate(100 + progress);
                case 'grayscale':
                    return this.applyGrayscale(progress);
                case 'sepia':
                    return this.applySepia(progress);
                case 'hue-rotate':
                    return this.applyHueRotate(progress);
                case 'invert':
                    return this.applyInvert(progress);
                default:
                    return '';
            }
        });

        return filters.join(' ');
    }

    static createEffectStack(effects: Effect[]): EffectStack {
        return { effects };
    }

    static addEffect(stack: EffectStack, effect: Effect): EffectStack {
        return {
            effects: [...stack.effects, effect],
        };
    }

    static removeEffect(stack: EffectStack, index: number): EffectStack {
        return {
            effects: stack.effects.filter((_, i) => i !== index),
        };
    }
}
