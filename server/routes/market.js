const express = require("express");
const router  = express.Router();
const axios   = require("axios");

const PY = (process.env.PYTHON_SERVICE_URL || "http://localhost:8000").replace(/\/$/, "");

const proxy = async (url, res, retries = 1) => {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const r = await axios.get(url, { timeout: 15000 });
      return res.json(r.data);
    } catch (err) {
      if (attempt === retries) {
        if (err.response) return res.status(err.response.status).json(err.response.data);
        return res.status(503).json({ error: "Python service starting up or offline. Please refresh in 20 seconds." });
      }
      await new Promise(r => setTimeout(r, 2000));
    }
  }
};

router.get("/indices", (req, res) => proxy(`${PY}/market/indices`, res));
router.get("/movers",  (req, res) => proxy(`${PY}/market/movers`,  res));
router.get("/sectors", (req, res) => proxy(`${PY}/market/sectors`, res));

module.exports = router;
