import { Router } from "express";
import {
  getFeed,
  search,
  getByGenre,
} from "../../controllers/crunchyroll/crunchyrollController";

const crunchyroll_router = Router();

// Get latest episodes feed
crunchyroll_router.get("/feed", getFeed);

// Search for anime
crunchyroll_router.get("/search", search);

// Get episodes by genre
crunchyroll_router.get("/genre", getByGenre);

export default crunchyroll_router;
