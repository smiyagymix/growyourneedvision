import React, { useState, useEffect, Suspense, lazy } from 'react';
import { OwnerIcon } from '../shared/OwnerIcons';
import OwnerTabs from './OwnerTabs';
import { OVERLAY_CONFIG } from '../../data/AppConfigs';
import { useOS } from '../../context/OSContext'; // Import useOS
import { Spinner } from '../shared/ui/Spinner';

// Import App Components
const CreatorStudio = lazy(() => import('../../apps/CreatorStudio'));
const AppSettings = lazy(() => import('../../apps/AppSettings'));
const MessagingApp = lazy(() => import('../../apps/MessagingApp'));
const MediaApp = lazy(() => import('../../apps/MediaApp'));
const MarketApp = lazy(() => import('../../apps/MarketApp'));
const ServicesApp = lazy(() => import('../../apps/ServicesApp'));
const SportApp = lazy(() => import('../../apps/SportApp'));
const ReligionApp = lazy(() => import('../../apps/ReligionApp'));
const TravelApp = lazy(() => import('../../apps/TravelApp'));
const ActivitiesApp = lazy(() => import('../../apps/ActivitiesApp'));
const EventsApp = lazy(() => import('../../apps/EventsApp'));
const GamificationApp = lazy(() => import('../../apps/GamificationApp'));
const HobbiesApp = lazy(() => import('../../apps/HobbiesApp'));
const HelpCenterApp = lazy(() => import('../../apps/HelpCenterApp'));
const UserProfile = lazy(() => import('../../apps/UserProfile'));
const TenantMgt = lazy(() => import('../../apps/TenantMgt'));

interface OverlayProps {
  appName: string | null;
  onClose: () => void;
}

