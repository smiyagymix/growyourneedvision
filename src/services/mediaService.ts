import pb from '../lib/pocketbase';
import { isMockEnv } from '../utils/mockData';

export interface MediaItem {
  id: string;
  title: string;
  description: string;
  type: 'Movie' | 'Series' | 'Documentary' | 'Live TV';
  genre: string[];
  matchScore: number;
  rating: string;
  duration: string;
  year?: number;
  thumbnail?: string;
  video_url?: string;
  embed_url?: string;
  cast?: string[];
  director?: string;
  created: string;
}

export interface TVChannel {
  id: string;
  name: string;
  logo?: string;
  stream_url: string; // M3U8 URL
  category: string;
  country: string;
  language: string;
  is_active: boolean;
  playlist?: string;
}

export interface M3UPlaylist {
  id: string;
  name: string;
  url: string; // M3U8 playlist URL
  added_by: string;
  is_active: boolean;
  last_synced?: string;
  channel_count?: number;
}

export interface WatchHistory {
  id: string;
  user: string;
  media: string;
  watched_at: string;
  progress?: number; // percentage 0-100
  completed?: boolean;
}

const MOCK_MEDIA: MediaItem[] = [
  {
    id: 'media-1',
    title: 'Educational Adventures',
    description: 'Explore the wonders of science through engaging experiments',
    type: 'Series',
    genre: ['Educational', 'Science'],
    matchScore: 95,
    rating: 'G',
    duration: '45m',
    year: 2024,
    thumbnail: '',
    cast: ['Dr. Jane Smith', 'Prof. John Doe'],
    director: 'Emily Johnson',
    created: new Date().toISOString()
  },
  {
    id: 'media-2',
    title: 'History Unveiled',
    description: 'A documentary series exploring ancient civilizations',
    type: 'Documentary',
    genre: ['History', 'Documentary'],
    matchScore: 88,
    rating: 'PG',
    duration: '1h 30m',
    year: 2023,
    thumbnail: '',
    director: 'Michael Chen',
    created: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'media-3',
    title: 'Coding Quest',
    description: 'Learn programming through interactive storytelling',
    type: 'Movie',
    genre: ['Educational', 'Technology'],
    matchScore: 92,
    rating: 'G',
    duration: '2h',
    year: 2024,
    thumbnail: '',
    created: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
  }
];

const MOCK_CHANNELS: TVChannel[] = [
  {
    id: 'channel-1',
    name: 'Education TV',
    logo: '',
    stream_url: 'https://example.com/education.m3u8',
    category: 'Education',
    country: 'USA',
    language: 'en',
    is_active: true
  },
  {
    id: 'channel-2',
    name: 'Science Channel',
    logo: '',
    stream_url: 'https://example.com/science.m3u8',
    category: 'Science',
    country: 'USA',
    language: 'en',
    is_active: true
  },
  {
    id: 'channel-3',
    name: 'News 24',
    logo: '',
    stream_url: 'https://example.com/news.m3u8',
    category: 'News',
    country: 'UK',
    language: 'en',
    is_active: true
  }
];

const MOCK_PLAYLISTS: M3UPlaylist[] = [
  { id: 'p1', name: 'My Favorites', url: 'https://example.com/favorites.m3u8', added_by: 'user-1', is_active: true, channel_count: 12 },
  { id: 'p2', name: 'Sports Pack', url: 'https://example.com/sports.m3u8', added_by: 'user-1', is_active: true, channel_count: 50 },
  { id: 'p3', name: 'Educational', url: 'https://example.com/edu.m3u8', added_by: 'user-1', is_active: true, channel_count: 25 }
];

const MOCK_WATCH_HISTORY: WatchHistory[] = [
  { id: 'wh-1', user: 'user-1', media: 'media-1', watched_at: new Date().toISOString(), progress: 75, completed: false },
  { id: 'wh-2', user: 'user-1', media: 'media-2', watched_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), progress: 100, completed: true }
];

