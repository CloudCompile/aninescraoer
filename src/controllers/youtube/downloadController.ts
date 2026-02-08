import { Request, Response } from "express";
import ytdl from "@distube/ytdl-core";
import { downloadVideoYtDlp, streamVideoYtDlp } from "./ytdlpController";

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
    const { url, quality, filter, backend } = req.query;

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
      console.log("Using yt-dlp backend for download (explicitly requested)");
      return downloadVideoYtDlp(req, res);
    }

    // Try @distube/ytdl-core first
    try {
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
      
      const stream = ytdl(videoUrl, downloadOptions);
      
      stream.on("error", (error) => {
        console.error("ytdl-core download stream error, falling back to yt-dlp:", error);
        if (!res.headersSent) {
          return downloadVideoYtDlp(req, res);
        } else {
          console.warn("Cannot fall back to yt-dlp: response headers already sent");
          res.end();
        }
      });
      
      stream.pipe(res);
    } catch (ytdlError) {
      console.error("@distube/ytdl-core download error:", ytdlError);
      console.log("Falling back to yt-dlp for download");
      return downloadVideoYtDlp(req, res);
    }
  } catch (error) {
    console.error("Error downloading video:", error);
    if (!res.headersSent) {
      const errMsg = error instanceof Error ? error.message : String(error);
      const isBotDetected = errMsg.includes("not a bot") || errMsg.includes("Sign in to confirm");
      res.status(isBotDetected ? 429 : 500).json({
        error: isBotDetected
          ? "YouTube bot detection triggered. Set YOUTUBE_COOKIE environment variable with browser cookies to bypass this."
          : "Failed to download video",
        message: errMsg,
      });
    }
  }
}

export async function streamVideo(req: Request, res: Response) {
  try {
    const { videoId } = req.params;
    const { url, quality, filter, backend } = req.query;

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
      console.log("Using yt-dlp backend for stream (explicitly requested)");
      return streamVideoYtDlp(req, res);
    }

    // Try @distube/ytdl-core first
    try {
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
      
      const stream = ytdl(videoUrl, streamOptions);
      
      stream.on("error", (error) => {
        console.error("ytdl-core stream error, falling back to yt-dlp:", error);
        if (!res.headersSent) {
          return streamVideoYtDlp(req, res);
        } else {
          console.warn("Cannot fall back to yt-dlp: response headers already sent");
          res.end();
        }
      });
      
      stream.pipe(res);
    } catch (ytdlError) {
      console.error("@distube/ytdl-core stream error:", ytdlError);
      console.log("Falling back to yt-dlp for streaming");
      return streamVideoYtDlp(req, res);
    }
  } catch (error) {
    console.error("Error streaming video:", error);
    if (!res.headersSent) {
      const errMsg = error instanceof Error ? error.message : String(error);
      const isBotDetected = errMsg.includes("not a bot") || errMsg.includes("Sign in to confirm");
      res.status(isBotDetected ? 429 : 500).json({
        error: isBotDetected
          ? "YouTube bot detection triggered. Set YOUTUBE_COOKIE environment variable with browser cookies to bypass this."
          : "Failed to stream video",
        message: errMsg,
      });
    }
  }
}
