import React, { useState, useEffect } from 'react';
import OwnerHeader from './layout/OwnerHeader';
import OwnerSidebarRight from './layout/OwnerSidebarRight';
import OwnerSubnavLeft from './layout/OwnerSubnavLeft';
import OwnerFooter from './layout/OwnerFooter';
import AppOverlay from './layout/AppOverlay';
import { NAV_CONFIG } from '../data/AppConfigs';
import { useOS } from '../context/OSContext'; // Import OS Context

import Dashboard from '../apps/Dashboard';
import TenantMgt from '../apps/TenantMgt';
import PlatformCRM from '../apps/PlatformCRM';
import ToolPlatform from '../apps/ToolPlatform';
import Communication from '../apps/Communication';
import ConciergeAI from '../apps/ConciergeAI';
import Wellness from '../apps/Wellness';
import Tools from '../apps/Tools';
import PlatformSettings from '../apps/PlatformSettings';

const AdminPanelPage: React.FC = () => {
  const [activeModule, setActiveModule] = useState('dashboard');
  const [activeTab, setActiveTab] = useState<string>('Overview');
  const [activeSubNav, setActiveSubNav] = useState<string>('');
  
  // Use Global OS Context
  const { activeOverlayApp, closeOverlay, launchApp, sidebarExpanded, toggleSidebar } = useOS();

  // Close overlay on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeOverlayApp) {
        closeOverlay();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [activeOverlayApp, closeOverlay]);

  useEffect(() => {
    const moduleConfig = NAV_CONFIG[activeModule];
    if (moduleConfig) {
        const firstTab = moduleConfig.tabs[0];
        setActiveTab(firstTab);
        const subnavOptions = moduleConfig.subnav[firstTab];
        setActiveSubNav(subnavOptions && subnavOptions.length > 0 ? subnavOptions[0] : '');
    }
  }, [activeModule]);

  useEffect(() => {
    const moduleConfig = NAV_CONFIG[activeModule];
    if (moduleConfig) {
        const subnavOptions = moduleConfig.subnav[activeTab];
        setActiveSubNav(subnavOptions && subnavOptions.length > 0 ? subnavOptions[0] : '');
    }
  }, [activeTab, activeModule]);

  const renderModuleContent = () => {
      const props = { activeTab, activeSubNav };
      switch (activeModule) {
          case 'dashboard': return <Dashboard {...props} />;
          case 'school': return <TenantMgt {...props} />;
          case 'crm': return <PlatformCRM {...props} />;
          case 'tool_platform': return <ToolPlatform {...props} />;
          case 'communication': return <Communication {...props} />;
          case 'concierge_ai': return <ConciergeAI {...props} />;
          case 'wellness': return <Wellness {...props} />;
          case 'tools': return <Tools {...props} />;
          case 'settings': return <PlatformSettings {...props} />;
          default: return <div>Not Found</div>;
      }
  };

  const currentTabs = NAV_CONFIG[activeModule]?.tabs || [];
  const currentSubNavItems = NAV_CONFIG[activeModule]?.subnav[activeTab] || [];

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden font-sans text-gyn-grey relative bg-[#eef2f6]">
      
      {/* Background Texture */}
      <div className="absolute inset-0 opacity-40 pointer-events-none" style={{
        backgroundImage: `radial-gradient(#dbeafe 1px, transparent 1px)`,
        backgroundSize: '24px 24px'
      }}></div>

      <OwnerHeader 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        tabs={currentTabs} 
        role="Admin"
      />

      <div className="flex-1 flex overflow-hidden relative z-10">
        <div className="flex-1 flex flex-col min-w-0 pl-4 pb-4">
            <div className="flex-1 flex overflow-hidden relative mt-4 mr-4">
                {currentSubNavItems.length > 0 && (
                    <OwnerSubnavLeft 
                        activeSubNav={activeSubNav}
                        onSubNavChange={setActiveSubNav}
                        subItems={currentSubNavItems}
                    />
                )}

                <main className="flex-1 flex flex-col relative px-4 transition-all duration-300">
                    <div className="flex-1 bg-white/60 backdrop-blur-md border border-white/50 rounded-2xl shadow-xl relative overflow-hidden flex flex-col">
                         <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent pointer-events-none"></div>
                         <div className="flex-1 overflow-auto no-scrollbar p-8 relative z-10">
                            {renderModuleContent()}
                         </div>
                    </div>
                </main>
            </div>

            <div className="shrink-0 pr-4 z-40">
                 <OwnerFooter onLaunchApp={launchApp} activeApps={[]} />
            </div>
        </div>

        <OwnerSidebarRight 
            activeModule={activeModule}
            onModuleChange={setActiveModule}
            expanded={sidebarExpanded}
            onToggleExpand={toggleSidebar}
            modules={Object.entries(NAV_CONFIG).map(([id, config]) => ({
                id,
                label: config.label,
                icon: config.icon
            }))}
        />
      </div>

      {activeOverlayApp && (
          <AppOverlay appName={activeOverlayApp} onClose={closeOverlay} />
      )}
    </div>
  );
};

export default AdminPanelPage;