import React, { useState } from "react";
import ReactApexChart from "react-apexcharts";
import { Loader2, AlertCircle, TrendingUp, TrendingDown, Zap, Activity, BarChart2, Target, Info } from "lucide-react";
import api from "../services/api";
import { useTheme } from "../context/ThemeContext";

const DAY_OPTS = [
  { d:7,  label:"7d",  desc:"1 Week"   },
  { d:14, label:"14d", desc:"2 Weeks"  },
  { d:30, label:"30d", desc:"1 Month"  },
  { d:60, label:"60d", desc:"2 Months" },
  { d:90, label:"90d", desc:"3 Months" },
];

const SIGNAL_COLOR = s =>
  s==="BULLISH"||s==="OVERSOLD" ? "#4ade80"
  : s==="BEARISH"||s==="OVERBOUGHT" ? "#f87171"
  : "#fbbf24";

const WEIGHT_W = w => w==="High" ? 3 : w==="Medium" ? 2 : 1;

const FactorRow = ({ f }) => {
  const [expanded, setExpanded] = useState(false);
  const sc = SIGNAL_COLOR(f.signal);
  const bars = WEIGHT_W(f.weight);
  return (
    <div className="rounded-2xl overflow-hidden transition-all duration-200"
      style={{ background:"var(--k-b50)", border:"1px solid var(--k-p12)" }}>
      <button onClick={() => setExpanded(p=>!p)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-sm font-semibold truncate" style={{ color:"var(--k-tx)" }}>{f.name}</p>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0"
              style={{ background:`${sc}15`, color:sc, border:`1px solid ${sc}25` }}>
              {f.signal}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex gap-0.5">
              {[1,2,3].map(b => (
                <div key={b} className="w-3 h-1.5 rounded-full"
                  style={{ background: b<=bars ? "var(--k-p70)" : "var(--k-p10)" }}/>
              ))}
            </div>
            <span className="text-xs" style={{ color:"var(--k-t40)" }}>{f.weight} weight</span>
            {f.value != null && (
              <span className="text-xs font-mono" style={{ color:"var(--k-t60)" }}>{f.value}</span>
            )}
          </div>
        </div>
        <Info size={14} style={{ color: expanded ? "var(--k-p)" : "var(--k-t25)", shrink:0, transition:"color .2s" }}/>
      </button>
      {expanded && (
        <div className="px-4 pb-3 pt-0">
          <p className="text-xs leading-relaxed" style={{ color:"var(--k-t55)", borderTop:"1px solid var(--k-p08)", paddingTop:"10px" }}>
            {f.detail}
          </p>
        </div>
      )}
    </div>
  );
};

export default function PredictionChart({ symbol, currency = "INR" }) {
  const { isDark } = useTheme();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [days,    setDays]    = useState(30);
  const [model,   setModel]   = useState("builtin"); // builtin | prophet

  const curr = currency==="INR" ? "₹" : "$";

  const run = async () => {
    setLoading(true); setError(null); setData(null);
    try {
      const endpoint = model==="prophet"
        ? `/stocks/${symbol}/predict?days=${days}`
        : `/stocks/${symbol}/predict-builtin?days=${days}`;
      const { data: res } = await api.get(endpoint);
      setData(res);
    } catch (e) {
      setError(e.response?.data?.error || "Prediction failed");
    } finally {
      setLoading(false);
    }
  };

  const chartOpts = data ? {
    chart: {
      type:"rangeArea", background:"transparent", toolbar:{ show:false },
      animations:{ enabled:true, speed:900 }, fontFamily:"Inter,sans-serif",
    },
    theme: { mode:"dark" },
    xaxis: {
      type:"datetime",
      labels:{ style:{ colors:"var(--k-t45)", fontSize:"11px" }, datetimeUTC:false, format:"dd MMM" },
      axisBorder:{ show:false }, axisTicks:{ show:false },
    },
    yaxis: {
      opposite:true,
      labels:{
        style:{ colors:"var(--k-t45)", fontSize:"11px" },
        formatter: v => `${curr}${v?.toLocaleString("en-IN",{maximumFractionDigits:0})}`,
      },
    },
    grid: { borderColor:"var(--k-p07)", strokeDashArray:4 },
    tooltip:{
      theme:"dark", x:{ format:"dd MMM yyyy" },
      y:{ formatter: v => `${curr}${v?.toLocaleString("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2})}` },
    },
    colors: ["var(--k-t60)", "var(--k-p)", "var(--k-p12)"],
    stroke:{ width:[1.5,2.5,0], curve:"smooth", dashArray:[6,0,0] },
    fill:{
      type:["solid","solid","gradient"], opacity:[1,1,1],
      gradient:{
        type:"vertical",
        colorStops:[[
          { offset:0,  color:"var(--k-p)", opacity:0.25 },
          { offset:100,color:"var(--k-p)", opacity:0.02 },
        ]],
      },
    },
    legend:{ labels:{ colors:"var(--k-t50)" }, fontSize:"12px" },
    annotations:{
      xaxis:[{
        x: data.historical[data.historical.length-1]?.time*1000,
        borderColor:"var(--k-p40)", strokeDashArray:6,
        label:{ text:"Today", style:{ color:"var(--k-p)", fontSize:"11px", background:"transparent" } },
      }],
    },
  } : {};

  const series = data ? [
    { name:"Actual",      type:"line",      data: data.historical.map(d=>[d.time*1000,d.yhat]) },
    { name:"AI Forecast", type:"line",      data: data.forecast.map(d=>[d.time*1000,d.yhat]) },
    { name:"80% Band",    type:"rangeArea", data: data.forecast.map(d=>({ x:d.time*1000, y:[d.yhat_lower,d.yhat_upper] })) },
  ] : [];

  const composite = data?.composite ?? 0;
  const compositeColor = composite>0.2?"#4ade80":composite<-0.2?"#f87171":"#fbbf24";

  return (
    <div className="prediction-wrap p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
              style={{ background:"var(--k-p15)", border:"1px solid var(--k-p30)" }}>
              <Activity size={16} style={{ color:"var(--k-p)" }}/>
            </div>
            <h3 className="font-black text-base" style={{ color:"var(--k-tx)" }}>AI Price Prediction</h3>
          </div>
          <p className="text-xs ml-10" style={{ color:"var(--k-t40)" }}>
            Multi-factor technical analysis · No external dependencies
          </p>
        </div>
        {/* Model toggle */}
        <div className="flex rounded-xl overflow-hidden shrink-0"
          style={{ border:"1px solid var(--k-p20)", background:"var(--k-b50)" }}>
          {[["builtin","Built-in"],["prophet","Prophet"]].map(([m,l])=>(
            <button key={m} onClick={()=>setModel(m)}
              className="px-3 py-1.5 text-xs font-bold transition-all"
              style={{
                background: model===m ? "linear-gradient(135deg,var(--k-p30),var(--k-s20))" : "transparent",
                color: model===m ? "var(--k-tx)" : "var(--k-t35)",
                borderRight: m==="builtin" ? "1px solid var(--k-p15)" : "none",
              }}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Horizon selector */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-2.5" style={{ color:"var(--k-p60)" }}>
          Forecast Horizon
        </p>
        <div className="flex gap-2">
          {DAY_OPTS.map(o => (
            <button key={o.d} onClick={() => setDays(o.d)}
              className="flex-1 py-2.5 rounded-2xl text-center transition-all duration-200 border"
              style={days===o.d ? {
                background:"linear-gradient(135deg,var(--k-p25),var(--k-s15))",
                borderColor:"var(--k-p40)",
                boxShadow:"0 0 16px var(--k-p20)",
              } : {
                background:"var(--k-b40)",
                borderColor:"var(--k-p10)",
              }}>
              <p className="text-base font-black" style={{ color: days===o.d ? "var(--k-p)" : "var(--k-t50)" }}>{o.label}</p>
              <p className="text-[10px] font-medium" style={{ color:"var(--k-t30)" }}>{o.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Run */}
      <button onClick={run} disabled={loading}
        className="btn-primary w-full justify-center py-3.5 text-sm">
        {loading
          ? <><Loader2 size={16} style={{ animation:"spin 1s linear infinite" }}/>Analyzing {days} factors…</>
          : <><Zap size={16}/>Run {days}-Day Prediction</>}
      </button>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-10 gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full animate-spin-slow"
              style={{ border:"2px solid transparent", borderTopColor:"var(--k-p60)", borderRightColor:"var(--k-p20)" }}/>
            <div className="absolute inset-2 rounded-full flex items-center justify-center"
              style={{ background:"var(--k-p08)" }}>
              <Activity size={22} style={{ color:"var(--k-p)" }}/>
            </div>
          </div>
          <div className="text-center">
            <p className="font-semibold text-sm" style={{ color:"var(--k-tx)" }}>Computing multi-factor signals…</p>
            <p className="text-xs mt-1" style={{ color:"var(--k-t40)" }}>Regression · Momentum · RSI · MACD · Volume · MA crossover</p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="p-4 rounded-2xl flex items-start gap-3"
          style={{ background:"rgba(248,113,113,0.07)", border:"1px solid rgba(248,113,113,0.2)" }}>
          <AlertCircle size={18} style={{ color:"#f87171", flexShrink:0 }}/>
          <div>
            <p className="font-semibold text-sm" style={{ color:"#f87171" }}>Prediction error</p>
            <p className="text-xs mt-1" style={{ color:"rgba(248,113,113,0.7)" }}>{error}</p>
            {model==="prophet" && (
              <code className="block mt-2 text-xs px-3 py-1.5 rounded-lg font-mono"
                style={{ background:"rgba(0,0,0,0.4)", color:"#4ade80" }}>pip install prophet</code>
            )}
          </div>
        </div>
      )}

      {/* Initial placeholder */}
      {!data && !loading && !error && (
        <div className="flex flex-col items-center justify-center py-10 gap-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center animate-float"
            style={{ background:"var(--k-p08)", border:"1px solid var(--k-p20)" }}>
            <BarChart2 size={30} style={{ color:"var(--k-p50)" }}/>
          </div>
          <div className="text-center">
            <p className="font-semibold" style={{ color:"var(--k-t70)" }}>Ready to analyze</p>
            <p className="text-sm mt-1" style={{ color:"var(--k-t35)" }}>
              Select a horizon and click Run Prediction
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 w-full max-w-xs">
            {[["6 Factors","Combined model"],["No Install","Works out of box"],["Live Data","Via yfinance"]].map(([t,s])=>(
              <div key={t} className="text-center p-2.5 rounded-xl"
                style={{ background:"var(--k-p06)", border:"1px solid var(--k-p12)" }}>
                <p className="text-xs font-bold" style={{ color:"var(--k-p)" }}>{t}</p>
                <p className="text-[10px] mt-0.5" style={{ color:"var(--k-t40)" }}>{s}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {data && !loading && (
        <div className="space-y-5 animate-fade-in">
          {/* Composite score bar */}
          <div className="rounded-2xl p-4"
            style={{ background:"var(--k-b50)", border:"1px solid var(--k-p15)" }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold" style={{ color:"var(--k-t50)" }}>Composite Signal Score</span>
              <span className="text-sm font-black font-mono" style={{ color:compositeColor }}>
                {composite>=0?"+":""}{(composite*100).toFixed(1)}
              </span>
            </div>
            <div className="relative h-2 rounded-full overflow-hidden" style={{ background:"var(--k-p10)" }}>
              <div className="absolute top-0 bottom-0 w-0.5" style={{ left:"50%", background:"var(--k-t20)" }}/>
              <div className="h-full rounded-full transition-all duration-1000"
                style={{
                  width:`${Math.abs(composite)*50}%`,
                  marginLeft: composite>=0 ? "50%" : `${50+composite*50}%`,
                  background:`linear-gradient(90deg, ${compositeColor}80, ${compositeColor})`,
                }}/>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px]" style={{ color:"rgba(248,113,113,0.5)" }}>Strong Sell</span>
              <span className="text-[10px]" style={{ color:"rgba(251,191,36,0.5)" }}>Neutral</span>
              <span className="text-[10px]" style={{ color:"rgba(74,222,128,0.5)" }}>Strong Buy</span>
            </div>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { l:"Current",   v:`${curr}${data.currentPrice?.toLocaleString("en-IN",{maximumFractionDigits:2})}`, c:"var(--k-t80)", icon:<Activity size={14}/> },
              { l:`${days}d Target`, v:`${curr}${data.targetPrice?.toLocaleString("en-IN",{maximumFractionDigits:2})}`, c:data.changePercent>=0?"#4ade80":"#f87171", sub:`${data.changePercent>=0?"+":""}${data.changePercent?.toFixed(2)}%`, icon:<Target size={14}/> },
              { l:"Direction", v:data.direction, c:data.direction==="UP"?"#4ade80":"#f87171", icon: data.direction==="UP"?<TrendingUp size={14}/>:<TrendingDown size={14}/> },
              { l:"Confidence",v:`${data.confidence}%`, c:"var(--k-p)", icon:<Zap size={14}/> },
            ].map(s=>(
              <div key={s.l} className="stat-pill p-3.5">
                <div className="flex items-center gap-1.5 mb-1" style={{ color:"var(--k-t40)" }}>
                  {s.icon}<span className="text-xs font-medium">{s.l}</span>
                </div>
                <p className="text-lg font-black font-mono" style={{ color:s.c }}>{s.v}</p>
                {s.sub && <p className="text-xs font-medium mt-0.5" style={{ color:s.c+"aa" }}>{s.sub}</p>}
              </div>
            ))}
          </div>

          {/* Direction banner */}
          <div className="rounded-2xl p-4 flex items-center gap-4"
            style={{
              background: data.direction==="UP"
                ? "linear-gradient(135deg,rgba(74,222,128,0.08),rgba(34,197,94,0.04))"
                : "linear-gradient(135deg,rgba(248,113,113,0.08),rgba(239,68,68,0.04))",
              border: `1px solid ${data.direction==="UP" ? "rgba(74,222,128,0.2)" : "rgba(248,113,113,0.2)"}`,
            }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: data.direction==="UP"?"rgba(74,222,128,0.12)":"rgba(248,113,113,0.12)", border:`1px solid ${data.direction==="UP"?"rgba(74,222,128,0.25)":"rgba(248,113,113,0.25)"}` }}>
              {data.direction==="UP" ? <TrendingUp size={24} style={{ color:"#4ade80" }}/> : <TrendingDown size={24} style={{ color:"#f87171" }}/>}
            </div>
            <div className="flex-1">
              <p className="font-bold" style={{ color:"var(--k-tx)" }}>
                Model signals{" "}
                <span style={{ color: data.direction==="UP"?"#4ade80":"#f87171" }}>
                  {data.direction==="UP" ? "upward momentum" : "downward pressure"}
                </span>
              </p>
              <p className="text-sm mt-0.5" style={{ color:"var(--k-t45)" }}>
                Expected {data.direction==="UP"?"gain":"loss"} of{" "}
                <span className="font-bold" style={{ color: data.direction==="UP"?"#4ade80":"#f87171" }}>
                  {curr}{Math.abs(data.targetPrice-data.currentPrice).toLocaleString("en-IN",{maximumFractionDigits:2})} ({Math.abs(data.changePercent).toFixed(2)}%)
                </span>{" "}over {days} days
              </p>
              <p className="text-xs mt-1" style={{ color:"var(--k-t30)" }}>
                Daily drift: {data.dailyDrift>=0?"+":""}{data.dailyDrift?.toFixed(3)}%/day · Volatility: ±{data.volatility?.toFixed(2)}%/day
              </p>
            </div>
            {/* Confidence bar */}
            <div className="shrink-0 text-right">
              <p className="text-xs mb-1" style={{ color:"var(--k-t40)" }}>Confidence</p>
              <div className="w-20 h-1.5 rounded-full overflow-hidden mb-1" style={{ background:"var(--k-p10)" }}>
                <div className="h-full rounded-full" style={{ width:`${data.confidence}%`, background:"linear-gradient(90deg,var(--k-s),var(--k-p))" }}/>
              </div>
              <p className="text-sm font-black" style={{ color:"var(--k-p)" }}>{data.confidence}%</p>
            </div>
          </div>

          {/* Chart */}
          <div className="rounded-2xl overflow-hidden" style={{ background:"var(--k-b40)", border:"1px solid var(--k-p10)" }}>
            <div className="px-4 pt-3 flex items-center gap-4">
              {[["var(--k-t50)","Actual (dashed)"],["var(--k-p)","AI Forecast"],["var(--k-p20)","80% Band"]].map(([c,l])=>(
                <div key={l} className="flex items-center gap-1.5">
                  <div className="w-4 h-1 rounded" style={{ background:c }}/>
                  <span className="text-xs" style={{ color:"var(--k-t40)" }}>{l}</span>
                </div>
              ))}
            </div>
            <ReactApexChart options={chartOpts} series={series} type="rangeArea" height={300}/>
          </div>

          {/* Factor analysis */}
          {data.factors && (
            <div>
              <p className="section-label mb-3">Factor Analysis — Click to expand</p>
              <div className="space-y-2">
                {data.factors.map(f => <FactorRow key={f.name} f={f}/>)}
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <div className="flex items-start gap-2 p-3 rounded-xl"
            style={{ background:"var(--k-p05)", border:"1px solid var(--k-p12)" }}>
            <AlertCircle size={12} style={{ color:"var(--k-p60)", flexShrink:0, marginTop:2 }}/>
            <p className="text-xs leading-relaxed" style={{ color:"var(--k-t35)" }}>
              For informational use only. Not financial advice. Past patterns do not guarantee future performance.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
