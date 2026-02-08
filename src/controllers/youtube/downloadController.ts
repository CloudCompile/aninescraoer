import { Request, Response } from "express";
import ytdl from "@distube/ytdl-core";

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

    // Get basic info with agent if cookies are provided
    const infoOptions = agent ? { agent } : {};
    const info = await ytdl.getBasicInfo(videoUrl, infoOptions);
    const title = info.videoDetails.title.replace(/[^\w\s-]/g, "");

    // Set headers for download
    res.setHeader("Content-Disposition", `attachment; filename="${title}.mp4"`);
    res.setHeader("Content-Type", "video/mp4");

    // Download and stream the video
    const downloadOptions: ytdl.downloadOptions = {
      quality: quality && typeof quality === "string" ? quality as any : "highest",
      filter: filter && typeof filter === "string" ? filter as any : undefined,
    };
    
    if (agent) {
      downloadOptions.agent = agent;
    }
    
    ytdl(videoUrl, downloadOptions).pipe(res);
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

    // Download and stream the video for streaming
    const streamOptions: ytdl.downloadOptions = {
      quality: quality && typeof quality === "string" ? quality as any : "highest",
      filter: filter && typeof filter === "string" ? filter as any : undefined,
    };
    
    if (agent) {
      streamOptions.agent = agent;
    }
    
    ytdl(videoUrl, streamOptions).pipe(res);
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
