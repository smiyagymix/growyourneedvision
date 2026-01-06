
import React from 'react';

interface OwnerTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  tabs: string[];
}

const OwnerTabs: React.FC<OwnerTabsProps> = ({ activeTab, onTabChange, tabs }) => {
  return (
    <div 
        className="relative inline-flex items-center p-1 md:p-1.5 rounded-full bg-gray-100 dark:bg-material-obsidian shadow-inner border border-gray-200 dark:border-hud-primary/30"
        style={{
            boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.3), 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
        }}
    >
      <div className="flex items-center space-x-1 relative z-10 overflow-x-auto no-scrollbar max-w-[60vw] md:max-w-none">
        {tabs.map((tab) => {
            const isActive = tab === activeTab;
            return (
                <button 
                    key={tab}
                    onClick={() => onTabChange(tab)}
                    className={`
                        relative px-3 py-1.5 md:px-6 md:py-2.5 rounded-full font-bold text-[9px] md:text-xs tracking-widest transition-all duration-300 uppercase whitespace-nowrap flex-shrink-0
                        ${isActive ? 'text-white dark:text-material-obsidian' : 'text-gray-500 dark:text-slate-500 hover:text-gray-800 dark:hover:text-hud-primary'}
                    `}
                >
                    {isActive && (
                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#4F46E5] to-[#3B82F6] dark:from-hud-primary dark:to-hud-secondary shadow-[0_0_15px_rgba(79,70,229,0.4)] dark:shadow-hud-glow -z-10">
                             {/* Shine effect */}
                             <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/20 to-transparent opacity-50"></div>
                        </div>
                    )}
                    <span className="relative z-10 drop-shadow-sm">{tab}</span>
                </button>
            );
        })}
      </div>
    </div>
  );
};

export default OwnerTabs;
