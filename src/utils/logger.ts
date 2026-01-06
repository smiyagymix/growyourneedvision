/**
 * Production Logger Utility
 * Centralized logging for errors, warnings, and info
 * Sends to console in development, can be extended for production services
 */

export enum LogLevel {
    ERROR = 'error',
    WARN = 'warn',
    INFO = 'info',
    DEBUG = 'debug'
}

export type LogPrimitive = string | number | boolean | null | undefined;
export type LogData = LogPrimitive | { [key: string]: LogData } | LogData[];

export interface LogContext {
    [key: string]: LogData;
    component?: string;
    action?: string;
    userId?: string;
    requestId?: string;
}

interface LogEntry {
    level: LogLevel;
    message: string;
    timestamp: string;
    context?: LogContext;
    stack?: string;
    userId?: string;
}

class Logger {
    private isDevelopment = process.env.NODE_ENV === 'development';
    private logs: LogEntry[] = [];
    private maxLogs = 1000; // Keep last 1000 logs in memory

    /**
     * Log an error
     */
    error(message: string, error?: Error | unknown, context?: LogContext): void {
        const stack = error instanceof Error ? error.stack : undefined;
        
        const entry: LogEntry = {
            level: LogLevel.ERROR,
            message,
            timestamp: new Date().toISOString(),
            context,
            stack: stack || new Error().stack,
            userId: this.getUserId()
        };

        this.addLog(entry);

        if (this.isDevelopment) {
            console.error(`[ERROR] ${message}`, error, context);
        }

        // In production, send to error tracking service
        this.sendToErrorTracking(entry);
    }

    /**
     * Log a warning
     */
    warn(message: string, context?: LogContext): void {
        const entry: LogEntry = {
            level: LogLevel.WARN,
            message,
            timestamp: new Date().toISOString(),
            context,
            userId: this.getUserId()
        };

        this.addLog(entry);

        if (this.isDevelopment) {
            console.warn(`[WARN] ${message}`, context);
        }
    }

    /**
     * Log info
     */
    info(message: string, context?: LogContext): void {
        const entry: LogEntry = {
            level: LogLevel.INFO,
            message,
            timestamp: new Date().toISOString(),
            context,
            userId: this.getUserId()
        };

        this.addLog(entry);

        if (this.isDevelopment) {
            console.log(`[INFO] ${message}`, context);
        }
    }

    /**
     * Log debug info
     */
    debug(message: string, context?: LogContext): void {
        if (!this.isDevelopment) return;

        const entry: LogEntry = {
            level: LogLevel.DEBUG,
            message,
            timestamp: new Date().toISOString(),
            context,
            userId: this.getUserId()
        };

        this.addLog(entry);
        console.log(`[DEBUG] ${message}`, context);
    }

    /**
     * Get recent logs
     */
    getRecentLogs(count: number = 100): LogEntry[] {
        return this.logs.slice(-count);
    }

    /**
     * Get logs by level
     */
    getLogsByLevel(level: LogLevel, count: number = 100): LogEntry[] {
        return this.logs
            .filter(log => log.level === level)
            .slice(-count);
    }

    /**
     * Clear all logs
     */
    clearLogs(): void {
        this.logs = [];
    }

    /**
     * Export logs as JSON
     */
    exportLogs(): string {
        return JSON.stringify(this.logs, null, 2);
    }

    // Private methods

    private addLog(entry: LogEntry): void {
        this.logs.push(entry);

        // Keep only last maxLogs entries
        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(-this.maxLogs);
        }
    }

    private getUserId(): string | undefined {
        try {
            const authData = localStorage.getItem('pocketbase_auth');
            if (authData) {
                const parsed = JSON.parse(authData);
                return parsed?.model?.id;
            }
        } catch {
            return undefined;
        }
    }

    private sendToErrorTracking(entry: LogEntry): void {
        // In production, integrate with services like:
        // - Sentry
        // - LogRocket
        // - Datadog
        // - Custom error tracking endpoint

        if (process.env.NODE_ENV === 'production' && process.env.REACT_APP_ERROR_TRACKING_URL) {
            // Example: Send to custom endpoint
            fetch(process.env.REACT_APP_ERROR_TRACKING_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(entry)
            }).catch(() => {
                // Silently fail - don't break app due to logging issues
            });
        }
    }
}

// Export singleton instance
export const logger = new Logger();

// Convenience exports
export const logError = (message: string, error?: Error | unknown, context?: LogContext) => logger.error(message, error, context);
export const logWarn = (message: string, context?: LogContext) => logger.warn(message, context);
export const logInfo = (message: string, context?: LogContext) => logger.info(message, context);
export const logDebug = (message: string, context?: LogContext) => logger.debug(message, context);
