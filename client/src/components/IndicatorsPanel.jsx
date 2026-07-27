import React, { useState, useEffect } from "react";
import ReactApexChart from "react-apexcharts";
import { Loader2, HelpCircle, ChevronDown, ChevronUp, BookOpen } from "lucide-react";
import api from "../services/api";
import IndicatorExplainer from "./IndicatorExplainer";

const GUIDE = {
  RSI:   { full:"Relative Strength Index", emoji:"📊", simple:"Tells you if the stock is moving too fast in one direction.", how:"Values 0–100. Below 30 = oversold (buy signal). Above 70 = overbought (sell signal). Between 30–70 = neutral.", levels:{ low:30, high:70 }, color:"#a78bfa" },
  MACD:  { full:"Moving Average Convergence Divergence", emoji:"📈", simple:"Shows momentum shifts — when bulls gain/lose strength vs bears.", how:"MACD crosses above Signal = Bullish. MACD crosses below Signal = Bearish. Histogram widens = momentum increasing.", levels:null, color:"#4ade80" },
  BB:    { full:"Bollinger Bands", emoji:"🎯", simple:"Shows the normal price range with upper and lower boundaries.", how:"Price near Upper Band = possibly overbought. Near Lower Band = possibly oversold. Bands narrow before big moves.", levels:null, color:"#60a5fa" },
  STOCH: { full:"Stochastic Oscillator", emoji:"⚡", simple:"Compares current price to its range over a set period.", how:"Above 80 = overbought. Below 20 = oversold. %K crossing above %D = bullish signal.", levels:{ low:20, high:80 }, color:"#fb923c" },
  EMA:   { full:"Exponential Moving Average", emoji:"〰️", simple:"A smoothed average price giving more weight to recent data.", how:"EMA20 above EMA50 = uptrend. EMA20 below EMA50 = downtrend. Price above EMA = bullish bias.", levels:null, color:"var(--k-p)" },
  ATR:   { full:"Average True Range", emoji:"📏", simple:"Measures how much the stock typically moves per day.", how:"High ATR = volatile stock (wider stop losses needed). Low ATR = calm. Rising ATR = trend strengthening.", levels:null, color:"#fbbf24" },
  VWAP:  { full:"Volume Weighted Average Price", emoji:"⚖️", simple:"The average price weighted by volume — used by institutions.", how:"Price above VWAP = bullish intraday bias. Below VWAP = bearish. Institutions often use VWAP as benchmark.", levels:null, color:"#22d3ee" },
};

