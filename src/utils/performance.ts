/**
 * Performance Monitoring Utility
 * Track performance metrics, API response times, and render performance
 */

import { LogContext } from './logger';

export interface PerformanceMetric {
    name: string;
    value: number;
    unit: 'ms' | 'bytes' | 'count';
    timestamp: string;
    context?: LogContext;
}

interface PerformanceWithMemory extends Performance {
    memory?: {
        usedJSHeapSize: number;
        totalJSHeapSize: number;
        jsHeapSizeLimit: number;
    };
}

class PerformanceMonitor {
    private metrics: PerformanceMetric[] = [];
    private maxMetrics = 1000;
    private isDevelopment = process.env.NODE_ENV === 'development';

    /**
     * Mark the start of a performance measurement
     */
    mark(name: string): void {
        if (typeof performance !== 'undefined') {
            performance.mark(name);
        }
    }

    /**
     * Measure time between two marks
     */
    measure(name: string, startMark: string, endMark: string): number | null {
        if (typeof performance === 'undefined') return null;

        try {
            performance.measure(name, startMark, endMark);
            const entries = performance.getEntriesByName(name);
            if (entries.length > 0) {
                const duration = entries[entries.length - 1].duration;
                this.recordMetric(name, duration, 'ms');
                return duration;
            }
        } catch (error) {
            console.warn('Performance measurement failed:', error);
        }
        return null;
    }

