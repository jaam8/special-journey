const axios = require("axios");

async function getNews(query) {
  const response = await axios.get("https://newsapi.org/v2/everything", {
    params: {
      q: query,
      apiKey: process.env.NEWS_API_KEY,
      pageSize: 20,
      sortBy: "publishedAt",
    },
    timeout: 8000,
  });

  return response.data.articles;
}

module.exports = { getNews };
