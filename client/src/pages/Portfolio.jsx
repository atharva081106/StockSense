import React, { useState, useEffect } from "react";
import { Briefcase, Plus, Trash2, TrendingUp, Loader2, ChevronDown, ChevronUp, X } from "lucide-react";
import api from "../services/api";
import toast from "react-hot-toast";

function TradeModal({ onClose, onDone }) {
  const [f, setF] = useState({ symbol:"", name:"", type:"BUY", quantity:"", price:"",
    exchange:"", currency:"INR", date:new Date().toISOString().split("T")[0], notes:"" });
  const [loading, setLoading] = useState(false);

  const submit = async e => {
    e.preventDefault();
    if (!f.symbol||!f.name||!f.quantity||!f.price) return toast.error("Fill required fields");
    setLoading(true);
    try {
      await api.post("/portfolio/trade", { ...f, symbol:f.symbol.toUpperCase(), quantity:+f.quantity, price:+f.price });
      toast.success("Trade recorded!"); onDone(); onClose();
    } catch (err) { toast.error(err.response?.data?.error||"Failed"); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ background:"rgba(13,8,5,0.75)", backdropFilter:"blur(4px)" }}>
      <div className="glass w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom:"1px solid var(--k-glass-border)" }}>
          <h2 className="font-bold text-base" style={{ color:"var(--k-tx)" }}>Record Trade</h2>
          <button onClick={onClose} className="btn-ghost p-1"><X size={17}/></button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color:"var(--k-p60)" }}>Symbol *</label>
              <input value={f.symbol} onChange={e=>setF({...f,symbol:e.target.value.toUpperCase()})} placeholder="RELIANCE.NS" className="input"/>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color:"var(--k-p60)" }}>Company *</label>
              <input value={f.name} onChange={e=>setF({...f,name:e.target.value})} placeholder="Reliance Industries" className="input"/>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color:"var(--k-p60)" }}>Type</label>
              <select value={f.type} onChange={e=>setF({...f,type:e.target.value})} className="input">
                <option>BUY</option><option>SELL</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color:"var(--k-p60)" }}>Qty *</label>
              <input type="number" value={f.quantity} onChange={e=>setF({...f,quantity:e.target.value})} placeholder="10" min="0.0001" step="any" className="input"/>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color:"var(--k-p60)" }}>Price *</label>
              <input type="number" value={f.price} onChange={e=>setF({...f,price:e.target.value})} placeholder="2500" min="0" step="any" className="input"/>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color:"var(--k-p60)" }}>Currency</label>
              <select value={f.currency} onChange={e=>setF({...f,currency:e.target.value})} className="input">
                <option value="INR">INR ₹</option><option value="USD">USD $</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color:"var(--k-p60)" }}>Date</label>
              <input type="date" value={f.date} onChange={e=>setF({...f,date:e.target.value})} className="input"/>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color:"var(--k-p60)" }}>Notes</label>
            <input value={f.notes} onChange={e=>setF({...f,notes:e.target.value})} placeholder="Optional" className="input"/>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5">
            {loading&&<Loader2 size={14} style={{ animation:"spin 1s linear infinite" }}/>} {loading?"Recording…":"Record Trade"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function Portfolio() {
  const [holdings, setHoldings] = useState([]);
  const [prices,   setPrices]   = useState({});
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [removing, setRemoving] = useState(null);

  const load = async () => {
    try { const { data } = await api.get("/portfolio"); setHoldings(data.holdings||[]); }
    catch { toast.error("Failed to load portfolio"); }
    finally { setLoading(false); }
  };

  const fetchPrices = async (list) => {
    const res = {};
    await Promise.allSettled(list.map(async h => {
      try { const { data } = await api.get(`/stocks/${h.symbol}/live`); res[h.symbol]=data; } catch {}
    }));
    setPrices(res);
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { if (holdings.length) fetchPrices(holdings); }, [holdings]);

  const remove = async sym => {
    if (!window.confirm(`Remove all ${sym} trades?`)) return;
    setRemoving(sym);
    try { await api.delete(`/portfolio/${sym}`); setHoldings(p=>p.filter(h=>h.symbol!==sym)); toast.success(`${sym} removed`); }
    catch { toast.error("Failed"); }
    finally { setRemoving(null); }
  };

  let invested=0, current=0;
  holdings.forEach(h => {
    const p = prices[h.symbol]?.price || h.avgBuyPrice;
    invested += h.totalInvested;
    current  += h.totalQuantity * p;
  });
  const pnl    = current - invested;
  const pnlPct = invested > 0 ? (pnl/invested)*100 : 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black flex items-center gap-2" style={{ color:"var(--k-tx)" }}>
            <Briefcase size={20} style={{ color:"var(--k-p)" }}/>Portfolio
          </h1>
          <p className="text-xs mt-0.5" style={{ color:"var(--k-t50)" }}>{holdings.length} holding{holdings.length!==1?"s":""}</p>
        </div>
        <button onClick={()=>setModal(true)} className="btn-primary text-sm"><Plus size={14}/>Add Trade</button>
      </div>

      {!loading && holdings.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label:"Invested",      val:`₹${invested.toLocaleString("en-IN",{maximumFractionDigits:0})}`, cls:"" },
            { label:"Current Value", val:`₹${current.toLocaleString("en-IN",{maximumFractionDigits:0})}`, cls:"" },
            { label:"Total P&L",     val:`${pnl>=0?"+":""}₹${Math.abs(pnl).toLocaleString("en-IN",{maximumFractionDigits:0})}`, cls:pnl>=0?"text-gain":"text-loss" },
            { label:"Returns",       val:`${pnlPct>=0?"+":""}${pnlPct.toFixed(2)}%`, cls:pnlPct>=0?"text-gain":"text-loss" },
          ].map(s=>(
            <div key={s.label} className="glass p-4">
              <p className="text-xs mb-1" style={{ color:"var(--k-t50)" }}>{s.label}</p>
              <p className={`text-lg font-black font-mono mt-1 ${s.cls||""}`} style={!s.cls?{color:"var(--k-tx)"}:{}}>{s.val}</p>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div className="glass p-6 space-y-3">{[...Array(3)].map((_,i)=><div key={i} className="skeleton h-16 rounded-2xl"/>)}</div>
      ) : holdings.length === 0 ? (
        <div className="glass p-12 text-center">
          <Briefcase size={32} className="mx-auto mb-3" style={{ color:"var(--k-t30)" }}/>
          <p className="font-bold" style={{ color:"var(--k-tx)" }}>No holdings yet</p>
          <p className="text-sm mt-1" style={{ color:"var(--k-t50)" }}>Record your first trade to start tracking</p>
          <button onClick={()=>setModal(true)} className="btn-primary mt-4 text-sm"><Plus size={14}/>Add Trade</button>
        </div>
      ) : (
        <div className="glass overflow-hidden">
          <div className="hidden md:grid grid-cols-12 gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider"
            style={{ borderBottom:"1px solid var(--k-glass-border)", color:"var(--k-t40)" }}>
            <div className="col-span-3">Stock</div>
            <div className="col-span-1 text-right">Qty</div>
            <div className="col-span-2 text-right">Avg Cost</div>
            <div className="col-span-2 text-right">Current</div>
            <div className="col-span-2 text-right">P&L</div>
            <div className="col-span-1 text-right">%</div>
            <div className="col-span-1"/>
          </div>

          {holdings.map(h => {
            const p   = prices[h.symbol];
            const cur = p?.price || h.avgBuyPrice;
            const C   = h.currency === "INR" ? "₹" : "$";
            const pnl = (cur - h.avgBuyPrice) * h.totalQuantity;
            const pct = h.avgBuyPrice > 0 ? ((cur-h.avgBuyPrice)/h.avgBuyPrice)*100 : 0;
            const pos = pnl >= 0;

            return (
              <React.Fragment key={h.symbol}>
                <div className="grid grid-cols-12 gap-2 items-center px-4 py-3"
                  style={{ borderBottom:"1px solid var(--k-p05)" }}
                  onMouseEnter={e=>e.currentTarget.style.background="var(--k-p05)"}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <div className="col-span-3 flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-black text-[10px]"
                      style={{ background:"var(--k-p12)", border:"1px solid var(--k-p20)", color:"var(--k-p)" }}>
                      {h.symbol.replace(".NS","").replace(".BO","").slice(0,3)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-mono font-bold text-sm truncate" style={{ color:"var(--k-tx)" }}>{h.symbol}</p>
                      <p className="text-xs truncate" style={{ color:"var(--k-t45)" }}>{h.name}</p>
                    </div>
                  </div>
                  <div className="col-span-1 text-right text-sm font-mono font-bold" style={{ color:"var(--k-tx)" }}>{h.totalQuantity}</div>
                  <div className="col-span-2 text-right text-sm font-mono font-bold" style={{ color:"var(--k-tx)" }}>{C}{h.avgBuyPrice.toLocaleString("en-IN",{maximumFractionDigits:2})}</div>
                  <div className="col-span-2 text-right">
                    {p ? <p className="text-sm font-mono font-bold" style={{ color:"var(--k-tx)" }}>{C}{cur.toLocaleString("en-IN",{maximumFractionDigits:2})}</p>
                       : <div className="skeleton h-4 w-16 ml-auto"/>}
                  </div>
                  <div className="col-span-2 text-right">
                    <p className="text-sm font-mono font-bold" style={{ color:pos?"#4ade80":"#f87171" }}>
                      {pos?"+":""}{C}{Math.abs(pnl).toLocaleString("en-IN",{maximumFractionDigits:0})}
                    </p>
                  </div>
                  <div className="col-span-1 text-right">
                    <p className="text-xs font-bold" style={{ color:pos?"#4ade80":"#f87171" }}>
                      {pos?"+":""}{pct.toFixed(2)}%
                    </p>
                  </div>
                  <div className="col-span-1 flex items-center justify-end gap-1">
                    <button onClick={()=>setExpanded(e=>e===h.symbol?null:h.symbol)}
                      className="p-1.5 rounded-xl transition-colors" style={{ color:"var(--k-t40)" }}
                      onMouseEnter={e=>e.currentTarget.style.color="var(--k-p)"}
                      onMouseLeave={e=>e.currentTarget.style.color="var(--k-t40)"}>
                      {expanded===h.symbol?<ChevronUp size={13}/>:<ChevronDown size={13}/>}
                    </button>
                    <button onClick={()=>remove(h.symbol)} disabled={removing===h.symbol}
                      className="p-1.5 rounded-xl transition-colors" style={{ color:"var(--k-t40)" }}
                      onMouseEnter={e=>e.currentTarget.style.color="#f87171"}
                      onMouseLeave={e=>e.currentTarget.style.color="var(--k-t40)"}>
                      {removing===h.symbol?<Loader2 size={13} style={{ animation:"spin 1s linear infinite" }}/>:<Trash2 size={13}/>}
                    </button>
                  </div>
                </div>
                {expanded===h.symbol && (
                  <div className="px-6 py-3" style={{ background:"var(--k-p05)", borderBottom:"1px solid var(--k-glass-border)" }}>
                    <p className="text-xs font-bold mb-2" style={{ color:"var(--k-p60)" }}>Trade History</p>
                    <div className="space-y-1.5">
                      {h.trades.map((t,i)=>(
                        <div key={i} className="flex items-center gap-3 text-xs">
                          <span className={t.type==="BUY"?"badge-green badge":"badge-red badge"}>{t.type}</span>
                          <span className="font-mono font-bold" style={{ color:"var(--k-tx)" }}>{t.quantity} × {C}{t.price?.toFixed(2)}</span>
                          <span style={{ color:"var(--k-t45)" }}>{new Date(t.date).toLocaleDateString("en-IN")}</span>
                          {t.notes && <span className="italic" style={{ color:"var(--k-t40)" }}>{t.notes}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      )}
      {modal && <TradeModal onClose={()=>setModal(false)} onDone={load}/>}
    </div>
  );
}
