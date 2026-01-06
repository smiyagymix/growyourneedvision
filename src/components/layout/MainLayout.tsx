import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import OwnerHeader from './OwnerHeader';
import OwnerSidebarRight from './OwnerSidebarRight';
import OwnerSubnavLeft from './OwnerSubnavLeft';
import OwnerFooter from './OwnerFooter';
import AppOverlay from './AppOverlay';
import { useOS } from '../../context/OSContext'; // Import useOS
import { isMockEnv } from '../../utils/mockData';
import { useNetwork } from '../../hooks/useNetwork';
import { Icon } from '../shared/ui/CommonUI';

interface MainLayoutProps {
  config: Record<string, { label: string, icon: string, tabs: string[], subnav: Record<string, string[]> }>;
  renderContent: (activeModule: string, activeTab: string, activeSubNav: string) => React.ReactNode;
  role?: string;
}

const MainLayout: React.FC<MainLayoutProps> = ({ config, renderContent, role = 'Admin' }) => {
  const [activeModule, setActiveModule] = useState(Object.keys(config)[0]);
  const [activeTab, setActiveTab] = useState<string>('');
  const [activeSubNav, setActiveSubNav] = useState<string>('');
  const location = useLocation();
  const getPathSegments = () => {
    const hashPath = location.hash?.replace(/^#/, '') || '';
    const pathToUse = hashPath || location.pathname;
    return pathToUse.split('/').filter(Boolean);
  };

  const updateHash = (moduleId?: string, tab?: string, subnav?: string) => {
    if (isMockEnv()) return; // avoid navigation churn in E2E/mock environments

    const pathSegments = getPathSegments();
    const base = pathSegments[0] || 'admin';
    const parts = [base];

    if (moduleId) parts.push(moduleId);
    if (tab) parts.push(tab.toLowerCase().replace(/\s+/g, '-'));
    if (subnav) parts.push(subnav.toLowerCase().replace(/\s+/g, '-'));

    const nextHash = `#/${parts.join('/')}`;
    if (typeof window !== 'undefined' && window.location.hash !== nextHash) {
      window.location.hash = nextHash;
    }
  };

  // Auto-open dock after mount in mock/test to avoid timeouts
  useEffect(() => {
    const hashPath = location.hash?.replace(/^#/, '') || '';
    if (hashPath.includes('teacher') || hashPath.includes('student') || hashPath.includes('school-admin') || hashPath.includes('admin')) {
      // Trigger dock open via custom event the footer listens to
      window.dispatchEvent(new CustomEvent('gyn-open-dock'));
    }
  }, [location.hash]);
  
  // Use Global OS Context
  const { activeOverlayApp, closeOverlay, launchApp, sidebarExpanded, toggleSidebar } = useOS();
  const network = useNetwork();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

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

  // Sync Module with URL
  useEffect(() => {
      const pathSegments = getPathSegments();
      if (pathSegments.length >= 2) {
          const moduleSlug = pathSegments[1];
          if (config[moduleSlug] && moduleSlug !== activeModule) {
              setActiveModule(moduleSlug);
          }
      }
    }, [location.pathname, location.hash, config]);

  // Handle Tab & Subnav changes (including URL sync)
  useEffect(() => {
    const moduleConfig = config[activeModule];
    if (moduleConfig) {
        let targetTab = moduleConfig.tabs[0];
        
        // Check if URL specifies a tab for this module
      const pathSegments = getPathSegments();
      if (pathSegments.length >= 3 && pathSegments[1] === activeModule) {
             const tabSlug = pathSegments[2];
             const matchedTab = moduleConfig.tabs.find(t => 
                t.toLowerCase().replace(/ /g, '-') === tabSlug.toLowerCase() ||
                t.toLowerCase().includes(tabSlug.toLowerCase())
             );
             if (matchedTab) targetTab = matchedTab;
        }

        setActiveTab(targetTab);
        
        const subnavOptions = moduleConfig.subnav[targetTab];
        const nextSubnav = subnavOptions && subnavOptions.length > 0 ? subnavOptions[0] : '';
        setActiveSubNav(nextSubnav);
    }
  }, [activeModule, config, location.pathname, location.hash]);

  useEffect(() => {
    const moduleConfig = config[activeModule];
    if (moduleConfig) {
        const subnavOptions = moduleConfig.subnav[activeTab];
        // Only reset subnav if current one is invalid for new tab
        if (!subnavOptions?.includes(activeSubNav)) {
             setActiveSubNav(subnavOptions && subnavOptions.length > 0 ? subnavOptions[0] : '');
        }
    }
  }, [activeTab, activeModule, config]);

  const currentTabs = config[activeModule]?.tabs || [];
  const currentSubNavItems = config[activeModule]?.subnav[activeTab] || [];

  const handleModuleChange = (moduleId: string) => {
    const moduleConfig = config[moduleId];
    const defaultTab = moduleConfig?.tabs?.[0] || '';
    const defaultSubnav = moduleConfig?.subnav?.[defaultTab]?.[0] || '';

    setActiveModule(moduleId);
    setActiveTab(defaultTab);
    setActiveSubNav(defaultSubnav);
    updateHash(moduleId, defaultTab, defaultSubnav);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    const subnavOptions = config[activeModule]?.subnav?.[tab];
    const nextSubnav = subnavOptions?.includes(activeSubNav) ? activeSubNav : subnavOptions?.[0] || '';
    setActiveSubNav(nextSubnav);
    updateHash(activeModule, tab, nextSubnav);
  };

  const handleSubNavChange = (subnav: string) => {
    setActiveSubNav(subnav);
    updateHash(activeModule, activeTab, subnav);
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden font-sans text-slate-900 relative bg-white">
      
      {!network.online && (
        <div className="bg-red-500 text-white text-xs font-bold text-center py-1 absolute top-0 left-0 right-0 z-50 animate-slideInDown shadow-md flex items-center justify-center gap-2">
            <Icon name="WifiIcon" className="w-3 h-3" />
            OFFLINE MODE - Changes may not be saved
        </div>
      )}

      {/* 1. Header */}
      <OwnerHeader 
        activeTab={activeTab} 
        onTabChange={handleTabChange} 
        tabs={currentTabs} 
        role={role}
      />

      {/* 2. Main Layout Body */}
      <div className="flex-1 flex overflow-hidden relative z-10">
        
        {/* Left Column Container */}
        <div className="flex-1 flex flex-col min-w-0 pl-1 md:pl-4 pb-0 min-h-0 overflow-hidden">
            
            <div className="flex-1 flex overflow-hidden relative mt-1 md:mt-2 mr-1 md:mr-2 mb-1 md:mb-2 min-h-0">
                {currentSubNavItems.length > 0 && (
                  <OwnerSubnavLeft 
                    activeSubNav={activeSubNav}
                    onSubNavChange={handleSubNavChange}
                    subItems={currentSubNavItems}
                  />
                )}

                <main className="flex-1 flex flex-col relative px-0 md:px-0 transition-all duration-300 min-h-0 overflow-hidden">
                    {/* Clean Content Area */}
                    <div className="flex-1 overflow-hidden relative z-10 flex flex-col min-h-0">
                        {renderContent(activeModule, activeTab, activeSubNav)}
                    </div>
                </main>
            </div>

            <div className="shrink-0 pr-1 md:pr-4 z-40 mt-0">
                 <OwnerFooter 
                    onLaunchApp={launchApp} 
                    activeApps={[]} 
                    isMobileSidebarOpen={mobileSidebarOpen}
                    toggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
                 />
            </div>
        </div>

        {/* Right Sidebar - Full height metallic slab */}
        <OwnerSidebarRight 
          activeModule={activeModule}
          onModuleChange={handleModuleChange}
          expanded={sidebarExpanded}
          onToggleExpand={toggleSidebar}
          mobileOpen={mobileSidebarOpen}
          modules={Object.entries(config).map(([id, cfg]) => ({
            id,
            label: (cfg as any).label,
            icon: (cfg as any).icon
          }))}
        />
      </div>

      {activeOverlayApp && (
          <AppOverlay appName={activeOverlayApp} onClose={closeOverlay} />
      )}
    </div>
  );
};

export default MainLayout;