/**
 * Automated Scheduler Service
 * Manages scheduled tasks for trial reminders, churn monitoring, and report generation
 */

import { churnPredictionService } from './churnPredictionService.js';
import trialManagementService from './trialManagementService.js';
import reportBuilderService from './reportBuilderService.js';

class SchedulerService {
    constructor() {
        this.jobs = new Map();
        this.isRunning = false;
    }

    /**
     * Start the scheduler
     */
    start() {
        if (this.isRunning) {
            console.log('⚠️ Scheduler already running');
            return;
        }

        console.log('🕒 Starting automated scheduler...');
        this.isRunning = true;

        // Schedule trial reminders - every 6 hours
        this.scheduleJob('trial-reminders', () => this.runTrialReminders(), 6 * 60 * 60 * 1000);

        // Schedule churn monitoring - daily at midnight
        this.scheduleDaily('churn-monitoring', () => this.runChurnMonitoring(), 0, 0);

        // Schedule trial expiration processing - every hour
        this.scheduleJob('trial-expirations', () => this.runTrialExpirations(), 60 * 60 * 1000);

        // Schedule weekly performance report - Sunday at 9 AM
        this.scheduleWeekly('weekly-report', () => this.generateWeeklyReport(), 0, 9, 0);

        // Schedule monthly revenue report - 1st of month at 8 AM
        this.scheduleMonthly('monthly-revenue', () => this.generateMonthlyRevenue(), 1, 8, 0);

        console.log(`✅ Scheduler started with ${this.jobs.size} jobs`);
    }

    /**
     * Stop the scheduler
     */
    stop() {
        if (!this.isRunning) {
            console.log('⚠️ Scheduler not running');
            return;
        }

        console.log('🛑 Stopping scheduler...');
        this.jobs.forEach((job, name) => {
            clearInterval(job.intervalId);
            console.log(`  ✓ Stopped job: ${name}`);
        });
        this.jobs.clear();
        this.isRunning = false;
        console.log('✅ Scheduler stopped');
    }

    /**
     * Schedule a job to run at intervals
     */
    scheduleJob(name, task, intervalMs) {
        if (this.jobs.has(name)) {
            console.log(`⚠️ Job ${name} already scheduled`);
            return;
        }

        const job = {
            name,
            task,
            intervalMs,
            lastRun: null,
            nextRun: new Date(Date.now() + intervalMs),
            status: 'scheduled'
        };

        // Run immediately on startup
        this.executeJob(job);

        // Schedule recurring execution
        job.intervalId = setInterval(() => this.executeJob(job), intervalMs);
        this.jobs.set(name, job);

        console.log(`📅 Scheduled job: ${name} (every ${this.formatInterval(intervalMs)})`);
    }

    /**
     * Schedule a job to run daily at specific time
     */
    scheduleDaily(name, task, hours, minutes) {
        const getNextRun = () => {
            const now = new Date();
            const next = new Date(now);
            next.setHours(hours, minutes, 0, 0);
            
            if (next <= now) {
                next.setDate(next.getDate() + 1);
            }
            
            return next;
        };

        const scheduleNext = () => {
            const nextRun = getNextRun();
            const delay = nextRun.getTime() - Date.now();
            
            const job = {
                name,
                task,
                schedule: `Daily at ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`,
                lastRun: null,
                nextRun,
                status: 'scheduled'
            };

            job.timeoutId = setTimeout(() => {
                this.executeJob(job);
                scheduleNext(); // Reschedule for next day
            }, delay);

            this.jobs.set(name, job);
            console.log(`📅 Scheduled daily job: ${name} at ${hours}:${minutes} (next run: ${nextRun.toLocaleString()})`);
        };

        scheduleNext();
    }

