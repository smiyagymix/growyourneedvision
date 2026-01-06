import React, { useState } from 'react';
import { Card, Icon, Badge, Button } from '../../components/shared/ui/CommonUI';
import {
    useFineTuningJobs,
    useFineTuningStats,
    useCreateFineTuningJob,
    useStartFineTuningJob,
    useCancelFineTuningJob,
    useDeleteFineTuningJob
} from '../../hooks/useAIFineTuning';
import { FineTuningJob } from '../../services/aiFineTuningService';

const AIFineTuningManager: React.FC = () => {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newJob, setNewJob] = useState({
        name: '',
        base_model: 'gpt-3.5-turbo',
        training_file: '',
        validation_file: '',
        epochs: 3,
        batch_size: 4,
        learning_rate: 0.0001
    });

    const { data: jobs, isLoading } = useFineTuningJobs();
    const { data: stats } = useFineTuningStats();
    const createJob = useCreateFineTuningJob();
    const startJob = useStartFineTuningJob();
    const cancelJob = useCancelFineTuningJob();
    const deleteJob = useDeleteFineTuningJob();

    const handleCreateJob = async () => {
        if (!newJob.name || !newJob.training_file) return;

        await createJob.mutateAsync({
            ...newJob,
            created_by: 'current_user' // Replace with actual user
        });

        setShowCreateModal(false);
        setNewJob({
            name: '',
            base_model: 'gpt-3.5-turbo',
            training_file: '',
            validation_file: '',
            epochs: 3,
            batch_size: 4,
            learning_rate: 0.0001
        });
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, 'default' | 'warning' | 'success' | 'danger'> = {
            pending: 'default',
            training: 'warning',
            completed: 'success',
            failed: 'danger',
            cancelled: 'default'
        };
        return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">AI Fine-Tuning Manager</h2>
                    <p className="text-sm text-gray-500 mt-1">Train custom AI models on your data</p>
                </div>
                <Button onClick={() => setShowCreateModal(true)}>
                    <Icon name="PlusIcon" className="w-5 h-5 mr-2" />
                    New Fine-Tuning Job
                </Button>
            </div>

            {/* Statistics */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="p-5 bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-gray-800">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                                <Icon name="CubeIcon" className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Total Jobs</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-5 bg-gradient-to-br from-green-50 to-white dark:from-green-900/20 dark:to-gray-800">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                                <Icon name="CheckCircleIcon" className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Completed</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {stats.by_status.completed || 0}
                                </p>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-5 bg-gradient-to-br from-orange-50 to-white dark:from-orange-900/20 dark:to-gray-800">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                                <Icon name="ClockIcon" className="w-6 h-6 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Training</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {stats.by_status.training || 0}
                                </p>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-5 bg-gradient-to-br from-purple-50 to-white dark:from-purple-900/20 dark:to-gray-800">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                                <Icon name="CurrencyDollarIcon" className="w-6 h-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Total Cost</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    ${stats.total_cost.toFixed(2)}
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* Jobs List */}
            <Card className="p-6">
                <h3 className="font-bold text-gray-900 dark:text-white mb-4">Fine-Tuning Jobs</h3>
                <div className="space-y-4">
                    {jobs && jobs.length > 0 ? (
                        jobs.map((job: FineTuningJob) => (
                            <div key={job.id} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <h4 className="font-bold text-gray-900 dark:text-white">{job.name}</h4>
                                        {getStatusBadge(job.status)}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {job.status === 'pending' && (
                                            <Button
                                                size="sm"
                                                onClick={() => startJob.mutate(job.id)}
                                                disabled={startJob.isPending}
                                            >
                                                <Icon name="PlayIcon" className="w-4 h-4 mr-1" />
                                                Start
                                            </Button>
                                        )}
                                        {job.status === 'training' && (
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                onClick={() => cancelJob.mutate(job.id)}
                                                disabled={cancelJob.isPending}
                                            >
                                                <Icon name="XMarkIcon" className="w-4 h-4 mr-1" />
                                                Cancel
                                            </Button>
                                        )}
                                        {(job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') && (
                                            <Button
                                                size="sm"
                                                variant="danger"
                                                onClick={() => {
                                                    if (confirm('Delete this job?')) {
                                                        deleteJob.mutate(job.id);
                                                    }
                                                }}
                                                disabled={deleteJob.isPending}
                                            >
                                                <Icon name="TrashIcon" className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
                                    <div>
                                        <p className="text-gray-600">Base Model</p>
                                        <p className="font-medium text-gray-900 dark:text-white">{job.base_model}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600">Epochs</p>
                                        <p className="font-medium text-gray-900 dark:text-white">{job.epochs}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600">Learning Rate</p>
                                        <p className="font-medium text-gray-900 dark:text-white">{job.learning_rate}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600">Cost</p>
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            ${job.cost?.toFixed(2) || '0.00'}
                                        </p>
                                    </div>
                                </div>

                                {job.status === 'training' && (
                                    <div>
                                        <div className="flex items-center justify-between text-sm mb-1">
                                            <span className="text-gray-600">Progress</span>
                                            <span className="font-medium text-gray-900 dark:text-white">
                                                {job.progress}%
                                            </span>
                                        </div>
                                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500"
                                                style={{ width: `${job.progress}%` }}
                                            />
                                        </div>
                                        {job.metrics && (
                                            <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                                                <div className="p-2 bg-white dark:bg-gray-900 rounded">
                                                    <p className="text-gray-600">Loss</p>
                                                    <p className="font-bold text-gray-900 dark:text-white">
                                                        {job.metrics.loss?.toFixed(3)}
                                                    </p>
                                                </div>
                                                <div className="p-2 bg-white dark:bg-gray-900 rounded">
                                                    <p className="text-gray-600">Accuracy</p>
                                                    <p className="font-bold text-gray-900 dark:text-white">
                                                        {(job.metrics.accuracy * 100)?.toFixed(1)}%
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {job.status === 'completed' && job.fine_tuned_model && (
                                    <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded border border-green-200">
                                        <p className="text-sm text-green-900 dark:text-green-100">
                                            <strong>Fine-tuned Model:</strong> {job.fine_tuned_model}
                                        </p>
                                    </div>
                                )}

                                {job.status === 'failed' && job.error_message && (
                                    <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200">
                                        <p className="text-sm text-red-900 dark:text-red-100">
                                            <strong>Error:</strong> {job.error_message}
                                        </p>
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <Icon name="CubeIcon" className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p>No fine-tuning jobs yet. Create one to get started!</p>
                        </div>
                    )}
                </div>
            </Card>

            {/* Create Job Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-2xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                Create Fine-Tuning Job
                            </h3>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <Icon name="XMarkIcon" className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Job Name *
                                </label>
                                <input
                                    type="text"
                                    value={newJob.name}
                                    onChange={(e) => setNewJob({ ...newJob, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                    placeholder="My Custom Model"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Base Model *
                                </label>
                                <select
                                    value={newJob.base_model}
                                    onChange={(e) => setNewJob({ ...newJob, base_model: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                >
                                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                                    <option value="gpt-4">GPT-4</option>
                                    <option value="davinci-002">Davinci 002</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Training File *
                                </label>
                                <input
                                    type="text"
                                    value={newJob.training_file}
                                    onChange={(e) => setNewJob({ ...newJob, training_file: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                    placeholder="file-abc123"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Validation File (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={newJob.validation_file}
                                    onChange={(e) => setNewJob({ ...newJob, validation_file: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                    placeholder="file-def456"
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Epochs
                                    </label>
                                    <input
                                        type="number"
                                        value={newJob.epochs}
                                        onChange={(e) => setNewJob({ ...newJob, epochs: parseInt(e.target.value) })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                        min="1"
                                        max="10"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Batch Size
                                    </label>
                                    <input
                                        type="number"
                                        value={newJob.batch_size}
                                        onChange={(e) => setNewJob({ ...newJob, batch_size: parseInt(e.target.value) })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                        min="1"
                                        max="32"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Learning Rate
                                    </label>
                                    <input
                                        type="number"
                                        value={newJob.learning_rate}
                                        onChange={(e) => setNewJob({ ...newJob, learning_rate: parseFloat(e.target.value) })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                        step="0.0001"
                                        min="0.0001"
                                        max="0.1"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 mt-6">
                            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleCreateJob}
                                disabled={!newJob.name || !newJob.training_file || createJob.isPending}
                            >
                                {createJob.isPending ? 'Creating...' : 'Create Job'}
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default AIFineTuningManager;
