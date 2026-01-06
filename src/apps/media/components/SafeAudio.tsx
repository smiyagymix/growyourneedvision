import React from 'react';
import { Audio as RemotionAudio } from 'remotion';

/**
 * Explicitly define the props supported by Remotion's Audio component
 * to resolve type inference issues where it's treated as a standard HTML audio element.
 */
export interface SafeAudioProps extends React.AudioHTMLAttributes<HTMLAudioElement> {
    src: string;
    /**
     * Volume can be a number between 0 and 1, or a function that returns a number
     * based on the current frame.
     */
    volume?: number | ((frame: number) => number);
    /**
     * The frame number to start playing the audio from.
     */
    startFrom?: number;
    /**
     * The frame number to stop playing the audio.
     */
    endAt?: number;
    /**
     * Mutes the audio if true.
     */
    muted?: boolean;
    /**
     * Loops the audio if true.
     */
    loop?: boolean;
}

/**
 * A type-safe wrapper around Remotion's Audio component.
 * This ensures strict type checking for Remotion-specific props like volume callbacks
 * which might be missing from the default type definitions in some versions.
 */
export const SafeAudio = RemotionAudio as React.FC<SafeAudioProps>;