const AppOverlay: React.FC<OverlayProps> = ({ appName, onClose }) => {
  const [activeTab, setActiveTab] = useState<string>('');
  const [activeSubNav, setActiveSubNav] = useState<string>('');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const { minimizeAppByName } = useOS();
  
  // In the future, useOS could provide window state here
  // const { windows } = useOS();

  const currentConfig = appName && OVERLAY_CONFIG[appName] 
    ? OVERLAY_CONFIG[appName] 
    : { tabs: ['Main'], subnav: {'Main': ['Overview']} };
    
  const tabs = currentConfig.tabs;
  const subnavItems = currentConfig.subnav[activeTab] || [];

  useEffect(() => {
    if (tabs.length > 0) setActiveTab(tabs[0]);
  }, [appName]);

  useEffect(() => {
    const items = currentConfig.subnav[activeTab] || [];
    if (items.length > 0) setActiveSubNav(items[0]);
    else setActiveSubNav('');
  }, [activeTab, appName]);

  if (!appName) return null;

    // Auto-open if triggered by event (used in tests)
    useEffect(() => {
        const handler = () => setIsSidebarOpen(true);
        window.addEventListener('gyn-open-dock', handler);
        return () => window.removeEventListener('gyn-open-dock', handler);
    }, []);

  const getAppIconName = (name: string) => {
      if (name === 'User Profile') return 'UserIcon';
      if (name === 'Creator Studio') return 'StudioIcon3D';
      if (name === 'Settings') return 'SettingsIcon3D';
      if (name === 'Messaging') return 'MessagingIcon3D';
      if (name === 'Media') return 'MediaIcon3D';
      if (name === 'Activities') return 'ActivitiesIcon3D';
      if (name === 'Religion' || name === 'Islam') return 'ReligionIcon3D';
      if (name === 'Sport') return 'SportIcon3D';
      if (name === 'Events') return 'EventsIcon3D';
      if (name === 'Market') return 'MarketIcon3D';
      if (name === 'Services') return 'ServicesIcon3D';
      if (name === 'Gamification') return 'GamificationIcon3D';
      if (name === 'Travel & Transport') return 'TransportIcon3D';
      if (name === 'Help Center') return 'HelpIcon3D';
      if (name === 'Overlay Setting') return 'SquaresPlus';
      if (name === 'Platform Settings') return 'Cog6Tooth';
      if (name === 'Hobbies') return 'Hobbies';
      return 'Grid';
  };

  const renderAppContent = () => {
    const props = { 
        activeTab, 
        activeSubNav,
        onNavigate: (tab: string, subNav?: string) => {
            setActiveTab(tab);
            if (subNav) setActiveSubNav(subNav);
        }
    };
    switch (appName) {
        case 'User Profile': return <UserProfile {...props} />;
        case 'Creator Studio': return <CreatorStudio {...props} />;
        case 'Settings': return <AppSettings {...props} />;
        case 'Messaging': return <MessagingApp {...props} />;
        case 'Media': return <MediaApp {...props} />;
        case 'Market': return <MarketApp {...props} />;
        case 'Services': return <ServicesApp {...props} />;
        case 'Sport': return <SportApp {...props} />;
        case 'Religion': case 'Islam': return <ReligionApp {...props} />;
        case 'Travel & Transport': return <TravelApp {...props} />;
        case 'Activities': return <ActivitiesApp {...props} />;
        case 'Events': return <EventsApp {...props} />;
        case 'Gamification': return <GamificationApp {...props} />;
        case 'Hobbies': return <HobbiesApp {...props} />;
        case 'Help Center': return <HelpCenterApp {...props} />;
        case 'Tenant Mgt': return <TenantMgt {...props} />;
        default: return (
             <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <OwnerIcon name={getAppIconName(appName || '')} className="w-16 h-16 mb-4 opacity-50" />
                <h2 className="text-xl font-bold">App Under Construction</h2>
                <p>The {appName} module is currently being built.</p>
            </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 w-screen h-screen bg-white animate-fadeIn flex flex-col overflow-hidden">
        {/* Main App Window - Full Screen */}
             
             {/* 1. Header Bar */}
             <div className="h-16 bg-gradient-to-b from-gray-50 to-gray-100 border-b border-gray-200 flex items-center justify-between px-6 shrink-0 relative z-40 shadow-sm select-none">
                  {/* Left: App Icon & Title */}
                  <div className="flex items-center gap-3 w-80 z-50">
                      {subnavItems.length > 0 && (
                          <button 
                              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                              className={`p-2 rounded-lg transition-colors ${isSidebarOpen ? 'bg-gray-200 text-gray-700' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'}`}
                              title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
                          >
                              <OwnerIcon name="MenuIcon" className="w-5 h-5" />
                          </button>
                      )}
                      <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-gray-200 flex items-center justify-center">
                        <OwnerIcon name={getAppIconName(appName)} className="w-6 h-6 text-gray-700" />
                      </div>
                      <span className="font-black text-gray-800 tracking-tight text-xl drop-shadow-sm">{appName}</span>
                  </div>

                  {/* Center: Tabs */}
                  <div className="flex-1 flex justify-center">
                      <div className="scale-100">
                          <OwnerTabs activeTab={activeTab} onTabChange={setActiveTab} tabs={tabs} />
                      </div>
                  </div>

                  {/* Right: Window Controls */}
                  <div className="flex items-center justify-end gap-2 w-80 z-50">
                      <button 
                        className="w-9 h-9 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-700 flex items-center justify-center transition-all border border-transparent hover:border-gray-300"
                        title="App Settings"
                      >
                          <OwnerIcon name="CogIcon" className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => appName && minimizeAppByName(appName)}
                        className="w-9 h-9 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-700 flex items-center justify-center transition-all border border-transparent hover:border-gray-300"
                        title="Minimize Application"
                      >
                          <OwnerIcon name="Minimize" className="w-5 h-5" />
                      </button>
                                            <button 
                                                onClick={onClose} 
                                                className="w-9 h-9 rounded-lg hover:bg-red-100 text-gray-400 hover:text-red-600 flex items-center justify-center transition-all group border border-transparent hover:border-red-200 pointer-events-auto"
                                                title="Close Application"
                                            >
                          <OwnerIcon name="X" className="w-5 h-5" />
                      </button>
                  </div>
             </div>

             {/* 2. Main Body */}
             <div className="flex-1 flex overflow-hidden relative z-0 bg-[#f8f9fa]">
                {/* Left Sidebar */}
                {subnavItems.length > 0 && isSidebarOpen && (
                    <div className="w-64 bg-[#f1f3f5] border-r border-gray-200 flex flex-col pt-4 animate-slideRight">
                        <div className="px-4 mb-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Navigation</div>
                        <div className="flex-1 overflow-y-auto px-2 space-y-1">
                            {subnavItems.map(item => (
                                <button 
                                    key={item}
                                    onClick={() => setActiveSubNav(item)}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeSubNav === item ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:bg-gray-200'}`}
                                >
                                    {item}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Content */}
                <main className="flex-1 overflow-y-auto relative no-scrollbar bg-white">
                    <div className="p-8 min-h-full">
                        <Suspense fallback={<div className="flex items-center justify-center h-full"><Spinner /></div>}>
                            {renderAppContent()}
                        </Suspense>
                    </div>
                </main>
             </div>

             {/* Status Bar */}
             <div className="h-6 bg-[#f1f3f5] border-t border-gray-200 flex items-center justify-between px-4 text-[10px] text-gray-500 select-none z-40">
                 <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                    Ready
                 </span>
                 <span className="font-mono opacity-70">{appName} v1.2.0 • Build 2409</span>
             </div>
    </div>
  );
};

export default AppOverlay;