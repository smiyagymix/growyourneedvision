import React, { useState, useEffect } from 'react';
import { OwnerIcon } from '../shared/OwnerIcons';
import { useOS } from '../../context/OSContext'; // Import OS Context
import { isMockEnv } from '../../utils/mockData';
import { motion, AnimatePresence } from 'framer-motion';

interface FooterProps {
  onLaunchApp: (appName: string) => void;
  activeApps: string[];
  isMobileSidebarOpen?: boolean;
  toggleMobileSidebar?: () => void;
}

const OwnerFooter: React.FC<FooterProps> = ({ onLaunchApp, activeApps, isMobileSidebarOpen, toggleMobileSidebar }) => {
  const { launchApp, windows, focusApp, closeApp } = useOS(); // Use launchApp from Context
    const [isDockOpen, setIsDockOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Clock Effect
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const minimizedApps = windows.filter(w => w.isMinimized);
  
  // Check if app is running (open or minimized)
  const isAppRunning = (appName: string) => {
      return windows.some(w => w.appName === appName);
  };

    const appConfig = [
    { name: 'Overlay Setting', icon: 'SquaresPlus', side: 'left' },
    { name: 'Platform Settings', icon: 'Cog6Tooth', side: 'left' },
    { name: 'Creator Studio', icon: 'StudioIcon3D', side: 'left' },
    { name: 'Settings', icon: 'SettingsIcon3D', side: 'left' },
    { name: 'Messaging', icon: 'MessagingIcon3D', side: 'left' },
    { name: 'Help Center', icon: 'HelpIcon3D', side: 'left' },
    { name: 'Media', icon: 'MediaIcon3D', side: 'right' },
    { name: 'Market', icon: 'MarketIcon3D', side: 'right' },
    { name: 'Services', icon: 'ServicesIcon3D', side: 'right' },
    { name: 'Activities', icon: 'ActivitiesIcon3D', side: 'right' },
    { name: 'Travel & Transport', icon: 'TransportIcon3D', side: 'right' },
    { name: 'Sport', icon: 'SportIcon3D', side: 'right' },
    { name: 'Islam', icon: 'IslamIcon3D', side: 'right' },
    { name: 'Gamification', icon: 'GamificationIcon3D', side: 'right' },
  ];

        const handleAppLaunch = (appName: string) => {
        launchApp(appName);
        };

  const leftApps = appConfig.filter(app => app.side === 'left');
  const rightApps = appConfig.filter(app => app.side === 'right');

  // Helper to get icon for minimized apps
  const getAppIcon = (appName: string) => {
      const config = appConfig.find(a => a.name === appName);
      if (config) return config.icon;
      // Fallback logic similar to AppOverlay
      if (appName === 'User Profile') return 'UserIcon';
      if (appName === 'Events') return 'EventsIcon3D';
      if (appName === 'Hobbies') return 'Hobbies';
      return 'Grid';
  };

    const toggleDock = () => {
        setIsDockOpen(!isDockOpen);
    };

    // Listen for forced dock open (tests)
    useEffect(() => {
        const handler = () => setIsDockOpen(true);
        window.addEventListener('gyn-open-dock', handler);
        return () => window.removeEventListener('gyn-open-dock', handler);
    }, []);

  return (
    <div className="shrink-0 z-40 relative flex justify-center items-end pb-2 md:pb-4 pointer-events-none">
      {/* Dock Container - Enable pointer events for the dock itself */}
      <motion.div  
        layout
        initial={false}
        style={{ minWidth: isDockOpen ? 'auto' : '320px' }}
        animate={{ 
            width: isDockOpen ? '98%' : '40%',
            height: isDockOpen ? 80 : 64, 
            maxWidth: isDockOpen ? '80rem' : '24rem',
            borderRadius: isDockOpen ? '1.5rem' : '2rem'
        }}
        transition={{ type: "spring", stiffness: 250, damping: 25 }}
        className={`
            pointer-events-auto
            flex items-center justify-between px-3 md:px-4 relative
            bg-white/40 dark:bg-gray-900/60 backdrop-blur-xl 
            border border-white/40 dark:border-white/5 
            shadow-[0_20px_40px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.3)] 
            dark:shadow-[0_20px_50px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)]
        `}
      >
          {/* Left Side */}
          <div className="flex-1 h-full flex items-center justify-end pr-2 overflow-hidden">
            <AnimatePresence mode="wait">
            {!isDockOpen ? (
                // Collapsed Bar
                <motion.div 
                    key="collapsed-left"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-full h-1.5 bg-gray-300/30 dark:bg-white/5 rounded-full overflow-hidden"
                >
                    <div className="h-full w-1/3 bg-gradient-to-r from-blue-400/50 to-purple-500/50 dark:from-blue-400/30 dark:to-purple-500/30 rounded-full animate-pulse"></div>
                </motion.div>
            ) : (
                // Expanded Icons
                <motion.div 
                    key="expanded-left"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-1 h-full w-full justify-end"
                >
                    {leftApps.map((app, i) => (
                        <motion.button 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03 }}
                            type="button"
                            key={app.name}
                            onClick={() => handleAppLaunch(app.name)}
                            className="group flex flex-col items-center justify-center w-12 h-12 relative"
                            whileHover={{ scale: 1.15, y: -5 }}
                            whileTap={{ scale: 0.9 }}
                            aria-label={app.name}
                        >
                             <div className="w-10 h-10 relative">
                                <OwnerIcon name={app.icon} className="w-full h-full drop-shadow-md filter" />
                                {/* Reflection effect */}
                                <div className="absolute -bottom-2 left-0 w-full h-full opacity-20 transform scale-y-[-0.5] mask-image-gradient">
                                   <OwnerIcon name={app.icon} className="w-full h-full" />
                                </div>
                             </div>
                             
                             {/* Active Indicator */}
                             {isAppRunning(app.name) && (
                                <motion.div 
                                    layoutId={`active-${app.name}`}
                                    className="absolute -bottom-1 w-1 h-1 bg-white dark:bg-blue-400 rounded-full shadow-[0_0_5px_currentColor]"
                                />
                             )}

                             {/* Tooltip */}
                             <span className="absolute -top-10 bg-gray-900/90 dark:bg-white/90 text-white dark:text-gray-900 text-[10px] font-bold px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap backdrop-blur-sm shadow-lg transform translate-y-2 group-hover:translate-y-0">
                                {app.name}
                             </span>
                        </motion.button>
                    ))}
                </motion.div>
            )}
            </AnimatePresence>
          </div>

          {/* Central Trigger */}
          <div className="shrink-0 relative z-20 mx-4">
                            <motion.button 
                onClick={toggleDock}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                animate={{ rotate: isDockOpen ? 180 : 0 }}
                className={`
                                        w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300
                    bg-white/80 dark:bg-white/10 backdrop-blur-md
                    border border-white/50 dark:border-white/10
                    shadow-lg hover:shadow-xl
                    group
                `}
              >
                  <OwnerIcon name={isDockOpen ? "X" : "Grid"} className="w-6 h-6 text-gray-700 dark:text-white group-hover:text-blue-500 transition-colors" />
              </motion.button>
          </div>

          {/* Right Side */}
          <div className="flex-1 h-full flex items-center justify-start pl-2 overflow-hidden">
             {/* Container for Right Apps + Minimized */}
             <div className="flex items-center justify-start w-full h-full space-x-2">
                
                {/* Standard Right Apps (Only if Dock Open) */}
                <AnimatePresence>
                {isDockOpen && (
                    <motion.div 
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        className="flex items-center space-x-2 overflow-x-auto no-scrollbar h-full flex-1 justify-start border-r border-gray-400/20 pr-4 mr-2"
                    >
                        {rightApps.map((app, i) => (
                            <motion.button 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.03 }}
                                whileHover={{ scale: 1.15, y: -5 }}
                                whileTap={{ scale: 0.9 }}
                                type="button"
                                key={app.name}
                                onClick={() => handleAppLaunch(app.name)}
                                className="group flex flex-col items-center justify-center w-12 h-12 relative shrink-0"
                                aria-label={app.name}
                            >
                                 <div className="w-10 h-10 relative">
                                    <OwnerIcon name={app.icon} className="w-full h-full drop-shadow-md" />
                                 </div>
                                 
                                 {/* Active Indicator */}
                                 {isAppRunning(app.name) && (
                                    <motion.div 
                                        layoutId={`active-${app.name}`}
                                        className="absolute -bottom-1 w-1 h-1 bg-white dark:bg-blue-400 rounded-full shadow-[0_0_5px_currentColor]"
                                    />
                                 )}

                                 <span className="absolute -top-10 bg-gray-900/90 dark:bg-white/90 text-white dark:text-gray-900 text-[10px] font-bold px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap backdrop-blur-sm shadow-lg transform translate-y-2 group-hover:translate-y-0">
                                    {app.name}
                                 </span>
                            </motion.button>
                        ))}
                    </motion.div>
                )}
                </AnimatePresence>

                {/* Minimized Apps (Always visible if present) */}
                <AnimatePresence>
                {minimizedApps.length > 0 && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex items-center space-x-2 shrink-0 h-full pl-2"
                    >
                        {minimizedApps.map((win) => (
                            <motion.button 
                                layout
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                                whileHover={{ scale: 1.15, y: -5 }}
                                type="button"
                                key={win.id}
                                onClick={() => focusApp(win.id)}
                                className="group flex flex-col items-center justify-center w-12 h-12 relative"
                                aria-label={getAppIcon(win.appName)}
                            >
                                 <div className="w-10 h-10 relative opacity-80 group-hover:opacity-100 transition-opacity">
                                    <OwnerIcon name={getAppIcon(win.appName)} className="w-full h-full drop-shadow-md grayscale-[0.3] group-hover:grayscale-0 transition-all" />
                                    
                                    {/* Minimized Badge */}
                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full border-2 border-white dark:border-gray-800"></div>
                                    
                                    {/* Exit Button Overlay */}
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.5 }}
                                        whileHover={{ opacity: 1, scale: 1.1 }}
                                        onClick={(e) => { e.stopPropagation(); closeApp(win.id); }}
                                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 hover:bg-red-600 rounded-full text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-50 shadow-md cursor-pointer"
                                        title="Close App"
                                    >
                                        <OwnerIcon name="XMarkIcon" className="w-3 h-3" />
                                    </motion.div>
                                 </div>
                                 <span className="absolute -top-10 bg-gray-900/90 dark:bg-white/90 text-white dark:text-gray-900 text-[10px] font-bold px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap backdrop-blur-sm shadow-lg transform translate-y-2 group-hover:translate-y-0">
                                    {win.appName}
                                 </span>
                            </motion.button>
                        ))}
                    </motion.div>
                )}
                </AnimatePresence>
                
                {/* Clock & System Info (Only when expanded) */}
                <AnimatePresence>
                {isDockOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="hidden lg:flex flex-col items-end justify-center pl-4 border-l border-gray-400/20 ml-auto h-full"
                    >
                        <div className="text-xs font-bold text-gray-800 dark:text-white leading-none mb-1">
                            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="text-[10px] text-gray-500 dark:text-gray-400 leading-none uppercase tracking-wider">
                            {currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                        </div>
                    </motion.div>
                )}
                </AnimatePresence>

                {/* Collapsed State (Only if Dock Closed AND No Minimized Apps) */}
                {!isDockOpen && minimizedApps.length === 0 && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="w-full h-1.5 bg-gray-300/30 dark:bg-white/5 rounded-full overflow-hidden"
                    >
                         <div className="h-full w-1/3 ml-auto bg-gradient-to-l from-blue-400/50 to-purple-500/50 dark:from-blue-400/30 dark:to-purple-500/30 rounded-full animate-pulse"></div>
                    </motion.div>
                )}
             </div>
          </div>
      </motion.div>

      {/* Mobile Sidebar Toggle - Only visible on mobile */}
      <button 
        onClick={toggleMobileSidebar}
        className="md:hidden absolute right-2 bottom-3 w-10 h-10 rounded-full bg-gray-900 dark:bg-material-obsidian shadow-lg dark:shadow-hud-glow border border-white/20 dark:border-hud-primary/50 flex items-center justify-center z-50 active:scale-95 transition-transform pointer-events-auto"
      >
        <OwnerIcon name={isMobileSidebarOpen ? "X" : "List"} className="w-5 h-5 text-white dark:text-hud-primary" />
      </button>
    </div>
  );
};

export default OwnerFooter;