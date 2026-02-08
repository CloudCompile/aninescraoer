import { Request, Response } from "express";
import ytdl from "@distube/ytdl-core";
import type { YouTubeVideoInfo, VideoFormat } from "../../types/youtube/youtube";
import { getVideoInfoYtDlp, fetchYtDlpMetadata } from "./ytdlpController";
import { videoInfo as ytExtVideoInfo } from "youtube-ext";

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

// Fallback: get video info from youtube-ext (works even when bot-detected for metadata)
async function getVideoInfoYouTubeExt(videoId: string): Promise<YouTubeVideoInfo | null> {
  try {
    const info = await ytExtVideoInfo(`https://www.youtube.com/watch?v=${videoId}`, {
      requestOptions: {
        // youtube-ext defaults maxRedirections=5 but Node.js v24+ undici removed support for it.
        // Setting to undefined disables it and lets undici handle redirects normally.
        maxRedirections: undefined,
      },
    });
    if (!info || !info.title) return null;

    // Parse views from text like "7,496 views"
    const viewsText = info.views?.text || "0";
    const viewsNum = parseInt(viewsText.replace(/[^0-9]/g, ""), 10) || 0;

    // Parse duration from the duration object
    let durationSec = 0;
    const dur = info.duration as any;
    if (dur) {
      durationSec = (dur.hours || 0) * 3600 + (dur.minutes || 0) * 60 + (dur.seconds || 0);
    }

    return {
      videoId: info.id || videoId,
      title: info.title,
      description: info.shortDescription || info.description || "",
      thumbnail: `https://i.ytimg.com/vi/${info.id || videoId}/hqdefault.jpg`,
      duration: durationSec,
      uploadDate: (info.published as any)?.pretty || "",
      author: {
        name: info.channel?.name || "Unknown",
        channelId: info.channel?.id || "",
        channelUrl: info.channel?.url || "",
        thumbnails: info.channel?.icons || [],
      },
      stats: {
        views: viewsNum,
        likes: undefined,
      },
      formats: [], // youtube-ext can't get formats when bot-detected
    };
  } catch (error) {
    console.error("youtube-ext error:", error);
    return null;
  }
}

export async function getVideoInfo(req: Request, res: Response) {
  try {
    const { videoId } = req.params;
    const { url, backend } = req.query;

    let videoUrl = "";
    let resolvedVideoId = videoId || "";
    
    if (videoId) {
      videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    } else if (url && typeof url === "string") {
      videoUrl = url;
      // Extract video ID from URL for youtube-ext fallback
      const match = url.match(/[?&]v=([^&]+)/);
      if (match) resolvedVideoId = match[1];
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

    // Strategy 1: Try @distube/ytdl-core first
    try {
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

      if (!videoInfo.videoId || !videoInfo.title || !formats || formats.length === 0) {
        throw new Error("Incomplete data from ytdl-core");
      }

      (videoInfo as any).backend = "@distube/ytdl-core";
      return res.json(videoInfo);
    } catch (ytdlError) {
      console.error("@distube/ytdl-core error:", ytdlError instanceof Error ? ytdlError.message : ytdlError);
    }

    // Strategy 2: Try yt-dlp
    try {
      console.log("Trying yt-dlp fallback for video info");
      const metadata = await fetchYtDlpMetadata(videoUrl);
      
      const videoInfo = {
        videoId: metadata.id || resolvedVideoId,
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
        backend: "yt-dlp",
      };

      return res.json(videoInfo);
    } catch (ytdlpError) {
      console.error("yt-dlp also failed:", ytdlpError instanceof Error ? ytdlpError.message : ytdlpError);
    }

    // Strategy 3: Try youtube-ext (metadata only, no download URLs)
    if (resolvedVideoId) {
      console.log("Trying youtube-ext fallback for video info");
      const extInfo = await getVideoInfoYouTubeExt(resolvedVideoId);
      if (extInfo) {
        (extInfo as any).backend = "youtube-ext";
        (extInfo as any).notice = "Video metadata retrieved successfully. Downloads may require YOUTUBE_COOKIE environment variable if bot detection is active.";
        return res.json(extInfo);
      }
    }

    // All backends failed
    res.status(429).json({
      error: "YouTube bot detection triggered on all backends",
      message: "All methods to fetch video information have failed due to YouTube's bot detection.",
      suggestion: "Set YOUTUBE_COOKIE environment variable with cookies exported from your browser to bypass bot detection.",
    });
  } catch (error) {
    console.error("Error in video info controller:", error);
    res.status(500).json({
      error: "Failed to fetch video information",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
