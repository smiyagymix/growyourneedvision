import React, { useState, useEffect } from 'react';
import { Icon, Button, Card } from '../components/shared/ui/CommonUI';
import { AIContentGeneratorModal } from '../components/shared/modals/AIContentGeneratorModal';
import { hobbiesService, HobbyProject } from '../services/hobbiesService';
import { useAuth } from '../context/AuthContext';
import { LoadingScreen } from '../components/shared/LoadingScreen';
import { motion } from 'framer-motion';

interface HobbiesAppProps {
    activeTab: string;
    activeSubNav: string;
}

const HobbiesApp: React.FC<HobbiesAppProps> = ({ activeTab, activeSubNav }) => {
    const { user } = useAuth();
    const [isAIModalOpen, setIsAIModalOpen] = useState(false);
    const [projects, setProjects] = useState<HobbyProject[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [user]);

    const loadData = async () => {
        if (!user) return;

        try {
            setLoading(true);
            const userProjects = await hobbiesService.getUserProjects(user.id);
            setProjects(userProjects);
        } catch (error) {
            console.error('Failed to load projects:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Completed': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
            case 'In Progress': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
            case 'Planning': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'On Hold': return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getDifficultyIcon = (difficulty: string) => {
        switch (difficulty) {
            case 'Beginner': return '🌱';
            case 'Intermediate': return '🌿';
            case 'Advanced': return '🌳';
            default: return '📌';
        }
    };

    if (loading) {
        return <LoadingScreen />;
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6 animate-fadeIn">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl text-white shadow-lg">
                        <Icon name="Sparkles" className="w-10 h-10" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white">My Hobbies & Projects</h1>
                        <p className="text-gray-600 dark:text-gray-400">Track your passions and creative pursuits</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={() => setIsAIModalOpen(true)}
                        className="flex items-center gap-2 text-purple-600 border-purple-200 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                    >
                        <Icon name="Sparkles" className="w-4 h-4" />
                        Discover New Hobbies
                    </Button>
                    <Button variant="primary">
                        <Icon name="PlusIcon" className="w-5 h-5 mr-2" />
                        New Project
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Projects', value: projects.length, icon: 'FolderIcon', color: 'blue' },
                    { label: 'In Progress', value: projects.filter(p => p.status === 'In Progress').length, icon: 'ClockIcon', color: 'yellow' },
                    { label: 'Completed', value: projects.filter(p => p.status === 'Completed').length, icon: 'CheckCircleIcon', color: 'green' },
                    { label: 'Avg Progress', value: `${Math.round(projects.reduce((sum, p) => sum + p.progress, 0) / (projects.length || 1))}%`, icon: 'ChartBarIcon', color: 'purple' }
                ].map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                    >
                        <Card className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
                                </div>
                                <div className={`w-12 h-12 rounded-full bg-${stat.color}-100 dark:bg-${stat.color}-900/30 flex items-center justify-center`}>
                                    <Icon name={stat.icon} className={`w-6 h-6 text-${stat.color}-600 dark:text-${stat.color}-400`} />
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Projects Grid */}
            <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Your Projects</h2>
                {projects.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {projects.map((project, index) => (
                            <motion.div
                                key={project.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <Card className="overflow-hidden hover:shadow-xl transition-all group cursor-pointer">
                                    <div className="h-48 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 relative flex items-center justify-center overflow-hidden">
                                        {project.image_url ? (
                                            <img src={project.image_url} alt={project.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                        ) : (
                                            <div className="text-6xl">{getDifficultyIcon(project.difficulty)}</div>
                                        )}
                                        <div className="absolute top-2 right-2 flex gap-1">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(project.status)}`}>
                                                {project.status}
                                            </span>
                                        </div>
                                        <div className="absolute top-2 left-2">
                                            <span className="px-2 py-1 bg-white/90 dark:bg-black/70 rounded-full text-xs font-bold text-gray-900 dark:text-white">
                                                {project.category}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="p-6">
                                        <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-2 line-clamp-1">{project.title}</h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">{project.description}</p>

                                        {/* Progress Bar */}
                                        <div className="mb-4">
                                            <div className="flex justify-between text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">
                                                <span>Progress</span>
                                                <span>{project.progress}%</span>
                                            </div>
                                            <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                                                <div
                                                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-full transition-all"
                                                    style={{ width: `${project.progress}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* Meta Info */}
                                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                            <div className="flex items-center gap-1">
                                                <Icon name="ClockIcon" className="w-3 h-3" />
                                                <span>{Math.round(project.time_spent / 60)}h</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Icon name="CalendarIcon" className="w-3 h-3" />
                                                <span>{new Date(project.start_date).toLocaleDateString()}</span>
                                            </div>
                                            <span className="font-semibold">{project.difficulty}</span>
                                        </div>

                                        {/* Tags */}
                                        {project.tags && project.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-3">
                                                {project.tags.slice(0, 3).map((tag, i) => (
                                                    <span key={i} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-[10px] font-semibold">
                                                        #{tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            </motion.div>
                        ))}

                        {/* Add New Card */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: projects.length * 0.05 }}
                        >
                            <Card className="h-full min-h-[400px] flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 hover:text-purple-600 dark:hover:text-purple-400 hover:border-purple-300 dark:hover:border-purple-700 transition-all cursor-pointer group">
                                <Icon name="PlusCircleIcon" className="w-16 h-16 mb-4 group-hover:scale-110 transition-transform" />
                                <span className="font-bold text-lg">Start New Project</span>
                                <span className="text-sm">Begin tracking another hobby</span>
                            </Card>
                        </motion.div>
                    </div>
                ) : (
                    <Card className="text-center py-16">
                        <div className="text-6xl mb-4">🎨</div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No projects yet</h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">Start tracking your hobbies and creative projects!</p>
                        <Button variant="primary">Create Your First Project</Button>
                    </Card>
                )}
            </div>

            {/* AI Modal */}
            <AIContentGeneratorModal
                isOpen={isAIModalOpen}
                onClose={() => setIsAIModalOpen(false)}
                onSuccess={(content) => {
                    console.log("Hobby Suggestions:", content);
                    setIsAIModalOpen(false);
                    alert("Hobby suggestions generated! (Check console)");
                }}
                title="Discover New Hobbies"
                promptTemplate={`Suggest 3 engaging hobbies for someone interested in ${activeSubNav || 'various activities'}.
        
        For each hobby, provide:
        - Name and brief description
        - Why it's rewarding
        - Getting started budget (Low/Medium/High)
        - First 3 steps to begin
        - Recommended resources or communities`}
                contextData={{ interests: activeSubNav, existingProjects: projects.length }}
            />
        </div>
    );
};

export default HobbiesApp;