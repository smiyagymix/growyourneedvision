import React from 'react';
import { useCurrentFrame } from 'remotion';
import { interpolate } from '../../../lib/remotion-utils';

export interface Subtitle {
    id: string;
    text: string;
    startFrame: number;
    endFrame: number;
    style?: SubtitleStyle;
}

export interface SubtitleStyle {
    fontSize: number;
    fontFamily: string;
    color: string;
    backgroundColor: string;
    position: 'top' | 'center' | 'bottom';
    alignment: 'left' | 'center' | 'right';
    strokeColor?: string;
    strokeWidth?: number;
}

export interface SubtitleTrackProps {
    subtitles: Subtitle[];
    defaultStyle: SubtitleStyle;
}

export const SubtitleTrack: React.FC<SubtitleTrackProps> = ({ subtitles, defaultStyle }) => {
    const frame = useCurrentFrame();

    const activeSubtitle = subtitles.find(
        sub => frame >= sub.startFrame && frame <= sub.endFrame
    );

    if (!activeSubtitle) return null;

    const style = { ...defaultStyle, ...activeSubtitle.style };

    const fadeInDuration = 5;
    const fadeOutDuration = 5;

    const opacity = Math.min(
        interpolate(frame - activeSubtitle.startFrame, [0, fadeInDuration], [0, 1], { extrapolateRight: 'clamp' }),
        interpolate(frame - (activeSubtitle.endFrame - fadeOutDuration), [0, fadeOutDuration], [1, 0], { extrapolateLeft: 'clamp' })
    );

    const positionStyle: React.CSSProperties = {
        top: style.position === 'top' ? '10%' : style.position === 'center' ? '50%' : 'auto',
        bottom: style.position === 'bottom' ? '10%' : 'auto',
        transform: style.position === 'center' ? 'translateY(-50%)' : undefined,
    };

    return (
        <div
            style={{
                position: 'absolute',
                left: 0,
                right: 0,
                ...positionStyle,
                display: 'flex',
                justifyContent: style.alignment,
                padding: '0 5%',
                opacity,
            }}
        >
            <div
                style={{
                    fontSize: style.fontSize,
                    fontFamily: style.fontFamily,
                    color: style.color,
                    backgroundColor: style.backgroundColor,
                    padding: '10px 20px',
                    borderRadius: '8px',
                    textAlign: style.alignment,
                    maxWidth: '80%',
                    fontWeight: 'bold',
                    ...(style.strokeColor && {
                        WebkitTextStroke: `${style.strokeWidth || 2}px ${style.strokeColor}`,
                        textShadow: `2px 2px 4px rgba(0,0,0,0.8)`,
                    }),
                }}
            >
                {activeSubtitle.text}
            </div>
        </div>
    );
};

export class SubtitleManager {
    static parseJSON(data: string): Subtitle[] {
        try {
            return JSON.parse(data);
        } catch {
            return [];
        }
    }

    static parseSRT(srtContent: string, fps: number): Subtitle[] {
        const subtitles: Subtitle[] = [];
        const blocks = srtContent.trim().split('\n\n');

        blocks.forEach((block, index) => {
            const lines = block.split('\n');
            if (lines.length < 3) return;

            const timeMatch = lines[1].match(/(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})/);
            if (!timeMatch) return;

            const startFrame = this.timeToFrames(timeMatch[1], fps);
            const endFrame = this.timeToFrames(timeMatch[2], fps);
            const text = lines.slice(2).join(' ');

            subtitles.push({
                id: `sub-${index}`,
                text,
                startFrame,
                endFrame,
            });
        });

        return subtitles;
    }

    static timeToFrames(time: string, fps: number): number {
        const [hours, minutes, secondsMillis] = time.split(':');
        const [seconds, millis] = secondsMillis.split(',');

        const totalSeconds =
            parseInt(hours) * 3600 +
            parseInt(minutes) * 60 +
            parseInt(seconds) +
            parseInt(millis) / 1000;

        return Math.round(totalSeconds * fps);
    }

    static framesToTime(frames: number, fps: number): string {
        const totalSeconds = frames / fps;
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = Math.floor(totalSeconds % 60);
        const millis = Math.floor((totalSeconds % 1) * 1000);

        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')},${String(millis).padStart(3, '0')}`;
    }

    static exportToSRT(subtitles: Subtitle[], fps: number): string {
        return subtitles
            .map((sub, index) => {
                const start = this.framesToTime(sub.startFrame, fps);
                const end = this.framesToTime(sub.endFrame, fps);
                return `${index + 1}\n${start} --> ${end}\n${sub.text}\n`;
            })
            .join('\n');
    }
}
