import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, Loader2, TrendingUp, TrendingDown } from "lucide-react";
import api from "../services/api";

const POPULAR = [
  { symbol:"RELIANCE.NS", name:"Reliance Industries",       exchange:"NSE", currency:"INR" },
  { symbol:"TCS.NS",      name:"Tata Consultancy Services", exchange:"NSE", currency:"INR" },
  { symbol:"HDFCBANK.NS", name:"HDFC Bank",                 exchange:"NSE", currency:"INR" },
  { symbol:"INFY.NS",     name:"Infosys Ltd.",              exchange:"NSE", currency:"INR" },
  { symbol:"AAPL",        name:"Apple Inc.",                exchange:"NASDAQ", currency:"USD" },
  { symbol:"NVDA",        name:"NVIDIA Corporation",        exchange:"NASDAQ", currency:"USD" },
  { symbol:"MSFT",        name:"Microsoft Corp.",           exchange:"NASDAQ", currency:"USD" },
];

let timer = null;

export default function SearchBar() {
  const [q, setQ]           = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen]       = useState(false);
  const ref = useRef(null);
  const nav = useNavigate();

  const search = useCallback(async val => {
    if (!val.trim()) { setResults([]); setLoading(false); return; }
    setLoading(true);
    try { const { data } = await api.get(`/stocks/search?q=${encodeURIComponent(val)}`); setResults(data.results||[]); }
    catch { setResults([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    clearTimeout(timer); timer = setTimeout(() => search(q), 400);
    return () => clearTimeout(timer);
  }, [q, search]);

  useEffect(() => {
    const h = e => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const pick = sym => { nav(`/stock/${encodeURIComponent(sym)}`); setOpen(false); setQ(""); setResults([]); };
  const items = q.trim() ? results : POPULAR;

  return (
    <div ref={ref} className="relative w-full">
      {/* Input */}
      <div className="flex items-center gap-2.5 px-4 py-2.5 transition-all duration-200"
        style={{
          background: open ? "var(--k-b80)" : "var(--k-b60)",
          backdropFilter: "blur(20px)",
          border: open ? "1px solid var(--k-p40)" : "1px solid var(--k-p18)",
          borderRadius: "999px",
          boxShadow: open ? "0 0 20px var(--k-p10), 0 4px 16px rgba(0,0,0,0.4)" : "0 2px 8px rgba(0,0,0,0.3)",
        }}>
        <Search size={15} style={{ color: open ? "var(--k-p)" : "var(--k-t35)", flexShrink:0 }} />
        <input value={q} onChange={e => setQ(e.target.value)} onFocus={() => setOpen(true)}
          placeholder="Search — RELIANCE.NS, TCS, AAPL…"
          className="flex-1 bg-transparent text-sm outline-none font-medium"
          style={{ color:"var(--k-tx)" }} />
        {loading && <Loader2 size={14} style={{ color:"var(--k-p)", animation:"spin 1s linear infinite", flexShrink:0 }}/>}
        {q && !loading && (
          <button onClick={() => { setQ(""); setResults([]); }} style={{ color:"var(--k-t40)" }}>
            <X size={14}/>
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && (loading || items.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-2 overflow-hidden animate-slide-up"
          style={{
            background: "var(--k-b97)",
            backdropFilter: "blur(28px)",
            border: "1px solid var(--k-p20)",
            borderRadius: "20px",
            boxShadow: "0 24px 64px rgba(0,0,0,0.7), 0 0 40px var(--k-p08)",
            zIndex: 50,
          }}>
          {!q.trim() && (
            <div className="px-4 py-2.5" style={{ borderBottom:"1px solid var(--k-p10)" }}>
              <p className="section-label">Popular Stocks</p>
            </div>
          )}
          {loading && q ? (
            <div className="flex items-center justify-center gap-2 py-8" style={{ color:"var(--k-t40)" }}>
              <Loader2 size={16} style={{ animation:"spin 1s linear infinite", color:"var(--k-p)" }}/>
              <span className="text-sm">Searching markets…</span>
            </div>
          ) : (
            <ul className="max-h-[340px] overflow-y-auto p-2">
              {items.length===0&&q ? (
                <li className="px-4 py-5 text-sm text-center" style={{ color:"var(--k-t35)" }}>No results for "{q}"</li>
              ) : items.map(item => {
                const pos = item.changePercent >= 0;
                return (
                  <li key={item.symbol}>
                    <button onMouseDown={() => pick(item.symbol)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
                      style={{ ":hover":{ background:"var(--k-p08)" } }}
                      onMouseEnter={e => e.currentTarget.style.background="var(--k-p08)"}
                      onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-black text-[10px]"
                        style={{ background:"var(--k-p10)", border:"1px solid var(--k-p20)", color:"var(--k-p)" }}>
                        {item.symbol.replace(".NS","").replace(".BO","").slice(0,3)}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-sm font-mono font-bold" style={{ color:"var(--k-tx)" }}>{item.symbol}</p>
                        <p className="text-xs truncate" style={{ color:"var(--k-t45)" }}>{item.name}</p>
                      </div>
                      <div className="text-right shrink-0">
                        {item.exchange && <p className="text-xs font-semibold" style={{ color:"var(--k-p60)" }}>{item.exchange}</p>}
                        {item.price && (
                          <p className="text-xs font-mono" style={{ color:"var(--k-t70)" }}>
                            {item.currency==="INR"?"₹":"$"}{item.price?.toLocaleString("en-IN")}
                          </p>
                        )}
                        {item.changePercent != null && (
                          <p className="text-xs font-bold" style={{ color: pos?"#4ade80":"#f87171" }}>
                            {pos?"+":""}{item.changePercent?.toFixed(2)}%
                          </p>
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
