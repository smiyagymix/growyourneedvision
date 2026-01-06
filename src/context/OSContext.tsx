import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

// Types for OS Windows and Processes
export interface WindowProcess {
  id: string;
  appName: string;
  title: string;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  // Optional state for window content (like current tab)
  state?: Record<string, unknown>;
}

interface OSContextType {
  activeOverlayApp: string | null; // Legacy support for single overlay
  windows: WindowProcess[];
  launchApp: (appName: string) => void;
  closeApp: (processId: string) => void;
  minimizeApp: (processId: string) => void;
  minimizeAppByName: (appName: string) => void;
  closeAppByName: (appName: string) => void;
  focusApp: (processId: string) => void;

  // Global System Actions
  toggleSidebar: () => void;
  sidebarExpanded: boolean;

  // Legacy Overlay Control (to be deprecated eventually but kept for compatibility)
  openOverlay: (appName: string) => void;
  closeOverlay: () => void;
}

const OSContext = createContext<OSContextType | undefined>(undefined);

export const OSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State for Multi-Window System (Future-Proofing)
  const [windows, setWindows] = useState<WindowProcess[]>([]);
  const [windowStack, setWindowStack] = useState<string[]>([]); // Order of Z-Index

  // Legacy State for Single Overlay (Current Implementation)
  const [activeOverlayApp, setActiveOverlayApp] = useState<string | null>(null);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  const openOverlay = useCallback((appName: string) => {
    setActiveOverlayApp(appName);
  }, []);

  const closeOverlay = useCallback(() => {
    setActiveOverlayApp(null);
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarExpanded(prev => !prev);
  }, []);

  // -- Window Manager Logic (Hybrid Support) --

  const launchApp = useCallback((appName: string) => {
    // Check if app is already running
    setWindows(prev => {
      const existing = prev.find(w => w.appName === appName);
      if (existing) {
        // If minimized, restore it
        if (existing.isMinimized) {
             return prev.map(w => w.id === existing.id ? { ...w, isMinimized: false } : w);
        }
        return prev;
      }
      
      // If not running, create new
      const pid = `${appName}-${Date.now()}`;
      const newWindow: WindowProcess = {
        id: pid,
        appName,
        title: appName,
        isMinimized: false,
        isMaximized: true,
        zIndex: 10 + prev.length
      };
      return [...prev, newWindow];
    });

    setActiveOverlayApp(appName);
  }, []);

  const closeApp = useCallback((processId: string) => {
    // Remove the window by id and, if appropriate, clear activeOverlayApp.
    setWindows(prev => {
      const toClose = prev.find(w => w.id === processId);
      if (!toClose) return prev;

      const newWindows = prev.filter(w => w.id !== processId);

      // If there are no remaining windows with the same appName and that
      // app is currently the active overlay, clear the overlay.
      const stillExists = newWindows.some(w => w.appName === toClose.appName);
      if (!stillExists && activeOverlayApp === toClose.appName) {
        setActiveOverlayApp(null);
      }

      return newWindows;
    });
  }, [activeOverlayApp]);
  
  // Helper to close by Name (for legacy overlay)
  const closeAppByName = useCallback((appName: string) => {
      setWindows(prev => prev.filter(w => w.appName !== appName));
      if (activeOverlayApp === appName) {
          setActiveOverlayApp(null);
      }
  }, [activeOverlayApp]);

  const minimizeApp = useCallback((processId: string) => {
    setWindows(prev => prev.map(w => w.id === processId ? { ...w, isMinimized: true } : w));
    if (activeOverlayApp) setActiveOverlayApp(null); // Hide overlay visually
  }, [activeOverlayApp]);
  
  const minimizeAppByName = useCallback((appName: string) => {
      setWindows(prev => prev.map(w => w.appName === appName ? { ...w, isMinimized: true } : w));
      if (activeOverlayApp === appName) setActiveOverlayApp(null);
  }, [activeOverlayApp]);

  const focusApp = useCallback((processId: string) => {
    // Bring to front logic would go here
    setWindows(prev => {
      const win = prev.find(w => w.id === processId);
      if (win) {
        setActiveOverlayApp(win.appName);
        return prev.map(w => w.id === processId ? { ...w, isMinimized: false } : w);
      }
      return prev;
    });
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    activeOverlayApp,
    windows,
    launchApp,
    closeApp,
    minimizeApp,
    minimizeAppByName,
    closeAppByName,
    focusApp,
    toggleSidebar,
    sidebarExpanded,
    openOverlay,
    closeOverlay
  }), [
    activeOverlayApp,
    windows,
    launchApp,
    closeApp,
    minimizeApp,
    minimizeAppByName,
    closeAppByName,
    focusApp,
    toggleSidebar,
    sidebarExpanded,
    openOverlay,
    closeOverlay
  ]);

  return (
    <OSContext.Provider value={contextValue}>
      {children}
    </OSContext.Provider>
  );
};

export const useOS = () => {
  const context = useContext(OSContext);
  if (context === undefined) {
    throw new Error('useOS must be used within an OSProvider');
  }
  return context;
};
