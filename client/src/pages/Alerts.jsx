import React, { useState, useEffect } from "react";
import { Bell, Plus, Trash2, Loader2, X, ToggleLeft, ToggleRight, CheckCircle } from "lucide-react";
import api from "../services/api";
import toast from "react-hot-toast";
import { formatDistanceToNow } from "date-fns";

function CreateModal({ onClose, onDone }) {
  const [f, setF] = useState({ symbol:"", name:"", condition:"ABOVE", targetPrice:"",
    currency:"INR", notifyEmail:true, notifyInApp:true, notes:"" });
  const [loading, setLoading] = useState(false);

  const submit = async e => {
    e.preventDefault();
    if (!f.symbol||!f.name||!f.targetPrice) return toast.error("Symbol, name, target price required");
    setLoading(true);
    try {
      await api.post("/alerts", { ...f, symbol:f.symbol.toUpperCase(), targetPrice:+f.targetPrice });
      toast.success("Alert created!"); onDone(); onClose();
    } catch (err) { toast.error(err.response?.data?.error||"Failed"); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ background:"rgba(13,8,5,0.75)", backdropFilter:"blur(4px)" }}>
      <div className="glass w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom:"1px solid var(--k-glass-border)" }}>
          <h2 className="font-bold text-base" style={{ color:"var(--k-tx)" }}>Create Price Alert</h2>
          <button onClick={onClose} className="btn-ghost p-1"><X size={17}/></button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color:"var(--k-p60)" }}>Symbol *</label>
              <input value={f.symbol} onChange={e=>setF({...f,symbol:e.target.value.toUpperCase()})} placeholder="RELIANCE.NS" className="input"/>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color:"var(--k-p60)" }}>Stock Name *</label>
              <input value={f.name} onChange={e=>setF({...f,name:e.target.value})} placeholder="Reliance Industries" className="input"/>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color:"var(--k-p60)" }}>Condition</label>
              <select value={f.condition} onChange={e=>setF({...f,condition:e.target.value})} className="input">
                <option value="ABOVE">Price Above</option><option value="BELOW">Price Below</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color:"var(--k-p60)" }}>Target *</label>
              <input type="number" value={f.targetPrice} onChange={e=>setF({...f,targetPrice:e.target.value})} placeholder="3000" min="0" step="any" className="input"/>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color:"var(--k-p60)" }}>Currency</label>
              <select value={f.currency} onChange={e=>setF({...f,currency:e.target.value})} className="input">
                <option value="INR">INR ₹</option><option value="USD">USD $</option>
              </select>
            </div>
          </div>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={f.notifyInApp} onChange={e=>setF({...f,notifyInApp:e.target.checked})} style={{ accentColor:"var(--k-p)" }}/>
              <span className="text-sm" style={{ color:"var(--k-t80)" }}>In-app</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={f.notifyEmail} onChange={e=>setF({...f,notifyEmail:e.target.checked})} style={{ accentColor:"var(--k-p)" }}/>
              <span className="text-sm" style={{ color:"var(--k-t80)" }}>Email</span>
            </label>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color:"var(--k-p60)" }}>Notes</label>
            <input value={f.notes} onChange={e=>setF({...f,notes:e.target.value})} placeholder="Support level" className="input"/>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5">
            {loading&&<Loader2 size={14} style={{ animation:"spin 1s linear infinite" }}/>} {loading?"Creating…":"Create Alert"}
          </button>
        </form>
      </div>
    </div>
  );
}

