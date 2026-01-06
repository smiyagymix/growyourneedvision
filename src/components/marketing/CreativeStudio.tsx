import { useState, useEffect } from 'react';
import { marketingService, CreativeProject } from '../../services/marketingService';
import { Card, Button, Icon, Badge, Modal, Input, Select, Skeleton } from '../shared/ui/CommonUI';

type ProjectFormData = {
    name: string;
    type: CreativeProject['type'];
    dimensions: { width: number; height: number };
};

const templateCategories: { name: CreativeProject['type']; icon: string; dimensions: { width: number; height: number } }[] = [
    { name: 'Social Post', icon: 'PhotoIcon', dimensions: { width: 1080, height: 1080 } },
    { name: 'Story', icon: 'DevicePhoneMobileIcon', dimensions: { width: 1080, height: 1920 } },
    { name: 'Ad Banner', icon: 'RectangleGroupIcon', dimensions: { width: 728, height: 90 } },
    { name: 'Email Header', icon: 'EnvelopeIcon', dimensions: { width: 600, height: 200 } },
    { name: 'Blog Cover', icon: 'DocumentTextIcon', dimensions: { width: 1200, height: 630 } },
    { name: 'Presentation', icon: 'PresentationChartBarIcon', dimensions: { width: 1920, height: 1080 } },
];

const initialFormData: ProjectFormData = {
    name: '',
    type: 'Social Post',
    dimensions: { width: 1080, height: 1080 },
};

