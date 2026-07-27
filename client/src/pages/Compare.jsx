import React, { useState } from "react";
import { GitCompare, Plus, X, Loader2, TrendingUp, TrendingDown } from "lucide-react";
import ReactApexChart from "react-apexcharts";
import api from "../services/api";
import toast from "react-hot-toast";

const SERIES_COLORS = ["#C08552","#60a5fa","#f97316","#a78bfa","#f43f5e"];
const PERIODS = ["1mo","3mo","6mo","1y","2y"];

export default function Compare() {
  const [symbols, setSymbols] = useState([]);
  const [input,   setInput]   = useState("");
  const [period,  setPeriod]  = useState("3mo");
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const add = () => {
    const s = input.trim().toUpperCase();
    if (!s) return;
    if (symbols.includes(s)) return toast.error(`${s} already added`);
    if (symbols.length >= 5) return toast.error("Maximum 5 stocks");
    setSymbols(p => [...p, s]); setInput("");
  };

  const compare = async () => {
    if (symbols.length < 2) return toast.error("Add at least 2 symbols");
    setLoading(true); setError(null); setData(null);
    try {
      const { data: res } = await api.get(`/stocks/compare?symbols=${symbols.join(",")}&period=${period}`);
      setData(res);
    } catch (e) { setError(e.response?.data?.error || "Failed"); toast.error("Comparison failed"); }
    finally { setLoading(false); }
  };

  const root    = typeof document !== "undefined" ? document.documentElement : null;
  const getVar  = v => root ? getComputedStyle(root).getPropertyValue(v).trim() : "";
  const txt     = getVar("--k-t45") || "rgba(255,248,240,0.45)";
  const grid    = getVar("--k-p06") || "rgba(192,133,82,0.06)";
  const neutral = getVar("--k-p18") || "rgba(192,133,82,0.18)";

  const chartOptions = data ? {
    chart:{ type:"line", background:"transparent", toolbar:{ show:true }, animations:{ enabled:false }, fontFamily:"Inter,sans-serif" },
    theme:{ mode:"dark" },
    xaxis:{ type:"datetime", labels:{ style:{ colors:txt, fontSize:"11px" }, datetimeUTC:false }, axisBorder:{ show:false }, axisTicks:{ show:false } },
    yaxis:{ opposite:true, title:{ text:"% Return (Base=100)", style:{ color:txt, fontSize:"11px" } }, labels:{ style:{ colors:txt, fontSize:"11px" }, formatter:v=>`${v?.toFixed(1)}` } },
    grid:{ borderColor:grid, strokeDashArray:3 },
    tooltip:{ theme:"dark", x:{ format:"dd MMM yyyy" }, y:{ formatter:v=>`${v?.toFixed(2)}` } },
    stroke:{ width:2, curve:"smooth" },
    legend:{ labels:{ colors:txt }, fontSize:"12px" },
    colors: SERIES_COLORS,
    annotations:{ yaxis:[{ y:100, borderColor:neutral, strokeDashArray:5 }] },
  } : {};

  const series = data
    ? data.symbols.map(sym => ({ name:sym, data:data.timestamps.map((t,i)=>[t*1000, data.series[sym][i]]) }))
    : [];

  const lastValues = data
    ? data.symbols.reduce((acc,sym) => { const arr=data.series[sym]; acc[sym]=arr[arr.length-1]; return acc; }, {})
    : {};

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-black flex items-center gap-2" style={{ color:"var(--k-tx)" }}>
          <GitCompare size={20} style={{ color:"var(--k-p)" }}/>Compare Stocks
        </h1>
        <p className="text-sm mt-0.5" style={{ color:"var(--k-t50)" }}>Normalised performance — up to 5 stocks</p>
      </div>

      {/* Input area */}
      <div className="glass p-5">
        <div className="flex gap-2 mb-4">
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&add()}
            placeholder="Symbol — TCS.NS, INFY.NS, AAPL…" className="input flex-1"/>
          <button onClick={add} disabled={!input.trim()} className="btn-primary shrink-0"><Plus size={15}/>Add</button>
        </div>

        <div className="flex flex-wrap gap-2 mb-4 min-h-[32px]">
          {symbols.map((s,i) => (
            <span key={s} className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-mono font-bold"
              style={{ background:`${SERIES_COLORS[i]}18`, color:SERIES_COLORS[i], border:`1px solid ${SERIES_COLORS[i]}35` }}>
              {s}
              <button onClick={()=>setSymbols(p=>p.filter(x=>x!==s))} className="hover:opacity-70"><X size={11}/></button>
            </span>
          ))}
          {symbols.length===0 && <p className="text-xs" style={{ color:"var(--k-t40)" }}>No symbols added yet</p>}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex gap-1 p-1 rounded-2xl" style={{ background:"var(--k-b50)", border:"1px solid var(--k-glass-border)" }}>
            {PERIODS.map(p => (
              <button key={p} onClick={()=>setPeriod(p)}
                className="px-3 py-1 rounded-xl text-xs font-bold transition-all"
                style={period===p
                  ? { background:"linear-gradient(135deg,var(--k-p25),var(--k-s15))", color:"var(--k-tx)", border:"1px solid var(--k-p30)" }
                  : { color:"var(--k-t40)", border:"1px solid transparent" }}>
                {p}
              </button>
            ))}
          </div>
          <button onClick={compare} disabled={loading||symbols.length<2} className="btn-primary ml-auto text-sm">
            {loading ? <Loader2 size={14} style={{ animation:"spin 1s linear infinite" }}/> : <TrendingUp size={14}/>}
            {loading ? "Fetching…" : "Compare"}
          </button>
        </div>
      </div>

      {loading && (
        <div className="glass p-12 flex items-center justify-center gap-2" style={{ color:"var(--k-t40)" }}>
          <Loader2 size={22} style={{ animation:"spin 1s linear infinite", color:"var(--k-p)" }}/><span className="text-sm">Fetching data…</span>
        </div>
      )}

      {error && !loading && (
        <div className="glass p-6 text-center text-sm" style={{ color:"#f87171" }}>{error}</div>
      )}

      {data && !loading && (
        <>
          {/* Return summary pills */}
          <div className="grid gap-3" style={{ gridTemplateColumns:`repeat(${data.symbols.length},1fr)` }}>
            {data.symbols.map((sym,i) => {
              const ret = lastValues[sym]!=null ? lastValues[sym]-100 : null;
              const m   = data.meta?.[sym]||{};
              return (
                <div key={sym} className="glass p-4" style={{ borderColor:`${SERIES_COLORS[i]}30` }}>
                  <p className="font-mono text-sm font-bold mb-1" style={{ color:SERIES_COLORS[i] }}>{sym}</p>
                  {m.name && <p className="text-xs truncate mb-2" style={{ color:"var(--k-t45)" }}>{m.name}</p>}
                  {ret!=null ? (
                    <p className="text-xl font-black font-mono flex items-center gap-1" style={{ color:ret>=0?"#4ade80":"#f87171" }}>
                      {ret>=0?<TrendingUp size={16}/>:<TrendingDown size={16}/>}
                      {ret>=0?"+":""}{ret.toFixed(2)}%
                    </p>
                  ) : <p className="text-sm" style={{ color:"var(--k-t40)" }}>N/A</p>}
                  <p className="text-xs mt-0.5" style={{ color:"var(--k-t35)" }}>over {period}</p>
                </div>
              );
            })}
          </div>

          {/* Chart */}
          <div className="glass p-5">
            <p className="font-bold text-sm mb-4" style={{ color:"var(--k-tx)" }}>
              Normalised Performance <span className="font-normal text-xs" style={{ color:"var(--k-t45)" }}>(all start at 100)</span>
            </p>
            <ReactApexChart options={chartOptions} series={series} type="line" height={380}/>
          </div>
        </>
      )}

      {!data && !loading && symbols.length < 2 && (
        <div className="glass p-12 text-center">
          <GitCompare size={32} className="mx-auto mb-3" style={{ color:"var(--k-t30)" }}/>
          <p className="font-bold" style={{ color:"var(--k-tx)" }}>Add at least 2 stocks to compare</p>
          <p className="text-sm mt-1" style={{ color:"var(--k-t50)" }}>
            Use NSE format: <span className="font-mono" style={{ color:"var(--k-p)" }}>TCS.NS</span>, <span className="font-mono" style={{ color:"var(--k-p)" }}>RELIANCE.NS</span>
          </p>
        </div>
      )}
    </div>
  );
}
