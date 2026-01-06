import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Icon, Badge, Modal, Input, Select, Skeleton } from '../shared/ui/CommonUI';
import { marketingService, Campaign } from '../../services/marketingService';
import { marketingExportService } from '../../services/marketingExportService';
import { useCampaignsRealtime } from '../../hooks/useMarketingRealtime';

type CampaignStatus = 'Active' | 'Paused' | 'Completed' | 'Draft' | 'Scheduled';
type CampaignType = 'Email' | 'Social' | 'Display' | 'Search';

interface CampaignFormData {
    name: string;
    type: CampaignType;
    budget: number;
    start_date: string;
    end_date: string;
}

const initialFormData: CampaignFormData = {
    name: '',
    type: 'Email',
    budget: 5000,
    start_date: '',
    end_date: '',
};

export const CampaignsDashboard: React.FC = () => {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
    const [formData, setFormData] = useState<CampaignFormData>(initialFormData);
    const [saving, setSaving] = useState(false);
    const [filterStatus, setFilterStatus] = useState<CampaignStatus | 'All'>('All');
    const [searchQuery, setSearchQuery] = useState('');

    // Real-time subscription
    const { subscribe, unsubscribe, isSubscribed } = useCampaignsRealtime({
        autoFetch: false,
        onCreate: (record) => setCampaigns(prev => [record, ...prev]),
        onUpdate: (record) => {
            setCampaigns(prev => prev.map(c => c.id === record.id ? record : c));
            if (selectedCampaign?.id === record.id) setSelectedCampaign(record);
        },
        onDelete: (record) => setCampaigns(prev => prev.filter(c => c.id !== record.id)),
    });

    const fetchCampaigns = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await marketingService.getCampaigns();
            setCampaigns(data);
        } catch (err) {
            setError('Failed to load campaigns');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCampaigns();
        subscribe();
        return () => unsubscribe();
    }, [fetchCampaigns, subscribe, unsubscribe]);

    const handleCreateCampaign = async () => {
        if (!formData.name.trim()) return;
        setSaving(true);
        try {
            const newCampaign = await marketingService.createCampaign({
                ...formData,
                status: 'Draft',
                spent: 0,
                impressions: 0,
                clicks: 0,
                conversions: 0,
                performance_score: 0,
            });
            setCampaigns(prev => [newCampaign as Campaign, ...prev]);
            setShowCreateModal(false);
            setFormData(initialFormData);
        } catch (err) {
            console.error('Failed to create campaign:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateStatus = async (campaignId: string, status: CampaignStatus) => {
        try {
            await marketingService.updateCampaign(campaignId, { status });
            setCampaigns(prev => prev.map(c => c.id === campaignId ? { ...c, status } : c));
        } catch (err) {
            console.error('Failed to update campaign:', err);
        }
    };

    const handleDeleteCampaign = async (campaignId: string) => {
        if (!confirm('Are you sure you want to delete this campaign?')) return;
        try {
            await marketingService.deleteCampaign(campaignId);
            setCampaigns(prev => prev.filter(c => c.id !== campaignId));
        } catch (err) {
            console.error('Failed to delete campaign:', err);
        }
    };

    const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
        const filteredCampaigns = getFilteredCampaigns();
        switch (format) {
            case 'csv':
                marketingExportService.exportCampaignsToCSV(filteredCampaigns);
                break;
            case 'excel':
                marketingExportService.exportCampaignsToExcel(filteredCampaigns);
                break;
            case 'pdf':
                marketingExportService.exportCampaignsToPDF(filteredCampaigns);
                break;
        }
        setShowExportMenu(false);
    };

    const getFilteredCampaigns = () => {
        return campaigns.filter(c => {
            const matchesStatus = filterStatus === 'All' || c.status === filterStatus;
            const matchesSearch = !searchQuery || 
                c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                c.type.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesStatus && matchesSearch;
        });
    };

    const getStatusBadge = (status: CampaignStatus): 'success' | 'warning' | 'default' | 'primary' | 'danger' => {
        switch (status) {
            case 'Active': return 'success';
            case 'Paused': return 'warning';
            case 'Scheduled': return 'primary';
            case 'Completed': return 'default';
            case 'Draft': return 'default';
            default: return 'default';
        }
    };

    const getTypeIcon = (type: CampaignType): string => {
        switch (type) {
            case 'Email': return 'EnvelopeIcon';
            case 'Social': return 'ShareIcon';
            case 'Display': return 'PhotoIcon';
            case 'Search': return 'MagnifyingGlassIcon';
            default: return 'MegaphoneIcon';
        }
    };

    // Calculate stats
    const stats = {
        total: campaigns.length,
        active: campaigns.filter(c => c.status === 'Active').length,
        totalBudget: campaigns.reduce((sum, c) => sum + c.budget, 0),
        totalSpent: campaigns.reduce((sum, c) => sum + c.spent, 0),
        totalConversions: campaigns.reduce((sum, c) => sum + c.conversions, 0),
        avgPerformance: campaigns.length > 0 
            ? Math.round(campaigns.reduce((sum, c) => sum + c.performance_score, 0) / campaigns.length)
            : 0,
    };

    const filteredCampaigns = getFilteredCampaigns();

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-8 w-64" />
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
                </div>
                <Skeleton className="h-96 rounded-xl" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <Icon name="ExclamationCircleIcon" className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">{error}</p>
                    <Button variant="primary" onClick={fetchCampaigns} className="mt-4">Retry</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-2 animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                    <h2 className="text-sm font-bold text-gray-900 dark:text-white">Campaigns</h2>
                    <p className="text-gray-500 text-[9px] mt-0.5 flex items-center gap-1">
                        Manage and monitor your marketing campaigns
                        {isSubscribed && (
                            <span className="flex items-center gap-1 text-green-500 text-xs">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                Live
                            </span>
                        )}
                    </p>
                </div>
                <div className="flex gap-2">
                    <div className="relative">
                        <Button variant="secondary" icon="ArrowDownTrayIcon" onClick={() => setShowExportMenu(!showExportMenu)}>
                            Export
                        </Button>
                        {showExportMenu && (
                            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                                <button onClick={() => handleExport('csv')} className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-sm rounded-t-lg">
                                    Export as CSV
                                </button>
                                <button onClick={() => handleExport('excel')} className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-sm">
                                    Export as Excel
                                </button>
                                <button onClick={() => handleExport('pdf')} className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-sm rounded-b-lg">
                                    Export as PDF
                                </button>
                            </div>
                        )}
                    </div>
                    <Button variant="primary" icon="PlusIcon" onClick={() => setShowCreateModal(true)}>
                        Create Campaign
                    </Button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                <Card className="p-2 bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-gray-800">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-blue-100 dark:bg-blue-800/30 rounded-lg flex items-center justify-center">
                            <Icon name="MegaphoneIcon" className="w-3 h-3 text-blue-600" />
                        </div>
                        <div>
                            <div className="text-base font-bold text-gray-900 dark:text-white">{stats.total}</div>
                            <div className="text-[8px] text-gray-500 uppercase font-medium">Total Campaigns</div>
                        </div>
                    </div>
                </Card>
                <Card className="p-2 bg-gradient-to-br from-green-50 to-white dark:from-green-900/20 dark:to-gray-800">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-green-100 dark:bg-green-800/30 rounded-lg flex items-center justify-center">
                            <Icon name="PlayIcon" className="w-3 h-3 text-green-600" />
                        </div>
                        <div>
                            <div className="text-base font-bold text-gray-900 dark:text-white">{stats.active}</div>
                            <div className="text-[8px] text-gray-500 uppercase font-medium">Active</div>
                        </div>
                    </div>
                </Card>
                <Card className="p-2 bg-gradient-to-br from-purple-50 to-white dark:from-purple-900/20 dark:to-gray-800">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-purple-100 dark:bg-purple-800/30 rounded-lg flex items-center justify-center">
                            <Icon name="CurrencyDollarIcon" className="w-3 h-3 text-purple-600" />
                        </div>
                        <div>
                            <div className="text-base font-bold text-gray-900 dark:text-white">
                                ${stats.totalSpent.toLocaleString()}
                            </div>
                            <div className="text-[8px] text-gray-500 uppercase font-medium">Total Spent</div>
                        </div>
                    </div>
                </Card>
                <Card className="p-2 bg-gradient-to-br from-orange-50 to-white dark:from-orange-900/20 dark:to-gray-800">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-orange-100 dark:bg-orange-800/30 rounded-lg flex items-center justify-center">
                            <Icon name="ChartBarIcon" className="w-3 h-3 text-orange-600" />
                        </div>
                        <div>
                            <div className="text-base font-bold text-gray-900 dark:text-white">{stats.avgPerformance}%</div>
                            <div className="text-[8px] text-gray-500 uppercase font-medium">Avg Performance</div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-2">
                <Input
                    type="text"
                    placeholder="Search campaigns..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full sm:w-64"
                />
                <Select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as CampaignStatus | 'All')}
                    className="w-full sm:w-48"
                >
                    <option value="All">All Status</option>
                    <option value="Active">Active</option>
                    <option value="Paused">Paused</option>
                    <option value="Draft">Draft</option>
                    <option value="Scheduled">Scheduled</option>
                    <option value="Completed">Completed</option>
                </Select>
            </div>

            {/* Campaigns List */}
            {filteredCampaigns.length === 0 ? (
                <Card className="p-12 text-center">
                    <Icon name="MegaphoneIcon" className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No campaigns found</h3>
                    <p className="text-gray-500 mb-4">
                        {searchQuery || filterStatus !== 'All' 
                            ? 'Try adjusting your filters' 
                            : 'Create your first campaign to get started'}
                    </p>
                    <Button variant="primary" icon="PlusIcon" onClick={() => setShowCreateModal(true)}>
                        Create Campaign
                    </Button>
                </Card>
            ) : (
                <div className="space-y-2">
                    {filteredCampaigns.map(campaign => (
                        <Card 
                            key={campaign.id} 
                            className="p-3 hover:shadow-lg transition-shadow"
                        >
                            <div className="flex flex-col lg:flex-row justify-between gap-2">
                                <div className="flex items-start gap-2">
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                                        campaign.status === 'Active' 
                                            ? 'bg-green-100 text-green-600 dark:bg-green-800/30' 
                                            : 'bg-gray-100 text-gray-600 dark:bg-gray-800'
                                    }`}>
                                        <Icon name={getTypeIcon(campaign.type)} className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 dark:text-white text-sm">{campaign.name}</h3>
                                        <div className="flex items-center gap-1 mt-0.5">
                                            <Badge variant={getStatusBadge(campaign.status)}>{campaign.status}</Badge>
                                            <span className="text-sm text-gray-500">{campaign.type}</span>
                                            {campaign.start_date && (
                                                <span className="text-xs text-gray-400">
                                                    Started {new Date(campaign.start_date).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Metrics */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    <div className="text-center">
                                        <div className="text-sm font-bold text-gray-900 dark:text-white">
                                            ${campaign.spent.toLocaleString()}
                                        </div>
                                        <div className="text-[8px] text-gray-500">
                                            of ${campaign.budget.toLocaleString()}
                                        </div>
                                        <div className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full mt-0.5">
                                            <div 
                                                className="h-full bg-blue-500 rounded-full"
                                                style={{ width: `${Math.min((campaign.spent / campaign.budget) * 100, 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-sm font-bold text-gray-900 dark:text-white">
                                            {campaign.impressions.toLocaleString()}
                                        </div>
                                        <div className="text-[8px] text-gray-500">Impressions</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-sm font-bold text-gray-900 dark:text-white">
                                            {campaign.clicks.toLocaleString()}
                                        </div>
                                        <div className="text-[8px] text-gray-500">
                                            Clicks ({campaign.impressions > 0 
                                                ? ((campaign.clicks / campaign.impressions) * 100).toFixed(1) 
                                                : 0}%)
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-sm font-bold text-gray-900 dark:text-white">
                                            {campaign.conversions.toLocaleString()}
                                        </div>
                                        <div className="text-[8px] text-gray-500">
                                            Conv ({campaign.clicks > 0 
                                                ? ((campaign.conversions / campaign.clicks) * 100).toFixed(1) 
                                                : 0}%)
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2">
                                    {campaign.status === 'Draft' && (
                                        <Button 
                                            size="sm" 
                                            variant="primary" 
                                            icon="PlayIcon"
                                            onClick={() => handleUpdateStatus(campaign.id, 'Active')}
                                        >
                                            Launch
                                        </Button>
                                    )}
                                    {campaign.status === 'Active' && (
                                        <Button 
                                            size="sm" 
                                            variant="secondary" 
                                            icon="PauseIcon"
                                            onClick={() => handleUpdateStatus(campaign.id, 'Paused')}
                                        >
                                            Pause
                                        </Button>
                                    )}
                                    {campaign.status === 'Paused' && (
                                        <Button 
                                            size="sm" 
                                            variant="primary" 
                                            icon="PlayIcon"
                                            onClick={() => handleUpdateStatus(campaign.id, 'Active')}
                                        >
                                            Resume
                                        </Button>
                                    )}
                                    <Button 
                                        size="sm" 
                                        variant="ghost" 
                                        icon="TrashIcon"
                                        onClick={() => handleDeleteCampaign(campaign.id)}
                                    />
                                </div>
                            </div>

                            {/* Performance bar */}
                            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                                <div className="flex items-center justify-between text-sm mb-2">
                                    <span className="text-gray-500">Performance Score</span>
                                    <span className={`font-bold ${
                                        campaign.performance_score >= 80 ? 'text-green-600' :
                                        campaign.performance_score >= 50 ? 'text-yellow-600' : 'text-red-600'
                                    }`}>
                                        {campaign.performance_score}%
                                    </span>
                                </div>
                                <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full rounded-full transition-all ${
                                            campaign.performance_score >= 80 ? 'bg-green-500' :
                                            campaign.performance_score >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                        }`}
                                        style={{ width: `${campaign.performance_score}%` }}
                                    />
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Create Campaign Modal */}
            <Modal 
                isOpen={showCreateModal} 
                onClose={() => setShowCreateModal(false)} 
                title="Create New Campaign"
            >
                <div className="space-y-4">
                    <Input
                        label="Campaign Name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Summer Sale 2024"
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Campaign Type
                            </label>
                            <Select
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value as CampaignType })}
                            >
                                <option value="Email">Email</option>
                                <option value="Social">Social Media</option>
                                <option value="Display">Display Ads</option>
                                <option value="Search">Search Ads</option>
                            </Select>
                        </div>
                        <Input
                            label="Budget ($)"
                            type="number"
                            value={formData.budget}
                            onChange={(e) => setFormData({ ...formData, budget: parseInt(e.target.value) || 0 })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Start Date"
                            type="date"
                            value={formData.start_date}
                            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                        />
                        <Input
                            label="End Date"
                            type="date"
                            value={formData.end_date}
                            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="ghost" onClick={() => setShowCreateModal(false)}>
                            Cancel
                        </Button>
                        <Button 
                            variant="primary" 
                            onClick={handleCreateCampaign}
                            disabled={!formData.name.trim() || saving}
                        >
                            {saving ? 'Creating...' : 'Create Campaign'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
