import React, { useState, useEffect } from 'react';
import { Card, Button, Icon, Badge, Modal, Input, Select } from '../shared/ui/CommonUI';
import { marketingService, Experiment } from '../../services/marketingService';
import { marketingExportService } from '../../services/marketingExportService';
import { useExperimentsRealtime } from '../../hooks/useMarketingRealtime';

interface Simulation {
    id: string;
    name: string;
    type: 'monte_carlo' | 'funnel' | 'pricing';
    iterations: number;
    status: 'pending' | 'running' | 'completed';
    results?: {
        mean: number;
        median: number;
        p5: number;
        p95: number;
        variance: number;
    };
}

export const ExperimentationLab: React.FC = () => {
    const [experiments, setExperiments] = useState<Experiment[]>([]);
    const [simulations, setSimulations] = useState<Simulation[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'experiments' | 'simulations' | 'flags'>('experiments');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showSimModal, setShowSimModal] = useState(false);
    const [selectedExperiment, setSelectedExperiment] = useState<Experiment | null>(null);
    const [showExportMenu, setShowExportMenu] = useState(false);

    // Real-time subscription
    const { subscribe, unsubscribe, isSubscribed } = useExperimentsRealtime({
        autoFetch: false,
        onCreate: (record) => setExperiments(prev => [record, ...prev]),
        onUpdate: (record) => {
            setExperiments(prev => prev.map(e => e.id === record.id ? record : e));
            if (selectedExperiment?.id === record.id) setSelectedExperiment(record);
        },
        onDelete: (record) => setExperiments(prev => prev.filter(e => e.id !== record.id)),
    });

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        type: 'Feature' as Experiment['type'],
        hypothesis: '',
        targetCohort: 'all',
        rolloutPercentage: 10,
        metrics: ['conversion_rate']
    });

    const [simFormData, setSimFormData] = useState({
        name: '',
        type: 'monte_carlo' as Simulation['type'],
        iterations: 10000
    });

    useEffect(() => {
        loadData();
        subscribe();
        return () => unsubscribe();
    }, []);

    const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
        switch (format) {
            case 'csv':
                marketingExportService.exportExperimentsToCSV(experiments);
                break;
            case 'excel':
                marketingExportService.exportExperimentsToExcel(experiments);
                break;
            case 'pdf':
                marketingExportService.exportExperimentsToPDF(experiments);
                break;
        }
        setShowExportMenu(false);
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const exps = await marketingService.getExperiments();
            setExperiments(exps);
            // Mock simulations for now
            setSimulations([
                { id: '1', name: 'Price Elasticity Test', type: 'pricing', iterations: 10000, status: 'completed', results: { mean: 12.5, median: 12.2, p5: 8.1, p95: 17.3, variance: 2.4 } },
                { id: '2', name: 'Checkout Funnel Sim', type: 'funnel', iterations: 5000, status: 'running' },
            ]);
        } catch (error) {
            console.error('Failed to load experiments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateExperiment = async () => {
        try {
            await marketingService.createExperiment({
                name: formData.name,
                hypothesis: formData.hypothesis,
                type: formData.type,
                status: 'Planning'
            } as Partial<Experiment>);
            setShowCreateModal(false);
            setFormData({ name: '', description: '', type: 'Feature', hypothesis: '', targetCohort: 'all', rolloutPercentage: 10, metrics: ['conversion_rate'] });
            loadData();
        } catch (error) {
            console.error('Failed to create experiment:', error);
        }
    };

    const handleStartExperiment = async (id: string) => {
        try {
            await marketingService.updateExperiment(id, { status: 'Running' });
            loadData();
        } catch (error) {
            console.error('Failed to start experiment:', error);
        }
    };

    const handleStopExperiment = async (id: string) => {
        try {
            await marketingService.stopExperiment(id);
            loadData();
        } catch (error) {
            console.error('Failed to stop experiment:', error);
        }
    };

    const handleDeleteExperiment = async (id: string) => {
        if (!confirm('Delete this experiment?')) return;
        try {
            await marketingService.deleteExperiment(id);
            loadData();
        } catch (error) {
            console.error('Failed to delete experiment:', error);
        }
    };

    const runSimulation = async () => {
        const newSim: Simulation = {
            id: Date.now().toString(),
            ...simFormData,
            status: 'running'
        };
        setSimulations(prev => [...prev, newSim]);
        setShowSimModal(false);
        
        // Simulate running
        setTimeout(() => {
            setSimulations(prev => prev.map(s => 
                s.id === newSim.id 
                    ? { ...s, status: 'completed', results: { mean: Math.random() * 20 + 5, median: Math.random() * 18 + 6, p5: Math.random() * 5 + 2, p95: Math.random() * 10 + 20, variance: Math.random() * 3 + 1 } }
                    : s
            ));
        }, 3000);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Running': case 'running': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
            case 'Completed': case 'completed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
            case 'Analyzing': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'Planning': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'Feature': return 'FlagIcon';
            case 'Price': return 'CurrencyDollarIcon';
            case 'Copy': return 'DocumentTextIcon';
            case 'Design': return 'PaintBrushIcon';
            case 'Flow': return 'MapIcon';
            default: return 'BeakerIcon';
        }
    };

    const stats = {
        total: experiments.length,
        running: experiments.filter(e => e.status === 'Running').length,
        avgUplift: experiments.filter(e => e.results).reduce((acc, e) => acc + (e.results?.confidence || 0), 0) / Math.max(experiments.filter(e => e.results).length, 1),
        simulations: simulations.length
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Hero Banner */}
            <div className="relative rounded-2xl overflow-hidden bg-gray-900 h-48 flex items-center justify-center text-center p-8">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                <div className="absolute inset-0 bg-gradient-to-tr from-purple-900 via-gray-900 to-blue-900 opacity-90"></div>
                <div className="relative z-10 max-w-2xl">
                    <div className="inline-flex items-center px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold border border-purple-500/50 mb-3">
                        <Icon name="BeakerIcon" className="w-3 h-3 mr-2" />
                        EXPERIMENTATION LAB
                    </div>
                    <h2 className="text-3xl font-black text-white mb-2">Test Ideas Safely</h2>
                    <p className="text-gray-300 text-sm">
                        Run experiments, simulations, and feature flags without affecting production
                    </p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-4 text-center">
                    <div className="text-3xl font-bold text-purple-600">{stats.total}</div>
                    <div className="text-sm text-gray-500">Total Experiments</div>
                </Card>
                <Card className="p-4 text-center">
                    <div className="text-3xl font-bold text-green-600">{stats.running}</div>
                    <div className="text-sm text-gray-500">Running Now</div>
                </Card>
                <Card className="p-4 text-center">
                    <div className="text-3xl font-bold text-blue-600">{stats.avgUplift.toFixed(1)}%</div>
                    <div className="text-sm text-gray-500">Avg Uplift</div>
                </Card>
                <Card className="p-4 text-center">
                    <div className="text-3xl font-bold text-orange-600">{stats.simulations}</div>
                    <div className="text-sm text-gray-500">Simulations</div>
                </Card>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
                {(['experiments', 'simulations', 'flags'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 font-medium capitalize transition-colors ${
                            activeTab === tab 
                                ? 'text-purple-600 border-b-2 border-purple-600' 
                                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                    >
                        {tab}
                    </button>
                ))}
                <div className="ml-auto flex gap-2 pb-2">
                    {activeTab === 'experiments' && (
                        <Button variant="primary" icon="PlusIcon" onClick={() => setShowCreateModal(true)}>
                            New Experiment
                        </Button>
                    )}
                    {activeTab === 'simulations' && (
                        <Button variant="primary" icon="PlayIcon" onClick={() => setShowSimModal(true)}>
                            Run Simulation
                        </Button>
                    )}
                </div>
            </div>

            {/* Experiments Tab */}
            {activeTab === 'experiments' && (
                <div className="space-y-4">
                    {experiments.length === 0 ? (
                        <Card className="p-12 text-center">
                            <Icon name="BeakerIcon" className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                            <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-2">No Experiments Yet</h3>
                            <p className="text-gray-500 mb-4">Create your first experiment to start testing</p>
                            <Button variant="primary" icon="PlusIcon" onClick={() => setShowCreateModal(true)}>
                                Create Experiment
                            </Button>
                        </Card>
                    ) : (
                        experiments.map(exp => (
                            <Card key={exp.id} className="p-6 hover:shadow-lg transition-shadow">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-4">
                                        <div className={`p-3 rounded-xl ${exp.status === 'Running' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-purple-100 dark:bg-purple-900/30'}`}>
                                            <Icon name={getTypeIcon(exp.type)} className={`w-6 h-6 ${exp.status === 'Running' ? 'text-green-600' : 'text-purple-600'}`} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg">{exp.name}</h3>
                                            <p className="text-sm text-gray-500 mt-1">{exp.hypothesis}</p>
                                            <div className="flex items-center gap-3 mt-3">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(exp.status)}`}>
                                                    {exp.status}
                                                </span>
                                                <span className="text-xs text-gray-400">
                                                    {exp.type} experiment • {exp.sample_size?.toLocaleString() || 0} target samples
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {exp.status === 'Planning' && (
                                            <Button variant="primary" size="sm" icon="PlayIcon" onClick={() => handleStartExperiment(exp.id)}>
                                                Start
                                            </Button>
                                        )}
                                        {exp.status === 'Running' && (
                                            <Button variant="secondary" size="sm" icon="StopIcon" onClick={() => handleStopExperiment(exp.id)}>
                                                Stop
                                            </Button>
                                        )}
                                        <Button variant="ghost" size="sm" icon="TrashIcon" onClick={() => handleDeleteExperiment(exp.id)} />
                                    </div>
                                </div>

                                {exp.results && (
                                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                                        <div className="grid grid-cols-3 gap-4">
                                            <div>
                                                <div className="text-xs text-gray-500">Sample Progress</div>
                                                <div className="text-lg font-bold">{exp.current_sample?.toLocaleString() || 0} / {exp.sample_size?.toLocaleString() || 0}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-gray-500">Confidence</div>
                                                <div className="text-lg font-bold text-green-600">{exp.results.confidence.toFixed(0)}%</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-gray-500">Recommendation</div>
                                                <div className="text-sm font-medium truncate">{exp.results.recommendation || 'Collecting data...'}</div>
                                            </div>
                                        </div>
                                        <div className="mt-3">
                                            <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full rounded-full ${exp.results.confidence >= 95 ? 'bg-green-500' : exp.results.confidence >= 80 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                                    style={{ width: `${exp.results.confidence}%` }}
                                                />
                                            </div>
                                            <div className="text-xs text-gray-400 mt-1">{exp.current_sample?.toLocaleString() || 0} samples collected</div>
                                        </div>
                                    </div>
                                )}
                            </Card>
                        ))
                    )}
                </div>
            )}

            {/* Simulations Tab */}
            {activeTab === 'simulations' && (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="p-6 border-l-4 border-l-purple-500">
                            <div className="flex items-center gap-3 mb-4">
                                <Icon name="ChartBarIcon" className="w-8 h-8 text-purple-500" />
                                <div>
                                    <h3 className="font-bold text-lg">Monte Carlo</h3>
                                    <p className="text-sm text-gray-500">Probabilistic outcome modeling</p>
                                </div>
                            </div>
                            <p className="text-gray-500 text-sm mb-4">Run thousands of random simulations to predict the range of possible outcomes for your changes.</p>
                            <Button variant="secondary" icon="PlayIcon" onClick={() => { setSimFormData({ ...simFormData, type: 'monte_carlo' }); setShowSimModal(true); }}>
                                New Monte Carlo
                            </Button>
                        </Card>

                        <Card className="p-6 border-l-4 border-l-blue-500">
                            <div className="flex items-center gap-3 mb-4">
                                <Icon name="FunnelIcon" className="w-8 h-8 text-blue-500" />
                                <div>
                                    <h3 className="font-bold text-lg">Funnel Simulation</h3>
                                    <p className="text-sm text-gray-500">Conversion flow modeling</p>
                                </div>
                            </div>
                            <p className="text-gray-500 text-sm mb-4">Simulate user flows through your conversion funnel and identify optimization opportunities.</p>
                            <Button variant="secondary" icon="PlayIcon" onClick={() => { setSimFormData({ ...simFormData, type: 'funnel' }); setShowSimModal(true); }}>
                                New Funnel Sim
                            </Button>
                        </Card>
                    </div>

                    <h4 className="font-bold mt-6">Simulation History</h4>
                    <div className="space-y-3">
                        {simulations.map(sim => (
                            <Card key={sim.id} className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Icon name={sim.type === 'monte_carlo' ? 'ChartBarIcon' : sim.type === 'funnel' ? 'FunnelIcon' : 'CurrencyDollarIcon'} className="w-5 h-5 text-gray-400" />
                                        <div>
                                            <div className="font-medium">{sim.name}</div>
                                            <div className="text-xs text-gray-500">{sim.iterations.toLocaleString()} iterations</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        {sim.status === 'running' && (
                                            <div className="flex items-center gap-2 text-green-600">
                                                <div className="animate-spin h-4 w-4 border-2 border-green-600 border-t-transparent rounded-full"></div>
                                                <span className="text-sm">Running...</span>
                                            </div>
                                        )}
                                        {sim.results && (
                                            <div className="text-right">
                                                <div className="text-sm font-bold">{sim.results.mean.toFixed(1)}%</div>
                                                <div className="text-xs text-gray-400">P5: {sim.results.p5.toFixed(1)}% — P95: {sim.results.p95.toFixed(1)}%</div>
                                            </div>
                                        )}
                                        <span className={`px-2 py-1 rounded text-xs ${getStatusColor(sim.status)}`}>
                                            {sim.status}
                                        </span>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* Feature Flags Tab */}
            {activeTab === 'flags' && (
                <div className="space-y-4">
                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold">Feature Flags</h3>
                            <Button variant="primary" icon="PlusIcon" size="sm">Add Flag</Button>
                        </div>
                        <div className="space-y-4">
                            {[
                                { name: 'new_checkout_flow', enabled: true, rollout: 25, description: 'Streamlined checkout experience' },
                                { name: 'ai_recommendations', enabled: true, rollout: 100, description: 'AI-powered product recommendations' },
                                { name: 'dark_mode_default', enabled: false, rollout: 0, description: 'Default to dark theme for new users' },
                                { name: 'live_chat_widget', enabled: true, rollout: 50, description: 'In-app customer support chat' },
                            ].map(flag => (
                                <div key={flag.name} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-full ${flag.enabled ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                        <div>
                                            <div className="font-mono text-sm font-medium">{flag.name}</div>
                                            <div className="text-xs text-gray-500">{flag.description}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <div className="text-sm font-bold">{flag.rollout}%</div>
                                            <div className="text-xs text-gray-400">rollout</div>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" checked={flag.enabled} className="sr-only peer" onChange={() => {}} />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
                                        </label>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            )}

            {/* Create Experiment Modal */}
            <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create Experiment" size="lg">
                <div className="space-y-4">
                    <Input
                        label="Experiment Name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., New Checkout Flow Test"
                    />
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Hypothesis</label>
                        <textarea
                            value={formData.hypothesis}
                            onChange={(e) => setFormData({ ...formData, hypothesis: e.target.value })}
                            placeholder="We believe that... will result in..."
                            rows={3}
                            className="w-full px-4 py-2.5 bg-white/80 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-gyn-blue-medium/20 focus:border-gyn-blue-medium transition-all shadow-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Select
                            label="Type"
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value as Experiment['type'] })}
                        >
                            <option value="Feature">Feature Flag</option>
                            <option value="Price">Price Test</option>
                            <option value="Copy">Copy Test</option>
                            <option value="Design">Design Test</option>
                            <option value="Flow">Flow Test</option>
                        </Select>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Sample Size</label>
                            <Input
                                type="number"
                                value={formData.rolloutPercentage * 100}
                                onChange={(e) => setFormData({ ...formData, rolloutPercentage: parseInt(e.target.value) / 100 })}
                                placeholder="10000"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="ghost" onClick={() => setShowCreateModal(false)}>Cancel</Button>
                        <Button variant="primary" onClick={handleCreateExperiment} disabled={!formData.name}>
                            Create Experiment
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Simulation Modal */}
            <Modal isOpen={showSimModal} onClose={() => setShowSimModal(false)} title="Run Simulation">
                <div className="space-y-4">
                    <Input
                        label="Simulation Name"
                        value={simFormData.name}
                        onChange={(e) => setSimFormData({ ...simFormData, name: e.target.value })}
                        placeholder="e.g., Q4 Pricing Test"
                    />
                    <Select
                        label="Simulation Type"
                        value={simFormData.type}
                        onChange={(e) => setSimFormData({ ...simFormData, type: e.target.value as Simulation['type'] })}
                    >
                        <option value="monte_carlo">Monte Carlo</option>
                        <option value="funnel">Funnel Analysis</option>
                        <option value="pricing">Price Elasticity</option>
                    </Select>
                    <div>
                        <label className="block text-sm font-medium mb-2">Iterations: {simFormData.iterations.toLocaleString()}</label>
                        <input
                            type="range"
                            min="1000"
                            max="100000"
                            step="1000"
                            value={simFormData.iterations}
                            onChange={(e) => setSimFormData({ ...simFormData, iterations: parseInt(e.target.value) })}
                            className="w-full"
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="ghost" onClick={() => setShowSimModal(false)}>Cancel</Button>
                        <Button variant="primary" onClick={runSimulation} disabled={!simFormData.name}>
                            Run Simulation
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
