<div align="center">

<img src="https://img.shields.io/badge/StockSense-Pro-C08552?style=for-the-badge&logoColor=FFF8F0&labelColor=4B2E2B" alt="StockSense Pro" />

# StockSense — AI-Powered Stock Analyzer

**Professional-grade stock analytics for Indian NSE/BSE & Global markets**  
Built with MERN Stack + Python FastAPI · Real-time · AI-native · Open source

<br/>

[![React](https://img.shields.io/badge/React_18-20232A?style=flat-square&logo=react&logoColor=61DAFB)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://mongodb.com)
[![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=flat-square&logo=socket.io&logoColor=white)](https://socket.io)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)](https://docker.com)

<br/>

> *"Not just another stock dashboard — StockSense tells you **why** the market moved,  
> scores your **trading psychology**, and explains every indicator **in plain English**."*

</div>

---

## ✨ What makes it different

Most stock platforms show you prices. StockSense goes further:

| Feature | Others | StockSense |
|---|---|---|
| Real-time prices | ✅ | ✅ |
| Technical indicators | ✅ | ✅ + AI explanation per indicator |
| AI price forecast | ❌ / paid | ✅ Built-in, no API cost |
| **Natural language Q&A** | ❌ | ✅ "Why did RELIANCE fall today?" |
| **Trading psychology score** | ❌ | ✅ Loss aversion, overtrading, impulsivity |
| **Contextual indicator explainer** | ❌ | ✅ Explains what RSI means *right now* for *this stock* |
| NSE + BSE + Global | ❌ | ✅ |
| Dark + Light theme | varies | ✅ Same warm palette, just inverted |

---

## 🚀 Feature Overview

<details>
<summary><strong>📊 Stock Analysis</strong></summary>

- **Interactive charts** — Candlestick, Line, Area with volume overlay
- **7 timeframes** — 1D · 5D · 1M · 3M · 6M · 1Y · 5Y
- **Live prices** via Socket.io — updates every 15 seconds
- **Technical indicators** — RSI, MACD, Bollinger Bands, EMA (9/20/50), SMA 200, Stochastic, ATR, VWAP
- **Signal engine** — Combines 6 indicators into a BUY / SELL / HOLD consensus
- **Full fundamentals** — P/E, EPS, margins, ROE, debt/equity, cash flow, revenue growth
- **News feed** with rule-based sentiment tagging (Positive / Negative / Neutral)

</details>

<details>
<summary><strong>🧠 AI Price Prediction</strong></summary>

Two prediction modes out of the box:

**Built-in (no install required)**  
Combines 6 technical factors into a composite signal:
1. Linear regression trend (90-day slope)
2. Price momentum (5d / 20d / 60d returns)
3. RSI signal (oversold/overbought zones)
4. MACD crossover direction
5. Volume trend confirmation
6. EMA crossover (20 vs 50-day golden/death cross)

Shows: forecast chart with confidence band, factor analysis panel (click each factor to expand), direction verdict, confidence score.

**Facebook Prophet (optional)**  
Install `pip install prophet` to enable ML-based time-series forecasting with 80% confidence intervals and seasonality detection.

Both modes support 7 / 14 / 30 / 60 / 90 day horizons.

</details>

<details>
<summary><strong>🤖 Natural Language Stock Q&A</strong></summary>

Ask anything about any stock in plain English:

- *"Why did HDFC Bank fall 3% today?"*
- *"Is TCS a good buy right now?"*
- *"What do the technical indicators say about RELIANCE?"*
- *"What are the key risks for Bajaj Finance?"*

Claude fetches **live price, indicators, news, and fundamentals** in parallel before answering — so every response is backed by actual current data, not training knowledge.

Maintains conversation history for follow-up questions.

</details>

<details>
<summary><strong>📈 Trading Psychology Score</strong></summary>

Analyzes your real portfolio trades and computes 5 behavioral metrics:

| Metric | What it measures |
|---|---|
| **Loss Aversion** | How many times longer you hold losers vs winners |
| **Overtrading** | Trades per month vs healthy benchmark |
| **Impulsivity** | % of trades closed in under 3 days |
| **Disposition Effect** | Selling winners early, holding losers |
| **Risk Discipline** | Your actual Risk/Reward ratio achieved |

Plus: day-of-week win rate analysis, behavioral trait cards, personalized action plan.

The **AI Coach Report** sends your actual metrics to Claude for a 5-paragraph personalized analysis — not generic advice.

</details>

<details>
<summary><strong>💡 Live Indicator Explainer</strong></summary>

Every indicator chart has a **✨ AI** button. Click it and Claude explains:

1. What the indicator is saying **right now** for this specific stock
2. What this level historically means
3. What to watch for next (crossover, confirmation signal, key level)

Contextual, refreshable, closes on outside click.

</details>

<details>
<summary><strong>🌍 Market Overview</strong></summary>

- **10 global indices** — NIFTY 50, SENSEX, NIFTY BANK, S&P 500, NASDAQ, DOW, FTSE, Nikkei, Hang Seng
- **Sector heatmap** — NSE sectors + US ETF sectors with color-coded performance
- **Top Gainers & Losers** — 25 Indian + 10 global stocks ranked by daily change

</details>

<details>
<summary><strong>💼 Portfolio & Alerts</strong></summary>

**Portfolio Tracker**
- Record buy/sell trades with price, quantity, date, notes
- Auto-computes average buy price, P&L per holding, total returns
- Expand any holding to see full trade history

**Price Alerts**
- Set price targets (above / below) for any stock
- **Email notifications** via Gmail SMTP (Nodemailer)
- **In-app push** via Socket.io
- Cron-based checks every 5 minutes
- Pause / resume / delete alerts

</details>

<details>
<summary><strong>📉 Stock Comparison</strong></summary>

Compare up to 5 stocks side-by-side:
- All normalized to 100 at start of period
- 5 timeframes: 1M · 3M · 6M · 1Y · 2Y
- Per-stock return summary cards
- Color-coded interactive ApexCharts line chart

</details>

---

## 🏗️ Tech Stack

```
StockSense
├── client/               React 18 + Vite + TailwindCSS + ApexCharts
├── server/               Node.js + Express + Socket.io + MongoDB
└── python-service/       FastAPI + yfinance + Prophet (optional)
```

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 18, Vite, TailwindCSS | UI, routing, state |
| **Charts** | ApexCharts (react-apexcharts) | Candlestick, line, indicators |
| **Backend** | Express.js, Node 20 | REST API, auth, business logic |
| **Real-time** | Socket.io | Live price broadcast, alert push |
| **Database** | MongoDB + Mongoose | Users, portfolios, alerts, watchlists |
| **Data service** | FastAPI + yfinance | Stock data, indicators, predictions |
| **AI** | Claude claude-sonnet-4-20250514 | Q&A, psychology analysis, indicator explainer |
| **Auth** | JWT + bcrypt | Token-based authentication |
| **Email** | Nodemailer + Gmail SMTP | Alert email notifications |
| **Deployment** | Docker + Nginx | Container-ready, production build |

---

## 📁 Project Structure

```
stock-analyzer/
│
├── python-service/                 # FastAPI data & AI service  (port 8000)
│   ├── main.py                     # All endpoints: quotes, history, indicators,
│   │                               # live prices, predictions, news, sectors
│   └── requirements.txt
│
├── server/                         # Express.js backend  (port 5000)
│   ├── models/
│   │   ├── User.js                 # Auth, preferences
│   │   ├── Watchlist.js            # User's watched stocks
│   │   ├── Portfolio.js            # Holdings + trade history
│   │   └── Alert.js               # Price alert rules
│   ├── routes/
│   │   ├── auth.js                 # Register, login, /me
│   │   ├── stocks.js               # Proxy → Python service
│   │   ├── watchlist.js
│   │   ├── portfolio.js            # Trade recording + P&L
│   │   ├── alerts.js               # CRUD + email notifications
│   │   ├── market.js               # Indices, movers, sectors
│   │   ├── news.js                 # News feed proxy
│   │   ├── psychology.js           # Behavioral metrics + AI analysis
│   │   └── qa.js                   # Natural language Q&A
│   ├── socket/
│   │   └── livePrice.js            # Socket.io + alert cron
│   ├── middleware/auth.js          # JWT guard
│   └── index.js
│
└── client/                         # React frontend  (port 5173)
    └── src/
        ├── pages/
        │   ├── Dashboard.jsx        # Market overview + watchlist preview
        │   ├── StockDetail.jsx      # Chart, indicators, AI predict, news, fundamentals
        │   ├── StockQA.jsx          # Natural language Q&A interface
        │   ├── Psychology.jsx       # Behavioral trading score
        │   ├── Market.jsx           # Full market view + sector heatmap
        │   ├── Watchlist.jsx
        │   ├── Portfolio.jsx
        │   ├── Alerts.jsx
        │   └── Compare.jsx
        ├── components/
        │   ├── StockChart.jsx       # ApexCharts candlestick/line/area
        │   ├── IndicatorsPanel.jsx  # RSI, MACD, BB, Stochastic with guide
        │   ├── IndicatorExplainer.jsx  # AI ✨ button per indicator
        │   ├── PredictionChart.jsx  # 6-factor + Prophet forecast
        │   ├── PriceTicker.jsx      # Live price with flash animation
        │   ├── NewsPanel.jsx        # Sentiment-tagged news feed
        │   ├── SearchBar.jsx        # Debounced stock search
        │   └── Layout.jsx           # Sidebar + topbar navigation
        ├── context/
        │   ├── AuthContext.jsx      # JWT user state
        │   └── ThemeContext.jsx     # Dark/light toggle
        ├── hooks/useLivePrice.js    # Socket.io price subscription
        └── services/
            ├── api.js               # Axios with auth interceptor
            └── socket.js            # Socket.io singleton
```

---

## ⚡ Quick Start

### Prerequisites

| Tool | Version | Required for |
|---|---|---|
| Node.js | 18+ | Express + React |
| Python | 3.10+ | FastAPI data service |
| MongoDB | 6+ | Local or Atlas |

---

### 1 · Python Data Service

```bash
cd python-service
pip install -r requirements.txt
python main.py
# → http://localhost:8000
```

> **Prophet (optional)** — enables AI forecasting tab.  
> Requires a C++ compiler first:
> - **Windows:** [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)  
> - **macOS:** `xcode-select --install`  
> - **Ubuntu:** `sudo apt install build-essential`  
> 
> Then: `pip install prophet`

---

### 2 · Express API Server

```bash
cd server
npm install
cp .env .env.local        # optional: keep originals

# ── Edit .env ───────────────────────────────────────────────
# MONGO_URI=mongodb://localhost:27017/stocksense
# JWT_SECRET=your_long_random_secret_here
# PYTHON_SERVICE_URL=http://localhost:8000
# SMTP_USER=your_gmail@gmail.com
# SMTP_PASS=your_16_char_app_password
# ────────────────────────────────────────────────────────────

npm run dev
# → http://localhost:5000
```

---

### 3 · React Frontend

```bash
cd client
npm install
npm run dev
# → http://localhost:5173
```

Open [http://localhost:5173](http://localhost:5173), register an account, and start analyzing.

---

### 🐳 Docker (all-in-one)

```bash
# From project root
docker-compose up --build
```

Spins up: React (Nginx :80), Express (:5000), FastAPI (:8000), MongoDB (:27017).

---

## 🔧 Environment Variables

**`server/.env`**

```env
# ── Server ──────────────────────────────────────────────────
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# ── Database ────────────────────────────────────────────────
MONGO_URI=mongodb://localhost:27017/stocksense

# ── Auth ────────────────────────────────────────────────────
JWT_SECRET=change_this_to_a_long_random_string_in_production
JWT_EXPIRES_IN=7d

# ── Python data service ─────────────────────────────────────
PYTHON_SERVICE_URL=http://localhost:8000

# ── Email alerts (Gmail) ─────────────────────────────────────
# Generate App Password: myaccount.google.com → Security → App passwords
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_gmail@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx
FROM_EMAIL=your_gmail@gmail.com
```

---

## 🇮🇳 Indian Stock Symbol Format

| Exchange | Suffix | Example |
|---|---|---|
| NSE | `.NS` | `RELIANCE.NS` · `TCS.NS` · `HDFCBANK.NS` |
| BSE | `.BO` | `RELIANCE.BO` · `INFY.BO` |
| Global | *(none)* | `AAPL` · `MSFT` · `NVDA` · `TSLA` |

---

## 🎨 Design System

StockSense uses a custom warm earth-tone palette with full dark/light mode:

| Token | Dark mode | Light mode |
|---|---|---|
| Background | `#0d0805` (near-black warm) | `#FFF8F0` (warm cream) |
| Primary accent | `#C08552` (golden brown) | `#8C5A3C` (medium brown) |
| Secondary | `#8C5A3C` | `#4B2E2B` (dark brown) |
| Text | `#FFF8F0` (cream) | `#2d1a13` (dark espresso) |

All colors are CSS variables (`--k-*`) — toggling dark/light flips the variable set, no JavaScript color logic at the component level. 300ms smooth crossfade transition included.

---

## 📡 API Reference

### Python Service (port 8000)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/stocks/search?q=RELIANCE` | Search stocks |
| GET | `/stocks/{symbol}/quote` | Full quote + fundamentals |
| GET | `/stocks/{symbol}/history` | OHLCV data (`period`, `interval` params) |
| GET | `/stocks/{symbol}/indicators` | RSI, MACD, BB, EMA, Stochastic, ATR, VWAP |
| GET | `/stocks/{symbol}/live` | Real-time price snapshot |
| GET | `/stocks/{symbol}/predict?days=30` | Prophet AI forecast |
| GET | `/stocks/{symbol}/predict-builtin?days=30` | Technical factor prediction |
| GET | `/stocks/{symbol}/news` | Sentiment-tagged news |
| GET | `/stocks/compare?symbols=TCS.NS,INFY.NS` | Normalised comparison |
| GET | `/market/indices` | Global indices |
| GET | `/market/movers` | Top gainers & losers |
| GET | `/market/sectors` | Sector heatmap data |

### Express API (port 5000)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Create account |
| POST | `/api/auth/login` | — | Get JWT token |
| GET  | `/api/auth/me` | ✅ | Current user |
| GET  | `/api/watchlist` | ✅ | Get watchlist |
| POST | `/api/watchlist` | ✅ | Add stock |
| DELETE | `/api/watchlist/:symbol` | ✅ | Remove stock |
| GET  | `/api/portfolio` | ✅ | Holdings + P&L |
| POST | `/api/portfolio/trade` | ✅ | Record trade |
| GET  | `/api/alerts` | ✅ | User's alerts |
| POST | `/api/alerts` | ✅ | Create alert |
| PATCH | `/api/alerts/:id/toggle` | ✅ | Pause/resume |
| GET  | `/api/psychology` | ✅ | Behavioral metrics |
| POST | `/api/psychology/ai-roast` | ✅ | AI coach report |
| POST | `/api/qa/ask` | ✅ | Natural language Q&A |

---

## 🔮 Roadmap

- [ ] **Earnings call summarizer** — Auto-transcribe & extract guidance from quarterly calls
- [ ] **Pattern recognition scanner** — Detect head & shoulders, double bottom, cup & handle daily
- [ ] **Paper trading leaderboard** — Virtual portfolio competitions with real market prices
- [ ] **Stock correlation matrix** — Visual heatmap for portfolio diversification analysis
- [ ] **Economic calendar** — RBI/Fed events mapped to historically affected stocks
- [ ] **Mobile app** — React Native port

---

## 🤝 Contributing

Pull requests welcome. For major changes, open an issue first.

```bash
# Fork → clone → branch
git checkout -b feature/your-feature-name

# Make changes, then
git commit -m "feat: description of your change"
git push origin feature/your-feature-name
# Open a PR
```

---

## 📄 License

MIT — free for personal and commercial use.

---

<div align="center">

Built with ❤️ by **Atharva**

*StockSense is for informational purposes only. Not financial advice.*

</div>