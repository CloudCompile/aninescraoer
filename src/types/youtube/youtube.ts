export interface YouTubeVideoInfo {
  videoId: string;
  title: string;
  description: string;
  thumbnail: string;
  duration: number;
  uploadDate: string;
  author: {
    name: string;
    channelId: string;
    channelUrl: string;
    thumbnails?: Array<{ url: string; width: number; height: number }>;
  };
  stats: {
    views: number;
    likes?: number;
  };
  formats?: VideoFormat[];
}

export interface VideoFormat {
  quality: string;
  url: string;
  mimeType: string;
  hasVideo: boolean;
  hasAudio: boolean;
  container: string;
  bitrate?: number;
  videoCodec?: string;
  audioCodec?: string;
  qualityLabel?: string;
  fps?: number;
  width?: number;
  height?: number;
}

export interface YouTubeSearchResult {
  type: "video" | "channel" | "playlist";
  id: string;
  title: string;
  thumbnail: string;
  channelName?: string;
  channelId?: string;
  duration?: string;
  views?: number;
  uploadedAt?: string;
}

export interface YouTubePlaylistInfo {
  id: string;
  title: string;
  thumbnail: string;
  channelName: string;
  channelId: string;
  videoCount: number;
  videos: Array<{
    id: string;
    title: string;
    thumbnail: string;
    duration?: string;
  }>;
}

export interface DownloadOptions {
  quality?: "highest" | "lowest" | "highestaudio" | "lowestaudio" | "highestvideo" | "lowestvideo";
  filter?: "audioandvideo" | "videoonly" | "audioonly";
  format?: string;
}
