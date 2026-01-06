
import React from 'react';
import { OwnerIcon } from '../OwnerIcons';

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
  color?: string;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, color = 'text-blue-500' }) => {
  return (
    <div className="bg-[#0f1016] p-8 rounded-3xl border border-white/5 hover:border-white/20 transition-all group relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
      
      <div className="relative z-10">
        <div className={`w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ${color}`}>
          <OwnerIcon name={icon} className="w-6 h-6" />
        </div>
        <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
        <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  );
};
