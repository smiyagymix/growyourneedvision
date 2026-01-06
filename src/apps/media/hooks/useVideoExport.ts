import { useState } from 'react';
import { VideoExportService, ExportOptions } from '../services/exportService';

interface UseVideoExportResult {
    exportVideo: (options: Omit<ExportOptions, 'onProgress'>) => Promise<void>;
    exporting: boolean;
    progress: number;
    error: string | null;
    result: { localPath: string; minioUrl: string } | null;
}

export const useVideoExport = (): UseVideoExportResult => {
    const [exporting, setExporting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<{ localPath: string; minioUrl: string } | null>(null);

    const exportVideo = async (options: Omit<ExportOptions, 'onProgress'>): Promise<void> => {
        setExporting(true);
        setProgress(0);
        setError(null);
        setResult(null);

        try {
            const exportResult = await VideoExportService.exportVideo({
                ...options,
                onProgress: setProgress,
            });

            setResult(exportResult);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Export failed';
            setError(errorMessage);
            console.error('Export error:', err);
        } finally {
            setExporting(false);
        }
    };

    return {
        exportVideo,
        exporting,
        progress,
        error,
        result,
    };
};
