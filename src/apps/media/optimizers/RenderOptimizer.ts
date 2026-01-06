export interface RenderSettings {
    quality: 'draft' | 'medium' | 'high' | 'ultra';
    resolution: '720p' | '1080p' | '4k';
    frameRate: 30 | 60;
    codec: 'h264' | 'h265' | 'vp8' | 'vp9';
    bitrate?: number;
}

export interface RenderOptimization {
    useGPU: boolean;
    maxThreads: number;
    cacheEnabled: boolean;
    previewQuality: 'low' | 'medium' | 'high';
}

export class RenderOptimizer {
    private static readonly QUALITY_PRESETS: Record<RenderSettings['quality'], { bitrate: number; passes: number }> = {
        draft: { bitrate: 1000, passes: 1 },
        medium: { bitrate: 3000, passes: 1 },
        high: { bitrate: 6000, passes: 2 },
        ultra: { bitrate: 12000, passes: 2 },
    };

    private static readonly RESOLUTION_DIMENSIONS: Record<RenderSettings['resolution'], { width: number; height: number }> = {
        '720p': { width: 1280, height: 720 },
        '1080p': { width: 1920, height: 1080 },
        '4k': { width: 3840, height: 2160 },
    };

    static getOptimalSettings(
        quality: RenderSettings['quality'],
        resolution: RenderSettings['resolution']
    ): RenderSettings {
        const preset = this.QUALITY_PRESETS[quality];

        return {
            quality,
            resolution,
            frameRate: quality === 'ultra' ? 60 : 30,
            codec: quality === 'ultra' || quality === 'high' ? 'h265' : 'h264',
            bitrate: preset.bitrate,
        };
    }

    static calculateEstimatedFileSize(
        settings: RenderSettings,
        durationInSeconds: number
    ): number {
        const bitrate = settings.bitrate || this.QUALITY_PRESETS[settings.quality].bitrate;
        const fileSizeKB = (bitrate * durationInSeconds) / 8;
        return fileSizeKB * 1024; // Convert to bytes
    }

    static getRecommendedThreadCount(): number {
        if (typeof navigator !== 'undefined' && 'hardwareConcurrency' in navigator) {
            const cores = navigator.hardwareConcurrency || 4;
            return Math.max(1, Math.floor(cores * 0.75));
        }
        return 4;
    }

    static createOptimizationProfile(
        targetUseCase: 'web' | 'social' | 'broadcast' | 'archive'
    ): RenderSettings {
        switch (targetUseCase) {
            case 'web':
                return {
                    quality: 'medium',
                    resolution: '1080p',
                    frameRate: 30,
                    codec: 'h264',
                    bitrate: 3000,
                };
            case 'social':
                return {
                    quality: 'medium',
                    resolution: '720p',
                    frameRate: 30,
                    codec: 'h264',
                    bitrate: 2000,
                };
            case 'broadcast':
                return {
                    quality: 'high',
                    resolution: '1080p',
                    frameRate: 60,
                    codec: 'h265',
                    bitrate: 8000,
                };
            case 'archive':
                return {
                    quality: 'ultra',
                    resolution: '4k',
                    frameRate: 60,
                    codec: 'h265',
                    bitrate: 15000,
                };
        }
    }

    static shouldUseGPUAcceleration(settings: RenderSettings): boolean {
        return settings.resolution === '4k' || settings.quality === 'ultra';
    }

    static getPreviewSettings(fullSettings: RenderSettings): RenderSettings {
        return {
            ...fullSettings,
            quality: 'draft',
            resolution: '720p',
            frameRate: 30,
            bitrate: 1000,
        };
    }
}
