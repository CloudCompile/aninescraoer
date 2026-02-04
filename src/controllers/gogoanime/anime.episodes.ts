import { scrapeEpisodePage } from "../../scrapers/gogoanime/scrappers";
import type { RequestHandler } from "express";
import { getErrorStatus, getErrorMessage } from "../../utils/error";

const getAnimeEpisodes: RequestHandler = async (req, res) => {
  try {
    const id: string = req.params.id;
    const data = await scrapeEpisodePage(id);
    res.status(200).json(data);
  } catch (err) {
    ////////////////////////////////////
    console.log(err); // for TESTING//
    ////////////////////////////////////
    if (!res.headersSent) {
      res.status(getErrorStatus(err)).json({ error: getErrorMessage(err, "Failed to fetch anime episodes") });
    }
  }
};

export { getAnimeEpisodes };
