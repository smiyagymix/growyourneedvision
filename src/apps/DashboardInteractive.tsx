import React, { useState, useEffect } from 'react';
import { Icon, Card, Badge, Button } from '../components/shared/ui/CommonUI';
import { useDashboardData } from '../hooks/useDashboardData';
import { useDataQuery } from '../hooks/useDataQuery';
import { useRealtimeContext } from '../context/RealtimeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';

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

const DashboardInteractive: React.FC<DashboardProps> = ({ activeTab }) => {
  const { kpis, alerts, loading, error } = useDashboardData();
  const { isConnected, notifications, onlineUsers } = useRealtimeContext();
  
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
  
  // Simulate real-time data updates
  useEffect(() => {
    const interval = setInterval(() => {
      const newDataPoint = {
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        value: Math.floor(Math.random() * 100) + 50,
        users: Math.floor(Math.random() * 50) + 20,
        revenue: Math.floor(Math.random() * 5000) + 1000
      };
      
      setChartData(prev => [...prev.slice(-11), newDataPoint]);
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Real-time activity stream
  useEffect(() => {
    if (realtimeActivities.length > 0) {
      setActivities(realtimeActivities);
    } else {
      // Mock activities for demo
      const mockActivities: Activity[] = [
        { id: '1', type: 'user', message: 'New user registered', user: 'John Doe', timestamp: new Date().toISOString(), icon: 'UserPlus', color: 'text-green-500' },
        { id: '2', type: 'payment', message: 'Payment received $99', user: 'System', timestamp: new Date(Date.now() - 60000).toISOString(), icon: 'CreditCard', color: 'text-blue-500' },
        { id: '3', type: 'alert', message: 'Server load high', user: 'Monitoring', timestamp: new Date(Date.now() - 120000).toISOString(), icon: 'ExclamationTriangle', color: 'text-orange-500' },
        { id: '4', type: 'success', message: 'Backup completed', user: 'System', timestamp: new Date(Date.now() - 180000).toISOString(), icon: 'CheckCircle', color: 'text-green-500' }
      ];
      setActivities(mockActivities);
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
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gyn-blue-dark to-gyn-blue-medium dark:from-blue-400 dark:to-blue-200 drop-shadow-sm">Interactive Dashboard</h1>
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

      {/* Drag-and-Drop Customizable Dashboard */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="dashboard-widgets">
          {(provided) => (
            <div 
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-6"
            >
              {widgets.sort((a, b) => a.order - b.order).map((widget, index) => (
                <Draggable key={widget.id} draggableId={widget.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`transition-transform ${snapshot.isDragging ? 'scale-105 rotate-1 z-50' : ''}`}
                    >
                      {/* Interactive Chart Widget */}
                      {widget.component === 'chart' && (
                        <Card variant="glass" className="p-6 min-h-[400px] flex flex-col relative">
                          <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-3">
                              <div {...provided.dragHandleProps} className="cursor-move p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                                <Icon name="GripVertical" className="w-5 h-5 text-gray-400" />
                              </div>
                              <h3 className="text-lg font-bold text-gyn-blue-dark dark:text-white flex items-center gap-2">
                                <Icon name="PresentationChartLineIcon" className="w-5 h-5 text-gyn-blue-medium dark:text-blue-400" />
                                Live {activeTab} Trends
                              </h3>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant={chartType === 'line' ? 'primary' : 'outline'}
                                size="sm"
                                onClick={() => setChartType('line')}
                              >
                                Line
                              </Button>
                              <Button
                                variant={chartType === 'area' ? 'primary' : 'outline'}
                                size="sm"
                                onClick={() => setChartType('area')}
                              >
                                Area
                              </Button>
                              <Button
                                variant={chartType === 'bar' ? 'primary' : 'outline'}
                                size="sm"
                                onClick={() => setChartType('bar')}
                              >
                                Bar
                              </Button>
                            </div>
                          </div>
                          
                          <div className="flex-1 bg-gradient-to-b from-gray-50/50 to-white/50 dark:from-slate-800/50 dark:to-slate-700/50 rounded-xl border border-gray-200/50 dark:border-slate-600/50 p-4">
                            {chartData.length > 0 ? (
                              <ResponsiveContainer width="100%" height="100%">
                                {chartType === 'line' && (
                                  <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                                    <XAxis dataKey="time" stroke="#9ca3af" fontSize={12} />
                                    <YAxis stroke="#9ca3af" fontSize={12} />
                                    <Tooltip 
                                      contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                                    />
                                    <Legend />
                                    <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                    <Line type="monotone" dataKey="users" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                                  </LineChart>
                                )}
                                {chartType === 'area' && (
                                  <AreaChart data={chartData}>
                                    <defs>
                                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                                      </linearGradient>
                                      <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                                      </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                                    <XAxis dataKey="time" stroke="#9ca3af" fontSize={12} />
                                    <YAxis stroke="#9ca3af" fontSize={12} />
                                    <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                                    <Legend />
                                    <Area type="monotone" dataKey="value" stroke="#3b82f6" fillOpacity={1} fill="url(#colorValue)" />
                                    <Area type="monotone" dataKey="users" stroke="#10b981" fillOpacity={1} fill="url(#colorUsers)" />
                                  </AreaChart>
                                )}
                                {chartType === 'bar' && (
                                  <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                                    <XAxis dataKey="time" stroke="#9ca3af" fontSize={12} />
                                    <YAxis stroke="#9ca3af" fontSize={12} />
                                    <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                                    <Legend />
                                    <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                                    <Bar dataKey="users" fill="#10b981" radius={[8, 8, 0, 0]} />
                                  </BarChart>
                                )}
                              </ResponsiveContainer>
                            ) : (
                              <div className="flex items-center justify-center h-full">
                                <div className="text-center">
                                  <div className="w-12 h-12 border-4 border-gyn-blue-medium border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                                  <p className="text-gray-500 dark:text-gray-400 text-sm">Loading live data...</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </Card>
                      )}

                      {/* Live Activity Stream Widget */}
                      {widget.component === 'activities' && (
                        <Card variant="glass" className="p-6 relative min-h-[400px]">
                          <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-3">
                              <div {...provided.dragHandleProps} className="cursor-move p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                                <Icon name="GripVertical" className="w-5 h-5 text-gray-400" />
                              </div>
                              <h3 className="text-lg font-bold text-gyn-blue-dark dark:text-white flex items-center gap-2">
                                <Icon name="Activity" className="w-5 h-5 text-gyn-orange dark:text-orange-400" />
                                Live Activity Stream
                              </h3>
                            </div>
                            <Button variant="outline" size="sm" onClick={refreshActivities}>
                              <Icon name="RefreshCw" className="w-4 h-4 mr-2" />
                              Refresh
                            </Button>
                          </div>
                          
                          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">
                            <AnimatePresence>
                              {activities.map((activity, idx) => (
                                <motion.div
                                  key={activity.id}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, x: 20 }}
                                  transition={{ delay: idx * 0.05 }}
                                  className="flex items-start gap-3 p-3 bg-white/60 dark:bg-slate-800/60 rounded-lg hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all cursor-pointer group border border-gray-200/50 dark:border-gray-700/50"
                                >
                                  <div className={`p-2 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 ${activity.color} group-hover:scale-110 transition-transform`}>
                                    <Icon name={activity.icon} className="w-4 h-4" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{activity.message}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                      {activity.user} · {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                  </div>
                                  <div className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Icon name="ChevronRight" className="w-4 h-4" />
                                  </div>
                                </motion.div>
                              ))}
                            </AnimatePresence>
                          </div>
                        </Card>
                      )}
                      
                      {/* System Alerts Widget */}
                      {widget.component === 'stats' && (
                        <Card variant="glass" className="p-6 relative">
                          <div className="flex items-center gap-3 mb-4">
                            <div {...provided.dragHandleProps} className="cursor-move p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                              <Icon name="GripVertical" className="w-5 h-5 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-bold text-gyn-blue-dark dark:text-white flex items-center gap-2">
                              <Icon name="BellIcon" className="w-5 h-5 text-gyn-orange dark:text-orange-400" />
                              System Alerts
                            </h3>
                          </div>
                          
                          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">
                            <AnimatePresence>
                              {alerts.map((alert, idx) => (
                                <motion.div 
                                  key={alert.id} 
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.95 }}
                                  transition={{ delay: idx * 0.05 }}
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  className={`relative flex items-start gap-3 p-4 ${alert.bg} backdrop-blur-md rounded-xl border ${alert.border} dark:bg-slate-800/50 dark:border-slate-700 shadow-sm group transition-all hover:shadow-lg hover:-translate-y-1 cursor-pointer`}
                                >
                                  <motion.div 
                                    className="p-2 rounded-lg bg-white/70 dark:bg-slate-700/70 shadow-sm"
                                    animate={{ rotate: [0, 5, -5, 0] }}
                                    transition={{ repeat: Infinity, duration: 3, repeatDelay: 2 }}
                                  >
                                    <Icon name={alert.icon} className={`w-5 h-5 ${alert.text}`} />
                                  </motion.div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <div className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">{alert.type}</div>
                                      <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent dark:from-gray-600"></div>
                                    </div>
                                    <p className={`text-sm font-medium ${alert.text} dark:text-white`}>{alert.msg}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
                                      <Icon name="Clock" className="w-3 h-3" />
                                      {alert.time}
                                    </p>
                                  </div>
                                  <div className="flex flex-col gap-2">
                                    <Button variant="outline" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Icon name="Eye" className="w-3 h-3" />
                                    </Button>
                                    <Button variant="outline" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Icon name="X" className="w-3 h-3" />
                                    </Button>
                                  </div>
                                  <div className="absolute top-2 right-2 w-2 h-2 bg-red-400 rounded-full animate-ping"></div>
                                </motion.div>
                              ))}
                            </AnimatePresence>
                          </div>
                        </Card>
                      )}
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
      
      {/* Interactive Help Tooltip */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <Button
          variant="primary"
          className="rounded-full w-14 h-14 shadow-2xl hover:shadow-gyn-blue-medium/50"
          onClick={() => alert('🎉 Interactive Features:\n\n• Drag widgets to reorder\n• Click KPI cards for details\n• Switch chart types (Line/Area/Bar)\n• Watch real-time data updates\n• Hover for interactive actions')}
        >
          <Icon name="QuestionMarkCircle" className="w-6 h-6" />
        </Button>
      </motion.div>
    </div>
  );
};

export default DashboardInteractive;
