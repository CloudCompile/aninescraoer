export interface SpotifyTrackInfo {
  title: string;
  artist: string;
  duration: number;
  image: string;
  previewUrl: string | null;
  spotifyUrl: string;
  uri: string;
}

export interface SpotifyTrackResult {
  track: SpotifyTrackInfo;
  youtubeQuery: string;
  youtubeVideoId?: string;
}
