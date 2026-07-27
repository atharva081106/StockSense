import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { TrendingUp, TrendingDown, RefreshCw, ArrowRight, Flame, Zap } from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const C = c => c==="INR"?"₹":"$";

const IndexCard = ({ item }) => {
  const pos = (item.changePercent??0) >= 0;
  return (
    <div className="rounded-2xl p-4 transition-all duration-200 cursor-default group hover:scale-[1.02]"
      style={{
        background: pos ? "rgba(74,222,128,0.04)" : "rgba(248,113,113,0.04)",
        border: pos ? "1px solid rgba(74,222,128,0.1)" : "1px solid rgba(248,113,113,0.1)",
        backdropFilter:"blur(16px)",
      }}>
      <p className="text-xs font-semibold truncate mb-2" style={{ color:"var(--k-t45)" }}>{item.name}</p>
      <p className="text-base font-black font-mono" style={{ color:"var(--k-tx)" }}>
        {item.price?.toLocaleString("en-IN",{maximumFractionDigits:2})}
      </p>
      <div className="flex items-center gap-1 mt-1" style={{ color:pos?"#4ade80":"#f87171" }}>
        {pos?<TrendingUp size={11}/>:<TrendingDown size={11}/>}
        <span className="text-xs font-bold">{pos?"+":""}{item.changePercent?.toFixed(2)}%</span>
      </div>
    </div>
  );
};

