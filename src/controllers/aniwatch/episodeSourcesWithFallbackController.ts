import axios from "axios";
import createHttpError from "http-errors";
import { type RequestHandler } from "express";
import { type CheerioAPI, load } from "cheerio";
import { scrapeAnimeEpisodeSources } from "../../scrapers/aniwatch/scrapers";
import { scrapeEpisodeServersPage } from "../../scrapers/aniwatch/scrapers";
import { URL_fn } from "../../utils/aniwatch/constants";
import { headers } from "../../config/headers";
import { type AnimeServers, Servers } from "../../types/aniwatch/anime";
import { getErrorStatus, getErrorMessage } from "../../utils/error";

type AnilistID = number | null;
type MalID = number | null;

// Define server priority order - try these servers in this order
const SERVER_PRIORITY: AnimeServers[] = [
  Servers.VidCloud,
  Servers.HD1,
  Servers.HD2,
  Servers.VidStreaming,
  Servers.MegaCloud,
  Servers.StreamSB,
  Servers.StreamTape,
];

/**
 * Tries to get episode sources by attempting multiple servers in priority order
 * This endpoint will try all available servers until one succeeds
 */
const getAnimeEpisodeSourcesWithFallback: RequestHandler = async (req, res) => {
  const URLs = await URL_fn();
  const errors: { server: string; error: string }[] = [];
  
  try {
    const episodeId = req.query.id
      ? decodeURIComponent(req.query.id as string)
      : null;

    const category = (
      req.query.category
        ? decodeURIComponent(req.query.category as string)
        : "sub"
    ) as "sub" | "dub";

    if (episodeId === null) {
      throw createHttpError.BadRequest("Anime episode id required");
    }

    let malID: MalID;
    let anilistID: AnilistID;
    const animeURL = new URL(episodeId?.split("?ep=")[0], URLs.BASE)?.href;

    // Get available servers for this episode
    const serversData = await scrapeEpisodeServersPage(episodeId);
    
    // Get anime metadata
    const animeSrc = await axios.get(animeURL, {
      headers: {
        Referer: URLs.BASE,
        "User-Agent": headers.USER_AGENT_HEADER,
        "X-Requested-With": "XMLHttpRequest",
      },
    });

    const $: CheerioAPI = load(animeSrc?.data);

    try {
      anilistID = Number(
        JSON.parse($("body")?.find("#syncData")?.text())?.anilist_id,
      );
      malID = Number(JSON.parse($("body")?.find("#syncData")?.text())?.mal_id);
    } catch (err) {
      anilistID = null;
      malID = null;
    }

    // Get available servers for the requested category
    const availableServers = category === "dub" ? serversData.dub : serversData.sub;
    const availableServerNames = new Set(
      availableServers.map((s: { serverName: string }) => s.serverName.toLowerCase())
    );

    // Try servers in priority order, but only if they're available
    const serversToTry = SERVER_PRIORITY.filter(server => 
      availableServerNames.has(server.toLowerCase())
    );

    // If no priority servers are available, try all available servers from the response
    if (serversToTry.length === 0) {
      availableServers.forEach((s: { serverName: string }) => {
        serversToTry.push(s.serverName as AnimeServers);
      });
    }

    // Try each server until one succeeds
    for (const server of serversToTry) {
      try {
        console.log(`Trying server: ${server} for category: ${category}`);
        const episodeSrcData = await scrapeAnimeEpisodeSources(episodeId, server, category);
        
        // Check if we got valid sources
        if (episodeSrcData && 
            typeof episodeSrcData === 'object' && 
            'sources' in episodeSrcData && 
            Array.isArray(episodeSrcData.sources) && 
            episodeSrcData.sources.length > 0) {
          
          console.log(`Successfully retrieved sources from server: ${server}`);
          
          return res.status(200).json({
            ...episodeSrcData,
            anilistID,
            malID,
            serverUsed: server,
            triedServers: errors.map(e => e.server),
          });
        }
        
        errors.push({ server, error: "No sources returned" });
      } catch (err: any) {
        console.log(`Failed to get sources from server ${server}:`, err);
        errors.push({ 
          server, 
          error: err.message || "Unknown error" 
        });
      }
    }

    // If we get here, all servers failed
    throw createHttpError.NotFound(
      `Failed to retrieve sources from any server. Tried: ${serversToTry.join(", ")}`
    );
    
  } catch (err) {
    console.log("Error in getAnimeEpisodeSourcesWithFallback:", err);
    console.log("Errors from individual servers:", errors);
    
    if (!res.headersSent) {
      res.status(getErrorStatus(err)).json({ 
        error: getErrorMessage(err, "Failed to fetch episode sources from any server"),
        attemptedServers: errors,
      });
    }
  }
};

export { getAnimeEpisodeSourcesWithFallback };
