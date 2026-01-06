export interface VideoSegment {
    id: string;
    startFrame: number;
    endFrame: number;
    label?: string;
}

export class VideoTrimmer {
    static createSegment(startFrame: number, endFrame: number, label?: string): VideoSegment {
        return {
            id: `segment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            startFrame,
            endFrame,
            label,
        };
    }

    static splitAt(
        totalDuration: number,
        splitFrame: number
    ): [VideoSegment, VideoSegment] | null {
        if (splitFrame <= 0 || splitFrame >= totalDuration) {
            return null;
        }

        return [
            this.createSegment(0, splitFrame, 'Part 1'),
            this.createSegment(splitFrame, totalDuration, 'Part 2'),
        ];
    }

    static trim(
        totalDuration: number,
        startFrame: number,
        endFrame: number
    ): VideoSegment | null {
        if (startFrame < 0 || endFrame > totalDuration || startFrame >= endFrame) {
            return null;
        }

        return this.createSegment(startFrame, endFrame, 'Trimmed');
    }

    static merge(segments: VideoSegment[]): VideoSegment[] {
        if (segments.length === 0) return [];

        const sorted = [...segments].sort((a, b) => a.startFrame - b.startFrame);
        const merged: VideoSegment[] = [];
        let current = sorted[0];

        for (let i = 1; i < sorted.length; i++) {
            const next = sorted[i];

            if (current.endFrame >= next.startFrame) {
                current = this.createSegment(
                    current.startFrame,
                    Math.max(current.endFrame, next.endFrame),
                    `${current.label || ''} + ${next.label || ''}`.trim()
                );
            } else {
                merged.push(current);
                current = next;
            }
        }

        merged.push(current);
        return merged;
    }

    static getDuration(segment: VideoSegment): number {
        return segment.endFrame - segment.startFrame;
    }

    static getTotalDuration(segments: VideoSegment[]): number {
        return segments.reduce((total, seg) => total + this.getDuration(seg), 0);
    }

    static validateSegment(segment: VideoSegment, totalDuration: number): boolean {
        return (
            segment.startFrame >= 0 &&
            segment.endFrame <= totalDuration &&
            segment.startFrame < segment.endFrame
        );
    }

    static removeSegment(segments: VideoSegment[], segmentId: string): VideoSegment[] {
        return segments.filter(s => s.id !== segmentId);
    }

    static updateSegment(
        segments: VideoSegment[],
        segmentId: string,
        updates: Partial<Pick<VideoSegment, 'startFrame' | 'endFrame' | 'label'>>
    ): VideoSegment[] {
        return segments.map(s =>
            s.id === segmentId ? { ...s, ...updates } : s
        );
    }

    static exportSegmentList(segments: VideoSegment[], fps: number): string {
        return segments
            .map(seg => {
                const start = (seg.startFrame / fps).toFixed(2);
                const end = (seg.endFrame / fps).toFixed(2);
                const duration = ((seg.endFrame - seg.startFrame) / fps).toFixed(2);
                return `${seg.label || 'Segment'}: ${start}s - ${end}s (${duration}s)`;
            })
            .join('\n');
    }
}
