/**
 * Anime ID Mapper
 * Maps anime titles/IDs to their IMDb and TMDb IDs
 * 
 * This is a starting point with popular anime.
 * Users can contribute more mappings or integrate with external APIs.
 */

export type AnimeMapping = {
  malId?: number; // MyAnimeList ID
  anilistId?: number; // AniList ID
  title: string;
  imdbId?: string;
  tmdbId?: string;
  type: "movie" | "tv";
  seasons?: {
    season: number;
    malId?: number;
    anilistId?: number;
    title?: string;
  }[];
};

/**
 * Manual mapping of popular anime to IMDb/TMDb IDs
 * Format: [animeIdentifier, AnimeMapping]
 * 
 * Note: To find IMDb IDs:
 * 1. Search on IMDb: https://www.imdb.com/find/?q=anime+name
 * 2. TMDb: https://www.themoviedb.org/search?query=anime+name
 */
export const ANIME_MAPPINGS: Record<string, AnimeMapping> = {
  // Spy x Family
  "spy-x-family": {
    malId: 50265,
    anilistId: 140960,
    title: "SPY x FAMILY",
    imdbId: "tt13706018",
    tmdbId: "202250",
    type: "tv",
    seasons: [
      { season: 1, title: "SPY x FAMILY Part 1" },
      { season: 2, title: "SPY x FAMILY Part 2" },
    ],
  },

  // Attack on Titan
  "attack-on-titan": {
    malId: 16498,
    anilistId: 16498,
    title: "Shingeki no Kyojin",
    imdbId: "tt2560140",
    tmdbId: "1429",
    type: "tv",
  },

  // Death Note
  "death-note": {
    malId: 1535,
    anilistId: 1535,
    title: "Death Note",
    imdbId: "tt0877057",
    tmdbId: "13916",
    type: "tv",
  },

  // One Piece
  "one-piece": {
    malId: 21,
    anilistId: 21,
    title: "One Piece",
    imdbId: "tt0388629",
    tmdbId: "37854",
    type: "tv",
  },

  // Demon Slayer
  "demon-slayer": {
    malId: 38000,
    anilistId: 101922,
    title: "Kimetsu no Yaiba",
    imdbId: "tt9335498",
    tmdbId: "85937",
    type: "tv",
  },

  // My Hero Academia
  "my-hero-academia": {
    malId: 31964,
    anilistId: 21459,
    title: "Boku no Hero Academia",
    imdbId: "tt5626028",
    tmdbId: "65930",
    type: "tv",
  },

  // Jujutsu Kaisen
  "jujutsu-kaisen": {
    malId: 40748,
    anilistId: 113415,
    title: "Jujutsu Kaisen",
    imdbId: "tt11830022",
    tmdbId: "95479",
    type: "tv",
  },

  // Naruto
  "naruto": {
    malId: 20,
    anilistId: 20,
    title: "Naruto",
    imdbId: "tt0409591",
    tmdbId: "46260",
    type: "tv",
  },

  // Bleach
  "bleach": {
    malId: 269,
    anilistId: 269,
    title: "Bleach",
    imdbId: "tt0434665",
    tmdbId: "30984",
    type: "tv",
  },

  // Fullmetal Alchemist: Brotherhood
  "fullmetal-alchemist-brotherhood": {
    malId: 5114,
    anilistId: 5114,
    title: "Fullmetal Alchemist: Brotherhood",
    imdbId: "tt1355642",
    tmdbId: "31911",
    type: "tv",
  },

  // Steins;Gate
  "steins-gate": {
    malId: 9253,
    anilistId: 9253,
    title: "Steins;Gate",
    imdbId: "tt1910272",
    tmdbId: "42705",
    type: "tv",
  },

  // Code Geass
  "code-geass": {
    malId: 1575,
    anilistId: 1575,
    title: "Code Geass: Hangyaku no Lelouch",
    imdbId: "tt0994314",
    tmdbId: "45782",
    type: "tv",
  },

  // Cowboy Bebop
  "cowboy-bebop": {
    malId: 1,
    anilistId: 1,
    title: "Cowboy Bebop",
    imdbId: "tt0213338",
    tmdbId: "48636",
    type: "tv",
  },

  // Hunter x Hunter
  "hunter-x-hunter-2011": {
    malId: 11061,
    anilistId: 11061,
    title: "Hunter x Hunter (2011)",
    imdbId: "tt2098220",
    tmdbId: "46298",
    type: "tv",
  },

  // Tokyo Ghoul
  "tokyo-ghoul": {
    malId: 22319,
    anilistId: 20605,
    title: "Tokyo Ghoul",
    imdbId: "tt3741634",
    tmdbId: "61374",
    type: "tv",
  },

  // Sword Art Online
  "sword-art-online": {
    malId: 11757,
    anilistId: 11757,
    title: "Sword Art Online",
    imdbId: "tt2250192",
    tmdbId: "45782",
    type: "tv",
  },
};

/**
 * Get anime mapping by anime title slug
 * @param animeSlug - The anime slug (e.g., "spy-x-family-part-2-18152")
 * @returns AnimeMapping if found, null otherwise
 */
export function getAnimeMapping(animeSlug: string): AnimeMapping | null {
  // Try to match the slug with known mappings
  // Remove episode/season suffixes and numbers
  const cleanSlug = animeSlug
    .toLowerCase()
    .replace(/-\d+$/, "") // Remove trailing numbers
    .replace(/-part-\d+.*$/, "") // Remove "part-X" suffixes
    .replace(/-season-\d+.*$/, "") // Remove "season-X" suffixes
    .trim();

  // Try exact match first
  if (ANIME_MAPPINGS[cleanSlug]) {
    return ANIME_MAPPINGS[cleanSlug];
  }

  // Try partial match
  for (const [key, mapping] of Object.entries(ANIME_MAPPINGS)) {
    if (cleanSlug.includes(key) || key.includes(cleanSlug)) {
      return mapping;
    }
  }

  return null;
}

/**
 * Extract episode number from episode ID
 * @param episodeId - Episode ID (e.g., "spy-x-family-part-2-18152?ep=94360")
 * @returns Episode number or null
 */
export function extractEpisodeNumber(episodeId: string): number | null {
  // Try to extract from query parameter
  const epMatch = episodeId.match(/[?&]ep=(\d+)/);
  if (epMatch) {
    return parseInt(epMatch[1], 10);
  }

  // Try to extract from URL pattern like "/episode-5"
  const urlMatch = episodeId.match(/episode-(\d+)/i);
  if (urlMatch) {
    return parseInt(urlMatch[1], 10);
  }

  return null;
}

/**
 * Get season and episode number from anime episode ID
 * For most anime, all episodes are in season 1
 * @param episodeId - The episode ID
 * @param animeMapping - The anime mapping info
 * @returns {season, episode} object or null
 */
export function getSeasonAndEpisode(
  episodeId: string,
  animeMapping: AnimeMapping
): { season: number; episode: number } | null {
  const episodeNum = extractEpisodeNumber(episodeId);
  if (!episodeNum) {
    return null;
  }

  // For most anime, all episodes are in season 1
  // This could be enhanced with more sophisticated season detection
  return {
    season: 1,
    episode: episodeNum,
  };
}
