import { describe, expect, it } from "vitest";
import { extractImdbTitleIds } from "./search";
import type { ImdbTitleSummary } from "../../types/imdb/search";

describe("extractImdbTitleIds", () => {
  const titles: ImdbTitleSummary[] = [
    { id: "tt001", type: "movie" },
    { id: "tt002", type: "tvSeries" },
    { id: "tt003", type: "tvEpisode" },
    { id: "tt004", type: "short" },
    { id: "tt005", type: "tvMovie" },
  ];

  it("returns show and movie ids by default", () => {
    expect(extractImdbTitleIds(titles, "all")).toEqual([
      "tt001",
      "tt002",
      "tt005",
    ]);
  });

  it("returns only movie ids when category is movie", () => {
    expect(extractImdbTitleIds(titles, "movie")).toEqual([
      "tt001",
      "tt005",
    ]);
  });

  it("returns only show ids when category is show", () => {
    expect(extractImdbTitleIds(titles, "show")).toEqual(["tt002"]);
  });
});
