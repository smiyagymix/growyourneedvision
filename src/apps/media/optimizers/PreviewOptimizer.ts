export interface PreviewQuality {
    width: number;
    height: number;
    fps: number;
    scale: number;
}

export class PreviewOptimizer {
    private static readonly QUALITY_LEVELS: Record<'low' | 'medium' | 'high', PreviewQuality> = {
        low: { width: 640, height: 360, fps: 15, scale: 0.5 },
        medium: { width: 1280, height: 720, fps: 30, scale: 0.67 },
        high: { width: 1920, height: 1080, fps: 60, scale: 1 },
    };

    static getQuality(level: 'low' | 'medium' | 'high'): PreviewQuality {
        return this.QUALITY_LEVELS[level];
    }

    static getOptimalQuality(
        isPlaying: boolean,
        cpuUsage: number = 50
    ): 'low' | 'medium' | 'high' {
        if (cpuUsage > 80) return 'low';
        if (cpuUsage > 50 || isPlaying) return 'medium';
        return 'high';
    }

    static shouldSkipFrame(frame: number, targetFps: number, actualFps: number): boolean {
        const skipRatio = actualFps / targetFps;
        return frame % Math.ceil(skipRatio) !== 0;
    }

    static calculateBufferSize(durationInSeconds: number, fps: number): number {
        // Buffer 5 seconds worth of frames
        return Math.min(fps * 5, durationInSeconds * fps);
    }

    static async preloadFrames(
        frames: number[],
        loadFrame: (frame: number) => Promise<void>
    ): Promise<void> {
        const batchSize = 10;

        for (let i = 0; i < frames.length; i += batchSize) {
            const batch = frames.slice(i, i + batchSize);
            await Promise.all(batch.map(frame => loadFrame(frame)));
        }
    }

    static throttleUpdates<T extends (...args: any[]) => any>(
        func: T,
        delay: number
    ): (...args: Parameters<T>) => void {
        let timeoutId: NodeJS.Timeout | null = null;
        let lastArgs: Parameters<T> | null = null;

        return (...args: Parameters<T>) => {
            lastArgs = args;

            if (timeoutId === null) {
                timeoutId = setTimeout(() => {
                    if (lastArgs) {
                        func(...lastArgs);
                    }
                    timeoutId = null;
                }, delay);
            }
        };
    }

    static debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
        func: T,
        delay: number
    ): (...args: Parameters<T>) => void {
        let timeoutId: NodeJS.Timeout | null = null;

        return (...args: Parameters<T>) => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }

            timeoutId = setTimeout(() => {
                func(...args);
            }, delay);
        };
    }
}
