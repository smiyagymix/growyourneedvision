export class CompositionUtils {
    static calculateAspectRatio(width: number, height: number): number {
        return width / height;
    }

    static getAspectRatioName(width: number, height: number): string {
        const ratio = this.calculateAspectRatio(width, height);

        if (Math.abs(ratio - 16 / 9) < 0.01) return '16:9';
        if (Math.abs(ratio - 9 / 16) < 0.01) return '9:16';
        if (Math.abs(ratio - 4 / 3) < 0.01) return '4:3';
        if (Math.abs(ratio - 1) < 0.01) return '1:1';
        if (Math.abs(ratio - 21 / 9) < 0.01) return '21:9';

        return `${width}:${height}`;
    }

    static getStandardDimensions(aspectRatio: '16:9' | '9:16' | '1:1' | '4:3', quality: '720p' | '1080p' | '4k'): { width: number; height: number } {
        const dimensions = {
            '16:9': {
                '720p': { width: 1280, height: 720 },
                '1080p': { width: 1920, height: 1080 },
                '4k': { width: 3840, height: 2160 },
            },
            '9:16': {
                '720p': { width: 720, height: 1280 },
                '1080p': { width: 1080, height: 1920 },
                '4k': { width: 2160, height: 3840 },
            },
            '1:1': {
                '720p': { width: 720, height: 720 },
                '1080p': { width: 1080, height: 1080 },
                '4k': { width: 2160, height: 2160 },
            },
            '4:3': {
                '720p': { width: 960, height: 720 },
                '1080p': { width: 1440, height: 1080 },
                '4k': { width: 2880, height: 2160 },
            },
        };

        return dimensions[aspectRatio][quality];
    }

    static framesToSeconds(frames: number, fps: number): number {
        return frames / fps;
    }

    static secondsToFrames(seconds: number, fps: number): number {
        return Math.round(seconds * fps);
    }

    static formatTimecode(frames: number, fps: number): string {
        const totalSeconds = this.framesToSeconds(frames, fps);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = Math.floor(totalSeconds % 60);
        const remainingFrames = frames % fps;

        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}:${String(remainingFrames).padStart(2, '0')}`;
    }

    static parseTimecode(timecode: string, fps: number): number {
        const parts = timecode.split(':').map(Number);

        if (parts.length === 4) {
            const [hours, minutes, seconds, frames] = parts;
            return ((hours * 3600 + minutes * 60 + seconds) * fps) + frames;
        }

        return 0;
    }

    static calculateFileSize(
        width: number,
        height: number,
        duration: number,
        fps: number,
        bitrate: number
    ): number {
        // File size in MB
        const durationInSeconds = duration / fps;
        const fileSizeMB = (bitrate * durationInSeconds) / 8 / 1024;
        return fileSizeMB;
    }

    static interpolateColor(color1: string, color2: string, progress: number): string {
        const hex1 = color1.replace('#', '');
        const hex2 = color2.replace('#', '');

        const r1 = parseInt(hex1.substring(0, 2), 16);
        const g1 = parseInt(hex1.substring(2, 4), 16);
        const b1 = parseInt(hex1.substring(4, 6), 16);

        const r2 = parseInt(hex2.substring(0, 2), 16);
        const g2 = parseInt(hex2.substring(2, 4), 16);
        const b2 = parseInt(hex2.substring(4, 6), 16);

        const r = Math.round(r1 + (r2 - r1) * progress);
        const g = Math.round(g1 + (g2 - g1) * progress);
        const b = Math.round(b1 + (b2 - b1) * progress);

        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }

    static hexToRgba(hex: string, alpha: number = 1): string {
        const cleanHex = hex.replace('#', '');
        const r = parseInt(cleanHex.substring(0, 2), 16);
        const g = parseInt(cleanHex.substring(2, 4), 16);
        const b = parseInt(cleanHex.substring(4, 6), 16);

        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    static clamp(value: number, min: number, max: number): number {
        return Math.max(min, Math.min(max, value));
    }

    static easeInOut(t: number): number {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }

    static easeIn(t: number): number {
        return t * t;
    }

    static easeOut(t: number): number {
        return t * (2 - t);
    }
}
