# Media App with Live TV - Database Setup

## New Collections Required

### 1. `tv_channels`
**Purpose**: Store live TV channels from M3U8 playlists

```javascript
{
  "name": "text (required)",
  "logo": "url (optional)",
  "stream_url": "url (required)", // M3U8 stream URL
  "category": "text (required)", // Sports, News, Entertainment, etc.
  "country": "text (default: Unknown)",
  "language": "text (default: en)",
  "is_active": "bool (default: true)",
  "playlist": "relation (m3u_playlists, optional)"
}
```

**Indexes**: `is_active`, `category`, `country`

### 2. `m3u_playlists`
**Purpose**: Store user M3U8 playlist sources

```javascript
{
  "name": "text (required)",
  "url": "url (required)", // M3U8 playlist URL
  "added_by": "relation (users, required)",
  "is_active": "bool (default: true)",
  "last_synced": "date (optional)",
  "channel_count": "number (default: 0)"
}
```

**Indexes**: `added_by`, `is_active`

### 3. `media_items` (Enhanced)
**Purpose**: Movies, series, documentaries

```javascript
{
  "title": "text (required)",
  "description": "text (required)",
  "type": "select (Movie, Series, Documentary, Live TV)",
  "genre": "json (array of strings)",
  "matchScore": "number (0-100)",
  "rating": "text (PG, PG-13, R, etc.)",
  "duration": "text (2h 15m, S01E01, etc.)",
  "thumbnail": "url (optional)",
  "video_url": "url (optional)",
  "imdb_id": "text (optional)",
  "year": "number (optional)",
  "cast": "json (array of strings, optional)",
  "director": "text (optional)"
}
```

---

## Sample Data

### Sample Channels
```javascript
// Sports Channel
{
  "name": "ESPN HD",
  "logo": "https://example.com/espn-logo.png",
  "stream_url": "https://stream.example.com/espn/playlist.m3u8",
  "category": "Sports",
  "country": "USA",
  "language": "en",
  "is_active": true
}

// News Channel
{
  "name": "CNN International",
  "logo": "https://example.com/cnn-logo.png",
  "stream_url": "https://stream.example.com/cnn/playlist.m3u8",
  "category": "News",
  "country": "USA",
  "language": "en",
  "is_active": true
}

// Entertainment
{
  "name": "HBO",
  "logo": "https://example.com/hbo-logo.png",
  "stream_url": "https://stream.example.com/hbo/playlist.m3u8",
  "category": "Entertainment",
  "country": "USA",
  "language": "en",
  "is_active": true
}
```

### Sample M3U Playlist
```javascript
{
  "name": "Free IPTV Channels",
  "url": "https://iptv-org.github.io/iptv/index.m3u8",
  "added_by": "user_id_123",
  "is_active": true,
  "last_synced": "2025-12-05T01:00:00Z",
  "channel_count": 150
}
```

### Sample Movies
```javascript
// Action Movie
{
  "title": "The Dark Knight",
  "description": "When the menace known as the Joker wreaks havoc on Gotham, Batman must accept one of the greatest psychological tests.",
  "type": "Movie",
  "genre": ["Action", "Crime", "Drama"],
  "matchScore": 96,
  "rating": "PG-13",
  "duration": "2h 32m",
  "year": 2008,
  "cast": ["Christian Bale", "Heath Ledger", "Aaron Eckhart"],
  "director": "Christopher Nolan"
}

// Series
{
  "title": "Breaking Bad",
  "description": "A chemistry teacher diagnosed with cancer turns to cooking meth.",
  "type": "Series",
  "genre": ["Crime", "Drama", "Thriller"],
  "matchScore": 98,
  "rating": "TV-MA",
  "duration": "5 Seasons",
  "year": 2008
}
```

---

## API Rules (PocketBase)

### `tv_channels`
```javascript
// List/View
@request.auth.id != "" && is_active = true

// Create
@request.auth.role ~ "Admin|Teacher"

// Update
@request.auth.role ~ "Admin|Teacher"

// Delete
@request.auth.role = "Admin"
```

### `m3u_playlists`
```javascript
// List/View
@request.auth.id = added_by.id || 
@request.auth.role ~ "Admin|Teacher"

// Create
@request.auth.id != ""

// Update
@request.auth.id = added_by.id || 
@request.auth.role = "Admin"

// Delete
@request.auth.id = added_by.id || 
@request.auth.role = "Admin"
```

### `media_items`
```javascript
// List/View
@request.auth.id != ""

// Create/Update/Delete
@request.auth.role ~ "Admin|Teacher"
```

---

## Features Implemented

### 1. **M3U8 Playlist Support**
- Add playlists via URL
- Auto-parse #EXTINF format
- Extract channel names, logos, categories
- Sync channels to database

### 2. **Live TV Player**
- HTML5 video player
- HLS stream support
- Channel grid view
- Modal player

### 3. **Channel Management**
- Category filtering
- Country filtering
- Search functionality
- Logo display

### 4. **Playlist Management**
- Add/remove playlists
- Sync status tracking
- Channel count statistics
- Last sync timestamp

---

## M3U8 Format Example

```m3u8
#EXTM3U
#EXTINF:-1 tvg-logo="https://example.com/logo.png" group-title="Sports",ESPN HD
https://stream.example.com/espn/playlist.m3u8
#EXTINF:-1 tvg-logo="https://example.com/cnn.png" group-title="News",CNN
https://stream.example.com/cnn/playlist.m3u8
```

---

## Popular Free M3U8 Sources

**For testing purposes**, you can use:
- [IPTV-org](https://github.com/iptv-org/iptv) - Free channels worldwide
- Public domain content playlists
- Educational broadcasting URLs

**Note**: Always ensure you have the right to stream content.

---

## Next Steps

1. Create the three collections in PocketBase admin
2. Add sample channels or import M3U8 playlist
3. Test livestreaming with public M3U8 URLs
4. Enhance with:
   - EPG (Electronic Program Guide)
   - Recording capabilities
   - Favorites system
   - Watch history

---

**Status**: Database schema ready  
**Setup Time**: 10-15 minutes  
**Live TV**: Ready to stream! 📺
