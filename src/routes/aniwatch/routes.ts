import { Router, type IRouter } from "express";
import {
  getHomePageInfo,
  getAboutPageInfo,
  getSearchPageInfo,
  getCategoryPage,
  getEpisodesInfo,
  getEpisodeServersInfo,
  getAnimeEpisodeSourcesInfo,
  getAnimeEpisodeSourcesWithFallback,
  getatozPage,
} from "../../controllers/aniwatch/controllers";
import {
  getVidSrcSources,
  getAvailableAnime,
} from "../../controllers/aniwatch/vidsrcController";
import { cacheManager } from "../../middlewares/cache";

const aniwatch_router: IRouter = Router();

// /aniwatch/
aniwatch_router.get("/", cacheManager.middleware(), getHomePageInfo);

// aniwatch/az-list?page=${page}
aniwatch_router.get(
  "/az-list",
  cacheManager.middleware({
    duration: 3600 * 24, // 1 day cache
    keyParams: ["page"],
  }),
  getatozPage,
);

// /aniwatch/search?keyword=$(query)&page=${page}
aniwatch_router.get(
  "/search",
  cacheManager.middleware({
    duration: 3600, // 1 hour cache
    keyParams: ["keyword", "page"],
  }),
  getSearchPageInfo,
);

// /aniwatch/anime/:id
aniwatch_router.get(
  "/anime/:id",
  cacheManager.middleware({
    duration: 3600 * 24 * 31, // 1 month cache
  }),
  getAboutPageInfo,
);

// /aniwatch/episodes/:id
aniwatch_router.get(
  "/episodes/:id",
  cacheManager.middleware({
    duration: 3600 * 24, // 1 day cache
  }),
  getEpisodesInfo,
);

// /aniwatch/servers?id=${id}
aniwatch_router.get(
  "/servers",
  cacheManager.middleware(),
  getEpisodeServersInfo,
);

// /aniwatch/episode-srcs?id=${episodeId}&server=${server}&category=${category (dub or sub)}
aniwatch_router.get(
  "/episode-srcs",
  cacheManager.middleware({
    duration: 1800, // 30 minutes cache
    keyParams: ["id", "category", "server"],
  }),
  getAnimeEpisodeSourcesInfo,
);

// /aniwatch/episode-srcs-fallback?id=${episodeId}&category=${category (dub or sub)}
// This endpoint tries multiple servers in priority order until one succeeds
aniwatch_router.get(
  "/episode-srcs-fallback",
  cacheManager.middleware({
    duration: 1800, // 30 minutes cache
    keyParams: ["id", "category"],
  }),
  getAnimeEpisodeSourcesWithFallback,
);

// /aniwatch/vidsrc?episodeId=${episodeId}
// Get VidSrc embed URL using IMDb/TMDb mapping
aniwatch_router.get(
  "/vidsrc",
  cacheManager.middleware({
    duration: 3600, // 1 hour cache
    keyParams: ["episodeId", "imdbId", "tmdbId", "season", "episode"],
  }),
  getVidSrcSources,
);

// /aniwatch/vidsrc/anime
// Get list of anime available in VidSrc mapping database
aniwatch_router.get(
  "/vidsrc/anime",
  cacheManager.middleware({
    duration: 3600 * 24, // 1 day cache
  }),
  getAvailableAnime,
);

//  aniwatch/:category?page=${page}
aniwatch_router.get(
  "/:category",
  cacheManager.middleware({
    duration: 3600 * 24, // 1 day cache
    keyParams: ["page"],
  }),
  getCategoryPage,
);

export default aniwatch_router;
