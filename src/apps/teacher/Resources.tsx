import React, { useState, useEffect } from 'react';
import { Card, Button, Icon, Badge, Modal, Input } from '../../components/shared/ui/CommonUI';
import { Spinner } from '../../components/shared/ui/Spinner';
import { FileUpload } from '../../components/shared/ui/FileUpload';
import { resourceService, Resource } from '../../services/resourceService';
import { AIContentGeneratorModal } from '../../components/shared/modals/AIContentGeneratorModal';
import pb from '../../lib/pocketbase';
import { z } from 'zod';
import { sanitizeText, sanitizeHtml } from '../../utils/sanitization';
import { useToast } from '../../hooks/useToast';

const resourceSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  type: z.enum(['Lesson Plan', 'Worksheet', 'Video', 'Presentation', 'Guide']),
  visibility: z.enum(['private', 'shared'])
});

const bulkDeleteSchema = z.object({
    resourceIds: z.array(z.string()).min(1, 'Select at least one resource').max(50, 'Cannot delete more than 50 resources at once')
});

interface Props {
  activeTab: string;
  activeSubNav: string;
}

const TeacherResources: React.FC<Props> = ({ activeTab, activeSubNav }) => {
    const [resources, setResources] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState<string>('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedResources, setSelectedResources] = useState<string[]>([]);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isAIModalOpen, setIsAIModalOpen] = useState(false);
    const [newResource, setNewResource] = useState<Partial<Resource>>({
        title: '',
        description: '',
        type: 'Lesson Plan',
        visibility: 'private'
    });
    const [uploadFiles, setUploadFiles] = useState<File[]>([]);

    // Sync activeSubNav with filterType
    useEffect(() => {
        if (activeSubNav === 'Lesson Plans') {
            setFilterType('Lesson Plan');
        } else if (activeSubNav !== 'Shared') {
            setFilterType('All');
        }
    }, [activeSubNav]);

    useEffect(() => {
        loadResources();
    }, [filterType, activeSubNav]);

    const loadResources = async () => {
        setLoading(true);
        try {
            if (activeSubNav === 'Shared') {
                const data = await resourceService.getSharedResources();
                setResources(data.items);
            } else {
                const type = filterType === 'All' ? undefined : filterType;
                const data = await resourceService.getResources(type, 'private'); // Default to private for "Library"
                setResources(data.items);
            }
        } catch (error) {
            console.error("Failed to load resources", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateResource = async () => {
        const { showToast } = useToast();
        try {
            // If multiple files, create multiple resources
            if (uploadFiles.length > 0) {
                for (const file of uploadFiles) {
                    // Sanitize
                    const sanitized = {
                        title: sanitizeText(newResource.title || file.name),
                        description: newResource.description ? sanitizeHtml(newResource.description, 'BASIC') : '',
                        type: newResource.type || 'Lesson Plan',
                        visibility: newResource.visibility || 'private'
                    };

                    // Validate
                    const result = resourceSchema.safeParse(sanitized);
                    if (!result.success) {
                        showToast(`Validation error: ${result.error.issues[0].message}`, 'error');
                        return;
                    }

                    const formData = new FormData();
                    formData.append('title', result.data.title);
                    formData.append('description', result.data.description || '');
                    formData.append('type', result.data.type);
                    formData.append('visibility', result.data.visibility);
                    formData.append('file', file);

                    await resourceService.createResource(formData);
                }
            } else {
                // Sanitize
                const sanitized = {
                    title: sanitizeText(newResource.title),
                    description: newResource.description ? sanitizeHtml(newResource.description, 'BASIC') : undefined,
                    type: newResource.type,
                    visibility: newResource.visibility
                };

                // Validate
                const result = resourceSchema.safeParse(sanitized);
                if (!result.success) {
                    showToast(`Validation error: ${result.error.issues[0].message}`, 'error');
                    return;
                }

                await resourceService.createResource(result.data);
            }
            
            setIsUploadModalOpen(false);
            loadResources();
            setNewResource({ title: '', description: '', type: 'Lesson Plan', visibility: 'private' });
            setUploadFiles([]);
        } catch (error) {
            console.error("Failed to create resource", error);
        }
    };

    const handleBulkDelete = async () => {
        const validationResult = bulkDeleteSchema.safeParse({ resourceIds: selectedResources });
        if (!validationResult.success) {
            showToast(validationResult.error.issues[0].message, 'error');
            return;
        }
        
        if (!confirm(`Are you sure you want to delete ${selectedResources.length} resources?`)) return;
        
        try {
            await Promise.all(validationResult.data.resourceIds.map(id => resourceService.deleteResource(id)));
            
            // Optimistic update
            setResources(prev => prev.filter(r => !selectedResources.includes(r.id)));
            setSelectedResources([]);
            showToast(`Successfully deleted ${validationResult.data.resourceIds.length} resources`, 'success');
        } catch (error) {
            console.error("Failed to delete resources", error);
            showToast('Failed to delete resources', 'error');
        }
    };

    const toggleSelection = (id: string) => {
        setSelectedResources(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const getFileIcon = (type: string) => {
        switch (type) {
            case 'Video': return 'VideoCameraIcon';
            case 'Presentation': return 'PresentationChartBarIcon';
            case 'Worksheet': return 'DocumentTextIcon';
            case 'Guide': return 'BookOpenIcon';
            default: return 'DocumentIcon';
        }
    };

    const filteredResources = resources.filter(r => {
        const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              r.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
    });

    const resourceTypes = ['All', 'Lesson Plan', 'Worksheet', 'Video', 'Presentation', 'Guide'];

    const renderContent = () => {
        // Shared tab logic is now handled by loadResources and the grid below
        // We just need to show the filter bar if not in Shared tab, or maybe show it there too?
        // Let's keep the filter bar for both, but maybe hide the "Shared" placeholder.

        return (
            <>
                <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between items-center">
                    <div className="flex gap-2 overflow-x-auto pb-2 w-full md:w-auto no-scrollbar">
                        {resourceTypes.map(type => (
                            <button
                                key={type}
                                onClick={() => setFilterType(type)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                                    filterType === type 
                                    ? 'bg-gyn-blue-medium text-white' 
                                    : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'
                                }`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                    
                    <div className="w-full md:w-64">
                        <div className="relative">
                            <Icon name="MagnifyingGlassIcon" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input 
                                type="text" 
                                placeholder="Search materials..." 
                                className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-gyn-blue-medium/20 focus:border-gyn-blue-medium outline-none transition-all"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {selectedResources.length > 0 && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 p-3 rounded-xl flex items-center justify-between mb-6 animate-fadeIn">
                        <span className="text-sm font-bold text-blue-800 dark:text-blue-300 px-2">
                            {selectedResources.length} items selected
                        </span>
                        <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setSelectedResources([])}>Cancel</Button>
                            <Button variant="danger" size="sm" onClick={handleBulkDelete} leftIcon={<Icon name="TrashIcon" className="w-4 h-4" />}>
                                Delete Selected
                            </Button>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center p-10"><Spinner size="lg" /></div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredResources.map(resource => (
                            <Card 
                                key={resource.id} 
                                variant="default" 
                                className={`group hover:shadow-lg transition-all cursor-pointer relative border-2 ${selectedResources.includes(resource.id) ? 'border-gyn-blue-medium' : 'border-transparent'}`}
                                onClick={() => toggleSelection(resource.id)}
                            >
                                <div className="absolute top-3 left-3 z-10">
                                    <input 
                                        type="checkbox" 
                                        checked={selectedResources.includes(resource.id)}
                                        onChange={() => toggleSelection(resource.id)}
                                        className="w-5 h-5 rounded border-gray-300 text-gyn-blue-medium focus:ring-gyn-blue-medium cursor-pointer"
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                </div>

                                <div className="aspect-video bg-gray-100 dark:bg-slate-700 rounded-t-xl flex items-center justify-center relative overflow-hidden">
                                    {resource.thumbnail ? (
                                        <img src={pb.files.getUrl(resource, resource.thumbnail)} alt={resource.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center text-gray-400">
                                            <Icon name={getFileIcon(resource.type)} className="w-12 h-12 mb-2" />
                                            <span className="text-xs font-bold uppercase tracking-wider">{resource.type}</span>
                                        </div>
                                    )}
                                    <div className="absolute top-2 right-2 flex gap-1">
                                        {resource.visibility === 'shared' && <Badge variant="info" className="bg-white/90 backdrop-blur-sm shadow-sm">Shared</Badge>}
                                        {resource.visibility === 'public' && <Badge variant="success" className="bg-white/90 backdrop-blur-sm shadow-sm">Public</Badge>}
                                        <Badge variant="neutral" className="bg-white/90 backdrop-blur-sm shadow-sm">{resource.type}</Badge>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <h3 className="font-bold text-gray-800 dark:text-white mb-1 group-hover:text-gyn-blue-medium transition-colors truncate">{resource.title}</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4 h-10">{resource.description}</p>
                                    
                                    <div className="flex items-center gap-4 text-xs text-gray-400 mb-3">
                                        <div className="flex items-center gap-1" title="Views">
                                            <Icon name="EyeIcon" className="w-3 h-3" />
                                            <span>{resource.views || 0}</span>
                                        </div>
                                        <div className="flex items-center gap-1" title="Downloads">
                                            <Icon name="ArrowDownTrayIcon" className="w-3 h-3" />
                                            <span>{resource.downloads || 0}</span>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center text-xs text-gray-400 border-t border-gray-100 dark:border-slate-700 pt-3">
                                        <span>{new Date(resource.created).toLocaleDateString()}</span>
                                        <button 
                                            className="text-gyn-blue-medium font-bold hover:underline flex items-center gap-1"
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                await resourceService.incrementDownloads(resource.id);
                                                // In a real app, trigger download here
                                                // window.open(pb.files.getUrl(resource, resource.file), '_blank');
                                                loadResources(); // Refresh to show new count
                                            }}
                                        >
                                            <Icon name="ArrowDownTrayIcon" className="w-3 h-3" /> Download
                                        </button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                        {filteredResources.length === 0 && (
                            <div className="col-span-full text-center py-12 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-gray-300 dark:border-slate-700">
                                <Icon name="FolderOpenIcon" className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <h3 className="text-lg font-bold text-gray-500 dark:text-gray-400">No Resources Found</h3>
                                <p className="text-gray-400 text-sm">
                                    {activeSubNav === 'Shared' ? 'No shared resources available.' : 'Upload materials to share with your students.'}
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </>
        );
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-gray-200/50 pb-4">
                <div>
                    <h2 className="text-2xl font-black text-gyn-blue-dark dark:text-white">{activeTab}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Manage teaching materials.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full text-xs font-bold hidden md:block">
                        {activeSubNav || 'Library'}
                    </div>
                    <Button 
                        variant="outline" 
                        leftIcon={<Icon name="Sparkles" className="w-4 h-4" />} 
                        onClick={() => setIsAIModalOpen(true)}
                        className="hidden md:flex"
                    >
                        Generate Plan
                    </Button>
                    <Button variant="primary" leftIcon={<Icon name="PlusCircleIcon" className="w-4 h-4" />} onClick={() => setIsUploadModalOpen(true)}>
                        Upload Resource
                    </Button>
                </div>
            </div>

            {renderContent()}

            <AIContentGeneratorModal
                isOpen={isAIModalOpen}
                onClose={() => setIsAIModalOpen(false)}
                onSuccess={(content) => {
                    setNewResource({
                        ...newResource,
                        title: "AI Generated Lesson Plan",
                        description: content,
                        type: 'Lesson Plan'
                    });
                    setIsAIModalOpen(false);
                    setIsUploadModalOpen(true);
                }}
                title="Generate Lesson Plan"
                promptTemplate="Create a detailed lesson plan for [Subject/Topic] for [Grade Level]. Include learning objectives, materials needed, and a step-by-step activity guide."
                contextData={{}}
            />

            <Modal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                title="Upload New Resource"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setIsUploadModalOpen(false)}>Cancel</Button>
                        <Button variant="primary" onClick={handleCreateResource} disabled={uploadFiles.length === 0 && !newResource.title}>
                            {uploadFiles.length > 1 ? `Upload ${uploadFiles.length} Files` : 'Upload'}
                        </Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Title (Optional for bulk)</label>
                        <input 
                            type="text" 
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white"
                            value={newResource.title}
                            onChange={e => setNewResource({...newResource, title: e.target.value})}
                            placeholder="Leave blank to use filenames"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Type</label>
                            <select 
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white"
                                value={newResource.type}
                                onChange={e => setNewResource({...newResource, type: e.target.value as any})}
                            >
                                {resourceTypes.filter(t => t !== 'All').map(t => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Visibility</label>
                            <select 
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white"
                                value={newResource.visibility}
                                onChange={e => setNewResource({...newResource, visibility: e.target.value as any})}
                            >
                                <option value="private">Private (Only Me)</option>
                                <option value="shared">Shared (Teachers)</option>
                                <option value="public">Public (Everyone)</option>
                            </select>
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Description</label>
                        <textarea 
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white"
                            rows={2}
                            value={newResource.description}
                            onChange={e => setNewResource({...newResource, description: e.target.value})}
                        />
                    </div>

                    <div className="pt-2">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Files</label>
                        <FileUpload 
                            onFileSelect={(files) => setUploadFiles(files)} 
                            multiple={true}
                            label="Drop files here (PDF, DOC, Images)"
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.mp4"
                        />
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default TeacherResources;
