
import React from 'react';
import { OwnerIcon } from '../OwnerIcons';

interface MetricCardProps {
  label: string;
  value: string;
  subValue?: string;
  icon: string;
  trend?: 'up' | 'down' | 'neutral';
  color?: string;
  bgGradient?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({ label, value, subValue, icon, trend, color = 'text-blue-500', bgGradient = 'from-blue-50 to-blue-100/50' }) => {
  return (
    <div className={`relative overflow-hidden rounded-2xl border border-white/60 shadow-sm p-5 group hover:-translate-y-1 transition-transform`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${bgGradient} opacity-50`}></div>
      <div className="absolute inset-0 bg-white/40 backdrop-blur-sm"></div>
      
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</span>
            <OwnerIcon name={icon} className={`w-5 h-5 ${color}`} />
        </div>
        <div className="text-3xl font-black text-gyn-blue-dark">{value}</div>
        {subValue && <div className={`text-xs font-bold mt-1 ${trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-500'}`}>{subValue}</div>}
      </div>
    </div>
  );
};
