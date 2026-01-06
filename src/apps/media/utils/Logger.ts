export enum LogLevel {
    DEBUG = 'debug',
    INFO = 'info',
    WARN = 'warn',
    ERROR = 'error',
}

export interface LogEntry {
    level: LogLevel;
    message: string;
    timestamp: Date;
    context?: Record<string, unknown>;
    error?: Error;
}

export class Logger {
    private static instance: Logger;
    private logs: LogEntry[] = [];
    private maxLogs: number = 1000;
    private minLevel: LogLevel = LogLevel.INFO;

    private constructor() { }

    static getInstance(): Logger {
        if (!this.instance) {
            this.instance = new Logger();
        }
        return this.instance;
    }

    setMinLevel(level: LogLevel): void {
        this.minLevel = level;
    }

    setMaxLogs(max: number): void {
        this.maxLogs = max;
    }

    private shouldLog(level: LogLevel): boolean {
        const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
        const minIndex = levels.indexOf(this.minLevel);
        const currentIndex = levels.indexOf(level);
        return currentIndex >= minIndex;
    }

    private log(level: LogLevel, message: string, context?: Record<string, unknown>, error?: Error): void {
        if (!this.shouldLog(level)) return;

        const entry: LogEntry = {
            level,
            message,
            timestamp: new Date(),
            context,
            error,
        };

        this.logs.push(entry);

        // Trim logs if exceeding max
        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(-this.maxLogs);
        }

        // Console output
        const consoleMethod = level === LogLevel.ERROR ? console.error :
            level === LogLevel.WARN ? console.warn :
                console.log;

        const contextStr = context ? ` | Context: ${JSON.stringify(context)}` : '';
        const errorStr = error ? ` | Error: ${error.message}` : '';

        consoleMethod(`[${level.toUpperCase()}] ${message}${contextStr}${errorStr}`);
    }

    debug(message: string, context?: Record<string, unknown>): void {
        this.log(LogLevel.DEBUG, message, context);
    }

    info(message: string, context?: Record<string, unknown>): void {
        this.log(LogLevel.INFO, message, context);
    }

    warn(message: string, context?: Record<string, unknown>): void {
        this.log(LogLevel.WARN, message, context);
    }

    error(message: string, error?: Error, context?: Record<string, unknown>): void {
        this.log(LogLevel.ERROR, message, context, error);
    }

    getLogs(level?: LogLevel): LogEntry[] {
        if (level) {
            return this.logs.filter(log => log.level === level);
        }
        return [...this.logs];
    }

    clearLogs(): void {
        this.logs = [];
    }

    exportLogs(): string {
        return JSON.stringify(this.logs, null, 2);
    }

    async sendToServer(endpoint: string): Promise<void> {
        try {
            await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: this.exportLogs(),
            });
            this.info('Logs sent to server successfully');
        } catch (error) {
            this.error('Failed to send logs to server', error as Error);
        }
    }
}

export const logger = Logger.getInstance();

// Convenience exports
export const logDebug = (msg: string, ctx?: Record<string, unknown>) => logger.debug(msg, ctx);
export const logInfo = (msg: string, ctx?: Record<string, unknown>) => logger.info(msg, ctx);
export const logWarn = (msg: string, ctx?: Record<string, unknown>) => logger.warn(msg, ctx);
export const logError = (msg: string, err?: Error, ctx?: Record<string, unknown>) => logger.error(msg, err, ctx);
