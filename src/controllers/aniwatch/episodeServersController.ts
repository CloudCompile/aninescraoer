import createHttpError from "http-errors";
import { type RequestHandler } from "express";
import { scrapeEpisodeServersPage } from "../../scrapers/aniwatch/scrapers";
import { getErrorStatus, getErrorMessage } from "../../utils/error";

const getEpisodeServersInfo: RequestHandler = async (req, res) => {
  try {
    const episodeId = req.query.id
      ? decodeURIComponent(req.query?.id as string)
      : null;

    if (episodeId === null) {
      throw createHttpError.BadRequest("Episode Id required");
    }

    const data = await scrapeEpisodeServersPage(episodeId);
    res.status(200).json(data);
  } catch (err) {
    ////////////////////////////////////
    console.log(err); // for TESTING//
    ////////////////////////////////////
    if (!res.headersSent) {
      res.status(getErrorStatus(err)).json({ error: getErrorMessage(err, "Failed to fetch episode servers") });
    }
  }
};

export { getEpisodeServersInfo };
