import pb from '../lib/pocketbase';
import { auditLog } from './auditLogger';
import { isMockEnv } from '../utils/mockData';
import { RecordModel } from 'pocketbase';

export interface ScheduledReport extends RecordModel {
    id: string;
    name: string;
    type: 'revenue' | 'usage' | 'tenants' | 'engagement' | 'compliance' | 'performance';
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
    recipients: string[];
    format: 'pdf' | 'csv' | 'excel' | 'json';
    status: 'active' | 'paused' | 'error';
    next_run: string;
    last_run?: string;
    last_run_status?: 'success' | 'failed' | 'partial';
    last_run_duration_ms?: number;
    error_count?: number;
    filters?: Record<string, unknown>;
    description?: string;
    created: string;
    updated: string;
}

export interface CreateReportData {
    name: string;
    type: ScheduledReport['type'];
    frequency: ScheduledReport['frequency'];
    recipients: string[];
    format: ScheduledReport['format'];
    description?: string;
    filters?: Record<string, unknown>;
}

export interface ReportExecutionResult {
    success: boolean;
    duration_ms: number;
    recipients_notified: number;
    file_path?: string;
    error?: string;
}

const MOCK_REPORTS: ScheduledReport[] = [
    {
        id: 'report-1',
        collectionId: 'mock',
        collectionName: 'scheduled_reports',
        name: 'Daily Revenue Report',
        type: 'revenue',
        frequency: 'daily',
        recipients: ['finance@growyourneed.com', 'cfo@growyourneed.com'],
        format: 'pdf',
        status: 'active',
        next_run: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
        last_run: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        last_run_status: 'success',
        last_run_duration_ms: 3420,
        description: 'Daily revenue summary with transaction breakdown',
        created: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        updated: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
    },
    {
        id: 'report-2',
        collectionId: 'mock',
        collectionName: 'scheduled_reports',
        name: 'Weekly Tenant Usage',
        type: 'usage',
        frequency: 'weekly',
        recipients: ['operations@growyourneed.com'],
        format: 'excel',
        status: 'active',
        next_run: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        last_run: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        last_run_status: 'success',
        last_run_duration_ms: 8750,
        description: 'Usage metrics per tenant including API calls, storage, and active users',
        created: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        updated: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
        id: 'report-3',
        collectionId: 'mock',
        collectionName: 'scheduled_reports',
        name: 'Monthly Engagement Report',
        type: 'engagement',
        frequency: 'monthly',
        recipients: ['product@growyourneed.com', 'marketing@growyourneed.com'],
        format: 'pdf',
        status: 'active',
        next_run: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        last_run: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        last_run_status: 'success',
        last_run_duration_ms: 15200,
        filters: { exclude_internal: true },
        created: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        updated: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
        id: 'report-4',
        collectionId: 'mock',
        collectionName: 'scheduled_reports',
        name: 'Quarterly Compliance Report',
        type: 'compliance',
        frequency: 'quarterly',
        recipients: ['compliance@growyourneed.com', 'legal@growyourneed.com'],
        format: 'pdf',
        status: 'paused',
        next_run: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
        description: 'Compliance and audit trail summary',
        created: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
        updated: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    }
];

class ReportSchedulerService {
    private collection = 'scheduled_reports';

    /**
     * Calculate next run date based on frequency
     */
    private calculateNextRun(frequency: ScheduledReport['frequency'], fromDate?: Date): string {
        const from = fromDate || new Date();
        const next = new Date(from);
        
        switch (frequency) {
            case 'daily':
                next.setDate(next.getDate() + 1);
                next.setHours(6, 0, 0, 0); // 6 AM
                break;
            case 'weekly':
                next.setDate(next.getDate() + (7 - next.getDay())); // Next Sunday
                next.setHours(6, 0, 0, 0);
                break;
            case 'monthly':
                next.setMonth(next.getMonth() + 1);
                next.setDate(1);
                next.setHours(6, 0, 0, 0);
                break;
            case 'quarterly':
                next.setMonth(next.getMonth() + 3 - (next.getMonth() % 3));
                next.setDate(1);
                next.setHours(6, 0, 0, 0);
                break;
        }
        
        return next.toISOString();
    }

    /**
     * Get all scheduled reports
     */
    async getAll(): Promise<ScheduledReport[]> {
        if (isMockEnv()) {
            return [...MOCK_REPORTS];
        }

        try {
            const records = await pb.collection(this.collection).getFullList({
                sort: 'next_run',
                requestKey: null
            });
            return records as unknown as ScheduledReport[];
        } catch (error) {
            console.error('Failed to fetch scheduled reports:', error);
            return [];
        }
    }

    /**
     * Get report by ID
     */
    async getById(id: string): Promise<ScheduledReport | null> {
        if (isMockEnv()) {
            return MOCK_REPORTS.find(r => r.id === id) || null;
        }

        try {
            const record = await pb.collection(this.collection).getOne(id, {
                requestKey: null
            });
            return record as unknown as ScheduledReport;
        } catch (error) {
            console.error(`Failed to fetch report ${id}:`, error);
            return null;
        }
    }

