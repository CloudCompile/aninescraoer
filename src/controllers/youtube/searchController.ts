import { Request, Response } from "express";
import ytsr from "ytsr";
import type { YouTubeSearchResult } from "../../types/youtube/youtube";

export async function searchVideos(req: Request, res: Response) {
  try {
    const { query, limit, type } = req.query;

    if (!query || typeof query !== "string") {
      return res.status(400).json({
        error: "Please provide a search query",
      });
    }

    const searchLimit = limit && typeof limit === "string" ? parseInt(limit) : 20;

    const filters = await ytsr.getFilters(query);
    let filter;
    
    if (type === "video") {
      filter = filters.get("Type")?.get("Video");
    } else if (type === "channel") {
      filter = filters.get("Type")?.get("Channel");
    } else if (type === "playlist") {
      filter = filters.get("Type")?.get("Playlist");
    }

    const searchResults = await ytsr(filter?.url || query, { limit: searchLimit });

    const results = searchResults.items.map((item: any) => {
      if (item.type === "video") {
        return {
          type: "video" as const,
          id: item.id,
          title: item.title,
          thumbnail: item.thumbnails?.[0]?.url || item.bestThumbnail?.url || "",
          channelName: item.author?.name,
          channelId: item.author?.channelID,
          duration: item.duration,
          views: item.views,
          uploadedAt: item.uploadedAt,
        };
      } else if (item.type === "channel") {
        return {
          type: "channel" as const,
          id: item.channelID,
          title: item.name,
          thumbnail: item.thumbnails?.[0]?.url || item.bestAvatar?.url || "",
          channelName: item.name,
          channelId: item.channelID,
        };
      } else if (item.type === "playlist") {
        return {
          type: "playlist" as const,
          id: item.playlistID,
          title: item.title,
          thumbnail: item.thumbnails?.[0]?.url || item.firstVideo?.thumbnails?.[0]?.url || "",
          channelName: item.owner?.name,
          channelId: item.owner?.channelID,
        };
      }
      return null;
    }).filter((item: any) => item !== null) as YouTubeSearchResult[];

    res.json({
      query,
      results,
      total: results.length,
    });
  } catch (error) {
    console.error("Error searching videos:", error);
    res.status(500).json({
      error: "Failed to search videos",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
