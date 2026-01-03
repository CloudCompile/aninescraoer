// /api/proxy.js
export default async function handler(req, res) {
  const url = req.query.url;

  if (!url) {
    return res.status(400).send("Missing ?url=...");
  }

  let targetUrl;
  try {
    targetUrl = new URL(url);
  } catch {
    return res.status(400).send("Invalid URL");
  }

  try {
    // fetch the target (aninescraper)
    const response = await fetch(targetUrl.toString(), {
      method: req.method,
      headers: {
        // forward necessary headers for videos
        'Range': req.headers['range'] || '',
      },
    });

    // stream the response to the frontend
    res.status(response.status);
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });
    response.body.pipeTo(res);
  } catch (err) {
    res.status(500).send("Upstream fetch failed");
  }
}
