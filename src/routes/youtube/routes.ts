import { Router } from "express";
import { getVideoInfo } from "../../controllers/youtube/videoInfoController";
import { downloadVideo, streamVideo } from "../../controllers/youtube/downloadController";
import { searchVideos } from "../../controllers/youtube/searchController";
import { getPlaylistInfo } from "../../controllers/youtube/playlistController";

const youtube_router = Router();

// Search videos
youtube_router.get("/search", searchVideos);

// Get video info
youtube_router.get("/info/:videoId?", getVideoInfo);

// Download video
youtube_router.get("/download/:videoId?", downloadVideo);

// Stream video
youtube_router.get("/stream/:videoId?", streamVideo);

// Get playlist info
youtube_router.get("/playlist/:playlistId?", getPlaylistInfo);

export default youtube_router;
