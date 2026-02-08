import { Request, Response } from "express";
import ytdl from "@distube/ytdl-core";
import type { YouTubeVideoInfo, VideoFormat } from "../../types/youtube/youtube";

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

    if (!ytdl.validateURL(videoUrl)) {
      return res.status(400).json({
        error: "Invalid YouTube URL",
      });
    }

    const info = await ytdl.getInfo(videoUrl);

    const formats: VideoFormat[] = info.formats.map((format) => ({
      quality: format.quality || "unknown",
      url: format.url,
      mimeType: format.mimeType || "unknown",
      hasVideo: format.hasVideo,
      hasAudio: format.hasAudio,
      container: format.container || "unknown",
      bitrate: format.bitrate,
      videoCodec: format.videoCodec,
      audioCodec: format.audioCodec,
      qualityLabel: format.qualityLabel,
      fps: format.fps,
      width: format.width,
      height: format.height,
    }));

    const videoInfo: YouTubeVideoInfo = {
      videoId: info.videoDetails.videoId,
      title: info.videoDetails.title,
      description: info.videoDetails.description || "",
      thumbnail: info.videoDetails.thumbnails[info.videoDetails.thumbnails.length - 1]?.url || "",
      duration: parseInt(info.videoDetails.lengthSeconds),
      uploadDate: info.videoDetails.uploadDate || "",
      author: {
        name: info.videoDetails.author.name,
        channelId: info.videoDetails.author.id,
        channelUrl: info.videoDetails.author.channel_url,
        thumbnails: info.videoDetails.author.thumbnails,
      },
      stats: {
        views: parseInt(info.videoDetails.viewCount),
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
