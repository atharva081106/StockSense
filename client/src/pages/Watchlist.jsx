import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Star, Trash2, ExternalLink, Loader2, TrendingUp, RefreshCw } from "lucide-react";
import api from "../services/api";
import toast from "react-hot-toast";

export default function Watchlist() {
  const [stocks,  setStocks]  = useState([]);
  const [prices,  setPrices]  = useState({});
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(false);
  const [removing,setRemoving]= useState(null);

  const fetchWL = async () => {
    try { const { data } = await api.get("/watchlist"); setStocks(data.stocks||[]); }
    catch { toast.error("Failed to load watchlist"); }
    finally { setLoading(false); }
  };

  const fetchPrices = async (list) => {
    if (!list.length) return;
    setRefresh(true);
    const res = {};
    await Promise.allSettled(list.map(async s => {
      try { const { data } = await api.get(`/stocks/${s.symbol}/live`); res[s.symbol]=data; } catch {}
    }));
    setPrices(res); setRefresh(false);
  };

  useEffect(() => { fetchWL(); }, []);
  useEffect(() => { if (stocks.length) fetchPrices(stocks); }, [stocks]);

  const remove = async sym => {
    setRemoving(sym);
    try { await api.delete(`/watchlist/${sym}`); setStocks(p=>p.filter(s=>s.symbol!==sym)); toast.success(`${sym} removed`); }
    catch { toast.error("Failed to remove"); }
    finally { setRemoving(null); }
  };

  const s = (stock) => {
    const p   = prices[stock.symbol];
    const C   = stock.currency === "INR" ? "₹" : "$";
    const pos = (p?.changePercent??0) >= 0;
    return { p, C, pos };
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black flex items-center gap-2" style={{ color:"var(--k-tx)" }}>
            <Star size={20} style={{ color:"var(--k-p)", fill:"var(--k-p)" }}/>Watchlist
          </h1>
          <p className="text-xs mt-0.5" style={{ color:"var(--k-t50)" }}>{stocks.length} stock{stocks.length!==1?"s":""} tracked</p>
        </div>
        <button onClick={()=>fetchPrices(stocks)} disabled={refresh||!stocks.length} className="btn-secondary text-xs">
          <RefreshCw size={13} style={{ animation:refresh?"spin 1s linear infinite":"none" }}/>Refresh
        </button>
      </div>

      {/* Tip */}
      <div className="glass p-3">
        <p className="text-xs" style={{ color:"var(--k-t50)" }}>
          💡 Search a stock above → open its detail page → click <strong style={{ color:"var(--k-p)" }}>Watch</strong> to add here.
          Use <span className="font-mono" style={{ color:"var(--k-p)" }}>RELIANCE.NS</span> for NSE or <span className="font-mono" style={{ color:"var(--k-p)" }}>RELIANCE.BO</span> for BSE.
        </p>
      </div>

      {loading ? (
        <div className="glass p-6 space-y-3">
          {[...Array(5)].map((_,i)=><div key={i} className="skeleton h-14 rounded-2xl"/>)}
        </div>
      ) : stocks.length === 0 ? (
        <div className="glass p-12 text-center">
          <Star size={32} className="mx-auto mb-3" style={{ color:"var(--k-t30)" }}/>
          <p className="font-bold" style={{ color:"var(--k-tx)" }}>No stocks yet</p>
          <p className="text-sm mt-1" style={{ color:"var(--k-t50)" }}>Search a stock and click Watch on its detail page</p>
        </div>
      ) : (
        <div className="glass overflow-hidden">
          {/* Header */}
          <div className="hidden md:grid grid-cols-12 gap-3 px-4 py-2.5 text-xs font-bold uppercase tracking-wider"
            style={{ borderBottom:"1px solid var(--k-glass-border)", color:"var(--k-t40)" }}>
            <div className="col-span-5">Stock</div>
            <div className="col-span-3 text-right">Price</div>
            <div className="col-span-2 text-right">Change</div>
            <div className="col-span-2 text-right">%</div>
          </div>

          {stocks.map(stock => {
            const { p, C, pos } = s(stock);
            return (
              <div key={stock.symbol}
                className="grid grid-cols-12 gap-2 items-center px-4 py-3"
                style={{ borderBottom:"1px solid var(--k-p05)" }}
                onMouseEnter={e=>e.currentTarget.style.background="var(--k-p05)"}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <div className="col-span-5 flex items-center gap-2 min-w-0">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-black text-[10px]"
                    style={{ background:"var(--k-p12)", border:"1px solid var(--k-p20)", color:"var(--k-p)" }}>
                    {stock.symbol.replace(".NS","").replace(".BO","").slice(0,3)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-mono font-bold text-sm truncate" style={{ color:"var(--k-tx)" }}>{stock.symbol}</p>
                    <p className="text-xs truncate" style={{ color:"var(--k-t50)" }}>{stock.name}</p>
                  </div>
                </div>
                <div className="col-span-3 text-right">
                  {p ? <p className="text-sm font-mono font-bold" style={{ color:"var(--k-tx)" }}>{C}{p.price?.toLocaleString("en-IN",{maximumFractionDigits:2})}</p>
                     : <div className="skeleton h-4 w-16 ml-auto"/>}
                </div>
                <div className="col-span-2 text-right">
                  {p ? <p className="text-xs font-bold font-mono" style={{ color:pos?"#4ade80":"#f87171" }}>
                        {pos?"+":""}{p.change?.toFixed(2)}
                       </p>
                     : <div className="skeleton h-3 w-12 ml-auto"/>}
                </div>
                <div className="col-span-2 text-right flex items-center justify-end gap-1">
                  {p ? <p className="text-xs font-bold" style={{ color:pos?"#4ade80":"#f87171" }}>
                        {pos?"+":""}{p.changePercent?.toFixed(2)}%
                       </p>
                     : <div className="skeleton h-3 w-10 ml-auto"/>}
                  <Link to={`/stock/${encodeURIComponent(stock.symbol)}`}
                    className="p-1.5 rounded-lg transition-colors"
                    style={{ color:"var(--k-t30)" }}
                    onMouseEnter={e=>e.currentTarget.style.color="var(--k-p)"}
                    onMouseLeave={e=>e.currentTarget.style.color="var(--k-t30)"}>
                    <ExternalLink size={13}/>
                  </Link>
                  <button onClick={()=>remove(stock.symbol)} disabled={removing===stock.symbol}
                    className="p-1.5 rounded-lg transition-colors"
                    style={{ color:"var(--k-t30)" }}
                    onMouseEnter={e=>e.currentTarget.style.color="#f87171"}
                    onMouseLeave={e=>e.currentTarget.style.color="var(--k-t30)"}>
                    {removing===stock.symbol ? <Loader2 size={13} style={{ animation:"spin 1s linear infinite" }}/> : <Trash2 size={13}/>}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
