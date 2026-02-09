export interface CrunchyrollEpisode {
  title: string;
  episodeTitle: string;
  seriesTitle: string;
  episodeNumber: string;
  link: string;
  thumbnail: string;
  description: string;
  pubDate: string;
  mediaId: string;
  subtitleLanguages: string[];
  keywords: string[];
  isFree: boolean;
}

export interface CrunchyrollSeries {
  title: string;
  episodes: CrunchyrollEpisode[];
  thumbnail: string;
  latestEpisode: string;
  episodeCount: number;
}

export interface CrunchyrollFeedResult {
  episodes: CrunchyrollEpisode[];
  total: number;
}

export interface CrunchyrollSearchResult {
  series: CrunchyrollSeries[];
  total: number;
  query: string;
}
