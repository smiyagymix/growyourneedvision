import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { Card, Button, Badge, Icon, Modal, EmptyState } from '../../components/shared/ui/CommonUI';
import { marketplaceService, MarketplaceApp } from '../../services/marketplaceService';
import pb from '../../lib/pocketbase';
import { useToast } from '../../hooks/useToast';
import { sanitizeText, sanitizeHtml } from '../../utils/sanitization';

const appSubmissionSchema = z.object({
  name: z.string().min(3, 'App name must be at least 3 characters').max(100, 'App name too long'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(500, 'Description too long'),
  category: z.string().min(1, 'Category is required'),
  price: z.string().min(1, 'Price is required'),
  icon: z.string().min(1, 'Icon is required'),
  developer: z.string().min(1, 'Developer ID is required')
});

export const DeveloperPortal: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const { addToast } = useToast();
    const [myApps, setMyApps] = useState<MarketplaceApp[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'apps' | 'analytics' | 'revenue'>('apps');
    
    // Submit App Modal State
    const [isSubmitOpen, setIsSubmitOpen] = useState(false);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('Marketing');
    const [price, setPrice] = useState('Free');
    const [iconName, setIconName] = useState('CubeIcon');

    useEffect(() => {
        fetchMyApps();
    }, []);

    const fetchMyApps = async () => {
        setLoading(true);
        try {
            const user = pb.authStore.model;
            if (user) {
                const apps = await marketplaceService.getDeveloperApps(user.id);
                setMyApps(apps);
            }
        } catch (error) {
            console.error('Error fetching developer apps:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        try {
            const user = pb.authStore.model;
            if (!user) {
                addToast('User not authenticated', 'error');
                return;
            }
            
            // Sanitize inputs
            const sanitized = {
                name: sanitizeText(name),
                description: sanitizeHtml(description, 'BASIC'),
                category: sanitizeText(category),
                price: sanitizeText(price),
                icon: iconName,
                developer: user.id
            };
            
            // Validate
            const result = appSubmissionSchema.safeParse(sanitized);
            if (!result.success) {
                addToast(`Validation error: ${result.error.issues[0].message}`, 'error');
                return;
            }
            
            await marketplaceService.createApp({
                ...result.data,
                verified: false,
                installs: 0,
                rating: 0
            });
            
            addToast('App submitted for review!', 'success');
            setIsSubmitOpen(false);
            
            // Reset form
            setName('');
            setDescription('');
            setCategory('Marketing');
            setPrice('Free');
            setIconName('CubeIcon');
            
            fetchMyApps();
        } catch (error) {
            console.error('Error submitting app:', error);
            addToast('Failed to submit app', 'error');
        }
    };

    const renderAppsTab = () => (
        <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <Card className="p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800">
                    <div className="text-blue-600 dark:text-blue-400 font-bold mb-1">Total Installs</div>
                    <div className="text-3xl font-black text-gray-800 dark:text-white">
                        {myApps.reduce((acc, app) => acc + (app.installs || 0), 0).toLocaleString()}
                    </div>
                </Card>
                <Card className="p-6 bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800">
                    <div className="text-green-600 dark:text-green-400 font-bold mb-1">Active Apps</div>
                    <div className="text-3xl font-black text-gray-800 dark:text-white">
                        {myApps.filter(a => a.verified).length}
                    </div>
                </Card>
                <Card className="p-6 bg-purple-50 dark:bg-purple-900/20 border-purple-100 dark:border-purple-800">
                    <div className="text-purple-600 dark:text-purple-400 font-bold mb-1">Pending Review</div>
                    <div className="text-3xl font-black text-gray-800 dark:text-white">
                        {myApps.filter(a => !a.verified).length}
                    </div>
                </Card>
            </div>

            <Card className="overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 font-bold text-gray-700 dark:text-slate-200 flex justify-between items-center">
                    <span>My Applications</span>
                    <Button size="sm" variant="secondary" icon="BarsArrowDownIcon">Filter</Button>
                </div>
                {loading ? (
                    <div className="p-8 text-center text-gray-500">Loading...</div>
                ) : myApps.length === 0 ? (
                    <EmptyState
                        title="No Apps Published"
                        description="You haven't submitted any apps yet. Create one to get started!"
                        icon="CodeBracketIcon"
                        className="py-12"
                    />
                ) : (
                    <div className="divide-y divide-gray-100 dark:divide-slate-700">
                        {myApps.map(app => (
                            <div key={app.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-gray-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                                        <Icon name={app.icon as any} className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-800 dark:text-white">{app.name}</h4>
                                        <div className="text-xs text-gray-500">{app.category} • {app.price} • v1.0.2</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right mr-4">
                                        <div className="text-sm font-bold text-gray-800 dark:text-white">{app.installs}</div>
                                        <div className="text-xs text-gray-500">Installs</div>
                                    </div>
                                    <Badge variant={app.verified ? 'success' : 'warning'}>
                                        {app.verified ? 'Live' : 'In Review'}
                                    </Badge>
                                    <Button variant="ghost" size="sm" icon="PencilIcon">Edit</Button>
                                    <Button variant="ghost" size="sm" icon="ArrowUpCircleIcon">Update</Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        </>
    );

    const renderAnalyticsTab = () => (
        <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white">Developer Analytics</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6">
                    <h4 className="font-bold mb-4">Install Growth (30 Days)</h4>
                    <div className="h-64 flex items-end justify-between gap-1">
                        {[45, 52, 49, 60, 65, 78, 85, 92, 90, 105, 110, 125, 120, 135, 142].map((h, i) => (
                            <div key={i} className="bg-blue-500 rounded-t-sm w-full hover:bg-blue-600 transition-colors relative group" style={{ height: `${h / 1.5}%` }}>
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">
                                    {h} Installs
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
                <Card className="p-6">
                    <h4 className="font-bold mb-4">Active Users by Region</h4>
                    <div className="space-y-4">
                        {[
                            { region: 'North America', count: 1240, percent: 45 },
                            { region: 'Europe', count: 850, percent: 30 },
                            { region: 'Asia Pacific', count: 420, percent: 15 },
                            { region: 'Other', count: 280, percent: 10 },
                        ].map((r, i) => (
                            <div key={i}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span>{r.region}</span>
                                    <span className="font-bold">{r.count}</span>
                                </div>
                                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                                    <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${r.percent}%` }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );

    const renderRevenueTab = () => (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">Revenue & Payouts</h3>
                <Button variant="outline" icon="BanknotesIcon">Payout Settings</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6 bg-gray-900 text-white">
                    <div className="text-gray-400 font-bold mb-1">Total Earnings</div>
                    <div className="text-4xl font-black mb-2">$12,450.00</div>
                    <div className="text-sm text-gray-400">Lifetime revenue before split</div>
                </Card>
                <Card className="p-6">
                    <div className="text-gray-500 font-bold mb-1">Next Payout</div>
                    <div className="text-4xl font-black text-green-600 mb-2">$1,240.50</div>
                    <div className="text-sm text-gray-400">Scheduled for Dec 15, 2024</div>
                </Card>
                <Card className="p-6 border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center text-center">
                    <div className="font-bold text-gray-500 mb-1">Revenue Share</div>
                    <div className="text-2xl font-black text-gray-800 dark:text-white mb-1">70% / 30%</div>
                    <div className="text-xs text-gray-400">You keep 70% of all sales</div>
                </Card>
            </div>

            <Card className="overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 font-bold">
                    Transaction History
                </div>
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs text-gray-500 uppercase">
                        <tr>
                            <th className="px-6 py-3">Date</th>
                            <th className="px-6 py-3">App</th>
                            <th className="px-6 py-3">Type</th>
                            <th className="px-6 py-3 text-right">Amount</th>
                            <th className="px-6 py-3 text-right">Your Share (70%)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                        {[
                            { date: 'Dec 10, 2024', app: 'Analytics Pro', type: 'Subscription', amount: 19.99 },
                            { date: 'Dec 09, 2024', app: 'Analytics Pro', type: 'Subscription', amount: 19.99 },
                            { date: 'Dec 09, 2024', app: 'Marketing Kit', type: 'Purchase', amount: 49.00 },
                            { date: 'Dec 08, 2024', app: 'Analytics Pro', type: 'Subscription', amount: 19.99 },
                        ].map((tx, i) => (
                            <tr key={i} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                                <td className="px-6 py-4 text-gray-500">{tx.date}</td>
                                <td className="px-6 py-4 font-bold">{tx.app}</td>
                                <td className="px-6 py-4"><Badge variant="neutral">{tx.type}</Badge></td>
                                <td className="px-6 py-4 text-right">${tx.amount}</td>
                                <td className="px-6 py-4 text-right font-bold text-green-600">+${(tx.amount * 0.7).toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>
        </div>
    );

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={onBack} icon="ArrowLeftIcon">Back to Marketplace</Button>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Developer Console</h2>
                        <p className="text-gray-500">Manage your published applications.</p>
                    </div>
                </div>
                <Button variant="primary" icon="PlusCircle" onClick={() => setIsSubmitOpen(true)} className="bg-[#002366] hover:bg-[#001a4d] text-white border-none shadow-md">
                    Submit New App
                </Button>
            </div>

            <div className="flex border-b border-gray-200 dark:border-gray-700">
                <button
                    className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'apps' ? 'border-[#002366] text-[#002366] dark:text-blue-400 dark:border-blue-400' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setActiveTab('apps')}
                >
                    My Apps
                </button>
                <button
                    className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'analytics' ? 'border-[#002366] text-[#002366] dark:text-blue-400 dark:border-blue-400' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setActiveTab('analytics')}
                >
                    Analytics
                </button>
                <button
                    className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'revenue' ? 'border-[#002366] text-[#002366] dark:text-blue-400 dark:border-blue-400' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setActiveTab('revenue')}
                >
                    Revenue
                </button>
            </div>

            {activeTab === 'apps' && renderAppsTab()}
            {activeTab === 'analytics' && renderAnalyticsTab()}
            {activeTab === 'revenue' && renderRevenueTab()}

            <Modal
                isOpen={isSubmitOpen}
                onClose={() => setIsSubmitOpen(false)}
                title="Submit New Application"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">App Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 dark:text-white"
                            placeholder="e.g. Analytics Pro"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 dark:text-white min-h-[100px]"
                            placeholder="Describe your application..."
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Category</label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 dark:text-white"
                            >
                                <option>Marketing</option>
                                <option>Finance</option>
                                <option>Productivity</option>
                                <option>Utilities</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Price</label>
                            <select
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 dark:text-white"
                            >
                                <option>Free</option>
                                <option>$4.99/mo</option>
                                <option>$9.99/mo</option>
                                <option>$19.99/mo</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Icon Name (HeroIcons)</label>
                        <input
                            type="text"
                            value={iconName}
                            onChange={(e) => setIconName(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 dark:text-white"
                            placeholder="e.g. CubeIcon"
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="ghost" onClick={() => setIsSubmitOpen(false)}>Cancel</Button>
                        <Button variant="primary" onClick={handleSubmit}>Submit for Review</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
