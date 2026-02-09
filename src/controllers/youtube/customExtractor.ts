/**
 * Custom YouTube Extractor
 *
 * Extracts video info and streaming URLs directly from YouTube without
 * relying on any third-party YouTube downloader libraries (no ytdl-core, yt-dlp, etc).
 *
 * How it works:
 *  1. Uses YouTube's Innertube API with the ANDROID client, which returns
 *     direct video URLs without signature ciphering
 *  2. Falls back to the web page HTML extraction if the API fails
 *  3. For metadata-only fallback, scrapes the watch page for ytInitialPlayerResponse
 *
 * The ANDROID client is key because it returns pre-deciphered URLs,
 * avoiding the need to reverse-engineer YouTube's obfuscated signature JS.
 */

import axios from "axios";
import type { YouTubeVideoInfo, VideoFormat } from "../../types/youtube/youtube";

// --- HTTP helpers ---

const INNERTUBE_API_URL = "https://www.youtube.com/youtubei/v1/player";
const INNERTUBE_API_KEY = "AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8"; // Public API key

const ANDROID_USER_AGENT =
  "com.google.android.youtube/19.09.37 (Linux; U; Android 11) gzip";

const WEB_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const MOBILE_USER_AGENT =
  "Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36";

// Complete browser headers to look more legitimate
function getRealisticHeaders(userAgent: string) {
  return {
    "User-Agent": userAgent,
    "Accept": "*/*",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    "Origin": "https://www.youtube.com",
    "Referer": "https://www.youtube.com/",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-origin",
    "sec-ch-ua": '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"Windows"',
  };
}

// --- Innertube API clients ---

function buildAndroidPayload(videoId: string) {
  return {
    videoId,
    context: {
      client: {
        clientName: "ANDROID",
        clientVersion: "19.09.37",
        androidSdkVersion: 30,
        hl: "en",
        gl: "US",
        utcOffsetMinutes: 0,
      },
    },
    contentCheckOk: true,
    racyCheckOk: true,
  };
}

function buildIOSPayload(videoId: string) {
  return {
    videoId,
    context: {
      client: {
        clientName: "IOS",
        clientVersion: "19.09.3",
        deviceModel: "iPhone14,3",
        hl: "en",
        gl: "US",
        utcOffsetMinutes: 0,
      },
    },
    contentCheckOk: true,
    racyCheckOk: true,
  };
}

function buildTVEmbeddedPayload(videoId: string) {
  return {
    videoId,
    context: {
      client: {
        clientName: "TVHTML5_SIMPLY_EMBEDDED_PLAYER",
        clientVersion: "2.0",
        hl: "en",
        gl: "US",
      },
      thirdParty: {
        embedUrl: "https://www.youtube.com/",
      },
    },
    contentCheckOk: true,
    racyCheckOk: true,
  };
}

function buildAndroidEmbeddedPayload(videoId: string) {
  return {
    videoId,
    context: {
      client: {
        clientName: "ANDROID_EMBEDDED_PLAYER",
        clientVersion: "19.13.36",
        clientScreen: "EMBED",
        androidSdkVersion: 30,
        hl: "en",
        gl: "US",
      },
      thirdParty: {
        embedUrl: "https://www.youtube.com/",
      },
    },
    contentCheckOk: true,
    racyCheckOk: true,
  };
}

function buildMWEBPayload(videoId: string) {
  return {
    videoId,
    context: {
      client: {
        clientName: "MWEB",
        clientVersion: "2.20240304.08.00",
        hl: "en",
        gl: "US",
        userAgent: MOBILE_USER_AGENT,
      },
    },
    contentCheckOk: true,
    racyCheckOk: true,
  };
}

function buildTVPayload(videoId: string) {
  return {
    videoId,
    context: {
      client: {
        clientName: "TVHTML5",
        clientVersion: "7.20240304.08.00",
        hl: "en",
        gl: "US",
      },
    },
    contentCheckOk: true,
    racyCheckOk: true,
  };
}

function buildWebEmbeddedPayload(videoId: string) {
  return {
    videoId,
    context: {
      client: {
        clientName: "WEB_EMBEDDED_PLAYER",
        clientVersion: "1.20220918",
        clientScreen: "EMBED",
        hl: "en",
        gl: "US",
      },
      thirdParty: {
        embedUrl: "https://www.youtube.com/",
      },
    },
    contentCheckOk: true,
    racyCheckOk: true,
  };
}

