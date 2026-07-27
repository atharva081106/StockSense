import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Star, Bell, Loader2, ExternalLink, Globe, Users, TrendingUp, ArrowLeft, Activity, BarChart2, Newspaper, Brain, ChevronRight } from "lucide-react";
import api from "../services/api";
import StockChart      from "../components/StockChart";
import IndicatorsPanel from "../components/IndicatorsPanel";
import PredictionChart from "../components/PredictionChart";
import NewsPanel       from "../components/NewsPanel";
import PriceTicker     from "../components/PriceTicker";
import toast from "react-hot-toast";

const Row = ({ label, value }) => value!=null&&value!=="" ? (
  <div className="flex justify-between py-2" style={{ borderBottom:"1px solid var(--k-p07)" }}>
    <span className="text-xs" style={{ color:"var(--k-t40)" }}>{label}</span>
    <span className="text-xs font-bold text-right max-w-[55%] truncate" style={{ color:"var(--k-tx)" }}>{value}</span>
  </div>
) : null;

const fmt = (v,pre="") => v==null?"—":pre+(v>=1e12?`${(v/1e12).toFixed(2)}T`:v>=1e9?`${(v/1e9).toFixed(2)}B`:v>=1e7?`${(v/1e7).toFixed(2)}Cr`:v>=1e5?`${(v/1e5).toFixed(2)}L`:v.toLocaleString("en-IN",{maximumFractionDigits:2}));

const TABS = [
  { id:"chart",        label:"Chart",       icon:<Activity size={13}/> },
  { id:"predict",      label:"AI Predict",  icon:<Brain size={13}/>    },
  { id:"indicators",   label:"Indicators",  icon:<BarChart2 size={13}/> },
  { id:"news",         label:"News",        icon:<Newspaper size={13}/> },
  { id:"fundamentals", label:"Fundamentals",icon:<TrendingUp size={13}/> },
];

