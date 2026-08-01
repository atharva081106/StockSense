const axios  = require("axios");
const cron   = require("node-cron");
const jwt    = require("jsonwebtoken");
const { checkAndTriggerAlerts } = require("../routes/alerts");

const PY = (process.env.PYTHON_SERVICE_URL || "http://localhost:8000").replace(/\/$/, "");

// symbol -> Set<socketId>
const subs    = new Map();
// socketId -> Set<symbol>
const clients = new Map();

const fetchLive = async (sym) => {
  try {
    const { data } = await axios.get(`${PY}/stocks/${sym}/live`, { timeout: 8000 });
    return data;
  } catch { return null; }
};

const setupSocketHandlers = (io) => {
  // JWT auth middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (token) {
      try { socket.userId = jwt.verify(token, process.env.JWT_SECRET).id; } catch {}
    }
    next();
  });

  io.on("connection", (socket) => {
    if (socket.userId) socket.join(`user_${socket.userId}`);
    clients.set(socket.id, new Set());

    socket.on("subscribe", (symbol) => {
      if (!symbol || typeof symbol !== "string") return;
      const sym = symbol.toUpperCase();
      if (!subs.has(sym)) subs.set(sym, new Set());
      subs.get(sym).add(socket.id);
      clients.get(socket.id)?.add(sym);
      // Immediate price push
      fetchLive(sym).then(d => { if (d) socket.emit("price_update", d); });
    });

    socket.on("unsubscribe", (symbol) => {
      if (!symbol) return;
      const sym = symbol.toUpperCase();
      subs.get(sym)?.delete(socket.id);
      clients.get(socket.id)?.delete(sym);
    });

    socket.on("disconnect", () => {
      const syms = clients.get(socket.id) || new Set();
      syms.forEach(sym => subs.get(sym)?.delete(socket.id));
      clients.delete(socket.id);
    });
  });

  // Broadcast live prices every 15 s
  setInterval(async () => {
    for (const [sym, ids] of subs.entries()) {
      if (!ids.size) { subs.delete(sym); continue; }
      const data = await fetchLive(sym);
      if (data) ids.forEach(id => io.to(id).emit("price_update", data));
    }
  }, 15000);

  // Check price alerts every 5 min
  cron.schedule("*/5 * * * *", () =>
    checkAndTriggerAlerts(io).catch(e => console.error("Alert cron:", e.message))
  );
};

module.exports = { setupSocketHandlers };
