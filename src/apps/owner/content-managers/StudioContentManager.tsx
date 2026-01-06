import React, { useState, useEffect } from 'react';
import { Card, Button, Icon, Modal } from '../../../components/shared/ui/CommonUI';
import { assetService } from '../../../services/assetService';
import { useToast } from '../../../hooks/useToast';
import { useAuth } from '../../../context/AuthContext';
import { SkeletonTable } from '../../../components/shared/ui/SkeletonLoaders';

export const StudioContentManager: React.FC = () => {
    const { showToast } = useToast();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'assets' | 'projects'>('assets');
    const [assets, setAssets] = useState<any[]>([]);
    const [projects, setProjects] = useState<any[]>([]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const [projectFormData, setProjectFormData] = useState({
        title: '',
        description: '',
        status: 'Draft'
    });

    const [assetFormData, setAssetFormData] = useState<{
        title: string;
        type: string;
        tags: string;
        file?: File;
    }>({
        title: '',
        type: 'Image',
        tags: '',
        file: undefined
    });

    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'assets') {
                const data = await assetService.getAssets();
                setAssets(data);
            } else {
                const data = await assetService.getProjects();
                setProjects(data);
            }
        } catch (error) {
            showToast('Failed to load data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleAddProject = async () => {
        if (!user) return;
        try {
            await assetService.createProject({
                ...projectFormData,
                owner: user.id
            });
            showToast('Project added successfully!', 'success');
            setIsAddModalOpen(false);
            setProjectFormData({
                title: '',
                description: '',
                status: 'Draft'
            });
            loadData();
        } catch (error) {
            showToast('Failed to add project', 'error');
        }
    };

    const handleAddAsset = async () => {
        if (!user || !assetFormData.file) return;
        try {
            setLoading(true);
            
            // Create asset with file upload
            const { file, ...assetData } = assetFormData;
            await assetService.createAsset({
                ...assetData,
                type: assetData.type as 'Image' | 'Video' | 'Document',
                tags: assetData.tags.split(',').map(t => t.trim()),
                size: file.size,
                file: file
            });
            
            showToast('Asset uploaded successfully!', 'success');
            setIsAddModalOpen(false);
            setAssetFormData({
                title: '',
                type: 'Image',
                tags: '',
                file: undefined
            });
            loadData();
        } catch (error) {
            showToast('Failed to upload asset', 'error');
            console.error('Asset upload error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteProject = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this project?')) {
            try {
                await assetService.deleteProject(id);
                showToast('Project deleted successfully', 'success');
                loadData();
            } catch (error) {
                showToast('Failed to delete project', 'error');
            }
        }
    };

    const handleDeleteAsset = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this asset?')) {
            try {
                await assetService.deleteAsset(id);
                showToast('Asset deleted successfully', 'success');
                loadData();
            } catch (error) {
                showToast('Failed to delete asset', 'error');
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Studio Management</h2>
                <Button variant="primary" onClick={() => setIsAddModalOpen(true)}>
                    <Icon name="plus" className="w-4 h-4 mr-2" />
                    Add {activeTab === 'assets' ? 'Asset' : 'Project'}
                </Button>
            </div>

            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab('assets')}
                        className={`${
                            activeTab === 'assets'
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                        Assets
                    </button>
                    <button
                        onClick={() => setActiveTab('projects')}
                        className={`${
                            activeTab === 'projects'
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                        Projects
                    </button>
                </nav>
            </div>

            <Card>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type/Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="p-0">
                                        <SkeletonTable rows={3} columns={4} />
                                    </td>
                                </tr>
                            ) : (activeTab === 'assets' ? assets : projects).length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-4 text-center text-gray-500">No items found</td>
                                </tr>
                            ) : (
                                (activeTab === 'assets' ? assets : projects).map((item) => (
                                    <tr key={item.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{item.title}</div>
                                            {activeTab === 'projects' && <div className="text-sm text-gray-500">{item.description?.substring(0, 50)}...</div>}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                                {activeTab === 'assets' ? item.type : item.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(item.created).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button 
                                                onClick={() => activeTab === 'assets' ? handleDeleteAsset(item.id) : handleDeleteProject(item.id)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title={`Add New ${activeTab === 'assets' ? 'Asset' : 'Project'}`}
            >
                <div className="space-y-4">
                    {activeTab === 'projects' ? (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Title</label>
                                <input
                                    type="text"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    value={projectFormData.title}
                                    onChange={(e) => setProjectFormData({ ...projectFormData, title: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Status</label>
                                <select
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    value={projectFormData.status}
                                    onChange={(e) => setProjectFormData({ ...projectFormData, status: e.target.value })}
                                >
                                    <option value="Draft">Draft</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Completed">Completed</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Description</label>
                                <textarea
                                    rows={3}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    value={projectFormData.description}
                                    onChange={(e) => setProjectFormData({ ...projectFormData, description: e.target.value })}
                                />
                            </div>
                        </>
                    ) : (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Title</label>
                                <input
                                    type="text"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    value={assetFormData.title}
                                    onChange={(e) => setAssetFormData({ ...assetFormData, title: e.target.value })}
                                    aria-label="Asset title"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Type</label>
                                <select
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    value={assetFormData.type}
                                    onChange={(e) => setAssetFormData({ ...assetFormData, type: e.target.value })}
                                    aria-label="Asset type"
                                >
                                    <option value="Image">Image</option>
                                    <option value="Video">Video</option>
                                    <option value="Audio">Audio</option>
                                    <option value="Template">Template</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Tags (comma-separated)</label>
                                <input
                                    type="text"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    value={assetFormData.tags}
                                    onChange={(e) => setAssetFormData({ ...assetFormData, tags: e.target.value })}
                                    placeholder="design, template, modern"
                                    aria-label="Asset tags"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">File Upload</label>
                                <input
                                    type="file"
                                    className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            setAssetFormData({ ...assetFormData, file });
                                        }
                                    }}
                                    aria-label="Upload asset file"
                                    accept="image/*,video/*,audio/*,.psd,.ai,.fig"
                                />
                                <p className="mt-1 text-xs text-gray-500">Supports images, videos, audio, and design files</p>
                            </div>
                        </>
                    )}
                    
                    <div className="flex justify-end space-x-3 mt-6">
                        <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
                            Cancel
                        </Button>
                        {activeTab === 'projects' ? (
                            <Button 
                                variant="primary" 
                                onClick={handleAddProject}
                                disabled={!projectFormData.title}
                                aria-label="Add new project"
                            >
                                Add Project
                            </Button>
                        ) : (
                            <Button 
                                variant="primary" 
                                onClick={handleAddAsset}
                                disabled={!assetFormData.title || !assetFormData.file}
                                aria-label="Add new asset"
                            >
                                Add Asset
                            </Button>
                        )}
                    </div>
                </div>
            </Modal>
        </div>
    );
};
