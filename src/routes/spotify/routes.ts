import { Router } from "express";
import { getTrackInfo } from "../../controllers/spotify/infoController";
import {
  downloadTrack,
  searchTrack,
} from "../../controllers/spotify/downloadController";

const spotify_router = Router();

// Get track/album/playlist info
spotify_router.get("/info", getTrackInfo);

// Search for a Spotify track on YouTube (returns info without downloading)
spotify_router.get("/search", searchTrack);

// Download a Spotify track (audio via YouTube)
spotify_router.get("/download", downloadTrack);

export default spotify_router;
