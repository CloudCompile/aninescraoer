import { Request, Response } from "express";
import ytpl from "ytpl";
import type { YouTubePlaylistInfo } from "../../types/youtube/youtube";

export async function getPlaylistInfo(req: Request, res: Response) {
  try {
    const { playlistId } = req.params;
    const { url, limit } = req.query;

    let playlistUrl = "";
    
    if (playlistId) {
      playlistUrl = `https://www.youtube.com/playlist?list=${playlistId}`;
    } else if (url && typeof url === "string") {
      playlistUrl = url;
    } else {
      return res.status(400).json({
        error: "Please provide either playlistId parameter or url query parameter",
      });
    }

    if (!ytpl.validateID(playlistUrl)) {
      return res.status(400).json({
        error: "Invalid YouTube playlist URL or ID",
      });
    }

    const playlistLimit = limit && typeof limit === "string" ? parseInt(limit) : 100;
    const playlist = await ytpl(playlistUrl, { limit: playlistLimit });

    const playlistInfo: YouTubePlaylistInfo = {
      id: playlist.id,
      title: playlist.title,
      thumbnail: playlist.thumbnails?.[0]?.url || playlist.bestThumbnail?.url || "",
      channelName: playlist.author?.name || "",
      channelId: playlist.author?.channelID || "",
      videoCount: playlist.estimatedItemCount,
      videos: playlist.items.map((item) => ({
        id: item.id,
        title: item.title,
        thumbnail: item.thumbnails?.[0]?.url || item.bestThumbnail?.url || "",
        duration: item.duration || undefined,
      })),
    };

    res.json(playlistInfo);
  } catch (error) {
    console.error("Error fetching playlist info:", error);
    res.status(500).json({
      error: "Failed to fetch playlist information",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
