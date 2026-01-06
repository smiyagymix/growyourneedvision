import React from 'react';
import { OwnerIcon } from '../../../../components/shared/OwnerIcons';

interface ToolButtonProps {
    icon: string;
    label: string;
    isActive: boolean;
    onClick: () => void;
}

export const ToolButton: React.FC<ToolButtonProps> = ({ icon, label, isActive, onClick }) => {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`p-3 rounded-xl transition-all flex flex-col items-center gap-1 group relative ${
                isActive 
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20' 
                    : 'text-gray-400 hover:bg-[#27272a] hover:text-white'
            }`}
        >
            <OwnerIcon name={icon} className="w-5 h-5" />
            <span className="text-[10px] font-medium opacity-0 group-hover:opacity-100 absolute left-14 bg-black px-2 py-1 rounded whitespace-nowrap transition-opacity z-50 pointer-events-none">
                {label}
            </span>
        </button>
    );
};
