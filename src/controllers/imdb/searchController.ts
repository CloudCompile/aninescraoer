import createHttpError from "http-errors";
import type { RequestHandler } from "express";
import { getErrorMessage, getErrorStatus } from "../../utils/error";
import {
  ImdbSearchCategory,
  searchImdbTitleIds,
} from "../../scrapers/imdb/search";

const pickQueryValue = (value: unknown): string | undefined => {
  if (typeof value === "string") {
    return value;
  }
  if (Array.isArray(value) && typeof value[0] === "string") {
    return value[0];
  }
  return undefined;
};

const parseCategory = (value?: string): ImdbSearchCategory => {
  if (!value) {
    return "all";
  }

  const normalized = value.toLowerCase();
  if (normalized === "movie" || normalized === "movies") {
    return "movie";
  }
  if (normalized === "show" || normalized === "shows" || normalized === "tv") {
    return "show";
  }
  if (normalized === "all") {
    return "all";
  }

  throw createHttpError.BadRequest("type must be 'movie' or 'show'");
};

const parseLimit = (value?: string): number | undefined => {
  if (!value) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 1 || parsed > 50) {
    throw createHttpError.BadRequest("limit must be between 1 and 50");
  }
  return parsed;
};

export const getImdbSearchIds: RequestHandler = async (req, res) => {
  try {
    const queryValue = pickQueryValue(req.query.query);

    if (!queryValue) {
      throw createHttpError.BadRequest("Search query required");
    }

    const typeValue = pickQueryValue(req.query.type);
    const limitValue = pickQueryValue(req.query.limit);

    const query = decodeURIComponent(queryValue);
    const category = parseCategory(
      typeValue ? decodeURIComponent(typeValue) : undefined,
    );
    const limit = parseLimit(
      limitValue ? decodeURIComponent(limitValue) : undefined,
    );

    const ids = await searchImdbTitleIds(query, limit, category);
    res.status(200).json({ ids });
  } catch (err) {
    console.log(err);
    if (!res.headersSent) {
      res
        .status(getErrorStatus(err))
        .json({ error: getErrorMessage(err, "Failed to search IMDb") });
    }
  }
};
