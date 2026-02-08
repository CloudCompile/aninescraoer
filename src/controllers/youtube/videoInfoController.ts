import { Request, Response } from "express";
import ytdl from "@distube/ytdl-core";
import type { YouTubeVideoInfo, VideoFormat } from "../../types/youtube/youtube";

export async function getVideoInfo(req: Request, res: Response) {
  try {
    const { videoId } = req.params;
    const { url } = req.query;

    let videoUrl = "";
    
    if (videoId) {
      videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    } else if (url && typeof url === "string") {
      videoUrl = url;
    } else {
      return res.status(400).json({
        error: "Please provide either videoId parameter or url query parameter",
      });
    }

    // Get video info - using simple approach like the working reference implementation
    const info = await ytdl.getInfo(videoUrl);

    const formats: VideoFormat[] = (info.formats || []).map((format: any) => ({
      quality: format.qualityLabel || format.quality || "unknown",
      url: format.url,
      mimeType: format.mimeType || "unknown",
      hasVideo: format.hasVideo,
      hasAudio: format.hasAudio,
      container: format.container || "unknown",
      bitrate: format.bitrate,
      videoCodec: format.videoCodec || undefined,
      audioCodec: format.audioCodec || undefined,
      qualityLabel: format.qualityLabel || undefined,
      fps: format.fps || undefined,
      width: format.width || undefined,
      height: format.height || undefined,
    }));

    const videoInfo: YouTubeVideoInfo = {
      videoId: info.videoDetails.videoId,
      title: info.videoDetails.title,
      description: info.videoDetails.description || "",
      thumbnail: info.videoDetails.thumbnails?.[info.videoDetails.thumbnails.length - 1]?.url || 
                 info.videoDetails.thumbnail?.thumbnails?.[0]?.url || "",
      duration: Number(info.videoDetails.lengthSeconds),
      uploadDate: info.videoDetails.publishDate || info.videoDetails.uploadDate || "",
      author: {
        name: info.videoDetails.author?.name || info.videoDetails.ownerChannelName || "Unknown",
        channelId: info.videoDetails.author?.id || info.videoDetails.channelId || "",
        channelUrl: info.videoDetails.author?.channel_url || 
                    (info.videoDetails.channelId ? `https://www.youtube.com/channel/${info.videoDetails.channelId}` : ""),
        thumbnails: info.videoDetails.author?.thumbnails || [],
      },
      stats: {
        views: Number(info.videoDetails.viewCount),
        likes: (info.videoDetails as any).likes ?? undefined,
      },
      formats,
    };

    // Check if we got valid video data
    if (!videoInfo.videoId || !videoInfo.title || !formats || formats.length === 0) {
      return res.status(429).json({
        error: "YouTube bot detection triggered",
        message: "This video is currently unavailable due to YouTube's bot protection. The video data could not be retrieved.",
        suggestion: "Try again later, or provide YOUTUBE_PO_TOKEN and YOUTUBE_VISITOR_DATA environment variables for better reliability. See README for details.",
        videoId: req.params.videoId || (typeof req.query.url === "string" ? req.query.url : "unknown"),
        partialData: {
          channelId: videoInfo.author.channelId,
          likes: videoInfo.stats.likes
        }
      });
    }

    res.json(videoInfo);
  } catch (error) {
    console.error("Error fetching video info:", error);
    
    // Check if it's a bot detection error
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const isBotError = errorMessage.includes("Sign in to confirm you're not a bot") || 
                       errorMessage.includes("All player APIs responded with an error");
    
    if (isBotError) {
      res.status(429).json({
        error: "YouTube bot detection triggered",
        message: "This video is currently unavailable due to YouTube's bot protection. This typically happens with certain videos that have stricter access controls.",
        suggestion: "Try again later, or provide YOUTUBE_PO_TOKEN and YOUTUBE_VISITOR_DATA environment variables for better reliability.",
        videoId: req.params.videoId || (typeof req.query.url === "string" ? req.query.url : "unknown")
      });
    } else {
      res.status(500).json({
        error: "Failed to fetch video information",
        message: errorMessage,
      });
    }
  }
}
