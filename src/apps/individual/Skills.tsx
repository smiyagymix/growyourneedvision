import React, { useState, useEffect } from 'react';
import { WidgetErrorBoundary } from '../../components/shared/ui/WidgetErrorBoundary';
import { Card, Button, Icon } from '../../components/shared/ui/CommonUI';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import pb from '../../lib/pocketbase';
import { motion } from 'framer-motion';
import { z } from 'zod';
import { sanitizeText } from '../../utils/sanitization';

// Skill validation schema
const skillSchema = z.object({
    name: z.string().min(2, 'Skill name must be at least 2 characters').max(100),
    category: z.enum(['technical', 'soft-skills', 'language', 'creative', 'business']),
    proficiency: z.number().min(0, 'Proficiency must be 0-100').max(100),
    experience_years: z.number().min(0).max(50).optional(),
    certifications: z.array(z.string()).optional(),
    projects_used: z.array(z.string()).optional(),
    last_used: z.string().optional()
});

interface Skill {
    id?: string;
    name: string;
    category: 'technical' | 'soft-skills' | 'language' | 'creative' | 'business';
    proficiency: number; // 0-100
    experience_years?: number;
    certifications?: string[];
    projects_used?: string[];
    last_used?: string;
}

const SKILL_CATEGORIES = [
    { value: 'technical', label: 'Technical Skills', icon: 'CodeBracketIcon', color: 'blue' },
    { value: 'soft-skills', label: 'Soft Skills', icon: 'UserGroupIcon', color: 'purple' },
    { value: 'language', label: 'Languages', icon: 'LanguageIcon', color: 'green' },
    { value: 'creative', label: 'Creative', icon: 'PaintBrushIcon', color: 'pink' },
    { value: 'business', label: 'Business', icon: 'BriefcaseIcon', color: 'orange' }
];

