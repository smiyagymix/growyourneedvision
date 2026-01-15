/**
 * Comprehensive Logging and Monitoring Utility
 * Provides structured logging with different severity levels and monitoring
 */

import { Metadata } from '../types/common';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Metadata;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  userId?: string;
  requestId?: string;
  duration?: number;
}

export interface LoggerConfig {
  minLevel?: LogLevel;
  maxEntries?: number;
  onLog?: (entry: LogEntry) => void;
  enableConsole?: boolean;
  enableStorage?: boolean;
  storageName?: string;
}

/**
 * Advanced Logger with structured logging
 */
export class Logger {
  private config: Required<LoggerConfig>;
  private logs: LogEntry[] = [];
  private metrics: Map<string, number[]> = new Map();
  private timers: Map<string, number> = new Map();

  constructor(config: LoggerConfig = {}) {
    this.config = {
      minLevel: config.minLevel ?? LogLevel.DEBUG,
      maxEntries: config.maxEntries ?? 1000,
      onLog: config.onLog ?? (() => {}),
      enableConsole: config.enableConsole ?? true,
      enableStorage: config.enableStorage ?? true,
      storageName: config.storageName ?? 'gyn_logs',
    };

    this.restoreLogs();
  }

  /**
   * Log at DEBUG level
   */
  debug(message: string, context?: Metadata, requestId?: string): void {
    this.log(LogLevel.DEBUG, message, context, requestId);
  }

  /**
   * Log at INFO level
   */
  info(message: string, context?: Metadata, requestId?: string): void {
    this.log(LogLevel.INFO, message, context, requestId);
  }

  /**
   * Log at WARN level
   */
  warn(message: string, context?: Metadata, requestId?: string): void {
    this.log(LogLevel.WARN, message, context, requestId);
  }

  /**
   * Log at ERROR level
   */
  error(message: string, error?: Error | unknown, context?: Metadata, requestId?: string): void {
    const errorObj = error instanceof Error
      ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      }
      : error
      ? {
        name: 'Unknown',
        message: String(error),
      }
      : undefined;