export default function StockDetail() {
  const { symbol } = useParams();
  const [quote,   setQuote]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [inWL,    setInWL]    = useState(false);
  const [wlLoad,  setWlLoad]  = useState(false);
  const [tab,     setTab]     = useState("chart");
  const [showAll, setShowAll] = useState(false);

  useEffect(()=>{
    window.scrollTo({top:0}); setLoading(true); setError(null);
    Promise.allSettled([api.get(`/stocks/${symbol}/quote`),api.get("/watchlist")])
      .then(([qR,wR])=>{
        if (qR.status==="fulfilled") setQuote(qR.value.data);
        else setError(qR.reason?.response?.data?.error||"Failed to load");
        if (wR.status==="fulfilled") setInWL((wR.value.data.stocks||[]).some(s=>s.symbol===symbol));
      }).finally(()=>setLoading(false));
  },[symbol]);

  const toggleWL = async () => {
    setWlLoad(true);
    try {
      if (inWL) { await api.delete(`/watchlist/${symbol}`); setInWL(false); toast.success(`${symbol} removed`); }
      else { await api.post("/watchlist",{symbol,name:quote?.name||symbol,exchange:quote?.exchange||"",currency:quote?.currency||"INR"}); setInWL(true); toast.success(`${symbol} added!`); }
    } catch(e) { toast.error(e.response?.data?.error||"Failed"); }
    finally { setWlLoad(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64 gap-3" style={{ color:"var(--k-t40)" }}>
      <Loader2 size={22} style={{ color:"var(--k-p)", animation:"spin 1s linear infinite" }}/>
      <span className="font-medium">Loading {symbol}…</span>
    </div>
  );
  if (error) return (
    <div className="text-center py-16">
      <p className="text-sm mb-4" style={{ color:"rgba(248,113,113,0.7)" }}>{error}</p>
      <Link to="/" className="btn-secondary">← Back</Link>
    </div>
  );

  const CC = quote?.currency==="INR"?"₹":"$";
  const pos = (quote?.changePercent??0)>=0;
  const desc = quote?.description||"";

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-semibold transition-colors"
        style={{ color:"var(--k-p50)" }}
        onMouseEnter={e=>e.currentTarget.style.color="var(--k-p)"}
        onMouseLeave={e=>e.currentTarget.style.color="var(--k-p50)"}>
        <ArrowLeft size={13}/> Dashboard
      </Link>

      {/* Header */}
      <div className="overflow-hidden rounded-3xl relative"
        style={{
          background: pos
            ? "linear-gradient(135deg,rgba(74,222,128,0.04),var(--k-p06))"
            : "linear-gradient(135deg,rgba(248,113,113,0.04),var(--k-p06))",
          border:"1px solid var(--k-p18)",
          backdropFilter:"blur(24px)",
        }}>
        {/* Ambient */}
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full pointer-events-none blur-[90px] opacity-15"
          style={{ background:`radial-gradient(circle,${pos?"#22c55e":"#ef4444"},transparent)`, transform:"translate(35%,-35%)" }}/>
        <div className="relative p-7">
          <div className="flex flex-col sm:flex-row sm:items-start gap-6">
            <div className="flex-1">
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {quote?.exchange && (
                  <span className="text-xs font-bold px-2.5 py-1 rounded-xl font-mono"
                    style={{ background:"var(--k-p10)", border:"1px solid var(--k-p20)", color:"var(--k-p70)" }}>
                    {quote.exchange}
                  </span>
                )}
                {quote?.sector && <span className="badge-ember badge">{quote.sector}</span>}
                {quote?.industry && <span className="badge-crimson badge hidden sm:inline-flex">{quote.industry}</span>}
              </div>
              <h1 className="text-2xl font-black mb-0.5" style={{ color:"var(--k-tx)" }}>{quote?.name}</h1>
              <p className="font-mono text-sm mb-5" style={{ color:"var(--k-t40)" }}>{symbol} · {quote?.currency}</p>
              <PriceTicker symbol={symbol} initialPrice={quote?.price} initialChange={quote?.change}
                initialChangePct={quote?.changePercent} currency={quote?.currency}/>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={toggleWL} disabled={wlLoad}
                className="btn-secondary gap-2 text-sm"
                style={inWL?{ borderColor:"rgba(251,191,36,0.3)", color:"#fbbf24" }:{}}>
                {wlLoad?<Loader2 size={14} style={{ animation:"spin 1s linear infinite" }}/>:<Star size={14} className={inWL?"fill-current":""}/>}
                {inWL?"Watching":"Watch"}
              </button>
              <Link to="/alerts" className="btn-secondary gap-2 text-sm">
                <Bell size={14}/>Alert
              </Link>
            </div>
          </div>

          {/* Day stats */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 mt-6 pt-5"
            style={{ borderTop:"1px solid var(--k-p10)" }}>
            {[
              ["Open",       `${CC}${quote?.open?.toLocaleString("en-IN",{maximumFractionDigits:2})||"—"}`],
              ["Prev Close", `${CC}${quote?.previousClose?.toLocaleString("en-IN",{maximumFractionDigits:2})||"—"}`],
              ["High",       `${CC}${quote?.dayHigh?.toLocaleString("en-IN",{maximumFractionDigits:2})||"—"}`],
              ["Low",        `${CC}${quote?.dayLow?.toLocaleString("en-IN",{maximumFractionDigits:2})||"—"}`],
              ["52W High",   `${CC}${quote?.["52WeekHigh"]?.toLocaleString("en-IN",{maximumFractionDigits:2})||"—"}`],
              ["52W Low",    `${CC}${quote?.["52WeekLow"]?.toLocaleString("en-IN",{maximumFractionDigits:2})||"—"}`],
            ].map(([l,v])=>(
              <div key={l}>
                <p className="text-xs mb-0.5" style={{ color:"var(--k-t35)" }}>{l}</p>
                <p className="text-sm font-mono font-black" style={{ color:"var(--k-tx)" }}>{v}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tab bar - pill style */}
      <div className="tab-bar">
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} className={`tab-item ${tab===t.id?"active":""}`}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab==="fundamentals" ? (
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="glass p-5"><h3 className="font-black text-sm mb-4 flex items-center gap-2"><span className="w-1 h-4 rounded-full inline-block" style={{ background:"var(--k-p)" }}/>Valuation</h3>
            <Row label="Market Cap"   value={fmt(quote?.marketCap,CC)}/>
            <Row label="P/E (TTM)"    value={quote?.peRatio?.toFixed(2)}/>
            <Row label="Forward P/E"  value={quote?.forwardPE?.toFixed(2)}/>
            <Row label="Price/Book"   value={quote?.priceToBook?.toFixed(2)}/>
            <Row label="EPS"          value={quote?.eps?`${CC}${quote.eps.toFixed(2)}`:null}/>
            <Row label="Div Yield"    value={quote?.dividendYield?`${(quote.dividendYield*100).toFixed(2)}%`:"—"}/>
            <Row label="Beta"         value={quote?.beta?.toFixed(2)}/>
          </div>
          <div className="glass p-5"><h3 className="font-black text-sm mb-4 flex items-center gap-2"><span className="w-1 h-4 rounded-full inline-block" style={{ background:"var(--k-s)" }}/>Profitability</h3>
            <Row label="Profit Margin"    value={quote?.profitMargin?`${(quote.profitMargin*100).toFixed(2)}%`:null}/>
            <Row label="Gross Margin"     value={quote?.grossMargin?`${(quote.grossMargin*100).toFixed(2)}%`:null}/>
            <Row label="Operating Margin" value={quote?.operatingMargin?`${(quote.operatingMargin*100).toFixed(2)}%`:null}/>
            <Row label="ROE"              value={quote?.roe?`${(quote.roe*100).toFixed(2)}%`:null}/>
            <Row label="Revenue Growth"   value={quote?.revenueGrowth?`${(quote.revenueGrowth*100).toFixed(2)}%`:null}/>
          </div>
          <div className="glass p-5"><h3 className="font-black text-sm mb-4 flex items-center gap-2"><span className="w-1 h-4 rounded-full inline-block" style={{ background:"var(--k-d)" }}/>Financial Health</h3>
            <Row label="Revenue"       value={fmt(quote?.revenue,CC)}/>
            <Row label="Gross Profit"  value={fmt(quote?.grossProfit,CC)}/>
            <Row label="Free Cashflow" value={fmt(quote?.freeCashflow,CC)}/>
            <Row label="Debt/Equity"   value={quote?.debtToEquity?.toFixed(2)}/>
            <Row label="Current Ratio" value={quote?.currentRatio?.toFixed(2)}/>
          </div>
          <div className="glass p-5"><h3 className="font-black text-sm mb-4 flex items-center gap-2"><span className="w-1 h-4 rounded-full inline-block" style={{ background:"var(--k-t40)" }}/>Performance</h3>
            <Row label="50-Day Avg"  value={quote?.["50DayAvg"]?`${CC}${quote["50DayAvg"].toFixed(2)}`:null}/>
            <Row label="200-Day Avg" value={quote?.["200DayAvg"]?`${CC}${quote["200DayAvg"].toFixed(2)}`:null}/>
            <Row label="Volume"      value={quote?.volume?.toLocaleString("en-IN")}/>
            <Row label="Avg Volume"  value={quote?.avgVolume?.toLocaleString("en-IN")}/>
          </div>
          {desc && (
            <div className="glass p-5 sm:col-span-2">
              <h3 className="font-black text-sm mb-3">About {quote?.name}</h3>
              <p className="text-sm leading-relaxed" style={{ color:"var(--k-t50)" }}>
                {showAll?desc:desc.slice(0,400)}{desc.length>400&&!showAll&&"…"}
              </p>
              {desc.length>400&&<button onClick={()=>setShowAll(p=>!p)} className="text-xs font-bold mt-2 transition-colors" style={{ color:"var(--k-p)" }}>{showAll?"Show less":"Read more"}</button>}
              <div className="flex flex-wrap gap-2 mt-4">
                {quote?.sector   && <span className="badge-ember  badge">{quote.sector}</span>}
                {quote?.industry && <span className="badge-crimson badge">{quote.industry}</span>}
                {quote?.country  && <span className="badge-cream  badge"><Globe size={10}/>{quote.country}</span>}
                {quote?.website  && <a href={quote.website} target="_blank" rel="noopener noreferrer" className="badge-green badge hover:underline"><ExternalLink size={10}/>Website</a>}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            {tab==="chart"      && <StockChart symbol={symbol}/>}
            {tab==="predict"    && <PredictionChart symbol={symbol} currency={quote?.currency}/>}
            {tab==="indicators" && <IndicatorsPanel symbol={symbol}/>}
            {tab==="news"       && <NewsPanel symbol={symbol}/>}
          </div>
          {/* Sidebar */}
          <div className="space-y-4">
            <div className="glass p-5">
              <h3 className="font-black text-sm mb-4 flex items-center gap-2">
                <span className="w-1 h-4 rounded-full inline-block" style={{ background:"var(--k-p)" }}/>Key Stats
              </h3>
              <Row label="Market Cap" value={fmt(quote?.marketCap,CC)}/>
              <Row label="P/E"        value={quote?.peRatio?.toFixed(2)}/>
              <Row label="EPS"        value={quote?.eps?`${CC}${quote.eps.toFixed(2)}`:null}/>
              <Row label="Div Yield"  value={quote?.dividendYield?`${(quote.dividendYield*100).toFixed(2)}%`:"—"}/>
              <Row label="Beta"       value={quote?.beta?.toFixed(2)}/>
              <Row label="Volume"     value={quote?.volume?.toLocaleString("en-IN")}/>
              <Row label="52W High"   value={quote?.["52WeekHigh"]?`${CC}${quote["52WeekHigh"].toFixed(2)}`:null}/>
              <Row label="52W Low"    value={quote?.["52WeekLow"]?`${CC}${quote["52WeekLow"].toFixed(2)}`:null}/>
              <Row label="Sector"     value={quote?.sector}/>
            </div>
            {/* Quick predict CTA */}
            {tab==="chart" && (
              <button onClick={()=>setTab("predict")} className="w-full rounded-2xl p-4 text-left group transition-all duration-200"
                style={{ background:"linear-gradient(135deg,var(--k-p10),var(--k-p06))", border:"1px solid var(--k-p20)" }}
                onMouseEnter={e=>{e.currentTarget.style.background="linear-gradient(135deg,var(--k-p18),var(--k-s10))"; e.currentTarget.style.borderColor="var(--k-p35)";}}
                onMouseLeave={e=>{e.currentTarget.style.background="linear-gradient(135deg,var(--k-p10),var(--k-p06))"; e.currentTarget.style.borderColor="var(--k-p20)";}}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background:"var(--k-p15)", border:"1px solid var(--k-p25)" }}>
                    <Brain size={18} style={{ color:"var(--k-p)" }}/>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-black" style={{ color:"var(--k-tx)" }}>AI Prediction</p>
                    <p className="text-xs" style={{ color:"var(--k-t40)" }}>Forecast next 7–90 days</p>
                  </div>
                  <ChevronRight size={14} style={{ color:"var(--k-p50)" }} className="group-hover:translate-x-0.5 transition-transform"/>
                </div>
              </button>
            )}
            {tab==="chart" && <IndicatorsPanel symbol={symbol}/>}
          </div>
        </div>
      )}
    </div>
  );
}
