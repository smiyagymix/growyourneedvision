import React, { useState, useEffect } from 'react';
import { useDataQuery } from '../hooks/useDataQuery';
import { Project, Task, Asset, Template } from './types';
import { Icon, Card, Button, Badge, Modal, Input } from '../components/shared/ui/CommonUI';
import { AIContentGeneratorModal } from '../components/shared/modals/AIContentGeneratorModal';
import pb from '../lib/pocketbase';
import { useToast } from '../hooks/useToast';

interface ProjectsAppProps {
  activeTab: string;
  activeSubNav: string;
}

const ProjectsApp: React.FC<ProjectsAppProps> = ({ activeSubNav }) => {
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isAIModalOpen, setIsAIModalOpen] = useState(false);
    const [newProjectData, setNewProjectData] = useState({ name: '', description: '' });
    
    // Queries
    const { items: projects, loading: projectsLoading, refresh: refreshProjects } = useDataQuery<Project>('projects', { sort: '-updated' });
    const { items: assets, loading: assetsLoading } = useDataQuery<Asset>('assets', { sort: '-created' });
    const { items: templates, loading: templatesLoading } = useDataQuery<Template>('templates', { sort: 'name' });
    
    // Task Board State
    const [tasks, setTasks] = useState<Task[]>([]);

    useEffect(() => {
        if (selectedProject) {
            fetchTasks(selectedProject.id);
        }
    }, [selectedProject]);

    const fetchTasks = async (projectId: string) => {
        try {
            const res = await pb.collection('tasks').getFullList<Task>({ filter: `project="${projectId}"` });
            setTasks(res);
        } catch (e) {
            console.error("Error fetching tasks", e);
            setTasks([]);
        }
    };

    const handleCreateProject = async () => {
        if (!newProjectData.name.trim()) return;
        try {
            await pb.collection('projects').create({
                ...newProjectData,
                status: 'Planning',
                owner: pb.authStore.model?.id,
                progress: 0
            });
            await refreshProjects();
            setIsCreateModalOpen(false);
            setNewProjectData({ name: '', description: '' });
        } catch (e) {
            console.error("Error creating project", e);
            alert("Failed to create project. Please try again.");
        }
    };

    const renderProjectList = () => {
        if (projectsLoading) {
            return (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-64 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse"></div>
                    ))}
                </div>
            );
        }

        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Create New Card */}
                <button 
                    onClick={() => setIsCreateModalOpen(true)}
                    className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-8 flex flex-col items-center justify-center text-gray-400 hover:text-indigo-500 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all group h-64"
                >
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 transition-colors">
                        <Icon name="PlusCircleIcon" className="w-8 h-8" />
                    </div>
                    <span className="font-bold text-lg">Create New Project</span>
                </button>

                {projects.map(project => (
                    <Card 
                        key={project.id} 
                        variant="default" 
                        className="h-64 flex flex-col cursor-pointer group hover:-translate-y-1 transition-transform"
                        onClick={() => setSelectedProject(project)}
                    >
                        <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-t-xl relative overflow-hidden">
                            {project.thumbnail ? (
                                <img src={pb.files.getUrl(project, project.thumbnail)} alt={project.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-gray-300">
                                    <Icon name="FolderOpenIcon" className="w-16 h-16" />
                                </div>
                            )}
                            <div className="absolute top-3 right-3">
                                <Badge variant={project.status === 'Completed' ? 'success' : 'primary'}>{project.status}</Badge>
                            </div>
                        </div>
                        <div className="p-5">
                            <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-1 group-hover:text-indigo-600 transition-colors">{project.name}</h3>
                            <p className="text-xs text-gray-500 line-clamp-2">{project.description || 'No description'}</p>
                        </div>
                    </Card>
                ))}
            </div>
        );
    };

    const renderProjectDashboard = () => {
        if (!selectedProject) return renderProjectList();

        return (
            <div className="space-y-8 animate-fadeIn">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <button onClick={() => setSelectedProject(null)} className="text-sm text-gray-500 hover:text-indigo-600 flex items-center gap-1 mb-2">
                            <Icon name="ArrowLeftIcon" className="w-4 h-4" /> Back to Projects
                        </button>
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white">{selectedProject.name}</h1>
                        <p className="text-gray-500">{selectedProject.description}</p>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="secondary" leftIcon={<Icon name="Cog6ToothIcon" className="w-4 h-4" />}>Settings</Button>
                        <Button variant="primary" leftIcon={<Icon name="PlusCircleIcon" className="w-4 h-4" />}>Add Task</Button>
                    </div>
                </div>

                {/* Kanban Board */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[500px]">
                    {['To Do', 'In Progress', 'Done'].map(status => (
                        <div key={status} className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 flex flex-col border border-gray-200 dark:border-gray-700">
                            <div className="flex justify-between items-center mb-4 px-2">
                                <h3 className="font-bold text-gray-700 dark:text-gray-300">{status}</h3>
                                <Badge variant="neutral" size="sm">{tasks.filter(t => t.status === status).length}</Badge>
                            </div>
                            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                                {tasks.filter(t => t.status === status).map(task => (
                                    <div key={task.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md cursor-grab active:cursor-grabbing">
                                        <h4 className="font-bold text-sm text-gray-800 dark:text-white mb-2">{task.title}</h4>
                                        <div className="flex justify-between items-center">
                                            <div className="flex -space-x-2">
                                                <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold border-2 border-white">ME</div>
                                            </div>
                                            <Icon name="EllipsisHorizontalIcon" className="w-4 h-4 text-gray-400" />
                                        </div>
                                    </div>
                                ))}
                                <button className="w-full py-2 text-sm text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 transition-colors">
                                    + Add Task
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Project Files */}
                <div>
                    <h3 className="font-bold text-xl text-gray-800 dark:text-white mb-4">Project Files</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        <button className="aspect-square border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:text-indigo-500 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all">
                            <Icon name="CloudArrowUpIcon" className="w-8 h-8 mb-2" />
                            <span className="text-xs font-bold">Upload</span>
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const renderMyCreations = () => (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">My Creations</h2>
                <div className="flex gap-2">
                    <Input placeholder="Search creations..." className="w-64" />
                    <Button variant="secondary" leftIcon={<Icon name="FunnelIcon" className="w-4 h-4" />}>Filter</Button>
                </div>
            </div>
            
            {assetsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"></div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {assets.map(asset => (
                        <Card key={asset.id} variant="default" className="group cursor-pointer">
                            <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg mb-3 relative overflow-hidden">
                                {/* Preview would go here */}
                                <div className="absolute inset-0 flex items-center justify-center text-gray-300">
                                    <Icon name={asset.type === 'video' ? 'VideoCameraIcon' : 'PhotoIcon'} className="w-12 h-12" />
                                </div>
                            </div>
                            <h4 className="font-bold text-gray-800 dark:text-white truncate">{asset.name}</h4>
                            <p className="text-xs text-gray-500">{new Date(asset.created).toLocaleDateString()} • {asset.type}</p>
                        </Card>
                    ))}
                    {assets.length === 0 && (
                        <div className="col-span-full text-center py-12 text-gray-500">No creations found.</div>
                    )}
                </div>
            )}
        </div>
    );

    const renderAssetLibrary = () => (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Asset Library</h2>
                <Button variant="primary" leftIcon={<Icon name="CloudArrowUpIcon" className="w-4 h-4" />}>Upload Asset</Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {/* Folders */}
                {['Brand Kit', 'Stock Photos', 'Audio', 'Video Clips'].map(folder => (
                    <div key={folder} className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl flex flex-col items-center justify-center text-center cursor-pointer hover:bg-blue-100 transition-colors">
                        <Icon name="FolderIcon" className="w-10 h-10 text-blue-500 mb-2" />
                        <span className="font-bold text-sm text-blue-900 dark:text-blue-100">{folder}</span>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderTemplateLibrary = () => (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Template Library</h2>
            {templatesLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-48 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse"></div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {templates.map(template => (
                        <Card key={template.id} variant="default" className="group cursor-pointer hover:shadow-lg">
                            <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg mb-3 overflow-hidden">
                                {template.thumbnail && <img src={pb.files.getUrl(template, template.thumbnail)} className="w-full h-full object-cover" />}
                            </div>
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-bold text-gray-800 dark:text-white">{template.name}</h4>
                                    <Badge variant="neutral" size="sm" className="mt-1">{template.category}</Badge>
                                </div>
                                {template.is_community && <Badge variant="success" size="sm">Community</Badge>}
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <>
            {activeSubNav === 'My Creations' ? renderMyCreations() :
             activeSubNav === 'Asset Library' ? renderAssetLibrary() :
             activeSubNav === 'Template Library' ? renderTemplateLibrary() :
             renderProjectDashboard()}

            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Create New Project"
            >
                <div className="space-y-4">
                    <Input 
                        label="Project Name" 
                        value={newProjectData.name}
                        onChange={(e) => setNewProjectData({...newProjectData, name: e.target.value})}
                        placeholder="e.g. Summer Campaign"
                    />
                    <div>
                        <div className="flex justify-between items-center mb-1.5">
                            <label className="block text-xs font-bold text-gray-700 ml-1 uppercase tracking-wide">Description</label>
                            <button 
                                onClick={() => setIsAIModalOpen(true)}
                                className="text-[10px] font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1"
                            >
                                <Icon name="Sparkles" className="w-3 h-3" /> AI Assist
                            </button>
                        </div>
                        <textarea 
                            className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-gyn-blue-medium/20 focus:border-gyn-blue-medium block p-2.5 transition-all shadow-sm placeholder-gray-400 resize-none" 
                            rows={3}
                            value={newProjectData.description}
                            onChange={(e) => setNewProjectData({...newProjectData, description: e.target.value})}
                            placeholder="Briefly describe your project goals..."
                        />
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
                        <Button variant="primary" onClick={handleCreateProject}>Create Project</Button>
                    </div>
                </div>
            </Modal>

            <AIContentGeneratorModal
                isOpen={isAIModalOpen}
                onClose={() => setIsAIModalOpen(false)}
                onSuccess={(content) => {
                    setNewProjectData({ ...newProjectData, description: content });
                    setIsAIModalOpen(false);
                }}
                title="Generate Project Description"
                promptTemplate={`Write a concise and professional project description for a project named "${newProjectData.name || '[Project Name]'}".
                
                Include:
                - Main Objective
                - Key Deliverables
                - Target Audience`}
                contextData={{ name: newProjectData.name }}
            />
        </>
    );
};

export default ProjectsApp;
