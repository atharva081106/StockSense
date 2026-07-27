import React, { useState, useEffect } from "react";
import ReactApexChart from "react-apexcharts";
import { Loader2 } from "lucide-react";
import api from "../services/api";

const PERIODS = [
  { label:"1D", period:"1d",  interval:"5m"  },
  { label:"5D", period:"5d",  interval:"30m" },
  { label:"1M", period:"1mo", interval:"1d"  },
  { label:"3M", period:"3mo", interval:"1d"  },
  { label:"6M", period:"6mo", interval:"1d"  },
  { label:"1Y", period:"1y",  interval:"1d"  },
  { label:"5Y", period:"5y",  interval:"1wk" },
];

export default function StockChart({ symbol }) {
  const [data,   setData]   = useState(null);
  const [loading,setLoading]= useState(true);
  const [error,  setError]  = useState(null);
  const [sel,    setSel]    = useState(PERIODS[3]);
  const [type,   setType]   = useState("candlestick");

  useEffect(() => {
    if (!symbol) return;
    setLoading(true); setError(null);
    api.get(`/stocks/${symbol}/history?period=${sel.period}&interval=${sel.interval}`)
      .then(r=>setData(r.data.data))
      .catch(e=>setError(e.response?.data?.error||"Chart unavailable"))
      .finally(()=>setLoading(false));
  },[symbol,sel]);

  const root = typeof document !== "undefined" ? document.documentElement : null;
  const getVar = v => root ? getComputedStyle(root).getPropertyValue(v).trim() : "#888";
  const txtColor  = getVar("--k-t45") || "rgba(255,248,240,0.45)";
  const gridColor = getVar("--k-p05") || "rgba(192,133,82,0.05)";

  const opts = {
    chart:{ type:type==="candlestick"?"candlestick":type, background:"transparent", toolbar:{ show:true }, animations:{ enabled:false }, fontFamily:"Inter,sans-serif" },
    theme:{ mode:"dark" },
    xaxis:{ type:"datetime", labels:{ style:{ colors:txtColor, fontSize:"11px" }, datetimeUTC:false }, axisBorder:{ show:false }, axisTicks:{ show:false } },
    yaxis:{ opposite:true, labels:{ style:{ colors:txtColor, fontSize:"11px" }, formatter:v=>v>=1000?v.toLocaleString("en-IN",{maximumFractionDigits:0}):v?.toFixed(2) } },
    grid:{ borderColor:gridColor, strokeDashArray:4 },
    tooltip:{ theme:"dark", x:{ format:"dd MMM yyyy HH:mm" } },
    plotOptions:{ candlestick:{ colors:{ upward:"#4ade80", downward:"#f87171" }, wick:{ useFillColor:true } } },
    stroke:{ width:type!=="candlestick"?2:1, curve:"smooth" },
    fill:{ type:type==="area"?"gradient":"solid", gradient:{ type:"vertical",opacityFrom:0.3,opacityTo:0.02 } },
    colors:["var(--k-p)"],
  };

  const series = data ? (
    type==="candlestick"
      ? [{ data:data.map(d=>({ x:d.time*1000, y:[d.open,d.high,d.low,d.close] })) }]
      : [{ name:symbol, data:data.map(d=>[d.time*1000,d.close]) }]
  ) : [];

  const volOpts = { ...opts, chart:{ ...opts.chart, type:"bar", height:70 },
    colors:["var(--k-p35)"],
    yaxis:{ opposite:true, labels:{ style:{ colors:txtColor, fontSize:"10px" }, formatter:v=>v>=1e6?`${(v/1e6).toFixed(1)}M`:v>=1e3?`${(v/1e3).toFixed(0)}K`:v } },
    tooltip:{ enabled:false }, dataLabels:{ enabled:false },
  };
  const volSeries = data ? [{ name:"Volume", data:data.map(d=>({ x:d.time*1000, y:d.volume })) }] : [];

  return (
    <div className="glass p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        {/* Period selector - pill style */}
        <div className="flex gap-1 p-1 rounded-2xl" style={{ background:"var(--k-b50)", border:"1px solid var(--k-p12)" }}>
          {PERIODS.map(p=>(
            <button key={p.label} onClick={()=>setSel(p)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
              style={sel.label===p.label ? {
                background:"linear-gradient(135deg,var(--k-p30),var(--k-s20))",
                color:"var(--k-tx)",
                border:"1px solid var(--k-p25)",
              } : { color:"var(--k-t35)", border:"1px solid transparent" }}>
              {p.label}
            </button>
          ))}
        </div>
        {/* Type selector */}
        <div className="flex gap-1 p-1 rounded-2xl" style={{ background:"var(--k-b50)", border:"1px solid var(--k-p12)" }}>
          {["candlestick","line","area"].map(t=>(
            <button key={t} onClick={()=>setType(t)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all"
              style={type===t ? {
                background:"var(--k-p20)",
                color:"var(--k-p)",
                border:"1px solid var(--k-p30)",
              } : { color:"var(--k-t35)", border:"1px solid transparent" }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-72 gap-2">
          <Loader2 size={20} style={{ color:"var(--k-p)", animation:"spin 1s linear infinite" }}/>
          <span className="text-sm" style={{ color:"var(--k-t40)" }}>Loading chart…</span>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-72 text-sm" style={{ color:"rgba(248,113,113,0.7)" }}>{error}</div>
      ) : (
        <>
          <ReactApexChart options={opts} series={series} type={type==="candlestick"?"candlestick":type} height={360}/>
          <ReactApexChart options={volOpts} series={volSeries} type="bar" height={70}/>
        </>
      )}
    </div>
  );
}