export const mediaService = {
  // Media Items
  getMedia: async (filter: string = '') => {
    if (isMockEnv()) {
      let filtered = MOCK_MEDIA;
      if (filter) {
        // Simple filter parsing for mock
        if (filter.includes('type')) {
          const typeMatch = filter.match(/type\s*=\s*"([^"]+)"/);
          if (typeMatch) {
            filtered = MOCK_MEDIA.filter(m => m.type === typeMatch[1]);
          }
        }
        if (filter.includes('genre')) {
          const genreMatch = filter.match(/genre\s*~\s*"([^"]+)"/);
          if (genreMatch) {
            filtered = filtered.filter(m => m.genre.some(g => g.toLowerCase().includes(genreMatch[1].toLowerCase())));
          }
        }
      }
      return {
        page: 1,
        perPage: 50,
        totalItems: filtered.length,
        totalPages: 1,
        items: filtered
      };
    }

    try {
      const result = await pb.collection('media_items').getList<MediaItem>(1, 50, {
        filter,
        sort: '-created'
      });
      return result;
    } catch (error) {
      console.error('Failed to fetch media:', error);
      return {
        page: 1,
        perPage: 50,
        totalItems: 0,
        totalPages: 0,
        items: []
      };
    }
  },

  getMediaById: async (id: string): Promise<MediaItem | null> => {
    if (isMockEnv()) {
      return MOCK_MEDIA.find(m => m.id === id) || null;
    }

    try {
      return await pb.collection('media_items').getOne<MediaItem>(id);
    } catch {
      return null;
    }
  },

  searchMedia: async (query: string): Promise<MediaItem[]> => {
    if (isMockEnv()) {
      const lowerQuery = query.toLowerCase();
      return MOCK_MEDIA.filter(m =>
        m.title.toLowerCase().includes(lowerQuery) ||
        m.description.toLowerCase().includes(lowerQuery) ||
        m.genre.some(g => g.toLowerCase().includes(lowerQuery))
      );
    }

    try {
      const result = await pb.collection('media_items').getFullList<MediaItem>({
        filter: `title ~ "${query}" || description ~ "${query}"`,
        sort: '-matchScore'
      });
      return result;
    } catch (error) {
      console.error('Failed to search media:', error);
      return [];
    }
  },

  getMediaByType: async (type: MediaItem['type']): Promise<MediaItem[]> => {
    if (isMockEnv()) {
      return MOCK_MEDIA.filter(m => m.type === type);
    }

    try {
      return await pb.collection('media_items').getFullList<MediaItem>({
        filter: `type = "${type}"`,
        sort: '-created'
      });
    } catch (error) {
      console.error('Failed to fetch media by type:', error);
      return [];
    }
  },

  getMediaByGenre: async (genre: string): Promise<MediaItem[]> => {
    if (isMockEnv()) {
      return MOCK_MEDIA.filter(m => m.genre.some(g => g.toLowerCase() === genre.toLowerCase()));
    }

    try {
      return await pb.collection('media_items').getFullList<MediaItem>({
        filter: `genre ~ "${genre}"`,
        sort: '-matchScore'
      });
    } catch (error) {
      console.error('Failed to fetch media by genre:', error);
      return [];
    }
  },

  // Live TV Channels
  getLiveChannels: async (category?: string): Promise<TVChannel[]> => {
    if (isMockEnv()) {
      return category
        ? MOCK_CHANNELS.filter(c => c.is_active && c.category === category)
        : MOCK_CHANNELS.filter(c => c.is_active);
    }

    try {
      const filter = category
        ? `is_active = true && category = "${category}"`
        : 'is_active = true';

      const result = await pb.collection('tv_channels').getFullList<TVChannel>({
        filter,
        sort: 'name'
      });
      return result;
    } catch (error) {
      console.error('Failed to fetch channels:', error);
      return [];
    }
  },

  getChannelById: async (id: string): Promise<TVChannel | null> => {
    if (isMockEnv()) {
      return MOCK_CHANNELS.find(c => c.id === id) || null;
    }

    try {
      return await pb.collection('tv_channels').getOne<TVChannel>(id);
    } catch {
      return null;
    }
  },

  getChannelsByCountry: async (country: string): Promise<TVChannel[]> => {
    if (isMockEnv()) {
      return MOCK_CHANNELS.filter(c => c.is_active && c.country === country);
    }

    return await pb.collection('tv_channels').getFullList<TVChannel>({
      filter: `is_active = true && country = "${country}"`,
      sort: 'name'
    });
  },

  getChannelCategories: async (): Promise<string[]> => {
    if (isMockEnv()) {
      return [...new Set(MOCK_CHANNELS.map(c => c.category))];
    }

    try {
      const channels = await pb.collection('tv_channels').getFullList<TVChannel>({
        filter: 'is_active = true'
      });
      return [...new Set(channels.map(c => c.category))];
    } catch (error) {
      console.error('Failed to fetch channel categories:', error);
      return [];
    }
  },

  // M3U Playlists
  getPlaylists: async (): Promise<M3UPlaylist[]> => {
    if (isMockEnv()) {
      return MOCK_PLAYLISTS.filter(p => p.is_active);
    }

    try {
      const result = await pb.collection('m3u_playlists').getFullList<M3UPlaylist>({
        filter: 'is_active = true',
        sort: '-created'
      });
      return result;
    } catch (error) {
      console.error('Failed to fetch playlists:', error);
      return [];
    }
  },

  getPlaylistById: async (id: string): Promise<M3UPlaylist | null> => {
    if (isMockEnv()) {
      return MOCK_PLAYLISTS.find(p => p.id === id) || null;
    }

    try {
      return await pb.collection('m3u_playlists').getOne<M3UPlaylist>(id);
    } catch {
      return null;
    }
  },

  addPlaylist: async (name: string, url: string, userId: string): Promise<M3UPlaylist> => {
    if (isMockEnv()) {
      const newPlaylist: M3UPlaylist = {
        id: `p-${Date.now()}`,
        name,
        url,
        added_by: userId,
        is_active: true,
        channel_count: 0
      };
      MOCK_PLAYLISTS.push(newPlaylist);
      return newPlaylist;
    }

    return await pb.collection('m3u_playlists').create({
      name,
      url,
      added_by: userId,
      is_active: true
    });
  },

  updatePlaylist: async (id: string, data: Partial<M3UPlaylist>): Promise<M3UPlaylist | null> => {
    if (isMockEnv()) {
      const playlist = MOCK_PLAYLISTS.find(p => p.id === id);
      if (playlist) {
        Object.assign(playlist, data);
      }
      return playlist || null;
    }

    return await pb.collection('m3u_playlists').update(id, data);
  },

  deletePlaylist: async (id: string): Promise<boolean> => {
    if (isMockEnv()) {
      const index = MOCK_PLAYLISTS.findIndex(p => p.id === id);
      if (index !== -1) {
        MOCK_PLAYLISTS.splice(index, 1);
      }
      return true;
    }

    try {
      await pb.collection('m3u_playlists').delete(id);
      return true;
    } catch {
      return false;
    }
  },

  // Parse M3U8 playlist
  parseM3U8Playlist: async (url: string): Promise<TVChannel[]> => {
    if (isMockEnv()) {
      // Return sample channels for mock
      return [
        { id: 'parsed-1', name: 'Channel 1', stream_url: url, category: 'General', country: 'USA', language: 'en', is_active: true },
        { id: 'parsed-2', name: 'Channel 2', stream_url: url, category: 'General', country: 'USA', language: 'en', is_active: true }
      ];
    }

    try {
      const response = await fetch(url);
      const text = await response.text();
      const channels: TVChannel[] = [];

      const lines = text.split('\n');
      let currentChannel: Partial<TVChannel> = {};

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        if (line.startsWith('#EXTINF:')) {
          // Parse channel info
          const titleMatch = line.match(/,(.+)$/);
          const logoMatch = line.match(/tvg-logo="([^"]+)"/);
          const groupMatch = line.match(/group-title="([^"]+)"/);

          currentChannel = {
            name: titleMatch ? titleMatch[1] : 'Unknown',
            logo: logoMatch ? logoMatch[1] : undefined,
            category: groupMatch ? groupMatch[1] : 'General',
            country: 'Unknown',
            language: 'en',
            is_active: true
          };
        } else if (line && !line.startsWith('#') && currentChannel.name) {
          // This is the stream URL
          currentChannel.stream_url = line;
          currentChannel.id = `ch-${Date.now()}-${channels.length}`;
          channels.push(currentChannel as TVChannel);
          currentChannel = {};
        }
      }

      return channels;
    } catch (error) {
      console.error('Failed to parse M3U8:', error);
      return [];
    }
  },

  // Sync playlist - parse and save channels
  syncPlaylist: async (playlistId: string): Promise<number> => {
    if (isMockEnv()) {
      const playlist = MOCK_PLAYLISTS.find(p => p.id === playlistId);
      if (playlist) {
        playlist.last_synced = new Date().toISOString();
        playlist.channel_count = 10;
      }
      return 10;
    }

    try {
      const playlist = await pb.collection('m3u_playlists').getOne(playlistId);
      const channels = await mediaService.parseM3U8Playlist(playlist.url);

      // Save channels to database
      for (const channelData of channels) {
        try {
          await pb.collection('tv_channels').create({
            ...channelData,
            playlist: playlistId
          });
        } catch (err) {
          console.error('Failed to save channel:', err);
        }
      }

      // Update playlist
      await pb.collection('m3u_playlists').update(playlistId, {
        last_synced: new Date().toISOString(),
        channel_count: channels.length
      });

      return channels.length;
    } catch (error) {
      console.error('Sync failed:', error);
      throw error;
    }
  },

  // Watch History
  getWatchHistory: async (userId: string): Promise<WatchHistory[]> => {
    if (isMockEnv()) {
      return MOCK_WATCH_HISTORY.filter(wh => wh.user === userId);
    }

    try {
      return await pb.collection('watch_history').getFullList<WatchHistory>({
        filter: `user = "${userId}"`,
        sort: '-watched_at',
        expand: 'media'
      });
    } catch (error) {
      console.error('Failed to fetch watch history:', error);
      return [];
    }
  },

  addToWatchHistory: async (userId: string, mediaId: string, progress: number = 0): Promise<WatchHistory | null> => {
    if (isMockEnv()) {
      const existing = MOCK_WATCH_HISTORY.find(wh => wh.user === userId && wh.media === mediaId);
      if (existing) {
        existing.watched_at = new Date().toISOString();
        existing.progress = progress;
        existing.completed = progress >= 95;
        return existing;
      }
      const newHistory: WatchHistory = {
        id: `wh-${Date.now()}`,
        user: userId,
        media: mediaId,
        watched_at: new Date().toISOString(),
        progress,
        completed: progress >= 95
      };
      MOCK_WATCH_HISTORY.push(newHistory);
      return newHistory;
    }

    try {
      // Check if already exists
      const existing = await pb.collection('watch_history').getFirstListItem<WatchHistory>(
        `user = "${userId}" && media = "${mediaId}"`
      ).catch(() => null);

      if (existing) {
        return await pb.collection('watch_history').update<WatchHistory>(existing.id, {
          watched_at: new Date().toISOString(),
          progress,
          completed: progress >= 95
        });
      }

      return await pb.collection('watch_history').create<WatchHistory>({
        user: userId,
        media: mediaId,
        watched_at: new Date().toISOString(),
        progress,
        completed: progress >= 95
      });
    } catch (error) {
      console.error('Failed to add to watch history:', error);
      return null;
    }
  },

  getContinueWatching: async (userId: string): Promise<WatchHistory[]> => {
    if (isMockEnv()) {
      return MOCK_WATCH_HISTORY.filter(wh => wh.user === userId && !wh.completed && (wh.progress || 0) > 0);
    }

    try {
      return await pb.collection('watch_history').getFullList<WatchHistory>({
        filter: `user = "${userId}" && completed = false && progress > 0`,
        sort: '-watched_at',
        expand: 'media'
      });
    } catch (error) {
      console.error('Failed to fetch continue watching:', error);
      return [];
    }
  },

  // CRUD Operations for Media Items
  createMediaItem: async (data: Omit<MediaItem, 'id' | 'created'>): Promise<MediaItem> => {
    if (isMockEnv()) {
      const newMedia: MediaItem = {
        ...data,
        id: `media-${Date.now()}`,
        created: new Date().toISOString()
      };
      MOCK_MEDIA.push(newMedia);
      return newMedia;
    }

    return await pb.collection('media_items').create(data);
  },

  updateMediaItem: async (id: string, data: Partial<MediaItem>): Promise<MediaItem | null> => {
    if (isMockEnv()) {
      const media = MOCK_MEDIA.find(m => m.id === id);
      if (media) {
        Object.assign(media, data);
      }
      return media || null;
    }

    return await pb.collection('media_items').update(id, data);
  },

  deleteMediaItem: async (id: string): Promise<boolean> => {
    if (isMockEnv()) {
      const index = MOCK_MEDIA.findIndex(m => m.id === id);
      if (index !== -1) {
        MOCK_MEDIA.splice(index, 1);
      }
      return true;
    }

    try {
      await pb.collection('media_items').delete(id);
      return true;
    } catch {
      return false;
    }
  },

  // CRUD Operations for Channels
  createChannel: async (data: Omit<TVChannel, 'id'>): Promise<TVChannel> => {
    if (isMockEnv()) {
      const newChannel: TVChannel = {
        ...data,
        id: `channel-${Date.now()}`
      };
      MOCK_CHANNELS.push(newChannel);
      return newChannel;
    }

    return await pb.collection('tv_channels').create(data);
  },

  updateChannel: async (id: string, data: Partial<TVChannel>): Promise<TVChannel | null> => {
    if (isMockEnv()) {
      const channel = MOCK_CHANNELS.find(c => c.id === id);
      if (channel) {
        Object.assign(channel, data);
      }
      return channel || null;
    }

    return await pb.collection('tv_channels').update(id, data);
  },

  deleteChannel: async (id: string): Promise<boolean> => {
    if (isMockEnv()) {
      const index = MOCK_CHANNELS.findIndex(c => c.id === id);
      if (index !== -1) {
        MOCK_CHANNELS.splice(index, 1);
      }
      return true;
    }

    try {
      await pb.collection('tv_channels').delete(id);
      return true;
    } catch {
      return false;
    }
  },

  // Statistics
  getMediaStats: async (): Promise<{
    totalMedia: number;
    byType: Record<string, number>;
    totalChannels: number;
    totalPlaylists: number;
  }> => {
    if (isMockEnv()) {
      const byType: Record<string, number> = {};
      MOCK_MEDIA.forEach(m => {
        byType[m.type] = (byType[m.type] || 0) + 1;
      });

      return {
        totalMedia: MOCK_MEDIA.length,
        byType,
        totalChannels: MOCK_CHANNELS.filter(c => c.is_active).length,
        totalPlaylists: MOCK_PLAYLISTS.filter(p => p.is_active).length
      };
    }

    try {
      const [media, channels, playlists] = await Promise.all([
        pb.collection('media_items').getFullList<MediaItem>(),
        pb.collection('tv_channels').getFullList<TVChannel>({ filter: 'is_active = true' }),
        pb.collection('m3u_playlists').getFullList<M3UPlaylist>({ filter: 'is_active = true' })
      ]);

      const byType: Record<string, number> = {};
      media.forEach(m => {
        byType[m.type] = (byType[m.type] || 0) + 1;
      });

      return {
        totalMedia: media.length,
        byType,
        totalChannels: channels.length,
        totalPlaylists: playlists.length
      };
    } catch (error) {
      console.error('Failed to get media stats:', error);
      return { totalMedia: 0, byType: {}, totalChannels: 0, totalPlaylists: 0 };
    }
  }
};
