import { scrapeHomePage } from "../../scrapers/aniwatch/scrapers";
import type { RequestHandler } from "express";

const getHomePageInfo: RequestHandler = async (_req, res) => {
  try {
    const data = await scrapeHomePage();
    res.status(200).json(data);
  } catch (err) {
    ////////////////////////////////////
    console.log(err); // for TESTING//
    ////////////////////////////////////
    if (!res.headersSent) {
      res.status(err?.status || 500).json({ error: err?.message || "Failed to fetch home page data" });
    }
  }
};

export { getHomePageInfo };
