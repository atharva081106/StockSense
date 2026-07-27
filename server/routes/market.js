const express = require("express");
const router  = express.Router();
const axios   = require("axios");

const PY = (process.env.PYTHON_SERVICE_URL || "http://localhost:8000").replace(/\/$/, "");

const proxy = async (url, res) => {
  try {
    const r = await axios.get(url, { timeout: 45000 });
    res.json(r.data);
  } catch (err) {
    if (err.response) res.status(err.response.status).json(err.response.data);
    else res.status(503).json({ error: "Python service offline" });
  }
};

router.get("/indices", (req, res) => proxy(`${PY}/market/indices`, res));
router.get("/movers",  (req, res) => proxy(`${PY}/market/movers`,  res));
router.get("/sectors", (req, res) => proxy(`${PY}/market/sectors`, res));

module.exports = router;
