import { scrapeAboutPage } from "../../scrapers/gogoanime/about";
import type { RequestHandler } from "express";
import { getErrorStatus, getErrorMessage } from "../../utils/error";

const getAboutPageInfo: RequestHandler = async (req, res) => {
  try {
    const id: string = req.params.id;
    const data = await scrapeAboutPage(id);
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
