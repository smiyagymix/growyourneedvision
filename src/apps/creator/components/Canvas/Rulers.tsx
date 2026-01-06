import React from 'react';

export const Rulers: React.FC = () => {
    return (
        <div className="absolute inset-0 pointer-events-none z-50">
            {/* Top Ruler */}
            <div className="absolute top-0 left-0 right-0 h-6 bg-[#1f1f22] border-b border-[#27272a] flex items-end">
                {Array.from({ length: 100 }).map((_, i) => (
                    <div key={i} className="h-2 border-r border-gray-600 w-[50px] relative">
                        <span className="absolute -top-4 left-1 text-[8px] text-gray-500">{i * 50}</span>
                    </div>
                ))}
            </div>
            {/* Left Ruler */}
            <div className="absolute top-0 left-0 bottom-0 w-6 bg-[#1f1f22] border-r border-[#27272a] flex flex-col items-end pt-6">
                {Array.from({ length: 100 }).map((_, i) => (
                    <div key={i} className="w-2 border-b border-gray-600 h-[50px] relative">
                        <span className="absolute -left-4 top-1 text-[8px] text-gray-500 rotate-90">{i * 50}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};
