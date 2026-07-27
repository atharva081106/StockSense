import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Globe, TrendingUp, TrendingDown, RefreshCw, Loader2 } from "lucide-react";
import api from "../services/api";

const pctColor = pct =>
  pct > 2    ? "#4ade80"
: pct > 0.5  ? "#86efac"
: pct < -2   ? "#f87171"
: pct < -0.5 ? "#fca5a5"
: "var(--k-t50)";

const pctBg = pct =>
  pct > 2    ? "rgba(74,222,128,0.14)"
: pct > 0.5  ? "rgba(74,222,128,0.07)"
: pct < -2   ? "rgba(248,113,113,0.14)"
: pct < -0.5 ? "rgba(248,113,113,0.07)"
: "var(--k-p06)";

const C = c => c === "INR" ? "₹" : "$";

export default function Market() {
  const [indices,    setIndices]    = useState([]);
  const [sectors,    setSectors]    = useState([]);
  const [movers,     setMovers]     = useState({ gainers:[], losers:[] });
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (spin=false) => {
    if (spin) setRefreshing(true);
    const [iR,sR,mR] = await Promise.allSettled([
      api.get("/market/indices"), api.get("/market/sectors"), api.get("/market/movers"),
    ]);
    if (iR.status==="fulfilled") setIndices(iR.value.data.indices||[]);
    if (sR.status==="fulfilled") setSectors(sR.value.data.sectors||[]);
    if (mR.status==="fulfilled") setMovers(mR.value.data||{gainers:[],losers:[]});
    setLoading(false); setRefreshing(false);
  };
  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black flex items-center gap-2" style={{ color:"var(--k-tx)" }}>
            <Globe size={20} style={{ color:"var(--k-p)" }}/>Market Overview
          </h1>
          <p className="text-sm mt-0.5" style={{ color:"var(--k-t50)" }}>Indices, sector heatmap &amp; movers</p>
        </div>
        <button onClick={()=>load(true)} disabled={refreshing} className="btn-secondary text-xs">
          <RefreshCw size={13} style={{ animation:refreshing?"spin 1s linear infinite":"none" }}/>Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 gap-2" style={{ color:"var(--k-t40)" }}>
          <Loader2 size={22} style={{ animation:"spin 1s linear infinite", color:"var(--k-p)" }}/><span>Loading market data…</span>
        </div>
      ) : (
        <>
          {/* Indices */}
          <section>
            <p className="section-label mb-3">Global Indices</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {indices.map(idx => {
                const pos = (idx.changePercent??0) >= 0;
                return (
                  <div key={idx.symbol} className="glass p-4">
                    <p className="text-xs truncate mb-1" style={{ color:"var(--k-t50)" }}>{idx.name}</p>
                    <p className="text-base font-black font-mono" style={{ color:"var(--k-tx)" }}>
                      {idx.price?.toLocaleString("en-IN",{maximumFractionDigits:2})}
                    </p>
                    <p className="text-xs font-bold mt-0.5 flex items-center gap-1"
                      style={{ color:pos?"#4ade80":"#f87171" }}>
                      {pos?<TrendingUp size={10}/>:<TrendingDown size={10}/>}
                      {pos?"+":""}{idx.changePercent?.toFixed(2)}%
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Sector heatmap */}
          {sectors.length > 0 && (
            <section>
              <p className="section-label mb-3">Sector Heatmap</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                {sectors.map(s => {
                  const pct = s.changePercent ?? 0;
                  return (
                    <div key={s.symbol} className="rounded-2xl p-3 transition-all hover:scale-[1.02]"
                      style={{
                        background: pctBg(pct),
                        border: `1px solid ${pctColor(pct)}30`,
                        cursor:"default",
                      }}>
                      <p className="text-xs font-bold truncate" style={{ color:"var(--k-t70)" }}>{s.sector}</p>
                      <p className="text-lg font-black font-mono mt-1" style={{ color:pctColor(pct) }}>
                        {pct>=0?"+":""}{pct.toFixed(2)}%
                      </p>
                      <p className="text-xs" style={{ color:"var(--k-t45)" }}>
                        {s.price?.toLocaleString("en-IN",{maximumFractionDigits:0})}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Movers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[
              { title:"Top Gainers", data:movers.gainers, icon:<TrendingUp size={15} style={{ color:"#4ade80" }}/> },
              { title:"Top Losers",  data:movers.losers,  icon:<TrendingDown size={15} style={{ color:"#f87171" }}/> },
            ].map(({ title, data, icon }) => (
              <div key={title} className="glass overflow-hidden">
                <div className="flex items-center gap-2 px-4 pt-4 pb-2 font-bold text-sm"
                  style={{ borderBottom:"1px solid var(--k-glass-border)", color:"var(--k-tx)" }}>
                  {icon}{title}
                </div>
                <div className="hidden sm:grid grid-cols-12 gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider"
                  style={{ borderBottom:"1px solid var(--k-p05)", color:"var(--k-t40)" }}>
                  <div className="col-span-5">Stock</div>
                  <div className="col-span-3 text-right">Price</div>
                  <div className="col-span-4 text-right">Change</div>
                </div>
                {data.map(s => {
                  const pos = (s.changePercent??0) >= 0;
                  return (
                    <Link key={s.symbol} to={`/stock/${encodeURIComponent(s.symbol)}`}
                      className="grid grid-cols-12 gap-2 items-center px-4 py-2.5 transition-all"
                      style={{ borderBottom:"1px solid var(--k-p05)" }}
                      onMouseEnter={e=>e.currentTarget.style.background="var(--k-p05)"}
                      onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                      <div className="col-span-5 min-w-0">
                        <p className="text-sm font-mono font-bold truncate" style={{ color:"var(--k-tx)" }}>{s.symbol}</p>
                        <p className="text-xs truncate" style={{ color:"var(--k-t45)" }}>{s.name}</p>
                      </div>
                      <div className="col-span-3 text-right">
                        <p className="text-sm font-mono font-bold" style={{ color:"var(--k-tx)" }}>
                          {C(s.currency)}{s.price?.toLocaleString("en-IN",{maximumFractionDigits:2})}
                        </p>
                      </div>
                      <div className="col-span-4 text-right">
                        <p className="text-sm font-bold" style={{ color:pos?"#4ade80":"#f87171" }}>
                          {pos?"+":""}{s.changePercent?.toFixed(2)}%
                        </p>
                        <p className="text-xs" style={{ color:pos?"#4ade80":"#f87171", opacity:0.7 }}>
                          {pos?"+":""}{s.change?.toFixed(2)}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
