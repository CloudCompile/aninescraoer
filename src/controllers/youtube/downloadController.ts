import { Request, Response } from "express";
import ytdl from "@distube/ytdl-core";
import { downloadVideoYtDlp, streamVideoYtDlp } from "./ytdlpController";
import { extractVideoInfo, selectFormat, proxyVideoStream } from "./customExtractor";
import { youtubeCookieManager } from "../../utils/cookieManager";

// Get agent with cookies - either from env or dynamically fetched
async function getAgent() {
  // Priority 1: Use environment variable if set
  if (process.env.YOUTUBE_COOKIE) {
    return ytdl.createAgent(
      process.env.YOUTUBE_COOKIE.split(';').map(cookie => {
        const [name, ...valueParts] = cookie.trim().split('=');
        return {
          name: name.trim(),
          value: valueParts.join('=').trim(),
          domain: '.youtube.com'
        };
      })
    );
  }
  
  // Priority 2: Try to fetch cookies dynamically
  try {
    const cookies = await youtubeCookieManager.getCookies();
    if (cookies.length > 0) {
      console.log(`Using ${cookies.length} dynamically fetched cookies`);
      return ytdl.createAgent(cookies);
    }
  } catch (error) {
    console.error("Failed to get dynamic cookies:", error instanceof Error ? error.message : error);
  }
  
  // Priority 3: No cookies
  return undefined;
}

export async function downloadVideo(req: Request, res: Response) {
  try {
    const { videoId } = req.params;
    const { url, quality, filter, backend } = req.query;

    let videoUrl = "";
    let resolvedVideoId = videoId || "";
    
    if (videoId) {
      videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    } else if (url && typeof url === "string") {
      videoUrl = url;
      const match = url.match(/[?&]v=([^&]+)/);
      if (match) resolvedVideoId = match[1];
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

    // Strategy 1: Custom extractor (no third-party libs)
    if (resolvedVideoId) {
      try {
        console.log("Trying custom extractor for download");
        const result = await extractVideoInfo(resolvedVideoId);
        const qualityStr = typeof quality === "string" ? quality : undefined;
        const filterStr = typeof filter === "string" ? filter : undefined;
        const format = selectFormat(result.formats, qualityStr, filterStr);
        
        if (format && format.url) {
          const title = (result.videoInfo.title || "video").replace(/[^\w\s-]/g, "").replace(/\s+/g, "_");
          const isAudio = filterStr === "audioonly" || qualityStr === "highestaudio" || qualityStr === "lowestaudio";
          
          if (isAudio) {
            res.setHeader("Content-Type", "audio/mp4");
            res.setHeader("Content-Disposition", `attachment; filename="${title}.m4a"`);
          } else {
            res.setHeader("Content-Type", "video/mp4");
            res.setHeader("Content-Disposition", `attachment; filename="${title}.mp4"`);
          }
          
          return await proxyVideoStream(format.url, res, req.headers.range);
        }
      } catch (customError) {
        console.error("Custom extractor download error:", customError instanceof Error ? customError.message : customError);
      }
    }

    // Strategy 2: Try @distube/ytdl-core
    try {
      // Get agent with cookies (env or dynamic)
      const agent = await getAgent();
      
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
          // Wrap async logic to avoid unhandled promise rejections
          downloadVideoYtDlp(req, res, true).catch((fallbackError) => {
            console.error("yt-dlp fallback also failed:", fallbackError instanceof Error ? fallbackError.message : fallbackError);
            // If yt-dlp fails (e.g., Python not available), send error response about the original ytdl-core error
            if (!res.headersSent) {
              res.status(500).json({
                error: "Failed to download video",
                message: error.message,
                suggestion: "The video download failed. This might be due to bot detection or the video being unavailable. Try a different video or contact the administrator.",
              });
            }
          });
        } else {
          console.warn("Cannot fall back to yt-dlp: response headers already sent");
          res.end();
        }
      });
      
      stream.pipe(res);
    } catch (ytdlError) {
      console.error("@distube/ytdl-core download error:", ytdlError);
      console.log("Falling back to yt-dlp for download");
      try {
        return await downloadVideoYtDlp(req, res, true); // Pass true to indicate this is a fallback
      } catch (fallbackError) {
        console.error("yt-dlp fallback also failed:", fallbackError instanceof Error ? fallbackError.message : fallbackError);
        // If yt-dlp fails (e.g., Python not available), throw the original ytdl error to be handled by outer catch
        throw ytdlError;
      }
    }
  } catch (error) {
    console.error("Error downloading video:", error);
    if (!res.headersSent) {
      const errMsg = error instanceof Error ? error.message : String(error);
      const isBotDetected = errMsg.includes("not a bot") || errMsg.includes("Sign in to confirm");
      const isPythonMissing = errMsg.includes("Python not available") || errMsg.includes("'python3': No such file or directory") || errMsg.includes("python: not found");
      
      res.status(isBotDetected ? 429 : 500).json({
        error: isBotDetected
          ? "YouTube bot detection triggered. Set YOUTUBE_COOKIE environment variable with browser cookies to bypass this."
          : isPythonMissing
          ? "All available download backends failed"
          : "Failed to download video",
        message: errMsg,
        suggestion: isPythonMissing
          ? "All download methods were tried but failed. Server lacks Python for yt-dlp. Try a different video or contact the administrator."
          : undefined,
      });
    }
  }
}

