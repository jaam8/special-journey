const { getNews } = require("../services/newsService");

async function searchNews(req, res) {
  try {
    const query = req.query.q;

    if (!query) {
      return res.status(400).json({ error: "Query required" });
    }

    const articles = await getNews(query);

    res.json(articles);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch news" });
  }
}

module.exports = { searchNews };
