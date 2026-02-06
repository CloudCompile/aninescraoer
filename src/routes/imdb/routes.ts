import { Router, type IRouter } from "express";
import { cacheManager } from "../../middlewares/cache";
import { getImdbSearchIds } from "../../controllers/imdb/searchController";

const imdb_router: IRouter = Router();

// /imdb/search?query=${query}&type=${movie|show}&limit=${limit}
imdb_router.get(
  "/search",
  cacheManager.middleware({
    duration: 3600, // 1 hour cache
    keyParams: ["query", "type", "limit"],
  }),
  getImdbSearchIds,
);

export default imdb_router;
