import React, { useState } from 'react';
import { useDataQuery } from '../hooks/useDataQuery';
import { Project, LearningProgress } from './types';
import { Icon, Card, Button, Badge, Input } from '../components/shared/ui/CommonUI';
import { MetricCard } from '../components/shared/ui/MetricCard';
import pb from '../lib/pocketbase';
import { useNavigate } from 'react-router-dom';

interface IndividualDashboardProps {
    activeTab: string;
    activeSubNav: string;
}

const IndividualDashboard: React.FC<IndividualDashboardProps> = ({ activeTab, activeSubNav }) => {
    const navigate = useNavigate();
    const { items: recentProjects, loading: projectsLoading } = useDataQuery<Project>('projects', {
        sort: '-updated',
        perPage: 5
    });

    const { items: learningStats, loading: statsLoading } = useDataQuery<LearningProgress>('learning_progress', {
        sort: '-last_accessed'
    });

    const [aiPrompt, setAiPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const handleAiGenerate = async () => {
        if (!aiPrompt.trim()) return;
        setIsGenerating(true);
        // Simulate AI generation or call actual AI service
        setTimeout(() => {
            setIsGenerating(false);
            alert(`AI Idea Generated for: ${aiPrompt}`);
            setAiPrompt('');
        }, 1500);
    };

    const handleCreateProject = async (type: string) => {
        try {
            const newProject = await pb.collection('projects').create({
                name: `New ${type} Project`,
                status: 'Planning',
                owner: pb.authStore.model?.id,
                progress: 0
            });
            // Navigate to project (assuming route exists)
            // navigate(`/projects/${newProject.id}`);
            alert(`Created new ${type} project: ${newProject.id}`);
        } catch (e) {
            console.error("Failed to create project", e);
        }
    };

    const completedProjects = recentProjects.filter(p => p.status === 'Completed').length;
    const activeProjects = recentProjects.filter(p => p.status === 'In Progress').length;

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn pb-12">
            {/* "What will you create today?" Hero Section */}
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-2xl">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
                <div className="absolute right-0 top-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                
                <div className="relative z-10 p-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="max-w-xl">
                        <h1 className="text-4xl font-black mb-4 leading-tight">What will you create today?</h1>
                        <p className="text-indigo-100 text-lg mb-8">Ignite your creativity with AI-powered tools and templates.</p>
                        
                        <div className="bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/20 flex gap-2">
                            <input 
                                type="text" 
                                value={aiPrompt}
                                onChange={(e) => setAiPrompt(e.target.value)}
                                placeholder="Ask AI to generate an idea..." 
                                className="flex-1 bg-transparent border-none text-white placeholder-indigo-200 focus:ring-0 px-4"
                                onKeyDown={(e) => e.key === 'Enter' && handleAiGenerate()}
                            />
                            <Button 
                                variant="primary" 
                                className="bg-white text-indigo-600 hover:bg-indigo-50 border-none shadow-lg"
                                onClick={handleAiGenerate}
                                disabled={isGenerating}
                            >
                                {isGenerating ? 'Thinking...' : <Icon name="SparklesIcon" className="w-5 h-5" />}
                            </Button>
                        </div>
                        <div className="flex gap-3 mt-3 text-xs text-indigo-200 font-medium">
                            <span>Try: "Blog post outline"</span>
                            <span>•</span>
                            <span>"Video script"</span>
                            <span>•</span>
                            <span>"Logo concept"</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => handleCreateProject('Design')} className="p-6 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-2xl border border-white/10 transition-all hover:-translate-y-1 text-center group">
                            <div className="w-12 h-12 mx-auto bg-pink-500/20 rounded-xl flex items-center justify-center mb-3 group-hover:bg-pink-500 text-pink-300 group-hover:text-white transition-colors">
                                <Icon name="PaintBrushIcon" className="w-6 h-6" />
                            </div>
                            <span className="font-bold">New Design</span>
                        </button>
                        <button onClick={() => handleCreateProject('Video')} className="p-6 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-2xl border border-white/10 transition-all hover:-translate-y-1 text-center group">
                            <div className="w-12 h-12 mx-auto bg-blue-500/20 rounded-xl flex items-center justify-center mb-3 group-hover:bg-blue-500 text-blue-300 group-hover:text-white transition-colors">
                                <Icon name="VideoCameraIcon" className="w-6 h-6" />
                            </div>
                            <span className="font-bold">New Video</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats & Quick Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <MetricCard 
                    label="Active Projects" 
                    value={activeProjects.toString()} 
                    icon="Briefcase" 
                    color="text-blue-600"
                    bgGradient="from-blue-50 to-indigo-50"
                />
                <MetricCard 
                    label="Completed" 
                    value={completedProjects.toString()} 
                    icon="CheckCircle" 
                    color="text-green-600"
                    bgGradient="from-green-50 to-emerald-50"
                />
                <MetricCard 
                    label="XP Earned" 
                    value="1,250" 
                    subValue="Level 5 Creator"
                    icon="StarIcon" 
                    color="text-yellow-600"
                    bgGradient="from-yellow-50 to-amber-50"
                />
                <MetricCard 
                    label="Learning Streak" 
                    value="3 Days" 
                    icon="FireIcon" 
                    color="text-orange-600"
                    bgGradient="from-orange-50 to-red-50"
                />
            </div>

            {/* Recent Projects */}
            <div>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Recent Projects</h2>
                    <Button variant="ghost" rightIcon={<Icon name="ArrowRightIcon" className="w-4 h-4" />}>View All</Button>
                </div>
                
                {projectsLoading ? (
                    <div className="text-center py-10 text-gray-500">Loading projects...</div>
                ) : recentProjects.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
                        <Icon name="FolderOpenIcon" className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                        <h3 className="text-lg font-bold text-gray-600 dark:text-gray-300">No projects yet</h3>
                        <p className="text-gray-500 mb-4">Start creating to see your projects here.</p>
                        <Button variant="primary" onClick={() => handleCreateProject('General')}>Create First Project</Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {recentProjects.map(project => (
                            <Card key={project.id} variant="default" className="group hover:-translate-y-1 transition-transform cursor-pointer overflow-hidden">
                                <div className="h-32 bg-gray-200 dark:bg-gray-700 relative">
                                    {project.thumbnail ? (
                                        <img src={pb.files.getUrl(project, project.thumbnail)} alt={project.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                            <Icon name="PhotoIcon" className="w-10 h-10" />
                                        </div>
                                    )}
                                    <div className="absolute top-2 right-2">
                                        <Badge variant={project.status === 'Completed' ? 'success' : 'primary'}>{project.status}</Badge>
                                    </div>
                                </div>
                                <div className="p-5">
                                    <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-1 group-hover:text-indigo-600 transition-colors">{project.name}</h3>
                                    <p className="text-xs text-gray-500 mb-4">Last modified: {new Date(project.updated).toLocaleDateString()}</p>
                                    
                                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 mb-2">
                                        <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${project.progress || 0}%` }}></div>
                                    </div>
                                    <div className="flex justify-between text-xs text-gray-500">
                                        <span>Progress</span>
                                        <span>{project.progress || 0}%</span>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* My Learning */}
            <div>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">My Learning</h2>
                    <Button variant="ghost" rightIcon={<Icon name="ArrowRightIcon" className="w-4 h-4" />}>View All</Button>
                </div>
                
                {statsLoading ? (
                    <div className="text-center py-10 text-gray-500">Loading learning progress...</div>
                ) : learningStats.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
                        <Icon name="AcademicCapIcon" className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                        <h3 className="text-lg font-bold text-gray-600 dark:text-gray-300">No courses started</h3>
                        <p className="text-gray-500 mb-4">Explore the catalog to start learning.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {learningStats.map(course => (
                            <Card key={course.id} variant="default" className="p-5 group hover:-translate-y-1 transition-transform cursor-pointer">
                                <div className="flex items-center justify-between mb-3">
                                    <Badge variant={course.status === 'Completed' ? 'success' : 'warning'}>{course.status}</Badge>
                                    <span className="text-xs text-gray-500">{new Date(course.last_accessed).toLocaleDateString()}</span>
                                </div>
                                <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-2 group-hover:text-indigo-600 transition-colors">{course.course_name}</h3>
                                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 mb-2">
                                    <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${course.progress}%` }}></div>
                                </div>
                                <div className="flex justify-between text-xs text-gray-500">
                                    <span>Progress</span>
                                    <span>{course.progress}%</span>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recommended for You */}
                <Card variant="default" className="lg:col-span-2 p-6">
                    <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                        <Icon name="SparklesIcon" className="w-5 h-5 text-yellow-500" />
                        Recommended for You
                    </h3>
                    <div className="space-y-4">
                        {[1, 2].map(i => (
                            <div key={i} className="flex gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm transition-all cursor-pointer">
                                <div className="w-24 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg flex-shrink-0"></div>
                                <div>
                                    <Badge variant="neutral" size="sm" className="mb-1">Tutorial</Badge>
                                    <h4 className="font-bold text-gray-800 dark:text-white">Mastering Video Transitions in 5 Minutes</h4>
                                    <p className="text-xs text-gray-500 mt-1">Based on your recent video project</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Scratchpad */}
                <Card variant="default" className="p-6 flex flex-col">
                    <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                        <Icon name="PencilSquareIcon" className="w-5 h-5 text-gray-400" />
                        Scratchpad
                    </h3>
                    <textarea 
                        className="flex-1 w-full bg-yellow-50 dark:bg-gray-800 border-none resize-none p-4 rounded-xl text-gray-700 dark:text-gray-300 focus:ring-0 text-sm leading-relaxed"
                        placeholder="Jot down quick ideas here..."
                        rows={8}
                    ></textarea>
                </Card>
            </div>
        </div>
    );
};

export default IndividualDashboard;
