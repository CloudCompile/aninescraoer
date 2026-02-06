import { IVideo, ISubtitle } from "../../types/aniwatch/anime";
import VideoExtractor from "./video-extractor";

type VidSrcOptions = {
  imdbId?: string;
  tmdbId?: string;
  season?: number;
  episode?: number;
  type?: "movie" | "tv";
};

class VidSrc extends VideoExtractor {
  protected override serverName = "VidSrc";
  protected override sources: IVideo[] = [];

  private readonly baseUrls = [
    "https://vidsrc-embed.ru",
    "https://vidsrc-embed.su",
    "https://vidsrcme.su",
    "https://vsrc.su",
  ];

  /**
   * Extract video sources from VidSrc
   * @param videoUrl - The VidSrc embed URL
   * @returns Video sources and subtitles
   */
  override async extract(
    videoUrl: URL
  ): Promise<{ sources: IVideo[]; subtitles: ISubtitle[] }> {
    try {
      const result: {
        sources: IVideo[];
        subtitles: ISubtitle[];
      } = {
        sources: [],
        subtitles: [],
      };

      // VidSrc embed URLs are iframe sources
      // The actual video extraction would require parsing the embed page
      // For now, return the embed URL itself as the source
      result.sources.push({
        url: videoUrl.href,
        isM3U8: false,
      });

      return result;
    } catch (err) {
      throw new Error(`VidSrc extraction failed: ${(err as Error).message}`);
    }
  }

  /**
   * Generate VidSrc embed URL from IMDb or TMDb ID
   * @param options - VidSrc options including IMDb/TMDb ID and episode info
   * @returns Generated embed URL
   */
  generateEmbedUrl(options: VidSrcOptions): string {
    const baseUrl = this.baseUrls[0]; // Use primary URL
    const { imdbId, tmdbId, season, episode, type = "tv" } = options;

    if (!imdbId && !tmdbId) {
      throw new Error("Either IMDb ID or TMDb ID is required");
    }

    let url = `${baseUrl}/embed/${type}`;

    if (type === "movie") {
      // Movie URL format: /embed/movie/tt5433140 or /embed/movie/385687
      if (imdbId) {
        url += `/${imdbId}`;
      } else if (tmdbId) {
        url += `/${tmdbId}`;
      }
    } else {
      // TV Show/Episode URL format: /embed/tv/tt0944947/1-1 or /embed/tv?imdb=tt0944947&season=1&episode=1
      if (season && episode) {
        // Episode format
        if (imdbId) {
          url += `/${imdbId}/${season}-${episode}`;
        } else if (tmdbId) {
          url += `/${tmdbId}/${season}-${episode}`;
        }
      } else {
        // TV show main page
        if (imdbId) {
          url += `/${imdbId}`;
        } else if (tmdbId) {
          url += `/${tmdbId}`;
        }
      }
    }

    return url;
  }

  /**
   * Extract video sources using IMDb/TMDb ID
   * @param options - VidSrc options
   * @returns Video sources and subtitles
   */
  async extractWithId(
    options: VidSrcOptions
  ): Promise<{ sources: IVideo[]; subtitles: ISubtitle[] }> {
    const embedUrl = this.generateEmbedUrl(options);
    const url = new URL(embedUrl);
    return this.extract(url);
  }
}

export default VidSrc;
