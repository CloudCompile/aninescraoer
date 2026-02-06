import { Request, Response } from "express";
import createHttpError from "http-errors";
import VidSrc from "../../utils/aniwatch/vidsrc";
import {
  getAnimeMapping,
  getSeasonAndEpisode,
  extractEpisodeNumber,
} from "../../utils/aniwatch/animeIdMapper";

/**
 * Get VidSrc video sources using IMDb/TMDb ID
 * 
 * Query parameters:
 * - episodeId (required): The anime episode ID (e.g., "spy-x-family-part-2-18152?ep=94360")
 * - imdbId (optional): Override with specific IMDb ID
 * - tmdbId (optional): Override with specific TMDb ID
 * - season (optional): Override season number
 * - episode (optional): Override episode number
 */
export const getVidSrcSources = async (req: Request, res: Response) => {
  try {
    const { episodeId, imdbId, tmdbId, season, episode } = req.query;

    if (!episodeId && !imdbId && !tmdbId) {
      return res.status(400).json({
        error: "episodeId, imdbId, or tmdbId is required",
      });
    }

    const vidsrc = new VidSrc();

    // If IMDb/TMDb ID is provided directly, use it
    if (imdbId || tmdbId) {
      const seasonNum = season ? parseInt(season as string) : 1;
      const episodeNum = episode ? parseInt(episode as string) : 1;

      const embedUrl = vidsrc.generateEmbedUrl({
        imdbId: imdbId as string,
        tmdbId: tmdbId as string,
        season: seasonNum,
        episode: episodeNum,
        type: "tv",
      });

      return res.json({
        embedUrl,
        source: "vidsrc",
        imdbId: imdbId || null,
        tmdbId: tmdbId || null,
        season: seasonNum,
        episode: episodeNum,
      });
    }

    // Try to map anime ID to IMDb/TMDb
    const animeMapping = getAnimeMapping(episodeId as string);

    if (!animeMapping) {
      return res.status(404).json({
        error: "Anime not found in mapping database",
        message:
          "This anime is not yet mapped to IMDb/TMDb. Please provide imdbId or tmdbId manually, or request this anime to be added to the mapping database.",
        episodeId,
      });
    }

    // Extract episode info
    const episodeInfo = getSeasonAndEpisode(
      episodeId as string,
      animeMapping
    );

    if (!episodeInfo) {
      return res.status(400).json({
        error: "Could not extract episode number from episodeId",
        episodeId,
      });
    }

    // Generate VidSrc embed URL
    const embedUrl = vidsrc.generateEmbedUrl({
      imdbId: animeMapping.imdbId,
      tmdbId: animeMapping.tmdbId,
      season: episodeInfo.season,
      episode: episodeInfo.episode,
      type: animeMapping.type,
    });

    return res.json({
      embedUrl,
      source: "vidsrc",
      anime: {
        title: animeMapping.title,
        imdbId: animeMapping.imdbId,
        tmdbId: animeMapping.tmdbId,
        malId: animeMapping.malId,
        anilistId: animeMapping.anilistId,
      },
      episode: {
        season: episodeInfo.season,
        episode: episodeInfo.episode,
      },
    });
  } catch (error) {
    console.error("VidSrc error:", error);
    return res.status(500).json({
      error: "Failed to get VidSrc sources",
      message: (error as Error).message,
    });
  }
};

/**
 * Get list of all anime available in the mapping database
 */
export const getAvailableAnime = async (req: Request, res: Response) => {
  try {
    const { ANIME_MAPPINGS } = await import(
      "../../utils/aniwatch/animeIdMapper"
    );

    const available = Object.entries(ANIME_MAPPINGS).map(([slug, mapping]) => ({
      slug,
      title: mapping.title,
      imdbId: mapping.imdbId,
      tmdbId: mapping.tmdbId,
      malId: mapping.malId,
      anilistId: mapping.anilistId,
      type: mapping.type,
    }));

    return res.json({
      total: available.length,
      anime: available,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to get available anime",
      message: (error as Error).message,
    });
  }
};
