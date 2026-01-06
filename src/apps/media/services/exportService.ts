import { storageService } from '../../../services/storageService';
import pb from '../../../lib/pocketbase';

export interface ExportOptions {
    compositionId: string;
    outputFormat: 'mp4' | 'gif' | 'webm';
    quality: 'low' | 'medium' | 'high';
    inputProps: Record<string, string | number | boolean | null>;
    onProgress?: (progress: number) => void;
}

interface ExportResult {
    localPath: string;
    minioUrl: string;
}

export class VideoExportService {
    private static getCodec(format: 'mp4' | 'gif' | 'webm'): 'h264' | 'gif' | 'vp8' {
        switch (format) {
            case 'mp4':
                return 'h264';
            case 'gif':
                return 'gif';
            case 'webm':
                return 'vp8';
        }
    }

    private static getQualitySettings(quality: 'low' | 'medium' | 'high'): number {
        switch (quality) {
            case 'low':
                return 50;
            case 'medium':
                return 75;
            case 'high':
                return 95;
        }
    }

    static async exportVideo(options: ExportOptions): Promise<ExportResult> {
        const {
            compositionId,
            outputFormat,
            quality,
            inputProps,
            onProgress
        } = options;

        console.warn('Video export is currently disabled in the browser client due to dependency limitations.');
        console.warn('Please use the server-side script scripts/render-video.js for rendering.');

        // Simulate a delay to show UI feedback
        if (onProgress) onProgress(10);
        await new Promise(resolve => setTimeout(resolve, 1000));

        throw new Error(
            "Client-side rendering is limited. Please use 'Save Project' to download your composition, " +
            "which can be rendered using our server-side tools."
        );
    }

    static async downloadCompositionJson(data: any, filename: string): Promise<void> {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    static async downloadVideo(url: string, filename: string): Promise<void> {
        const response = await fetch(url);
        const blob = await response.blob();
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    }
}
