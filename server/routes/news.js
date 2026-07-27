const express = require("express");
const router  = express.Router();
const axios   = require("axios");

const PY = process.env.PYTHON_SERVICE_URL || "http://localhost:8000";

// GET /api/news/:symbol
router.get("/:symbol", async (req, res) => {
  try {
    const r = await axios.get(`${PY}/stocks/${req.params.symbol}/news`, {
      params: { limit: req.query.limit || 10 },
      timeout: 20000,
    });
    res.json(r.data);
  } catch (err) {
    if (err.response) res.status(err.response.status).json(err.response.data);
    else res.status(503).json({ error: "News service unavailable" });
  }
});

module.exports = router;