// --- Core extraction via Innertube API ---

async function fetchFromInnertube(videoId: string): Promise<any> {
  // Try multiple clients in order of best bypass potential
  const clients = [
    {
      name: "ANDROID",
      payload: buildAndroidPayload(videoId),
      ua: ANDROID_USER_AGENT,
      useApiKey: false,
    },
    {
      name: "MWEB",
      payload: buildMWEBPayload(videoId),
      ua: MOBILE_USER_AGENT,
      useApiKey: true,
    },
    {
      name: "ANDROID_EMBEDDED",
      payload: buildAndroidEmbeddedPayload(videoId),
      ua: ANDROID_USER_AGENT,
      useApiKey: false,
    },
    {
      name: "TV",
      payload: buildTVPayload(videoId),
      ua: WEB_USER_AGENT,
      useApiKey: true,
    },
    {
      name: "WEB_EMBEDDED",
      payload: buildWebEmbeddedPayload(videoId),
      ua: WEB_USER_AGENT,
      useApiKey: false,
    },
    {
      name: "IOS",
      payload: buildIOSPayload(videoId),
      ua: "com.google.ios.youtube/19.09.3 (iPhone14,3; U; CPU iOS 15_6 like Mac OS X)",
      useApiKey: false,
    },
  ];

  let lastError: Error | null = null;

  for (const client of clients) {
    try {
      const url = client.useApiKey 
        ? `${INNERTUBE_API_URL}?key=${INNERTUBE_API_KEY}`
        : INNERTUBE_API_URL;
      
      const headers = client.name === "MWEB" || client.name === "TV"
        ? { ...getRealisticHeaders(client.ua), "Content-Type": "application/json" }
        : { "Content-Type": "application/json", "User-Agent": client.ua };

      const resp = await axios.post(url, client.payload, {
        headers,
        timeout: 15000,
      });

      const data = resp.data;

      // Check playability
      if (data.playabilityStatus?.status === "OK") {
        console.log(`Custom extractor: ${client.name} client succeeded`);
        return data;
      }

      const reason = data.playabilityStatus?.reason || data.playabilityStatus?.status;
      console.log(`Custom extractor: ${client.name} client returned ${reason}`);
      lastError = new Error(reason || "Unknown playability error");
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`Custom extractor: ${client.name} client failed:`, lastError.message);
    }
  }

  throw lastError || new Error("All Innertube clients failed");
}

// --- Fallback: extract from watch page HTML ---

