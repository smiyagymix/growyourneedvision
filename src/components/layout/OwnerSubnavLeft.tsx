
import React, { useState } from 'react';
import { OwnerIcon } from '../shared/OwnerIcons';
import { SUBNAV_ICONS } from '../../data/subnavIcons';

interface SubnavProps {
  activeSubNav: string;
  onSubNavChange: (sub: string) => void;
  subItems: string[];
}

const OwnerSubnavLeft: React.FC<SubnavProps> = ({ activeSubNav, onSubNavChange, subItems }) => {
  const [expanded, setExpanded] = useState(true);

  // Dynamic classes based on state - Mobile always collapsed (w-14), Desktop expands (w-24) or collapsed (w-16)
  const containerWidth = expanded ? 'w-14 md:w-24' : 'w-14 md:w-16';
  
  // Removed fixed buttonSize to allow flex scaling
  const textClass = expanded 
    ? 'opacity-100 h-auto mt-1 scale-100 block' 
    : 'opacity-100 h-auto mt-1 scale-100 block md:opacity-0 md:h-0 md:mt-0 md:scale-0 md:overflow-hidden';

  const getIconForSubItem = (item: string) => {
      // 1. Direct match from configuration
      if (SUBNAV_ICONS[item]) return SUBNAV_ICONS[item];

      // 2. Fallback heuristics
      const lower = item.toLowerCase();
      if (lower.includes('home') || lower.includes('overview') || lower.includes('dashboard')) return 'Home';
      if (lower.includes('school') || lower.includes('class')) return 'Book';
      if (lower.includes('staff') || lower.includes('user') || lower.includes('member')) return 'UserGroup';
      if (lower.includes('billing') || lower.includes('invoice') || lower.includes('finance')) return 'CurrencyDollarIcon';
      
      // Email Folders
      if (lower.includes('inbox')) return 'Envelope';
      if (lower.includes('compose')) return 'PencilIcon';
      if (lower.includes('starred')) return 'StarIcon';
      if (lower.includes('sent')) return 'PaperAirplane';
      if (lower.includes('drafts')) return 'DocumentTextIcon';
      if (lower.includes('archive')) return 'ArchiveBoxIcon';
      if (lower.includes('spam')) return 'ExclamationCircleIcon';
      if (lower.includes('trash')) return 'TrashIcon';

      if (lower.includes('mail')) return 'Envelope';
      if (lower.includes('chat')) return 'ChatBubbleLeftRight';
      if (lower.includes('tool')) return 'WrenchScrewdriver';
      return 'Grid'; 
  };

  return (
    <aside 
      className={`shrink-0 ${containerWidth} mt-4 bg-white/90 backdrop-blur-xl border border-gray-200 rounded-tr-2xl rounded-br-2xl overflow-hidden flex flex-col z-20 shadow-sm transition-all duration-300 ease-in-out`}
    >
      <div className="h-full w-full bg-gradient-to-b from-gray-50 to-transparent flex flex-col items-center py-2 space-y-1 overflow-hidden">
        
        <div className="flex-1 w-full flex flex-col items-center justify-start space-y-2 overflow-hidden px-2">
            {subItems.map(item => (
                <div key={item} className="flex-1 w-full flex items-center justify-center min-h-[40px] max-h-[70px]">
                    <button 
                        onClick={() => onSubNavChange(item)}
                        className={`
                            w-full h-full rounded-xl flex flex-col items-center justify-center transition-all duration-200 group overflow-hidden relative border
                            ${activeSubNav === item 
                                ? 'shadow-sm bg-blue-50 text-blue-600 border-blue-200' 
                                : 'shadow-sm bg-white hover:bg-gray-50 text-gray-500 border-transparent hover:border-gray-200'}
                        `}
                        title={item}
                    >
                        {/* Active Indicator Bar */}
                        {activeSubNav === item && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-hud-primary rounded-r-full shadow-[0_0_10px_rgba(0,240,255,0.8)]"></div>}
                        
                        <OwnerIcon 
                            name={getIconForSubItem(item)} 
                            className={`w-5 h-5 shrink-0 transition-transform duration-300 ${activeSubNav === item ? 'scale-110 drop-shadow-[0_0_5px_rgba(0,240,255,0.5)]' : 'group-hover:scale-110'}`} 
                        />
                        <span className={`text-[9px] font-bold transition-all duration-300 origin-top text-center leading-none px-1 ${textClass} ${activeSubNav === item ? 'mt-1.5' : 'mt-1 opacity-70'}`}>
                        {item}
                        </span>
                    </button>
                </div>
            ))}
        </div>

        {/* Tactile Toggle Button - Hidden on Mobile */}
        <div className="shrink-0 pt-2 pb-2 hidden md:block">
            <button 
                onClick={() => setExpanded(!expanded)}
                className="p-2 rounded-full shadow-none bg-gray-100 hover:text-blue-600 transition-all active:scale-95 border border-gray-200 hover:border-blue-300"
                title={expanded ? "Collapse" : "Expand"}
            >
                <div className={`transition-transform duration-500 ${!expanded ? 'rotate-180' : ''}`}>
                    <OwnerIcon name="Toggle" className="w-5 h-5 text-gray-500" />
                </div>
            </button>
        </div>

      </div>
    </aside>
  );
};

export default OwnerSubnavLeft;