export const CreativeStudio: React.FC = () => {
    const [projects, setProjects] = useState<CreativeProject[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<CreativeProject | null>(null);
    const [formData, setFormData] = useState<ProjectFormData>(initialFormData);
    const [saving, setSaving] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<CreativeProject['type'] | 'All'>('All');

    useEffect(() => {
        loadProjects();
    }, []);

    const loadProjects = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await marketingService.getCreativeProjects();
            setProjects(data);
        } catch (err) {
            setError('Failed to load creative projects');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (project?: CreativeProject) => {
        if (project) {
            setEditingProject(project);
            setFormData({
                name: project.name,
                type: project.type,
                dimensions: project.dimensions,
            });
        } else {
            setEditingProject(null);
            setFormData(initialFormData);
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingProject(null);
        setFormData(initialFormData);
    };

    const handleSave = async () => {
        if (!formData.name.trim()) return;

        try {
            setSaving(true);
            if (editingProject) {
                await marketingService.updateCreativeProject(editingProject.id, formData);
            } else {
                await marketingService.createCreativeProject({
                    ...formData,
                    canvas_data: {},
                    last_edited: new Date().toISOString(),
                });
            }
            await loadProjects();
            handleCloseModal();
        } catch (err) {
            console.error('Failed to save project:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this project?')) return;
        try {
            await marketingService.deleteCreativeProject(id);
            await loadProjects();
        } catch (err) {
            console.error('Failed to delete project:', err);
        }
    };

    const handleTypeChange = (type: CreativeProject['type']) => {
        const template = templateCategories.find(t => t.name === type);
        setFormData({
            ...formData,
            type,
            dimensions: template?.dimensions || { width: 1080, height: 1080 },
        });
    };

    const handleCategorySelect = (category: CreativeProject['type']) => {
        setSelectedCategory(category);
        // Also pre-fill the form with this category for quick creation
        const template = templateCategories.find(t => t.name === category);
        if (template) {
            setFormData({
                name: '',
                type: category,
                dimensions: template.dimensions,
            });
        }
    };

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHours / 24);
        
        if (diffHours < 1) return 'Just now';
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    const getTypeColor = (type: CreativeProject['type']) => {
        switch (type) {
            case 'Social Post': return 'bg-blue-500';
            case 'Story': return 'bg-purple-500';
            case 'Ad Banner': return 'bg-green-500';
            case 'Email Header': return 'bg-orange-500';
            case 'Blog Cover': return 'bg-pink-500';
            case 'Presentation': return 'bg-indigo-500';
            default: return 'bg-gray-500';
        }
    };

    const filteredProjects = selectedCategory === 'All' 
        ? projects 
        : projects.filter(p => p.type === selectedCategory);

    if (loading) {
        return (
            <div className="space-y-6 h-full flex flex-col">
                <div className="flex justify-between items-center">
                    <Skeleton className="h-8 w-48" />
                    <div className="flex gap-2">
                        <Skeleton className="h-10 w-32" />
                        <Skeleton className="h-10 w-32" />
                    </div>
                </div>
                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-6 min-h-[500px]">
                    <Skeleton className="h-full rounded-2xl" />
                    <div className="md:col-span-3 grid grid-cols-2 md:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <Skeleton key={i} className="aspect-[4/3] rounded-2xl" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Creative Studio</h2>
                <div className="flex gap-2">
                    <Button variant="secondary" icon="CloudArrowUpIcon">Upload Asset</Button>
                    <Button variant="primary" icon="PlusIcon" onClick={() => handleOpenModal()}>New Design</Button>
                </div>
            </div>

            {error && (
                <Card className="p-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                    <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
                        <Icon name="ExclamationCircleIcon" className="w-5 h-5" />
                        <span>{error}</span>
                        <Button variant="ghost" size="sm" onClick={loadProjects}>Retry</Button>
                    </div>
                </Card>
            )}

            <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-6 min-h-[500px]">
                {/* Templates Sidebar */}
                <Card className="md:col-span-1 p-4 flex flex-col">
                    <h3 className="font-bold text-sm text-gray-500 uppercase mb-4">Templates</h3>
                    <div className="space-y-2 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        <div
                            onClick={() => setSelectedCategory('All')}
                            className={`p-3 rounded-lg cursor-pointer text-sm font-medium flex justify-between items-center group transition-colors ${
                                selectedCategory === 'All' 
                                    ? 'bg-gyn-blue-medium/10 text-gyn-blue-dark dark:text-gyn-blue-light' 
                                    : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                <Icon name="Squares2X2Icon" className="w-4 h-4" />
                                <span>All Projects</span>
                            </div>
                            <Badge variant="neutral">{projects.length}</Badge>
                        </div>
                        {templateCategories.map((cat) => {
                            const count = projects.filter(p => p.type === cat.name).length;
                            return (
                                <div
                                    key={cat.name}
                                    onClick={() => handleCategorySelect(cat.name)}
                                    className={`p-3 rounded-lg cursor-pointer text-sm font-medium flex justify-between items-center group transition-colors ${
                                        selectedCategory === cat.name 
                                            ? 'bg-gyn-blue-medium/10 text-gyn-blue-dark dark:text-gyn-blue-light' 
                                            : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                                    }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <Icon name={cat.icon} className="w-4 h-4" />
                                        <span>{cat.name}</span>
                                    </div>
                                    {count > 0 && <Badge variant="neutral">{count}</Badge>}
                                </div>
                            );
                        })}
                    </div>
                    <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="text-xs text-gray-500 mb-2">Quick Stats</div>
                        <div className="grid grid-cols-2 gap-2 text-center">
                            <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <div className="text-lg font-bold text-gray-800 dark:text-white">{projects.length}</div>
                                <div className="text-xs text-gray-500">Projects</div>
                            </div>
                            <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <div className="text-lg font-bold text-gray-800 dark:text-white">
                                    {new Set(projects.map(p => p.type)).size}
                                </div>
                                <div className="text-xs text-gray-500">Types</div>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Main Gallery Area */}
                <div className="md:col-span-3 grid grid-cols-2 md:grid-cols-3 gap-6 auto-rows-max">
                    {/* Create New Tile */}
                    <div
                        onClick={() => handleOpenModal()}
                        className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl flex flex-col items-center justify-center text-gray-400 hover:text-blue-500 hover:border-blue-500 transition-all cursor-pointer bg-gray-50 dark:bg-gray-800/20 group h-64"
                    >
                        <div className="w-16 h-16 rounded-full bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Icon name="PlusIcon" className="w-8 h-8" />
                        </div>
                        <span className="font-bold">Start from scratch</span>
                        <span className="text-xs text-gray-400 mt-1">Create new design</span>
                    </div>

                    {filteredProjects.length === 0 && selectedCategory !== 'All' ? (
                        <div className="col-span-2 flex flex-col items-center justify-center py-12 text-gray-400">
                            <Icon name="FolderIcon" className="w-12 h-12 mb-3" />
                            <span className="font-medium">No {selectedCategory} projects yet</span>
                            <Button variant="ghost" size="sm" className="mt-2" onClick={() => handleOpenModal()}>
                                Create one
                            </Button>
                        </div>
                    ) : (
                        filteredProjects.map((project) => (
                            <div key={project.id} className="group relative rounded-2xl overflow-hidden aspect-[4/3] bg-gray-200 dark:bg-gray-800 shadow-sm hover:shadow-lg transition-shadow">
                                {/* Mock Asset Preview */}
                                <div className="absolute inset-0 bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
                                    <div className="text-center">
                                        <Icon name="PhotoIcon" className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-2" />
                                        <span className="text-gray-500 dark:text-gray-400 font-medium text-sm">
                                            {project.dimensions.width} × {project.dimensions.height}
                                        </span>
                                    </div>
                                </div>

                                {/* Type Badge */}
                                <div className="absolute top-3 left-3">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold text-white ${getTypeColor(project.type)}`}>
                                        {project.type}
                                    </span>
                                </div>

                                {/* Overlay */}
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                    <Button variant="primary" size="sm">Edit</Button>
                                    <Button variant="secondary" size="sm">Download</Button>
                                    <Button variant="ghost" size="sm" onClick={() => handleDelete(project.id)}>
                                        <Icon name="TrashIcon" className="w-4 h-4 text-red-400" />
                                    </Button>
                                </div>

                                {/* Info Footer */}
                                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent text-white">
                                    <div className="text-sm font-bold truncate">{project.name}</div>
                                    <div className="text-xs text-gray-300 flex items-center gap-1">
                                        <Icon name="ClockIcon" className="w-3 h-3" />
                                        {formatTimeAgo(project.last_edited)}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Create/Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={editingProject ? 'Edit Project' : 'Create New Design'}
                size="lg"
                footer={
                    <>
                        <Button variant="secondary" onClick={handleCloseModal}>Cancel</Button>
                        <Button variant="primary" onClick={handleSave} disabled={saving || !formData.name.trim()}>
                            {saving ? 'Creating...' : editingProject ? 'Update' : 'Create Project'}
                        </Button>
                    </>
                }
            >
                <div className="space-y-6">
                    <Input
                        label="Project Name"
                        placeholder="e.g., Summer Campaign Post"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                    
                    <Select
                        label="Project Type"
                        value={formData.type}
                        onChange={e => handleTypeChange(e.target.value as CreativeProject['type'])}
                    >
                        {templateCategories.map(cat => (
                            <option key={cat.name} value={cat.name}>{cat.name}</option>
                        ))}
                    </Select>

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Width (px)"
                            type="number"
                            value={formData.dimensions.width}
                            onChange={e => setFormData({ 
                                ...formData, 
                                dimensions: { ...formData.dimensions, width: parseInt(e.target.value) || 0 } 
                            })}
                        />
                        <Input
                            label="Height (px)"
                            type="number"
                            value={formData.dimensions.height}
                            onChange={e => setFormData({ 
                                ...formData, 
                                dimensions: { ...formData.dimensions, height: parseInt(e.target.value) || 0 } 
                            })}
                        />
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                        <div className="text-xs font-bold text-gray-500 uppercase mb-3">Quick Templates</div>
                        <div className="grid grid-cols-3 gap-2">
                            {templateCategories.map(cat => (
                                <button
                                    key={cat.name}
                                    type="button"
                                    onClick={() => handleTypeChange(cat.name)}
                                    className={`p-3 rounded-lg text-center transition-colors ${
                                        formData.type === cat.name 
                                            ? 'bg-gyn-blue-medium text-white' 
                                            : 'bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                                    }`}
                                >
                                    <Icon name={cat.icon} className="w-5 h-5 mx-auto mb-1" />
                                    <div className="text-xs font-medium truncate">{cat.name}</div>
                                    <div className="text-[10px] opacity-70">{cat.dimensions.width}×{cat.dimensions.height}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
};