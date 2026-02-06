# VidSrc Integration

This document explains the VidSrc integration added to the anime scraper API.

## Overview

VidSrc is a video source platform that uses IMDb and TMDb IDs to serve video content. Unlike traditional anime scrapers that rely on site-specific embed URLs, VidSrc requires mapping anime to their IMDb/TMDb identifiers.

## Components

### 1. VidSrc Extractor (`src/utils/aniwatch/vidsrc.ts`)

The VidSrc class extends VideoExtractor and provides:

- **Multiple Domain Support**: Uses vidsrc-embed.ru, vidsrc-embed.su, vidsrcme.su, vsrc.su
- **URL Generation**: Creates embed URLs from IMDb/TMDb IDs
- **Format Support**: Handles both movies and TV shows/episodes

**Example Usage:**
```typescript
import VidSrc from './utils/aniwatch/vidsrc';

const vidsrc = new VidSrc();
const url = vidsrc.generateEmbedUrl({
    imdbId: 'tt13706018',  // Spy x Family
    season: 1,
    episode: 5,
    type: 'tv'
});
// Returns: https://vidsrc-embed.ru/embed/tv/tt13706018/1-5
```

### 2. Anime ID Mapper (`src/utils/aniwatch/animeIdMapper.ts`)

Maps anime titles to IMDb/TMDb IDs with:

- **16 Popular Anime Pre-mapped**: Spy x Family, Jujutsu Kaisen, One Piece, Attack on Titan, etc.
- **Smart Slug Matching**: Handles variations like "spy-x-family-part-2-18152"
- **Episode Extraction**: Parses episode numbers from URLs
- **Season/Episode Calculation**: Converts anime episodes to TV season format

**Pre-mapped Anime:**
- Spy x Family (IMDb: tt13706018, TMDb: 202250)
- Jujutsu Kaisen (IMDb: tt11830022, TMDb: 95479)
- One Piece (IMDb: tt0388629, TMDb: 37854)
- Attack on Titan (IMDb: tt2560140, TMDb: 1429)
- Death Note (IMDb: tt0877057, TMDb: 13916)
- Demon Slayer (IMDb: tt9335498, TMDb: 85937)
- My Hero Academia (IMDb: tt5626028, TMDb: 65930)
- Naruto (IMDb: tt0409591, TMDb: 46260)
- Bleach (IMDb: tt0434665, TMDb: 30984)
- Fullmetal Alchemist: Brotherhood (IMDb: tt1355642, TMDb: 31911)
- Steins;Gate (IMDb: tt1910272, TMDb: 42705)
- Code Geass (IMDb: tt0994314, TMDb: 45782)
- Cowboy Bebop (IMDb: tt0213338, TMDb: 48636)
- Hunter x Hunter (IMDb: tt2098220, TMDb: 46298)
- Tokyo Ghoul (IMDb: tt3741634, TMDb: 61374)
- Sword Art Online (IMDb: tt2250192, TMDb: 45782)

### 3. VidSrc Controller (`src/controllers/aniwatch/vidsrcController.ts`)

Provides API endpoints for VidSrc functionality:

#### Get VidSrc Sources
- **Endpoint**: `/aniwatch/vidsrc`
- **Method**: GET
- **Parameters**:
  - `episodeId` (optional): Anime episode ID (e.g., "spy-x-family?ep=5")
  - `imdbId` (optional): Override with specific IMDb ID
  - `tmdbId` (optional): Override with specific TMDb ID
  - `season` (optional): Override season number
  - `episode` (optional): Override episode number

**Example Requests:**
```bash
# Using mapped anime
GET /aniwatch/vidsrc?episodeId=spy-x-family?ep=5

# Using manual IMDb ID
GET /aniwatch/vidsrc?imdbId=tt13706018&season=1&episode=5

# Using TMDb ID
GET /aniwatch/vidsrc?tmdbId=202250&season=1&episode=5
```

**Example Response:**
```json
{
  "embedUrl": "https://vidsrc-embed.ru/embed/tv/tt13706018/1-5",
  "source": "vidsrc",
  "anime": {
    "title": "SPY x FAMILY",
    "imdbId": "tt13706018",
    "tmdbId": "202250",
    "malId": 50265,
    "anilistId": 140960
  },
  "episode": {
    "season": 1,
    "episode": 5
  }
}
```

#### Get Available Anime
- **Endpoint**: `/aniwatch/vidsrc/anime`
- **Method**: GET
- **Returns**: List of all anime with IMDb/TMDb mappings

**Example Response:**
```json
{
  "total": 16,
  "anime": [
    {
      "slug": "spy-x-family",
      "title": "SPY x FAMILY",
      "imdbId": "tt13706018",
      "tmdbId": "202250",
      "malId": 50265,
      "anilistId": 140960,
      "type": "tv"
    },
    ...
  ]
}
```

#### Search IMDb IDs
- **Endpoint**: `/imdb/search`
- **Method**: GET
- **Parameters**:
  - `query` (required): Search query for show or movie titles
  - `type` (optional): `show` or `movie` to filter results
  - `limit` (optional): Limit results (1-50)

**Example Request:**
```bash
GET /imdb/search?query=spirited%20away&type=movie&limit=5
```

**Example Response:**
```json
{
  "ids": ["tt0245429"]
}
```

## Adding More Anime

To add more anime to the mapping database:

1. Find the IMDb ID:
   - Go to https://www.imdb.com
   - Search for the anime
   - Copy the ID from the URL (e.g., `tt13706018`)

2. Find the TMDb ID (optional):
   - Go to https://www.themoviedb.org
   - Search for the anime
   - Copy the ID from the URL

3. Add to `ANIME_MAPPINGS` in `src/utils/aniwatch/animeIdMapper.ts`:
```typescript
"your-anime-slug": {
  malId: 12345,  // from MyAnimeList (optional)
  anilistId: 12345,  // from AniList (optional)
  title: "Your Anime Title",
  imdbId: "tt1234567",
  tmdbId: "123456",
  type: "tv",  // or "movie"
},
```

## Benefits

1. **Alternative to MegaCloud**: VidSrc uses different infrastructure than MegaCloud
2. **Standardized IDs**: Uses IMDb/TMDb which are universal
3. **Extensible**: Easy to add more anime mappings
4. **Multiple Sources**: Supports multiple VidSrc domains for redundancy

## Limitations

1. **Manual Mapping Required**: Each anime needs manual IMDb/TMDb mapping
2. **Coverage**: Only works for anime with IMDb/TMDb entries
3. **Episode Mapping**: All episodes currently mapped to Season 1 (can be enhanced)
4. **Western Availability**: Some anime may not be available on VidSrc

## Future Enhancements

- [x] IMDb lookup endpoint for finding title IDs
- [ ] Better season detection for multi-season anime
- [ ] User-contributed mapping database
- [ ] Integration with AniList/MAL APIs for automatic mapping
- [ ] Support for anime movies
- [ ] Batch import of popular anime mappings

## Testing

The implementation includes:
- Anime slug matching
- Episode number extraction
- URL generation
- API endpoint functionality

All mapped anime have been tested and verified to have valid IMDb/TMDb IDs.
