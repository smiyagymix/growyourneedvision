import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Icon, Badge, Modal, Input, Select, Skeleton } from '../shared/ui/CommonUI';
import { marketingService, SocialPost, SocialAccount } from '../../services/marketingService';
import { marketingExportService } from '../../services/marketingExportService';
import { useSocialPostsRealtime } from '../../hooks/useMarketingRealtime';

type Platform = 'LinkedIn' | 'Twitter' | 'Instagram' | 'Facebook';

const PLATFORMS: { value: Platform; label: string; color: string; icon: string }[] = [
    { value: 'LinkedIn', label: 'LinkedIn', color: 'bg-blue-600', icon: 'in' },
    { value: 'Twitter', label: 'Twitter / X', color: 'bg-black', icon: 'X' },
    { value: 'Instagram', label: 'Instagram', color: 'bg-pink-600', icon: 'IG' },
    { value: 'Facebook', label: 'Facebook', color: 'bg-blue-500', icon: 'f' },
];

export const SocialScheduler: React.FC = () => {
    const [posts, setPosts] = useState<SocialPost[]>([]);
    const [accounts, setAccounts] = useState<SocialAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [showPostModal, setShowPostModal] = useState(false);
    const [editingPost, setEditingPost] = useState<SocialPost | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showExportMenu, setShowExportMenu] = useState(false);

    // Form state
    const [postContent, setPostContent] = useState('');
    const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([]);
    const [scheduledDate, setScheduledDate] = useState('');
    const [saving, setSaving] = useState(false);

    // Real-time subscription
    const { subscribe, unsubscribe, isSubscribed } = useSocialPostsRealtime({
        autoFetch: false,
        onCreate: (record) => setPosts(prev => [record, ...prev]),
        onUpdate: (record) => setPosts(prev => prev.map(p => p.id === record.id ? record : p)),
        onDelete: (record) => setPosts(prev => prev.filter(p => p.id !== record.id)),
    });

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [postsData, accountsData] = await Promise.all([
                marketingService.getSocialPosts(),
                marketingService.getSocialAccounts()
            ]);
            setPosts(postsData);
            setAccounts(accountsData);
        } catch (err) {
            setError('Failed to load social data');
            console.error('Social scheduler fetch error:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        subscribe();
        return () => unsubscribe();
    }, [fetchData, subscribe, unsubscribe]);

    const handleExport = (format: 'csv' | 'excel') => {
        if (format === 'csv') {
            marketingExportService.exportSocialPostsToCSV(posts);
        } else {
            marketingExportService.exportSocialPostsToExcel(posts);
        }
        setShowExportMenu(false);
    };

    const resetForm = () => {
        setPostContent('');
        setSelectedPlatforms([]);
        setScheduledDate('');
        setEditingPost(null);
    };

    const openCreateModal = () => {
        resetForm();
        setShowPostModal(true);
    };

    const openEditModal = (post: SocialPost) => {
        setEditingPost(post);
        setPostContent(post.content);
        setSelectedPlatforms(post.platforms);
        setScheduledDate(post.scheduled_date ? new Date(post.scheduled_date).toISOString().slice(0, 16) : '');
        setShowPostModal(true);
    };

    const handleSavePost = async () => {
        if (!postContent.trim() || selectedPlatforms.length === 0) return;
        setSaving(true);
        try {
            const postData: Partial<SocialPost> = {
                content: postContent,
                platforms: selectedPlatforms,
                scheduled_date: scheduledDate || undefined,
                status: scheduledDate ? 'Scheduled' : 'Draft',
                media_urls: [],
            };

            if (editingPost) {
                await marketingService.updateSocialPost(editingPost.id, postData);
                setPosts(posts.map(p => p.id === editingPost.id ? { ...p, ...postData } as SocialPost : p));
            } else {
                const newPost = await marketingService.createSocialPost(postData);
                setPosts([newPost as SocialPost, ...posts]);
            }
            setShowPostModal(false);
            resetForm();
        } catch (err) {
            console.error('Failed to save post:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleDeletePost = async (id: string) => {
        if (!confirm('Are you sure you want to delete this post?')) return;
        try {
            await marketingService.deleteSocialPost(id);
            setPosts(posts.filter(p => p.id !== id));
        } catch (err) {
            console.error('Failed to delete post:', err);
        }
    };

    const handlePublishPost = async (id: string) => {
        try {
            await marketingService.publishSocialPost(id);
            setPosts(posts.map(p => p.id === id ? { ...p, status: 'Published', published_date: new Date().toISOString() } as SocialPost : p));
        } catch (err) {
            console.error('Failed to publish post:', err);
        }
    };

    const togglePlatform = (platform: Platform) => {
        if (selectedPlatforms.includes(platform)) {
            setSelectedPlatforms(selectedPlatforms.filter(p => p !== platform));
        } else {
            setSelectedPlatforms([...selectedPlatforms, platform]);
        }
    };

    const formatDate = (dateStr: string | undefined) => {
        if (!dateStr) return 'Not scheduled';
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = date.getTime() - now.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        if (diffDays === 1) return `Tomorrow, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        if (diffDays < 0) return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        return `${date.toLocaleDateString([], { weekday: 'short' })}, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    };

    const getStatusVariant = (status: SocialPost['status']): 'success' | 'primary' | 'default' | 'danger' | 'neutral' => {
        switch (status) {
            case 'Scheduled': return 'success';
            case 'Published': return 'primary';
            case 'Draft': return 'default';
            case 'Failed': return 'danger';
            default: return 'neutral';
        }
    };

    const connectedAccounts = accounts.filter(a => a.status === 'Connected');

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
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Social Scheduler</h2>
                <div className="flex gap-2">
                    <Button variant="secondary" icon="Cog6ToothIcon">Connect Accounts</Button>
                    <Button variant="primary" icon="PlusIcon" onClick={openCreateModal}>Create Post</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Posts Queue */}
                <Card className="lg:col-span-2 p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-lg">Post Queue</h3>
                        <div className="flex gap-2">
                            <Badge variant="neutral">{posts.filter(p => p.status === 'Scheduled').length} Scheduled</Badge>
                            <Badge variant="neutral">{posts.filter(p => p.status === 'Draft').length} Drafts</Badge>
                        </div>
                    </div>

                    {loading ? (
                        <div className="space-y-4">
                            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
                        </div>
                    ) : posts.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <Icon name="ChatBubbleBottomCenterTextIcon" className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>No posts yet</p>
                            <Button variant="primary" size="sm" className="mt-4" onClick={openCreateModal}>Create your first post</Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {posts.map((post) => (
                                <div
                                    key={post.id}
                                    className="flex gap-4 p-4 border border-gray-100 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
                                >
                                    <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg flex-shrink-0 flex items-center justify-center text-gray-400">
                                        {post.media_urls.length > 0 ? (
                                            <Icon name="PhotoIcon" className="w-6 h-6" />
                                        ) : (
                                            <Icon name="ChatBubbleBottomCenterTextIcon" className="w-6 h-6" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                {post.platforms.map(platform => (
                                                    <Badge key={platform} variant="neutral" size="sm" className="bg-white border-gray-200">
                                                        {platform}
                                                    </Badge>
                                                ))}
                                                <span className="text-sm font-bold text-gray-500">
                                                    {formatDate(post.scheduled_date || post.published_date)}
                                                </span>
                                            </div>
                                            <Badge variant={getStatusVariant(post.status)}>{post.status}</Badge>
                                        </div>
                                        <p className="text-gray-800 dark:text-white text-sm line-clamp-2 font-medium">{post.content}</p>
                                        {post.status === 'Published' && (
                                            <div className="flex gap-4 mt-2 text-xs text-gray-500">
                                                <span>❤️ {post.engagement.likes}</span>
                                                <span>💬 {post.engagement.comments}</span>
                                                <span>🔄 {post.engagement.shares}</span>
                                                <span>🔗 {post.engagement.clicks}</span>
                                            </div>
                                        )}
                                        <div className="mt-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="secondary" size="sm" onClick={() => openEditModal(post)}>Edit</Button>
                                            {post.status === 'Draft' && (
                                                <Button variant="primary" size="sm" onClick={() => handlePublishPost(post.id)}>Publish Now</Button>
                                            )}
                                            <Button variant="secondary" size="sm" onClick={() => handleDeletePost(post.id)} className="text-red-500 hover:text-red-600">Delete</Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Connected Accounts */}
                    <Card className="p-6">
                        <h3 className="font-bold text-lg mb-4">Connected Accounts</h3>
                        {loading ? (
                            <div className="space-y-3">
                                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 rounded-lg" />)}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {accounts.map(account => {
                                    const platformConfig = PLATFORMS.find(p => p.value === account.platform);
                                    return (
                                        <div key={account.id} className={`flex items-center justify-between ${account.status !== 'Connected' ? 'opacity-50' : ''}`}>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-8 h-8 rounded-full ${platformConfig?.color || 'bg-gray-500'} flex items-center justify-center text-white`}>
                                                    <span className="font-bold text-xs">{platformConfig?.icon}</span>
                                                </div>
                                                <div>
                                                    <span className="text-sm font-bold block">{account.account_name}</span>
                                                    <span className="text-xs text-gray-500">{account.followers.toLocaleString()} followers</span>
                                                </div>
                                            </div>
                                            {account.status === 'Connected' ? (
                                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                            ) : (
                                                <Badge variant="neutral" size="sm">Reconnect</Badge>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </Card>

                    {/* AI Assistant */}
                    <Card className="p-6 bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800">
                        <h3 className="font-bold text-lg mb-2 text-blue-900 dark:text-blue-100">AI Assistant</h3>
                        <p className="text-sm text-blue-800 dark:text-blue-200 mb-4">Need inspiration? Use AI to generate 5 post ideas for this week.</p>
                        <Button variant="primary" size="sm" className="w-full">Generate Ideas</Button>
                    </Card>

                    {/* Quick Stats */}
                    <Card className="p-6">
                        <h3 className="font-bold text-lg mb-4">This Week</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Posts Published</span>
                                <span className="font-bold">{posts.filter(p => p.status === 'Published').length}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Total Engagement</span>
                                <span className="font-bold">
                                    {posts.reduce((sum, p) => sum + p.engagement.likes + p.engagement.comments + p.engagement.shares, 0).toLocaleString()}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Link Clicks</span>
                                <span className="font-bold">
                                    {posts.reduce((sum, p) => sum + p.engagement.clicks, 0).toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Create/Edit Post Modal */}
            <Modal
                isOpen={showPostModal}
                onClose={() => { setShowPostModal(false); resetForm(); }}
                title={editingPost ? 'Edit Post' : 'Create Post'}
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Content</label>
                        <textarea
                            value={postContent}
                            onChange={(e) => setPostContent(e.target.value)}
                            placeholder="What's on your mind?"
                            className="w-full h-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="text-xs text-gray-500 text-right mt-1">{postContent.length} characters</div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Platforms</label>
                        <div className="flex flex-wrap gap-2">
                            {PLATFORMS.map(platform => {
                                const account = accounts.find(a => a.platform === platform.value && a.status === 'Connected');
                                const isSelected = selectedPlatforms.includes(platform.value);
                                return (
                                    <button
                                        key={platform.value}
                                        onClick={() => account && togglePlatform(platform.value)}
                                        disabled={!account}
                                        className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
                                            isSelected
                                                ? 'bg-blue-600 text-white'
                                                : account
                                                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                                        }`}
                                    >
                                        <div className={`w-5 h-5 rounded-full ${platform.color} flex items-center justify-center text-white text-xs`}>
                                            {platform.icon}
                                        </div>
                                        {platform.label}
                                        {!account && <span className="text-xs">(Not connected)</span>}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Schedule (Optional)</label>
                        <input
                            type="datetime-local"
                            value={scheduledDate}
                            onChange={(e) => setScheduledDate(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">Leave empty to save as draft</p>
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <Button variant="secondary" onClick={() => { setShowPostModal(false); resetForm(); }}>Cancel</Button>
                        <Button
                            variant="primary"
                            onClick={handleSavePost}
                            disabled={saving || !postContent.trim() || selectedPlatforms.length === 0}
                        >
                            {saving ? 'Saving...' : editingPost ? 'Update Post' : scheduledDate ? 'Schedule Post' : 'Save Draft'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
