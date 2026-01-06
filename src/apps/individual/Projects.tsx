import React, { useState, useEffect } from 'react';
import { WidgetErrorBoundary } from '../../components/shared/ui/WidgetErrorBoundary';
import { Card, Button, Icon } from '../../components/shared/ui/CommonUI';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import pb from '../../lib/pocketbase';
import { motion } from 'framer-motion';
import { z } from 'zod';
import { sanitizeText, sanitizeHtml } from '../../utils/sanitization';

// Project validation schema
const projectSchema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters').max(200),
    description: z.string().min(10, 'Description must be at least 10 characters').max(2000),
    category: z.string().min(1, 'Category is required'),
    status: z.enum(['planning', 'in-progress', 'completed', 'on-hold']),
    progress: z.number().min(0).max(100),
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format').optional().or(z.literal('')),
    tags: z.array(z.string()),
    links: z.array(z.string().url('Invalid URL')).optional()
});

interface Project {
    id?: string;
    title: string;
    description: string;
    category: string;
    status: 'planning' | 'in-progress' | 'completed' | 'on-hold';
    progress: number;
    start_date: string;
    end_date?: string;
    tags: string[];
    links?: string[];
}

export const Projects: React.FC = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newProject, setNewProject] = useState<Project>({
        title: '',
        description: '',
        category: 'web-development',
        status: 'planning',
        progress: 0,
        start_date: new Date().toISOString().split('T')[0],
        tags: []
    });

    useEffect(() => {
        loadProjects();
    }, [filter]);

    const loadProjects = async () => {
        setLoading(true);
        try {
            let filterQuery = `user = "${user?.id}"`;

            if (filter === 'active') {
                filterQuery += ' && (status = "in-progress" || status = "planning")';
            } else if (filter === 'completed') {
                filterQuery += ' && status = "completed"';
            }

            const projectsData = await pb.collection('projects').getList(1, 50, {
                filter: filterQuery,
                sort: '-created'
            });

            setProjects(projectsData.items as any);
        } catch (error) {
            console.error('Failed to load projects:', error);
        } finally {
            setLoading(false);
        }
    };

    const createProject = async () => {
        try {
            // Sanitize inputs
            const sanitizedProject = {
                ...newProject,
                title: sanitizeText(newProject.title),
                description: sanitizeHtml(newProject.description, 'BASIC'),
                category: sanitizeText(newProject.category)
            };

            // Validate with Zod
            const validationResult = projectSchema.safeParse(sanitizedProject);
            if (!validationResult.success) {
                showToast(`Validation error: ${validationResult.error.issues[0].message}`, 'error');
                return;
            }

            await pb.collection('projects').create({
                ...sanitizedProject,
                user: user?.id
            });

            showToast('Project created successfully!', 'success');
            setShowCreateModal(false);
            setNewProject({
                title: '',
                description: '',
                category: 'web-development',
                status: 'planning',
                progress: 0,
                start_date: new Date().toISOString().split('T')[0],
                tags: []
            });
            loadProjects();
        } catch (error) {
            showToast('Failed to create project', 'error');
        }
    };

    const updateProgress = async (projectId: string, progress: number) => {
        try {
            await pb.collection('projects').update(projectId, {
                progress,
                status: progress === 100 ? 'completed' : 'in-progress'
            });
            loadProjects();
            showToast('Progress updated!', 'success');
        } catch (error) {
            showToast('Failed to update progress', 'error');
        }
    };

    const deleteProject = async (projectId: string) => {
        if (confirm('Are you sure you want to delete this project?')) {
            try {
                await pb.collection('projects').delete(projectId);
                showToast('Project deleted', 'success');
                loadProjects();
            } catch (error) {
                showToast('Failed to delete project', 'error');
            }
        }
    };

    const getStatusColor = (status: Project['status']) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case 'in-progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
            case 'planning': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
            case 'on-hold': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
        }
    };

    const getCategoryIcon = (category: string) => {
        const icons: Record<string, string> = {
            'web-development': 'CodeBracketIcon',
            'mobile-app': 'DevicePhoneMobileIcon',
            'design': 'PaintBrushIcon',
            'data-science': 'ChartBarIcon',
            'other': 'FolderIcon'
        };
        return icons[category] || 'FolderIcon';
    };

    const stats = {
        total: projects.length,
        active: projects.filter(p => p.status === 'in-progress' || p.status === 'planning').length,
        completed: projects.filter(p => p.status === 'completed').length,
        avgProgress: projects.length > 0
            ? Math.round(projects.reduce((sum, p) => sum + p.progress, 0) / projects.length)
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
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white">My Projects</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your portfolio and track progress</p>
                </div>
                <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                    <Icon name="PlusIcon" className="w-5 h-5 mr-2" />
                    New Project
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="p-6">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Projects</p>
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

            {/* Projects Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map(project => (
                    <motion.div
                        key={project.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                    >
                        <Card className="p-6 hover:shadow-xl transition-shadow">
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                    <Icon name={getCategoryIcon(project.category)} className="w-6 h-6 text-white" />
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(project.status)}`}>
                                    {project.status.replace('-', ' ')}
                                </span>
                            </div>

                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{project.title}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                                {project.description}
                            </p>

                            {/* Progress Bar */}
                            <div className="mb-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Progress</span>
                                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{project.progress}%</span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                    <div
                                        className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all"
                                        style={{ width: `${project.progress}%` }}
                                    />
                                </div>
                            </div>

                            {/* Tags */}
                            {project.tags && project.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {project.tags.map(tag => (
                                        <span key={tag} className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-2">
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={project.progress}
                                    onChange={(e) => updateProgress(project.id!, parseInt(e.target.value))}
                                    className="flex-1"
                                />
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteProject(project.id!)}
                                >
                                    <Icon name="TrashIcon" className="w-4 h-4 text-red-500" />
                                </Button>
                            </div>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {projects.length === 0 && (
                <Card className="p-12 text-center">
                    <Icon name="FolderOpenIcon" className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Projects Yet</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Start building your portfolio by creating your first project!
                    </p>
                    <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                        Create Project
                    </Button>
                </Card>
            )}

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="max-w-2xl w-full p-6">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Create New Project</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold mb-2">Project Title</label>
                                <input
                                    type="text"
                                    className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg"
                                    value={newProject.title}
                                    onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                                    placeholder="E-commerce Website"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-2">Description</label>
                                <textarea
                                    className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg"
                                    rows={3}
                                    value={newProject.description}
                                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                                    placeholder="Full-stack e-commerce platform with React and Node.js"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-2">Category</label>
                                    <select
                                        className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg"
                                        value={newProject.category}
                                        onChange={(e) => setNewProject({ ...newProject, category: e.target.value })}
                                    >
                                        <option value="web-development">Web Development</option>
                                        <option value="mobile-app">Mobile App</option>
                                        <option value="design">Design</option>
                                        <option value="data-science">Data Science</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold mb-2">Status</label>
                                    <select
                                        className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg"
                                        value={newProject.status}
                                        onChange={(e) => setNewProject({ ...newProject, status: e.target.value as any })}
                                    >
                                        <option value="planning">Planning</option>
                                        <option value="in-progress">In Progress</option>
                                        <option value="on-hold">On Hold</option>
                                        <option value="completed">Completed</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-2">Start Date</label>
                                <input
                                    type="date"
                                    className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg"
                                    value={newProject.start_date}
                                    onChange={(e) => setNewProject({ ...newProject, start_date: e.target.value })}
                                />
                            </div>

                            <div className="flex gap-2 justify-end mt-6">
                                <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                                    Cancel
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={createProject}
                                    disabled={!newProject.title || !newProject.description}
                                >
                                    Create Project
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default Projects;
