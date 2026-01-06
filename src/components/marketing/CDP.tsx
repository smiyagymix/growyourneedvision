import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Icon, Badge, Avatar, Modal, Input, Skeleton } from '../shared/ui/CommonUI';
import { marketingService, CustomerProfile } from '../../services/marketingService';
import { marketingExportService } from '../../services/marketingExportService';
import { useCustomerProfilesRealtime } from '../../hooks/useMarketingRealtime';

interface CDPStats {
    totalProfiles: number;
    activeProfiles: number;
    newProfilesThisWeek: number;
    avgEngagementScore: number;
    dataQuality: number;
    eventsProcessed: number;
    segmentsCount: number;
    syncStatus: 'Healthy' | 'Error';
}

export const CDP: React.FC = () => {
    const [profiles, setProfiles] = useState<CustomerProfile[]>([]);
    const [stats, setStats] = useState<CDPStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedProfile, setSelectedProfile] = useState<CustomerProfile | null>(null);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [showTagModal, setShowTagModal] = useState(false);
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [newTag, setNewTag] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [error, setError] = useState<string | null>(null);

    // Real-time subscription for profiles
    const { subscribe, unsubscribe, isSubscribed } = useCustomerProfilesRealtime({
        autoFetch: false,
        onCreate: (record) => setProfiles(prev => [record, ...prev].slice(0, 10)),
        onUpdate: (record) => {
            setProfiles(prev => prev.map(p => p.id === record.id ? record : p));
            if (selectedProfile?.id === record.id) setSelectedProfile(record);
        },
        onDelete: (record) => setProfiles(prev => prev.filter(p => p.id !== record.id)),
    });

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const filter = searchQuery ? `name ~ "${searchQuery}" || email ~ "${searchQuery}"` : '';
            const [profilesData, statsData] = await Promise.all([
                marketingService.getCustomerProfiles(page, 10, filter),
                marketingService.getCDPStats()
            ]);
            setProfiles(profilesData.items);
            setTotalPages(profilesData.totalPages);
            setStats(statsData);
        } catch (err) {
            setError('Failed to load data');
            console.error('CDP fetch error:', err);
        } finally {
            setLoading(false);
        }
    }, [page, searchQuery]);

    useEffect(() => {
        fetchData();
        subscribe(); // Enable real-time updates
        return () => unsubscribe();
    }, [fetchData, subscribe, unsubscribe]);

    const handleExport = (format: 'csv' | 'excel') => {
        if (format === 'csv') {
            marketingExportService.exportCustomerProfilesToCSV(profiles);
        } else {
            marketingExportService.exportCustomerProfilesToExcel(profiles);
        }
        setShowExportMenu(false);
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchData();
    };

    const handleProfileClick = (profile: CustomerProfile) => {
        setSelectedProfile(profile);
        setShowProfileModal(true);
    };

    const handleAddTag = async () => {
        if (!selectedProfile || !newTag.trim()) return;
        try {
            const updatedTags = [...selectedProfile.tags, newTag.trim()];
            await marketingService.updateCustomerProfile(selectedProfile.id, { tags: updatedTags });
            setSelectedProfile({ ...selectedProfile, tags: updatedTags });
            setProfiles(profiles.map(p => p.id === selectedProfile.id ? { ...p, tags: updatedTags } : p));
            setNewTag('');
            setShowTagModal(false);
        } catch (err) {
            console.error('Failed to add tag:', err);
        }
    };

    const handleRemoveTag = async (tagToRemove: string) => {
        if (!selectedProfile) return;
        try {
            const updatedTags = selectedProfile.tags.filter(t => t !== tagToRemove);
            await marketingService.updateCustomerProfile(selectedProfile.id, { tags: updatedTags });
            setSelectedProfile({ ...selectedProfile, tags: updatedTags });
            setProfiles(profiles.map(p => p.id === selectedProfile.id ? { ...p, tags: updatedTags } : p));
        } catch (err) {
            console.error('Failed to remove tag:', err);
        }
    };

    const formatNumber = (num: number) => num.toLocaleString();

    const getTimeAgo = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 60) return `${diffMins}m ago`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays}d ago`;
    };

    if (error) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <Icon name="ExclamationCircleIcon" className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">{error}</p>
                    <Button variant="primary" onClick={fetchData} className="mt-4">Retry</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-sm font-bold text-gray-900 dark:text-white">Customer Data Platform (CDP)</h2>
                    {isSubscribed && (
                        <p className="text-xs text-green-500 flex items-center gap-1 mt-1">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            Live updates enabled
                        </p>
                    )}
                </div>
                <div className="flex gap-2">
                    <div className="relative">
                        <Button variant="secondary" icon="ArrowDownTrayIcon" onClick={() => setShowExportMenu(!showExportMenu)}>
                            Export Audience
                        </Button>
                        {showExportMenu && (
                            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                                <button onClick={() => handleExport('csv')} className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-sm">
                                    Export as CSV
                                </button>
                                <button onClick={() => handleExport('excel')} className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-sm">
                                    Export as Excel
                                </button>
                            </div>
                        )}
                    </div>
                    <Button variant="primary" icon="PlusCircleIcon">Add Source</Button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {loading && !stats ? (
                    <>
                        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
                    </>
                ) : (
                    <>
                        <Card className="p-4 bg-indigo-50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-800">
                            <div className="text-sm text-indigo-600 font-bold uppercase mb-1">Total Profiles</div>
                            <div className="text-3xl font-black text-gray-900 dark:text-white">{formatNumber(stats?.totalProfiles || 0)}</div>
                            <div className="text-xs text-green-600 flex items-center mt-1">
                                <Icon name="ArrowTrendingUpIcon" className="w-3 h-3 mr-1" /> +{formatNumber(stats?.newProfilesThisWeek || 0)} this week
                            </div>
                        </Card>
                        <Card className="p-4">
                            <div className="text-sm text-gray-500 font-bold uppercase mb-1">Data Quality</div>
                            <div className="text-3xl font-black text-gray-900 dark:text-white">{stats?.dataQuality || 0}%</div>
                            <div className="text-xs text-gray-400 mt-1">High confidence matches</div>
                        </Card>
                        <Card className="p-4">
                            <div className="text-sm text-gray-500 font-bold uppercase mb-1">Segments</div>
                            <div className="text-3xl font-black text-gray-900 dark:text-white">{stats?.segmentsCount || 0}</div>
                            <div className="text-xs text-gray-400 mt-1">Active segments</div>
                        </Card>
                        <Card className="p-4">
                            <div className="text-sm text-gray-500 font-bold uppercase mb-1">Avg Engagement</div>
                            <div className="text-3xl font-black text-gray-900 dark:text-white">{stats?.avgEngagementScore || 0}%</div>
                            <div className="text-xs text-gray-400 mt-1">Engagement score</div>
                        </Card>
                    </>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
                {/* Profiles List */}
                <Card className="lg:col-span-2 p-3">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-sm text-gray-800 dark:text-white">Customer Profiles</h3>
                        <form onSubmit={handleSearch} className="flex gap-2">
                            <Input
                                type="text"
                                placeholder="Search profiles..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-64"
                            />
                            <Button type="submit" variant="secondary" size="sm">Search</Button>
                        </form>
                    </div>

                    {loading ? (
                        <div className="space-y-4">
                            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
                        </div>
                    ) : profiles.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <Icon name="UsersIcon" className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>No profiles found</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {profiles.map((profile) => (
                                <div
                                    key={profile.id}
                                    onClick={() => handleProfileClick(profile)}
                                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl hover:bg-white dark:hover:bg-gray-800 shadow-sm transition-all cursor-pointer group border border-transparent hover:border-gray-100 dark:hover:border-gray-700"
                                >
                                    <div className="flex items-center gap-4">
                                        <Avatar initials={profile.name.split(' ').map(n => n[0]).join('').slice(0, 2)} />
                                        <div>
                                            <div className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                                {profile.name}
                                                {profile.engagement_score >= 90 && <Badge variant="success">VIP</Badge>}
                                                {profile.segments.includes('At Risk') && <Badge variant="danger">At Risk</Badge>}
                                            </div>
                                            <div className="text-sm text-gray-500">{profile.email} • {profile.company || 'Individual'}</div>
                                            <div className="flex gap-1 mt-1">
                                                {profile.tags.slice(0, 3).map(tag => (
                                                    <span key={tag} className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">{tag}</span>
                                                ))}
                                                {profile.tags.length > 3 && <span className="text-xs text-gray-400">+{profile.tags.length - 3}</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-bold text-gray-900 dark:text-white">${formatNumber(profile.ltv)} LTV</div>
                                        <div className="text-xs text-gray-500">Last active: {getTimeAgo(profile.last_activity)}</div>
                                        <div className="text-xs text-gray-400">{profile.events_count} events</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-center gap-2 mt-6">
                            <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                            <span className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">Page {page} of {totalPages}</span>
                            <Button variant="secondary" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
                        </div>
                    )}
                </Card>

                {/* Pipeline Health */}
                <Card className="p-6">
                    <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-6">Pipeline Health</h3>
                    <div className="space-y-6 relative">
                        <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-gray-200 dark:bg-gray-700"></div>

                        <div className="relative pl-10">
                            <div className={`absolute left-2.5 top-1.5 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 z-10 ${stats?.syncStatus === 'Healthy' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            <div className="font-bold text-sm text-gray-800 dark:text-white">Web Events Stream</div>
                            <div className="text-xs text-gray-500">Processing {formatNumber(Math.floor((stats?.eventsProcessed || 0) / 2400))}/sec</div>
                        </div>

                        <div className="relative pl-10">
                            <div className="absolute left-2.5 top-1.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 z-10"></div>
                            <div className="font-bold text-sm text-gray-800 dark:text-white">Mobile SDK</div>
                            <div className="text-xs text-gray-500">Processing 450 events/sec</div>
                        </div>

                        <div className="relative pl-10">
                            <div className="absolute left-2.5 top-1.5 w-3 h-3 bg-yellow-500 rounded-full border-2 border-white dark:border-gray-800 z-10"></div>
                            <div className="font-bold text-sm text-gray-800 dark:text-white">CRM Sync (Salesforce)</div>
                            <div className="text-xs text-gray-500">Syncing... (85%)</div>
                        </div>

                        <div className="relative pl-10">
                            <div className="absolute left-2.5 top-1.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 z-10"></div>
                            <div className="font-bold text-sm text-gray-800 dark:text-white">Identity Resolution</div>
                            <div className="text-xs text-gray-500">{formatNumber(stats?.activeProfiles || 0)} resolved</div>
                        </div>
                    </div>

                    <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <Icon name="InformationCircleIcon" className="w-5 h-5 text-blue-600" />
                            <span className="font-bold text-sm text-blue-800 dark:text-blue-200">Events Today</span>
                        </div>
                        <div className="text-2xl font-black text-blue-900 dark:text-blue-100">{formatNumber(stats?.eventsProcessed || 0)}</div>
                    </div>
                </Card>
            </div>

            {/* Profile Detail Modal */}
            <Modal
                isOpen={showProfileModal}
                onClose={() => setShowProfileModal(false)}
                title={selectedProfile?.name || 'Profile Details'}
            >
                {selectedProfile && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <Avatar initials={selectedProfile.name.split(' ').map(n => n[0]).join('').slice(0, 2)} size="lg" />
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{selectedProfile.name}</h3>
                                <p className="text-gray-500">{selectedProfile.email}</p>
                                {selectedProfile.company && <p className="text-gray-400">{selectedProfile.company}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">${formatNumber(selectedProfile.ltv)}</div>
                                <div className="text-xs text-gray-500">Lifetime Value</div>
                            </div>
                            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">{selectedProfile.engagement_score}%</div>
                                <div className="text-xs text-gray-500">Engagement</div>
                            </div>
                            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">{selectedProfile.events_count}</div>
                                <div className="text-xs text-gray-500">Events</div>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-bold text-gray-800 dark:text-white mb-2">Segments</h4>
                            <div className="flex flex-wrap gap-2">
                                {selectedProfile.segments.map(seg => (
                                    <Badge key={seg} variant="primary">{seg}</Badge>
                                ))}
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="font-bold text-gray-800 dark:text-white">Tags</h4>
                                <Button variant="secondary" size="sm" onClick={() => setShowTagModal(true)}>+ Add Tag</Button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {selectedProfile.tags.map(tag => (
                                    <span
                                        key={tag}
                                        className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm flex items-center gap-2 group"
                                    >
                                        {tag}
                                        <button
                                            onClick={() => handleRemoveTag(tag)}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500"
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                                {selectedProfile.tags.length === 0 && <span className="text-gray-400">No tags</span>}
                            </div>
                        </div>

                        <div className="text-sm text-gray-500">
                            <p><strong>Source:</strong> {selectedProfile.source}</p>
                            <p><strong>Last Active:</strong> {new Date(selectedProfile.last_activity).toLocaleString()}</p>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Add Tag Modal */}
            <Modal
                isOpen={showTagModal}
                onClose={() => setShowTagModal(false)}
                title="Add Tag"
            >
                <div className="space-y-4">
                    <Input
                        label="Tag Name"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        placeholder="Enter tag name..."
                    />
                    <div className="flex justify-end gap-2">
                        <Button variant="secondary" onClick={() => setShowTagModal(false)}>Cancel</Button>
                        <Button variant="primary" onClick={handleAddTag} disabled={!newTag.trim()}>Add Tag</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
