import { useState, useEffect } from 'react';
import { marketingService, Audience } from '../../services/marketingService';
import { marketingExportService } from '../../services/marketingExportService';
import { useAudiencesRealtime } from '../../hooks/useMarketingRealtime';
import { Card, Button, Icon, Badge, Modal, Input, Select } from '../shared/ui/CommonUI';

type AudienceType = 'Custom' | 'Lookalike' | 'Retargeting' | 'Behavioral';
type AudienceStatus = 'Building' | 'Ready' | 'Syncing' | 'Error';

export const AudienceManager: React.FC = () => {
    const [audiences, setAudiences] = useState<Audience[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAudience, setEditingAudience] = useState<Audience | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<AudienceType | 'All'>('All');
    const [syncingIds, setSyncingIds] = useState<Set<string>>(new Set());
    const [showExportMenu, setShowExportMenu] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        type: 'Custom' as AudienceType,
        source: '',
    });

    // Real-time subscription
    const { subscribe, unsubscribe, isSubscribed } = useAudiencesRealtime({
        autoFetch: false,
        onCreate: (record) => setAudiences(prev => [record, ...prev]),
        onUpdate: (record) => setAudiences(prev => prev.map(a => a.id === record.id ? record : a)),
        onDelete: (record) => setAudiences(prev => prev.filter(a => a.id !== record.id)),
    });

    useEffect(() => {
        loadAudiences();
        subscribe();
        return () => unsubscribe();
    }, []);

    const handleExport = (format: 'csv' | 'excel') => {
        if (format === 'csv') {
            marketingExportService.exportAudiencesToCSV(audiences);
        } else {
            marketingExportService.exportAudiencesToExcel(audiences);
        }
        setShowExportMenu(false);
    };

    const loadAudiences = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await marketingService.getAudiences();
            setAudiences(data);
        } catch (err) {
            setError('Failed to load audiences');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAudience = async () => {
        try {
            const newAudience = await marketingService.createAudience({
                name: formData.name,
                description: formData.description,
                type: formData.type,
                source: formData.source,
                criteria: {},
            });
            setAudiences(prev => [newAudience as Audience, ...prev]);
            closeModal();
        } catch (err) {
            setError('Failed to create audience');
            console.error(err);
        }
    };

    const handleUpdateAudience = async () => {
        if (!editingAudience) return;
        try {
            await marketingService.updateAudience(editingAudience.id, {
                name: formData.name,
                description: formData.description,
                type: formData.type,
                source: formData.source,
            });
            setAudiences(prev => prev.map(a => 
                a.id === editingAudience.id 
                    ? { ...a, ...formData } 
                    : a
            ));
            closeModal();
        } catch (err) {
            setError('Failed to update audience');
            console.error(err);
        }
    };

    const handleDeleteAudience = async (id: string) => {
        if (!confirm('Are you sure you want to delete this audience?')) return;
        try {
            await marketingService.deleteAudience(id);
            setAudiences(prev => prev.filter(a => a.id !== id));
        } catch (err) {
            setError('Failed to delete audience');
            console.error(err);
        }
    };

    const handleSyncAudience = async (id: string) => {
        setSyncingIds(prev => new Set(prev).add(id));
        try {
            await marketingService.syncAudience(id);
            setAudiences(prev => prev.map(a => 
                a.id === id ? { ...a, status: 'Syncing' as AudienceStatus } : a
            ));
            // Simulate sync completion after 3 seconds
            setTimeout(() => {
                setAudiences(prev => prev.map(a => 
                    a.id === id ? { ...a, status: 'Ready' as AudienceStatus, last_synced: new Date().toISOString() } : a
                ));
                setSyncingIds(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(id);
                    return newSet;
                });
            }, 3000);
        } catch (err) {
            setError('Failed to sync audience');
            setSyncingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(id);
                return newSet;
            });
            console.error(err);
        }
    };

    const openCreateModal = () => {
        setEditingAudience(null);
        setFormData({ name: '', description: '', type: 'Custom', source: '' });
        setIsModalOpen(true);
    };

    const openEditModal = (audience: Audience) => {
        setEditingAudience(audience);
        setFormData({
            name: audience.name,
            description: audience.description,
            type: audience.type,
            source: audience.source,
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingAudience(null);
        setFormData({ name: '', description: '', type: 'Custom', source: '' });
    };

    const getStatusBadge = (status: AudienceStatus) => {
        const config: Record<AudienceStatus, { variant: 'success' | 'warning' | 'info' | 'danger'; icon: string }> = {
            'Ready': { variant: 'success', icon: 'CheckCircleIcon' },
            'Building': { variant: 'warning', icon: 'ClockIcon' },
            'Syncing': { variant: 'info', icon: 'ArrowPathIcon' },
            'Error': { variant: 'danger', icon: 'ExclamationTriangleIcon' },
        };
        const { variant, icon } = config[status];
        return (
            <Badge variant={variant} className="flex items-center gap-1">
                <Icon name={icon} className={`w-3 h-3 ${status === 'Syncing' ? 'animate-spin' : ''}`} />
                {status}
            </Badge>
        );
    };

    const getTypeBadge = (type: AudienceType) => {
        const colors: Record<AudienceType, string> = {
            'Custom': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
            'Lookalike': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
            'Retargeting': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
            'Behavioral': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
        };
        return <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[type]}`}>{type}</span>;
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return 'Never';
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(hours / 24);
        
        if (hours < 1) return 'Just now';
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString();
    };

    const filteredAudiences = audiences.filter(audience => {
        const matchesSearch = audience.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            audience.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = filterType === 'All' || audience.type === filterType;
        return matchesSearch && matchesType;
    });

    // Calculate stats from audiences
    const totalSize = audiences.reduce((sum, a) => sum + a.size, 0);
    const readyCount = audiences.filter(a => a.status === 'Ready').length;
    const buildingCount = audiences.filter(a => a.status === 'Building' || a.status === 'Syncing').length;

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    <div className="h-10 w-36 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <Card key={i} className="p-4">
                            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
                            <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                        </Card>
                    ))}
                </div>
                <Card className="p-6">
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                        ))}
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">Audience Segments</h2>
                <div className="flex gap-2">
                    <Button variant="secondary" icon="ArrowPathIcon" onClick={loadAudiences}>
                        Refresh
                    </Button>
                    <Button variant="primary" icon="PlusCircleIcon" onClick={openCreateModal}>
                        Create Audience
                    </Button>
                </div>
            </div>

            {/* Error Alert */}
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-2">
                    <Icon name="ExclamationCircleIcon" className="w-5 h-5 text-red-500" />
                    <span className="text-red-700 dark:text-red-400">{error}</span>
                    <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">
                        <Icon name="XMarkIcon" className="w-5 h-5" />
                    </button>
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                <Card className="p-2 bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800">
                    <div className="text-[8px] text-blue-600 font-bold uppercase mb-0.5">Total Contacts</div>
                    <div className="text-base font-black text-gray-900 dark:text-white">
                        {totalSize.toLocaleString()}
                    </div>
                    <div className="text-[7px] text-gray-500 mt-0.5">Across {audiences.length} audiences</div>
                </Card>
                <Card className="p-2">
                    <div className="text-[8px] text-gray-500 font-bold uppercase mb-0.5">Active Audiences</div>
                    <div className="text-base font-black text-gray-900 dark:text-white">{readyCount}</div>
                    <div className="text-[7px] text-green-600 flex items-center mt-0.5">
                        <Icon name="CheckCircleIcon" className="w-2 h-2 mr-0.5" /> Ready to use
                    </div>
                </Card>
                <Card className="p-2">
                    <div className="text-[8px] text-gray-500 font-bold uppercase mb-0.5">Building/Syncing</div>
                    <div className="text-base font-black text-gray-900 dark:text-white">{buildingCount}</div>
                    <div className="text-[7px] text-yellow-600 flex items-center mt-0.5">
                        <Icon name="ClockIcon" className="w-2 h-2 mr-0.5" /> In progress
                    </div>
                </Card>
                <Card className="p-2">
                    <div className="text-[8px] text-gray-500 font-bold uppercase mb-0.5">Audience Types</div>
                    <div className="text-base font-black text-gray-900 dark:text-white">4</div>
                    <div className="text-[7px] text-gray-400 mt-0.5">Custom, Lookalike, Retargeting, Behavioral</div>
                </Card>
            </div>

            {/* Filters */}
            <Card className="p-2">
                <div className="flex flex-wrap gap-2">
                    <div className="flex-1 min-w-[200px]">
                        <Input
                            placeholder="Search audiences..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value as AudienceType | 'All')}
                        className="w-48"
                    >
                        <option value="All">All Types</option>
                        <option value="Custom">Custom</option>
                        <option value="Lookalike">Lookalike</option>
                        <option value="Retargeting">Retargeting</option>
                        <option value="Behavioral">Behavioral</option>
                    </Select>
                </div>
            </Card>

            {/* Audience Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {filteredAudiences.map((audience) => (
                    <Card key={audience.id} className="p-2.5 hover:shadow-lg transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white text-sm">{audience.name}</h3>
                                <p className="text-[9px] text-gray-500 dark:text-gray-400 mt-0.5">{audience.description}</p>
                            </div>
                            {getStatusBadge(audience.status)}
                        </div>

                        <div className="space-y-1.5 mb-2">
                            <div className="flex justify-between items-center">
                                <span className="text-[9px] text-gray-500">Type</span>
                                {getTypeBadge(audience.type)}
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[9px] text-gray-500">Size</span>
                                <span className="font-bold text-[10px] text-gray-900 dark:text-white">
                                    {audience.size.toLocaleString()}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[9px] text-gray-500">Source</span>
                                <span className="text-[9px] text-gray-700 dark:text-gray-300">{audience.source}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[9px] text-gray-500">Last Synced</span>
                                <span className="text-[9px] text-gray-700 dark:text-gray-300">
                                    {formatDate(audience.last_synced)}
                                </span>
                            </div>
                        </div>

                        <div className="flex gap-1 pt-1.5 border-t border-gray-100 dark:border-gray-700">
                            <Button 
                                size="sm" 
                                variant="ghost" 
                                icon="PencilIcon"
                                onClick={() => openEditModal(audience)}
                            >
                                Edit
                            </Button>
                            <Button 
                                size="sm" 
                                variant="ghost" 
                                icon="ArrowPathIcon"
                                onClick={() => handleSyncAudience(audience.id)}
                                disabled={syncingIds.has(audience.id)}
                                className={syncingIds.has(audience.id) ? 'animate-pulse' : ''}
                            >
                                {syncingIds.has(audience.id) ? 'Syncing...' : 'Sync'}
                            </Button>
                            <Button 
                                size="sm" 
                                variant="ghost" 
                                icon="TrashIcon"
                                onClick={() => handleDeleteAudience(audience.id)}
                                className="text-red-500 hover:text-red-700 ml-auto"
                            >
                                Delete
                            </Button>
                        </div>
                    </Card>
                ))}
            </div>

            {filteredAudiences.length === 0 && !loading && (
                <Card className="p-12 text-center">
                    <Icon name="UsersIcon" className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No audiences found</h3>
                    <p className="text-gray-500 mb-4">
                        {searchQuery || filterType !== 'All' 
                            ? 'Try adjusting your search or filters'
                            : 'Create your first audience to get started'}
                    </p>
                    <Button variant="primary" icon="PlusCircleIcon" onClick={openCreateModal}>
                        Create Audience
                    </Button>
                </Card>
            )}

            {/* Create/Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={editingAudience ? 'Edit Audience' : 'Create New Audience'}
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Audience Name *
                        </label>
                        <Input
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="e.g., High-Value Customers"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Description
                        </label>
                        <Input
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="e.g., Customers with LTV > $500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Type *
                        </label>
                        <Select
                            value={formData.type}
                            onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as AudienceType }))}
                        >
                            <option value="Custom">Custom</option>
                            <option value="Lookalike">Lookalike</option>
                            <option value="Retargeting">Retargeting</option>
                            <option value="Behavioral">Behavioral</option>
                        </Select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Source
                        </label>
                        <Select
                            value={formData.source}
                            onChange={(e) => setFormData(prev => ({ ...prev, source: e.target.value }))}
                        >
                            <option value="">Select source...</option>
                            <option value="CRM">CRM</option>
                            <option value="Website">Website</option>
                            <option value="Facebook">Facebook</option>
                            <option value="Google">Google Ads</option>
                            <option value="Analytics">Analytics</option>
                            <option value="API">API Import</option>
                        </Select>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="secondary" onClick={closeModal}>
                            Cancel
                        </Button>
                        <Button 
                            variant="primary" 
                            onClick={editingAudience ? handleUpdateAudience : handleCreateAudience}
                            disabled={!formData.name}
                        >
                            {editingAudience ? 'Save Changes' : 'Create Audience'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
