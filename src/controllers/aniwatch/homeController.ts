import { scrapeHomePage } from "../../scrapers/aniwatch/scrapers";
import type { RequestHandler } from "express";
import { getErrorStatus, getErrorMessage } from "../../utils/error";

const getHomePageInfo: RequestHandler = async (_req, res) => {
  try {
    const data = await scrapeHomePage();
    res.status(200).json(data);
  } catch (err) {
    ////////////////////////////////////
    console.log(err); // for TESTING//
    ////////////////////////////////////
    if (!res.headersSent) {
      res.status(getErrorStatus(err)).json({ error: getErrorMessage(err, "Failed to fetch home page data") });
    }
  }
};

export { getHomePageInfo };
