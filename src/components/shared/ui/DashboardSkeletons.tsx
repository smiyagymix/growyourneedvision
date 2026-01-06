import React from 'react';

interface SkeletonProps {
    className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className }) => (
    <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`} />
);

export const TableSkeleton: React.FC<{ rows?: number; className?: string }> = ({ rows = 5, className = "" }) => (
    <div className={`w-full space-y-4 ${className}`}>
        <div className="flex space-x-4 pb-4 border-b border-gray-100 dark:border-gray-800">
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
        </div>
        {[...Array(rows)].map((_, i) => (
            <div key={i} className="flex space-x-4 py-4 border-b border-gray-50 dark:border-gray-900 last:border-0">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-8 w-20" />
            </div>
        ))}
    </div>
);

export const StatsSkeleton: React.FC<{ cols?: number; className?: string }> = ({ cols = 4, className = "" }) => (
    <div className={`grid grid-cols-1 md:grid-cols-${cols} gap-4 ${className}`}>
        {[...Array(cols)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-8 rounded-lg" />
                </div>
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-3 w-48" />
            </div>
        ))}
    </div>
);


export const CardSkeleton: React.FC<{ count?: number; className?: string }> = ({ count = 3, className = "" }) => (
    <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 ${className}`}>
        {[...Array(count)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex justify-between items-start mb-4">
                    <div className="space-y-2">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-8 w-24" />
                    </div>
                    <Skeleton className="h-6 w-16 rounded-full" />
                </div>
                <div className="space-y-3 mb-6">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-2/3" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-9 flex-1" />
                    <Skeleton className="h-9 flex-1" />
                </div>
            </div>
        ))}
    </div>
);

export const GridSkeleton: React.FC<{ count?: number; cols?: number; className?: string }> = ({ count = 6, cols = 3, className = "" }) => (
    <div className={`grid grid-cols-1 md:grid-cols-${cols} gap-6 ${className}`}>
        {[...Array(count)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-4 mb-4">
                    <Skeleton className="h-12 w-12 rounded-xl" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-16" />
                    </div>
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-5/6" />
                </div>
            </div>
        ))}
    </div>
);
