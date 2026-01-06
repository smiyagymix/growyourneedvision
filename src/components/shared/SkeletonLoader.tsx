import React from 'react';

interface SkeletonLoaderProps {
    rows?: number;
    className?: string;
}

export const SkeletonTable: React.FC<SkeletonLoaderProps> = ({ rows = 5, className = '' }) => {
    return (
        <div className={`animate-pulse space-y-3 ${className}`}>
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex gap-4 items-center p-4 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
                    <div className="w-10 h-10 bg-gray-200 dark:bg-slate-700 rounded-full shrink-0"></div>
                    <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-1/2"></div>
                    </div>
                    <div className="w-24 h-8 bg-gray-200 dark:bg-slate-700 rounded"></div>
                </div>
            ))}
        </div>
    );
};

export const SkeletonCard: React.FC<{ height?: string }> = ({ height = 'h-40' }) => {
    return (
        <div className={`animate-pulse ${height} bg-gray-50 dark:bg-slate-800/50 rounded-xl p-6 space-y-4`}>
            <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-full"></div>
            <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-2/3"></div>
        </div>
    );
};

export const SkeletonList: React.FC<{ items?: number }> = ({ items = 3 }) => {
    return (
        <div className="animate-pulse space-y-2">
            {Array.from({ length: items }).map((_, i) => (
                <div key={i} className="h-10 bg-gray-200 dark:bg-slate-700 rounded"></div>
            ))}
        </div>
    );
};

export const SkeletonText: React.FC<{ lines?: number, className?: string }> = ({ lines = 3, className = '' }) => {
    return (
        <div className={`animate-pulse space-y-2 ${className}`}>
            {Array.from({ length: lines }).map((_, i) => (
                <div
                    key={i}
                    className="h-4 bg-gray-200 dark:bg-slate-700 rounded"
                    style={{ width: i === lines - 1 ? '60%' : '100%' }}
                ></div>
            ))}
        </div>
    );
};
