import { Request, Response } from "express";
import { YtdlCore } from "@ybd-project/ytdl-core";
import type { YouTubeVideoInfo, VideoFormat } from "../../types/youtube/youtube";

// Create ytdl instance with enhanced configuration to avoid bot detection  
// PoToken and visitorData can be provided via environment variables for better bot protection
const ytdl = new YtdlCore({
  // Enable detailed logging to diagnose bot detection issues
  logDisplay: ['error', 'warning', 'info'],
  // Disable automatic poToken generation since it doesn't work reliably in Node.js
  disablePoTokenAutoGeneration: true,
  // Use manual poToken if provided via environment variable
  poToken: process.env.YOUTUBE_PO_TOKEN || undefined,
  visitorData: process.env.YOUTUBE_VISITOR_DATA || undefined,
  // Use multiple client types for better fallback
  // android and tvEmbedded are most reliable for avoiding bot detection
  clients: ['android', 'tvEmbedded', 'webEmbedded'],
  // Disable default clients to have full control
  disableDefaultClients: true,
  // Disable file cache to avoid stale data
  disableFileCache: true,
  // Parse HLS format for live streams
  parsesHLSFormat: true,
  // Don't include API responses to reduce payload
  includesPlayerAPIResponse: false,
  includesNextAPIResponse: false
});

// Pre-generate poToken to avoid bot detection (optional - may not work in Node.js)
// Commenting out since poToken generation doesn't work in Node.js without browser
/*
let poTokenInitialized = false;
let poTokenInitializing: Promise<void> | null = null;

async function initializePoToken() {
  if (poTokenInitialized) {
    return;
  }
  
  if (poTokenInitializing) {
    return poTokenInitializing;
  }
  
  poTokenInitializing = (async () => {
    try {
      const result = await ytdl.generatePoToken();
      if (result.poToken && result.visitorData) {
        console.log("PoToken and VisitorData generated successfully");
        poTokenInitialized = true;
      } else {
        console.warn("PoToken generation returned empty values - continuing without it");
      }
    } catch (error) {
      console.error("Failed to generate poToken:", error);
    } finally {
      poTokenInitializing = null;
    }
  })();
  
  return poTokenInitializing;
}

// Initialize on module load
initializePoToken();
*/

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
      fps: undefined, // FPS not directly available in new library
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
