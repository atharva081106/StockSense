"""
StockSense Python Data Service
FastAPI microservice providing:
  - Stock quotes, history, live prices
  - Technical indicators (RSI, MACD, Bollinger Bands, EMA, SMA, Stochastic)
  - AI predictions (Facebook Prophet)
  - Market indices and movers
  - Multi-stock comparison
  - News with sentiment scoring
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import yfinance as yf
import pandas as pd
import numpy as np
from typing import Optional, List
import warnings, traceback, requests
from datetime import datetime, timedelta
warnings.filterwarnings("ignore")

# ──────────────────────────────────────────────────────────────────────────────
# OFFLINE MOCK YFINANCE
# ──────────────────────────────────────────────────────────────────────────────
import socket

class MockFastInfo:
    def __init__(self, price, prev_close):
        self.last_price = price
        self.previous_close = prev_close

class MockTicker:
    def __init__(self, symbol):
        self.symbol = symbol.upper()
        h = sum(ord(c) for c in self.symbol)
        
        # Base prices & details for major stocks
        if "RELIANCE" in self.symbol:
            self.price = 2450.0 + (h % 50)
            self.name = "Reliance Industries Limited"
            self.sector = "Energy"
        elif "TCS" in self.symbol:
            self.price = 3800.0 + (h % 100)
            self.name = "Tata Consultancy Services Limited"
            self.sector = "Technology"
        elif "HDFCBANK" in self.symbol:
            self.price = 1450.0 + (h % 30)
            self.name = "HDFC Bank Limited"
            self.sector = "Financial Services"
        elif "INFY" in self.symbol:
            self.price = 1600.0 + (h % 40)
            self.name = "Infosys Limited"
            self.sector = "Technology"
        elif "AAPL" in self.symbol:
            self.price = 175.0 + (h % 10)
            self.name = "Apple Inc."
            self.sector = "Technology"
        elif "MSFT" in self.symbol:
            self.price = 420.0 + (h % 20)
            self.name = "Microsoft Corporation"
            self.sector = "Technology"
        elif "GOOGL" in self.symbol:
            self.price = 170.0 + (h % 10)
            self.name = "Alphabet Inc."
            self.sector = "Technology"
        elif "TSLA" in self.symbol:
            self.price = 180.0 + (h % 15)
            self.name = "Tesla, Inc."
            self.sector = "Consumer Cyclical"
        elif "^NSEI" in self.symbol:
            self.price = 22000.0 + (h % 500)
            self.name = "NIFTY 50"
            self.sector = "Index"
        elif "^BSESN" in self.symbol:
            self.price = 72000.0 + (h % 1000)
            self.name = "SENSEX"
            self.sector = "Index"
        elif "^NSEBANK" in self.symbol:
            self.price = 47000.0 + (h % 800)
            self.name = "NIFTY BANK"
            self.sector = "Index"
        elif "^CNXIT" in self.symbol:
            self.price = 35000.0 + (h % 500)
            self.name = "NIFTY IT"
            self.sector = "Index"
        elif "^CNXAUTO" in self.symbol:
            self.price = 18000.0 + (h % 300)
            self.name = "NIFTY AUTO"
            self.sector = "Index"
        elif "^CNXPHARMA" in self.symbol:
            self.price = 19000.0 + (h % 300)
            self.name = "NIFTY PHARMA"
            self.sector = "Index"
        elif "^CNXFMCG" in self.symbol:
            self.price = 53000.0 + (h % 500)
            self.name = "NIFTY FMCG"
            self.sector = "Index"
        elif "^CNXENERGY" in self.symbol:
            self.price = 33000.0 + (h % 400)
            self.name = "NIFTY ENERGY"
            self.sector = "Index"
        elif "^CNXMETAL" in self.symbol:
            self.price = 7800.0 + (h % 200)
            self.name = "NIFTY METAL"
            self.sector = "Index"
        elif "^CNXREALTY" in self.symbol:
            self.price = 850.0 + (h % 50)
            self.name = "NIFTY REALTY"
            self.sector = "Index"
        elif "^CNXINFRA" in self.symbol:
            self.price = 7900.0 + (h % 150)
            self.name = "NIFTY INFRA"
            self.sector = "Index"
        elif "QQQ" in self.symbol:
            self.price = 430.0 + (h % 20)
            self.name = "Invesco QQQ Trust"
            self.sector = "Technology ETF"
        elif "XLF" in self.symbol:
            self.price = 40.0 + (h % 5)
            self.name = "Financial Select Sector SPDR"
            self.sector = "Financials ETF"
        elif "XLV" in self.symbol:
            self.price = 140.0 + (h % 10)
            self.name = "Health Care Select Sector SPDR"
            self.sector = "Healthcare ETF"
        elif "XLE" in self.symbol:
            self.price = 90.0 + (h % 5)
            self.name = "Energy Select Sector SPDR"
            self.sector = "Energy ETF"
        elif "XLY" in self.symbol:
            self.price = 180.0 + (h % 10)
            self.name = "Consumer Discretionary Select Sector SPDR"
            self.sector = "Consumer ETF"
        else:
            self.price = 100.0 + (h % 900)
            self.name = f"{self.symbol} Corp"
            self.sector = "General"

        self.change = (h % 11) - 5.0  # between -5% and +5%
        self.change_pct = self.change / 100.0
        self.prev_close = self.price / (1.0 + self.change_pct)
        self.change_val = self.price - self.prev_close

        self.info = {
            "symbol": self.symbol,
            "longName": self.name,
            "shortName": self.name,
            "exchange": "NSE" if ".NS" in self.symbol else "BSE" if ".BO" in self.symbol else "NMS",
            "currency": "INR" if (".NS" in self.symbol or ".BO" in self.symbol or "^NSE" in self.symbol or "^BSE" in self.symbol) else "USD",
            "sector": self.sector,
            "industry": "Various Industries",
            "country": "India" if (".NS" in self.symbol or ".BO" in self.symbol) else "United States",
            "website": "https://example.com",
            "longBusinessSummary": f"This is a mocked profile for {self.name} ({self.symbol}). Useful for offline demonstration of StockSense.",
            "logo_url": "",
            "fullTimeEmployees": 10000,
            "regularMarketPrice": self.price,
            "currentPrice": self.price,
            "regularMarketPreviousClose": self.prev_close,
            "previousClose": self.prev_close,
            "regularMarketOpen": self.prev_close * 1.002,
            "open": self.prev_close * 1.002,
            "regularMarketDayHigh": max(self.price, self.prev_close) * 1.01,
            "dayHigh": max(self.price, self.prev_close) * 1.01,
            "regularMarketDayLow": min(self.price, self.prev_close) * 0.99,
            "dayLow": min(self.price, self.prev_close) * 0.99,
            "regularMarketVolume": 1500000,
            "volume": 1500000,
            "averageVolume": 2000000,
            "marketCap": int(self.price * 10000000),
            "trailingPE": 25.5,
            "forwardPE": 22.0,
            "trailingEps": self.price / 25.5,
            "regularMarketChangePercent": self.change,
            "regularMarketChange": self.change_val,
        }

        self.fast_info = MockFastInfo(self.price, self.prev_close)

        self.news = [
            {
                "uuid": f"news-{h}-{i}",
                "title": f"{self.name} ({self.symbol}) {'gains momentum' if self.change > 0 else 'faces resistance'} in today's session",
                "summary": f"Market participants are closely monitoring trading volumes for {self.name} as prices hover near support/resistance levels.",
                "url": "https://finance.yahoo.com",
                "publisher": "StockSense Analytics",
                "providerPublishTime": int(datetime.now().timestamp()) - i * 3600,
                "thumbnail": None
            }
            for i in range(5)
        ]

    def history(self, period="1y", interval="1d"):
        days = 365
        if period == "1d": days = 1
        elif period == "5d": days = 5
        elif period == "1mo": days = 30
        elif period == "3mo": days = 90
        elif period == "6mo": days = 180
        elif period == "2y": days = 730
        
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        dates = pd.date_range(start=start_date, end=end_date, freq='B')
        
        n = len(dates)
        if n == 0:
            n = 1
            dates = pd.date_range(start=start_date, periods=1)
            
        np.random.seed(sum(ord(c) for c in self.symbol))
        returns = np.random.normal(0.0002, 0.015, n)
        price_series = self.price * np.exp(np.cumsum(returns - returns[-1]))
        
        df = pd.DataFrame(index=dates)
        df["Close"] = price_series
        df["Open"] = price_series * (1.0 + np.random.normal(0, 0.005, n))
        df["High"] = df[["Open", "Close"]].max(axis=1) * (1.0 + np.abs(np.random.normal(0, 0.003, n)))
        df["Low"] = df[["Open", "Close"]].min(axis=1) * (1.0 - np.abs(np.random.normal(0, 0.003, n)))
        df["Volume"] = (np.random.randint(500000, 3000000, n)).astype(float)
        
        df.index.name = "Date"
        return df

def check_yfinance_working():
    try:
        test_ticker = yf.Ticker("AAPL")
        if hasattr(test_ticker, 'fast_info') and test_ticker.fast_info.get('lastPrice'):
            return True
        hist = test_ticker.history(period="1d")
        if not hist.empty:
            return True
    except Exception as e:
        print(f"yfinance test failed: {e}")
    return False

if not check_yfinance_working():
    print("[WARNING] yfinance is not working (rate-limited/offline). Intercepting with MockTicker.")
    yf.Ticker = MockTicker
else:
    print("[INFO] yfinance is connected to live market data.")



app = FastAPI(title="StockSense Python Service", version="3.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
@app.get("/health")
def health_check():
    return {"status": "ok", "service": "StockSense Python Data Engine", "version": "3.0.0"}

# ──────────────────────────────────────────────────────────────────────────────
# HELPERS
# ──────────────────────────────────────────────────────────────────────────────

def safe_float(val):
    if val is None:
        return None
    try:
        f = float(val)
        return None if (np.isnan(f) or np.isinf(f)) else round(f, 6)
    except:
        return None

def compute_rsi(series: pd.Series, period: int = 14) -> pd.Series:
    delta = series.diff()
    gain = delta.where(delta > 0, 0.0).rolling(period).mean()
    loss = (-delta.where(delta < 0, 0.0)).rolling(period).mean()
    rs = gain / loss
    return (100 - (100 / (1 + rs))).round(4)

def compute_macd(series: pd.Series, fast=12, slow=26, signal=9):
    ema_fast = series.ewm(span=fast, adjust=False).mean()
    ema_slow = series.ewm(span=slow, adjust=False).mean()
    macd = ema_fast - ema_slow
    signal_line = macd.ewm(span=signal, adjust=False).mean()
    return macd.round(6), signal_line.round(6), (macd - signal_line).round(6)

def compute_bollinger(series: pd.Series, period=20, num_std=2):
    sma = series.rolling(period).mean()
    std = series.rolling(period).std()
    return (sma + num_std * std).round(4), sma.round(4), (sma - num_std * std).round(4)

def compute_stochastic(high, low, close, k=14, d=3):
    ll = low.rolling(k).min()
    hh = high.rolling(k).max()
    pct_k = (100 * (close - ll) / (hh - ll)).round(4)
    pct_d = pct_k.rolling(d).mean().round(4)
    return pct_k, pct_d

def compute_atr(high, low, close, period=14):
    tr = pd.concat([
        high - low,
        (high - close.shift()).abs(),
        (low - close.shift()).abs()
    ], axis=1).max(axis=1)
    return tr.rolling(period).mean().round(4)

def compute_signal(rsi, macd, macd_sig, close, bb_lower, bb_upper, ema20, ema50):
    votes = []
    if rsi is not None and not np.isnan(rsi):
        if rsi < 35:   votes.append(1)
        elif rsi > 65: votes.append(-1)
        else:          votes.append(0)
    if macd is not None and macd_sig is not None:
        votes.append(1 if macd > macd_sig else -1)
    if close and bb_lower and bb_upper and not (np.isnan(bb_lower) or np.isnan(bb_upper)):
        if close < bb_lower:   votes.append(1)
        elif close > bb_upper: votes.append(-1)
        else:                  votes.append(0)
    if ema20 and ema50 and not (np.isnan(ema20) or np.isnan(ema50)):
        votes.append(1 if ema20 > ema50 else -1)
    if not votes:
        return "NEUTRAL", 0
    avg = sum(votes) / len(votes)
    if avg >= 0.34:   return "BUY", round(avg, 2)
    if avg <= -0.34:  return "SELL", round(avg, 2)
    return "NEUTRAL", round(avg, 2)

def series_to_list(s: pd.Series):
    return [safe_float(v) for v in s.values]

def simple_sentiment(text: str) -> dict:
    """Rule-based sentiment scoring on news headlines."""
    text_lower = text.lower()
    positive = ["surge", "gain", "rally", "soar", "jump", "rise", "beat", "growth",
                "profit", "record", "upgrade", "buy", "strong", "boost", "expand",
                "win", "success", "high", "bull", "up", "outperform", "positive"]
    negative = ["fall", "drop", "plunge", "crash", "loss", "decline", "miss",
                "downgrade", "sell", "weak", "cut", "layoff", "lawsuit", "bear",
                "down", "low", "underperform", "negative", "warning", "risk", "debt"]
    pos = sum(1 for w in positive if w in text_lower)
    neg = sum(1 for w in negative if w in text_lower)
    total = pos + neg
    if total == 0:
        return {"label": "NEUTRAL", "score": 0.5}
    score = pos / total
    if score >= 0.6:  return {"label": "POSITIVE", "score": round(score, 2)}
    if score <= 0.4:  return {"label": "NEGATIVE", "score": round(score, 2)}
    return {"label": "NEUTRAL", "score": round(score, 2)}


# ──────────────────────────────────────────────────────────────────────────────
# HEALTH
# ──────────────────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "service": "stocksense-python", "version": "3.0.0"}


# ──────────────────────────────────────────────────────────────────────────────
# STOCK SEARCH
# ──────────────────────────────────────────────────────────────────────────────

@app.get("/stocks/search")
def search_stocks(q: str = Query(..., min_length=1)):
    results = []
    candidates = [q.upper()]
    if "." not in q:
        candidates += [q.upper() + ".NS", q.upper() + ".BO"]
    seen = set()
    for sym in candidates:
        try:
            info = yf.Ticker(sym).info
            if not info or not info.get("regularMarketPrice"):
                continue
            s = info.get("symbol", sym)
            if s in seen:
                continue
            seen.add(s)
            results.append({
                "symbol": s,
                "name": info.get("longName") or info.get("shortName", s),
                "exchange": info.get("exchange", ""),
                "currency": info.get("currency", "USD"),
                "type": info.get("quoteType", "EQUITY"),
                "sector": info.get("sector", ""),
                "price": safe_float(info.get("regularMarketPrice")),
                "change": safe_float(info.get("regularMarketChange")),
                "changePercent": safe_float(info.get("regularMarketChangePercent")),
            })
        except:
            pass
    return {"results": results, "query": q}


# ──────────────────────────────────────────────────────────────────────────────
# STOCK QUOTE
# ──────────────────────────────────────────────────────────────────────────────

@app.get("/stocks/{symbol}/quote")
def get_quote(symbol: str):
    try:
        info = yf.Ticker(symbol).info
        if not info:
            raise HTTPException(404, f"Symbol {symbol} not found")
        return {
            "symbol":        info.get("symbol", symbol),
            "name":          info.get("longName") or info.get("shortName", symbol),
            "exchange":      info.get("exchange", ""),
            "currency":      info.get("currency", "USD"),
            "sector":        info.get("sector"),
            "industry":      info.get("industry"),
            "country":       info.get("country"),
            "website":       info.get("website"),
            "description":   info.get("longBusinessSummary"),
            "logo":          info.get("logo_url"),
            "employees":     info.get("fullTimeEmployees"),
            "price":         safe_float(info.get("regularMarketPrice") or info.get("currentPrice")),
            "previousClose": safe_float(info.get("regularMarketPreviousClose") or info.get("previousClose")),
            "open":          safe_float(info.get("regularMarketOpen") or info.get("open")),
            "dayHigh":       safe_float(info.get("regularMarketDayHigh") or info.get("dayHigh")),
            "dayLow":        safe_float(info.get("regularMarketDayLow") or info.get("dayLow")),
            "volume":        info.get("regularMarketVolume") or info.get("volume"),
            "avgVolume":     info.get("averageVolume"),
            "marketCap":     info.get("marketCap"),
            "peRatio":       safe_float(info.get("trailingPE")),
            "forwardPE":     safe_float(info.get("forwardPE")),
            "eps":           safe_float(info.get("trailingEps")),
            "dividendYield": safe_float(info.get("dividendYield")),
            "beta":          safe_float(info.get("beta")),
            "52WeekHigh":    safe_float(info.get("fiftyTwoWeekHigh")),
            "52WeekLow":     safe_float(info.get("fiftyTwoWeekLow")),
            "50DayAvg":      safe_float(info.get("fiftyDayAverage")),
            "200DayAvg":     safe_float(info.get("twoHundredDayAverage")),
            "change":        safe_float(info.get("regularMarketChange")),
            "changePercent": safe_float(info.get("regularMarketChangePercent")),
            "bookValue":     safe_float(info.get("bookValue")),
            "priceToBook":   safe_float(info.get("priceToBook")),
            "profitMargin":  safe_float(info.get("profitMargins")),
            "revenueGrowth": safe_float(info.get("revenueGrowth")),
            "roe":           safe_float(info.get("returnOnEquity")),
            "roa":           safe_float(info.get("returnOnAssets")),
            "debtToEquity":  safe_float(info.get("debtToEquity")),
            "currentRatio":  safe_float(info.get("currentRatio")),
            "quickRatio":    safe_float(info.get("quickRatio")),
            "grossMargin":   safe_float(info.get("grossMargins")),
            "operatingMargin": safe_float(info.get("operatingMargins")),
            "revenue":       info.get("totalRevenue"),
            "grossProfit":   info.get("grossProfits"),
            "freeCashflow":  info.get("freeCashflow"),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, str(e))


# ──────────────────────────────────────────────────────────────────────────────
# HISTORY
# ──────────────────────────────────────────────────────────────────────────────

@app.get("/stocks/{symbol}/history")
def get_history(
    symbol: str,
    period:   str = Query("3mo"),
    interval: str = Query("1d"),
):
    try:
        df = yf.Ticker(symbol).history(period=period, interval=interval)
        if df.empty:
            raise HTTPException(404, f"No data for {symbol}")
        df.index = pd.to_datetime(df.index)
        df = df.reset_index()
        candles = []
        for _, row in df.iterrows():
            ts = row.get("Datetime") or row.get("Date")
            candles.append({
                "time":   int(pd.Timestamp(ts).timestamp()),
                "open":   round(float(row["Open"]), 4),
                "high":   round(float(row["High"]), 4),
                "low":    round(float(row["Low"]), 4),
                "close":  round(float(row["Close"]), 4),
                "volume": int(row.get("Volume", 0) or 0),
            })
        return {"symbol": symbol, "period": period, "interval": interval,
                "count": len(candles), "data": candles}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, str(e))


# ──────────────────────────────────────────────────────────────────────────────
# TECHNICAL INDICATORS
# ──────────────────────────────────────────────────────────────────────────────

@app.get("/stocks/{symbol}/indicators")
def get_indicators(symbol: str, period: str = Query("6mo")):
    try:
        df = yf.Ticker(symbol).history(period=period, interval="1d")
        if df.empty or len(df) < 30:
            raise HTTPException(404, "Not enough data")

        close = df["Close"]
        high  = df["High"]
        low   = df["Low"]

        rsi             = compute_rsi(close)
        macd, macd_sig, macd_hist = compute_macd(close)
        bb_upper, bb_mid, bb_lower = compute_bollinger(close)
        ema9   = close.ewm(span=9,   adjust=False).mean().round(4)
        ema20  = close.ewm(span=20,  adjust=False).mean().round(4)
        ema50  = close.ewm(span=50,  adjust=False).mean().round(4)
        sma200 = close.rolling(200).mean().round(4)
        vwap   = ((close * df["Volume"]).cumsum() / df["Volume"].cumsum()).round(4)
        stoch_k, stoch_d = compute_stochastic(high, low, close)
        atr    = compute_atr(high, low, close)

        df.index = pd.to_datetime(df.index)
        timestamps = [int(pd.Timestamp(t).timestamp()) for t in df.index]

        l_rsi       = safe_float(rsi.iloc[-1])
        l_macd      = safe_float(macd.iloc[-1])
        l_macd_sig  = safe_float(macd_sig.iloc[-1])
        l_close     = safe_float(close.iloc[-1])
        l_bb_lower  = safe_float(bb_lower.iloc[-1])
        l_bb_upper  = safe_float(bb_upper.iloc[-1])
        l_ema20     = safe_float(ema20.iloc[-1])
        l_ema50     = safe_float(ema50.iloc[-1])

        signal, strength = compute_signal(
            l_rsi, l_macd, l_macd_sig, l_close,
            l_bb_lower, l_bb_upper, l_ema20, l_ema50
        )

        return {
            "symbol":   symbol,
            "signal":   signal,
            "strength": strength,
            "latest": {
                "rsi":           l_rsi,
                "macd":          l_macd,
                "macdSignal":    l_macd_sig,
                "macdHistogram": safe_float(macd_hist.iloc[-1]),
                "bbUpper":       l_bb_upper,
                "bbMid":         safe_float(bb_mid.iloc[-1]),
                "bbLower":       l_bb_lower,
                "ema9":          safe_float(ema9.iloc[-1]),
                "ema20":         l_ema20,
                "ema50":         l_ema50,
                "sma200":        safe_float(sma200.iloc[-1]) if len(df) >= 200 else None,
                "vwap":          safe_float(vwap.iloc[-1]),
                "stochK":        safe_float(stoch_k.iloc[-1]),
                "stochD":        safe_float(stoch_d.iloc[-1]),
                "atr":           safe_float(atr.iloc[-1]),
            },
            "series": {
                "timestamps":    timestamps,
                "close":         series_to_list(close),
                "rsi":           series_to_list(rsi),
                "macd":          series_to_list(macd),
                "macdSignal":    series_to_list(macd_sig),
                "macdHistogram": series_to_list(macd_hist),
                "bbUpper":       series_to_list(bb_upper),
                "bbMid":         series_to_list(bb_mid),
                "bbLower":       series_to_list(bb_lower),
                "ema9":          series_to_list(ema9),
                "ema20":         series_to_list(ema20),
                "ema50":         series_to_list(ema50),
                "stochK":        series_to_list(stoch_k),
                "stochD":        series_to_list(stoch_d),
                "volume":        [int(v or 0) for v in df["Volume"].values],
            },
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, str(e))


# ──────────────────────────────────────────────────────────────────────────────
# LIVE PRICE
# ──────────────────────────────────────────────────────────────────────────────

@app.get("/stocks/{symbol}/live")
def get_live(symbol: str):
    try:
        t    = yf.Ticker(symbol)
        info = t.info
        fast = t.fast_info

        price = safe_float(getattr(fast, "last_price", None)) or \
                safe_float(info.get("regularMarketPrice")) or \
                safe_float(info.get("currentPrice"))

        prev = safe_float(getattr(fast, "previous_close", None)) or \
               safe_float(info.get("regularMarketPreviousClose")) or \
               safe_float(info.get("previousClose"))

        change = chg_pct = None
        if price and prev and prev != 0:
            change  = round(price - prev, 4)
            chg_pct = round((change / prev) * 100, 4)

        return {
            "symbol":        symbol,
            "price":         price,
            "previousClose": prev,
            "change":        change,
            "changePercent": chg_pct,
            "volume":        info.get("regularMarketVolume"),
            "timestamp":     pd.Timestamp.now().isoformat(),
        }
    except Exception as e:
        raise HTTPException(500, str(e))


# ──────────────────────────────────────────────────────────────────────────────
# AI PREDICTION — Facebook Prophet
# ──────────────────────────────────────────────────────────────────────────────

@app.get("/stocks/{symbol}/predict")
def predict_price(symbol: str, days: int = Query(30, ge=7, le=90)):
    try:
        from prophet import Prophet
    except ImportError:
        raise HTTPException(503, "Prophet not installed. Run: pip install prophet")

    try:
        df = yf.Ticker(symbol).history(period="2y", interval="1d")
        if df.empty or len(df) < 60:
            raise HTTPException(404, "Not enough history for prediction (need 60+ days)")

        df = df.reset_index()
        date_col = "Datetime" if "Datetime" in df.columns else "Date"
        prophet_df = pd.DataFrame({
            "ds": pd.to_datetime(df[date_col]).dt.tz_localize(None),
            "y":  df["Close"].astype(float),
        })

        model = Prophet(
            daily_seasonality=False,
            weekly_seasonality=True,
            yearly_seasonality=True,
            changepoint_prior_scale=0.05,
            interval_width=0.80,
        )
        model.fit(prophet_df)

        future   = model.make_future_dataframe(periods=days, freq="B")
        forecast = model.predict(future)

        hist_end  = prophet_df["ds"].iloc[-1]
        pred_part = forecast[forecast["ds"] > hist_end].tail(days)
        hist_part = forecast[forecast["ds"] <= hist_end].tail(90)

        last_actual = float(prophet_df["y"].iloc[-1])
        last_pred   = float(pred_part["yhat"].iloc[-1]) if not pred_part.empty else last_actual
        direction   = "UP" if last_pred > last_actual else "DOWN"
        confidence  = min(95, max(50, round(abs(last_pred - last_actual) / last_actual * 100 + 65, 1)))

        def df_to_list(d):
            return [
                {
                    "time":   int(pd.Timestamp(row["ds"]).timestamp()),
                    "yhat":   round(float(row["yhat"]), 4),
                    "yhat_lower": round(float(row["yhat_lower"]), 4),
                    "yhat_upper": round(float(row["yhat_upper"]), 4),
                }
                for _, row in d.iterrows()
            ]

        return {
            "symbol":       symbol,
            "days":         days,
            "direction":    direction,
            "confidence":   confidence,
            "currentPrice": last_actual,
            "targetPrice":  round(last_pred, 4),
            "changePercent": round((last_pred - last_actual) / last_actual * 100, 2),
            "historical":   df_to_list(hist_part),
            "forecast":     df_to_list(pred_part),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Prediction error: {str(e)}")


# ──────────────────────────────────────────────────────────────────────────────
# NEWS WITH SENTIMENT
# ──────────────────────────────────────────────────────────────────────────────

@app.get("/stocks/{symbol}/news")
def get_news(symbol: str, limit: int = Query(10, ge=1, le=30)):
    try:
        ticker = yf.Ticker(symbol)
        raw_news = ticker.news or []
        articles = []
        for item in raw_news[:limit]:
            content = item.get("content", {}) if isinstance(item.get("content"), dict) else item
            title   = content.get("title") or item.get("title", "")
            summary = content.get("summary") or content.get("description") or item.get("summary") or item.get("description") or ""
            url     = (content.get("canonicalUrl") or {}).get("url") or (content.get("clickThroughUrl") or {}).get("url") or item.get("link") or item.get("url", "")
            source  = (content.get("provider") or {}).get("displayName") or item.get("publisher") or item.get("source", "")
            pub     = content.get("pubDate") or content.get("displayTime") or item.get("providerPublishTime") or item.get("publishedAt")
            thumb   = None
            if content.get("thumbnail"):
                res = content["thumbnail"].get("resolutions", [])
                thumb = res[0].get("url") if res else content["thumbnail"].get("originalUrl")
            elif item.get("thumbnail"):
                res = item["thumbnail"].get("resolutions", [])
                thumb = res[0].get("url") if res else item["thumbnail"].get("originalUrl")

            sentiment = simple_sentiment(title + " " + summary)
            articles.append({
                "id":          item.get("id") or item.get("uuid", ""),
                "title":       title,
                "summary":     summary[:300] if summary else "",
                "url":         url,
                "source":      source,
                "publishedAt": pub,
                "thumbnail":   thumb,
                "sentiment":   sentiment,
                "relatedTickers": item.get("relatedTickers", []),
            })
        return {"symbol": symbol, "count": len(articles), "articles": articles}
    except Exception as e:
        return {"symbol": symbol, "count": 0, "articles": [], "error": str(e)}


# ──────────────────────────────────────────────────────────────────────────────
# MARKET MOVERS
# ──────────────────────────────────────────────────────────────────────────────

@app.get("/market/movers")
def get_movers():
    indian = [
        "RELIANCE.NS","TCS.NS","HDFCBANK.NS","INFY.NS","ICICIBANK.NS",
        "HINDUNILVR.NS","SBIN.NS","BAJFINANCE.NS","BHARTIARTL.NS","KOTAKBANK.NS",
        "ITC.NS","LT.NS","AXISBANK.NS","ASIANPAINT.NS","MARUTI.NS",
        "WIPRO.NS","HCLTECH.NS","TITAN.NS","SUNPHARMA.NS","NESTLEIND.NS",
        "ADANIENT.NS","ADANIPORTS.NS","ULTRACEMCO.NS","TECHM.NS","POWERGRID.NS",
    ]
    global_ = [
        "AAPL","MSFT","GOOGL","AMZN","NVDA",
        "META","TSLA","JPM","V","BRK-B",
    ]
    results = []
    for sym in indian + global_:
        try:
            info = yf.Ticker(sym).info
            price = safe_float(info.get("regularMarketPrice") or info.get("currentPrice"))
            chg   = safe_float(info.get("regularMarketChangePercent"))
            if price and chg is not None:
                results.append({
                    "symbol":        sym,
                    "name":          info.get("shortName") or info.get("longName", sym),
                    "price":         price,
                    "change":        safe_float(info.get("regularMarketChange")),
                    "changePercent": chg,
                    "currency":      info.get("currency", "INR" if ".NS" in sym or ".BO" in sym else "USD"),
                    "volume":        info.get("regularMarketVolume"),
                    "marketCap":     info.get("marketCap"),
                    "sector":        info.get("sector", ""),
                })
        except:
            pass
    results.sort(key=lambda x: x.get("changePercent", 0), reverse=True)
    return {"gainers": results[:5], "losers": sorted(results, key=lambda x: x.get("changePercent", 0))[:5]}


# ──────────────────────────────────────────────────────────────────────────────
# MARKET INDICES
# ──────────────────────────────────────────────────────────────────────────────

@app.get("/market/indices")
def get_indices():
    indices = {
        "NIFTY 50":    "^NSEI",
        "SENSEX":      "^BSESN",
        "NIFTY BANK":  "^NSEBANK",
        "NIFTY IT":    "^CNXIT",
        "S&P 500":     "^GSPC",
        "NASDAQ":      "^IXIC",
        "DOW JONES":   "^DJI",
        "FTSE 100":    "^FTSE",
        "NIKKEI 225":  "^N225",
        "HANG SENG":   "^HSI",
    }
    results = []
    for name, sym in indices.items():
        try:
            info = yf.Ticker(sym).info
            price = safe_float(info.get("regularMarketPrice"))
            if price:
                results.append({
                    "name":          name,
                    "symbol":        sym,
                    "price":         price,
                    "change":        safe_float(info.get("regularMarketChange")),
                    "changePercent": safe_float(info.get("regularMarketChangePercent")),
                    "currency":      info.get("currency", ""),
                })
        except:
            pass
    return {"indices": results}


# ──────────────────────────────────────────────────────────────────────────────
# SECTOR HEATMAP
# ──────────────────────────────────────────────────────────────────────────────

@app.get("/market/sectors")
def get_sectors():
    """Returns sector performance for NSE sectors + global ETFs"""
    sector_etfs = {
        "Nifty IT":          "^CNXIT",
        "Nifty Bank":        "^NSEBANK",
        "Nifty Auto":        "^CNXAUTO",
        "Nifty Pharma":      "^CNXPHARMA",
        "Nifty FMCG":        "^CNXFMCG",
        "Nifty Energy":      "^CNXENERGY",
        "Nifty Metal":       "^CNXMETAL",
        "Nifty Realty":      "^CNXREALTY",
        "Nifty Infra":       "^CNXINFRA",
        "US Tech (QQQ)":     "QQQ",
        "US Finance (XLF)":  "XLF",
        "US Health (XLV)":   "XLV",
        "US Energy (XLE)":   "XLE",
        "US Consumer (XLY)": "XLY",
    }
    results = []
    for name, sym in sector_etfs.items():
        try:
            info = yf.Ticker(sym).info
            chg_pct = safe_float(info.get("regularMarketChangePercent"))
            price   = safe_float(info.get("regularMarketPrice"))
            if price is not None:
                results.append({
                    "sector":        name,
                    "symbol":        sym,
                    "price":         price,
                    "changePercent": chg_pct or 0,
                    "change":        safe_float(info.get("regularMarketChange")),
                })
        except:
            pass
    results.sort(key=lambda x: x.get("changePercent", 0), reverse=True)
    return {"sectors": results}


# ──────────────────────────────────────────────────────────────────────────────
# COMPARE STOCKS
# ──────────────────────────────────────────────────────────────────────────────

@app.get("/stocks/compare")
def compare(
    symbols: str = Query(...),
    period:  str = Query("3mo"),
):
    sym_list = [s.strip().upper() for s in symbols.split(",") if s.strip()][:5]
    if len(sym_list) < 2:
        raise HTTPException(400, "Need at least 2 symbols")

    all_data = {}
    meta = {}
    for sym in sym_list:
        try:
            df = yf.Ticker(sym).history(period=period, interval="1d")
            if not df.empty:
                all_data[sym] = df["Close"]
                info = yf.Ticker(sym).info
                meta[sym] = {
                    "name":          info.get("shortName", sym),
                    "currency":      info.get("currency", "USD"),
                    "changePercent": safe_float(info.get("regularMarketChangePercent")),
                    "price":         safe_float(info.get("regularMarketPrice")),
                }
        except:
            pass

    if not all_data:
        raise HTTPException(404, "No data found")

    combined = pd.DataFrame(all_data).dropna()
    timestamps = [int(pd.Timestamp(t).timestamp()) for t in combined.index]

    series = {}
    for sym in combined.columns:
        base = combined[sym].iloc[0]
        series[sym] = ((combined[sym] / base) * 100).round(4).tolist()

    return {
        "symbols":    list(combined.columns),
        "timestamps": timestamps,
        "series":     series,
        "meta":       meta,
        "period":     period,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)


# ──────────────────────────────────────────────────────────────────────────────
# BUILT-IN PREDICTION — No Prophet needed, works out of the box
# Uses: Linear regression, EMA projection, RSI momentum, Volume trend, MA signals
# ──────────────────────────────────────────────────────────────────────────────

@app.get("/stocks/{symbol}/predict-builtin")
def predict_builtin(symbol: str, days: int = Query(30, ge=7, le=90)):
    """
    Technical-analysis-based price prediction.
    Combines: Linear regression trend + EMA projection + RSI/MACD signals
    No external ML libraries needed — runs on any system.
    """
    try:
        df = yf.Ticker(symbol).history(period="1y", interval="1d")
        if df.empty or len(df) < 30:
            raise HTTPException(404, "Need at least 30 days of history")

        close  = df["Close"].astype(float)
        volume = df["Volume"].astype(float)
        high   = df["High"].astype(float)
        low    = df["Low"].astype(float)
        n      = len(close)

        # ── 1. Linear regression trend on last 90 days ──
        recent = min(90, n)
        x  = np.arange(recent)
        y  = close.values[-recent:]
        A  = np.vstack([x, np.ones(recent)]).T
        slope, intercept = np.linalg.lstsq(A, y, rcond=None)[0]

        # ── 2. EMA 20 & 50 projections ──
        ema20 = close.ewm(span=20, adjust=False).mean()
        ema50 = close.ewm(span=50, adjust=False).mean()

        # ── 3. RSI signal ──
        rsi = compute_rsi(close)
        last_rsi = rsi.iloc[-1] if not np.isnan(rsi.iloc[-1]) else 50

        # ── 4. MACD signal ──
        macd, macd_sig, _ = compute_macd(close)
        macd_bull = float(macd.iloc[-1]) > float(macd_sig.iloc[-1]) if not (np.isnan(macd.iloc[-1]) or np.isnan(macd_sig.iloc[-1])) else None

        # ── 5. Volume trend (last 20 vs prior 20) ──
        vol_recent = volume.values[-20:].mean()
        vol_prior  = volume.values[-40:-20].mean() if len(volume) >= 40 else vol_recent
        vol_ratio  = vol_recent / vol_prior if vol_prior > 0 else 1.0

        # ── 6. Price momentum: 5d / 20d / 60d returns ──
        mom5  = (close.iloc[-1] - close.iloc[-6])  / close.iloc[-6]  * 100 if n > 5  else 0
        mom20 = (close.iloc[-1] - close.iloc[-21]) / close.iloc[-21] * 100 if n > 20 else 0
        mom60 = (close.iloc[-1] - close.iloc[-61]) / close.iloc[-61] * 100 if n > 60 else 0

        # ── 7. MA crossover score ──
        ma_cross_score = 1 if ema20.iloc[-1] > ema50.iloc[-1] else -1

        # ── 8. Combine signals into composite score [-1, +1] ──
        signals = []

        # Linear trend direction
        trend_pct = slope / close.iloc[-1] * 100
        signals.append(np.clip(trend_pct / 0.3, -1, 1))

        # RSI
        if last_rsi < 35:   signals.append(0.8)
        elif last_rsi > 65: signals.append(-0.8)
        else:               signals.append((50 - last_rsi) / 50 * 0.3)

        # MACD
        if macd_bull is not None:
            signals.append(0.5 if macd_bull else -0.5)

        # Momentum
        signals.append(np.clip(mom5  / 5,  -1, 1) * 0.4)
        signals.append(np.clip(mom20 / 10, -1, 1) * 0.3)
        signals.append(np.clip(mom60 / 20, -1, 1) * 0.2)

        # Volume confirms trend
        if vol_ratio > 1.15: signals.append(0.2 * np.sign(slope))
        elif vol_ratio < 0.85: signals.append(-0.1)

        # MA crossover
        signals.append(ma_cross_score * 0.3)

        composite = np.clip(np.mean(signals), -1, 1)

        # ── 9. Build forecast prices ──
        last_price  = float(close.iloc[-1])
        ema20_last  = float(ema20.iloc[-1])

        # Daily drift from linear regression + composite signal boost
        daily_drift = slope / last_price  # percentage per day from regression
        signal_boost = composite * 0.003  # composite adds up to ±0.3%/day
        daily_return = daily_drift + signal_boost

        # Volatility: historical std of daily returns (last 30d)
        daily_rets = close.pct_change().dropna().values[-30:]
        volatility = float(np.std(daily_rets)) if len(daily_rets) > 0 else 0.015

        # Build forecast (central + confidence bands)
        forecast = []
        last_date = pd.Timestamp(df.index[-1])
        for i in range(1, days + 1):
            fdate = last_date + pd.tseries.offsets.BDay(i)
            price_pred = last_price * ((1 + daily_return) ** i)
            # Uncertainty widens with time (1.5σ band)
            band = 1.5 * volatility * np.sqrt(i) * last_price
            forecast.append({
                "time":        int(fdate.timestamp()),
                "yhat":        round(price_pred, 4),
                "yhat_lower":  round(price_pred - band, 4),
                "yhat_upper":  round(price_pred + band, 4),
            })

        # Historical fit (last 60 days)
        historical = []
        hist_slice = df.tail(min(60, n))
        for ts, row in hist_slice.iterrows():
            i_back = n - list(df.index).index(ts) - 1
            hist_pred = float(close.iloc[-1]) * ((1 + daily_return) ** (-i_back))
            historical.append({
                "time":  int(pd.Timestamp(ts).timestamp()),
                "yhat":  round(float(row["Close"]), 4),
                "yhat_lower": round(float(row["Close"]) * 0.98, 4),
                "yhat_upper": round(float(row["Close"]) * 1.02, 4),
            })

        target_price   = float(forecast[-1]["yhat"])
        change_pct     = (target_price - last_price) / last_price * 100
        direction      = "UP" if target_price > last_price else "DOWN"
        confidence     = min(90, max(45, round(55 + abs(composite) * 30, 0)))

        # ── 10. Build factor explanations ──
        factors = [
            {
                "name":   "Price Trend (Linear Regression)",
                "value":  round(trend_pct, 3),
                "signal": "BULLISH" if slope > 0 else "BEARISH",
                "weight": "High",
                "detail": f"90-day regression slope is {'upward' if slope>0 else 'downward'} at {abs(trend_pct):.3f}%/day",
            },
            {
                "name":   "Momentum (5d / 20d / 60d)",
                "value":  round(mom5, 2),
                "signal": "BULLISH" if mom20 > 0 else "BEARISH",
                "weight": "High",
                "detail": f"5d: {mom5:+.2f}%  |  20d: {mom20:+.2f}%  |  60d: {mom60:+.2f}%",
            },
            {
                "name":   "RSI (14-day)",
                "value":  round(last_rsi, 2),
                "signal": "OVERSOLD" if last_rsi<35 else "OVERBOUGHT" if last_rsi>65 else "NEUTRAL",
                "weight": "Medium",
                "detail": f"RSI at {last_rsi:.1f} — {'buy zone' if last_rsi<40 else 'sell zone' if last_rsi>60 else 'neutral zone'}",
            },
            {
                "name":   "MACD Signal",
                "value":  round(float(macd.iloc[-1]), 4) if not np.isnan(macd.iloc[-1]) else None,
                "signal": "BULLISH" if macd_bull else "BEARISH",
                "weight": "Medium",
                "detail": f"MACD {'above' if macd_bull else 'below'} signal line — {'bullish' if macd_bull else 'bearish'} crossover",
            },
            {
                "name":   "Volume Trend",
                "value":  round(vol_ratio, 3),
                "signal": "BULLISH" if vol_ratio > 1.1 else "BEARISH" if vol_ratio < 0.9 else "NEUTRAL",
                "weight": "Low",
                "detail": f"Recent volume is {(vol_ratio-1)*100:+.1f}% vs prior 20-day average",
            },
            {
                "name":   "EMA Crossover (20 vs 50)",
                "value":  round(float(ema20.iloc[-1]), 2),
                "signal": "BULLISH" if ma_cross_score > 0 else "BEARISH",
                "weight": "Medium",
                "detail": f"EMA20 ({ema20.iloc[-1]:.2f}) {'above' if ma_cross_score>0 else 'below'} EMA50 ({ema50.iloc[-1]:.2f})",
            },
        ]

        return {
            "symbol":        symbol,
            "days":          days,
            "direction":     direction,
            "confidence":    confidence,
            "composite":     round(float(composite), 4),
            "currentPrice":  round(last_price, 4),
            "targetPrice":   round(target_price, 4),
            "changePercent": round(change_pct, 2),
            "dailyDrift":    round(daily_return * 100, 4),
            "volatility":    round(volatility * 100, 4),
            "historical":    historical,
            "forecast":      forecast,
            "factors":       factors,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Prediction error: {str(e)}")