const GuidePill = ({ id }) => {
  const [show, setShow] = useState(false);
  const g = GUIDE[id];
  if (!g) return null;
  return (
    <div className="relative inline-block">
      <button onClick={() => setShow(p => !p)}
        className="ml-1 align-middle transition-colors"
        style={{ color: show ? "var(--k-p)" : "var(--k-t20)" }}>
        <HelpCircle size={12}/>
      </button>
      {show && (
        <div className="absolute z-50 p-4 w-72 animate-fade-in"
          style={{
            top:"calc(100% + 6px)", left:0,
            background:"var(--k-b97)", backdropFilter:"blur(24px)",
            border:"1px solid var(--k-p25)", borderRadius:16,
            boxShadow:"0 16px 48px rgba(0,0,0,0.7), 0 0 32px var(--k-p08)",
          }}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-base">{g.emoji}</span>
            <div>
              <p className="text-xs font-black" style={{ color:"var(--k-tx)" }}>{g.full}</p>
              <p className="text-xs font-bold" style={{ color:"var(--k-p70)" }}>{id}</p>
            </div>
          </div>
          <p className="text-xs font-semibold mb-2" style={{ color:"var(--k-t75)" }}>💡 {g.simple}</p>
          <p className="text-xs leading-relaxed" style={{ color:"var(--k-t45)", borderTop:"1px solid var(--k-p10)", paddingTop:8 }}>{g.how}</p>
          {g.levels && (
            <div className="flex gap-2 mt-2">
              <span className="text-xs px-2 py-1 rounded-lg font-bold" style={{ background:"rgba(74,222,128,0.1)", color:"#4ade80" }}>Buy ≤ {g.levels.low}</span>
              <span className="text-xs px-2 py-1 rounded-lg font-bold" style={{ background:"rgba(248,113,113,0.1)", color:"#f87171" }}>Sell ≥ {g.levels.high}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const SignalBadge = ({ signal }) => {
  const m = { BUY:["#4ade80","BUY"], SELL:["#f87171","SELL"], NEUTRAL:["#fbbf24","HOLD"] };
  const [c,l] = m[signal] || m.NEUTRAL;
  return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black" style={{ background:`${c}15`, color:c, border:`1px solid ${c}25` }}>{l}</span>;
};

const Collapsible = ({ title, guideId, value, valueColor, open, setOpen, explainerProps, children }) => (
  <div className="rounded-2xl overflow-hidden" style={{ background:"var(--k-b50)", border:"1px solid var(--k-p15)" }}>
    <div onClick={() => setOpen(p => !p)} className="w-full flex items-center justify-between px-4 py-3 cursor-pointer select-none">
      <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
        <span className="text-sm font-bold" style={{ color:"var(--k-tx)" }}>{title}</span>
        <GuidePill id={guideId}/>
      </div>
      <div className="flex items-center gap-2">
        {/* AI explainer button */}
        {explainerProps && <div onClick={e => e.stopPropagation()}><IndicatorExplainer {...explainerProps}/></div>}
        {value != null && <span className="text-sm font-mono font-bold" style={{ color:valueColor||"var(--k-tx)" }}>{value}</span>}
        {open ? <ChevronUp size={13} style={{ color:"var(--k-t30)" }}/> : <ChevronDown size={13} style={{ color:"var(--k-t30)" }}/>}
      </div>
    </div>
    {open && <div className="px-3 pb-3">{children}</div>}
  </div>
);

export default function IndicatorsPanel({ symbol }) {
  const [data,     setData]     = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [showGuide,setShowGuide]= useState(false);
  const [openRSI,  setOpenRSI]  = useState(true);
  const [openMACD, setOpenMACD] = useState(true);
  const [openBB,   setOpenBB]   = useState(false);
  const [openStoch,setOpenStoch]= useState(false);

  useEffect(() => {
    if (!symbol) return;
    setLoading(true); setError(null);
    api.get(`/stocks/${symbol}/indicators?period=6mo`)
      .then(r  => setData(r.data))
      .catch(e => setError(e.response?.data?.error || "Failed"))
      .finally(() => setLoading(false));
  }, [symbol]);

  if (loading) return (
    <div className="rounded-2xl p-8 flex items-center justify-center gap-2"
      style={{ background:"var(--k-b50)", border:"1px solid var(--k-p15)" }}>
      <Loader2 size={17} style={{ color:"var(--k-p)", animation:"spin 1s linear infinite" }}/>
      <span className="text-sm" style={{ color:"var(--k-t40)" }}>Loading indicators…</span>
    </div>
  );
  if (error) return <div className="rounded-2xl p-5 text-sm" style={{ background:"var(--k-b50)", border:"1px solid var(--k-p15)", color:"rgba(248,113,113,0.7)" }}>{error}</div>;
  if (!data)  return null;

  const { latest, series, signal } = data;
  const root = typeof document !== "undefined" ? document.documentElement : null;
  const getVar = v => root ? getComputedStyle(root).getPropertyValue(v).trim() : "#888";
  const txt  = getVar("--k-t45") || "rgba(255,248,240,0.45)";
  const grid = getVar("--k-p05") || "rgba(192,133,82,0.05)";
  const ts   = series.timestamps.map(t => t * 1000);

  const baseChart = {
    chart:{ background:"transparent", toolbar:{ show:false }, animations:{ enabled:false } },
    theme:{ mode:"dark" },
    xaxis:{ type:"datetime", labels:{ show:false }, axisBorder:{ show:false }, axisTicks:{ show:false } },
    grid:{ borderColor:grid, strokeDashArray:4 },
    tooltip:{ theme:"dark", x:{ format:"dd MMM yyyy" } },
    legend:{ labels:{ colors:txt }, fontSize:"11px" },
    dataLabels:{ enabled:false }, stroke:{ width:2, curve:"smooth" },
  };

  const rsiOpts = { ...baseChart, colors:["#a78bfa"],
    yaxis:{ min:0, max:100, tickAmount:4, opposite:true, labels:{ style:{ colors:txt, fontSize:"10px" }, formatter:v=>v.toFixed(0) } },
    annotations:{ yaxis:[
      { y:70, borderColor:"rgba(248,113,113,0.4)", label:{ text:"70", style:{ color:"#f87171", fontSize:"10px", background:"transparent" } } },
      { y:30, borderColor:"rgba(74,222,128,0.4)",  label:{ text:"30", style:{ color:"#4ade80",  fontSize:"10px", background:"transparent" } } },
    ]},
  };

  const macdOpts = { ...baseChart, colors:["#4ade80","#fb923c"],
    yaxis:{ opposite:true, labels:{ style:{ colors:txt, fontSize:"10px" }, formatter:v=>v?.toFixed(3) } },
    plotOptions:{ bar:{ borderRadius:2 } },
  };

  const bbOpts = { ...baseChart, colors:["var(--k-t50)","var(--k-p70)","var(--k-p70)"],
    yaxis:{ opposite:true, labels:{ style:{ colors:txt, fontSize:"10px" }, formatter:v=>v?.toFixed(0) } },
    stroke:{ width:[2,1.5,1.5] },
  };

  const stochOpts = { ...baseChart, colors:["#fb923c","#60a5fa"],
    yaxis:{ min:0, max:100, tickAmount:4, opposite:true, labels:{ style:{ colors:txt, fontSize:"10px" }, formatter:v=>v.toFixed(0) } },
    annotations:{ yaxis:[
      { y:80, borderColor:"rgba(248,113,113,0.4)", label:{ text:"80", style:{ color:"#f87171", fontSize:"10px", background:"transparent" } } },
      { y:20, borderColor:"rgba(74,222,128,0.4)",  label:{ text:"20", style:{ color:"#4ade80",  fontSize:"10px", background:"transparent" } } },
    ]},
  };

  const rsiColor  = latest.rsi < 30 ? "#4ade80" : latest.rsi > 70 ? "#f87171" : "#fbbf24";
  const macdColor = (latest.macd||0) >= (latest.macdSignal||0) ? "#4ade80" : "#f87171";

  const explainerBase = { symbol, latest, price: latest.ema20 }; // price approximated

  return (
    <div className="space-y-3">
      {/* Summary panel */}
      <div className="rounded-2xl p-4" style={{ background:"var(--k-b60)", border:"1px solid var(--k-p20)" }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-black" style={{ color:"var(--k-tx)" }}>Technical Signal</p>
            <p className="text-xs mt-0.5" style={{ color:"var(--k-t35)" }}>Combined indicator consensus</p>
          </div>
          <div className="flex items-center gap-2">
            <SignalBadge signal={signal}/>
            <button onClick={() => setShowGuide(p => !p)}
              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-xl transition-all"
              style={{ background:"var(--k-p08)", color:"var(--k-p)", border:"1px solid var(--k-p20)" }}>
              <BookOpen size={10}/>{showGuide ? "Hide" : "Learn"}
            </button>
          </div>
        </div>

        {showGuide && (
          <div className="mb-4 p-3 rounded-xl animate-fade-in space-y-2"
            style={{ background:"var(--k-p05)", border:"1px solid var(--k-p12)" }}>
            <p className="text-xs font-black" style={{ color:"var(--k-p)" }}>📚 Indicator Quick Reference</p>
            {Object.entries(GUIDE).map(([id, g]) => (
              <div key={id} className="flex items-start gap-2">
                <span className="text-sm shrink-0">{g.emoji}</span>
                <div><span className="text-xs font-bold" style={{ color:"var(--k-t70)" }}>{id}:</span>
                <span className="text-xs ml-1" style={{ color:"var(--k-t45)" }}>{g.simple}</span></div>
              </div>
            ))}
            <p className="text-[10px] pt-2" style={{ color:"var(--k-p50)", borderTop:"1px solid var(--k-p10)" }}>
              Click <HelpCircle size={9} style={{ display:"inline" }}/> next to any chart · Click ✨ AI for live contextual analysis
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-x-5 gap-y-1.5">
          {[
            ["RSI (14)",     latest.rsi?.toFixed(2),         rsiColor],
            ["MACD",         latest.macd?.toFixed(4),        macdColor],
            ["MACD Signal",  latest.macdSignal?.toFixed(4),  macdColor],
            ["EMA 20",       latest.ema20?.toFixed(2),       "var(--k-p)"],
            ["EMA 50",       latest.ema50?.toFixed(2),       "var(--k-s)"],
            ["BB Upper",     latest.bbUpper?.toFixed(2),     "var(--k-t60)"],
            ["BB Lower",     latest.bbLower?.toFixed(2),     "var(--k-t60)"],
            ["Stoch %K",     latest.stochK?.toFixed(2),      "#fb923c"],
            ["ATR (14)",     latest.atr?.toFixed(2),         "#fbbf24"],
            ["VWAP",         latest.vwap?.toFixed(2),        "#22d3ee"],
          ].map(([l,v,c]) => v && (
            <div key={l} className="flex justify-between py-1.5" style={{ borderBottom:"1px solid var(--k-p06)" }}>
              <span className="text-xs" style={{ color:"var(--k-t40)" }}>{l}</span>
              <span className="text-xs font-mono font-bold" style={{ color:c }}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* RSI */}
      <Collapsible title="RSI (14)" guideId="RSI"
        value={latest.rsi?.toFixed(2)} valueColor={rsiColor}
        open={openRSI} setOpen={setOpenRSI}
        explainerProps={{ ...explainerBase, indicatorId:"RSI", indicatorLabel:"RSI (14)" }}>
        <ReactApexChart options={rsiOpts} series={[{ name:"RSI", data:ts.map((t,i)=>[t,series.rsi[i]]) }]} type="line" height={120}/>
        {/* RSI progress bar */}
        <div className="flex items-center gap-2 mt-1 px-1">
          <div className="flex-1 h-1.5 rounded-full overflow-hidden relative" style={{ background:"linear-gradient(90deg,#4ade80,#fbbf24,#f87171)" }}>
            <div className="absolute top-0 bottom-0 w-0.5 transition-all duration-700" style={{ left:`${Math.min(100,Math.max(0,latest.rsi??50))}%`, transform:"translateX(-50%)", background:"#fff", boxShadow:"0 0 4px rgba(255,255,255,0.5)" }}/>
          </div>
          <span className="text-xs font-bold" style={{ color:rsiColor }}>{latest.rsi?.toFixed(1)}</span>
        </div>
        <div className="flex justify-between px-1 mt-0.5">
          <span className="text-[10px]" style={{ color:"rgba(74,222,128,0.6)" }}>Oversold 30</span>
          <span className="text-[10px]" style={{ color:"rgba(248,113,113,0.6)" }}>70 Overbought</span>
        </div>
      </Collapsible>

      {/* MACD */}
      <Collapsible title="MACD (12, 26, 9)" guideId="MACD"
        value={latest.macd?.toFixed(4)} valueColor={macdColor}
        open={openMACD} setOpen={setOpenMACD}
        explainerProps={{ ...explainerBase, indicatorId:"MACD", indicatorLabel:"MACD" }}>
        <ReactApexChart options={macdOpts}
          series={[
            { name:"MACD",      type:"line", data:ts.map((t,i)=>[t,series.macd[i]]) },
            { name:"Signal",    type:"line", data:ts.map((t,i)=>[t,series.macdSignal[i]]) },
            { name:"Histogram", type:"bar",  data:ts.map((t,i)=>({ x:t, y:series.macdHistogram[i], fillColor:(series.macdHistogram[i]||0)>=0?"rgba(74,222,128,0.6)":"rgba(248,113,113,0.6)" })) },
          ]}
          type="line" height={140}/>
        <p className="text-xs mt-1 px-1" style={{ color:"var(--k-t45)" }}>
          MACD is <span className="font-bold" style={{ color:macdColor }}>{(latest.macd||0)>=(latest.macdSignal||0)?"above signal line (bullish)":"below signal line (bearish)"}</span>
        </p>
      </Collapsible>

      {/* Bollinger Bands */}
      <Collapsible title="Bollinger Bands (20, 2)" guideId="BB"
        value={latest.bbMid?.toFixed(2)} valueColor="var(--k-t70)"
        open={openBB} setOpen={setOpenBB}
        explainerProps={{ ...explainerBase, indicatorId:"BB", indicatorLabel:"Bollinger Bands" }}>
        <ReactApexChart options={bbOpts}
          series={[
            { name:"Price",  data:ts.map((t,i)=>[t,series.close[i]]) },
            { name:"Upper",  data:ts.map((t,i)=>[t,series.bbUpper[i]]) },
            { name:"Lower",  data:ts.map((t,i)=>[t,series.bbLower[i]]) },
          ]}
          type="line" height={130}/>
        <div className="grid grid-cols-3 gap-2 mt-2">
          {[["Upper",latest.bbUpper,"var(--k-p70)"],["Mid",latest.bbMid,"var(--k-t50)"],["Lower",latest.bbLower,"var(--k-p50)"]].map(([l,v,c])=>(
            <div key={l} className="text-center py-1.5 rounded-xl" style={{ background:"var(--k-p05)", border:"1px solid var(--k-p10)" }}>
              <p className="text-[10px]" style={{ color:"var(--k-t35)" }}>{l}</p>
              <p className="text-xs font-mono font-bold" style={{ color:c }}>{v?.toFixed(2)}</p>
            </div>
          ))}
        </div>
      </Collapsible>

      {/* Stochastic */}
      <Collapsible title="Stochastic (14, 3)" guideId="STOCH"
        value={`K: ${latest.stochK?.toFixed(1)}`}
        valueColor={latest.stochK < 20 ? "#4ade80" : latest.stochK > 80 ? "#f87171" : "#fbbf24"}
        open={openStoch} setOpen={setOpenStoch}
        explainerProps={{ ...explainerBase, indicatorId:"STOCH", indicatorLabel:"Stochastic" }}>
        <ReactApexChart options={stochOpts}
          series={[
            { name:"%K", data:ts.map((t,i)=>[t,series.stochK[i]]) },
            { name:"%D", data:ts.map((t,i)=>[t,series.stochD[i]]) },
          ]}
          type="line" height={120}/>
      </Collapsible>
    </div>
  );
}
