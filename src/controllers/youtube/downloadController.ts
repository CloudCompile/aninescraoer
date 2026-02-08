import { Request, Response } from "express";
import { YtdlCore, toPipeableStream } from "@ybd-project/ytdl-core";

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

export async function downloadVideo(req: Request, res: Response) {
  try {
    // Ensure poToken is initialized
    await initializePoToken();
    
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
    // Ensure poToken is initialized
    await initializePoToken();
    
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
