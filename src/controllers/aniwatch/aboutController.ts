import { scrapeAboutPage } from "../../scrapers/aniwatch/about";
import type { RequestHandler } from "express";
import { getErrorStatus, getErrorMessage } from "../../utils/error";

const getAboutPageInfo: RequestHandler = async (req, res) => {
  try {
    const data = await scrapeAboutPage(req.params.id);
    res.status(200).json(data);
  } catch (err) {
    ////////////////////////////////////
    console.log(err); // for TESTING//
    ////////////////////////////////////
    if (!res.headersSent) {
      res.status(getErrorStatus(err)).json({ error: getErrorMessage(err, "Failed to fetch anime details") });
    }
  }
};

export { getAboutPageInfo };
