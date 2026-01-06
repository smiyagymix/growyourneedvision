import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Icon, Badge, Select } from '../shared/ui/CommonUI';
import { marketingService, Attribution } from '../../services/marketingService';
import { useMarketingRealtime } from '../../hooks/useMarketingRealtime';

type AttributionModel = 'Last Touch' | 'First Touch' | 'Linear' | 'Time Decay' | 'Position Based';

export const AttributionAnalyzer: React.FC = () => {
    const [attributions, setAttributions] = useState<Attribution[]>([]);
    const [summary, setSummary] = useState({
        totalConversions: 0,
        totalRevenue: 0,
        totalCost: 0,
        avgROAS: 0,
        topChannel: 'N/A',
        channelBreakdown: [] as { channel: string; conversions: number; revenue: number; percentage: number }[],
    });
    const [selectedModel, setSelectedModel] = useState<AttributionModel>('Last Touch');
    const [loading, setLoading] = useState(true);

    // Real-time subscription for attribution data
    const { subscribe, unsubscribe, isSubscribed } = useMarketingRealtime<Attribution>('attribution', {
        autoFetch: false,
        onCreate: (record) => setAttributions(prev => [...prev, record]),
        onUpdate: (record) => setAttributions(prev => prev.map(a => a.id === record.id ? record : a)),
    });

    const fetchData = useCallback(async () => {
        setLoading(true);
        const [attrData, summaryData] = await Promise.all([
            marketingService.getAttributionData(selectedModel),
            marketingService.getAttributionSummary(),
        ]);
        setAttributions(attrData);
        setSummary(summaryData);
        setLoading(false);
    }, [selectedModel]);

    useEffect(() => {
        fetchData();
        subscribe();
        return () => unsubscribe();
    }, [selectedModel, fetchData, subscribe, unsubscribe]);

    const getROASColor = (roas: number) => {
        if (roas >= 10) return 'text-green-600';
        if (roas >= 5) return 'text-blue-600';
        if (roas >= 2) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getChannelIcon = (channel: string) => {
        const c = channel.toLowerCase();
        if (c.includes('email')) return 'EnvelopeIcon';
        if (c.includes('social') || c.includes('linkedin') || c.includes('facebook')) return 'ShareIcon';
        if (c.includes('organic') || c.includes('search')) return 'MagnifyingGlassIcon';
        if (c.includes('display') || c.includes('ad')) return 'PhotoIcon';
        if (c.includes('direct')) return 'LinkIcon';
        return 'GlobeAltIcon';
    };

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                    <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Attribution Analytics</h2>
                    <p className="text-gray-500 text-sm mt-1">Understand which channels drive conversions</p>
                </div>
                <Button variant="secondary" icon="ArrowDownTrayIcon">Export Report</Button>
            </div>

            {/* Model Selector & Summary */}
            <Card className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600">
                            <Icon name="PresentationChartLineIcon" className="w-8 h-8" />
                        </div>
                        <div>
                            <label className="text-sm text-gray-500 block mb-1">Attribution Model</label>
                            <Select 
                                value={selectedModel}
                                onChange={(e) => setSelectedModel(e.target.value as AttributionModel)}
                                className="font-bold text-lg"
                            >
                                <option value="Last Touch">Last Touch</option>
                                <option value="First Touch">First Touch</option>
                                <option value="Linear">Linear (Multi-Touch)</option>
                                <option value="Time Decay">Time Decay</option>
                                <option value="Position Based">Position Based (U-Shaped)</option>
                            </Select>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">{summary.totalConversions.toLocaleString()}</div>
                            <div className="text-xs text-gray-500 uppercase">Conversions</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">${(summary.totalRevenue / 1000).toFixed(0)}K</div>
                            <div className="text-xs text-gray-500 uppercase">Revenue</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">${(summary.totalCost / 1000).toFixed(1)}K</div>
                            <div className="text-xs text-gray-500 uppercase">Ad Spend</div>
                        </div>
                        <div className="text-center">
                            <div className={`text-2xl font-bold ${getROASColor(summary.avgROAS)}`}>{summary.avgROAS.toFixed(1)}x</div>
                            <div className="text-xs text-gray-500 uppercase">Avg ROAS</div>
                        </div>
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Channel Performance Table */}
                <Card className="overflow-hidden">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                        <h3 className="font-bold text-gray-800 dark:text-white">Channel Performance</h3>
                    </div>
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {attributions.map((attr) => (
                            <div key={attr.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                            <Icon name={getChannelIcon(attr.channel)} className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-900 dark:text-white">{attr.channel}</div>
                                            <div className="text-xs text-gray-500">{attr.campaign_name}</div>
                                        </div>
                                    </div>
                                    <div className={`text-xl font-bold ${getROASColor(attr.roas)}`}>
                                        {attr.roas.toFixed(1)}x
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-4 mt-3 text-center text-sm">
                                    <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                        <div className="font-bold text-gray-900 dark:text-white">{attr.conversions}</div>
                                        <div className="text-xs text-gray-500">Conv.</div>
                                    </div>
                                    <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                        <div className="font-bold text-green-600">${(attr.revenue / 1000).toFixed(1)}K</div>
                                        <div className="text-xs text-gray-500">Revenue</div>
                                    </div>
                                    <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                        <div className="font-bold text-gray-900 dark:text-white">${(attr.cost / 1000).toFixed(1)}K</div>
                                        <div className="text-xs text-gray-500">Cost</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Channel Breakdown & Touchpoints */}
                <div className="space-y-6">
                    {/* Channel Breakdown Chart */}
                    <Card className="p-6">
                        <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-4">Revenue by Channel</h3>
                        <div className="space-y-4">
                            {summary.channelBreakdown.map((channel, i) => (
                                <div key={i}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="font-bold text-gray-700 dark:text-gray-200">{channel.channel}</span>
                                        <span className="text-gray-500">
                                            <strong className="text-gray-900 dark:text-white">{channel.percentage}%</strong> (${(channel.revenue / 1000).toFixed(0)}K)
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-3">
                                        <div 
                                            className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500" 
                                            style={{ width: `${channel.percentage}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Sample Touchpoint Journey */}
                    <Card className="p-6">
                        <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-4">Top Conversion Paths</h3>
                        <div className="space-y-4">
                            {attributions.slice(0, 3).map((attr, i) => (
                                <div key={i} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {attr.touchpoints?.map((tp, j) => (
                                            <React.Fragment key={j}>
                                                <Badge variant="neutral" className="flex items-center gap-1">
                                                    <Icon name={getChannelIcon(tp.channel)} className="w-3 h-3" />
                                                    {tp.channel}
                                                    <span className="text-xs opacity-60">({Math.round(tp.credit * 100)}%)</span>
                                                </Badge>
                                                {j < attr.touchpoints.length - 1 && (
                                                    <Icon name="ArrowRightIcon" className="w-3 h-3 text-gray-400" />
                                                )}
                                            </React.Fragment>
                                        ))}
                                    </div>
                                    <div className="mt-2 text-xs text-gray-500">
                                        {attr.conversions} conversions • ${attr.revenue.toLocaleString()} revenue
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>

            {/* Model Comparison Info */}
            <Card className="p-6 bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800">
                <div className="flex items-start gap-4">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <Icon name="InformationCircleIcon" className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <h4 className="font-bold text-blue-900 dark:text-blue-100 mb-1">About {selectedModel} Attribution</h4>
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                            {selectedModel === 'Last Touch' && 'Assigns 100% credit to the final touchpoint before conversion. Best for understanding closing channels.'}
                            {selectedModel === 'First Touch' && 'Assigns 100% credit to the first touchpoint. Best for understanding awareness channels.'}
                            {selectedModel === 'Linear' && 'Distributes credit equally across all touchpoints. Best for understanding the full journey.'}
                            {selectedModel === 'Time Decay' && 'Gives more credit to touchpoints closer to conversion. Balances awareness and closing.'}
                            {selectedModel === 'Position Based' && 'Gives 40% to first and last touch, 20% distributed among middle. Balanced approach.'}
                        </p>
                    </div>
                </div>
            </Card>
        </div>
    );
};

