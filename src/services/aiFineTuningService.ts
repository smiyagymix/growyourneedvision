/**
 * AI Fine-Tuning Service
 * Manage fine-tuning jobs for custom AI models
 */

import pb from '../lib/pocketbase';
import { auditLogger } from './auditLogger';

export interface FineTuningJob {
    id: string;
    name: string;
    base_model: string;
    training_file: string;
    validation_file?: string;
    status: 'pending' | 'training' | 'completed' | 'failed' | 'cancelled';
    progress: number;
    epochs: number;
    batch_size: number;
    learning_rate: number;
    cost: number;
    fine_tuned_model?: string;
    metrics?: {
        loss: number;
        accuracy: number;
        validation_loss?: number;
    };
    error_message?: string;
    created_by: string;
    created: string;
    updated: string;
    started_at?: string;
    completed_at?: string;
}

class AIFineTuningService {
    private collection = 'ai_finetuning_jobs';

    /**
     * Create a new fine-tuning job
     */
    async createJob(data: Partial<FineTuningJob>): Promise<FineTuningJob> {
        try {
            const job = await pb.collection(this.collection).create<FineTuningJob>({
                ...data,
                status: 'pending',
                progress: 0,
                cost: 0
            });

            await auditLogger.log({
                action: 'fineTuningJobCreate',
                resource_type: 'ai_finetuning_job',
                resource_id: job.id,
                severity: 'info',
                metadata: {
                    name: job.name,
                    base_model: job.base_model
                }
            });

            return job;
        } catch (error) {
            console.error('Error creating fine-tuning job:', error);
            throw error;
        }
    }

    /**
     * Get all fine-tuning jobs
     */
    async getAllJobs(): Promise<FineTuningJob[]> {
        try {
            const jobs = await pb.collection(this.collection).getFullList<FineTuningJob>({
                sort: '-created'
            });
            return jobs;
        } catch (error) {
            console.error('Error fetching jobs:', error);
            throw error;
        }
    }

    /**
     * Get job by ID
     */
    async getJobById(id: string): Promise<FineTuningJob> {
        try {
            return await pb.collection(this.collection).getOne<FineTuningJob>(id);
        } catch (error) {
            console.error('Error fetching job:', error);
            throw error;
        }
    }

    /**
     * Start a fine-tuning job
     */
    async startJob(id: string): Promise<FineTuningJob> {
        try {
            const job = await pb.collection(this.collection).update<FineTuningJob>(id, {
                status: 'training',
                started_at: new Date().toISOString()
            });

            // Simulate training progress
            this.simulateTraining(id);

            await auditLogger.log({
                action: 'fineTuningJobStart',
                resource_type: 'ai_finetuning_job',
                resource_id: id,
                severity: 'info'
            });
            return job;
        } catch (error) {
            console.error('Error starting job:', error);
            throw error;
        }
    }

    /**
     * Cancel a fine-tuning job
     */
    async cancelJob(id: string): Promise<FineTuningJob> {
        try {
            const job = await pb.collection(this.collection).update<FineTuningJob>(id, {
                status: 'cancelled'
            });

            await auditLogger.log({
                action: 'fineTuningJobCancel',
                resource_type: 'ai_finetuning_job',
                resource_id: id,
                severity: 'info'
            });
            return job;
        } catch (error) {
            console.error('Error cancelling job:', error);
            throw error;
        }
    }

    /**
     * Delete a fine-tuning job
     */
    async deleteJob(id: string): Promise<boolean> {
        try {
            await pb.collection(this.collection).delete(id);
            await auditLogger.log({
                action: 'fineTuningJobDelete',
                resource_type: 'ai_finetuning_job',
                resource_id: id,
                severity: 'warning'
            });
            return true;
        } catch (error) {
            console.error('Error deleting job:', error);
            throw error;
        }
    }

    /**
     * Get job statistics
     */
    async getJobStats(): Promise<{
        total: number;
        by_status: Record<string, number>;
        total_cost: number;
    }> {
        try {
            const jobs = await this.getAllJobs();

            const by_status: Record<string, number> = {
                pending: 0,
                training: 0,
                completed: 0,
                failed: 0,
                cancelled: 0
            };

            jobs.forEach(job => {
                by_status[job.status] = (by_status[job.status] || 0) + 1;
            });

            const total_cost = jobs.reduce((sum, job) => sum + (job.cost || 0), 0);

            return {
                total: jobs.length,
                by_status,
                total_cost
            };
        } catch (error) {
            console.error('Error getting stats:', error);
            throw error;
        }
    }

    /**
     * Simulate training progress (for demo purposes)
     */
    private async simulateTraining(jobId: string) {
        // In production, this would monitor actual training progress
        setTimeout(async () => {
            try {
                await pb.collection(this.collection).update(jobId, {
                    progress: 25,
                    metrics: { loss: 0.85, accuracy: 0.72 }
                });
            } catch (e) {
                console.error('Error updating progress:', e);
            }
        }, 2000);

        setTimeout(async () => {
            try {
                await pb.collection(this.collection).update(jobId, {
                    progress: 50,
                    metrics: { loss: 0.62, accuracy: 0.81 }
                });
            } catch (e) {
                console.error('Error updating progress:', e);
            }
        }, 5000);

        setTimeout(async () => {
            try {
                await pb.collection(this.collection).update(jobId, {
                    progress: 75,
                    metrics: { loss: 0.45, accuracy: 0.88 }
                });
            } catch (e) {
                console.error('Error updating progress:', e);
            }
        }, 8000);

        setTimeout(async () => {
            try {
                await pb.collection(this.collection).update(jobId, {
                    status: 'completed',
                    progress: 100,
                    metrics: { loss: 0.32, accuracy: 0.92 },
                    fine_tuned_model: `ft-${jobId.substring(0, 8)}`,
                    completed_at: new Date().toISOString(),
                    cost: Math.random() * 50 + 10 // $10-$60
                });
            } catch (e) {
                console.error('Error completing job:', e);
            }
        }, 12000);
    }
}

export const aiFineTuningService = new AIFineTuningService();