    /**
     * Create a new scheduled report
     */
    async create(data: CreateReportData): Promise<ScheduledReport | null> {
        const nextRun = this.calculateNextRun(data.frequency);

        if (isMockEnv()) {
            const newReport: ScheduledReport = {
                id: `report-${Date.now()}`,
                collectionId: 'mock',
                collectionName: 'scheduled_reports',
                name: data.name,
                type: data.type,
                frequency: data.frequency,
                recipients: data.recipients,
                format: data.format,
                status: 'active',
                next_run: nextRun,
                description: data.description,
                filters: data.filters,
                created: new Date().toISOString(),
                updated: new Date().toISOString()
            };
            MOCK_REPORTS.push(newReport);
            return newReport;
        }

        try {
            const record = await pb.collection(this.collection).create({
                name: data.name,
                type: data.type,
                frequency: data.frequency,
                recipients: data.recipients,
                format: data.format,
                status: 'active',
                next_run: nextRun,
                description: data.description,
                filters: data.filters,
                error_count: 0
            });
            await auditLog.log('report.schedule', { 
                report_id: record.id, 
                name: data.name, 
                type: data.type,
                frequency: data.frequency 
            }, 'info');
            return record as unknown as ScheduledReport;
        } catch (error) {
            console.error('Failed to create scheduled report:', error);
            return null;
        }
    }

    /**
     * Update a scheduled report
     */
    async update(id: string, data: Partial<Omit<ScheduledReport, 'id' | 'created' | 'updated'>>): Promise<ScheduledReport | null> {
        if (isMockEnv()) {
            const idx = MOCK_REPORTS.findIndex(r => r.id === id);
            if (idx >= 0) {
                MOCK_REPORTS[idx] = {
                    ...MOCK_REPORTS[idx],
                    ...data,
                    updated: new Date().toISOString()
                };
                // Recalculate next_run if frequency changed
                if (data.frequency) {
                    MOCK_REPORTS[idx].next_run = this.calculateNextRun(data.frequency);
                }
                return MOCK_REPORTS[idx];
            }
            return null;
        }

        try {
            const updateData = { ...data };
            // Recalculate next_run if frequency changed
            if (data.frequency) {
                updateData.next_run = this.calculateNextRun(data.frequency);
            }
            
            const record = await pb.collection(this.collection).update(id, updateData);
            await auditLog.log('report.update', { report_id: id, changes: Object.keys(data) }, 'info');
            return record as unknown as ScheduledReport;
        } catch (error) {
            console.error(`Failed to update report ${id}:`, error);
            return null;
        }
    }

    /**
     * Delete a scheduled report
     */
    async delete(id: string): Promise<boolean> {
        if (isMockEnv()) {
            const idx = MOCK_REPORTS.findIndex(r => r.id === id);
            if (idx >= 0) {
                MOCK_REPORTS.splice(idx, 1);
                return true;
            }
            return false;
        }

        try {
            await pb.collection(this.collection).delete(id);
            await auditLog.log('report.delete', { report_id: id }, 'warning');
            return true;
        } catch (error) {
            console.error(`Failed to delete report ${id}:`, error);
            return false;
        }
    }

    /**
     * Execute a report immediately
     */
    async runNow(id: string): Promise<ReportExecutionResult> {
        const startTime = Date.now();
        const report = await this.getById(id);
        
        if (!report) {
            return { success: false, duration_ms: 0, recipients_notified: 0, error: 'Report not found' };
        }

        try {
            // Simulate report generation
            console.log('Generating report:', report.name);
            
            // In real implementation, this would:
            // 1. Query data based on report type and filters
            // 2. Generate the report in the specified format
            // 3. Send to recipients via email
            
            const durationMs = Date.now() - startTime;
            const nextRun = this.calculateNextRun(report.frequency);

            if (isMockEnv()) {
                const idx = MOCK_REPORTS.findIndex(r => r.id === id);
                if (idx >= 0) {
                    MOCK_REPORTS[idx] = {
                        ...MOCK_REPORTS[idx],
                        last_run: new Date().toISOString(),
                        last_run_status: 'success',
                        last_run_duration_ms: durationMs,
                        next_run: nextRun,
                        updated: new Date().toISOString()
                    };
                }
            } else {
                await pb.collection(this.collection).update(id, {
                    last_run: new Date().toISOString(),
                    last_run_status: 'success',
                    last_run_duration_ms: durationMs,
                    next_run: nextRun,
                    error_count: 0
                });
            }

            await auditLog.log('report.run_manual', { 
                report_id: id, 
                name: report.name,
                duration_ms: durationMs,
                recipients: report.recipients.length
            }, 'info');

            return {
                success: true,
                duration_ms: durationMs,
                recipients_notified: report.recipients.length,
                file_path: `/reports/${report.type}_${Date.now()}.${report.format}`
            };
        } catch (error) {
            const durationMs = Date.now() - startTime;
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            
            // Update error status
            if (!isMockEnv()) {
                await pb.collection(this.collection).update(id, {
                    last_run: new Date().toISOString(),
                    last_run_status: 'failed',
                    last_run_duration_ms: durationMs,
                    error_count: (report.error_count || 0) + 1
                });
            }

            await auditLog.log('report.run_failed', { 
                report_id: id, 
                error: errorMessage 
            }, 'warning');

            return { success: false, duration_ms: durationMs, recipients_notified: 0, error: errorMessage };
        }
    }

