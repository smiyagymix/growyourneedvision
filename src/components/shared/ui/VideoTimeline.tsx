import React from 'react';

export const VideoTimeline: React.FC = () => {
  return (
    <div className="w-full h-32 bg-[#1e1e1e] border-t border-gray-700 flex flex-col">
        <div className="h-6 bg-[#252526] border-b border-gray-700 flex items-center px-2 text-[10px] text-gray-500 font-mono">
            <span>00:00</span>
            <span className="mx-auto">00:15</span>
            <span>00:30</span>
        </div>
        <div className="flex-1 relative p-2 overflow-hidden">
            {/* Track 1 */}
            <div className="h-8 bg-blue-900/50 rounded mb-2 border border-blue-700/50 w-[80%] relative">
                <span className="text-[10px] text-blue-200 px-2">Video Track 1</span>
            </div>
            {/* Track 2 */}
            <div className="h-8 bg-green-900/50 rounded mb-2 border border-green-700/50 w-[60%] left-[20%] relative">
                <span className="text-[10px] text-green-200 px-2">Audio Track 1</span>
            </div>
            {/* Playhead */}
            <div className="absolute top-0 bottom-0 left-[30%] w-0.5 bg-red-500 z-10">
                <div className="absolute -top-1 -left-1.5 w-3 h-3 bg-red-500 transform rotate-45"></div>
            </div>
        </div>
    </div>
  );
};