    /**
     * Time a function execution
     */
    async timeAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
        const startTime = performance.now();
        try {
            const result = await fn();
            const duration = performance.now() - startTime;
            this.recordMetric(name, duration, 'ms');

            if (this.isDevelopment && duration > 1000) {
                console.warn(`[Performance] ${name} took ${duration.toFixed(2)}ms`);
            }

            return result;
        } catch (error) {
            const duration = performance.now() - startTime;
            this.recordMetric(`${name}_error`, duration, 'ms');
            throw error;
        }
    }

    /**
     * Time a synchronous function
     */
    time<T>(name: string, fn: () => T): T {
        const startTime = performance.now();
        try {
            const result = fn();
            const duration = performance.now() - startTime;
            this.recordMetric(name, duration, 'ms');

            if (this.isDevelopment && duration > 100) {
                console.warn(`[Performance] ${name} took ${duration.toFixed(2)}ms`);
            }

            return result;
        } catch (error) {
            const duration = performance.now() - startTime;
            this.recordMetric(`${name}_error`, duration, 'ms');
            throw error;
        }
    }

    /**
     * Track API call performance
     */
    trackAPICall(endpoint: string, duration: number, status: number): void {
        this.recordMetric(`api_${endpoint}`, duration, 'ms', {
            status,
            success: status >= 200 && status < 300
        });

        if (this.isDevelopment && duration > 2000) {
            console.warn(`[Performance] API call to ${endpoint} took ${duration.toFixed(2)}ms`);
        }
    }

    /**
     * Track component render time
     */
    trackRender(componentName: string, duration: number): void {
        this.recordMetric(`render_${componentName}`, duration, 'ms');

        if (this.isDevelopment && duration > 16) { // 60fps threshold
            console.warn(`[Performance] ${componentName} render took ${duration.toFixed(2)}ms (>16ms)`);
        }
    }

    /**
     * Get Core Web Vitals
     */
    getCoreWebVitals(): {
        FCP?: number;
        LCP?: number;
        FID?: number;
        CLS?: number;
        TTFB?: number;
    } {
        if (typeof performance === 'undefined') return {};

        const vitals: Record<string, number> = {};

        // First Contentful Paint
        const fcpEntries = performance.getEntriesByName('first-contentful-paint');
        if (fcpEntries.length > 0) {
            vitals.FCP = fcpEntries[0].startTime;
        }

        // Largest Contentful Paint
        const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            vitals.LCP = lastEntry.startTime;
        });

        try {
            observer.observe({ type: 'largest-contentful-paint', buffered: true });
        } catch { }

        // Time to First Byte
        const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
        if (navigationEntries.length > 0) {
            vitals.TTFB = navigationEntries[0].responseStart - navigationEntries[0].requestStart;
        }

        return vitals;
    }

    /**
     * Get memory usage (if available)
     */
    getMemoryUsage(): { used: number; total: number } | null {
        const perf = typeof performance !== 'undefined' ? performance as PerformanceWithMemory : null;
        
        if (perf && perf.memory) {
            return {
                used: perf.memory.usedJSHeapSize,
                total: perf.memory.totalJSHeapSize
            };
        }
        return null;
    }

    /**
     * Get recent metrics
     */
    getRecentMetrics(count: number = 100): PerformanceMetric[] {
        return this.metrics.slice(-count);
    }

    /**
     * Get metrics by name pattern
     */
    getMetricsByPattern(pattern: string): PerformanceMetric[] {
        const regex = new RegExp(pattern);
        return this.metrics.filter(m => regex.test(m.name));
    }

    /**
     * Get average for a metric
     */
    getAverage(metricName: string): number | null {
        const metrics = this.metrics.filter(m => m.name === metricName);
        if (metrics.length === 0) return null;

        const sum = metrics.reduce((acc, m) => acc + m.value, 0);
        return sum / metrics.length;
    }

    /**
     * Clear all metrics
     */
    clearMetrics(): void {
        this.metrics = [];
        if (typeof performance !== 'undefined') {
            performance.clearMarks();
            performance.clearMeasures();
        }
    }

    /**
     * Export metrics as JSON
     */
    exportMetrics(): string {
        return JSON.stringify(this.metrics, null, 2);
    }

    /**
     * Generate performance report
     */
    generateReport(): {
        totalMetrics: number;
        slowOperations: PerformanceMetric[];
        averages: Record<string, number>;
        webVitals: Record<string, number | undefined>;
        memory: { used: number; total: number } | null;
    } {
        const slowOps = this.metrics.filter(m => m.unit === 'ms' && m.value > 1000);

        const uniqueNames = Array.from(new Set(this.metrics.map(m => m.name)));
        const averages: Record<string, number> = {};
        uniqueNames.forEach(name => {
            const avg = this.getAverage(name);
            if (avg !== null) averages[name] = avg;
        });

        return {
            totalMetrics: this.metrics.length,
            slowOperations: slowOps.slice(-20),
            averages,
            webVitals: this.getCoreWebVitals(),
            memory: this.getMemoryUsage()
        };
    }

    // Private methods

    private recordMetric(name: string, value: number, unit: 'ms' | 'bytes' | 'count', context?: LogContext): void {
        const metric: PerformanceMetric = {
            name,
            value,
            unit,
            timestamp: new Date().toISOString(),
            context
        };

        this.metrics.push(metric);

        // Keep only last maxMetrics entries
        if (this.metrics.length > this.maxMetrics) {
            this.metrics = this.metrics.slice(-this.maxMetrics);
        }

        // Send to monitoring service in production
        if (process.env.NODE_ENV === 'production') {
            this.sendToMonitoring(metric);
        }
    }

    private sendToMonitoring(metric: PerformanceMetric): void {
        // Send to performance monitoring service (e.g., New Relic, Datadog)
        if (process.env.REACT_APP_PERFORMANCE_MONITORING_URL) {
            fetch(process.env.REACT_APP_PERFORMANCE_MONITORING_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(metric)
            }).catch(() => {
                // Silently fail
            });
        }
    }
}

// Export singleton instance
export const perfMonitor = new PerformanceMonitor();

// Convenience exports
export const markPerf = (name: string) => perfMonitor.mark(name);
export const measurePerf = (name: string, start: string, end: string) => perfMonitor.measure(name, start, end);
export const timeAsync = <T,>(name: string, fn: () => Promise<T>) => perfMonitor.timeAsync(name, fn);
export const trackAPI = (endpoint: string, duration: number, status: number) => perfMonitor.trackAPICall(endpoint, duration, status);