async function fetchFromEmbedPage(videoId: string): Promise<any> {
  // Try the embed page which often bypasses bot detection
  const url = `https://www.youtube.com/embed/${videoId}`;
  const resp = await axios.get(url, {
    headers: getRealisticHeaders(WEB_USER_AGENT),
    maxRedirects: 5,
    timeout: 15000,
  });

  const html: string = resp.data;

  // Find ytInitialPlayerResponse in embed page
  const marker = html.match(/ytInitialPlayerResponse\s*=\s*(\{)/);
  if (!marker || marker.index === undefined) {
    throw new Error("Could not find ytInitialPlayerResponse in embed page HTML");
  }

  const startIdx = marker.index + marker[0].length - 1;
  let depth = 0;
  let endIdx = startIdx;
  for (let i = startIdx; i < html.length; i++) {
    if (html[i] === "{") depth++;
    else if (html[i] === "}") {
      depth--;
      if (depth === 0) {
        endIdx = i;
        break;
      }
    }
  }

  const data = JSON.parse(html.substring(startIdx, endIdx + 1));

  if (data.playabilityStatus?.status !== "OK") {
    const reason = data.playabilityStatus?.reason || data.playabilityStatus?.status;
    throw new Error(reason || "Video not playable");
  }

  return data;
}

async function fetchFromWatchPage(videoId: string): Promise<any> {
  const url = `https://www.youtube.com/watch?v=${videoId}`;
  const resp = await axios.get(url, {
    headers: getRealisticHeaders(WEB_USER_AGENT),
    maxRedirects: 5,
    timeout: 15000,
  });

  const html: string = resp.data;

  // Find ytInitialPlayerResponse using balanced brace matching
  const marker = html.match(/ytInitialPlayerResponse\s*=\s*(\{)/);
  if (!marker || marker.index === undefined) {
    throw new Error("Could not find ytInitialPlayerResponse in page HTML");
  }

  const startIdx = marker.index + marker[0].length - 1;
  let depth = 0;
  let endIdx = startIdx;
  for (let i = startIdx; i < html.length; i++) {
    if (html[i] === "{") depth++;
    else if (html[i] === "}") {
      depth--;
      if (depth === 0) {
        endIdx = i;
        break;
      }
    }
  }

  const data = JSON.parse(html.substring(startIdx, endIdx + 1));

  if (data.playabilityStatus?.status !== "OK") {
    const reason = data.playabilityStatus?.reason || data.playabilityStatus?.status;
    throw new Error(reason || "Video not playable");
  }

  return data;
}

// --- Parse formats ---

function parseFormats(streamingData: any): VideoFormat[] {
  const allFormats = [
    ...(streamingData.formats || []),
    ...(streamingData.adaptiveFormats || []),
  ];

  const formats: VideoFormat[] = [];

  for (const format of allFormats) {
    const url = format.url;

    // Skip formats without direct URLs (signatureCipher requires JS deciphering)
    if (!url) continue;

    const mimeType: string = format.mimeType || "";
    const isVideo = mimeType.startsWith("video/");
    const isAudio = mimeType.startsWith("audio/");

    const codecMatch = mimeType.match(/codecs="([^"]+)"/);
    const codecs = codecMatch
      ? codecMatch[1].split(",").map((c: string) => c.trim())
      : [];

    const container = mimeType.split(";")[0]?.split("/")[1] || "mp4";

    // Determine if format has video/audio
    const hasVideo = isVideo && ((format.width ?? 0) > 0 || Boolean(format.qualityLabel));
    const hasAudio = isAudio || (isVideo && codecs.some((c: string) => c.startsWith("mp4a") || c.startsWith("opus")));

    formats.push({
      quality: format.qualityLabel || format.quality || format.audioQuality || "unknown",
      url,
      mimeType,
      hasVideo,
      hasAudio,
      container,
      bitrate: format.bitrate,
      videoCodec: codecs.find(
        (c: string) => c.startsWith("avc") || c.startsWith("vp") || c.startsWith("av01"),
      ),
      audioCodec: codecs.find(
        (c: string) => c.startsWith("mp4a") || c.startsWith("opus"),
      ),
      qualityLabel: format.qualityLabel,
      fps: format.fps,
      width: format.width,
      height: format.height,
    });
  }

  return formats;
}

// --- Public API ---

export interface CustomExtractorResult {
  videoInfo: YouTubeVideoInfo;
  formats: VideoFormat[];
  backend: string;
}

export async function extractVideoInfo(
  videoId: string,
): Promise<CustomExtractorResult> {
  let data: any;
  let backend = "custom";

  // Strategy A: Innertube API (ANDROID/IOS/EMBEDDED clients — returns direct URLs)
  try {
    data = await fetchFromInnertube(videoId);
    backend = "custom";
  } catch (innertubeError) {
    // Strategy B: Embed page HTML extraction (often bypasses bot detection)
    console.log("Custom extractor: Innertube failed, trying embed page");
    try {
      data = await fetchFromEmbedPage(videoId);
      backend = "custom-embed";
    } catch (embedError) {
      // Strategy C: Watch page HTML extraction (last resort)
      console.log("Custom extractor: Embed page failed, trying watch page");
      try {
        data = await fetchFromWatchPage(videoId);
        backend = "custom-web";
      } catch (webError) {
        // Re-throw the Innertube error as it's most informative
        throw innertubeError;
      }
    }
  }

  const videoDetails = data.videoDetails || {};
  const streamingData = data.streamingData || {};

  // Parse formats
  const formats = parseFormats(streamingData);

  // Build video info
  const videoInfo: YouTubeVideoInfo = {
    videoId: videoDetails.videoId || videoId,
    title: videoDetails.title || "Unknown Title",
    description: videoDetails.shortDescription || "",
    thumbnail:
      videoDetails.thumbnail?.thumbnails?.slice(-1)[0]?.url ||
      `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    duration: parseInt(videoDetails.lengthSeconds || "0", 10),
    uploadDate: "",
    author: {
      name: videoDetails.author || "Unknown",
      channelId: videoDetails.channelId || "",
      channelUrl: videoDetails.channelId
        ? `https://www.youtube.com/channel/${videoDetails.channelId}`
        : "",
      thumbnails: [],
    },
    stats: {
      views: parseInt(videoDetails.viewCount || "0", 10),
      likes: undefined,
    },
    formats,
  };

  // Try to get upload date from microformat
  try {
    const microformat = data.microformat?.playerMicroformatRenderer;
    if (microformat) {
      videoInfo.uploadDate =
        microformat.publishDate || microformat.uploadDate || "";
      if (microformat.ownerProfileUrl) {
        videoInfo.author.channelUrl = microformat.ownerProfileUrl;
      }
    }
  } catch {}

  return {
    videoInfo,
    formats,
    backend,
  };
}