const MoverRow = ({ s, rank }) => {
  const pos = (s.changePercent??0)>=0;
  return (
    <Link to={`/stock/${encodeURIComponent(s.symbol)}`}
      className="flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all group"
      onMouseEnter={e=>e.currentTarget.style.background="var(--k-p06)"}
      onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
      <span className="text-xs font-bold w-5 shrink-0" style={{ color:"var(--k-t25)" }}>#{rank}</span>
      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-black text-[10px]"
        style={{ background: pos?"rgba(74,222,128,0.08)":"rgba(248,113,113,0.08)", border: pos?"1px solid rgba(74,222,128,0.15)":"1px solid rgba(248,113,113,0.15)", color:pos?"#4ade80":"#f87171" }}>
        {s.symbol.replace(".NS","").replace(".BO","").slice(0,3)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-mono font-bold truncate" style={{ color:"var(--k-tx)" }}>{s.symbol}</p>
        <p className="text-xs truncate" style={{ color:"var(--k-t35)" }}>{s.name}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-mono font-bold" style={{ color:"var(--k-tx)" }}>
          {C(s.currency)}{s.price?.toLocaleString("en-IN",{maximumFractionDigits:2})}
        </p>
        <p className="text-xs font-bold" style={{ color:pos?"#4ade80":"#f87171" }}>
          {pos?"+":""}{s.changePercent?.toFixed(2)}%
        </p>
      </div>
    </Link>
  );
};

export default function Dashboard() {
  const { user } = useAuth();
  const [indices,    setIndices]    = useState([]);
  const [movers,     setMovers]     = useState({gainers:[],losers:[]});
  const [watchlist,  setWatchlist]  = useState([]);
  const [loadIdx,    setLoadIdx]    = useState(true);
  const [loadMov,    setLoadMov]    = useState(true);
  const [loadWL,     setLoadWL]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (spin=false) => {
    if (spin) setRefreshing(true);
    const [iR,mR,wR] = await Promise.allSettled([
      api.get("/market/indices"), api.get("/market/movers"), api.get("/watchlist"),
    ]);
    if (iR.status==="fulfilled") setIndices(iR.value.data.indices||[]);
    if (mR.status==="fulfilled") setMovers(mR.value.data||{gainers:[],losers:[]});
    if (wR.status==="fulfilled") setWatchlist(wR.value.data.stocks||[]);
    setLoadIdx(false); setLoadMov(false); setLoadWL(false); setRefreshing(false);
  };
  useEffect(()=>{ load(); },[]);

  const hour = new Date().getHours();
  const greeting = hour<12?"morning":hour<17?"afternoon":"evening";

  return (
    <div className="space-y-7">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl px-7 py-8"
        style={{
          background:"linear-gradient(135deg, var(--k-d30) 0%, var(--k-s20) 40%, var(--k-p12) 100%)",
          border:"1px solid var(--k-p20)",
          backdropFilter:"blur(24px)",
        }}>
        {/* Orbs */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none blur-[80px] opacity-25"
          style={{ background:"radial-gradient(circle,var(--k-p),transparent)", transform:"translate(30%,-30%)" }}/>
        <div className="absolute bottom-0 left-1/2 w-48 h-48 rounded-full pointer-events-none blur-[60px] opacity-15"
          style={{ background:"radial-gradient(circle,var(--k-s),transparent)" }}/>

        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-sm font-medium mb-1" style={{ color:"var(--k-t50)" }}>Good {greeting}</p>
            <h1 className="text-3xl font-black mb-2" style={{ color:"var(--k-tx)" }}>
              {user?.name?.split(" ")[0]}{" "}
              <span style={{ background:"linear-gradient(135deg,var(--k-p),var(--k-p),#ff6b35)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>
                👋
              </span>
            </h1>
            <p className="text-sm" style={{ color:"var(--k-t35)" }}>
              {new Date().toLocaleDateString("en-IN",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}
            </p>
          </div>
          <button onClick={()=>load(true)} disabled={refreshing}
            className="btn-secondary text-xs shrink-0">
            <RefreshCw size={13} style={{ animation:refreshing?"spin 1s linear infinite":"none" }}/>Refresh
          </button>
        </div>
      </div>

      {/* Indices */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Flame size={13} style={{ color:"var(--k-p)" }}/>
          <p className="section-label">Market Indices</p>
        </div>
        {loadIdx ? (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[...Array(10)].map((_,i)=><div key={i} className="skeleton h-20 rounded-2xl"/>)}
          </div>
        ) : indices.length===0 ? (
          <div className="rounded-2xl p-6 text-center text-sm" style={{ background:"var(--k-p05)", border:"1px solid var(--k-p10)", color:"var(--k-t35)" }}>
            Market data unavailable — ensure Python service is running on port 8000
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {indices.map(i=><IndexCard key={i.symbol} item={i}/>)}
          </div>
        )}
      </section>

      {/* Movers + Watchlist */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Gainers */}
        <div className="glass overflow-hidden">
          <div className="flex items-center gap-2 px-5 pt-5 pb-3" style={{ borderBottom:"1px solid var(--k-p10)" }}>
            <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background:"rgba(74,222,128,0.1)", border:"1px solid rgba(74,222,128,0.2)" }}>
              <TrendingUp size={13} style={{ color:"#4ade80" }}/>
            </div>
            <p className="font-black text-sm" style={{ color:"var(--k-tx)" }}>Top Gainers</p>
          </div>
          {loadMov ? (
            <div className="p-4 space-y-2">{[...Array(5)].map((_,i)=><div key={i} className="skeleton h-12 rounded-2xl"/>)}</div>
          ) : (
            <div className="px-2 py-2">{movers.gainers.map((s,i)=><MoverRow key={s.symbol} s={s} rank={i+1}/>)}</div>
          )}
        </div>

        {/* Losers */}
        <div className="glass overflow-hidden">
          <div className="flex items-center gap-2 px-5 pt-5 pb-3" style={{ borderBottom:"1px solid var(--k-p10)" }}>
            <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background:"rgba(248,113,113,0.1)", border:"1px solid rgba(248,113,113,0.2)" }}>
              <TrendingDown size={13} style={{ color:"#f87171" }}/>
            </div>
            <p className="font-black text-sm" style={{ color:"var(--k-tx)" }}>Top Losers</p>
          </div>
          {loadMov ? (
            <div className="p-4 space-y-2">{[...Array(5)].map((_,i)=><div key={i} className="skeleton h-12 rounded-2xl"/>)}</div>
          ) : (
            <div className="px-2 py-2">{movers.losers.map((s,i)=><MoverRow key={s.symbol} s={s} rank={i+1}/>)}</div>
          )}
        </div>

        {/* Watchlist */}
        <div className="glass overflow-hidden">
          <div className="flex items-center justify-between px-5 pt-5 pb-3" style={{ borderBottom:"1px solid var(--k-p10)" }}>
            <p className="font-black text-sm" style={{ color:"var(--k-tx)" }}>Watchlist</p>
            <Link to="/watchlist" className="flex items-center gap-1 text-xs font-bold transition-colors"
              style={{ color:"var(--k-p70)" }}
              onMouseEnter={e=>e.currentTarget.style.color="var(--k-p)"}
              onMouseLeave={e=>e.currentTarget.style.color="var(--k-p70)"}>
              All <ArrowRight size={11}/>
            </Link>
          </div>
          {loadWL ? (
            <div className="p-4 space-y-2">{[...Array(4)].map((_,i)=><div key={i} className="skeleton h-12 rounded-2xl"/>)}</div>
          ) : watchlist.length===0 ? (
            <div className="p-8 text-center">
              <p className="text-sm mb-3" style={{ color:"var(--k-t35)" }}>Watchlist is empty</p>
              <Link to="/watchlist" className="btn-primary text-xs">Add Stocks</Link>
            </div>
          ) : (
            <div className="px-2 py-2">
              {watchlist.slice(0,6).map(s=>(
                <Link key={s.symbol} to={`/stock/${encodeURIComponent(s.symbol)}`}
                  className="flex items-center justify-between px-3 py-2.5 rounded-2xl transition-all group"
                  onMouseEnter={e=>e.currentTarget.style.background="var(--k-p06)"}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <div>
                    <p className="text-sm font-mono font-bold" style={{ color:"var(--k-tx)" }}>{s.symbol}</p>
                    <p className="text-xs" style={{ color:"var(--k-t35)" }}>{s.exchange}</p>
                  </div>
                  <ArrowRight size={13} style={{ color:"var(--k-p40)" }} className="group-hover:translate-x-0.5 transition-transform"/>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions — flowing pills */}
      <div className="flex flex-wrap gap-3">
        {[
          { to:"/market",    emoji:"🌍", label:"Market Overview" },
          { to:"/portfolio", emoji:"💼", label:"Portfolio"       },
          { to:"/alerts",    emoji:"🔔", label:"Price Alerts"    },
          { to:"/compare",   emoji:"📊", label:"Compare Stocks"  },
        ].map(c=>(
          <Link key={c.to} to={c.to}
            className="flex items-center gap-2.5 px-5 py-3 rounded-2xl font-bold text-sm transition-all hover:scale-[1.03] active:scale-95"
            style={{
              background:"var(--k-p07)",
              border:"1px solid var(--k-p15)",
              color:"var(--k-tx)",
              backdropFilter:"blur(12px)",
            }}
            onMouseEnter={e=>{ e.currentTarget.style.background="var(--k-p14)"; e.currentTarget.style.borderColor="var(--k-p30)"; }}
            onMouseLeave={e=>{ e.currentTarget.style.background="var(--k-p07)"; e.currentTarget.style.borderColor="var(--k-p15)"; }}>
            <span className="text-xl">{c.emoji}</span>{c.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
