import youtube_router from "./youtube/routes";
import spotify_router from "./spotify/routes";
import crunchyroll_router from "./crunchyroll/routes";
import imdb_router from "./imdb/routes";
import { getRoot } from "../lib/getRoot";
import { Router, type IRouter } from "express";

const router: IRouter = Router();

// /
router.get("/", getRoot);

// health check API
router.get("/health", (_req, res) => {
  res.sendStatus(200);
});

// YouTube API routes
router.use("/youtube", youtube_router);

// Spotify API routes
router.use("/spotify", spotify_router);

// Crunchyroll API routes
router.use("/crunchyroll", crunchyroll_router);

// imdb search (can be useful for YouTube video metadata)
router.use("/imdb", imdb_router);

export { router };
