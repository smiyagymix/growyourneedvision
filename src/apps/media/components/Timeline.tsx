import React from 'react';
import { Icon } from '../../../components/shared/ui/CommonUI';

interface TimelineProps {
    currentFrame: number;
    durationInFrames: number;
    fps: number;
    onSeek: (frame: number) => void;
}

export const Timeline: React.FC<TimelineProps> = ({
    currentFrame,
    durationInFrames,
    fps,
    onSeek,
}) => {
    const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const percentage = x / rect.width;
        const targetFrame = Math.round(percentage * durationInFrames);
        onSeek(Math.max(0, Math.min(durationInFrames - 1, targetFrame)));
    };

    const progressPercentage = (currentFrame / durationInFrames) * 100;
    const currentTime = (currentFrame / fps).toFixed(2);
    const totalTime = (durationInFrames / fps).toFixed(2);

    // Generate frame markers (every second)
    const markers = [];
    for (let frame = 0; frame <= durationInFrames; frame += fps) {
        const position = (frame / durationInFrames) * 100;
        const timeLabel = (frame / fps).toFixed(0);
        markers.push({ frame, position, timeLabel });
    }

    return (
        <div className="space-y-2">
            {/* Time Display */}
            <div className="flex justify-between items-center text-xs text-gray-600 dark:text-gray-400">
                <span className="font-mono">{currentTime}s</span>
                <span className="font-mono">{totalTime}s</span>
            </div>

            {/* Timeline Bar */}
            <div className="relative">
                {/* Markers */}
                <div className="absolute -top-4 left-0 right-0 h-4">
                    {markers.map((marker, index) => (
                        <div
                            key={index}
                            className="absolute flex flex-col items-center"
                            style={{ left: `${marker.position}%`, transform: 'translateX(-50%)' }}
                        >
                            <span className="text-[10px] text-gray-400">{marker.timeLabel}s</span>
                        </div>
                    ))}
                </div>

                {/* Timeline Track */}
                <div
                    onClick={handleClick}
                    className="relative h-8 bg-gray-200 dark:bg-slate-700 rounded-lg cursor-pointer overflow-hidden group"
                >
                    {/* Progress Bar */}
                    <div
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-100"
                        style={{ width: `${progressPercentage}%` }}
                    />

                    {/* Frame Markers (every 30 frames) */}
                    <div className="absolute inset-0 flex">
                        {Array.from({ length: Math.floor(durationInFrames / 30) }).map((_, i) => {
                            const pos = ((i * 30) / durationInFrames) * 100;
                            return (
                                <div
                                    key={i}
                                    className="absolute top-0 bottom-0 w-px bg-gray-300 dark:bg-slate-600"
                                    style={{ left: `${pos}%` }}
                                />
                            );
                        })}
                    </div>

                    {/* Playhead */}
                    <div
                        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg transition-all duration-100"
                        style={{ left: `${progressPercentage}%` }}
                    >
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full">
                            <div className="w-3 h-3 bg-white rounded-full shadow-lg border-2 border-blue-500" />
                        </div>
                    </div>

                    {/* Hover Indicator */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <div className="absolute inset-0 bg-blue-500/10" />
                    </div>
                </div>

                {/* Frame Counter */}
                <div className="text-center mt-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                        Frame {currentFrame} / {durationInFrames}
                    </span>
                </div>
            </div>
        </div>
    );
};
