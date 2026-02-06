import axios, { AxiosError } from "axios";
import createHttpError from "http-errors";
import {
  ImdbSearchTitlesResponse,
  ImdbTitleSummary,
} from "../../types/imdb/search";

export type ImdbSearchCategory = "all" | "movie" | "show";

const IMDB_SEARCH_URL = "https://api.imdbapi.dev/search/titles";

const isTvType = (type?: string) => {
  if (!type) {
    return false;
  }
  return (
    type.startsWith("tv") && type !== "tvEpisode" && type !== "tvMovie"
  );
};
const isMovieType = (type?: string) => type === "movie" || type === "tvMovie";

const matchesCategory = (type: string | undefined, category: ImdbSearchCategory) => {
  if (category === "movie") {
    return isMovieType(type);
  }
  if (category === "show") {
    return isTvType(type);
  }
  return isMovieType(type) || isTvType(type);
};

export const extractImdbTitleIds = (
  titles: ImdbTitleSummary[],
  category: ImdbSearchCategory,
): string[] =>
  titles
    .filter((title) => Boolean(title.id) && matchesCategory(title.type, category))
    .map((title) => title.id);

export const searchImdbTitleIds = async (
  query: string,
  limit?: number,
  category: ImdbSearchCategory = "all",
): Promise<string[]> => {
  try {
    const response = await axios.get<ImdbSearchTitlesResponse>(IMDB_SEARCH_URL, {
      params: {
        query,
        limit,
      },
    });
    return extractImdbTitleIds(response.data?.titles ?? [], category);
  } catch (err) {
    if (err instanceof AxiosError) {
      throw createHttpError(
        err?.response?.status || 500,
        err?.response?.statusText || "Something went wrong",
      );
    }
    throw createHttpError.InternalServerError("Internal server error");
  }
};
