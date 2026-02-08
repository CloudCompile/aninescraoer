import { Request, Response } from "express";
import { YtdlCore } from "@ybd-project/ytdl-core";
import type { YouTubeVideoInfo, VideoFormat } from "../../types/youtube/youtube";

// Create ytdl instance and initialize poToken
const ytdl = new YtdlCore({
  logDisplay: [] // Disable logs in production
});

// Pre-generate poToken to avoid bot detection
let poTokenInitialized = false;
async function initializePoToken() {
  if (!poTokenInitialized) {
    try {
      const tokens = await ytdl.generatePoToken();
      console.log("PoToken generated successfully");
      poTokenInitialized = true;
    } catch (error) {
      console.error("Failed to generate poToken:", error);
    }
  }
}

// Initialize on module load
initializePoToken();

export async function getVideoInfo(req: Request, res: Response) {
  try {
    // Ensure poToken is initialized
    await initializePoToken();
    
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

    const info = await ytdl.getFullInfo(videoUrl);

    const formats: VideoFormat[] = info.formats.map((format: any) => ({
      quality: format.quality?.label || format.quality?.text || "unknown",
      url: format.url,
      mimeType: format.mimeType || "unknown",
      hasVideo: format.hasVideo,
      hasAudio: format.hasAudio,
      container: format.container || "unknown",
      bitrate: format.bitrate,
      videoCodec: format.codecs?.split(",")?.[0] || undefined,
      audioCodec: format.codecs?.split(",")?.[1] || undefined,
      qualityLabel: format.quality?.label || undefined,
      fps: format.approxDurationMs ? undefined : undefined, // FPS not directly available
      width: format.width || undefined,
      height: format.height || undefined,
    }));

    const videoInfo: YouTubeVideoInfo = {
      videoId: info.videoDetails.videoId,
      title: info.videoDetails.title,
      description: info.videoDetails.description || "",
      thumbnail: info.videoDetails.thumbnails[info.videoDetails.thumbnails.length - 1]?.url || "",
      duration: Number(info.videoDetails.lengthSeconds),
      uploadDate: info.videoDetails.publishDate || "",
      author: {
        name: info.videoDetails.author?.name || "Unknown",
        channelId: info.videoDetails.author?.id || "",
        channelUrl: info.videoDetails.author?.channelUrl || "",
        thumbnails: info.videoDetails.author?.thumbnails || [],
      },
      stats: {
        views: Number(info.videoDetails.viewCount),
        likes: info.videoDetails.likes ?? undefined,
      },
      formats,
    };

    res.json(videoInfo);
  } catch (error) {
    console.error("Error fetching video info:", error);
    res.status(500).json({
      error: "Failed to fetch video information",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
