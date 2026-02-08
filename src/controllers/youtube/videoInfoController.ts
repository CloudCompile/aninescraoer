import { Request, Response } from "express";
import ytdl from "@distube/ytdl-core";
import type { YouTubeVideoInfo, VideoFormat } from "../../types/youtube/youtube";
import { getVideoInfoYtDlp } from "./ytdlpController";

// Create ytdl agent with cookies if provided for better access to restricted videos
const agent = process.env.YOUTUBE_COOKIE 
  ? ytdl.createAgent(
      process.env.YOUTUBE_COOKIE.split(';').map(cookie => {
        const [name, ...valueParts] = cookie.trim().split('=');
        return {
          name: name.trim(),
          value: valueParts.join('=').trim(),
          domain: '.youtube.com'
        };
      })
    )
  : undefined;

export async function getVideoInfo(req: Request, res: Response) {
  try {
    const { videoId } = req.params;
    const { url, backend } = req.query;

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

    // If backend=ytdlp is explicitly requested, use yt-dlp directly
    if (backend === "ytdlp") {
      console.log("Using yt-dlp backend (explicitly requested)");
      return getVideoInfoYtDlp(req, res);
    }

    // Try @distube/ytdl-core first
    try {
      // Get video info with agent if cookies are provided
      const options = agent ? { agent } : {};
      const info = await ytdl.getInfo(videoUrl, options);

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
        console.log("Incomplete data from ytdl-core, falling back to yt-dlp");
        return getVideoInfoYtDlp(req, res);
      }

      // Add backend indicator
      (videoInfo as any).backend = "@distube/ytdl-core";
      
      res.json(videoInfo);
    } catch (ytdlError) {
      console.error("@distube/ytdl-core error:", ytdlError);
      
      // Check if it's a bot detection error
      const errorMessage = ytdlError instanceof Error ? ytdlError.message : "Unknown error";
      const isBotError = errorMessage.includes("Sign in to confirm you're not a bot") || 
                         errorMessage.includes("All player APIs responded with an error");
      
      if (isBotError) {
        console.log("Bot detection error, falling back to yt-dlp");
        return getVideoInfoYtDlp(req, res);
      }
      
      // For other errors, also try yt-dlp as fallback
      console.log("Error with ytdl-core, trying yt-dlp fallback");
      return getVideoInfoYtDlp(req, res);
    }
  } catch (error) {
    console.error("Error in video info controller:", error);
    res.status(500).json({
      error: "Failed to fetch video information",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