function AlertCard({ alert, onDelete, onToggle, deleting, toggling }) {
  const C = alert.currency === "INR" ? "₹" : "$";
  const typeColor = alert.isTriggered ? "#4ade80" : alert.isActive ? "var(--k-p)" : "var(--k-t40)";

  return (
    <div className="glass p-4 transition-all"
      style={alert.isTriggered ? { borderColor:"rgba(74,222,128,0.25)" } : !alert.isActive ? { opacity:0.55 } : {}}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-mono font-bold text-sm" style={{ color:"var(--k-tx)" }}>{alert.symbol}</span>
            {alert.isTriggered
              ? <span className="badge-green badge"><CheckCircle size={10}/>Triggered</span>
              : alert.isActive
              ? <span className="badge-gold badge">Active</span>
              : <span className="badge badge-cream">Paused</span>}
          </div>
          <p className="text-xs mb-2 truncate" style={{ color:"var(--k-t50)" }}>{alert.name}</p>
          <p className="text-sm" style={{ color:"var(--k-t70)" }}>
            Alert when price{" "}
            <span className="font-bold" style={{ color:alert.condition==="ABOVE"?"#4ade80":"#f87171" }}>
              {alert.condition==="ABOVE"?"rises above":"drops below"}
            </span>{" "}
            <span className="font-mono font-bold" style={{ color:"var(--k-tx)" }}>{C}{alert.targetPrice?.toLocaleString("en-IN",{maximumFractionDigits:2})}</span>
          </p>
          {alert.isTriggered && (
            <p className="text-xs mt-1" style={{ color:"#4ade80" }}>
              Hit {C}{alert.triggeredPrice?.toFixed(2)} · {formatDistanceToNow(new Date(alert.triggeredAt),{addSuffix:true})}
            </p>
          )}
          <div className="flex gap-3 mt-2">
            {alert.notifyEmail  && <span className="text-xs" style={{ color:"var(--k-t40)" }}>📧 Email</span>}
            {alert.notifyInApp  && <span className="text-xs" style={{ color:"var(--k-t40)" }}>🔔 In-app</span>}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {!alert.isTriggered && (
            <button onClick={()=>onToggle(alert._id)} disabled={toggling===alert._id}
              className="p-1.5 rounded-xl transition-colors" style={{ color:"var(--k-t40)" }}
              onMouseEnter={e=>e.currentTarget.style.color="var(--k-p)"}
              onMouseLeave={e=>e.currentTarget.style.color="var(--k-t40)"}>
              {toggling===alert._id ? <Loader2 size={16} style={{ animation:"spin 1s linear infinite" }}/>
                : alert.isActive ? <ToggleRight size={18} style={{ color:"var(--k-p)" }}/> : <ToggleLeft size={18}/>}
            </button>
          )}
          <button onClick={()=>onDelete(alert._id)} disabled={deleting===alert._id}
            className="p-1.5 rounded-xl transition-colors" style={{ color:"var(--k-t40)" }}
            onMouseEnter={e=>e.currentTarget.style.color="#f87171"}
            onMouseLeave={e=>e.currentTarget.style.color="var(--k-t40)"}>
            {deleting===alert._id ? <Loader2 size={14} style={{ animation:"spin 1s linear infinite" }}/> : <Trash2 size={14}/>}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Alerts() {
  const [alerts,   setAlerts]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [toggling, setToggling] = useState(null);

  const load = async () => {
    try { const { data } = await api.get("/alerts"); setAlerts(data.alerts||[]); }
    catch { toast.error("Failed to load alerts"); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const del = async id => {
    setDeleting(id);
    try { await api.delete(`/alerts/${id}`); setAlerts(p=>p.filter(a=>a._id!==id)); toast.success("Deleted"); }
    catch { toast.error("Failed"); }
    finally { setDeleting(null); }
  };

  const toggle = async id => {
    setToggling(id);
    try { const { data } = await api.patch(`/alerts/${id}/toggle`); setAlerts(p=>p.map(a=>a._id===id?data.alert:a)); }
    catch { toast.error("Failed"); }
    finally { setToggling(null); }
  };

  const active    = alerts.filter(a =>  a.isActive && !a.isTriggered);
  const triggered = alerts.filter(a =>  a.isTriggered);
  const paused    = alerts.filter(a => !a.isActive  && !a.isTriggered);

  const Section = ({ title, list }) => list.length > 0 ? (
    <section>
      <p className="section-label mb-2">{title} ({list.length})</p>
      <div className="grid sm:grid-cols-2 gap-3">
        {list.map(a=><AlertCard key={a._id} alert={a} onDelete={del} onToggle={toggle} deleting={deleting} toggling={toggling}/>)}
      </div>
    </section>
  ) : null;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black flex items-center gap-2" style={{ color:"var(--k-tx)" }}>
            <Bell size={20} style={{ color:"var(--k-p)" }}/>Price Alerts
          </h1>
          <p className="text-xs mt-0.5" style={{ color:"var(--k-t50)" }}>{active.length} active alert{active.length!==1?"s":""}</p>
        </div>
        <button onClick={()=>setModal(true)} className="btn-primary text-sm"><Plus size={14}/>New Alert</button>
      </div>

      <div className="glass p-3">
        <p className="text-xs" style={{ color:"var(--k-t50)" }}>
          🕐 Alerts check every <strong>5 minutes</strong>. Email needs <code className="font-mono" style={{ color:"var(--k-p)" }}>SMTP_USER</code> in <code className="font-mono" style={{ color:"var(--k-p)" }}>server/.env</code>.
        </p>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 gap-3">{[...Array(3)].map((_,i)=><div key={i} className="skeleton h-28 rounded-2xl"/>)}</div>
      ) : alerts.length === 0 ? (
        <div className="glass p-12 text-center">
          <Bell size={32} className="mx-auto mb-3" style={{ color:"var(--k-t30)" }}/>
          <p className="font-bold" style={{ color:"var(--k-tx)" }}>No alerts yet</p>
          <p className="text-sm mt-1" style={{ color:"var(--k-t50)" }}>Get notified when your target price is hit</p>
          <button onClick={()=>setModal(true)} className="btn-primary mt-4 text-sm"><Plus size={14}/>Create Alert</button>
        </div>
      ) : (
        <div className="space-y-5">
          <Section title="Active"    list={active}/>
          <Section title="Triggered" list={triggered}/>
          <Section title="Paused"    list={paused}/>
        </div>
      )}
      {modal && <CreateModal onClose={()=>setModal(false)} onDone={load}/>}
    </div>
  );
}
