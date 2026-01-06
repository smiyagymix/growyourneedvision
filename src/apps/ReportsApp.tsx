import React, { useState } from 'react';
import { Icon, Card, Button, Badge } from '../components/shared/ui/CommonUI';
import { reportService } from '../services/reportService';

export const ReportsApp: React.FC = () => {
    const [activeTab, setActiveTab] = useState('Dashboard');
    const [schedules, setSchedules] = useState([
        { id: 1, name: 'Weekly Sales Report', frequency: 'Weekly', recipients: 'admin@school.com', lastRun: '2024-05-20' },
        { id: 2, name: 'Monthly Wellness Summary', frequency: 'Monthly', recipients: 'staff@school.com', lastRun: '2024-05-01' }
    ]);

    const renderDashboard = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
            <Card className="p-6">
                <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-4">System Overview</h3>
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Total Users</span>
                        <span className="font-bold text-xl">1,245</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                        <div className="bg-blue-500 h-full w-[75%]"></div>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Active Today</span>
                        <span className="font-bold text-xl">843</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                        <div className="bg-green-500 h-full w-[60%]"></div>
                    </div>
                </div>
            </Card>

            <Card className="p-6">
                <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-4">Revenue (YTD)</h3>
                <div className="flex items-end gap-2 mb-2">
                    <span className="text-3xl font-black text-gray-800 dark:text-white">$425,000</span>
                    <span className="text-green-500 font-bold text-sm mb-1">+12%</span>
                </div>
                <div className="h-32 flex items-end gap-2 mt-4">
                    {[40, 65, 50, 80, 60, 90].map((h, i) => (
                        <div key={i} className="flex-1 bg-blue-100 dark:bg-blue-900/30 rounded-t-sm relative group">
                            <div
                                className="absolute bottom-0 left-0 right-0 bg-blue-500 group-hover:bg-blue-400 transition-all rounded-t-sm"
                                style={{ height: `${h}%` }}
                            ></div>
                        </div>
                    ))}
                </div>
            </Card>

            <Card className="p-6">
                <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-4">Storage Usage</h3>
                <div className="flex justify-center py-4">
                    <div className="w-32 h-32 rounded-full border-8 border-gray-100 dark:border-gray-700 border-t-purple-500 border-r-purple-500 rotate-45 flex items-center justify-center">
                        <div className="-rotate-45 text-center">
                            <div className="text-xl font-black">45%</div>
                            <div className="text-xs text-gray-400">Used</div>
                        </div>
                    </div>
                </div>
                <div className="text-center text-sm text-gray-500">
                    450GB / 1TB Total
                </div>
            </Card>
        </div>
    );

    const renderScheduledReports = () => (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center">
                <h3 className="font-bold text-xl text-gray-800 dark:text-white">Scheduled Reports</h3>
                <Button variant="primary" icon="PlusCircle">Create Schedule</Button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 font-bold uppercase text-xs">
                        <tr>
                            <th className="px-6 py-4">Report Name</th>
                            <th className="px-6 py-4">Frequency</th>
                            <th className="px-6 py-4">Recipients</th>
                            <th className="px-6 py-4">Last Run</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {schedules.map(schedule => (
                            <tr key={schedule.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                <td className="px-6 py-4 font-bold text-gray-800 dark:text-white">{schedule.name}</td>
                                <td className="px-6 py-4">
                                    <Badge variant="neutral">{schedule.frequency}</Badge>
                                </td>
                                <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{schedule.recipients}</td>
                                <td className="px-6 py-4 text-gray-500">{schedule.lastRun}</td>
                                <td className="px-6 py-4 text-right">
                                    <button className="text-blue-600 hover:text-blue-500 font-bold text-xs mr-3">Edit</button>
                                    <button className="text-red-500 hover:text-red-400 font-bold text-xs">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    return (
        <div className="h-full flex flex-col gap-6 p-6 overflow-y-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black text-gray-800 dark:text-white">Reports & Analytics</h1>
                    <p className="text-gray-500 dark:text-gray-400">System-wide insights and reporting</p>
                </div>
                <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                    {['Dashboard', 'Scheduled Reports', 'History'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === tab
                                    ? 'bg-white dark:bg-gray-700 shadow text-blue-600 dark:text-white'
                                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {activeTab === 'Dashboard' && renderDashboard()}
            {activeTab === 'Scheduled Reports' && renderScheduledReports()}
            {activeTab === 'History' && (
                <div className="flex items-center justify-center h-64 text-gray-500 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                    <div className="text-center">
                        <Icon name="ClockIcon" className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No export history available yet.</p>
                    </div>
                </div>
            )}
        </div>
    );
};
