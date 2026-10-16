const express = require("express");
const path = require("path");
const newsRoutes = require("./routes/newsRoutes");

require("dotenv").config();

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));
app.use("/api/news", newsRoutes);

module.exports = app;
