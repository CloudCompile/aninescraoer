import { Request, Response } from "express";
import type { SpotifyTrackInfo } from "../../types/spotify/spotify";

// Initialize spotify-url-info with native fetch
const spotifyInfo = require("spotify-url-info")(fetch);

/**
 * Validate a Spotify URL
 */
function isSpotifyUrl(url: string): boolean {
  return /^https?:\/\/(open\.)?spotify\.com\/(track|album|playlist)\//.test(url);
}

/**
 * GET /spotify/info?url=<spotify_url>
 *
 * Returns metadata about a Spotify track, album, or playlist.
 */
export async function getTrackInfo(req: Request, res: Response) {
  try {
    const { url } = req.query;

    if (!url || typeof url !== "string") {
      return res.status(400).json({
        error: "Please provide a Spotify URL via the 'url' query parameter",
      });
    }

    if (!isSpotifyUrl(url)) {
      return res.status(400).json({
        error: "Invalid Spotify URL. Please provide a valid Spotify track, album, or playlist URL",
      });
    }

    // Get preview data (lightweight)
    const preview = await spotifyInfo.getPreview(url);
    // Get tracks (useful for albums/playlists)
    const tracks = await spotifyInfo.getTracks(url);

    if (preview.type === "track") {
      const trackInfo: SpotifyTrackInfo = {
        title: preview.title || preview.track,
        artist: preview.artist,
        duration: tracks[0]?.duration || 0,
        image: preview.image,
        previewUrl: preview.audio || tracks[0]?.previewUrl || null,
        spotifyUrl: preview.link,
        uri: tracks[0]?.uri || "",
      };

      return res.json({
        type: "track",
        track: trackInfo,
        youtubeQuery: `${trackInfo.artist} - ${trackInfo.title}`,
      });
    }

    // For albums/playlists, return all tracks
    const trackList = tracks.map((t: any) => ({
      title: t.name,
      artist: t.artist,
      duration: t.duration || 0,
      previewUrl: t.previewUrl || null,
      uri: t.uri || "",
    }));

    return res.json({
      type: preview.type || "playlist",
      title: preview.title,
      artist: preview.artist,
      image: preview.image,
      link: preview.link,
      tracks: trackList,
      total: trackList.length,
    });
  } catch (error) {
    console.error("Error getting Spotify info:", error);
    res.status(500).json({
      error: "Failed to get Spotify track information",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