    /**
     * Schedule a job to run weekly at specific day and time
     */
    scheduleWeekly(name, task, dayOfWeek, hours, minutes) {
        const getNextRun = () => {
            const now = new Date();
            const next = new Date(now);
            next.setHours(hours, minutes, 0, 0);
            
            const daysUntilTarget = (dayOfWeek - now.getDay() + 7) % 7;
            if (daysUntilTarget === 0 && next <= now) {
                next.setDate(next.getDate() + 7);
            } else if (daysUntilTarget > 0) {
                next.setDate(next.getDate() + daysUntilTarget);
            }
            
            return next;
        };

        const scheduleNext = () => {
            const nextRun = getNextRun();
            const delay = nextRun.getTime() - Date.now();
            
            const job = {
                name,
                task,
                schedule: `Weekly on ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayOfWeek]} at ${hours}:${minutes}`,
                lastRun: null,
                nextRun,
                status: 'scheduled'
            };

            job.timeoutId = setTimeout(() => {
                this.executeJob(job);
                scheduleNext(); // Reschedule for next week
            }, delay);

            this.jobs.set(name, job);
            console.log(`📅 Scheduled weekly job: ${name} on ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek]} at ${hours}:${minutes}`);
        };

        scheduleNext();
    }

    /**
     * Schedule a job to run monthly at specific day and time
     */
    scheduleMonthly(name, task, dayOfMonth, hours, minutes) {
        const getNextRun = () => {
            const now = new Date();
            const next = new Date(now);
            next.setDate(dayOfMonth);
            next.setHours(hours, minutes, 0, 0);
            
            if (next <= now) {
                next.setMonth(next.getMonth() + 1);
            }
            
            return next;
        };

        const scheduleNext = () => {
            const nextRun = getNextRun();
            const delay = nextRun.getTime() - Date.now();
            
            const job = {
                name,
                task,
                schedule: `Monthly on day ${dayOfMonth} at ${hours}:${minutes}`,
                lastRun: null,
                nextRun,
                status: 'scheduled'
            };

            job.timeoutId = setTimeout(() => {
                this.executeJob(job);
                scheduleNext(); // Reschedule for next month
            }, delay);

            this.jobs.set(name, job);
            console.log(`📅 Scheduled monthly job: ${name} on day ${dayOfMonth} at ${hours}:${minutes}`);
        };

        scheduleNext();
    }

    /**
     * Execute a scheduled job
     */
    async executeJob(job) {
        if (job.status === 'running') {
            console.log(`⚠️ Job ${job.name} already running, skipping...`);
            return;
        }

        job.status = 'running';
        const startTime = Date.now();
        
        try {
            console.log(`▶️ Executing job: ${job.name}`);
            await job.task();
            
            const duration = Date.now() - startTime;
            job.lastRun = new Date();
            job.status = 'completed';
            
            console.log(`✅ Job ${job.name} completed in ${duration}ms`);
        } catch (error) {
            const duration = Date.now() - startTime;
            job.status = 'failed';
            job.lastError = error.message;
            
            console.error(`❌ Job ${job.name} failed after ${duration}ms:`, error);
        } finally {
            // Reset status after a delay
            setTimeout(() => {
                if (job.status !== 'scheduled') {
                    job.status = 'scheduled';
                }
            }, 5000);
        }
    }

    /**
     * Run trial reminder notifications
     */
    async runTrialReminders() {
        try {
            console.log('📧 Running trial reminder notifications...');
            const result = await trialManagementService.sendTrialReminders();
            console.log(`  ✓ Sent ${result.reminders.length} trial reminders`);
            return result;
        } catch (error) {
            console.error('  ✗ Error sending trial reminders:', error);
            throw error;
        }
    }

    /**
     * Run churn monitoring and alert on high-risk customers
     */
    async runChurnMonitoring() {
        try {
            console.log('🔍 Running churn monitoring...');
            
            // Get all at-risk customers (risk score >= 50)
            const atRiskCustomers = await churnPredictionService.getAtRiskCustomers(50, 100);
            
            // Get critical risk customers (risk score >= 70)
            const criticalRiskCustomers = atRiskCustomers.filter(c => c.riskScore >= 70);
            
            console.log(`  ℹ️ Found ${atRiskCustomers.length} at-risk customers`);
            console.log(`  ⚠️ Found ${criticalRiskCustomers.length} critical-risk customers`);
            
            // Execute retention actions for critical customers
            const retentionActions = [];
            for (const customer of criticalRiskCustomers.slice(0, 10)) { // Limit to 10 per run
                try {
                    const result = await churnPredictionService.executeRetentionActions(customer.customerId);
                    retentionActions.push(result);
                } catch (error) {
                    console.error(`  ✗ Failed to execute retention for ${customer.customerId}:`, error);
                }
            }
            
            console.log(`  ✓ Executed retention actions for ${retentionActions.length} customers`);
            
            return {
                atRiskCount: atRiskCustomers.length,
                criticalRiskCount: criticalRiskCustomers.length,
                retentionActionsExecuted: retentionActions.length
            };
        } catch (error) {
            console.error('  ✗ Error running churn monitoring:', error);
            throw error;
        }
    }

