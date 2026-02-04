type WebsiteConfig = {
  BASE: string;
};

export type AnimeWebsiteConfig = WebsiteConfig & {
  CLONES?: Record<string, string[]>;
};

type Websites = Record<string, AnimeWebsiteConfig>;

// anime websites and their clones
export const websites_collection: Websites = {
  AniWatch: {
    BASE: "https://hianime.to",
    CLONES: {
      HiAnime: [
        "https://aniwatchtv.to",
        "https://hianimez.is",
        "https://hianimez.to",
        "https://hianime.nz",
        "https://hianime.bz",
        "https://hianime.pe",
      ],
    },
  },
  GogoAnime: {
    BASE: "https://ww24.gogoanimes.fi",
  },
};
