import type { RequestHandler } from "express";

export const getRoot: RequestHandler = async (_req, res) => {
  try {
    const data = {
      name: "YouTube API & Downloader",
      version: "2.0.0",
      description: "A YouTube API for searching, downloading, and streaming videos",
      docs: "https://github.com/CloudCompile/aninescraoer/blob/main/README.md",
      endpoints: {
        youtube: {
          search: "/youtube/search?query={query}&limit={limit}&type={type}",
          videoInfo: "/youtube/info/{videoId} or /youtube/info?url={url}",
          download: "/youtube/download/{videoId}?quality={quality}&filter={filter}",
          stream: "/youtube/stream/{videoId}?quality={quality}&filter={filter}",
          playlist: "/youtube/playlist/{playlistId}?limit={limit}",
        },
        imdb: {
          search: "/imdb/search?query={query}&type={type}&limit={limit}",
        },
      },
      status: "online",
    };

    res.status(200).json(data);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
};
