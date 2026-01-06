import React from 'react';
import { motion } from 'framer-motion';

interface DonutChartProps {
    title: string;
    data: {
        label: string;
        value: number;
        color: string;
        percentage: number;
    }[];
    currency?: string;
}

export const DonutChart: React.FC<DonutChartProps> = ({ title, data, currency = '$' }) => {
    const total = data.reduce((acc, curr) => acc + curr.value, 0);
    
    // Calculate stroke dashes
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    let currentOffset = 0;

    const segments = data.map(item => {
        const ratio = total > 0 ? item.value / total : 0;
        const strokeDasharray = `${ratio * circumference} ${circumference}`;
        const strokeDashoffset = -currentOffset;
        currentOffset += ratio * circumference;
        return { ...item, strokeDasharray, strokeDashoffset };
    });

    return (
        <div className="w-full h-full flex flex-col">
            <h3 className="text-sm font-bold text-slate-800 mb-2">{title}</h3>
            
            <div className="flex-1 flex items-center gap-3 min-h-0">
                {/* Chart */}
                <div className="relative w-28 h-28 shrink-0">
                    <svg viewBox="0 0 100 100" className="transform -rotate-90 w-full h-full">
                        {segments.map((segment, index) => (
                            <motion.circle
                                key={index}
                                cx="50"
                                cy="50"
                                r={radius}
                                fill="transparent"
                                stroke={segment.color}
                                strokeWidth="12"
                                strokeDasharray={segment.strokeDasharray}
                                strokeDashoffset={segment.strokeDashoffset}
                                initial={{ strokeDasharray: `0 ${circumference}` }}
                                animate={{ strokeDasharray: segment.strokeDasharray }}
                                transition={{ duration: 1, delay: index * 0.2, ease: "easeOut" }}
                                className="hover:opacity-80 transition-opacity cursor-pointer"
                            />
                        ))}
                    </svg>
                    
                    {/* Center Text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-lg font-black text-slate-800">
                            {currency}{total >= 1000 ? `${(total / 1000).toFixed(1)}k` : total}
                        </span>
                    </div>
                    
                    {/* Inner Dashed Ring Decoration */}
                    <div className="absolute inset-0 m-2 border-2 border-dashed border-slate-200 rounded-full pointer-events-none"></div>
                </div>

                {/* Legend List */}
                <div className="flex-1 flex flex-col gap-2 min-w-0 overflow-y-auto pr-1 custom-scrollbar h-full">
                    {data.map((item, index) => (
                        <div key={index} className="flex items-center justify-between text-[10px] group">
                            <div className="flex items-center gap-1.5 min-w-0">
                                <div className="w-1.5 h-1.5 rounded-[2px] shrink-0" style={{ backgroundColor: item.color }}></div>
                                <span className="text-slate-600 truncate font-medium group-hover:text-slate-900 transition-colors">{item.label}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <span className="font-bold text-slate-800">{currency}{item.value.toLocaleString()}</span>
                                <span className="text-[9px] px-1 py-0.5 rounded bg-slate-100 text-slate-500 font-medium w-8 text-center">
                                    {item.percentage}%
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
