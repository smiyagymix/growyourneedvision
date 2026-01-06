import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChartDataPoint } from '../../../services/ownerService';

interface SimpleLineChartProps {
    data: ChartDataPoint[];
    color?: string;
    height?: number | string;
}

export const SimpleLineChart: React.FC<SimpleLineChartProps> = ({ data, color = '#10B981', height = 200 }) => {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const [mouseX, setMouseX] = useState<number>(0);

    if (!data || data.length === 0) return null;

    // Memoize calculations
    const { coords, pathD, areaD } = useMemo(() => {
        const maxValue = Math.max(...data.map(d => Number(d.value) || 0));
        const minValue = Math.min(...data.map(d => Number(d.value) || 0));
        const range = maxValue - minValue || 1;

        const coords = data.map((d, i) => {
            const val = Number(d.value) || 0;
            const x = data.length > 1 ? (i / (data.length - 1)) * 100 : 50;
            // Add 10% padding top/bottom
            const y = range > 0 ? 90 - ((val - minValue) / range) * 80 : 50;
            return { x, y, val, label: d.label };
        });

        const generatePath = (points: { x: number, y: number }[]) => {
            if (points.length === 0) return '';
            if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

            let d = `M ${points[0].x},${points[0].y}`;
            for (let i = 0; i < points.length - 1; i++) {
                const p0 = points[i];
                const p1 = points[i + 1];
                const cp1x = p0.x + (p1.x - p0.x) / 2;
                const cp1y = p0.y;
                const cp2x = p0.x + (p1.x - p0.x) / 2;
                const cp2y = p1.y;
                d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p1.x},${p1.y}`;
            }
            return d;
        };

        const pathD = generatePath(coords);
        const areaD = `${pathD} L 100,100 L 0,100 Z`;

        return { coords, pathD, areaD };
    }, [data]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        setMouseX(x);

        // Find nearest point
        let nearestIndex = 0;
        let minDistance = Infinity;

        coords.forEach((p, i) => {
            const distance = Math.abs(p.x - x);
            if (distance < minDistance) {
                minDistance = distance;
                nearestIndex = i;
            }
        });

        if (minDistance < 10) { // Snap distance
            setHoveredIndex(nearestIndex);
        } else {
            setHoveredIndex(null);
        }
    };

    return (
        <div 
            className="w-full relative group flex flex-col select-none" 
            style={{ height }}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoveredIndex(null)}
        >
            <div className="flex-1 min-h-0 w-full relative overflow-visible">
                
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible relative z-10">
                    <defs>
                        <linearGradient id={`gradient-${color}`} x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
                            <stop offset="100%" stopColor={color} stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    
                    {/* Area Fill */}
                    <path
                        d={areaD}
                        fill={`url(#gradient-${color})`}
                        className="transition-all duration-500 ease-in-out"
                    />

                    {/* Line */}
                    <path
                        d={pathD}
                        fill="none"
                        stroke={color}
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="transition-all duration-500 ease-in-out drop-shadow-sm"
                    />
                    
                    {/* Hover Effect */}
                    {hoveredIndex !== null && (
                        <>
                            <line
                                x1={coords[hoveredIndex].x}
                                y1={0}
                                x2={coords[hoveredIndex].x}
                                y2={100}
                                stroke={color}
                                strokeWidth="1"
                                strokeDasharray="4 4"
                                className="opacity-50"
                            />
                            <circle
                                cx={coords[hoveredIndex].x}
                                cy={coords[hoveredIndex].y}
                                r="4"
                                fill="white"
                                stroke={color}
                                strokeWidth="3"
                                className="drop-shadow-md"
                            />
                        </>
                    )}
                </svg>

                {/* Floating Tooltip */}
                <AnimatePresence>
                    {hoveredIndex !== null && (
                        <motion.div
                            className="absolute pointer-events-none z-20"
                            style={{
                                left: `${coords[hoveredIndex].x}%`,
                                top: `${coords[hoveredIndex].y}%`
                            }}
                            initial={{ opacity: 0, y: 10, scale: 0.9 }}
                            animate={{ opacity: 1, y: -40, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.9 }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        >
                            <div className="bg-white/90 backdrop-blur-xl border border-slate-200 rounded-lg p-2 shadow-xl transform -translate-x-1/2 min-w-[100px]">
                                <div className="flex items-center justify-between gap-3 mb-1">
                                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{coords[hoveredIndex].label}</span>
                                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }}></div>
                                </div>
                                <div className="text-lg font-bold text-slate-800 tabular-nums leading-none">
                                    {coords[hoveredIndex].val.toLocaleString()}
                                </div>
                            </div>
                            {/* Tooltip Arrow */}
                            <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-white/90 absolute left-1/2 -translate-x-1/2 bottom-[-6px]"></div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
