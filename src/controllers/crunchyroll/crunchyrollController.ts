import { Request, Response } from "express";
import {
  fetchLatestEpisodes,
  searchEpisodes,
  fetchByGenre,
} from "../../scrapers/crunchyroll/scraper";

/**
 * GET /crunchyroll/feed?limit=20
 *
 * Returns the latest anime episodes from Crunchyroll.
 */
export async function getFeed(req: Request, res: Response) {
  try {
    const limit = req.query.limit
      ? parseInt(req.query.limit as string, 10)
      : 20;
    const data = await fetchLatestEpisodes(limit);
    res.json(data);
  } catch (error) {
    console.error("Error fetching Crunchyroll feed:", error);
    res.status(500).json({
      error: "Failed to fetch Crunchyroll feed",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * GET /crunchyroll/search?q=<query>
 *
 * Search for anime by keyword in the Crunchyroll feed.
 */
export async function search(req: Request, res: Response) {
  try {
    const query = req.query.q as string;

    if (!query || typeof query !== "string") {
      return res.status(400).json({
        error: "Please provide a search query via the 'q' parameter",
      });
    }

    const data = await searchEpisodes(query);
    res.json(data);
  } catch (error) {
    console.error("Error searching Crunchyroll:", error);
    res.status(500).json({
      error: "Failed to search Crunchyroll",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * GET /crunchyroll/genre?name=action&limit=20
 *
 * Get episodes filtered by genre.
 */
export async function getByGenre(req: Request, res: Response) {
  try {
    const genre = req.query.name as string;
    const limit = req.query.limit
      ? parseInt(req.query.limit as string, 10)
      : 20;

    if (!genre || typeof genre !== "string") {
      return res.status(400).json({
        error: "Please provide a genre name via the 'name' parameter",
      });
    }

    const data = await fetchByGenre(genre, limit);
    res.json(data);
  } catch (error) {
    console.error("Error fetching Crunchyroll genre:", error);
    res.status(500).json({
      error: "Failed to fetch Crunchyroll genre",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
