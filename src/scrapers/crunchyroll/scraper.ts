import axios from "axios";
import { load } from "cheerio";
import type {
  CrunchyrollEpisode,
  CrunchyrollFeedResult,
  CrunchyrollSearchResult,
  CrunchyrollSeries,
} from "../../types/crunchyroll/crunchyroll";

const CR_RSS_URL = "https://www.crunchyroll.com/rss/anime";
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

/**
 * Parse the Crunchyroll RSS feed into structured episode data.
 */
function parseRssFeed(xml: string): CrunchyrollEpisode[] {
  const $ = load(xml, { xml: true });
  const episodes: CrunchyrollEpisode[] = [];

  $("item").each((_i, el) => {
    const title = $(el).find("title").text();
    const link = $(el).find("link").text();
    const descHtml = $(el).find("description").text();
    const pubDate = $(el).find("pubDate").text();
    const mediaId = $(el).find("crunchyroll\\:mediaId").text();
    const seriesTitle = $(el).find("crunchyroll\\:seriesTitle").text();
    const episodeTitle = $(el).find("crunchyroll\\:episodeTitle").text();
    const episodeNumber = $(el).find("crunchyroll\\:episodeNumber").text();
    const subtitleLangs = $(el).find("crunchyroll\\:subtitleLanguages").text();
    const keywords = $(el).find("media\\:keywords").text();
    const freePubDate = $(el).find("crunchyroll\\:freePubDate").text();

    // Get thumbnail from media:thumbnail (prefer full size)
    let thumbnail = "";
    $(el)
      .find("media\\:thumbnail")
      .each((_j, thumbEl) => {
        const url = $(thumbEl).attr("url") || "";
        if (!thumbnail || url.includes("_full.")) {
          thumbnail = url;
        }
      });

    // Extract plain text description from HTML
    const desc$ = load(descHtml);
    const description = desc$.text().trim();

    // Determine if episode is free (freePubDate in the past)
    const isFree = freePubDate
      ? new Date(freePubDate) <= new Date()
      : false;

    episodes.push({
      title,
      episodeTitle,
      seriesTitle,
      episodeNumber,
      link: link.replace("http://", "https://"),
      thumbnail,
      description,
      pubDate,
      mediaId,
      subtitleLanguages: subtitleLangs
        ? subtitleLangs.split(",").map((l: string) => l.trim())
        : [],
      keywords: keywords
        ? keywords.split(",").map((k: string) => k.trim())
        : [],
      isFree,
    });
  });

  return episodes;
}

/**
 * Group episodes by series title.
 */
function groupBySeries(episodes: CrunchyrollEpisode[]): CrunchyrollSeries[] {
  const seriesMap = new Map<string, CrunchyrollSeries>();

  for (const ep of episodes) {
    const key = ep.seriesTitle || ep.title;
    if (!seriesMap.has(key)) {
      seriesMap.set(key, {
        title: ep.seriesTitle || ep.title,
        episodes: [],
        thumbnail: ep.thumbnail,
        latestEpisode: ep.episodeNumber,
        episodeCount: 0,
      });
    }
    const series = seriesMap.get(key)!;
    series.episodes.push(ep);
    series.episodeCount = series.episodes.length;
  }

  return Array.from(seriesMap.values());
}

/**
 * Fetch the latest anime episodes from Crunchyroll's RSS feed.
 */
export async function fetchLatestEpisodes(
  limit?: number,
): Promise<CrunchyrollFeedResult> {
  const response = await axios.get(CR_RSS_URL, {
    headers: { "User-Agent": USER_AGENT },
    timeout: 15000,
  });

  let episodes = parseRssFeed(response.data);

  if (limit && limit > 0) {
    episodes = episodes.slice(0, limit);
  }

  return { episodes, total: episodes.length };
}

/**
 * Search/filter Crunchyroll episodes by keyword.
 * Filters from the RSS feed (which contains the latest ~100 episodes).
 */
export async function searchEpisodes(
  query: string,
): Promise<CrunchyrollSearchResult> {
  const response = await axios.get(CR_RSS_URL, {
    headers: { "User-Agent": USER_AGENT },
    timeout: 15000,
  });

  const allEpisodes = parseRssFeed(response.data);
  const lowerQuery = query.toLowerCase();

  // Filter episodes matching the query
  const matched = allEpisodes.filter(
    (ep) =>
      ep.seriesTitle.toLowerCase().includes(lowerQuery) ||
      ep.title.toLowerCase().includes(lowerQuery) ||
      ep.keywords.some((k) => k.toLowerCase().includes(lowerQuery)),
  );

  const series = groupBySeries(matched);

  return { series, total: matched.length, query };
}

/**
 * Fetch episodes filtered by genre from Crunchyroll RSS.
 */
export async function fetchByGenre(
  genre: string,
  limit?: number,
): Promise<CrunchyrollFeedResult> {
  const response = await axios.get(`${CR_RSS_URL}?genre=${encodeURIComponent(genre)}`, {
    headers: { "User-Agent": USER_AGENT },
    timeout: 15000,
  });

  let episodes = parseRssFeed(response.data);

  if (limit && limit > 0) {
    episodes = episodes.slice(0, limit);
  }

  return { episodes, total: episodes.length };
}