export const Skills: React.FC = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [skills, setSkills] = useState<Skill[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [newSkill, setNewSkill] = useState<Skill>({
        name: '',
        category: 'technical',
        proficiency: 50,
        experience_years: 0
    });

    useEffect(() => {
        loadSkills();
    }, []);

    const loadSkills = async () => {
        setLoading(true);
        try {
            const skillsData = await pb.collection('skills').getList(1, 100, {
                filter: `user = "${user?.id}"`,
                sort: '-proficiency'
            });

            setSkills(skillsData.items as any);
        } catch (error) {
            console.error('Failed to load skills:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveSkill = async () => {
        try {
            // Sanitize inputs
            const sanitizedSkill = {
                ...newSkill,
                name: sanitizeText(newSkill.name)
            };

            // Validate with Zod
            const validationResult = skillSchema.safeParse(sanitizedSkill);
            if (!validationResult.success) {
                showToast(`Validation error: ${validationResult.error.issues[0].message}`, 'error');
                return;
            }

            if (editingId) {
                await pb.collection('skills').update(editingId, sanitizedSkill);
                showToast('Skill updated!', 'success');
            } else {
                await pb.collection('skills').create({
                    ...sanitizedSkill,
                    user: user?.id
                });
                showToast('Skill added!', 'success');
            }

            setShowAddModal(false);
            resetForm();
            loadSkills();
        } catch (error) {
            showToast(editingId ? 'Failed to update skill' : 'Failed to add skill', 'error');
        }
    };

    const handleEdit = (skill: Skill) => {
        setNewSkill({
            name: skill.name,
            category: skill.category,
            proficiency: skill.proficiency,
            experience_years: skill.experience_years || 0
        });
        setEditingId(skill.id!);
        setShowAddModal(true);
    };

    const updateProficiency = async (skillId: string, proficiency: number) => {
        try {
            await pb.collection('skills').update(skillId, { proficiency });
            loadSkills();
        } catch (error) {
            showToast('Failed to update proficiency', 'error');
        }
    };

    const deleteSkill = async (skillId: string) => {
        if (confirm('Remove this skill?')) {
            try {
                await pb.collection('skills').delete(skillId);
                showToast('Skill removed', 'success');
                loadSkills();
            } catch (error) {
                showToast('Failed to remove skill', 'error');
            }
        }
    };

    const resetForm = () => {
        setNewSkill({
            name: '',
            category: 'technical',
            proficiency: 50,
            experience_years: 0
        });
        setEditingId(null);
    };

    const getProficiencyLabel = (proficiency: number) => {
        if (proficiency >= 90) return 'Expert';
        if (proficiency >= 70) return 'Advanced';
        if (proficiency >= 50) return 'Intermediate';
        if (proficiency >= 30) return 'Beginner';
        return 'Novice';
    };

    const getProficiencyColor = (proficiency: number) => {
        if (proficiency >= 90) return 'text-green-600 dark:text-green-400';
        if (proficiency >= 70) return 'text-blue-600 dark:text-blue-400';
        if (proficiency >= 50) return 'text-yellow-600 dark:text-yellow-400';
        if (proficiency >= 30) return 'text-orange-600 dark:text-orange-400';
        return 'text-gray-600 dark:text-gray-400';
    };

    const getCategoryColor = (category: string) => {
        const cat = SKILL_CATEGORIES.find(c => c.value === category);
        return cat?.color || 'gray';
    };

    const filteredSkills = filterCategory === 'all'
        ? skills
        : skills.filter(s => s.category === filterCategory);

    // Calculate stats
    const stats = {
        total: skills.length,
        expert: skills.filter(s => s.proficiency >= 90).length,
        advanced: skills.filter(s => s.proficiency >= 70 && s.proficiency < 90).length,
        avgProficiency: skills.length > 0
            ? Math.round(skills.reduce((sum, s) => sum + s.proficiency, 0) / skills.length)
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
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white">Skills Inventory</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Track and showcase your abilities</p>
                </div>
                <Button variant="primary" onClick={() => { resetForm(); setShowAddModal(true); }}>
                    <Icon name="PlusIcon" className="w-5 h-5 mr-2" />
                    Add Skill
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="p-6">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Skills</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.total}</p>
                </Card>
                <Card className="p-6">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Expert Level</p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">{stats.expert}</p>
                </Card>
                <Card className="p-6">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Advanced</p>
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">{stats.advanced}</p>
                </Card>
                <Card className="p-6">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Avg Proficiency</p>
                    <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-2">{stats.avgProficiency}%</p>
                </Card>
            </div>

            {/* Category Filter */}
            <Card className="p-4">
                <div className="flex gap-2 overflow-x-auto">
                    <Button
                        variant={filterCategory === 'all' ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => setFilterCategory('all')}
                    >
                        All Skills
                    </Button>
                    {SKILL_CATEGORIES.map(cat => (
                        <Button
                            key={cat.value}
                            variant={filterCategory === cat.value ? 'primary' : 'outline'}
                            size="sm"
                            onClick={() => setFilterCategory(cat.value)}
                        >
                            <Icon name={cat.icon} className="w-4 h-4 mr-2" />
                            {cat.label}
                        </Button>
                    ))}
                </div>
            </Card>

            {/* Skills Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSkills.map(skill => {
                    const categoryInfo = SKILL_CATEGORIES.find(c => c.value === skill.category);

                    return (
                        <motion.div
                            key={skill.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                        >
                            <Card className="p-6 hover:shadow-xl transition-shadow">
                                <div className="flex items-start justify-between mb-4">
                                    <div className={`w-12 h-12 bg-${categoryInfo?.color}-100 dark:bg-${categoryInfo?.color}-900 rounded-lg flex items-center justify-center`}>
                                        <Icon name={categoryInfo?.icon || 'StarIcon'} className={`w-6 h-6 text-${categoryInfo?.color}-600`} />
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="ghost" size="sm" onClick={() => handleEdit(skill)}>
                                            <Icon name="PencilSquareIcon" className="w-4 h-4 text-gray-500" />
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => deleteSkill(skill.id!)}>
                                            <Icon name="TrashIcon" className="w-4 h-4 text-red-500" />
                                        </Button>
                                    </div>
                                </div>

                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{skill.name}</h3>

                                <div className="flex items-center gap-2 mb-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold bg-${categoryInfo?.color}-100 text-${categoryInfo?.color}-800 dark:bg-${categoryInfo?.color}-900 dark:text-${categoryInfo?.color}-200`}>
                                        {categoryInfo?.label}
                                    </span>
                                    {skill.experience_years && skill.experience_years > 0 && (
                                        <span className="text-xs text-gray-600 dark:text-gray-400">
                                            {skill.experience_years} {skill.experience_years === 1 ? 'year' : 'years'}
                                        </span>
                                    )}
                                </div>

                                {/* Proficiency */}
                                <div className="mb-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Proficiency</span>
                                        <span className={`text-sm font-bold ${getProficiencyColor(skill.proficiency)}`}>
                                            {getProficiencyLabel(skill.proficiency)} ({skill.proficiency}%)
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                                        <div
                                            className={`bg-gradient-to-r from-${categoryInfo?.color}-500 to-${categoryInfo?.color}-600 h-3 rounded-full transition-all`}
                                            style={{ width: `${skill.proficiency}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Proficiency Slider */}
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={skill.proficiency}
                                    onChange={(e) => updateProficiency(skill.id!, parseInt(e.target.value))}
                                    className="w-full"
                                />
                            </Card>
                        </motion.div>
                    );
                })}
            </div>

            {filteredSkills.length === 0 && (
                <Card className="p-12 text-center">
                    <Icon name="StarIcon" className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Skills Yet</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Start building your skills inventory!
                    </p>
                    <Button variant="primary" onClick={() => { resetForm(); setShowAddModal(true); }}>
                        Add First Skill
                    </Button>
                </Card>
            )}

            {/* Add/Edit Skill Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="max-w-md w-full p-6">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            {editingId ? 'Edit Skill' : 'Add New Skill'}
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold mb-2">Skill Name</label>
                                <input
                                    type="text"
                                    className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg"
                                    value={newSkill.name}
                                    onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                                    placeholder="React.js, Leadership, Spanish..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-2">Category</label>
                                <select
                                    className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg"
                                    value={newSkill.category}
                                    onChange={(e) => setNewSkill({ ...newSkill, category: e.target.value as any })}
                                >
                                    {SKILL_CATEGORIES.map(cat => (
                                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-2">
                                    Proficiency Level: {newSkill.proficiency}%
                                </label>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={newSkill.proficiency}
                                    onChange={(e) => setNewSkill({ ...newSkill, proficiency: parseInt(e.target.value) })}
                                    className="w-full"
                                />
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    {getProficiencyLabel(newSkill.proficiency)}
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-2">Years of Experience (Optional)</label>
                                <input
                                    type="number"
                                    min="0"
                                    className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg"
                                    value={newSkill.experience_years || ''}
                                    onChange={(e) => setNewSkill({ ...newSkill, experience_years: parseInt(e.target.value) || 0 })}
                                    placeholder="0"
                                />
                            </div>

                            <div className="flex gap-2 justify-end mt-6">
                                <Button variant="outline" onClick={() => { setShowAddModal(false); resetForm(); }}>
                                    Cancel
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={handleSaveSkill}
                                    disabled={!newSkill.name}
                                >
                                    {editingId ? 'Update Skill' : 'Add Skill'}
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default Skills;
