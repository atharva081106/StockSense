require("dotenv").config();
const express    = require("express");
const http       = require("http");
const { Server } = require("socket.io");
const cors       = require("cors");
const helmet     = require("helmet");
const morgan     = require("morgan");
const rateLimit  = require("express-rate-limit");
const mongoose   = require("mongoose");

const authRoutes       = require("./routes/auth");
const stockRoutes      = require("./routes/stocks");
const watchlistRoutes  = require("./routes/watchlist");
const portfolioRoutes  = require("./routes/portfolio");
const alertRoutes      = require("./routes/alerts");
const marketRoutes     = require("./routes/market");
const newsRoutes       = require("./routes/news");
const psychologyRoutes = require("./routes/psychology");
const qaRoutes         = require("./routes/qa");
const { setupSocketHandlers } = require("./socket/livePrice");

const app    = express();
app.set("trust proxy", 1);
const server = http.createServer(app);
const corsOriginHandler = (origin, callback) => {
  // Allow requests with no origin (like mobile apps, curl, or server-to-server) or from Vercel / localhost
  callback(null, true);
};

const io     = new Server(server, {
  cors: { origin: corsOriginHandler, credentials: true, methods: ["GET","POST"] },
});

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: corsOriginHandler, credentials: true }));
app.use(morgan(process.env.NODE_ENV === "development" ? "dev" : "combined"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/", rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }));

app.use("/api/auth",       authRoutes);
app.use("/api/stocks",     stockRoutes);
app.use("/api/watchlist",  watchlistRoutes);
app.use("/api/portfolio",  portfolioRoutes);
app.use("/api/alerts",     alertRoutes);
app.use("/api/market",     marketRoutes);
app.use("/api/news",       newsRoutes);
app.use("/api/psychology", psychologyRoutes);
app.use("/api/qa",         qaRoutes);

app.get("/api/health", (req, res) =>
  res.json({ status:"ok", uptime: process.uptime(), env: process.env.NODE_ENV })
);
app.use((req, res) => res.status(404).json({ error:"Route not found" }));
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

setupSocketHandlers(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀  Server http://localhost:${PORT}`);
  console.log(`🐍  Python service: ${process.env.PYTHON_SERVICE_URL}`);
});

mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/stocksense")
  .then(() => {
    console.log("✅  MongoDB connected");
  })
  .catch(err => { console.error("⚠️  MongoDB connection warning:", err.message); });

module.exports = { app, io };
