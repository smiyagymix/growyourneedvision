import React, { useState, useEffect } from 'react';
import { WidgetErrorBoundary } from '../../components/shared/ui/WidgetErrorBoundary';
import { Card, Button, Icon } from '../../components/shared/ui/CommonUI';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import pb from '../../lib/pocketbase';
import { sanitizeText, sanitizeHtml } from '../../utils/sanitization';
import { goalSchema } from '../../validation/schemas';
import { motion } from 'framer-motion';

interface Goal {
    id?: string;
    title: string;
    description: string;
    category: 'learning' | 'career' | 'personal' | 'fitness' | 'financial';
    target_date: string;
    progress: number;
    status: 'active' | 'completed' | 'paused';
    milestones: string[];
}

export const Goals: React.FC = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [goals, setGoals] = useState<Goal[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [newGoal, setNewGoal] = useState<Goal>({
        title: '',
        description: '',
        category: 'learning',
        target_date: '',
        progress: 0,
        status: 'active',
        milestones: ['']
    });

    useEffect(() => {
        loadGoals();
    }, [filter]);

    const loadGoals = async () => {
        setLoading(true);
        try {
            let filterQuery = `user = "${user?.id}"`;

            if (filter !== 'all') {
                filterQuery += ` && status = "${filter}"`;
            }

            const goalsData = await pb.collection('goals').getList(1, 50, {
                filter: filterQuery,
                sort: '-created'
            });

            setGoals(goalsData.items as any);
        } catch (error) {
            console.error('Failed to load goals:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveGoal = async () => {
        try {
            // Sanitize inputs to prevent XSS
            const sanitizedGoal = {
                ...newGoal,
                title: sanitizeText(newGoal.title),
                description: sanitizeHtml(newGoal.description, 'BASIC')
            };

            // Validate with Zod
            const validationResult = goalSchema.safeParse({
                userId: user?.id,
                ...sanitizedGoal
            });

            if (!validationResult.success) {
                showToast(`Validation error: ${validationResult.error.issues[0].message}`, 'error');
                return;
            }

            if (editingId) {
                await pb.collection('goals').update(editingId, sanitizedGoal);
                showToast('Goal updated successfully!', 'success');
            } else {
                await pb.collection('goals').create({
                    ...sanitizedGoal,
                    user: user?.id
                });
                showToast('Goal created successfully!', 'success');
            }

            setShowCreateModal(false);
            resetForm();
            loadGoals();
        } catch (error) {
            showToast(editingId ? 'Failed to update goal' : 'Failed to create goal', 'error');
        }
    };

    const handleEdit = (goal: Goal) => {
        setNewGoal({
            title: goal.title,
            description: goal.description,
            category: goal.category,
            target_date: goal.target_date.split('T')[0], // Format for input date
            progress: goal.progress,
            status: goal.status,
            milestones: goal.milestones && goal.milestones.length > 0 ? goal.milestones : ['']
        });
        setEditingId(goal.id!);
        setShowCreateModal(true);
    };

    const updateProgress = async (goalId: string, progress: number) => {
        try {
            await pb.collection('goals').update(goalId, {
                progress,
                status: progress === 100 ? 'completed' : 'active'
            });
            loadGoals();
            if (progress === 100) {
                showToast('Goal completed! 🎉', 'success');
            }
        } catch (error) {
            showToast('Failed to update progress', 'error');
        }
    };

    const deleteGoal = async (goalId: string) => {
        if (confirm('Delete this goal?')) {
            try {
                await pb.collection('goals').delete(goalId);
                showToast('Goal deleted', 'success');
                loadGoals();
            } catch (error) {
                showToast('Failed to delete goal', 'error');
            }
        }
    };

    const resetForm = () => {
        setNewGoal({
            title: '',
            description: '',
            category: 'learning',
            target_date: '',
            progress: 0,
            status: 'active',
            milestones: ['']
        });
        setEditingId(null);
    };

    const addMilestone = () => {
        setNewGoal({
            ...newGoal,
            milestones: [...newGoal.milestones, '']
        });
    };

    const updateMilestone = (index: number, value: string) => {
        const updated = [...newGoal.milestones];
        updated[index] = value;
        setNewGoal({ ...newGoal, milestones: updated });
    };

    const removeMilestone = (index: number) => {
        setNewGoal({
            ...newGoal,
            milestones: newGoal.milestones.filter((_, i) => i !== index)
        });
    };

    const getCategoryIcon = (category: string) => {
        const icons: Record<string, string> = {
            learning: 'AcademicCapIcon',
            career: 'BriefcaseIcon',
            personal: 'UserIcon',
            fitness: 'HeartIcon',
            financial: 'CurrencyDollarIcon'
        };
        return icons[category] || 'FlagIcon';
    };

    const getCategoryColor = (category: string) => {
        const colors: Record<string, string> = {
            learning: 'from-blue-500 to-blue-600',
            career: 'from-purple-500 to-purple-600',
            personal: 'from-green-500 to-green-600',
            fitness: 'from-red-500 to-red-600',
            financial: 'from-yellow-500 to-yellow-600'
        };
        return colors[category] || 'from-gray-500 to-gray-600';
    };

    const stats = {
        total: goals.length,
        active: goals.filter(g => g.status === 'active').length,
        completed: goals.filter(g => g.status === 'completed').length,
        avgProgress: goals.length > 0
            ? Math.round(goals.reduce((sum, g) => sum + g.progress, 0) / goals.length)
            : 0
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Icon name="ArrowPathIcon" className="w-8 h-8 text-gray-400 animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white">My Goals</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Set and track your personal goals</p>
                </div>
                <Button variant="primary" onClick={() => { resetForm(); setShowCreateModal(true); }}>
                    <Icon name="PlusIcon" className="w-5 h-5 mr-2" />
                    New Goal
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="p-6">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Goals</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.total}</p>
                </Card>
                <Card className="p-6">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Active</p>
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">{stats.active}</p>
                </Card>
                <Card className="p-6">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">{stats.completed}</p>
                </Card>
                <Card className="p-6">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Avg Progress</p>
                    <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-2">{stats.avgProgress}%</p>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex gap-2">
                {(['all', 'active', 'completed'] as const).map(f => (
                    <Button
                        key={f}
                        variant={filter === f ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => setFilter(f)}
                    >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                    </Button>
                ))}
            </div>

            {/* Goals Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {goals.map(goal => (
                    <motion.div
                        key={goal.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <Card className="p-6 hover:shadow-xl transition-shadow">
                            <div className="flex items-start justify-between mb-4">
                                <div className={`w-12 h-12 bg-gradient-to-br ${getCategoryColor(goal.category)} rounded-lg flex items-center justify-center`}>
                                    <Icon name={getCategoryIcon(goal.category)} className="w-6 h-6 text-white" />
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="ghost" size="sm" onClick={() => handleEdit(goal)}>
                                        <Icon name="PencilSquareIcon" className="w-4 h-4 text-gray-500" />
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => deleteGoal(goal.id!)}>
                                        <Icon name="TrashIcon" className="w-4 h-4 text-red-500" />
                                    </Button>
                                </div>
                            </div>

                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{goal.title}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{goal.description}</p>

                            {/* Progress */}
                            <div className="mb-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Progress</span>
                                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{goal.progress}%</span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                                    <div
                                        className={`bg-gradient-to-r ${getCategoryColor(goal.category)} h-3 rounded-full transition-all`}
                                        style={{ width: `${goal.progress}%` }}
                                    />
                                </div>
                            </div>

                            {/* Target Date */}
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                                <Icon name="CalendarIcon" className="w-4 h-4" />
                                Target: {new Date(goal.target_date).toLocaleDateString()}
                            </div>

                            {/* Progress Slider */}
                            <div className="flex items-center gap-4">
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={goal.progress}
                                    onChange={(e) => updateProgress(goal.id!, parseInt(e.target.value))}
                                    className="flex-1"
                                />
                                {goal.progress === 100 && (
                                    <span className="text-2xl">🎉</span>
                                )}
                            </div>

                            {/* Milestones */}
                            {goal.milestones && goal.milestones.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Milestones:</p>
                                    <ul className="space-y-1">
                                        {goal.milestones.filter(m => m).map((milestone, i) => (
                                            <li key={i} className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                                <Icon name="CheckCircleIcon" className="w-3 h-3" />
                                                {milestone}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </Card>
                    </motion.div>
                ))}
            </div>

            {goals.length === 0 && (
                <Card className="p-12 text-center">
                    <Icon name="FlagIcon" className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Goals Yet</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Start achieving your dreams by setting your first goal!
                    </p>
                    <Button variant="primary" onClick={() => { resetForm(); setShowCreateModal(true); }}>
                        Create Goal
                    </Button>
                </Card>
            )}

            {/* Create/Edit Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            {editingId ? 'Edit Goal' : 'Create New Goal'}
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold mb-2">Goal Title</label>
                                <input
                                    type="text"
                                    className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg"
                                    value={newGoal.title}
                                    onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                                    placeholder="Master Full-Stack Development"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-2">Description</label>
                                <textarea
                                    className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg"
                                    rows={3}
                                    value={newGoal.description}
                                    onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                                    placeholder="Become proficient in React, Node.js, and databases"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-2">Category</label>
                                    <select
                                        className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg"
                                        value={newGoal.category}
                                        onChange={(e) => setNewGoal({ ...newGoal, category: e.target.value as any })}
                                    >
                                        <option value="learning">Learning</option>
                                        <option value="career">Career</option>
                                        <option value="personal">Personal</option>
                                        <option value="fitness">Fitness</option>
                                        <option value="financial">Financial</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold mb-2">Target Date</label>
                                    <input
                                        type="date"
                                        className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg"
                                        value={newGoal.target_date}
                                        onChange={(e) => setNewGoal({ ...newGoal, target_date: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-semibold">Milestones</label>
                                    <Button variant="ghost" size="sm" onClick={addMilestone}>
                                        <Icon name="PlusIcon" className="w-4 h-4" />
                                    </Button>
                                </div>
                                {newGoal.milestones.map((milestone, index) => (
                                    <div key={index} className="flex gap-2 mb-2">
                                        <input
                                            type="text"
                                            className="flex-1 p-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg"
                                            value={milestone}
                                            onChange={(e) => updateMilestone(index, e.target.value)}
                                            placeholder="Milestone description"
                                        />
                                        {newGoal.milestones.length > 1 && (
                                            <Button variant="ghost" size="sm" onClick={() => removeMilestone(index)}>
                                                <Icon name="XMarkIcon" className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="flex gap-2 justify-end mt-6">
                                <Button variant="outline" onClick={() => { setShowCreateModal(false); resetForm(); }}>
                                    Cancel
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={handleSaveGoal}
                                    disabled={!newGoal.title || !newGoal.target_date}
                                >
                                    {editingId ? 'Update Goal' : 'Create Goal'}
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default Goals;
