
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Icon, Card, Badge, Button } from '../components/shared/ui/CommonUI';
import { useDashboardData } from '../hooks/useDashboardData';
import { useDataQuery } from '../hooks/useDataQuery';
import { useRealtimeContext } from '../context/RealtimeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import OwnerDashboard from './dashboards/OwnerDashboard';
import pb from '../lib/pocketbase';
import { isMockEnv } from '../utils/mockData';
import { RecordSubscription } from 'pocketbase';

interface DashboardProps {
  activeTab: string;
  activeSubNav: string;
}

interface Activity {
  id: string;
  type: string;
  message: string;
  user: string;
  timestamp: string;
  icon: string;
  color: string;
}

interface Widget {
  id: string;
  title: string;
  component: 'chart' | 'activities' | 'stats';
  order: number;
}

const Dashboard: React.FC<DashboardProps> = ({ activeTab }) => {
  const { kpis, alerts, loading, error } = useDashboardData();
  const { isConnected, notifications, onlineUsers } = useRealtimeContext();
  
  // If activeTab is 'Overview', render the OwnerDashboard component instead
  if (activeTab === 'Overview') {
    return <OwnerDashboard activeTab={activeTab} />;
  }
  
  // Real-time data subscriptions
  const { items: realtimeActivities, refresh: refreshActivities } = useDataQuery<Activity>('activities', {
    sort: '-created',
    perPage: 10,
    requestKey: null
  });
  
  const [activities, setActivities] = useState<Activity[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [chartType, setChartType] = useState<'line' | 'area' | 'bar'>('area');
  const [widgets, setWidgets] = useState<Widget[]>([
    { id: 'chart', title: 'Trends', component: 'chart', order: 0 },
    { id: 'activities', title: 'Live Activity', component: 'activities', order: 1 },
    { id: 'stats', title: 'Statistics', component: 'stats', order: 2 }
  ]);
  
  // Real-time data subscription from PocketBase
  useEffect(() => {
    // Initialize with historical data
    const fetchInitialChartData = async () => {
      if (isMockEnv()) {
        // Generate mock historical data for development
        const mockData = Array.from({ length: 12 }, (_, i) => {
          const time = new Date(Date.now() - (11 - i) * 60000);
          return {
            time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            value: Math.floor(Math.random() * 100) + 50,
            users: Math.floor(Math.random() * 50) + 20,
            revenue: Math.floor(Math.random() * 5000) + 1000
          };
        });
        setChartData(mockData);
        return;
      }

      try {
        // Fetch recent analytics events from PocketBase
        const records = await pb.collection('analytics_events').getList(1, 12, {
          sort: '-created',
          requestKey: null,
        });
        
        const historicalData = records.items.reverse().map(record => ({
          time: new Date(record.created).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          value: record.value || 0,
          users: record.active_users || 0,
          revenue: record.revenue || 0
        }));
        
        setChartData(historicalData.length > 0 ? historicalData : generateMockDataPoint());
      } catch (err) {
        console.warn('Failed to fetch analytics data, using fallback:', err);
        setChartData(generateMockDataPoint());
      }
    };

    // Helper to generate fallback data point
    const generateMockDataPoint = () => [{
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      value: 75,
      users: 35,
      revenue: 2500
    }];

    fetchInitialChartData();

    // Subscribe to real-time analytics updates
    if (!isMockEnv()) {
      let unsubscribe: (() => void) | null = null;
      
      pb.collection('analytics_events').subscribe('*', (e: RecordSubscription<any>) => {
        if (e.action === 'create') {
          const newDataPoint = {
            time: new Date(e.record.created).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            value: e.record.value || 0,
            users: e.record.active_users || 0,
            revenue: e.record.revenue || 0
          };
          setChartData(prev => [...prev.slice(-11), newDataPoint]);
        }
      }).then(unsub => {
        unsubscribe = unsub;
      }).catch(err => {
        console.warn('Analytics subscription failed:', err);
      });

      return () => {
        if (unsubscribe) {
          pb.collection('analytics_events').unsubscribe('*');
        }
      };
    } else {
      // For mock environment, simulate updates periodically
      const interval = setInterval(() => {
        const newDataPoint = {
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          value: Math.floor(Math.random() * 100) + 50,
          users: Math.floor(Math.random() * 50) + 20,
          revenue: Math.floor(Math.random() * 5000) + 1000
        };
        setChartData(prev => [...prev.slice(-11), newDataPoint]);
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, []);
  
  // Real-time activity stream with PocketBase subscription
  useEffect(() => {
    // Map activity type to icon and color
    const getActivityStyle = (type: string): { icon: string; color: string } => {
      const styles: Record<string, { icon: string; color: string }> = {
        user: { icon: 'UserPlus', color: 'text-green-500' },
        payment: { icon: 'CreditCard', color: 'text-blue-500' },
        alert: { icon: 'ExclamationTriangle', color: 'text-orange-500' },
        success: { icon: 'CheckCircle', color: 'text-green-500' },
        error: { icon: 'XCircle', color: 'text-red-500' },
        info: { icon: 'InformationCircle', color: 'text-blue-400' },
        default: { icon: 'Bell', color: 'text-gray-500' }
      };
      return styles[type] || styles.default;
    };

    // Transform activities from PocketBase format
    const transformActivity = (record: any): Activity => {
      const style = getActivityStyle(record.type || 'default');
      return {
        id: record.id,
        type: record.type || 'info',
        message: record.message || record.description || 'Activity',
        user: record.user_name || record.user || 'System',
        timestamp: record.created || new Date().toISOString(),
        icon: style.icon,
        color: style.color
      };
    };

    if (realtimeActivities.length > 0) {
      setActivities(realtimeActivities.map(transformActivity));
    } else if (isMockEnv()) {
      // Mock activities for development/testing
      const mockActivities: Activity[] = [
        { id: '1', type: 'user', message: 'New user registered', user: 'John Doe', timestamp: new Date().toISOString(), icon: 'UserPlus', color: 'text-green-500' },
        { id: '2', type: 'payment', message: 'Payment received $99', user: 'System', timestamp: new Date(Date.now() - 60000).toISOString(), icon: 'CreditCard', color: 'text-blue-500' },
        { id: '3', type: 'alert', message: 'Server load high', user: 'Monitoring', timestamp: new Date(Date.now() - 120000).toISOString(), icon: 'ExclamationTriangle', color: 'text-orange-500' },
        { id: '4', type: 'success', message: 'Backup completed', user: 'System', timestamp: new Date(Date.now() - 180000).toISOString(), icon: 'CheckCircle', color: 'text-green-500' }
      ];
      setActivities(mockActivities);
    }

    // Subscribe to real-time activity updates
    if (!isMockEnv()) {
      pb.collection('activities').subscribe('*', (e: RecordSubscription<any>) => {
        if (e.action === 'create') {
          const newActivity = transformActivity(e.record);
          setActivities(prev => [newActivity, ...prev].slice(0, 10));
        } else if (e.action === 'delete') {
          setActivities(prev => prev.filter(a => a.id !== e.record.id));
        }
      }).catch(err => {
        console.warn('Activity subscription failed:', err);
      });

      return () => {
        pb.collection('activities').unsubscribe('*');
      };
    }
  }, [realtimeActivities]);
  
  // Handle drag and drop for widgets
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const items = Array.from(widgets);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    const reordered = items.map((item, index) => ({ ...item, order: index }));
    setWidgets(reordered);
  };

  if (loading) {
      return (
          <div className="w-full h-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gyn-blue-medium dark:border-blue-400"></div>
          </div>
      );
  }

  if (error) {
      return (
          <div className="w-full p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
              Error loading dashboard: {error}
          </div>
      );
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-fadeIn">
      {/* Page Header with Real-time Status */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-end justify-between border-b border-gray-200/50 dark:border-gray-700/50 pb-4 relative"
      >
        <div className="relative z-10">
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gyn-blue-dark to-gyn-blue-medium dark:from-blue-400 dark:to-blue-200 drop-shadow-sm">Dashboard</h1>
          <p className="text-gyn-grey dark:text-gray-400 text-sm mt-1 font-medium">Live System Overview & Real-time Metrics</p>
        </div>
        <div className="flex items-center gap-3 relative z-10">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Icon name="Users" className="w-4 h-4" />
            <span className="font-medium">{onlineUsers.length} online</span>
          </div>
          <Badge variant={isConnected ? 'success' : 'danger'} className={`${isConnected ? 'bg-green-100/80 dark:bg-green-900/30' : 'bg-red-100/80 dark:bg-red-900/30'} backdrop-blur-md border ${isConnected ? 'border-green-200 dark:border-green-800 text-green-700 dark:text-green-400' : 'border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'} shadow-sm`}>
            <span className={`w-2 h-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'} rounded-full animate-pulse mr-2`}></span>
            {isConnected ? 'Connected' : 'Disconnected'}
          </Badge>
          {notifications.filter(n => !n.is_read).length > 0 && (
            <Badge variant="primary" className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
              {notifications.filter(n => !n.is_read).length} new
            </Badge>
          )}
        </div>
      </motion.div>

      {/* Interactive KPI Cards with Real-time Updates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <AnimatePresence>
          {kpis.map((kpi, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card 
                variant="glass" 
                className="relative overflow-hidden group hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 cursor-pointer"
                onClick={() => console.log(`KPI clicked: ${kpi.label}`)}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${kpi.bg} opacity-50 dark:opacity-20 group-hover:opacity-70 transition-opacity`}></div>
                <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                <div className="relative p-5 z-10">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{kpi.label}</span>
                    <motion.div 
                      className="p-2 bg-white/60 dark:bg-slate-700/60 rounded-lg shadow-sm"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Icon name={kpi.icon} className={`w-5 h-5 ${kpi.color} dark:text-white`} />
                    </motion.div>
                  </div>
                  <motion.div 
                    className="text-3xl font-black text-gyn-blue-dark dark:text-white tracking-tight"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    key={kpi.value}
                  >
                    {kpi.value}
                  </motion.div>
                  <div className="text-xs font-bold text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                    <motion.span 
                      className={kpi.sub.includes('+') || kpi.sub.includes('-0') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    >
                      {kpi.sub}
                    </motion.span>
                    <span className="opacity-60">from last month</span>
                  </div>
                </div>
                
                {/* Real-time pulse indicator */}
                <div className="absolute top-2 right-2 w-2 h-2 bg-green-400 rounded-full animate-ping opacity-75"></div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
         {/* Main Chart Section - Frosted Glass Panel */}
         <Card variant="glass" className="lg:col-span-2 p-6 min-h-[350px] flex flex-col relative">
            <h3 className="text-lg font-bold text-gyn-blue-dark dark:text-white mb-4 flex items-center gap-2">
                <Icon name="PresentationChartLineIcon" className="w-5 h-5 text-gyn-blue-medium dark:text-blue-400" />
                {activeTab} Trends
            </h3>
            <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-gray-50/50 to-white/50 dark:from-slate-800/50 dark:to-slate-700/50 rounded-xl border border-gray-200/50 dark:border-slate-600/50 relative overflow-hidden group shadow-inner">
                 {/* Decorative Chart Background */}
                 <svg className="absolute bottom-0 left-0 w-full h-1/2 opacity-20 text-gyn-blue-medium dark:text-blue-500" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <path d="M0 100 L0 50 L20 60 L40 40 L60 80 L80 30 L100 0 L100 100 Z" fill="currentColor" />
                 </svg>
                 
                 <div className="absolute inset-0 flex items-center justify-center">
                     <div className="w-40 h-40 rounded-full bg-gyn-blue-light/50 dark:bg-blue-900/30 filter blur-3xl animate-pulse"></div>
                 </div>

                 <div className="relative z-10 text-center">
                    <Icon name="Grid" className="w-16 h-16 text-gyn-blue-medium/50 dark:text-blue-400/50 mx-auto mb-2" />
                    <p className="text-gyn-grey dark:text-gray-400 font-medium text-sm">Interactive Visualization</p>
                 </div>
            </div>
         </Card>

         {/* Alerts / Activity Feed - Neumorphic List */}
         <Card variant="glass" className="p-6 relative">
            <h3 className="text-lg font-bold text-gyn-blue-dark dark:text-white mb-4 flex items-center gap-2">
                <Icon name="BellIcon" className="w-5 h-5 text-gyn-orange dark:text-orange-400" />
                Recent Alerts
            </h3>
            <div className="space-y-3">
                {alerts.map((alert, i) => (
                    <div key={i} className={`p-4 rounded-xl ${alert.bg} dark:bg-slate-700/50 border ${alert.border} dark:border-slate-600 shadow-sm hover:shadow-md transition-all cursor-pointer group`}>
                        <div className="flex justify-between items-start mb-1">
                            <span className={`text-[10px] font-black uppercase tracking-wider ${alert.text} dark:text-gray-300 flex items-center gap-1`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${alert.text.replace('text', 'bg')}`}></span>
                                {alert.type}
                            </span>
                            <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">{alert.time}</span>
                        </div>
                        <p className="text-xs font-bold text-gray-700 dark:text-gray-200 mt-1 group-hover:text-black dark:group-hover:text-white transition-colors">{alert.msg}</p>
                    </div>
                ))}
            </div>
            
            <Button variant="ghost" className="w-full mt-4 text-xs font-bold text-gyn-blue-medium dark:text-blue-400">
                View All Logs
            </Button>
         </Card>
      </div>
    </div>
  );
};

export default Dashboard;
