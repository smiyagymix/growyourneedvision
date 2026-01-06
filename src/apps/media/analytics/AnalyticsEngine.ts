import pb from '../../../lib/pocketbase';

export interface AnalyticsEvent {
    type: 'video_created' | 'video_exported' | 'template_used' | 'effect_applied' | 'scene_added';
    timestamp: Date;
    metadata: Record<string, string | number | boolean>;
}

export interface UsageStatistics {
    totalVideosCreated: number;
    totalExports: number;
    mostUsedTemplate: string;
    mostUsedEffect: string;
    averageVideoDuration: number;
    totalRenderTime: number;
}

export class AnalyticsEngine {
    private events: AnalyticsEvent[] = [];
    private maxEvents: number = 10000;

    async trackEvent(
        type: AnalyticsEvent['type'],
        metadata: Record<string, string | number | boolean>
    ): Promise<void> {
        const event: AnalyticsEvent = {
            type,
            timestamp: new Date(),
            metadata,
        };

        this.events.push(event);

        if (this.events.length > this.maxEvents) {
            this.events.shift();
        }

        // Save to database
        try {
            await pb.collection('analytics_events').create({
                type,
                metadata: JSON.stringify(metadata),
                user_id: pb.authStore.model?.id,
                occurred_at: event.timestamp.toISOString(),
            });
        } catch (error) {
            console.error('Failed to save analytics event:', error);
        }
    }

    getEvents(type?: AnalyticsEvent['type']): AnalyticsEvent[] {
        if (type) {
            return this.events.filter(e => e.type === type);
        }
        return [...this.events];
    }

    getEventsByDateRange(start: Date, end: Date): AnalyticsEvent[] {
        return this.events.filter(e =>
            e.timestamp >= start && e.timestamp <= end
        );
    }

    getStatistics(): UsageStatistics {
        const videoCreated = this.getEvents('video_created');
        const exports = this.getEvents('video_exported');
        const templatesUsed = this.getEvents('template_used');
        const effects = this.getEvents('effect_applied');

        const templateCounts: Record<string, number> = {};
        templatesUsed.forEach(e => {
            const template = e.metadata.template as string;
            templateCounts[template] = (templateCounts[template] || 0) + 1;
        });

        const effectCounts: Record<string, number> = {};
        effects.forEach(e => {
            const effect = e.metadata.effect as string;
            effectCounts[effect] = (effectCounts[effect] || 0) + 1;
        });

        const mostUsedTemplate = Object.entries(templateCounts)
            .sort((a, b) => b[1] - a[1])[0]?.[0] || 'None';

        const mostUsedEffect = Object.entries(effectCounts)
            .sort((a, b) => b[1] - a[1])[0]?.[0] || 'None';

        const durations = videoCreated
            .map(e => e.metadata.duration as number)
            .filter(d => typeof d === 'number');

        const averageVideoDuration = durations.length > 0
            ? durations.reduce((sum, d) => sum + d, 0) / durations.length
            : 0;

        const renderTimes = exports
            .map(e => e.metadata.renderTime as number)
            .filter(t => typeof t === 'number');

        const totalRenderTime = renderTimes.reduce((sum, t) => sum + t, 0);

        return {
            totalVideosCreated: videoCreated.length,
            totalExports: exports.length,
            mostUsedTemplate,
            mostUsedEffect,
            averageVideoDuration,
            totalRenderTime,
        };
    }

    clearEvents(): void {
        this.events = [];
    }

    ToCSV(): string {
        const headers = ['Type', 'Timestamp', 'Metadata'];
        const rows = this.events.map(e => [
            e.type,
            e.timestamp.toISOString(),
            JSON.stringify(e.metadata),
        ]);

        return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
}

export const analytics = new AnalyticsEngine();
