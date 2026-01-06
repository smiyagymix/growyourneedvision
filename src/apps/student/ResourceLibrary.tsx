import React, { useState, useEffect } from 'react';
import { Card, Button, Icon } from '../../components/shared/ui/CommonUI';
import { useAuth } from '../../context/AuthContext';
import pb from '../../lib/pocketbase';

interface Resource {
    id: string;
    title: string;
    type: 'pdf' | 'video' | 'document' | 'link' | 'other';
    subject: string;
    description?: string;
    file_url?: string;
    external_link?: string;
    uploaded_by: string;
    created: string;
}

export const ResourceLibrary: React.FC = () => {
    const { user } = useAuth();
    const [resources, setResources] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pdf' | 'video' | 'document' | 'link'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadResources();
    }, [filter]);

    const loadResources = async () => {
        setLoading(true);
        try {
            // Load resources for student's courses
            let filterQuery = 'status = "published"';

            if (filter !== 'all') {
                filterQuery += ` && type = "${filter}"`;
            }

            const resourcesData = await pb.collection('course_resources').getList(1, 100, {
                filter: filterQuery,
                sort: '-created',
                expand: 'subject,uploaded_by'
            });

            setResources(resourcesData.items as any);
        } catch (error) {
            console.error('Failed to load resources:', error);
        } finally {
            setLoading(false);
        }
    };

    const downloadResource = (resource: Resource) => {
        if (resource.file_url) {
            window.open(resource.file_url, '_blank');
        } else if (resource.external_link) {
            window.open(resource.external_link, '_blank');
        }
    };

    const getTypeIcon = (type: Resource['type']) => {
        switch (type) {
            case 'pdf': return 'DocumentTextIcon';
            case 'video': return 'VideoCameraIcon';
            case 'document': return 'DocumentDuplicateIcon';
            case 'link': return 'LinkIcon';
            default: return 'FolderIcon';
        }
    };

    const getTypeColor = (type: Resource['type']) => {
        switch (type) {
            case 'pdf': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
            case 'video': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
            case 'document': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
            case 'link': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
        }
    };

    const filteredResources = resources.filter(resource =>
        searchQuery === '' ||
        resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resource.subject?.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
            <div>
                <h1 className="text-3xl font-black text-gray-900 dark:text-white">Resource Library</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Access course materials and study resources</p>
            </div>

            {/* Search and Filters */}
            <Card className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder="Search resources..."
                            className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        {(['all', 'pdf', 'video', 'document', 'link'] as const).map(f => (
                            <Button
                                key={f}
                                variant={filter === f ? 'primary' : 'outline'}
                                size="sm"
                                onClick={() => setFilter(f)}
                            >
                                {f.toUpperCase()}
                            </Button>
                        ))}
                    </div>
                </div>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-4 text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{resources.length}</p>
                </Card>
                <Card className="p-4 text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">PDFs</p>
                    <p className="text-2xl font-bold text-red-600">{resources.filter(r => r.type === 'pdf').length}</p>
                </Card>
                <Card className="p-4 text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Videos</p>
                    <p className="text-2xl font-bold text-purple-600">{resources.filter(r => r.type === 'video').length}</p>
                </Card>
                <Card className="p-4 text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Documents</p>
                    <p className="text-2xl font-bold text-blue-600">{resources.filter(r => r.type === 'document').length}</p>
                </Card>
            </div>

            {/* Resources Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredResources.map(resource => (
                    <Card key={resource.id} className="p-6 hover:shadow-lg transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                <Icon name={getTypeIcon(resource.type)} className="w-6 h-6 text-white" />
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getTypeColor(resource.type)}`}>
                                {resource.type.toUpperCase()}
                            </span>
                        </div>

                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{resource.title}</h3>

                        {resource.subject && (
                            <p className="text-sm text-blue-600 dark:text-blue-400 mb-2">{resource.subject}</p>
                        )}

                        {resource.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">{resource.description}</p>
                        )}

                        <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                            <span>{new Date(resource.created).toLocaleDateString()}</span>
                        </div>

                        <Button
                            variant="primary"
                            size="sm"
                            className="w-full"
                            onClick={() => downloadResource(resource)}
                        >
                            <Icon name="ArrowDownTrayIcon" className="w-4 h-4 mr-2" />
                            {resource.type === 'link' ? 'Open Link' : 'Download'}
                        </Button>
                    </Card>
                ))}
            </div>

            {filteredResources.length === 0 && (
                <Card className="p-12 text-center">
                    <Icon name="FolderOpenIcon" className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Resources Found</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                        {searchQuery ? 'Try a different search term' : 'No resources available yet'}
                    </p>
                </Card>
            )}
        </div>
    );
};

export default ResourceLibrary;
