import type { RequestHandler } from "express";
import { scrapeTopAiring } from "../../scrapers/gogoanime/scrappers";
import { getErrorStatus, getErrorMessage } from "../../utils/error";

const getTopAiring: RequestHandler = async (req, res) => {
  try {
    const page = req.query.page
      ? Number(decodeURIComponent(req.query?.page as string))
      : 1;
    const data = await scrapeTopAiring(page);
    res.status(200).json(data);
  } catch (err) {
    ////////////////////////////////////
    console.log(err); // for TESTING//
    ////////////////////////////////////
    if (!res.headersSent) {
      res.status(getErrorStatus(err)).json({ error: getErrorMessage(err, "Failed to fetch top airing anime") });
    }
  }
};

export { getTopAiring };
