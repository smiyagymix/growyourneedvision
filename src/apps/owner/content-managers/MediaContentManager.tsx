import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { Card, Button, Icon, Modal } from '../../../components/shared/ui/CommonUI';
import { mediaService, MediaItem, TVChannel, M3UPlaylist } from '../../../services/mediaService';
import { FileUploader } from '../../../components/shared/FileUploader';
import { useToast } from '../../../hooks/useToast';
import { useAuth } from '../../../context/AuthContext';
import { sanitizeText, sanitizeHtml } from '../../../utils/sanitization';
import { urlSchema } from '../../../validation/schemas';

const mediaSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters').max(200, 'Title too long'),
  description: z.string().max(2000, 'Description too long'),
  type: z.enum(['Movie', 'Series', 'Documentary']),
  genre: z.array(z.string()).optional(),
  rating: z.string().optional(),
  duration: z.string().optional(),
  year: z.number().min(1900, 'Invalid year').max(new Date().getFullYear() + 5),
  video_url: urlSchema.optional(),
  embed_url: urlSchema.optional(),
  thumbnail: urlSchema.optional(),
  cast: z.array(z.string()).optional(),
  director: z.string().max(100, 'Director name too long').optional()
});

const channelSchema = z.object({
  name: z.string().min(2, 'Channel name must be at least 2 characters').max(100, 'Name too long'),
  stream_url: urlSchema,
  logo: urlSchema.optional(),
  category: z.string().max(50, 'Category too long').optional(),
  country: z.string().max(50, 'Country too long').optional(),
  language: z.string().length(2, 'Language code must be 2 characters')
});

const playlistSchema = z.object({
  name: z.string().min(2, 'Playlist name must be at least 2 characters').max(100, 'Name too long'),
  url: urlSchema
});

