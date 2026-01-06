export interface PerformanceMetrics {
    renderTime: number;
    frameRate: number;
    droppedFrames: number;
    memoryUsage: number;
    cpuUsage: number;
}

export interface PerformanceSnapshot {
    timestamp: Date;
    metrics: PerformanceMetrics;
    actionType: string;
}

export class PerformanceMonitor {
    private snapshots: PerformanceSnapshot[] = [];
    private maxSnapshots: number = 1000;
    private performanceObserver: PerformanceObserver | null = null;

    startMonitoring(): void {
        if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
            return;
        }

        this.performanceObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (entry.entryType === 'measure') {
                    this.recordSnapshot({
                        timestamp: new Date(),
                        metrics: this.getCurrentMetrics(),
                        actionType: entry.name,
                    });
                }
            }
        });

        this.performanceObserver.observe({ entryTypes: ['measure'] });
    }

    stopMonitoring(): void {
        if (this.performanceObserver) {
            this.performanceObserver.disconnect();
            this.performanceObserver = null;
        }
    }

    getCurrentMetrics(): PerformanceMetrics {
        const memory = this.getMemoryUsage();

        return {
            renderTime: 0, // Would be set during actual render
            frameRate: this.getFPS(),
            droppedFrames: 0,
            memoryUsage: memory,
            cpuUsage: 0, // Not directly available in browser
        };
    }

    private getMemoryUsage(): number {
        if (typeof performance !== 'undefined' && 'memory' in performance) {
            const mem = (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory;
            return mem ? mem.usedJSHeapSize / (1024 * 1024) : 0;
        }
        return 0;
    }

    private getFPS(): number {
        if (typeof window === 'undefined') return 60;

        let lastTime = performance.now();
        let frames = 0;
        let fps = 60;

        const countFrames = () => {
            frames++;
            const currentTime = performance.now();

            if (currentTime >= lastTime + 1000) {
                fps = Math.round((frames * 1000) / (currentTime - lastTime));
                frames = 0;
                lastTime = currentTime;
            }

            requestAnimationFrame(countFrames);
        };

        requestAnimationFrame(countFrames);
        return fps;
    }

    recordSnapshot(snapshot: PerformanceSnapshot): void {
        this.snapshots.push(snapshot);

        if (this.snapshots.length > this.maxSnapshots) {
            this.snapshots.shift();
        }
    }

    getSnapshots(): PerformanceSnapshot[] {
        return [...this.snapshots];
    }

    getAverageMetrics(timeRange?: { start: Date; end: Date }): PerformanceMetrics {
        let relevantSnapshots = this.snapshots;

        if (timeRange) {
            relevantSnapshots = this.snapshots.filter(s =>
                s.timestamp >= timeRange.start && s.timestamp <= timeRange.end
            );
        }

        if (relevantSnapshots.length === 0) {
            return {
                renderTime: 0,
                frameRate: 0,
                droppedFrames: 0,
                memoryUsage: 0,
                cpuUsage: 0,
            };
        }

        const sum = relevantSnapshots.reduce(
            (acc, s) => ({
                renderTime: acc.renderTime + s.metrics.renderTime,
                frameRate: acc.frameRate + s.metrics.frameRate,
                droppedFrames: acc.droppedFrames + s.metrics.droppedFrames,
                memoryUsage: acc.memoryUsage + s.metrics.memoryUsage,
                cpuUsage: acc.cpuUsage + s.metrics.cpuUsage,
            }),
            { renderTime: 0, frameRate: 0, droppedFrames: 0, memoryUsage: 0, cpuUsage: 0 }
        );

        const count = relevantSnapshots.length;

        return {
            renderTime: sum.renderTime / count,
            frameRate: sum.frameRate / count,
            droppedFrames: sum.droppedFrames / count,
            memoryUsage: sum.memoryUsage / count,
            cpuUsage: sum.cpuUsage / count,
        };
    }

    clearSnapshots(): void {
        this.snapshots = [];
    }

    generateReport(): string {
        const avg = this.getAverageMetrics();

        return `
Performance Report
==================
Average Render Time: ${avg.renderTime.toFixed(2)}ms
Average FPS: ${avg.frameRate.toFixed(1)}
Total Dropped Frames: ${avg.droppedFrames}
Average Memory Usage: ${avg.memoryUsage.toFixed(2)}MB
Snapshots Recorded: ${this.snapshots.length}
        `.trim();
    }
}

export const performanceMonitor = new PerformanceMonitor();