/**
 * Select the best matching format for a given quality/filter preference.
 */
export function selectFormat(
  formats: VideoFormat[],
  quality?: string,
  filter?: string,
): VideoFormat | null {
  if (formats.length === 0) return null;

  let candidates = [...formats];

  // Apply filter
  if (filter === "audioonly") {
    candidates = candidates.filter((f) => f.hasAudio && !f.hasVideo);
    if (candidates.length === 0) {
      candidates = formats.filter((f) => f.hasAudio);
    }
  } else if (filter === "videoonly") {
    candidates = candidates.filter((f) => f.hasVideo && !f.hasAudio);
  } else {
    // Default: prefer formats with both audio and video
    const combined = candidates.filter((f) => f.hasVideo && f.hasAudio);
    if (combined.length > 0) {
      candidates = combined;
    }
  }

  if (candidates.length === 0) return formats[0];

  // Apply quality preference
  switch (quality) {
    case "highest":
      candidates.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
      return candidates[0];

    case "lowest":
      candidates.sort((a, b) => (a.bitrate || 0) - (b.bitrate || 0));
      return candidates[0];

    case "360p":
    case "480p":
    case "720p":
    case "1080p": {
      const targetHeight = parseInt(quality, 10);
      const match = candidates.find((f) => f.height === targetHeight);
      if (match) return match;
      const lower = candidates
        .filter((f) => (f.height || 0) <= targetHeight)
        .sort((a, b) => (b.height || 0) - (a.height || 0));
      if (lower.length > 0) return lower[0];
      return candidates[0];
    }

    case "highestaudio":
      candidates = candidates.filter((f) => f.hasAudio);
      candidates.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
      return candidates[0] || null;

    case "lowestaudio":
      candidates = candidates.filter((f) => f.hasAudio);
      candidates.sort((a, b) => (a.bitrate || 0) - (b.bitrate || 0));
      return candidates[0] || null;

    default:
      candidates.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
      return candidates[0];
  }
}

/**
 * Proxy a video stream from YouTube's CDN to the client response.
 * This is needed because YouTube CDN URLs require specific headers
 * and may block direct browser access.
 */
export async function proxyVideoStream(
  formatUrl: string,
  res: import("express").Response,
  rangeHeader?: string,
): Promise<void> {
  const headers: Record<string, string> = {
    "User-Agent": ANDROID_USER_AGENT,
    Referer: "https://www.youtube.com/",
    Origin: "https://www.youtube.com",
  };

  if (rangeHeader) {
    headers["Range"] = rangeHeader;
  }

  const response = await axios.get(formatUrl, {
    headers,
    responseType: "stream",
    timeout: 30000,
    maxRedirects: 5,
  });

  // Forward relevant headers
  if (response.headers["content-length"]) {
    res.setHeader("Content-Length", response.headers["content-length"]);
  }
  if (response.headers["content-type"]) {
    res.setHeader("Content-Type", response.headers["content-type"]);
  }
  if (response.headers["content-range"]) {
    res.setHeader("Content-Range", response.headers["content-range"]);
  }
  if (response.headers["accept-ranges"]) {
    res.setHeader("Accept-Ranges", response.headers["accept-ranges"]);
  }

  res.status(rangeHeader ? 206 : 200);

  // Pipe the video stream to the response
  response.data.pipe(res);

  response.data.on("error", (err: Error) => {
    console.error("Stream proxy error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Stream interrupted" });
    }
  });
}
