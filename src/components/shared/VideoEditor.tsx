import React, { useRef, useState, useEffect } from 'react';
import { Button } from './ui/CommonUI';
import { OwnerIcon } from './OwnerIcons';

export const VideoEditor: React.FC = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [videoSrc, setVideoSrc] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [trimStart, setTrimStart] = useState(0);
    const [trimEnd, setTrimEnd] = useState(0);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setVideoSrc(url);
            setTrimStart(0);
            setTrimEnd(0); // Will update when metadata loads
        }
    };

    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            const dur = videoRef.current.duration;
            setDuration(dur);
            setTrimEnd(dur);
        }
    };

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            const time = videoRef.current.currentTime;
            setCurrentTime(time);
            
            // Loop if outside trim
            if (time >= trimEnd) {
                videoRef.current.pause();
                setIsPlaying(false);
                videoRef.current.currentTime = trimStart;
            }
        }
    };

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                if (videoRef.current.currentTime >= trimEnd) {
                    videoRef.current.currentTime = trimStart;
                }
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleExport = () => {
        alert(`Exporting video from ${formatTime(trimStart)} to ${formatTime(trimEnd)} (Simulation)`);
    };

    return (
        <div className="flex flex-col h-full bg-gray-900 rounded-xl overflow-hidden text-white">
            <div className="flex-1 relative flex items-center justify-center bg-black">
                {videoSrc ? (
                    <video 
                        ref={videoRef}
                        src={videoSrc}
                        className="max-h-full max-w-full"
                        onLoadedMetadata={handleLoadedMetadata}
                        onTimeUpdate={handleTimeUpdate}
                        onClick={togglePlay}
                    />
                ) : (
                    <div className="text-center p-10">
                        <OwnerIcon name="VideoCameraIcon" className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                        <p className="text-gray-400 mb-4">Upload a video to start editing</p>
                        <label className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg cursor-pointer transition-colors inline-flex items-center gap-2">
                            <OwnerIcon name="ArrowUpTrayIcon" className="w-4 h-4" />
                            Select Video
                            <input type="file" accept="video/*" className="hidden" onChange={handleFileChange} />
                        </label>
                    </div>
                )}
            </div>

            {videoSrc && (
                <div className="p-4 bg-gray-800 border-t border-gray-700">
                    {/* Controls */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <button type="button" onClick={togglePlay} className="p-2 rounded-full bg-white text-black hover:bg-gray-200 transition-colors">
                                <OwnerIcon name={isPlaying ? "PauseIcon" : "PlayIcon"} className="w-6 h-6" />
                            </button>
                            <span className="font-mono text-sm">
                                {formatTime(currentTime)} / {formatTime(duration)}
                            </span>
                        </div>
                        <Button variant="primary" size="sm" onClick={handleExport}>
                            Export Trimmed
                        </Button>
                    </div>

                    {/* Timeline */}
                    <div className="relative h-12 bg-gray-700 rounded-lg mb-2 select-none">
                        {/* Progress Bar */}
                        <div 
                            className="absolute top-0 bottom-0 bg-blue-500/30"
                            style={{ 
                                left: `${(trimStart / duration) * 100}%`, 
                                width: `${((trimEnd - trimStart) / duration) * 100}%` 
                            }}
                        ></div>
                        
                        {/* Playhead */}
                        <div 
                            className="absolute top-0 bottom-0 w-0.5 bg-white z-10"
                            style={{ left: `${(currentTime / duration) * 100}%` }}
                        ></div>

                        {/* Trim Handles */}
                        <input 
                            type="range" 
                            min={0} 
                            max={duration} 
                            step={0.1}
                            value={trimStart}
                            onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                if (val < trimEnd) setTrimStart(val);
                            }}
                            className="absolute w-full h-full opacity-0 cursor-ew-resize z-20"
                            title="Start Trim"
                        />
                         <input 
                            type="range" 
                            min={0} 
                            max={duration} 
                            step={0.1}
                            value={trimEnd}
                            onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                if (val > trimStart) setTrimEnd(val);
                            }}
                            className="absolute w-full h-full opacity-0 cursor-ew-resize z-20"
                            title="End Trim"
                        />
                        
                        {/* Visual Handles */}
                        <div 
                            className="absolute top-0 bottom-0 w-4 bg-yellow-500 cursor-ew-resize flex items-center justify-center rounded-l"
                            style={{ left: `${(trimStart / duration) * 100}%`, transform: 'translateX(-100%)' }}
                        >
                            <div className="w-1 h-4 bg-black/20 rounded-full"></div>
                        </div>
                        <div 
                            className="absolute top-0 bottom-0 w-4 bg-yellow-500 cursor-ew-resize flex items-center justify-center rounded-r"
                            style={{ left: `${(trimEnd / duration) * 100}%` }}
                        >
                            <div className="w-1 h-4 bg-black/20 rounded-full"></div>
                        </div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400">
                        <span>Start: {formatTime(trimStart)}</span>
                        <span>End: {formatTime(trimEnd)}</span>
                    </div>
                </div>
            )}
        </div>
    );
};
