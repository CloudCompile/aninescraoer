import { Request, Response } from "express";
import YTDlpWrap from "yt-dlp-wrap";
import path from "path";
import fs from "fs";

// Initialize yt-dlp wrapper
let ytDlpWrap: YTDlpWrap | null = null;
let ytDlpInitialized = false;
let ytDlpInitializing: Promise<void> | null = null;

async function initializeYtDlp() {
  if (ytDlpInitialized && ytDlpWrap) {
    return ytDlpWrap;
  }
  
  if (ytDlpInitializing) {
    await ytDlpInitializing;
    return ytDlpWrap;
  }
  
  ytDlpInitializing = (async () => {
    try {
      const binaryPath = path.join(process.cwd(), "yt-dlp");
      
      // Check if yt-dlp binary exists
      if (!fs.existsSync(binaryPath) && !fs.existsSync(binaryPath + ".exe")) {
        console.log("yt-dlp binary not found, downloading...");
        // Download yt-dlp binary
        await YTDlpWrap.downloadFromGithub(binaryPath);
        console.log("yt-dlp binary downloaded successfully");
      }
      
      ytDlpWrap = new YTDlpWrap(binaryPath);
      ytDlpInitialized = true;
      console.log("yt-dlp initialized successfully");
    } catch (error) {
      console.error("Failed to initialize yt-dlp:", error);
      ytDlpWrap = new YTDlpWrap(); // Try with system yt-dlp
      ytDlpInitialized = true;
    } finally {
      ytDlpInitializing = null;
    }
  })();
  
  await ytDlpInitializing;
  return ytDlpWrap;
}

export async function getVideoInfoYtDlp(req: Request, res: Response) {
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

    const ytDlp = await initializeYtDlp();
    if (!ytDlp) {
      throw new Error("Failed to initialize yt-dlp");
    }

    // Get video metadata using yt-dlp
    const metadata = await ytDlp.getVideoInfo(videoUrl);

    // Transform yt-dlp metadata to match our API format
    const videoInfo = {
      videoId: metadata.id || videoId,
      title: metadata.title || "Unknown Title",
      description: metadata.description || "",
      thumbnail: metadata.thumbnail || metadata.thumbnails?.[metadata.thumbnails.length - 1]?.url || "",
      duration: metadata.duration || 0,
      uploadDate: metadata.upload_date || "",
      author: {
        name: metadata.uploader || metadata.channel || "Unknown",
        channelId: metadata.channel_id || metadata.uploader_id || "",
        channelUrl: metadata.channel_url || metadata.uploader_url || "",
        thumbnails: metadata.channel?.thumbnails || [],
      },
      stats: {
        views: metadata.view_count || 0,
        likes: metadata.like_count,
      },
      formats: (metadata.formats || []).map((format: any) => ({
        quality: format.format_note || format.quality || "unknown",
        url: format.url || "",
        mimeType: `${format.video_ext || "video"}/${format.ext || "mp4"}`,
        hasVideo: format.vcodec && format.vcodec !== "none",
        hasAudio: format.acodec && format.acodec !== "none",
        container: format.ext || "unknown",
        bitrate: format.tbr || format.vbr || format.abr,
        videoCodec: format.vcodec !== "none" ? format.vcodec : undefined,
        audioCodec: format.acodec !== "none" ? format.acodec : undefined,
        qualityLabel: format.format_note || format.height ? `${format.height}p` : undefined,
        fps: format.fps,
        width: format.width,
        height: format.height,
      })),
      backend: "yt-dlp", // Indicate which backend was used
    };

    res.json(videoInfo);
  } catch (error) {
    console.error("yt-dlp error fetching video info:", error);
    res.status(500).json({
      error: "Failed to fetch video information using yt-dlp",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function downloadVideoYtDlp(req: Request, res: Response) {
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

    const ytDlp = await initializeYtDlp();
    if (!ytDlp) {
      throw new Error("Failed to initialize yt-dlp");
    }

    // Get video info first to set filename
    const metadata = await ytDlp.getVideoInfo(videoUrl);
    const title = (metadata.title || "video").replace(/[^\w\s-]/g, "");

    // Set headers for download
    res.setHeader("Content-Disposition", `attachment; filename="${title}.mp4"`);
    res.setHeader("Content-Type", "video/mp4");

    // Build yt-dlp arguments based on quality/filter
    const args: string[] = [videoUrl];
    
    if (filter === "audioonly") {
      args.push("-f", "bestaudio");
      res.setHeader("Content-Type", "audio/mp4");
      res.setHeader("Content-Disposition", `attachment; filename="${title}.m4a"`);
    } else if (filter === "videoonly") {
      args.push("-f", "bestvideo");
    } else {
      // Default: best video+audio
      args.push("-f", "best");
    }
    
    args.push("-o", "-"); // Output to stdout

    // Stream the download directly to response
    const readableStream = ytDlp.execStream(args);
    readableStream.pipe(res);

    readableStream.on("error", (error) => {
      console.error("yt-dlp download error:", error);
      if (!res.headersSent) {
        res.status(500).json({
          error: "Failed to download video using yt-dlp",
          message: error.message,
        });
      }
    });
  } catch (error) {
    console.error("Error in yt-dlp download:", error);
    if (!res.headersSent) {
      res.status(500).json({
        error: "Failed to download video",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}

export async function streamVideoYtDlp(req: Request, res: Response) {
  // Streaming is the same as download but without Content-Disposition header
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

    const ytDlp = await initializeYtDlp();
    if (!ytDlp) {
      throw new Error("Failed to initialize yt-dlp");
    }

    // Set headers for streaming
    res.setHeader("Content-Type", "video/mp4");

    // Build yt-dlp arguments
    const args: string[] = [videoUrl];
    
    if (filter === "audioonly") {
      args.push("-f", "bestaudio");
      res.setHeader("Content-Type", "audio/mp4");
    } else if (filter === "videoonly") {
      args.push("-f", "bestvideo");
    } else {
      args.push("-f", "best");
    }
    
    args.push("-o", "-"); // Output to stdout

    // Stream directly to response
    const readableStream = ytDlp.execStream(args);
    readableStream.pipe(res);

    readableStream.on("error", (error) => {
      console.error("yt-dlp stream error:", error);
      if (!res.headersSent) {
        res.status(500).json({
          error: "Failed to stream video using yt-dlp",
          message: error.message,
        });
      }
    });
  } catch (error) {
    console.error("Error in yt-dlp stream:", error);
    if (!res.headersSent) {
      res.status(500).json({
        error: "Failed to stream video",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}
