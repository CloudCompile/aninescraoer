import { Request, Response } from "express";
import ytdl from "@distube/ytdl-core";

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

    if (!ytdl.validateURL(videoUrl)) {
      return res.status(400).json({
        error: "Invalid YouTube URL",
      });
    }

    const info = await ytdl.getInfo(videoUrl);
    const title = info.videoDetails.title.replace(/[^\w\s-]/g, "");

    // Set quality and filter options
    const downloadOptions: ytdl.downloadOptions = {};
    
    if (quality && typeof quality === "string") {
      downloadOptions.quality = quality as any;
    } else {
      downloadOptions.quality = "highest";
    }

    if (filter && typeof filter === "string") {
      downloadOptions.filter = filter as any;
    }

    // Set headers for download
    res.setHeader("Content-Disposition", `attachment; filename="${title}.mp4"`);
    res.setHeader("Content-Type", "video/mp4");

    // Stream the video
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

    if (!ytdl.validateURL(videoUrl)) {
      return res.status(400).json({
        error: "Invalid YouTube URL",
      });
    }

    // Set quality and filter options
    const downloadOptions: ytdl.downloadOptions = {};
    
    if (quality && typeof quality === "string") {
      downloadOptions.quality = quality as any;
    } else {
      downloadOptions.quality = "highest";
    }

    if (filter && typeof filter === "string") {
      downloadOptions.filter = filter as any;
    }

    // Set headers for streaming
    res.setHeader("Content-Type", "video/mp4");

    // Stream the video
    ytdl(videoUrl, downloadOptions).pipe(res);
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
