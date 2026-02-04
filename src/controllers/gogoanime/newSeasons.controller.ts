import type { RequestHandler } from "express";
import { scrapeNewSeasons } from "../../scrapers/gogoanime/scrappers";

const getNewSeasons: RequestHandler = async (req, res) => {
  try {
    const page = req.query.page
      ? Number(decodeURIComponent(req.query?.page as string))
      : 1;
    const data = await scrapeNewSeasons(page);
    res.status(200).json(data);
  } catch (err) {
    ////////////////////////////////////
    console.log(err); // for TESTING//
    ////////////////////////////////////
    if (!res.headersSent) {
      res.status(err?.status || 500).json({ error: err?.message || "Failed to fetch new seasons" });
    }
  }
};

export { getNewSeasons };
