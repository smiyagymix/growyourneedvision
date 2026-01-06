import { VideoExportService, ExportOptions } from '../services/exportService';
import pb from '../../../lib/pocketbase';

export interface BatchJob {
    id: string;
    name: string;
    videos: ExportOptions[];
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress: number;
    startedAt: Date | null;
    completedAt: Date | null;
    results: Array<{ success: boolean; url?: string; error?: string }>;
}

export class BatchProcessor {
    private jobs: Map<string, BatchJob> = new Map();

    createJob(name: string, videos: ExportOptions[]): BatchJob {
        const job: BatchJob = {
            id: `batch-${Date.now()}`,
            name,
            videos,
            status: 'pending',
            progress: 0,
            startedAt: null,
            completedAt: null,
            results: [],
        };

        this.jobs.set(job.id, job);
        return job;
    }

    async processJob(
        jobId: string,
        onProgress?: (progress: number, videoIndex: number) => void
    ): Promise<BatchJob> {
        const job = this.jobs.get(jobId);
        if (!job) {
            throw new Error(`Job ${jobId} not found`);
        }

        job.status = 'processing';
        job.startedAt = new Date();
        job.results = [];

        const totalVideos = job.videos.length;

        for (let i = 0; i < totalVideos; i++) {
            const video = job.videos[i];

            try {
                const result = await VideoExportService.exportVideo(video);
                job.results.push({ success: true, url: result.minioUrl });

                // Save to database
                await pb.collection('batch_exports').create({
                    job_id: jobId,
                    video_index: i,
                    format: video.outputFormat,
                    minio_url: result.minioUrl,
                    exported_by: pb.authStore.model?.id,
                });
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                job.results.push({ success: false, error: errorMessage });
            }

            job.progress = ((i + 1) / totalVideos) * 100;
            onProgress?.(job.progress, i);
        }

        job.status = 'completed';
        job.completedAt = new Date();

        return job;
    }

    getJob(jobId: string): BatchJob | null {
        return this.jobs.get(jobId) || null;
    }

    getAllJobs(): BatchJob[] {
        return Array.from(this.jobs.values());
    }

    cancelJob(jobId: string): void {
        const job = this.jobs.get(jobId);
        if (job && job.status === 'processing') {
            job.status = 'failed';
            job.results.push({ success: false, error: 'Job cancelled by user' });
        }
    }

    deleteJob(jobId: string): boolean {
        return this.jobs.delete(jobId);
    }
}

export const batchProcessor = new BatchProcessor();
