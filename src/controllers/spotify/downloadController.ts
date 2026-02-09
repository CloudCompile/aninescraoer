import { Request, Response } from "express";
import ytsr from "ytsr";
import { extractVideoInfo, selectFormat, proxyVideoStream } from "../youtube/customExtractor";
import { downloadVideoYtDlp } from "../youtube/ytdlpController";
import ytdl from "@distube/ytdl-core";

// Initialize spotify-url-info with native fetch
const spotifyInfo = require("spotify-url-info")(fetch);

// Create ytdl agent with cookies if provided
const agent = process.env.YOUTUBE_COOKIE
  ? ytdl.createAgent(
      process.env.YOUTUBE_COOKIE.split(";").map((cookie) => {
        const [name, ...valueParts] = cookie.trim().split("=");
        return {
          name: name.trim(),
          value: valueParts.join("=").trim(),
          domain: ".youtube.com",
        };
      }),
    )
  : undefined;

/**
 * Search YouTube for a Spotify track and return the best matching video ID.
 */
async function findYouTubeVideo(
  artist: string,
  title: string,
): Promise<{ videoId: string; videoTitle: string } | null> {
  const query = `${artist} - ${title} audio`;
  const filters = await ytsr.getFilters(query);
  const videoFilter = filters.get("Type")?.get("Video");

  const results = await ytsr(videoFilter?.url || query, { limit: 5 });

  for (const item of results.items) {
    if (item.type === "video" && item.id) {
      return { videoId: item.id, videoTitle: item.title };
    }
  }

  return null;
}

/**
 * GET /spotify/download?url=<spotify_url>
 *
 * Downloads a Spotify track by:
 * 1. Getting track metadata from Spotify
 * 2. Searching YouTube for the track
 * 3. Downloading the audio from YouTube
 */
export async function downloadTrack(req: Request, res: Response) {
  try {
    const { url } = req.query;

    if (!url || typeof url !== "string") {
      return res.status(400).json({
        error: "Please provide a Spotify URL via the 'url' query parameter",
      });
    }

    // Get Spotify track info
    const preview = await spotifyInfo.getPreview(url);
    if (!preview || !preview.title) {
      return res.status(400).json({
        error: "Could not extract track information from the Spotify URL",
      });
    }

    const artist = preview.artist || "Unknown Artist";
    const title = preview.title || preview.track || "Unknown Track";

    // Search YouTube for the track
    const youtubeResult = await findYouTubeVideo(artist, title);
    if (!youtubeResult) {
      return res.status(404).json({
        error: "Could not find this track on YouTube",
        query: `${artist} - ${title}`,
      });
    }

    const { videoId } = youtubeResult;
    const safeTitle = `${artist} - ${title}`
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "_");

    // Set headers for audio download
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${safeTitle}.m4a"`,
    );

    // Strategy 1: Custom extractor
    try {
      console.log("Spotify download: trying custom extractor for", videoId);
      const result = await extractVideoInfo(videoId);
      const format = selectFormat(result.formats, "highestaudio", "audioonly");

      if (format && format.url) {
        return await proxyVideoStream(format.url, res, req.headers.range);
      }
    } catch (customError) {
      console.error(
        "Spotify download: custom extractor failed:",
        customError instanceof Error ? customError.message : customError,
      );
    }

    // Strategy 2: @distube/ytdl-core
    try {
      console.log("Spotify download: trying ytdl-core for", videoId);
      const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
      const downloadOptions: ytdl.downloadOptions = {
        quality: "highestaudio",
        filter: "audioonly",
      };

      if (agent) {
        downloadOptions.agent = agent;
      }

      const stream = ytdl(videoUrl, downloadOptions);

      stream.on("error", (error) => {
        console.error(
          "Spotify download: ytdl-core stream error, falling back to yt-dlp:",
          error,
        );
        if (!res.headersSent) {
          // Fall back to yt-dlp
          req.params = { videoId };
          req.query = { ...req.query, quality: "highestaudio", filter: "audioonly" };
          return downloadVideoYtDlp(req, res);
        }
        res.end();
      });

      stream.pipe(res);
    } catch (ytdlError) {
      console.error("Spotify download: ytdl-core failed:", ytdlError);
      // Strategy 3: yt-dlp fallback
      req.params = { videoId };
      req.query = { ...req.query, quality: "highestaudio", filter: "audioonly" };
      return downloadVideoYtDlp(req, res);
    }
  } catch (error) {
    console.error("Error downloading Spotify track:", error);
    if (!res.headersSent) {
      res.status(500).json({
        error: "Failed to download Spotify track",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}

/**
 * GET /spotify/search?url=<spotify_url>
 *
 * Gets Spotify track info and finds the matching YouTube video,
 * without downloading. Useful for the frontend to show info before download.
 */
export async function searchTrack(req: Request, res: Response) {
  try {
    const { url } = req.query;

    if (!url || typeof url !== "string") {
      return res.status(400).json({
        error: "Please provide a Spotify URL via the 'url' query parameter",
      });
    }

    // Get Spotify track info
    const preview = await spotifyInfo.getPreview(url);
    if (!preview || !preview.title) {
      return res.status(400).json({
        error: "Could not extract track information from the Spotify URL",
      });
    }

    const artist = preview.artist || "Unknown Artist";
    const title = preview.title || preview.track || "Unknown Track";

    // Search YouTube for the track
    const youtubeResult = await findYouTubeVideo(artist, title);

    return res.json({
      track: {
        title,
        artist,
        duration: 0,
        image: preview.image,
        previewUrl: preview.audio || null,
        spotifyUrl: preview.link,
      },
      youtubeQuery: `${artist} - ${title}`,
      youtubeVideoId: youtubeResult?.videoId || null,
      youtubeVideoTitle: youtubeResult?.videoTitle || null,
    });
  } catch (error) {
    console.error("Error searching Spotify track:", error);
    res.status(500).json({
      error: "Failed to search Spotify track",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
