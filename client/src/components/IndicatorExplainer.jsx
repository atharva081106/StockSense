import React, { useState, useRef, useEffect } from "react";
import { Sparkles, X, Loader2, ChevronRight } from "lucide-react";
import api from "../services/api";

/* Calls backend AI service with real indicator context for a specific stock */
async function fetchExplanation(symbol, indicatorId, indicatorLabel, latest, price) {
  try {
    const { data } = await api.post(`/stocks/${symbol}/explain-indicator`, {
      indicatorId,
      indicatorLabel,
      latest,
      price,
    });
    return data.explanation || "Unable to generate explanation.";
  } catch (e) {
    throw new Error(e.response?.data?.error || "API request failed");
  }
}

/* ── Component ─────────────────────────────────────────────── */
export default function IndicatorExplainer({ symbol, indicatorId, indicatorLabel, latest, price }) {
  const [open,    setOpen]    = useState(false);
  const [text,    setText]    = useState("");
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const explain = async () => {
    if (fetched) { setOpen(true); return; }
    setOpen(true);
    if (loading) return;
    setLoading(true);
    try {
      const result = await fetchExplanation(symbol, indicatorId, indicatorLabel, latest, price);
      setText(result);
      setFetched(true);
    } catch (e) {
      setText("⚠️ Could not generate explanation. Check network connection.");
      setFetched(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={explain}
        className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-xl transition-all"
        style={{
          background: open ? "var(--k-p20)" : "var(--k-p08)",
          border: open ? "1px solid var(--k-p40)" : "1px solid var(--k-p15)",
          color: open ? "var(--k-p)" : "var(--k-p60)",
        }}
        title={`AI explanation for ${indicatorLabel}`}
      >
        <Sparkles size={9}/>
        AI
      </button>

      {open && (
        <div className="absolute z-50 animate-slide-up"
          style={{
            bottom: "calc(100% + 8px)",
            right: 0,
            width: 300,
            background: "var(--k-b97)",
            backdropFilter: "blur(28px)",
            border: "1px solid var(--k-p25)",
            borderRadius: 16,
            boxShadow: "0 24px 64px rgba(0,0,0,0.8), 0 0 40px var(--k-p06)",
          }}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom:"1px solid var(--k-p12)" }}>
            <div className="flex items-center gap-2">
              <Sparkles size={12} style={{ color:"var(--k-p)" }}/>
              <span className="text-xs font-black" style={{ color:"var(--k-tx)" }}>
                AI: {indicatorLabel} for {symbol}
              </span>
            </div>
            <button onClick={() => setOpen(false)} style={{ color:"var(--k-t30)" }}>
              <X size={13}/>
            </button>
          </div>

          {/* Body */}
          <div className="p-4">
            {loading ? (
              <div className="flex items-center gap-2 py-2" style={{ color:"var(--k-p60)" }}>
                <Loader2 size={14} style={{ animation:"spin 1s linear infinite" }}/>
                <span className="text-xs">Analyzing {symbol} data…</span>
              </div>
            ) : (
              <p className="text-xs leading-relaxed" style={{ color:"var(--k-t70)" }}>
                {text}
              </p>
            )}
          </div>

          {/* Footer */}
          {fetched && !loading && (
            <div className="px-4 pb-3 flex items-center justify-between">
              <span className="text-[10px]" style={{ color:"var(--k-p40)" }}>
                Based on live data
              </span>
              <button onClick={() => { setFetched(false); setText(""); explain(); }}
                className="text-[10px] font-bold transition-colors"
                style={{ color:"var(--k-p50)" }}
                onMouseEnter={e => e.currentTarget.style.color = "var(--k-p)"}
                onMouseLeave={e => e.currentTarget.style.color = "var(--k-p50)"}>
                ↺ Refresh
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
