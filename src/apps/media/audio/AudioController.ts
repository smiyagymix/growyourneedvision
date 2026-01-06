import { useCurrentFrame } from 'remotion';

export interface AudioControlOptions {
    volume: number; // 0-1
    startFrom: number; // frame number
    fadeIn?: number; // frames
    fadeOut?: number; // frames
    loop?: boolean;
}

export class AudioController {
    /**
     * Calculate the effective volume at a specific frame with fade in/out
     */
    static getVolumeAtFrame(
        frame: number,
        baseVolume: number,
        startFrame: number,
        totalDuration: number,
        fadeIn: number = 10,
        fadeOut: number = 10
    ): number {
        const relativeFrame = frame - startFrame;

        // Not started yet
        if (relativeFrame < 0) return 0;

        // Past the end
        if (relativeFrame > totalDuration) return 0;

        let volume = baseVolume;

        // Fade in
        if (relativeFrame < fadeIn) {
            volume *= relativeFrame / fadeIn;
        }

        // Fade out
        const fadeOutStart = totalDuration - fadeOut;
        if (relativeFrame > fadeOutStart) {
            const fadeProgress = (relativeFrame - fadeOutStart) / fadeOut;
            volume *= 1 - fadeProgress;
        }

        return Math.max(0, Math.min(1, volume));
    }

    /**
     * Convert 0-1 volume to percentage
     */
    static volumeToPercentage(volume: number): number {
        return Math.round(volume * 100);
    }

    /**
     * Convert percentage to 0-1 volume
     */
    static percentageToVolume(percentage: number): number {
        return Math.max(0, Math.min(100, percentage)) / 100;
    }

    /**
     * Get the playback offset in seconds for audio start point
     */
    static getAudioOffset(startFrom: number, fps: number): number {
        return startFrom / fps;
    }

    /**
     * Calculate loop count based on video duration
     */
    static calculateLoopCount(
        audioDurationSeconds: number,
        videoDurationFrames: number,
        fps: number
    ): number {
        const videoDurationSeconds = videoDurationFrames / fps;
        return Math.ceil(videoDurationSeconds / audioDurationSeconds);
    }
}

/**
 * React hook for audio control with volume fades
 */
export const useAudioControl = (options: AudioControlOptions) => {
    const frame = useCurrentFrame();

    const effectiveVolume = AudioController.getVolumeAtFrame(
        frame,
        options.volume,
        options.startFrom,
        1000, // Will be dynamic in real usage
        options.fadeIn,
        options.fadeOut
    );

    return {
        volume: effectiveVolume,
        shouldPlay: frame >= options.startFrom,
    };
};

/**
 * Enhanced audio props for templates
 */
export interface EnhancedAudioProps {
    audioUrl: string | null;
    audioVolume: number; // 0-1
    audioStartFrom: number; // frame number
    audioFadeIn?: number; // frames
    audioFadeOut?: number; // frames
    audioLoop?: boolean;
}

/**
 * Audio utilities for production use
 */
export class AudioUtils {
    /**
     * Normalize audio file name
     */
    static normalizeAudioFileName(fileName: string): string {
        return fileName
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-_.]/g, '');
    }

    /**
     * Get audio duration from HTMLAudioElement
     */
    static async getAudioDuration(audioUrl: string): Promise<number> {
        return new Promise((resolve, reject) => {
            const audio = new Audio(audioUrl);

            audio.addEventListener('loadedmetadata', () => {
                resolve(audio.duration);
            });

            audio.addEventListener('error', (error) => {
                reject(new Error('Failed to load audio metadata'));
            });
        });
    }

    /**
     * Format audio duration for display
     */
    static formatDuration(seconds: number): string {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    /**
     * Check if audio format is supported
     */
    static isFormatSupported(fileName: string): boolean {
        const ext = fileName.toLowerCase().split('.').pop();
        const supportedFormats = ['mp3', 'wav', 'ogg', 'm4a'];
        return ext ? supportedFormats.includes(ext) : false;
    }
}
