import { Request, Response } from "express";
import { YtdlCore, toPipeableStream } from "@ybd-project/ytdl-core";

// Create ytdl instance with enhanced configuration to avoid bot detection  
const ytdl = new YtdlCore({
  // Minimal logging - only errors
  logDisplay: ['error'],
  // Disable automatic poToken generation since it doesn't work reliably in Node.js
  disablePoTokenAutoGeneration: true,
  // Use only the most reliable mobile clients (ios, android)
  // These are less likely to trigger bot detection than web clients
  clients: ['ios', 'android'],
  // Disable default clients to prevent using web/mweb/tv which are more likely to be blocked
  disableDefaultClients: true,
  // Disable file cache to avoid stale data
  disableFileCache: true,
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

export async function downloadVideo(req: Request, res: Response) {
  try {
    const { videoId } = req.params;
    const { url, quality, filter } = req.query;

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

    const info = await ytdl.getBasicInfo(videoUrl);
    const title = info.videoDetails.title.replace(/[^\w\s-]/g, "");

    // Set headers for download
    res.setHeader("Content-Disposition", `attachment; filename="${title}.mp4"`);
    res.setHeader("Content-Type", "video/mp4");

    // Download and stream the video
    const stream = await ytdl.download(videoUrl, {
      quality: quality && typeof quality === "string" ? quality as any : "highest",
      filter: filter && typeof filter === "string" ? filter as any : undefined,
    });
    
    toPipeableStream(stream).pipe(res);
  } catch (error) {
    console.error("Error downloading video:", error);
    if (!res.headersSent) {
      res.status(500).json({
        error: "Failed to download video",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}

export async function streamVideo(req: Request, res: Response) {
  try {
    const { videoId } = req.params;
    const { url, quality, filter } = req.query;

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

    // Set headers for streaming
    res.setHeader("Content-Type", "video/mp4");

    // Download and stream the video
    const stream = await ytdl.download(videoUrl, {
      quality: quality && typeof quality === "string" ? quality as any : "highest",
      filter: filter && typeof filter === "string" ? filter as any : undefined,
    });
    
    toPipeableStream(stream).pipe(res);
  } catch (error) {
    console.error("Error streaming video:", error);
    if (!res.headersSent) {
      res.status(500).json({
        error: "Failed to stream video",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}