export async function streamVideo(req: Request, res: Response) {
  try {
    const { videoId } = req.params;
    const { url, quality, filter, backend } = req.query;

    let videoUrl = "";
    let resolvedVideoId = videoId || "";
    
    if (videoId) {
      videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    } else if (url && typeof url === "string") {
      videoUrl = url;
      const match = url.match(/[?&]v=([^&]+)/);
      if (match) resolvedVideoId = match[1];
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

    // Strategy 1: Custom extractor (no third-party libs)
    if (resolvedVideoId) {
      try {
        console.log("Trying custom extractor for streaming");
        const result = await extractVideoInfo(resolvedVideoId);
        const qualityStr = typeof quality === "string" ? quality : undefined;
        const filterStr = typeof filter === "string" ? filter : undefined;
        const format = selectFormat(result.formats, qualityStr, filterStr);
        
        if (format && format.url) {
          const isAudio = filterStr === "audioonly" || qualityStr === "highestaudio" || qualityStr === "lowestaudio";
          res.setHeader("Content-Type", isAudio ? "audio/mp4" : "video/mp4");
          return await proxyVideoStream(format.url, res, req.headers.range);
        }
      } catch (customError) {
        console.error("Custom extractor stream error:", customError instanceof Error ? customError.message : customError);
      }
    }

    // Strategy 2: Try @distube/ytdl-core
    try {
      // Get agent with cookies (env or dynamic)
      const agent = await getAgent();
      
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
          // Wrap async logic to avoid unhandled promise rejections
          streamVideoYtDlp(req, res, true).catch((fallbackError) => {
            console.error("yt-dlp fallback also failed:", fallbackError instanceof Error ? fallbackError.message : fallbackError);
            // If yt-dlp fails (e.g., Python not available), send error response about the original ytdl-core error
            if (!res.headersSent) {
              res.status(500).json({
                error: "Failed to stream video",
                message: error.message,
                suggestion: "The video streaming failed. This might be due to bot detection or the video being unavailable. Try a different video or contact the administrator.",
              });
            }
          });
        } else {
          console.warn("Cannot fall back to yt-dlp: response headers already sent");
          res.end();
        }
      });
      
      stream.pipe(res);
    } catch (ytdlError) {
      console.error("@distube/ytdl-core stream error:", ytdlError);
      console.log("Falling back to yt-dlp for streaming");
      try {
        return await streamVideoYtDlp(req, res, true); // Pass true to indicate this is a fallback
      } catch (fallbackError) {
        console.error("yt-dlp fallback also failed:", fallbackError instanceof Error ? fallbackError.message : fallbackError);
        // If yt-dlp fails (e.g., Python not available), throw the original ytdl error to be handled by outer catch
        throw ytdlError;
      }
    }
  } catch (error) {
    console.error("Error streaming video:", error);
    if (!res.headersSent) {
      const errMsg = error instanceof Error ? error.message : String(error);
      const isBotDetected = errMsg.includes("not a bot") || errMsg.includes("Sign in to confirm");
      const isPythonMissing = errMsg.includes("Python not available") || errMsg.includes("'python3': No such file or directory") || errMsg.includes("python: not found");
      
      res.status(isBotDetected ? 429 : 500).json({
        error: isBotDetected
          ? "YouTube bot detection triggered. Set YOUTUBE_COOKIE environment variable with browser cookies to bypass this."
          : isPythonMissing
          ? "All available streaming backends failed"
          : "Failed to stream video",
        message: errMsg,
        suggestion: isPythonMissing
          ? "All streaming methods were tried but failed. Server lacks Python for yt-dlp. Try a different video or contact the administrator."
          : undefined,
      });
    }
  }
}
