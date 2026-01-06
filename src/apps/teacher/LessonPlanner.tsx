import React, { useState, useEffect } from 'react';
import { Card, Button, Icon } from '../../components/shared/ui/CommonUI';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import pb from '../../lib/pocketbase';
import { sanitizeText, sanitizeHtml } from '../../utils/sanitization';
import { z } from 'zod';

// Lesson plan validation schema
const lessonPlanSchema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters').max(200),
    subject: z.string().min(1, 'Subject is required'),
    grade_level: z.string().min(1, 'Grade level is required'),
    duration: z.number().min(5, 'Duration must be at least 5 minutes').max(300),
    objectives: z.array(z.string().min(1)).min(1, 'At least one objective required'),
    materials: z.array(z.string().min(1)).min(1, 'At least one material required'),
    activities: z.array(z.string().min(1)).min(1, 'At least one activity required'),
    assessment: z.string().min(10, 'Assessment must be at least 10 characters'),
    notes: z.string().optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format')
});

interface LessonPlan {
    id?: string;
    title: string;
    subject: string;
    grade_level: string;
    duration: number; // in minutes
    objectives: string[];
    materials: string[];
    activities: string[];
    assessment: string;
    notes?: string;
    date: string;
}

export const LessonPlanner: React.FC = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingPlan, setEditingPlan] = useState<LessonPlan | null>(null);
    const [newPlan, setNewPlan] = useState<LessonPlan>({
        title: '',
        subject: '',
        grade_level: '',
        duration: 45,
        objectives: [''],
        materials: [''],
        activities: [''],
        assessment: '',
        date: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        loadLessonPlans();
    }, []);

    const loadLessonPlans = async () => {
        setLoading(true);
        try {
            const plans = await pb.collection('lesson_plans').getList(1, 50, {
                filter: `teacher = "${user?.id}"`,
                sort: '-date'
            });
            setLessonPlans(plans.items as any);
        } catch (error) {
            console.error('Failed to load lesson plans:', error);
        } finally {
            setLoading(false);
        }
    };

    const saveLessonPlan = async () => {
        try {
            // Sanitize inputs to prevent XSS
            const sanitizedPlan = {
                ...newPlan,
                title: sanitizeText(newPlan.title),
                subject: sanitizeText(newPlan.subject),
                grade_level: sanitizeText(newPlan.grade_level),
                objectives: newPlan.objectives.map(o => sanitizeText(o)),
                materials: newPlan.materials.map(m => sanitizeText(m)),
                activities: newPlan.activities.map(a => sanitizeText(a)),
                assessment: sanitizeHtml(newPlan.assessment, 'BASIC'),
                notes: newPlan.notes ? sanitizeHtml(newPlan.notes, 'BASIC') : undefined
            };

            // Validate with Zod
            const validationResult = lessonPlanSchema.safeParse(sanitizedPlan);
            if (!validationResult.success) {
                showToast(`Validation error: ${validationResult.error.issues[0].message}`, 'error');
                return;
            }

            const finalPlan = {
                ...sanitizedPlan,
                teacher: user?.id
            };

            if (editingPlan?.id) {
                await pb.collection('lesson_plans').update(editingPlan.id, finalPlan);
                showToast('Lesson plan updated!', 'success');
            } else {
                await pb.collection('lesson_plans').create(finalPlan);
                showToast('Lesson plan created!', 'success');
            }

            setShowCreateModal(false);
            setEditingPlan(null);
            resetForm();
            loadLessonPlans();
        } catch (error) {
            showToast('Failed to save lesson plan', 'error');
        }
    };

    const deletePlan = async (planId: string) => {
        if (confirm('Delete this lesson plan?')) {
            try {
                await pb.collection('lesson_plans').delete(planId);
                showToast('Lesson plan deleted', 'success');
                loadLessonPlans();
            } catch (error) {
                showToast('Failed to delete', 'error');
            }
        }
    };

    const resetForm = () => {
        setNewPlan({
            title: '',
            subject: '',
            grade_level: '',
            duration: 45,
            objectives: [''],
            materials: [''],
            activities: [''],
            assessment: '',
            date: new Date().toISOString().split('T')[0]
        });
    };

    const editPlan = (plan: LessonPlan) => {
        setEditingPlan(plan);
        setNewPlan(plan);
        setShowCreateModal(true);
    };

    const addListItem = (field: 'objectives' | 'materials' | 'activities') => {
        setNewPlan({
            ...newPlan,
            [field]: [...newPlan[field], '']
        });
    };

    const updateListItem = (field: 'objectives' | 'materials' | 'activities', index: number, value: string) => {
        const updated = [...newPlan[field]];
        updated[index] = value;
        setNewPlan({ ...newPlan, [field]: updated });
    };

    const removeListItem = (field: 'objectives' | 'materials' | 'activities', index: number) => {
        setNewPlan({
            ...newPlan,
            [field]: newPlan[field].filter((_, i) => i !== index)
        });
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
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white">Lesson Planner</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Create and manage your lesson plans</p>
                </div>
                <Button variant="primary" onClick={() => { resetForm(); setShowCreateModal(true); }}>
                    <Icon name="PlusIcon" className="w-5 h-5 mr-2" />
                    New Lesson Plan
                </Button>
            </div>

            {/* Lesson Plans List */}
            <div className="space-y-4">
                {lessonPlans.map(plan => (
                    <Card key={plan.id} className="p-6">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-4 mb-2">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{plan.title}</h3>
                                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-semibold">
                                        {plan.subject}
                                    </span>
                                    <span className="text-sm text-gray-500">Grade {plan.grade_level}</span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                    <div>
                                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Objectives:</p>
                                        <ul className="list-disc list-inside space-y-1">
                                            {plan.objectives.map((obj, i) => (
                                                <li key={i} className="text-sm text-gray-600 dark:text-gray-400">{obj}</li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div>
                                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Materials:</p>
                                        <ul className="list-disc list-inside space-y-1">
                                            {plan.materials.map((mat, i) => (
                                                <li key={i} className="text-sm text-gray-600 dark:text-gray-400">{mat}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Activities:</p>
                                    <ol className="list-decimal list-inside space-y-1">
                                        {plan.activities.map((act, i) => (
                                            <li key={i} className="text-sm text-gray-600 dark:text-gray-400">{act}</li>
                                        ))}
                                    </ol>
                                </div>

                                <div className="flex gap-4 mt-4 text-sm text-gray-500">
                                    <span>📅 {new Date(plan.date).toLocaleDateString()}</span>
                                    <span>⏱️ {plan.duration} minutes</span>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Button variant="ghost" size="sm" onClick={() => editPlan(plan)}>
                                    <Icon name="PencilIcon" className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => deletePlan(plan.id!)}>
                                    <Icon name="TrashIcon" className="w-4 h-4 text-red-500" />
                                </Button>
                            </div>
                        </div>
                    </Card>
                ))}

                {lessonPlans.length === 0 && (
                    <Card className="p-12 text-center">
                        <Icon name="DocumentTextIcon" className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Lesson Plans Yet</h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            Start planning your lessons to stay organized!
                        </p>
                        <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                            Create First Plan
                        </Button>
                    </Card>
                )}
            </div>

            {/* Create/Edit Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <Card className="max-w-4xl w-full p-6 my-8">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                            {editingPlan ? 'Edit Lesson Plan' : 'Create Lesson Plan'}
                        </h2>

                        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                            {/* Basic Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-2">Lesson Title</label>
                                    <input
                                        type="text"
                                        className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg"
                                        value={newPlan.title}
                                        onChange={(e) => setNewPlan({ ...newPlan, title: e.target.value })}
                                        placeholder="Introduction to Algebra"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold mb-2">Subject</label>
                                    <input
                                        type="text"
                                        className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg"
                                        value={newPlan.subject}
                                        onChange={(e) => setNewPlan({ ...newPlan, subject: e.target.value })}
                                        placeholder="Mathematics"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-2">Grade Level</label>
                                    <input
                                        type="text"
                                        className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg"
                                        value={newPlan.grade_level}
                                        onChange={(e) => setNewPlan({ ...newPlan, grade_level: e.target.value })}
                                        placeholder="9"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold mb-2">Duration (minutes)</label>
                                    <input
                                        type="number"
                                        className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg"
                                        value={newPlan.duration}
                                        onChange={(e) => setNewPlan({ ...newPlan, duration: parseInt(e.target.value) })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold mb-2">Date</label>
                                    <input
                                        type="date"
                                        className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg"
                                        value={newPlan.date}
                                        onChange={(e) => setNewPlan({ ...newPlan, date: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Objectives */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-semibold">Learning Objectives</label>
                                    <Button variant="ghost" size="sm" onClick={() => addListItem('objectives')}>
                                        <Icon name="PlusIcon" className="w-4 h-4" />
                                    </Button>
                                </div>
                                {newPlan.objectives.map((obj, index) => (
                                    <div key={index} className="flex gap-2 mb-2">
                                        <input
                                            type="text"
                                            className="flex-1 p-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg"
                                            value={obj}
                                            onChange={(e) => updateListItem('objectives', index, e.target.value)}
                                            placeholder="Students will be able to..."
                                        />
                                        {newPlan.objectives.length > 1 && (
                                            <Button variant="ghost" size="sm" onClick={() => removeListItem('objectives', index)}>
                                                <Icon name="XMarkIcon" className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Materials */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-semibold">Materials Needed</label>
                                    <Button variant="ghost" size="sm" onClick={() => addListItem('materials')}>
                                        <Icon name="PlusIcon" className="w-4 h-4" />
                                    </Button>
                                </div>
                                {newPlan.materials.map((mat, index) => (
                                    <div key={index} className="flex gap-2 mb-2">
                                        <input
                                            type="text"
                                            className="flex-1 p-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg"
                                            value={mat}
                                            onChange={(e) => updateListItem('materials', index, e.target.value)}
                                            placeholder="Whiteboard, markers, textbooks..."
                                        />
                                        {newPlan.materials.length > 1 && (
                                            <Button variant="ghost" size="sm" onClick={() => removeListItem('materials', index)}>
                                                <Icon name="XMarkIcon" className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Activities */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-semibold">Activities & Procedures</label>
                                    <Button variant="ghost" size="sm" onClick={() => addListItem('activities')}>
                                        <Icon name="PlusIcon" className="w-4 h-4" />
                                    </Button>
                                </div>
                                {newPlan.activities.map((act, index) => (
                                    <div key={index} className="flex gap-2 mb-2">
                                        <input
                                            type="text"
                                            className="flex-1 p-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg"
                                            value={act}
                                            onChange={(e) => updateListItem('activities', index, e.target.value)}
                                            placeholder="Activity description..."
                                        />
                                        {newPlan.activities.length > 1 && (
                                            <Button variant="ghost" size="sm" onClick={() => removeListItem('activities', index)}>
                                                <Icon name="XMarkIcon" className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Assessment */}
                            <div>
                                <label className="block text-sm font-semibold mb-2">Assessment</label>
                                <textarea
                                    className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg"
                                    rows={3}
                                    value={newPlan.assessment}
                                    onChange={(e) => setNewPlan({ ...newPlan, assessment: e.target.value })}
                                    placeholder="How will you assess student learning?"
                                />
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-sm font-semibold mb-2">Notes (Optional)</label>
                                <textarea
                                    className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg"
                                    rows={2}
                                    value={newPlan.notes || ''}
                                    onChange={(e) => setNewPlan({ ...newPlan, notes: e.target.value })}
                                    placeholder="Additional notes..."
                                />
                            </div>
                        </div>

                        <div className="flex gap-2 justify-end mt-6">
                            <Button variant="outline" onClick={() => { setShowCreateModal(false); setEditingPlan(null); }}>
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                onClick={saveLessonPlan}
                                disabled={!newPlan.title || !newPlan.subject}
                            >
                                {editingPlan ? 'Update' : 'Create'} Lesson Plan
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default LessonPlanner;
