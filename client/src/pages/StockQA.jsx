import React, { useState, useEffect, useRef, useCallback } from "react";
import { Send, Bot, User, Loader2, Sparkles, RefreshCw, BookOpen, TrendingUp, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const POPULAR_STOCKS = [
  "RELIANCE.NS","TCS.NS","HDFCBANK.NS","INFY.NS","ICICIBANK.NS",
  "BAJFINANCE.NS","WIPRO.NS","AAPL","MSFT","NVDA","TSLA","GOOGL",
];

function MarkdownText({ text }) {
  // Simple bold + line break renderer
  const parts = text.split(/(\*\*[^*]+\*\*|\n)/g);
  return (
    <span>
      {parts.map((p, i) => {
        if (p.startsWith("**") && p.endsWith("**"))
          return <strong key={i} style={{ color:"var(--k-tx)", fontWeight:600 }}>{p.slice(2,-2)}</strong>;
        if (p === "\n") return <br key={i}/>;
        return p;
      })}
    </span>
  );
}

function ChatBubble({ msg }) {
  const isAI = msg.role === "assistant";
  return (
    <div className={`flex gap-3 ${isAI ? "" : "flex-row-reverse"} mb-5`}>
      {/* Avatar */}
      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
        style={{
          background: isAI
            ? "linear-gradient(135deg,var(--k-p),var(--k-s))"
            : "var(--k-t10)",
          border: isAI ? "none" : "1px solid var(--k-t15)",
        }}>
        {isAI
          ? <Bot size={15} style={{ color:"var(--k-tx)" }}/>
          : <User size={15} style={{ color:"var(--k-t60)" }}/>}
      </div>

      {/* Bubble */}
      <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
        isAI
          ? "rounded-tl-sm"
          : "rounded-tr-sm"
      }`}
        style={{
          background: isAI
            ? "var(--k-p08)"
            : "var(--k-t06)",
          border: isAI
            ? "1px solid var(--k-p18)"
            : "1px solid var(--k-t10)",
          color: "var(--k-t85)",
        }}>
        {msg.loading ? (
          <div className="flex items-center gap-2" style={{ color:"var(--k-p70)" }}>
            <Loader2 size={14} style={{ animation:"spin 1s linear infinite" }}/>
            <span className="text-xs">Analyzing market data…</span>
          </div>
        ) : (
          <MarkdownText text={msg.content} />
        )}

        {/* Data sources used */}
        {isAI && msg.dataUsed && (
          <div className="flex items-center gap-2 mt-2 pt-2 flex-wrap"
            style={{ borderTop:"1px solid var(--k-p10)" }}>
            {msg.dataUsed.hasQuote      && <span className="text-[10px] px-1.5 py-0.5 rounded-lg" style={{ background:"var(--k-p10)", color:"var(--k-p70)" }}>📊 Live quote</span>}
            {msg.dataUsed.hasIndicators && <span className="text-[10px] px-1.5 py-0.5 rounded-lg" style={{ background:"var(--k-p10)", color:"var(--k-p70)" }}>📈 Indicators</span>}
            {msg.dataUsed.hasNews       && <span className="text-[10px] px-1.5 py-0.5 rounded-lg" style={{ background:"var(--k-p10)", color:"var(--k-p70)" }}>📰 News</span>}
          </div>
        )}
      </div>
    </div>
  );
}

function SuggestionPill({ text, onClick }) {
  return (
    <button onClick={() => onClick(text)}
      className="text-xs px-3 py-2 rounded-2xl text-left transition-all hover:scale-[1.02] active:scale-95"
      style={{
        background:"var(--k-p07)",
        border:"1px solid var(--k-p18)",
        color:"var(--k-t70)",
        lineHeight:1.4,
      }}>
      {text}
    </button>
  );
}

export default function StockQA() {
  const [symbol,      setSymbol]      = useState("RELIANCE.NS");
  const [inputSymbol, setInputSymbol] = useState("RELIANCE.NS");
  const [messages,    setMessages]    = useState([]);
  const [question,    setQuestion]    = useState("");
  const [loading,     setLoading]     = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown,setShowDropdown]= useState(false);
  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);
  const nav        = useNavigate();

  // Initial greeting
  useEffect(() => {
    setMessages([{
      role: "assistant",
      content: `Hello! I'm StockSense AI. I have live data for **${symbol}** — including real-time price, technical indicators (RSI, MACD, Bollinger Bands), fundamentals, and recent news.\n\nAsk me anything about this stock. For example: "Why did it move today?" or "Is it a good buy right now?"`,
      id: "intro",
    }]);
  }, [symbol]);

  // Fetch suggestions when symbol changes
  useEffect(() => {
    api.get(`/qa/suggestions/${symbol}`)
      .then(r => setSuggestions(r.data.suggestions || []))
      .catch(() => {});
  }, [symbol]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:"smooth" });
  }, [messages]);

  const changeSymbol = (sym) => {
    const s = sym.toUpperCase().trim();
    if (!s) return;
    setSymbol(s);
    setInputSymbol(s);
    setMessages([]);
    setShowDropdown(false);
  };

  const send = useCallback(async (q) => {
    const text = (q || question).trim();
    if (!text || loading) return;

    setQuestion("");
    const userMsg = { role:"user", content:text, id: Date.now() };
    const loadMsg = { role:"assistant", content:"", loading:true, id: Date.now() + 1 };

    setMessages(prev => [...prev, userMsg, loadMsg]);
    setLoading(true);

    // Build history (last 6 messages, excluding loading)
    const history = messages
      .filter(m => !m.loading && m.id !== "intro")
      .slice(-6)
      .map(m => ({ role: m.role, content: m.content }));

    try {
      const { data } = await api.post("/qa/ask", { symbol, question: text, history });
      setMessages(prev => prev.map(m =>
        m.loading ? { role:"assistant", content: data.answer, dataUsed: data.dataUsed, id: Date.now() + 2 } : m
      ));
    } catch (err) {
      const errMsg = err.response?.data?.error || "Failed to get response. Check that the server is running.";
      setMessages(prev => prev.map(m =>
        m.loading ? { role:"assistant", content:`⚠️ ${errMsg}`, id: Date.now() + 2 } : m
      ));
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [question, loading, messages, symbol]);

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const clearChat = () => {
    setMessages([{
      role:"assistant",
      content:`Chat cleared. I'm still tracking **${symbol}** with live data. What would you like to know?`,
      id: Date.now(),
    }]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-88px)] max-h-[900px]">
      {/* ── Page header ── */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <h1 className="text-xl font-black flex items-center gap-2" style={{ color:"var(--k-tx)" }}>
            <Bot size={20} style={{ color:"var(--k-p)" }}/>
            Stock Q&A
          </h1>
          <p className="text-xs mt-0.5" style={{ color:"var(--k-p60)" }}>
            Ask anything — powered by live data + Claude AI
          </p>
        </div>

        {/* Symbol selector */}
        <div className="relative">
          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                value={inputSymbol}
                onChange={e => setInputSymbol(e.target.value.toUpperCase())}
                onFocus={() => setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                onKeyDown={e => e.key === "Enter" && changeSymbol(inputSymbol)}
                className="input pr-8 text-sm w-40 font-mono font-bold"
                placeholder="RELIANCE.NS"
                style={{ borderColor: "var(--k-p30)" }}
              />
              <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color:"var(--k-p50)" }}/>
            </div>
            <button onClick={() => changeSymbol(inputSymbol)} className="btn-primary text-xs px-3 py-2">
              Load
            </button>
          </div>

          {showDropdown && (
            <div className="absolute right-0 top-full mt-2 z-50 rounded-2xl overflow-hidden w-56"
              style={{ background:"var(--k-b97)", border:"1px solid var(--k-p20)", boxShadow:"0 16px 48px rgba(0,0,0,0.7)" }}>
              <p className="px-3 py-2 text-[10px] font-black uppercase tracking-widest" style={{ color:"var(--k-p50)", borderBottom:"1px solid var(--k-p10)" }}>Popular</p>
              {POPULAR_STOCKS.map(s => (
                <button key={s} onMouseDown={() => changeSymbol(s)}
                  className="w-full text-left px-3 py-2 text-xs font-mono font-bold transition-colors"
                  style={{ color:"var(--k-t70)" }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--k-p10)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Chat area ── */}
      <div className="flex flex-col flex-1 rounded-3xl overflow-hidden"
        style={{ background:"var(--k-b50)", border:"1px solid var(--k-p15)" }}>

        {/* Active symbol bar */}
        <div className="flex items-center justify-between px-5 py-2.5 shrink-0"
          style={{ borderBottom:"1px solid var(--k-p10)", background:"var(--k-p05)" }}>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background:"#4ade80", boxShadow:"0 0 6px rgba(74,222,128,0.6)" }}/>
            <span className="text-xs font-bold font-mono" style={{ color:"var(--k-tx)" }}>{symbol}</span>
            <span className="text-xs" style={{ color:"var(--k-p60)" }}>· Live data loaded</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => nav(`/stock/${encodeURIComponent(symbol)}`)}
              className="text-xs flex items-center gap-1 transition-colors"
              style={{ color:"var(--k-p60)" }}
              onMouseEnter={e => e.currentTarget.style.color = "var(--k-p)"}
              onMouseLeave={e => e.currentTarget.style.color = "var(--k-p60)"}>
              <TrendingUp size={11}/>View chart
            </button>
            <button onClick={clearChat} className="text-xs flex items-center gap-1 transition-colors"
              style={{ color:"var(--k-t25)" }}
              onMouseEnter={e => e.currentTarget.style.color = "var(--k-t60)"}
              onMouseLeave={e => e.currentTarget.style.color = "var(--k-t25)"}>
              <RefreshCw size={11}/>Clear
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {messages.map((msg) => (
            <ChatBubble key={msg.id} msg={msg}/>
          ))}
          <div ref={bottomRef}/>
        </div>

        {/* Suggestions */}
        {suggestions.length > 0 && messages.length <= 2 && (
          <div className="px-5 pb-3 shrink-0">
            <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color:"var(--k-p50)" }}>
              Quick questions
            </p>
            <div className="grid grid-cols-2 gap-2">
              {suggestions.slice(0, 4).map(s => (
                <SuggestionPill key={s} text={s} onClick={send}/>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="px-4 pb-4 pt-2 shrink-0"
          style={{ borderTop:"1px solid var(--k-p10)" }}>
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={handleKey}
              placeholder={`Ask anything about ${symbol}… (Enter to send)`}
              rows={1}
              className="flex-1 resize-none input text-sm"
              style={{
                minHeight:44, maxHeight:120,
                borderColor:"var(--k-p20)",
                lineHeight:1.5,
              }}
              onInput={e => {
                e.target.style.height = "44px";
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
              }}
            />
            <button
              onClick={() => send()}
              disabled={!question.trim() || loading}
              className="btn-primary px-4 py-3 shrink-0"
              style={{ borderRadius:14 }}>
              {loading
                ? <Loader2 size={16} style={{ animation:"spin 1s linear infinite" }}/>
                : <Send size={16}/>}
            </button>
          </div>
          <p className="text-[10px] mt-1.5 text-center" style={{ color:"var(--k-t20)" }}>
            AI answers combine live price data, indicators, news, and fundamentals
          </p>
        </div>
      </div>
    </div>
  );
}
