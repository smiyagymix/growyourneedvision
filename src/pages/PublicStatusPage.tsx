import React, { useState, useEffect } from 'react';
import { Icon } from '../components/shared/ui/CommonUI';
import { motion } from 'framer-motion';
import pb from '../lib/pocketbase';

interface ServiceStatus {
    name: string;
    status: 'operational' | 'degraded' | 'outage';
    uptime: string;
    icon: string;
}

const PublicStatusPage: React.FC = () => {
    const [services, setServices] = useState<ServiceStatus[]>([
        { name: 'Web Application', status: 'operational', uptime: '99.99%', icon: 'GlobeAltIcon' },
        { name: 'Database (PocketBase)', status: 'operational', uptime: '99.95%', icon: 'CircleStackIcon' },
        { name: 'AI Service (LLM)', status: 'operational', uptime: '98.50%', icon: 'CpuChipIcon' },
        { name: 'File Storage', status: 'operational', uptime: '99.99%', icon: 'CloudIcon' },
        { name: 'Payment Gateway', status: 'operational', uptime: '100.00%', icon: 'CreditCardIcon' },
    ]);
    const [lastUpdated, setLastUpdated] = useState(new Date());

    useEffect(() => {
        const checkHealth = async () => {
            // Mock check mainly, but we can verify PB connection
            try {
                const health = await pb.health.check();
                if (health.code === 200) {
                    updateStatus('Database (PocketBase)', 'operational');
                } else {
                    updateStatus('Database (PocketBase)', 'degraded');
                }
            } catch (e) {
                updateStatus('Database (PocketBase)', 'outage');
            }
            setLastUpdated(new Date());
        };

        const interval = setInterval(checkHealth, 30000);
        checkHealth(); // Initial check
        return () => clearInterval(interval);
    }, []);

    const updateStatus = (name: string, status: ServiceStatus['status']) => {
        setServices(prev => prev.map(s => s.name === name ? { ...s, status } : s));
    };

    const overallStatus = services.every(s => s.status === 'operational')
        ? 'All Systems Operational'
        : services.some(s => s.status === 'outage')
            ? 'Major System Outage'
            : 'Partial System Outage';

    const statusColor = services.every(s => s.status === 'operational')
        ? 'bg-green-500'
        : services.some(s => s.status === 'outage')
            ? 'bg-red-500'
            : 'bg-yellow-500';

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 font-sans text-gray-900 dark:text-white transition-colors duration-200">
            {/* Header */}
            <div className="bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-slate-700">
                <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gyn-blue-medium/10 rounded-lg flex items-center justify-center">
                            <Icon name="CommandLineIcon" className="w-6 h-6 text-gyn-blue-medium" />
                        </div>
                        <h1 className="font-bold text-xl tracking-tight">System Status</h1>
                    </div>
                    <a href="/" className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
                        Go to Dashboard &rarr;
                    </a>
                </div>
            </div>

            <main className="max-w-5xl mx-auto px-4 py-12">
                {/* Overall Status Banner */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-xl p-6 text-white shadow-lg mb-12 flex items-center justify-between ${statusColor}`}
                >
                    <div className="flex items-center gap-4">
                        <Icon name="CheckCircleIcon" className="w-12 h-12 opacity-80" />
                        <div>
                            <h2 className="text-2xl font-bold">{overallStatus}</h2>
                            <p className="opacity-90 mt-1">Last updated: {lastUpdated.toLocaleTimeString()}</p>
                        </div>
                    </div>
                </motion.div>

                {/* Services Grid */}
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-sm mb-4">Current Service Status</h3>

                    {services.map((service, index) => (
                        <motion.div
                            key={service.name}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-white dark:bg-slate-800 rounded-lg p-5 shadow-sm border border-gray-100 dark:border-slate-700 flex items-center justify-between"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-gray-100 dark:bg-slate-700 rounded-lg">
                                    <Icon name={service.icon as any} className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-lg">{service.name}</h4>
                                    <span className="text-xs text-green-600 dark:text-green-400 font-mono bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded">
                                        {service.uptime} uptime
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`h-3 w-3 rounded-full ${service.status === 'operational' ? 'bg-green-500' :
                                        service.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
                                    }`} />
                                <span className={`font-medium capitalize ${service.status === 'operational' ? 'text-green-600 dark:text-green-400' :
                                        service.status === 'degraded' ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'
                                    }`}>
                                    {service.status}
                                </span>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Past Incidents (Mock) */}
                <div className="mt-16">
                    <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-sm mb-6">Past Incidents</h3>
                    <div className="space-y-8 pl-4 border-l-2 border-gray-200 dark:border-slate-700 ml-4">
                        <div className="relative">
                            <div className="absolute -left-[21px] top-0 h-4 w-4 rounded-full bg-gray-200 dark:bg-slate-600 border-2 border-white dark:border-slate-900"></div>
                            <h4 className="font-bold text-gray-900 dark:text-white">No incidents reported today.</h4>
                            <p className="text-gray-500 text-sm mt-1">{new Date().toLocaleDateString()}</p>
                        </div>
                        <div className="relative">
                            <div className="absolute -left-[21px] top-0 h-4 w-4 rounded-full bg-yellow-200 dark:bg-yellow-900 border-2 border-white dark:border-slate-900"></div>
                            <h4 className="font-bold text-gray-900 dark:text-white">Scheduled Maintenance</h4>
                            <p className="text-gray-500 text-sm mt-1">December 10, 2024</p>
                            <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm bg-gray-50 dark:bg-slate-800 p-3 rounded">
                                Completed routine database optimization and security patches.
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default PublicStatusPage;