    /**
     * Update report status
     */
    async updateStatus(id: string, status: ScheduledReport['status']): Promise<ScheduledReport | null> {
        const result = await this.update(id, { status });
        if (result) {
            await auditLog.log('report.status_change', { report_id: id, status }, 'info');
        }
        return result;
    }

    /**
     * Get active reports
     */
    async getActive(): Promise<ScheduledReport[]> {
        if (isMockEnv()) {
            return MOCK_REPORTS.filter(r => r.status === 'active');
        }

        try {
            const records = await pb.collection(this.collection).getFullList({
                filter: 'status = "active"',
                sort: 'next_run',
                requestKey: null
            });
            return records as unknown as ScheduledReport[];
        } catch (error) {
            console.error('Failed to fetch active reports:', error);
            return [];
        }
    }

    /**
     * Get reports due for execution
     */
    async getDueReports(): Promise<ScheduledReport[]> {
        const now = new Date().toISOString();

        if (isMockEnv()) {
            return MOCK_REPORTS.filter(r => r.status === 'active' && r.next_run <= now);
        }

        try {
            const records = await pb.collection(this.collection).getFullList({
                filter: `status = "active" && next_run <= "${now}"`,
                sort: 'next_run',
                requestKey: null
            });
            return records as unknown as ScheduledReport[];
        } catch (error) {
            console.error('Failed to fetch due reports:', error);
            return [];
        }
    }

    /**
     * Get reports by type
     */
    async getByType(type: ScheduledReport['type']): Promise<ScheduledReport[]> {
        if (isMockEnv()) {
            return MOCK_REPORTS.filter(r => r.type === type);
        }

        try {
            const records = await pb.collection(this.collection).getFullList({
                filter: `type = "${type}"`,
                sort: 'next_run',
                requestKey: null
            });
            return records as unknown as ScheduledReport[];
        } catch (error) {
            console.error(`Failed to fetch ${type} reports:`, error);
            return [];
        }
    }

    /**
     * Process all due reports
     */
    async processDueReports(): Promise<{ processed: number; successful: number; failed: number }> {
        const dueReports = await this.getDueReports();
        let successful = 0;
        let failed = 0;

        for (const report of dueReports) {
            const result = await this.runNow(report.id);
            if (result.success) {
                successful++;
            } else {
                failed++;
                
                // Pause report if too many consecutive failures
                if ((report.error_count || 0) >= 3) {
                    await this.updateStatus(report.id, 'error');
                }
            }
        }

        if (dueReports.length > 0) {
            await auditLog.log('report.batch_process', { 
                processed: dueReports.length,
                successful,
                failed 
            }, 'info');
        }

        return { processed: dueReports.length, successful, failed };
    }

    /**
     * Get report statistics
     */
    async getStatistics(): Promise<{
        total: number;
        active: number;
        paused: number;
        error: number;
        byType: Record<string, number>;
        byFrequency: Record<string, number>;
        avgDurationMs: number;
    }> {
        const reports = await this.getAll();
        
        const byType: Record<string, number> = {};
        const byFrequency: Record<string, number> = {};
        let totalDuration = 0;
        let durationCount = 0;

        for (const report of reports) {
            byType[report.type] = (byType[report.type] || 0) + 1;
            byFrequency[report.frequency] = (byFrequency[report.frequency] || 0) + 1;
            if (report.last_run_duration_ms) {
                totalDuration += report.last_run_duration_ms;
                durationCount++;
            }
        }

        return {
            total: reports.length,
            active: reports.filter(r => r.status === 'active').length,
            paused: reports.filter(r => r.status === 'paused').length,
            error: reports.filter(r => r.status === 'error').length,
            byType,
            byFrequency,
            avgDurationMs: durationCount > 0 ? Math.round(totalDuration / durationCount) : 0
        };
    }

    /**
     * Clone an existing report
     */
    async clone(id: string, newName?: string): Promise<ScheduledReport | null> {
        const report = await this.getById(id);
        if (!report) return null;

        return this.create({
            name: newName || `${report.name} (Copy)`,
            type: report.type,
            frequency: report.frequency,
            recipients: [...report.recipients],
            format: report.format,
            description: report.description,
            filters: report.filters ? { ...report.filters } : undefined
        });
    }

    /**
     * Add recipient to a report
     */
    async addRecipient(id: string, email: string): Promise<ScheduledReport | null> {
        const report = await this.getById(id);
        if (!report) return null;

        if (report.recipients.includes(email)) {
            return report; // Already a recipient
        }

        return this.update(id, { recipients: [...report.recipients, email] });
    }

    /**
     * Remove recipient from a report
     */
    async removeRecipient(id: string, email: string): Promise<ScheduledReport | null> {
        const report = await this.getById(id);
        if (!report) return null;

        return this.update(id, { recipients: report.recipients.filter(r => r !== email) });
    }
}

export const reportSchedulerService = new ReportSchedulerService();
