
import React from 'react';
import { OwnerIcon } from '../shared/OwnerIcons';

interface ModuleDef {
    id: string;
    label: string;
    icon: string;
}

interface SidebarProps {
  activeModule: string;
  onModuleChange: (module: string) => void;
  expanded: boolean;
  onToggleExpand: () => void;
  modules: ModuleDef[];
  mobileOpen?: boolean;
}

const OwnerSidebarRight: React.FC<SidebarProps> = ({ activeModule, onModuleChange, expanded, onToggleExpand, modules, mobileOpen = false }) => {
  
  // Dynamic dimensions - Mobile/Tablet collapsed (w-20/w-24), Desktop expands (w-64)
  // Mobile: Hidden by default, w-20 if open
  const widthClass = expanded ? 'hidden md:flex md:w-24 lg:w-64' : 'hidden md:flex md:w-24';
  const mobileClass = mobileOpen ? 'flex w-20 absolute right-0 h-full z-50 shadow-2xl' : widthClass;
  
  return (
    <aside 
      className={`shrink-0 ${mobileClass} text-white transition-all duration-500 ease-in-out flex-col z-20 overflow-hidden relative h-full border-l border-white/10 rounded-t-2xl md:mr-2 bg-gradient-to-b from-[#0f1c4d] via-[#1d2a78] to-[#0f1c4d] shadow-[0_0_30px_rgba(0,0,0,0.5)]`}
    >
        {/* Brushed Metal Texture Overlay */}
        <div 
            className="absolute inset-0 opacity-10 pointer-events-none mix-blend-overlay bg-cyber-grid" 
        ></div>
        
        {/* Light Reflection */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-transparent to-black/20 pointer-events-none"></div>

        {/* Navigation List - Flex Column to distribute space evenly */}
        <div className="flex-1 flex flex-col min-h-0 px-2 md:px-3 pt-4 pb-2 overflow-hidden">
            {modules.map((mod) => (
                <div key={mod.id} className="flex-1 flex flex-col justify-center min-h-[40px] max-h-[80px] group relative my-0.5">
                    <button
                        onClick={() => onModuleChange(mod.id)}
                        className={`
                        w-full h-full flex items-center rounded-xl transition-all duration-300 relative overflow-hidden group/btn
                        ${expanded 
                            ? 'flex-col lg:flex-row justify-center lg:justify-between px-1 lg:px-4 gap-1 lg:gap-0' 
                            : 'flex-col justify-center px-1 gap-1'
                        }
                        ${activeModule === mod.id 
                            ? 'bg-black/30 border border-hud-primary/50 shadow-[0_0_15px_rgba(0,240,255,0.2)]' 
                            : 'bg-white/5 border border-transparent hover:bg-white/10 hover:border-hud-primary/30'}
                        `}
                        title={!expanded ? mod.label : ''}
                    >
                        {/* Active Glow Indicator */}
                        {activeModule === mod.id && (
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-hud-primary shadow-[0_0_10px_rgba(0,240,255,1)]"></div>
                        )}

                        {/* Icon */}
                        <div className={`z-10 transition-all duration-300 flex-shrink-0 
                            ${expanded ? 'order-1 lg:order-2' : 'order-1'}
                            ${activeModule === mod.id ? 'drop-shadow-[0_0_8px_rgba(0,240,255,0.8)] scale-110' : 'opacity-80 group-hover/btn:opacity-100 group-hover/btn:scale-105'}
                        `}>
                             <OwnerIcon 
                                name={mod.icon} 
                                className={`
                                    ${expanded ? 'w-6 h-6 lg:w-5 lg:h-5' : 'w-6 h-6 md:w-7 md:h-7'}
                                    ${activeModule === mod.id ? 'text-hud-primary' : 'text-blue-100 group-hover/btn:text-white'}
                                `} 
                             />
                        </div>

                        {/* Label */}
                        <span 
                            className={`font-bold tracking-widest transition-all duration-300 z-10 whitespace-nowrap leading-none font-mono uppercase
                                ${activeModule === mod.id ? 'text-hud-primary text-shadow-glow' : 'text-blue-100 group-hover/btn:text-white'}
                                ${expanded 
                                    ? 'order-2 lg:order-1 text-[8px] lg:text-[10px] text-center lg:text-left w-full lg:w-auto' 
                                    : 'order-2 text-[8px] md:text-[9px] text-center w-full overflow-hidden text-ellipsis px-0.5' 
                                }
                            `}
                        >
                            {mod.label}
                        </span>
                    </button>
                </div>
            ))}
        </div>

        {/* System Status - New Content */}
        {expanded && (
            <div className="hidden lg:flex flex-col px-4 py-2 mb-2 border-t border-white/10">
                <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono mb-1">
                    <span>SYS.STATUS</span>
                    <span className="text-hud-primary animate-pulse">ONLINE</span>
                </div>
                <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-hud-primary w-3/4 shadow-[0_0_5px_rgba(0,240,255,0.5)]"></div>
                </div>
            </div>
        )}

        {/* Toggle Button - Hidden on Mobile/Tablet */}
        <div className="relative z-20 pb-4 pt-2 justify-center shrink-0 hidden lg:flex">
            <button 
                onClick={onToggleExpand}
                className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center hover:border-hud-primary/50 hover:shadow-[0_0_15px_rgba(0,240,255,0.3)] transition-all active:scale-95 group"
                title={expanded ? "Collapse" : "Expand"}
            >
                <OwnerIcon name={expanded ? "ChevronRight" : "ChevronLeft"} className="w-4 h-4 md:w-5 md:h-5 text-gray-400 group-hover:text-hud-primary transition-colors" />
            </button>
        </div>
    </aside>
  );
};

export default OwnerSidebarRight;