export const MediaContentManager: React.FC = () => {
    const { showToast } = useToast();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'movies' | 'channels' | 'playlists'>('movies');
    const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
    const [channels, setChannels] = useState<TVChannel[]>([]);
    const [playlists, setPlaylists] = useState<M3UPlaylist[]>([]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Form states
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: 'Movie' as 'Movie' | 'Series' | 'Documentary',
        genre: [] as string[],
        rating: '',
        duration: '',
        year: '',
        video_url: '',
        embed_url: '',
        thumbnail: '',
        cast: '',
        director: ''
    });

    const [channelFormData, setChannelFormData] = useState({
        name: '',
        stream_url: '',
        logo: '',
        category: '',
        country: '',
        language: 'en'
    });

    const [playlistFormData, setPlaylistFormData] = useState({
        name: '',
        url: ''
    });

    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'movies') {
                const result = await mediaService.getMedia();
                setMediaItems(result.items);
            } else if (activeTab === 'channels') {
                const channelData = await mediaService.getLiveChannels();
                setChannels(channelData);
            } else if (activeTab === 'playlists') {
                const playlistData = await mediaService.getPlaylists();
                setPlaylists(playlistData);
            }
        } catch (error) {
            showToast('Failed to load data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleAddMedia = async () => {
        // Sanitize inputs
        const sanitized = {
            title: sanitizeText(formData.title),
            description: sanitizeHtml(formData.description, 'BASIC'),
            type: formData.type,
            genre: formData.genre,
            rating: formData.rating,
            duration: formData.duration,
            year: parseInt(formData.year) || new Date().getFullYear(),
            video_url: formData.video_url,
            embed_url: formData.embed_url,
            thumbnail: formData.thumbnail,
            cast: formData.cast.split(',').map(c => c.trim()).filter(Boolean),
            director: sanitizeText(formData.director)
        };
        
        // Validate
        const result = mediaSchema.safeParse(sanitized);
        if (!result.success) {
            showToast(`Validation error: ${result.error.issues[0].message}`, 'error');
            return;
        }
        
        try {
            await mediaService.createMediaItem({
                ...result.data,
                matchScore: 85
            });

            showToast(`${formData.type} added successfully!`, 'success');
            setIsAddModalOpen(false);
            resetForm();
            loadData();
        } catch (error) {
            showToast('Failed to add media', 'error');
        }
    };

    const handleAddChannel = async () => {
        // Sanitize inputs
        const sanitized = {
            name: sanitizeText(channelFormData.name),
            stream_url: channelFormData.stream_url,
            logo: channelFormData.logo,
            category: sanitizeText(channelFormData.category),
            country: sanitizeText(channelFormData.country),
            language: channelFormData.language
        };
        
        // Validate
        const result = channelSchema.safeParse(sanitized);
        if (!result.success) {
            showToast(`Validation error: ${result.error.issues[0].message}`, 'error');
            return;
        }
        
        try {
            await mediaService.createChannel({
                ...result.data,
                is_active: true
            });

            showToast('Channel added successfully!', 'success');
            setIsAddModalOpen(false);
            resetChannelForm();
            loadData();
        } catch (error) {
            showToast('Failed to add channel', 'error');
        }
    };

    const handleAddPlaylist = async () => {
        if (!user) {
            showToast('User not authenticated', 'error');
            return;
        }
        
        // Sanitize inputs
        const sanitized = {
            name: sanitizeText(playlistFormData.name),
            url: playlistFormData.url
        };
        
        // Validate
        const result = playlistSchema.safeParse(sanitized);
        if (!result.success) {
            showToast(`Validation error: ${result.error.issues[0].message}`, 'error');
            return;
        }

        try {
            const playlist = await mediaService.addPlaylist(
                result.data.name,
                result.data.url,
                user.id
            );

            showToast('Playlist added! Syncing channels...', 'success');

            // Sync in background
            mediaService.syncPlaylist(playlist.id).then(() => {
                showToast('Channels synced successfully!', 'success');
                loadData();
            });

            setIsAddModalOpen(false);
            resetPlaylistForm();
        } catch (error) {
            showToast('Failed to add playlist', 'error');
        }
    };

    const handleDelete = async (id: string, type: 'media' | 'channel' | 'playlist') => {
        if (!confirm('Are you sure you want to delete this item?')) return;

        try {
            if (type === 'media') {
                await mediaService.deleteMediaItem(id);
            } else if (type === 'channel') {
                await mediaService.deleteChannel(id);
            } else {
                await mediaService.deletePlaylist(id);
            }

            showToast('Deleted successfully!', 'success');
            loadData();
        } catch (error) {
            showToast('Failed to delete', 'error');
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            type: 'Movie',
            genre: [],
            rating: '',
            duration: '',
            year: '',
            video_url: '',
            embed_url: '',
            thumbnail: '',
            cast: '',
            director: ''
        });
    };

    const resetChannelForm = () => {
        setChannelFormData({
            name: '',
            stream_url: '',
            logo: '',
            category: '',
            country: '',
            language: 'en'
        });
    };

    const resetPlaylistForm = () => {
        setPlaylistFormData({ name: '', url: '' });
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Media Content Manager
                </h2>
                <Button variant="primary" onClick={() => setIsAddModalOpen(true)}>
                    <Icon name="PlusIcon" className="w-5 h-5 mr-2" />
                    Add {activeTab === 'movies' ? 'Media' : activeTab === 'channels' ? 'Channel' : 'Playlist'}
                </Button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
                <button
                    onClick={() => setActiveTab('movies')}
                    className={`px-6 py-3 font-semibold transition-colors border-b-2 ${activeTab === 'movies'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                >
                    Movies & Series
                </button>
                <button
                    onClick={() => setActiveTab('channels')}
                    className={`px-6 py-3 font-semibold transition-colors border-b-2 ${activeTab === 'channels'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                >
                    Live TV Channels
                </button>
                <button
                    onClick={() => setActiveTab('playlists')}
                    className={`px-6 py-3 font-semibold transition-colors border-b-2 ${activeTab === 'playlists'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                >
                    M3U Playlists
                </button>
            </div>

            {/* Content */}
            {loading ? (
                <div className="text-center py-12 text-gray-500">Loading...</div>
            ) : (
                <>
                    {/* Movies Tab */}
                    {activeTab === 'movies' && (
                        <div className="grid grid-cols-1 gap-4">
                            {mediaItems.map(item => (
                                <Card key={item.id} className="p-4">
                                    <div className="flex items-start gap-4">
                                        <div className="w-24 h-36 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                                            {item.thumbnail ? (
                                                <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover rounded-lg" />
                                            ) : (
                                                <Icon name="FilmIcon" className="w-12 h-12 text-gray-400" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{item.title}</h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{item.description}</p>
                                            <div className="flex gap-4 mt-3 text-sm">
                                                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">
                                                    {item.type}
                                                </span>
                                                <span className="text-gray-600 dark:text-gray-400">{item.rating}</span>
                                                <span className="text-gray-600 dark:text-gray-400">{item.duration}</span>
                                                {item.year && <span className="text-gray-600 dark:text-gray-400">{item.year}</span>}
                                            </div>
                                        </div>
                                        <Button variant="danger" size="sm" onClick={() => handleDelete(item.id, 'media')}>
                                            <Icon name="TrashIcon" className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </Card>
                            ))}
                            {mediaItems.length === 0 && (
                                <div className="text-center py-12 text-gray-500">
                                    No media items yet. Click "Add Media" to get started.
                                </div>
                            )}
                        </div>
                    )}

                    {/* Channels Tab */}
                    {activeTab === 'channels' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {channels.map(channel => (
                                <Card key={channel.id} className="p-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            {channel.logo ? (
                                                <img src={channel.logo} alt={channel.name} className="h-12 object-contain mb-3" />
                                            ) : (
                                                <div className="h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded flex items-center justify-center mb-3">
                                                    <Icon name="TvIcon" className="w-8 h-8 text-white" />
                                                </div>
                                            )}
                                            <h3 className="font-bold text-gray-900 dark:text-white">{channel.name}</h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{channel.category}</p>
                                            <p className="text-xs text-gray-500 mt-2">{channel.country} • {channel.language}</p>
                                        </div>
                                        <Button variant="danger" size="sm" onClick={() => handleDelete(channel.id, 'channel')}>
                                            <Icon name="TrashIcon" className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </Card>
                            ))}
                            {channels.length === 0 && (
                                <div className="col-span-full text-center py-12 text-gray-500">
                                    No channels yet. Add channels or import M3U playlists.
                                </div>
                            )}
                        </div>
                    )}

                    {/* Playlists Tab */}
                    {activeTab === 'playlists' && (
                        <div className="grid grid-cols-1 gap-4">
                            {playlists.map(playlist => (
                                <Card key={playlist.id} className="p-4">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{playlist.name}</h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 break-all">{playlist.url}</p>
                                            <div className="flex gap-4 mt-3 text-sm text-gray-500">
                                                <span>{playlist.channel_count || 0} channels</span>
                                                {playlist.last_synced && (
                                                    <span>Synced: {new Date(playlist.last_synced).toLocaleDateString()}</span>
                                                )}
                                            </div>
                                        </div>
                                        <Button variant="danger" size="sm" onClick={() => handleDelete(playlist.id, 'playlist')}>
                                            <Icon name="TrashIcon" className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </Card>
                            ))}
                            {playlists.length === 0 && (
                                <div className="text-center py-12 text-gray-500">
                                    No playlists yet. Click "Add Playlist" to import M3U8 channels.
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

            {/* Add Modal */}
            <Modal
                isOpen={isAddModalOpen}
                onClose={() => {
                    setIsAddModalOpen(false);
                    resetForm();
                    resetChannelForm();
                    resetPlaylistForm();
                }}
                title={`Add ${activeTab === 'movies' ? 'Media' : activeTab === 'channels' ? 'Channel' : 'Playlist'}`}
                size="lg"
            >
                {activeTab === 'movies' && (
                    <div className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Title *
                                </label>
                                <input
                                    type="text"
                                    className="w-full border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 rounded-lg text-gray-900 dark:text-white"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="Enter movie/series title"
                                />
                            </div>

                            <div className="col-span-2">
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Description *
                                </label>
                                <textarea
                                    className="w-full border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 rounded-lg text-gray-900 dark:text-white"
                                    rows={3}
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Enter description"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Type *
                                </label>
                                <select
                                    className="w-full border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 rounded-lg text-gray-900 dark:text-white"
                                    value={formData.type}
                                    onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                                >
                                    <option value="Movie">Movie</option>
                                    <option value="Series">Series</option>
                                    <option value="Documentary">Documentary</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Rating
                                </label>
                                <input
                                    type="text"
                                    className="w-full border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 rounded-lg text-gray-900 dark:text-white"
                                    value={formData.rating}
                                    onChange={e => setFormData({ ...formData, rating: e.target.value })}
                                    placeholder="PG-13, R, TV-MA, etc."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Duration
                                </label>
                                <input
                                    type="text"
                                    className="w-full border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 rounded-lg text-gray-900 dark:text-white"
                                    value={formData.duration}
                                    onChange={e => setFormData({ ...formData, duration: e.target.value })}
                                    placeholder="2h 30m or 5 Seasons"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Year
                                </label>
                                <input
                                    type="number"
                                    className="w-full border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 rounded-lg text-gray-900 dark:text-white"
                                    value={formData.year}
                                    onChange={e => setFormData({ ...formData, year: e.target.value })}
                                    placeholder="2024"
                                />
                            </div>

                            <div className="col-span-2">
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Video URL (Direct link or M3U8)
                                </label>
                                <input
                                    type="url"
                                    className="w-full border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 rounded-lg text-gray-900 dark:text-white"
                                    value={formData.video_url}
                                    onChange={e => setFormData({ ...formData, video_url: e.target.value })}
                                    placeholder="https://example.com/video.mp4 or .m3u8"
                                />
                            </div>

                            <div className="col-span-2">
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Embed URL (Alternative)
                                </label>
                                <input
                                    type="url"
                                    className="w-full border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 rounded-lg text-gray-900 dark:text-white"
                                    value={formData.embed_url}
                                    onChange={e => setFormData({ ...formData, embed_url: e.target.value })}
                                    placeholder="https://embed.example.com/movie/123"
                                />
                            </div>

                            <div className="col-span-2">
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Thumbnail URL
                                </label>
                                <input
                                    type="url"
                                    className="w-full border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 rounded-lg text-gray-900 dark:text-white"
                                    value={formData.thumbnail}
                                    onChange={e => setFormData({ ...formData, thumbnail: e.target.value })}
                                    placeholder="https://example.com/poster.jpg"
                                />
                            </div>

                            <div className="col-span-2">
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Cast (comma-separated)
                                </label>
                                <input
                                    type="text"
                                    className="w-full border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 rounded-lg text-gray-900 dark:text-white"
                                    value={formData.cast}
                                    onChange={e => setFormData({ ...formData, cast: e.target.value })}
                                    placeholder="Actor 1, Actor 2, Actor 3"
                                />
                            </div>

                            <div className="col-span-2">
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Director
                                </label>
                                <input
                                    type="text"
                                    className="w-full border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 rounded-lg text-gray-900 dark:text-white"
                                    value={formData.director}
                                    onChange={e => setFormData({ ...formData, director: e.target.value })}
                                    placeholder="Director name"
                                />
                            </div>

                            <div className="col-span-2">
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Upload Video (Local File)
                                </label>
                                <FileUploader
                                    onUpload={async (files: File[]) => {
                                        // Simulate upload
                                        console.log('Uploading files:', files);
                                        if (files.length > 0) {
                                            // In a real app, you would upload to storage here
                                            // const url = await mediaService.uploadVideo(files[0]);
                                            const url = URL.createObjectURL(files[0]);
                                            setFormData({ ...formData, video_url: url });
                                        }
                                    }}
                                    accept="video/*"
                                    maxSize={500 * 1024 * 1024} // 500MB
                                />
                                <p className="text-xs text-gray-500 mt-2">
                                    Upload a local video file. Supported formats: MP4, MKV, AVI, etc.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4 sticky bottom-0 bg-white dark:bg-gray-800 pb-2">
                            <Button variant="primary" onClick={handleAddMedia} className="flex-1">
                                Add Media
                            </Button>
                            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
                                Cancel
                            </Button>
                        </div>
                    </div>
                )}

                {activeTab === 'channels' && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Channel Name *
                            </label>
                            <input
                                type="text"
                                className="w-full border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 rounded-lg text-gray-900 dark:text-white"
                                value={channelFormData.name}
                                onChange={e => setChannelFormData({ ...channelFormData, name: e.target.value })}
                                placeholder="ESPN HD"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                M3U8 Stream URL *
                            </label>
                            <input
                                type="url"
                                className="w-full border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 rounded-lg text-gray-900 dark:text-white"
                                value={channelFormData.stream_url}
                                onChange={e => setChannelFormData({ ...channelFormData, stream_url: e.target.value })}
                                placeholder="https://stream.example.com/channel/playlist.m3u8"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Logo URL
                            </label>
                            <input
                                type="url"
                                className="w-full border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 rounded-lg text-gray-900 dark:text-white"
                                value={channelFormData.logo}
                                onChange={e => setChannelFormData({ ...channelFormData, logo: e.target.value })}
                                placeholder="https://example.com/logo.png"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Category
                                </label>
                                <input
                                    type="text"
                                    className="w-full border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 rounded-lg text-gray-900 dark:text-white"
                                    value={channelFormData.category}
                                    onChange={e => setChannelFormData({ ...channelFormData, category: e.target.value })}
                                    placeholder="Sports, News, Entertainment"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Country
                                </label>
                                <input
                                    type="text"
                                    className="w-full border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 rounded-lg text-gray-900 dark:text-white"
                                    value={channelFormData.country}
                                    onChange={e => setChannelFormData({ ...channelFormData, country: e.target.value })}
                                    placeholder="USA, UK, etc."
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <Button variant="primary" onClick={handleAddChannel} className="flex-1">
                                Add Channel
                            </Button>
                            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
                                Cancel
                            </Button>
                        </div>
                    </div>
                )}

                {activeTab === 'playlists' && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Playlist Name *
                            </label>
                            <input
                                type="text"
                                className="w-full border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 rounded-lg text-gray-900 dark:text-white"
                                value={playlistFormData.name}
                                onChange={e => setPlaylistFormData({ ...playlistFormData, name: e.target.value })}
                                placeholder="My IPTV Channels"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                M3U8 Playlist URL *
                            </label>
                            <input
                                type="url"
                                className="w-full border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 rounded-lg text-gray-900 dark:text-white"
                                value={playlistFormData.url}
                                onChange={e => setPlaylistFormData({ ...playlistFormData, url: e.target.value })}
                                placeholder="https://example.com/playlist.m3u8"
                            />
                            <p className="text-xs text-gray-500 mt-2">
                                The system will automatically parse and import all channels from this playlist
                            </p>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <Button variant="primary" onClick={handleAddPlaylist} className="flex-1">
                                Add & Sync Playlist
                            </Button>
                            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
                                Cancel
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};
