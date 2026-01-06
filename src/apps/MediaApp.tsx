import React, { useState, useEffect } from 'react';
import { Icon, Button, Card, Modal, EmptyState, Skeleton, SkeletonCard } from '../components/shared/ui/CommonUI';
import { VideoPlayer } from '../components/shared/ui/VideoPlayer';
import { mediaService, MediaItem, TVChannel, M3UPlaylist } from '../services/mediaService';
import { AIContentGeneratorModal } from '../components/shared/modals/AIContentGeneratorModal';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { useToast } from '../hooks/useToast';

interface MediaAppProps {
    activeTab: string;
    activeSubNav: string;
}

const MediaApp: React.FC<MediaAppProps> = ({ activeTab, activeSubNav }) => {
    const { user } = useAuth();
    const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
    const [channels, setChannels] = useState<TVChannel[]>([]);
    const [playlists, setPlaylists] = useState<M3UPlaylist[]>([]);
    const [featuredItem, setFeaturedItem] = useState<MediaItem | null>(null);
    const [selectedChannel, setSelectedChannel] = useState<TVChannel | null>(null);
    const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAIModalOpen, setIsAIModalOpen] = useState(false);
    const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
    const [newPlaylistUrl, setNewPlaylistUrl] = useState('');
    const [newPlaylistName, setNewPlaylistName] = useState('');

    useEffect(() => {
        loadContent();
    }, [activeSubNav]);

    const loadContent = async () => {
        setLoading(true);
        try {
            if (activeSubNav === 'Live TV') {
                const channelData = await mediaService.getLiveChannels();
                setChannels(channelData);
                const playlistData = await mediaService.getPlaylists();
                setPlaylists(playlistData);
            } else {
                let filter = '';
                if (activeSubNav === 'Movies') filter = 'type = "Movie"';
                else if (activeSubNav === 'Series') filter = 'type = "Series"';
                else if (activeSubNav === 'Docs') filter = 'type = "Documentary"';

                const result = await mediaService.getMedia(filter);
                setMediaItems(result.items);

                if (result.items.length > 0) {
                    setFeaturedItem(result.items[0]);
                }
            }
        } catch (e) {
            console.error("Error fetching content:", e);
        } finally {
            setLoading(false);
        }
    };

    const handleAddPlaylist = async () => {
        if (!user || !newPlaylistUrl || !newPlaylistName) {
            alert('Please fill in all fields');
            return;
        }

        try {
            const playlist = await mediaService.addPlaylist(newPlaylistName, newPlaylistUrl, user.id);
            alert('Playlist added! Syncing channels...');

            // Sync in background
            mediaService.syncPlaylist(playlist.id).then(() => {
                loadContent();
                alert('Channels synced successfully!');
            });

            setIsPlaylistModalOpen(false);
            setNewPlaylistUrl('');
            setNewPlaylistName('');
        } catch (error) {
            alert('Failed to add playlist');
        }
    };

    // Live TV View
    if (activeSubNav === 'Live TV') {
        return (
            <div className="min-h-full bg-[#0a0a0a] text-white -m-8 p-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-black">📺 Live TV</h1>
                    <Button
                        variant="primary"
                        onClick={() => setIsPlaylistModalOpen(true)}
                        className="flex items-center gap-2"
                    >
                        <Icon name="PlusIcon" className="w-5 h-5" />
                        Add M3U Playlist
                    </Button>
                </div>

                {/* Playlists */}
                {playlists.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-xl font-bold mb-4">Your Playlists</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {playlists.map(playlist => (
                                <Card key={playlist.id} className="p-4">
                                    <h3 className="font-bold text-white">{playlist.name}</h3>
                                    <p className="text-sm text-gray-400 mt-1">{playlist.channel_count || 0} channels</p>
                                    <p className="text-xs text-gray-500 mt-2">
                                        {playlist.last_synced
                                            ? `Synced: ${new Date(playlist.last_synced).toLocaleString()}`
                                            : 'Not synced yet'}
                                    </p>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {/* Channels Grid */}
                <div>
                    <h2 className="text-xl font-bold mb-4">Available Channels ({channels.length})</h2>
                    {loading ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                            {Array.from({ length: 12 }).map((_, i) => (
                                <SkeletonCard key={i} />
                            ))}
                        </div>
                    ) : channels.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                            {channels.map((channel) => (
                                <motion.div
                                    key={channel.id}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setSelectedChannel(channel)}
                                    className="cursor-pointer"
                                >
                                    <Card className="p-4 text-center hover:border-blue-500 transition-colors">
                                        {channel.logo ? (
                                            <img src={channel.logo} alt={channel.name} className="w-full h-24 object-contain mb-3" />
                                        ) : (
                                            <div className="w-full h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mb-3">
                                                <Icon name="TvIcon" className="w-12 h-12 text-white" />
                                            </div>
                                        )}
                                        <h3 className="font-bold text-sm text-white truncate">{channel.name}</h3>
                                        <p className="text-xs text-gray-400 mt-1">{channel.category}</p>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            title="No channels available"
                            description="Add an M3U playlist to get started"
                            icon="TvIcon"
                            actionLabel="Add M3U Playlist"
                            onAction={() => setIsPlaylistModalOpen(true)}
                        />
                    )}
                </div>

                {/* Add Playlist Modal */}
                <Modal
                    isOpen={isPlaylistModalOpen}
                    onClose={() => setIsPlaylistModalOpen(false)}
                    title="Add M3U Playlist"
                >
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Playlist Name
                            </label>
                            <input
                                type="text"
                                className="w-full border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 rounded-lg text-gray-900 dark:text-white"
                                value={newPlaylistName}
                                onChange={e => setNewPlaylistName(e.target.value)}
                                placeholder="My IPTV Playlist"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                M3U8 Playlist URL
                            </label>
                            <input
                                type="url"
                                className="w-full border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 rounded-lg text-gray-900 dark:text-white"
                                value={newPlaylistUrl}
                                onChange={e => setNewPlaylistUrl(e.target.value)}
                                placeholder="https://example.com/playlist.m3u8"
                            />
                            <p className="text-xs text-gray-500 mt-2">
                                Enter the URL to your M3U8 playlist file
                            </p>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <Button variant="primary" onClick={handleAddPlaylist} className="flex-1">
                                Add & Sync
                            </Button>
                            <Button variant="outline" onClick={() => setIsPlaylistModalOpen(false)}>
                                Cancel
                            </Button>
                        </div>
                    </div>
                </Modal>

                {/* Channel Player Modal */}
                {selectedChannel && (
                    <Modal
                        isOpen={!!selectedChannel}
                        onClose={() => setSelectedChannel(null)}
                        title={selectedChannel.name}
                        size="lg"
                    >
                        <div className="aspect-video bg-black rounded-lg overflow-hidden">
                            <video
                                className="w-full h-full"
                                controls
                                autoPlay
                                src={selectedChannel.stream_url}
                            >
                                Your browser does not support the video tag.
                            </video>
                        </div>
                        <div className="mt-4">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Category: {selectedChannel.category} • Language: {selectedChannel.language}
                            </p>
                        </div>
                    </Modal>
                )}
            </div>
        );
    }

    // Movies/Series View
    return (
        <div className="min-h-full bg-[#0a0a0a] text-white -m-8 p-8 relative overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-blue-900/20 to-transparent pointer-events-none"></div>

            {/* Hero Section */}
            {featuredItem && (
                <div className="relative h-[450px] rounded-3xl overflow-hidden mb-10 group shadow-2xl border border-white/5">
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black z-0">
                        <div
                            className="absolute inset-0 bg-cover bg-center opacity-60 group-hover:scale-105 transition-transform duration-[20s]"
                            style={{ backgroundImage: `url('${featuredItem.thumbnail || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&q=80'}')` }}
                        ></div>
                    </div>

                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/40 to-transparent z-10"></div>

                    <div className="absolute bottom-0 left-0 p-10 z-20 max-w-3xl">
                        <div className="flex items-center gap-3 mb-4">
                            {featuredItem.year && (
                                <span className="bg-red-600 text-white text-[10px] font-black uppercase px-2 py-1 rounded tracking-widest">{featuredItem.year}</span>
                            )}
                            <span className="text-gray-300 text-xs font-bold border border-white/20 px-2 py-1 rounded">{featuredItem.rating || 'NR'}</span>
                            <span className="text-gray-300 text-xs font-bold border border-white/20 px-2 py-1 rounded">{featuredItem.duration || 'N/A'}</span>
                        </div>

                        <h1 className="text-6xl font-black mb-4 leading-none tracking-tight drop-shadow-2xl uppercase">
                            {featuredItem.title}
                        </h1>

                        <p className="text-gray-200 mb-8 text-lg font-medium leading-relaxed max-w-xl drop-shadow-md">
                            {featuredItem.description}
                        </p>

                        <div className="flex gap-4">
                            <Button
                                variant="primary"
                                size="lg"
                                className="bg-white text-black hover:bg-gray-200 border-none"
                                onClick={() => setSelectedMedia(featuredItem)}
                            >
                                <Icon name="PlayIcon" className="w-6 h-6 fill-black mr-2" /> Play Now
                            </Button>
                            <Button variant="outline" size="lg" className="bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/20">
                                <Icon name="PlusCircleIcon" className="w-6 h-6 mr-2" /> My List
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Content Grid */}
            <div className="relative z-10">
                <div className="mb-6 flex items-end justify-between border-b border-white/10 pb-2">
                    <div>
                        <h2 className="text-2xl font-bold text-white">{activeSubNav || activeTab}</h2>
                        <p className="text-xs text-gray-500 mt-1">Top picks for you</p>
                    </div>
                    <div className="flex gap-4 items-center">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsAIModalOpen(true)}
                            className="bg-white/10 border-white/20 text-white hover:bg-white/20 flex items-center gap-2"
                        >
                            <Icon name="Sparkles" className="w-4 h-4" />
                            AI Recommendation
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    {loading ? (
                        Array.from({ length: 12 }).map((_, i) => (
                            <div key={i} className="space-y-2">
                                <div className="aspect-[2/3] rounded-xl overflow-hidden">
                                    <Skeleton variant="rectangular" className="w-full h-full" />
                                </div>
                                <Skeleton variant="text" width="80%" />
                                <Skeleton variant="text" width="40%" />
                            </div>
                        ))
                    ) : mediaItems.length === 0 ? (
                        <div className="col-span-full">
                            <EmptyState
                                title="No media found"
                                description="Check back later for new content."
                                icon="FilmIcon"
                            />
                        </div>
                    ) : (
                        mediaItems.map((item, i) => (
                            <div key={item.id} className="group relative cursor-pointer">
                                <div className="aspect-[2/3] rounded-xl bg-gray-800 relative overflow-hidden transition-all duration-300 group-hover:-translate-y-3 group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.6)] border border-white/5 ring-2 ring-transparent group-hover:ring-white/20">
                                    {item.thumbnail ? (
                                        <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                                            <span className="text-6xl font-black text-white/5">{i + 1}</span>
                                        </div>
                                    )}

                                    <div
                                        className="absolute inset-0 bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-4"
                                        onClick={() => setSelectedMedia(item)}
                                    >
                                        <div className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center">
                                            <Icon name="PlayIcon" className="w-6 h-6 text-white fill-white ml-1" />
                                        </div>
                                        <div className="flex gap-2">
                                            <button className="p-2 bg-white/20 rounded-full hover:bg-white/40" onClick={(e) => e.stopPropagation()}>
                                                <Icon name="PlusCircleIcon" className="w-4 h-4" />
                                            </button>
                                            <button className="p-2 bg-white/20 rounded-full hover:bg-white/40" onClick={(e) => e.stopPropagation()}>
                                                <Icon name="HandThumbUpIcon" className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-3">
                                    <h3 className="text-sm font-bold text-white truncate">{item.title}</h3>
                                    <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-1">
                                        <span className="text-green-400 font-bold">{item.matchScore}% Match</span>
                                        <span>•</span>
                                        <span className="border border-gray-600 px-1 rounded">{item.rating}</span>
                                        <span>•</span>
                                        <span>{item.duration}</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Channel Player Modal */}
            <Modal
                isOpen={!!selectedChannel}
                onClose={() => setSelectedChannel(null)}
                title={selectedChannel?.name || 'Live TV'}
                size="xl"
            >
                {selectedChannel && (
                    <div className="bg-black aspect-video relative group">
                        <VideoPlayer
                            src={selectedChannel.stream_url}
                            poster={selectedChannel.logo}
                            autoPlay={true}
                        />
                        <div className="absolute top-4 left-4 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded animate-pulse">
                            LIVE
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                            <h3 className="text-white font-bold text-lg">{selectedChannel.name}</h3>
                            <p className="text-gray-300 text-sm">{selectedChannel.category} • {selectedChannel.language}</p>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Media Player Modal */}
            {selectedMedia && (
                <Modal
                    isOpen={!!selectedMedia}
                    onClose={() => setSelectedMedia(null)}
                    title={selectedMedia.title}
                    size="xl"
                >
                    <div className="aspect-video bg-black rounded-lg overflow-hidden">
                        <VideoPlayer
                            src={selectedMedia.video_url || 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'}
                            poster={selectedMedia.thumbnail}
                            autoPlay={true}
                        />
                    </div>
                    <div className="mt-4">
                        <p className="text-gray-600 dark:text-gray-300">{selectedMedia.description}</p>
                        <div className="flex gap-2 mt-2">
                            {selectedMedia.genre.map(g => (
                                <span key={g} className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">{g}</span>
                            ))}
                        </div>
                    </div>
                </Modal>
            )}

            <AIContentGeneratorModal
                isOpen={isAIModalOpen}
                onClose={() => setIsAIModalOpen(false)}
                onSuccess={() => setIsAIModalOpen(false)}
                title="AI Movie Concierge"
                promptTemplate={`Recommend 3 movies/shows based on the genre: ${activeSubNav || 'Action'}.
        
        For each recommendation:
        - Title
        - Why I'll like it
        - Streaming Platform`}
                contextData={{ genre: activeSubNav || 'Action' }}
            />
        </div>
    );
};

export default MediaApp;
