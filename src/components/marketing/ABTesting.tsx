import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Icon, Badge, Modal, Input, Select } from '../shared/ui/CommonUI';
import { marketingService, ABTest, ABVariant } from '../../services/marketingService';
import { marketingExportService } from '../../services/marketingExportService';
import { useABTestsRealtime } from '../../hooks/useMarketingRealtime';

export const ABTesting: React.FC = () => {
    const [tests, setTests] = useState<ABTest[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [exportFormat, setExportFormat] = useState<'csv' | 'excel' | 'pdf' | null>(null);
    const [newTest, setNewTest] = useState({
        name: '',
        type: 'CTA' as ABTest['type'],
        goal: '',
        traffic_split: 50,
    });

    // Real-time subscription
    const { subscribe, unsubscribe, isSubscribed } = useABTestsRealtime({
        autoFetch: false,
        onCreate: (record) => setTests(prev => [record, ...prev]),
        onUpdate: (record) => setTests(prev => prev.map(t => t.id === record.id ? record : t)),
        onDelete: (record) => setTests(prev => prev.filter(t => t.id !== record.id)),
    });

    const fetchTests = useCallback(async () => {
        setLoading(true);
        const data = await marketingService.getABTests();
        setTests(data);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchTests();
        subscribe(); // Enable real-time updates
        return () => unsubscribe();
    }, [fetchTests, subscribe, unsubscribe]);

    const handleCreateTest = async () => {
        const variants: ABVariant[] = [
            { id: 'v1', name: 'Control', description: 'Original version', visitors: 0, conversions: 0, conversion_rate: 0, is_control: true },
            { id: 'v2', name: 'Variant A', description: 'Test version', visitors: 0, conversions: 0, conversion_rate: 0, is_control: false },
        ];
        await marketingService.createABTest({
            ...newTest,
            variants,
            status: 'Draft',
            start_date: new Date().toISOString(),
        });
        setIsModalOpen(false);
        setNewTest({ name: '', type: 'CTA', goal: '', traffic_split: 50 });
        fetchTests();
    };

    const handleStartTest = async (id: string) => {
        await marketingService.updateABTest(id, { status: 'Running', start_date: new Date().toISOString() });
        fetchTests();
    };

    const handlePauseTest = async (id: string) => {
        await marketingService.updateABTest(id, { status: 'Paused' });
        fetchTests();
    };

    const handleDeclareWinner = async (testId: string, variantId: string) => {
        await marketingService.declareWinner(testId, variantId);
        fetchTests();
    };

    const handleDeleteTest = async (id: string) => {
        if (!confirm('Delete this test?')) return;
        await marketingService.deleteABTest(id);
        fetchTests();
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Running': return 'success';
            case 'Paused': return 'warning';
            case 'Completed': return 'default';
            default: return 'neutral';
        }
    };

    const calculateLift = (control: ABVariant, variant: ABVariant) => {
        if (control.conversion_rate === 0) return 0;
        return ((variant.conversion_rate - control.conversion_rate) / control.conversion_rate * 100).toFixed(1);
    };

    const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
        switch (format) {
            case 'csv':
                marketingExportService.exportABTestsToCSV(tests);
                break;
            case 'excel':
                marketingExportService.exportABTestsToExcel(tests);
                break;
            case 'pdf':
                marketingExportService.exportABTestsToPDF(tests);
                break;
        }
        setExportFormat(null);
    };

    if (loading) {
        return <div className="flex items-center justify-center h-64"><Icon name="ArrowPathIcon" className="w-8 h-8 animate-spin text-gray-400" /></div>;
    }

    return (
        <div className="space-y-2 animate-fadeIn">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-sm font-bold text-gray-900 dark:text-white">A/B Testing</h2>
                    <p className="text-gray-500 text-[9px] mt-0.5 flex items-center gap-1">
                        Test variations and optimize conversions
                        {isSubscribed && (
                            <span className="flex items-center gap-1 text-green-500 text-xs">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                Live
                            </span>
                        )}
                    </p>
                </div>
                <div className="flex gap-2">
                    <div className="relative">
                        <Button variant="secondary" icon="ArrowDownTrayIcon" onClick={() => setExportFormat(exportFormat ? null : 'csv')}>
                            Export
                        </Button>
                        {exportFormat !== null && (
                            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                                <button onClick={() => handleExport('csv')} className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-sm">
                                    Export as CSV
                                </button>
                                <button onClick={() => handleExport('excel')} className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-sm">
                                    Export as Excel
                                </button>
                                <button onClick={() => handleExport('pdf')} className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-sm">
                                    Export as PDF
                                </button>
                            </div>
                        )}
                    </div>
                    <Button variant="primary" icon="BeakerIcon" onClick={() => setIsModalOpen(true)}>
                        New Experiment
                    </Button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                <Card className="p-2 bg-gradient-to-br from-purple-50 to-white dark:from-purple-900/20 dark:to-gray-800">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-purple-100 dark:bg-purple-800/30 rounded-lg flex items-center justify-center">
                            <Icon name="BeakerIcon" className="w-3 h-3 text-purple-600" />
                        </div>
                        <div>
                            <div className="text-base font-bold text-gray-900 dark:text-white">{tests.length}</div>
                            <div className="text-[8px] text-gray-500 uppercase font-medium">Total Tests</div>
                        </div>
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 dark:bg-green-800/30 rounded-lg flex items-center justify-center">
                            <Icon name="PlayIcon" className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">{tests.filter(t => t.status === 'Running').length}</div>
                            <div className="text-xs text-gray-500 uppercase font-medium">Running</div>
                        </div>
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-800/30 rounded-lg flex items-center justify-center">
                            <Icon name="CheckCircleIcon" className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">{tests.filter(t => t.status === 'Completed').length}</div>
                            <div className="text-xs text-gray-500 uppercase font-medium">Completed</div>
                        </div>
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-100 dark:bg-orange-800/30 rounded-lg flex items-center justify-center">
                            <Icon name="ArrowTrendingUpIcon" className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                +{tests.filter(t => t.winner_id).reduce((acc, t) => {
                                    const control = t.variants.find(v => v.is_control);
                                    const winner = t.variants.find(v => v.id === t.winner_id);
                                    if (control && winner) return acc + parseFloat(String(calculateLift(control, winner)));
                                    return acc;
                                }, 0).toFixed(1)}%
                            </div>
                            <div className="text-xs text-gray-500 uppercase font-medium">Avg Lift</div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Active Tests */}
            <div className="space-y-4">
                <h3 className="font-bold text-lg text-gray-800 dark:text-white">Active Experiments</h3>
                {tests.filter(t => t.status === 'Running' || t.status === 'Draft').length === 0 ? (
                    <Card className="p-8 text-center">
                        <Icon name="BeakerIcon" className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-gray-500">No active experiments. Create one to start testing.</p>
                    </Card>
                ) : (
                    tests.filter(t => t.status === 'Running' || t.status === 'Draft').map(test => (
                        <Card key={test.id} className="p-6 hover:shadow-lg transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${test.status === 'Running' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
                                        <Icon name={test.status === 'Running' ? 'PlayCircleIcon' : 'DocumentIcon'} className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 dark:text-white">{test.name}</h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Badge variant={getStatusColor(test.status)}>{test.status}</Badge>
                                            <span className="text-xs text-gray-500">{test.type}</span>
                                            <span className="text-xs text-gray-400">• Goal: {test.goal}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {test.status === 'Draft' && (
                                        <Button size="sm" variant="primary" icon="PlayIcon" onClick={() => handleStartTest(test.id)}>Start</Button>
                                    )}
                                    {test.status === 'Running' && (
                                        <Button size="sm" variant="secondary" icon="PauseIcon" onClick={() => handlePauseTest(test.id)}>Pause</Button>
                                    )}
                                    <Button size="sm" variant="ghost" icon="TrashIcon" onClick={() => handleDeleteTest(test.id)} />
                                </div>
                            </div>

                            {/* Variants */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                {test.variants.map((variant) => {
                                    const control = test.variants.find(v => v.is_control);
                                    const lift = control && !variant.is_control ? calculateLift(control, variant) : null;
                                    const isLeading = test.variants.every(v => variant.conversion_rate >= v.conversion_rate);

                                    return (
                                        <div key={variant.id} className={`p-4 rounded-xl border-2 ${isLeading && test.status === 'Running' ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20' : 'border-gray-100 dark:border-gray-700'}`}>
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-gray-900 dark:text-white">{variant.name}</span>
                                                        {variant.is_control && <Badge variant="neutral" size="sm">Control</Badge>}
                                                        {isLeading && test.status === 'Running' && <Badge variant="success" size="sm">Leading</Badge>}
                                                    </div>
                                                    <p className="text-xs text-gray-500 mt-1">{variant.description}</p>
                                                </div>
                                                {test.status === 'Running' && !variant.is_control && test.confidence_level >= 95 && (
                                                    <Button size="sm" variant="primary" onClick={() => handleDeclareWinner(test.id, variant.id)}>
                                                        Declare Winner
                                                    </Button>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-3 gap-4 mt-4">
                                                <div>
                                                    <div className="text-xl font-bold text-gray-900 dark:text-white">{variant.visitors.toLocaleString()}</div>
                                                    <div className="text-xs text-gray-500">Visitors</div>
                                                </div>
                                                <div>
                                                    <div className="text-xl font-bold text-gray-900 dark:text-white">{variant.conversions.toLocaleString()}</div>
                                                    <div className="text-xs text-gray-500">Conversions</div>
                                                </div>
                                                <div>
                                                    <div className="text-xl font-bold text-gray-900 dark:text-white">{variant.conversion_rate.toFixed(2)}%</div>
                                                    <div className="text-xs text-gray-500">Conv. Rate</div>
                                                </div>
                                            </div>

                                            {lift && (
                                                <div className={`mt-3 text-sm font-bold ${parseFloat(String(lift)) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    {parseFloat(String(lift)) > 0 ? '↑' : '↓'} {Math.abs(parseFloat(String(lift)))}% vs Control
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Confidence */}
                            {test.status === 'Running' && (
                                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-500">Statistical Confidence</span>
                                        <span className={`font-bold ${test.confidence_level >= 95 ? 'text-green-600' : 'text-orange-500'}`}>
                                            {test.confidence_level}%
                                        </span>
                                    </div>
                                    <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full mt-2 overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full transition-all ${test.confidence_level >= 95 ? 'bg-green-500' : 'bg-orange-500'}`}
                                            style={{ width: `${test.confidence_level}%` }}
                                        />
                                    </div>
                                    {test.confidence_level < 95 && (
                                        <p className="text-xs text-gray-400 mt-1">Need 95% confidence to declare a winner</p>
                                    )}
                                </div>
                            )}
                        </Card>
                    ))
                )}
            </div>

            {/* Completed Tests */}
            {tests.filter(t => t.status === 'Completed').length > 0 && (
                <div className="space-y-4">
                    <h3 className="font-bold text-lg text-gray-800 dark:text-white">Completed Tests</h3>
                    <Card className="overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Test Name</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Type</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Winner</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Lift</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Confidence</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {tests.filter(t => t.status === 'Completed').map(test => {
                                    const winner = test.variants.find(v => v.id === test.winner_id);
                                    const control = test.variants.find(v => v.is_control);
                                    const lift = control && winner ? calculateLift(control, winner) : '0';

                                    return (
                                        <tr key={test.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                            <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{test.name}</td>
                                            <td className="px-4 py-3 text-gray-500">{test.type}</td>
                                            <td className="px-4 py-3">
                                                <Badge variant="success">{winner?.name || 'N/A'}</Badge>
                                            </td>
                                            <td className="px-4 py-3 font-bold text-green-600">+{lift}%</td>
                                            <td className="px-4 py-3 text-gray-500">{test.confidence_level}%</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </Card>
                </div>
            )}

            {/* Create Test Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New A/B Test">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Test Name</label>
                        <Input 
                            value={newTest.name}
                            onChange={(e) => setNewTest({ ...newTest, name: e.target.value })}
                            placeholder="e.g., Homepage CTA Test"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Test Type</label>
                            <Select 
                                value={newTest.type}
                                onChange={(e) => setNewTest({ ...newTest, type: e.target.value as ABTest['type'] })}
                            >
                                <option value="Email">Email</option>
                                <option value="Landing Page">Landing Page</option>
                                <option value="CTA">CTA</option>
                                <option value="Price">Price</option>
                                <option value="Copy">Copy</option>
                            </Select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Traffic Split</label>
                            <Select 
                                value={newTest.traffic_split.toString()}
                                onChange={(e) => setNewTest({ ...newTest, traffic_split: parseInt(e.target.value) })}
                            >
                                <option value="50">50/50</option>
                                <option value="70">70/30</option>
                                <option value="80">80/20</option>
                                <option value="90">90/10</option>
                            </Select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Goal Metric</label>
                        <Input 
                            value={newTest.goal}
                            onChange={(e) => setNewTest({ ...newTest, goal: e.target.value })}
                            placeholder="e.g., Sign-ups, Click-through rate"
                        />
                    </div>
                    <div className="flex justify-end gap-2 mt-6">
                        <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button variant="primary" onClick={handleCreateTest} disabled={!newTest.name || !newTest.goal}>
                            Create Test
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