    this.log(LogLevel.ERROR, message, context, requestId, errorObj);
  }

  /**
   * Core logging method
   */
  private log(
    level: LogLevel,
    message: string,
    context?: Metadata,
    requestId?: string,
    error?: LogEntry['error']
  ): void {
    if (level < this.config.minLevel) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      error,
      requestId,
    };

    // Add to logs
    this.logs.push(entry);

    // Enforce max entries
    if (this.logs.length > this.config.maxEntries) {
      this.logs = this.logs.slice(-this.config.maxEntries);
    }

    // Call hook
    this.config.onLog(entry);

    // Log to console
    if (this.config.enableConsole) {
      this.logToConsole(entry);
    }

    // Persist to storage
    if (this.config.enableStorage) {
      this.persistLogs();
    }
  }

  /**
   * Log to console with colors
   */
  private logToConsole(entry: LogEntry): void {
    const colors = {
      [LogLevel.DEBUG]: 'color: #777',
      [LogLevel.INFO]: 'color: #2196F3',
      [LogLevel.WARN]: 'color: #FF9800',
      [LogLevel.ERROR]: 'color: #F44336',
    };

    const levelName = LogLevel[entry.level];
    const style = colors[entry.level];

    console.log(
      `%c[${entry.timestamp}] [${levelName}]${entry.requestId ? ` [${entry.requestId}]` : ''} ${entry.message}`,
      style,
      entry.context,
      entry.error
    );
  }

  /**
   * Time a function execution
   */
  startTimer(label: string): void {
    this.timers.set(label, Date.now());
  }

  /**
   * End timer and log duration
   */
  endTimer(label: string, context?: Metadata): number {
    const startTime = this.timers.get(label);
    if (!startTime) {
      console.warn(`Timer "${label}" not found`);
      return 0;
    }

    const duration = Date.now() - startTime;
    this.timers.delete(label);

    this.info(`Timer "${label}" completed`, { ...context, duration });

    // Track metric
    this.recordMetric(label, duration);

    return duration;
  }

  /**
   * Record a metric
   */
  recordMetric(metricName: string, value: number): void {
    const values = this.metrics.get(metricName) || [];
    values.push(value);

    // Keep only last 100 values
    if (values.length > 100) {
      values.shift();
    }

    this.metrics.set(metricName, values);
  }

  /**
   * Get metric statistics
   */
  getMetricStats(metricName: string): {
    count: number;
    min: number;
    max: number;
    avg: number;
    p95: number;
    p99: number;
  } | null {
    const values = this.metrics.get(metricName);
    if (!values || values.length === 0) {
      return null;
    }

    const sorted = [...values].sort((a, b) => a - b);
    const count = values.length;
    const sum = values.reduce((a, b) => a + b, 0);

    return {
      count,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: sum / count,
      p95: sorted[Math.floor(count * 0.95)],
      p99: sorted[Math.floor(count * 0.99)],
    };
  }

  /**
   * Get all logs
   */
  getLogs(
    filter?: {
      level?: LogLevel;
      startTime?: Date;
      endTime?: Date;
      requestId?: string;
    }
  ): LogEntry[] {
    let result = [...this.logs];

    if (filter?.level !== undefined) {
      const level = filter.level;
      result = result.filter((log) => log.level >= level);
    }

    if (filter?.startTime) {
      result = result.filter((log) => new Date(log.timestamp) >= filter.startTime!);
    }

    if (filter?.endTime) {
      result = result.filter((log) => new Date(log.timestamp) <= filter.endTime!);
    }

    if (filter?.requestId) {
      result = result.filter((log) => log.requestId === filter.requestId);
    }

    return result;
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = [];
    try {
      localStorage.removeItem(this.config.storageName);
    } catch (error) {
      console.warn('Failed to clear logs from storage:', error);
    }
  }

  /**
   * Export logs as JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Export logs as CSV
   */
  exportLogsAsCSV(): string {
    if (this.logs.length === 0) {
      return 'timestamp,level,message,context,error\n';
    }

    const headers = ['timestamp', 'level', 'message', 'context', 'error'];
    const rows = this.logs.map((log) => [
      log.timestamp,
      LogLevel[log.level],
      log.message,
      JSON.stringify(log.context || {}),
      log.error ? JSON.stringify(log.error) : '',
    ]);

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    return csv;
  }

  /**
   * Persist logs to localStorage
   */
  private persistLogs(): void {
    try {
      localStorage.setItem(this.config.storageName, JSON.stringify(this.logs));
    } catch (error) {
      console.warn('Failed to persist logs to storage:', error);
    }
  }

  /**
   * Restore logs from localStorage
   */
  private restoreLogs(): void {
    try {
      const stored = localStorage.getItem(this.config.storageName);
      if (stored) {
        this.logs = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to restore logs from storage:', error);
    }
  }

  /**
   * Create a child logger with a prefix
   */
  createChild(prefix: string): Logger {
    const child = new Logger(this.config);
    const originalLog = child.log.bind(child);

    child.log = (level: LogLevel, message: string, context?: Metadata, requestId?: string, error?: LogEntry['error']) => {
      return originalLog(level, `[${prefix}] ${message}`, context, requestId, error);
    };

    return child;
  }

  /**
   * Get logger statistics
   */
  getStatistics(): {
    totalLogs: number;
    byLevel: Record<string, number>;
    errors: LogEntry[];
    warnings: LogEntry[];
    metricsCount: number;
  } {
    const byLevel: Record<string, number> = {};

    this.logs.forEach((log) => {
      const levelName = LogLevel[log.level];
      byLevel[levelName] = (byLevel[levelName] || 0) + 1;
    });

    return {
      totalLogs: this.logs.length,
      byLevel,
      errors: this.logs.filter((log) => log.level === LogLevel.ERROR),
      warnings: this.logs.filter((log) => log.level === LogLevel.WARN),
      metricsCount: this.metrics.size,
    };
  }
}

/**
 * Global logger instance
 */
export const globalLogger = new Logger({
  minLevel: LogLevel.DEBUG,
  enableConsole: true,
  enableStorage: true,
});

/**
 * Logger decorator for methods
 */
export function logMethod(prefix?: string) {
  return (target: object, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;
    const methodPrefix = prefix || target.constructor.name;

    descriptor.value = function (this: unknown, ...args: unknown[]) {
      const label = `${methodPrefix}.${propertyKey}`;
      globalLogger.startTimer(label);
      globalLogger.debug(`Calling ${label}`, { args });

      try {
        const result = originalMethod.apply(this, args);

        if (result instanceof Promise) {
          return result
            .then((res) => {
              globalLogger.endTimer(label);
              return res;
            })
            .catch((error) => {
              globalLogger.error(`${label} failed`, error);
              globalLogger.endTimer(label);
              throw error;
            });
        }

        globalLogger.endTimer(label);
        return result;
      } catch (error) {
        globalLogger.error(`${label} failed`, error);
        globalLogger.endTimer(label);
        throw error;
      }
    };

    return descriptor;
  };
}

export default {
  Logger,
  LogLevel,
  globalLogger,
  logMethod,
};
