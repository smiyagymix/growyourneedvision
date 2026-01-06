import React from 'react';
import { motion } from 'framer-motion';
import { OwnerIcon } from '../../../components/shared/OwnerIcons';
import { DashboardKPI } from '../../../services/ownerService';

interface KPICardProps {
    kpi: DashboardKPI;
    icon: string;
    className?: string;
    compact?: boolean;
}

export const KPICard: React.FC<KPICardProps> = ({ kpi, icon, className = '', compact = false }) => {
    const isPositive = kpi.change >= 0;
    const isChurn = kpi.label.toLowerCase().includes('churn');
    // Luxury color palette logic
    const trendColor = isChurn 
        ? (isPositive ? 'text-rose-500' : 'text-emerald-500')
        : (isPositive ? 'text-emerald-500' : 'text-rose-500');
    
    const TrendIcon = isPositive ? 'ArrowTrendingUp' : 'ArrowTrendingDown';

    return (
        <motion.div 
            className={`
                relative overflow-hidden group h-full
                bg-white border border-slate-100
                rounded-[1.5rem] shadow-[0_2px_15px_rgba(0,0,0,0.03)]
                hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)]
                ${className}
            `}
            whileHover={{ scale: 1.02, y: -2 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
            {/* Shimmer Effect - Subtle */}
            <motion.div 
                className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-50/30 to-transparent -skew-x-12"
                initial={{ x: '-100%' }}
                animate={{ x: '200%' }}
                transition={{ repeat: Infinity, duration: 3, ease: "linear", repeatDelay: 5 }}
            />
            
            <div className="p-5 relative z-10 flex flex-col h-full justify-between">
                <div className="flex justify-between items-start">
                    <motion.div 
                        className={`
                            p-2.5 rounded-xl
                            bg-slate-50 text-slate-600
                        `}
                        whileHover={{ rotate: 10, scale: 1.05 }}
                    >
                        <OwnerIcon name={icon} className="w-5 h-5" />
                    </motion.div>
                    <div 
                        className={`flex items-center gap-1 text-[10px] font-bold ${trendColor} bg-slate-50 px-2 py-1 rounded-lg`}
                    >
                        <OwnerIcon name={TrendIcon} className="w-3 h-3" />
                        <span>{Math.abs(kpi.change)}%</span>
                    </div>
                </div>

                <div>
                    <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">{kpi.label}</h3>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-slate-900 tracking-tight">
                            {kpi.value.toLocaleString()}
                        </span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
