# ⚡YouTube API & Downloader⚡
<p align="center">
  <img src="https://skillicons.dev/icons?i=ts,express,nodejs,docker" />
  <br/>
  <a href="https://aninescraper.vercel.app"><kbd>YouTube API & Downloader</kbd></a>
</p>
<br/><br/>

A powerful YouTube API built with TypeScript, Express, and Node.js. Search videos, get video information, download videos, stream content, and manage playlists.

## 🚀 Features

- 🔍 **Search** - Search for videos, channels, and playlists
- 📊 **Video Info** - Get detailed information about any YouTube video
- ⬇️ **Download** - Download videos in various qualities and formats
- 📺 **Stream** - Stream videos directly through the API
- 📋 **Playlists** - Get playlist information and videos
- 🎬 **IMDb Integration** - Search IMDb for additional metadata

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/CloudCompile/aninescraoer.git
cd aninescraoer

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## 🔧 Environment Variables

Create a `.env` file in the root directory:

```env
PORT=3001

# Optional: YouTube cookies for age-restricted/region-locked videos
# To obtain cookies, log into YouTube in your browser, then:
# 1. Open DevTools (F12) -> Application/Storage tab -> Cookies
# 2. Copy all cookies for youtube.com
# 3. Format as: name1=value1; name2=value2; name3=value3
YOUTUBE_COOKIE=your_youtube_cookies_here
```

### ⚠️ YouTube Bot Detection & Video Access

This API uses @distube/ytdl-core which works well for most public YouTube videos. However, some videos may be inaccessible:

**Videos that work:**
- Most public videos without restrictions
- Example: https://www.youtube.com/watch?v=dQw4w9WgXcQ (Rick Astley - Never Gonna Give You Up)

**Videos that may fail:**
- Age-restricted videos (requires cookies from a logged-in YouTube account)
- Region-locked videos
- Private videos
- YouTube Premium content
- Some videos with strict bot detection

**Workarounds for restricted videos:**
- Provide YouTube cookies via `YOUTUBE_COOKIE` environment variable (see above)
- Cookies can be obtained from a logged-in browser session
- Note: Cookies expire and need periodic renewal

## 📚 API Documentation

### Base URL
```
http://localhost:3001
```

## YouTube Endpoints

### 🔍 Search Videos

Search for YouTube videos, channels, or playlists.

#### Endpoint
```
GET /youtube/search?query={query}&limit={limit}&type={type}
```

#### Query Parameters

| Parameter | Type | Description | Required | Default |
|-----------|------|-------------|----------|---------|
| `query` | string | Search query | YES | - |
| `limit` | number | Maximum results (1-100) | NO | 20 |
| `type` | string | Filter by type: `video`, `channel`, or `playlist` | NO | all |

#### Example Request
```javascript
const res = await fetch(
  "http://localhost:3001/youtube/search?query=javascript+tutorial&limit=10&type=video"
);
const data = await res.json();
console.log(data);
```

#### Response Schema
```typescript
{
  "query": string,
  "results": [
    {
      "type": "video" | "channel" | "playlist",
      "id": string,
      "title": string,
      "thumbnail": string,
      "channelName": string,
      "channelId": string,
      "duration": string,
      "views": number,
      "uploadedAt": string
    }
  ],
  "total": number
}
```

### 📊 Get Video Info

Get detailed information about a specific YouTube video.

#### Endpoint
```
GET /youtube/info/{videoId}
GET /youtube/info?url={url}
```

#### Parameters

| Parameter | Type | Description | Required |
|-----------|------|-------------|----------|
| `videoId` | string | YouTube video ID (path parameter) | YES (or url) |
| `url` | string | Full YouTube URL (query parameter) | YES (or videoId) |

#### Example Request
```javascript
// Using video ID
const res = await fetch("http://localhost:3001/youtube/info/dQw4w9WgXcQ");

// Using URL
const res = await fetch(
  "http://localhost:3001/youtube/info?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ"
);
const data = await res.json();
console.log(data);
```

#### Response Schema
```typescript
{
  "videoId": string,
  "title": string,
  "description": string,
  "thumbnail": string,
  "duration": number,
  "uploadDate": string,
  "author": {
    "name": string,
    "channelId": string,
    "channelUrl": string,
    "thumbnails": Array<{ url: string, width: number, height: number }>
  },
  "stats": {
    "views": number,
    "likes": number
  },
  "formats": [
    {
      "quality": string,
      "url": string,
      "mimeType": string,
      "hasVideo": boolean,
      "hasAudio": boolean,
      "container": string,
      "bitrate": number,
      "qualityLabel": string,
      "fps": number,
      "width": number,
      "height": number
    }
  ]
}
```

