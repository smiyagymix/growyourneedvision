import React from 'react';
import { motion } from 'framer-motion';

interface SegmentedBarChartProps {
    title: string;
    subtitle?: string;
    data: {
        label: string;
        value: number;
        color: string;
        subLabel?: string;
    }[];
    totalLabel?: string;
}

export const SegmentedBarChart: React.FC<SegmentedBarChartProps> = ({ title, subtitle, data, totalLabel = 'Total Visitors' }) => {
    const total = data.reduce((acc, curr) => acc + curr.value, 0);

    return (
        <div className="w-full h-full flex flex-col">
            <div className="flex justify-between items-end mb-2">
                <h3 className="text-sm font-bold text-slate-800">{title}</h3>
                {subtitle && <span className="text-[10px] text-slate-400">{subtitle}</span>}
            </div>

            <div className="flex justify-between items-center mb-1 text-[10px] text-slate-500">
                <span>{totalLabel}</span>
                <span className="font-bold text-slate-800">{total.toLocaleString()}</span>
            </div>

            {/* The Bar */}
            <div className="w-full h-3 rounded-full flex overflow-hidden mb-3 shrink-0">
                {data.map((item, index) => (
                    <motion.div
                        key={index}
                        initial={{ width: 0 }}
                        animate={{ width: `${(item.value / total) * 100}%` }}
                        transition={{ duration: 1, delay: index * 0.1, ease: "easeOut" }}
                        className="h-full relative group"
                        style={{ backgroundColor: item.color }}
                    >
                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                            {item.label}: {item.value.toLocaleString()}
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Legend Grid */}
            <div className="grid grid-cols-2 gap-y-2 gap-x-2 overflow-y-auto custom-scrollbar pr-1">
                {data.map((item, index) => (
                    <div key={index} className="flex flex-col">
                        <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-bold text-slate-800 leading-none">
                                {item.value.toLocaleString()}
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: item.color }}></div>
                            <span className="text-[10px] text-slate-500 truncate">{item.label}</span>
                        </div>
                        {item.subLabel && (
                            <span className="text-[9px] text-slate-400 pl-3 truncate">{item.subLabel}</span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