    /**
     * Process trial expirations
     */
    async runTrialExpirations() {
        try {
            console.log('⏰ Processing trial expirations...');
            const result = await trialManagementService.processTrialExpirations();
            console.log(`  ✓ Processed ${result.converted + result.canceled} trial expirations`);
            console.log(`    - Converted: ${result.converted}`);
            console.log(`    - Canceled: ${result.canceled}`);
            return result;
        } catch (error) {
            console.error('  ✗ Error processing trial expirations:', error);
            throw error;
        }
    }

    /**
     * Generate weekly performance report
     */
    async generateWeeklyReport() {
        try {
            console.log('📊 Generating weekly performance report...');
            
            const endDate = new Date();
            const startDate = new Date(endDate);
            startDate.setDate(startDate.getDate() - 7);
            
            const reportSpec = {
                type: 'subscriptions',
                columns: ['customer', 'status', 'plan', 'amount', 'created'],
                dateRange: { start: startDate.toISOString(), end: endDate.toISOString() },
                groupBy: 'status',
                aggregations: [
                    { field: 'amount', function: 'sum' },
                    { field: 'amount', function: 'avg' }
                ]
            };
            
            const report = await reportBuilderService.buildReport(reportSpec);
            console.log(`  ✓ Generated report with ${report.totalRecords} records`);
            
            // In production, email this report to administrators
            return report;
        } catch (error) {
            console.error('  ✗ Error generating weekly report:', error);
            throw error;
        }
    }

    /**
     * Generate monthly revenue report
     */
    async generateMonthlyRevenue() {
        try {
            console.log('💰 Generating monthly revenue report...');
            
            const endDate = new Date();
            const startDate = new Date(endDate);
            startDate.setMonth(startDate.getMonth() - 1);
            startDate.setDate(1);
            
            const reportSpec = {
                type: 'invoices',
                columns: ['customer', 'total', 'amountPaid', 'status', 'created'],
                dateRange: { start: startDate.toISOString(), end: endDate.toISOString() },
                filters: { paid: true },
                aggregations: [
                    { field: 'total', function: 'sum' },
                    { field: 'amountPaid', function: 'sum' }
                ],
                sort: { field: 'amountPaid', order: 'desc' }
            };
            
            const report = await reportBuilderService.buildReport(reportSpec);
            console.log(`  ✓ Generated revenue report with ${report.totalRecords} paid invoices`);
            console.log(`  💵 Total revenue: $${report.summary.amountPaid?.sum.toFixed(2) || 0}`);
            
            // In production, email this report to finance team
            return report;
        } catch (error) {
            console.error('  ✗ Error generating monthly revenue report:', error);
            throw error;
        }
    }

    /**
     * Get status of all scheduled jobs
     */
    getJobsStatus() {
        const jobs = [];
        this.jobs.forEach((job, name) => {
            jobs.push({
                name,
                status: job.status,
                schedule: job.schedule || `Every ${this.formatInterval(job.intervalMs)}`,
                lastRun: job.lastRun,
                nextRun: job.nextRun,
                lastError: job.lastError
            });
        });
        return {
            isRunning: this.isRunning,
            jobCount: this.jobs.size,
            jobs
        };
    }

    /**
     * Manually trigger a job
     */
    async triggerJob(jobName) {
        const job = this.jobs.get(jobName);
        if (!job) {
            throw new Error(`Job ${jobName} not found`);
        }
        
        await this.executeJob(job);
    }

    /**
     * Format interval in human-readable form
     */
    formatInterval(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) return `${days} day(s)`;
        if (hours > 0) return `${hours} hour(s)`;
        if (minutes > 0) return `${minutes} minute(s)`;
        return `${seconds} second(s)`;
    }
}

export const schedulerService = new SchedulerService();
export default schedulerService;
