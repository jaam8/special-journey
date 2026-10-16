const express = require("express");
const { searchNews } = require("../controllers/newsController");

const router = express.Router();

router.get("/", searchNews);

module.exports = router;