### ⬇️ Download Video

Download a YouTube video.

#### Endpoint
```
GET /youtube/download/{videoId}?quality={quality}&filter={filter}
GET /youtube/download?url={url}&quality={quality}&filter={filter}
```

#### Parameters

| Parameter | Type | Description | Required | Default |
|-----------|------|-------------|----------|---------|
| `videoId` | string | YouTube video ID (path parameter) | YES (or url) | - |
| `url` | string | Full YouTube URL (query parameter) | YES (or videoId) | - |
| `quality` | string | Quality: `highest`, `lowest`, `highestaudio`, `lowestaudio` | NO | highest |
| `filter` | string | Filter: `audioandvideo`, `videoonly`, `audioonly` | NO | - |

#### Example Request
```javascript
// Download highest quality
const res = await fetch("http://localhost:3001/youtube/download/dQw4w9WgXcQ");

// Download audio only
const res = await fetch(
  "http://localhost:3001/youtube/download/dQw4w9WgXcQ?filter=audioonly"
);
```

#### Response
Binary video/audio file download

### 📺 Stream Video

Stream a YouTube video without downloading.

#### Endpoint
```
GET /youtube/stream/{videoId}?quality={quality}&filter={filter}
GET /youtube/stream?url={url}&quality={quality}&filter={filter}
```

#### Parameters

Same as download endpoint.

#### Example Request
```javascript
// Stream video
const videoUrl = "http://localhost:3001/youtube/stream/dQw4w9WgXcQ";

// Use in HTML video player
<video src={videoUrl} controls />
```

#### Response
Video/audio stream

### 📋 Get Playlist Info

Get information about a YouTube playlist.

#### Endpoint
```
GET /youtube/playlist/{playlistId}?limit={limit}
GET /youtube/playlist?url={url}&limit={limit}
```

#### Parameters

| Parameter | Type | Description | Required | Default |
|-----------|------|-------------|----------|---------|
| `playlistId` | string | YouTube playlist ID (path parameter) | YES (or url) | - |
| `url` | string | Full YouTube playlist URL (query parameter) | YES (or playlistId) | - |
| `limit` | number | Maximum videos to return | NO | 100 |

#### Example Request
```javascript
const res = await fetch(
  "http://localhost:3001/youtube/playlist/PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf"
);
const data = await res.json();
console.log(data);
```

#### Response Schema
```typescript
{
  "id": string,
  "title": string,
  "thumbnail": string,
  "channelName": string,
  "channelId": string,
  "videoCount": number,
  "videos": [
    {
      "id": string,
      "title": string,
      "thumbnail": string,
      "duration": string
    }
  ]
}
```

## IMDb Endpoints

### 🔍 Search IMDb

Search for movies and shows on IMDb.

#### Endpoint
```
GET /imdb/search?query={query}&type={type}&limit={limit}
```

#### Query Parameters

| Parameter | Type | Description | Required | Default |
|-----------|------|-------------|----------|---------|
| `query` | string | Search query | YES | - |
| `type` | string | Filter by `movie` or `show` | NO | all |
| `limit` | number | Maximum results (1-50) | NO | 20 |

#### Example Request
```javascript
const res = await fetch(
  "http://localhost:3001/imdb/search?query=inception&type=movie&limit=5"
);
const data = await res.json();
console.log(data);
```

## 🐳 Docker Deployment

```bash
# Build the Docker image
docker build -t youtube-api .

# Run the container
docker run -p 3001:3001 youtube-api
```

## 📝 Vercel Deployment

Click the button below to deploy to Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/import/project?template=https://github.com/CloudCompile/aninescraoer)

## ⚙️ Configuration

The API uses local caching to improve performance:

| Route | Caching Duration |
|-------|------------------|
| `/youtube/search` | 1 hour |
| `/youtube/info/*` | 1 day |
| `/youtube/playlist/*` | 1 day |
| `/imdb/search` | 1 hour |

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

ISC License

## 🙏 Acknowledgments

- [@distube/ytdl-core](https://github.com/distubeDev/ytdl-core) - YouTube download library
- [ytsr](https://github.com/TimeForANinja/node-ytsr) - YouTube search library
- [ytpl](https://github.com/TimeForANinja/node-ytpl) - YouTube playlist library
- [Express](https://expressjs.com/) - Web framework
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript

## ⚠️ Disclaimer

This API is for educational purposes only. Please respect YouTube's Terms of Service and copyright laws. Use responsibly.
