// Example integration of Interactive Dashboard into existing routes
// Place this in your main routing configuration

import { lazy } from 'react';

// Lazy load the interactive dashboard for better performance
const DashboardInteractive = lazy(() => import('./apps/DashboardInteractive'));

// Route configuration examples:

/**
 * OPTION 1: Replace existing dashboard
 * Simply swap out the old Dashboard component with DashboardInteractive
 */
export const interactiveRoutes = [
  {
    path: '/dashboard',
    element: <DashboardInteractive activeTab="Overview" activeSubNav="" />
  },
  {
    path: '/owner',
    element: <DashboardInteractive activeTab="Owner" activeSubNav="" />
  },
  {
    path: '/school-admin',
    element: <DashboardInteractive activeTab="School" activeSubNav="" />
  }
];

/**
 * OPTION 2: A/B Test with Feature Flag
 * Toggle between static and interactive dashboards
 */
import { useFeatureFlag } from './hooks/useFeatureFlag';
import Dashboard from './apps/Dashboard'; // Original static dashboard

export const DashboardSelector: React.FC<{ activeTab: string }> = ({ activeTab }) => {
  const isInteractiveEnabled = useFeatureFlag('interactive_dashboard');
  
  return isInteractiveEnabled ? (
    <DashboardInteractive activeTab={activeTab} activeSubNav="" />
  ) : (
    <Dashboard activeTab={activeTab} activeSubNav="" />
  );
};

/**
 * OPTION 3: Role-Based Dashboard Assignment
 * Different dashboards for different user roles
 */
import { useAuth } from './context/AuthContext';

export const SmartDashboard: React.FC = () => {
  const { user } = useAuth();
  
  // Premium roles get interactive dashboard
  const premiumRoles = ['Owner', 'SchoolAdmin'];
  const useInteractive = user && premiumRoles.includes(user.role);
  
  return useInteractive ? (
    <DashboardInteractive activeTab={user.role} activeSubNav="" />
  ) : (
    <Dashboard activeTab={user?.role || 'Default'} activeSubNav="" />
  );
};

/**
 * OPTION 4: Progressive Enhancement
 * Start with static, upgrade to interactive after delay
 */
export const ProgressiveDashboard: React.FC = () => {
  const [loaded, setLoaded] = useState(false);
  
  useEffect(() => {
    // Load interactive features after initial render
    const timer = setTimeout(() => setLoaded(true), 1000);
    return () => clearTimeout(timer);
  }, []);
  
  return loaded ? (
    <DashboardInteractive activeTab="Overview" activeSubNav="" />
  ) : (
    <Dashboard activeTab="Overview" activeSubNav="" />
  );
};

/**
 * Usage in App.tsx or main routing file:
 */

// Before:
// <Route path="/dashboard" element={<Dashboard activeTab="Overview" activeSubNav="" />} />

// After (Simple):
// <Route path="/dashboard" element={<DashboardInteractive activeTab="Overview" activeSubNav="" />} />

// After (Smart):
// <Route path="/dashboard" element={<SmartDashboard />} />

/**
 * Environment-based configuration (.env):
 */

// VITE_ENABLE_INTERACTIVE_DASHBOARD=true
// VITE_DASHBOARD_UPDATE_INTERVAL=3000
// VITE_ENABLE_DRAG_DROP=true
// VITE_ENABLE_LIVE_CHARTS=true

/**
 * Configuration object for runtime customization:
 */
export const dashboardConfig = {
  updateInterval: import.meta.env.VITE_DASHBOARD_UPDATE_INTERVAL || 3000,
  enableDragDrop: import.meta.env.VITE_ENABLE_DRAG_DROP !== 'false',
  enableLiveCharts: import.meta.env.VITE_ENABLE_LIVE_CHARTS !== 'false',
  defaultChartType: 'area' as const,
  maxDataPoints: 12,
  animationDuration: 300
};
