import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Icon, Badge, Modal, Input, Skeleton } from '../shared/ui/CommonUI';
import { marketingService, Journey, JourneyStep } from '../../services/marketingService';
import { marketingExportService } from '../../services/marketingExportService';
import { useJourneysRealtime } from '../../hooks/useMarketingRealtime';

const STEP_ICONS: Record<JourneyStep['type'], string> = {
    Email: 'EnvelopeIcon',
    SMS: 'ChatBubbleLeftIcon',
    Wait: 'ClockIcon',
    Condition: 'AdjustmentsHorizontalIcon',
    Split: 'ShareIcon',
    Webhook: 'LinkIcon',
    Tag: 'TagIcon',
};

const STEP_COLORS: Record<JourneyStep['type'], string> = {
    Email: 'bg-purple-100 text-purple-600',
    SMS: 'bg-green-100 text-green-600',
    Wait: 'bg-orange-100 text-orange-600',
    Condition: 'bg-yellow-100 text-yellow-600',
    Split: 'bg-blue-100 text-blue-600',
    Webhook: 'bg-gray-100 text-gray-600',
    Tag: 'bg-pink-100 text-pink-600',
};

export const JourneyBuilder: React.FC = () => {
    const [journeys, setJourneys] = useState<Journey[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedJourney, setSelectedJourney] = useState<Journey | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showExportMenu, setShowExportMenu] = useState(false);

    // Form state
    const [newJourneyName, setNewJourneyName] = useState('');
    const [newJourneyDescription, setNewJourneyDescription] = useState('');
    const [saving, setSaving] = useState(false);

    // Real-time subscription
    const { subscribe, unsubscribe, isSubscribed } = useJourneysRealtime({
        autoFetch: false,
        onCreate: (record) => setJourneys(prev => [record, ...prev]),
        onUpdate: (record) => {
            setJourneys(prev => prev.map(j => j.id === record.id ? record : j));
            if (selectedJourney?.id === record.id) setSelectedJourney(record);
        },
        onDelete: (record) => {
            setJourneys(prev => prev.filter(j => j.id !== record.id));
            if (selectedJourney?.id === record.id) setSelectedJourney(null);
        },
    });

    const fetchJourneys = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await marketingService.getJourneys();
            setJourneys(data);
            if (data.length > 0 && !selectedJourney) {
                setSelectedJourney(data[0]);
            }
        } catch (err) {
            setError('Failed to load journeys');
            console.error('Journey fetch error:', err);
        } finally {
            setLoading(false);
        }
    }, [selectedJourney]);

    useEffect(() => {
        fetchJourneys();
        subscribe();
        return () => unsubscribe();
    }, []);

    const handleExport = (format: 'csv' | 'excel') => {
        if (format === 'csv') {
            marketingExportService.exportJourneysToCSV(journeys);
        } else {
            marketingExportService.exportJourneysToExcel(journeys);
        }
        setShowExportMenu(false);
    };

    const handleCreateJourney = async () => {
        if (!newJourneyName.trim()) return;
        setSaving(true);
        try {
            const newJourney = await marketingService.createJourney({
                name: newJourneyName,
                description: newJourneyDescription,
                trigger: { type: 'Event', conditions: {} },
                steps: [],
            });
            setJourneys([newJourney as Journey, ...journeys]);
            setSelectedJourney(newJourney as Journey);
            setShowCreateModal(false);
            setNewJourneyName('');
            setNewJourneyDescription('');
        } catch (err) {
            console.error('Failed to create journey:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleActivateJourney = async (journey: Journey) => {
        try {
            const updated = await marketingService.activateJourney(journey.id);
            setJourneys(journeys.map(j => j.id === journey.id ? { ...j, status: 'Active', start_date: (updated as Journey).start_date } : j));
            if (selectedJourney?.id === journey.id) {
                setSelectedJourney({ ...selectedJourney, status: 'Active' });
            }
        } catch (err) {
            console.error('Failed to activate journey:', err);
        }
    };

    const handlePauseJourney = async (journey: Journey) => {
        try {
            await marketingService.updateJourney(journey.id, { status: 'Paused' });
            setJourneys(journeys.map(j => j.id === journey.id ? { ...j, status: 'Paused' } : j));
            if (selectedJourney?.id === journey.id) {
                setSelectedJourney({ ...selectedJourney, status: 'Paused' });
            }
        } catch (err) {
            console.error('Failed to pause journey:', err);
        }
    };

    const handleDeleteJourney = async (id: string) => {
        if (!confirm('Are you sure you want to delete this journey?')) return;
        try {
            await marketingService.deleteJourney(id);
            const updatedJourneys = journeys.filter(j => j.id !== id);
            setJourneys(updatedJourneys);
            if (selectedJourney?.id === id) {
                setSelectedJourney(updatedJourneys.length > 0 ? updatedJourneys[0] : null);
            }
        } catch (err) {
            console.error('Failed to delete journey:', err);
        }
    };

    const getStatusVariant = (status: Journey['status']) => {
        switch (status) {
            case 'Active': return 'success';
            case 'Paused': return 'warning';
            case 'Draft': return 'default';
            case 'Completed': return 'primary';
            default: return 'neutral';
        }
    };

    const formatNumber = (num: number) => num.toLocaleString();

    const renderJourneyCanvas = (journey: Journey) => {
        if (!journey.steps || journey.steps.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <Icon name="PlusCircleIcon" className="w-16 h-16 mb-4" />
                    <p className="text-lg font-medium">No steps defined</p>
                    <p className="text-sm">Add steps to build your journey</p>
                </div>
            );
        }

        return (
            <div className="flex flex-col items-center max-w-lg mx-auto space-y-4 py-8">
                {/* Trigger */}
                <div className="w-72 p-2 bg-blue-100 dark:bg-blue-900 border-2 border-blue-500 rounded-xl shadow-lg flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center">
                        <Icon name="BoltIcon" className="w-4 h-4" />
                    </div>
                    <div>
                        <div className="font-bold text-blue-900 dark:text-white">Trigger: {journey.trigger.type}</div>
                        <div className="text-xs text-blue-700 dark:text-blue-300">
                            {String(journey.trigger.conditions.event || journey.trigger.conditions.segment || 'Any source')}
                        </div>
                    </div>
                </div>

                {journey.steps.map((step, index) => (
                    <React.Fragment key={step.id}>
                        <div className="h-6 w-0.5 bg-gray-300 dark:bg-gray-600"></div>
                        <div className="w-72 p-2 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-xl shadow-md flex items-center gap-2 hover:shadow-lg transition-shadow cursor-pointer">
                            <div className={`w-6 h-6 rounded-full ${STEP_COLORS[step.type]} flex items-center justify-center`}>
                                <Icon name={STEP_ICONS[step.type] as any} className="w-4 h-4" />
                            </div>
                            <div className="flex-1">
                                <div className="font-bold text-gray-900 dark:text-white">{step.type}</div>
                                <div className="text-xs text-gray-500">
                                    {step.type === 'Wait' && String(step.config.duration || '')}
                                    {step.type === 'Email' && `Template: ${String(step.config.template || 'N/A')}`}
                                    {step.type === 'SMS' && `Template: ${String(step.config.template || 'N/A')}`}
                                    {step.type === 'Tag' && `Tag: ${String(step.config.tag || 'N/A')}`}
                                    {step.type === 'Condition' && `If: ${String(step.config.condition || 'N/A')}`}
                                    {step.type === 'Split' && `${String(step.config.ratio || 50)}% split`}
                                </div>
                            </div>
                            {step.next_steps && step.next_steps.length > 1 && (
                                <Badge variant="neutral" size="sm">{step.next_steps.length} paths</Badge>
                            )}
                        </div>
                    </React.Fragment>
                ))}
            </div>
        );
    };

    if (error) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <Icon name="ExclamationCircleIcon" className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">{error}</p>
                    <Button variant="primary" onClick={fetchJourneys} className="mt-4">Retry</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center">
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">Journey Builder</h2>
                <Button variant="primary" icon="PlusIcon" onClick={() => setShowCreateModal(true)}>New Journey</Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-2">
                {/* Journey List */}
                <Card className="p-2">
                    <h3 className="font-bold text-sm mb-2">Journeys</h3>
                    {loading ? (
                        <div className="space-y-3">
                            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
                        </div>
                    ) : journeys.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <p className="text-sm">No journeys yet</p>
                            <Button variant="primary" size="sm" className="mt-2" onClick={() => setShowCreateModal(true)}>Create one</Button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {journeys.map(journey => (
                                <div
                                    key={journey.id}
                                    onClick={() => setSelectedJourney(journey)}
                                    className={`p-3 rounded-lg cursor-pointer transition-all ${
                                        selectedJourney?.id === journey.id
                                            ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500'
                                            : 'bg-gray-50 dark:bg-gray-800 border-2 border-transparent hover:border-gray-200 dark:hover:border-gray-700'
                                    }`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-bold text-sm text-gray-900 dark:text-white">{journey.name}</span>
                                        <Badge variant={getStatusVariant(journey.status)} size="sm">{journey.status}</Badge>
                                    </div>
                                    <div className="text-xs text-gray-500 mb-2 line-clamp-1">{journey.description}</div>
                                    <div className="flex gap-3 text-xs text-gray-400">
                                        <span>{journey.steps.length} steps</span>
                                        <span>{formatNumber(journey.enrolled_count)} enrolled</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>

                {/* Canvas & Details */}
                <div className="lg:col-span-3 space-y-6">
                    {selectedJourney ? (
                        <>
                            {/* Journey Stats */}
                            <div className="grid grid-cols-4 gap-4">
                                <Card className="p-4 text-center">
                                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatNumber(selectedJourney.enrolled_count)}</div>
                                    <div className="text-xs text-gray-500">Enrolled</div>
                                </Card>
                                <Card className="p-4 text-center">
                                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatNumber(selectedJourney.completed_count)}</div>
                                    <div className="text-xs text-gray-500">Completed</div>
                                </Card>
                                <Card className="p-4 text-center">
                                    <div className="text-2xl font-bold text-green-600">{selectedJourney.conversion_rate}%</div>
                                    <div className="text-xs text-gray-500">Conversion</div>
                                </Card>
                                <Card className="p-4 text-center">
                                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{selectedJourney.steps.length}</div>
                                    <div className="text-xs text-gray-500">Steps</div>
                                </Card>
                            </div>

                            {/* Canvas */}
                            <div className="h-[500px] bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden relative">
                                {/* Background Grid */}
                                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#9ca3af 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

                                {/* Canvas Content */}
                                <div className="relative h-full overflow-auto p-4">
                                    {renderJourneyCanvas(selectedJourney)}
                                </div>

                                {/* Action Buttons */}
                                <div className="absolute bottom-4 right-4 flex gap-2">
                                    {selectedJourney.status === 'Draft' && (
                                        <Button variant="primary" icon="PlayIcon" onClick={() => handleActivateJourney(selectedJourney)}>
                                            Activate
                                        </Button>
                                    )}
                                    {selectedJourney.status === 'Active' && (
                                        <Button variant="secondary" icon="PauseIcon" onClick={() => handlePauseJourney(selectedJourney)}>
                                            Pause
                                        </Button>
                                    )}
                                    {selectedJourney.status === 'Paused' && (
                                        <Button variant="primary" icon="PlayIcon" onClick={() => handleActivateJourney(selectedJourney)}>
                                            Resume
                                        </Button>
                                    )}
                                    <Button variant="danger" icon="TrashIcon" onClick={() => handleDeleteJourney(selectedJourney.id)}>
                                        Delete
                                    </Button>
                                </div>

                                {/* Journey Info */}
                                <div className="absolute top-4 left-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 max-w-xs">
                                    <h4 className="font-bold text-gray-900 dark:text-white">{selectedJourney.name}</h4>
                                    <p className="text-xs text-gray-500 mt-1">{selectedJourney.description}</p>
                                    {selectedJourney.start_date && (
                                        <p className="text-xs text-gray-400 mt-2">
                                            Started: {new Date(selectedJourney.start_date).toLocaleDateString()}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <Card className="h-[600px] flex items-center justify-center">
                            <div className="text-center text-gray-400">
                                <Icon name="CursorArrowRaysIcon" className="w-16 h-16 mx-auto mb-4" />
                                <p className="text-lg">Select a journey to view details</p>
                            </div>
                        </Card>
                    )}
                </div>
            </div>

            {/* Create Journey Modal */}
            <Modal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                title="Create New Journey"
            >
                <div className="space-y-4">
                    <Input
                        label="Journey Name"
                        value={newJourneyName}
                        onChange={(e) => setNewJourneyName(e.target.value)}
                        placeholder="e.g., Welcome Series"
                    />
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                        <textarea
                            value={newJourneyDescription}
                            onChange={(e) => setNewJourneyDescription(e.target.value)}
                            placeholder="What is this journey for?"
                            className="w-full h-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="secondary" onClick={() => setShowCreateModal(false)}>Cancel</Button>
                        <Button variant="primary" onClick={handleCreateJourney} disabled={saving || !newJourneyName.trim()}>
                            {saving ? 'Creating...' : 'Create Journey'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
