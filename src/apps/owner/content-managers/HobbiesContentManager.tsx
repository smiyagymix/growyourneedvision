import React, { useState, useEffect } from 'react';
import { Card, Button, Icon, Modal } from '../../../components/shared/ui/CommonUI';
import { hobbiesService } from '../../../services/hobbiesService';
import { useToast } from '../../../hooks/useToast';

export const HobbiesContentManager: React.FC = () => {
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState<'resources'>('resources'); // Only resources for admin usually, but maybe projects too? Let's stick to resources for global content
    const [resources, setResources] = useState<any[]>([]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: 'Arts & Crafts',
        resource_type: 'Tutorial',
        url: '',
        rating: 5
    });

    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await hobbiesService.getResources();
            setResources(data);
        } catch (error) {
            showToast('Failed to load resources', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleAddResource = async () => {
        try {
            await hobbiesService.createResource(formData); 
            showToast('Resource added successfully!', 'success');
            setIsAddModalOpen(false);
            setFormData({
                title: '',
                description: '',
                category: 'Arts & Crafts',
                resource_type: 'Tutorial',
                url: '',
                rating: 5
            });
            loadData();
        } catch (error) {
            showToast('Failed to add resource', 'error');
        }
    };

    const handleDeleteResource = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this resource?')) {
            try {
                await hobbiesService.deleteResource(id);
                showToast('Resource deleted successfully', 'success');
                loadData();
            } catch (error) {
                showToast('Failed to delete resource', 'error');
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Hobbies Management</h2>
                <Button variant="primary" onClick={() => setIsAddModalOpen(true)}>
                    <Icon name="plus" className="w-4 h-4 mr-2" />
                    Add Resource
                </Button>
            </div>

            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab('resources')}
                        className={`${
                            activeTab === 'resources'
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                        Resources
                    </button>
                </nav>
            </div>

            <Card>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">URL</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-4 text-center">Loading...</td>
                                </tr>
                            ) : resources.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">No resources found</td>
                                </tr>
                            ) : (
                                resources.map((resource) => (
                                    <tr key={resource.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{resource.title}</div>
                                            <div className="text-sm text-gray-500">{resource.description?.substring(0, 50)}...</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                {resource.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {resource.resource_type}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-500">
                                            <a href={resource.url} target="_blank" rel="noopener noreferrer">Link</a>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button 
                                                onClick={() => handleDeleteResource(resource.id)}
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
                title="Add New Resource"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Title</label>
                        <input
                            type="text"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Category</label>
                        <select
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        >
                            <option value="Arts & Crafts">Arts & Crafts</option>
                            <option value="Collections">Collections</option>
                            <option value="Gaming">Gaming</option>
                            <option value="Music">Music</option>
                            <option value="Sports">Sports</option>
                            <option value="Technology">Technology</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Type</label>
                        <select
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            value={formData.resource_type}
                            onChange={(e) => setFormData({ ...formData, resource_type: e.target.value })}
                        >
                            <option value="Tutorial">Tutorial</option>
                            <option value="Tool">Tool</option>
                            <option value="Article">Article</option>
                            <option value="Video">Video</option>
                            <option value="Community">Community</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">URL</label>
                        <input
                            type="url"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            value={formData.url}
                            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                        <textarea
                            rows={3}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>
                    <div className="flex justify-end space-x-3 mt-6">
                        <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="primary" onClick={handleAddResource}>
                            Add Resource
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
