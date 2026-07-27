import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2, Flame, TrendingUp, Shield, Bell, BarChart2, Zap } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ email:"", password:"" });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async e => {
    e.preventDefault();
    if (!form.email||!form.password) return toast.error("Fill in all fields");
    setLoading(true);
    try { await login(form.email,form.password); toast.success("Welcome back! 🔥"); nav("/"); }
    catch (err) { toast.error(err.response?.data?.error||"Login failed"); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex overflow-hidden" style={{ background:"var(--k-bg)" }}>
      {/* Ambient orbs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute w-[500px] h-[500px] rounded-full opacity-20 blur-[120px] -top-20 -left-20"
          style={{ background:"radial-gradient(circle,var(--k-p),transparent)" }}/>
        <div className="absolute w-96 h-96 rounded-full opacity-12 blur-[100px] bottom-0 right-1/4"
          style={{ background:"radial-gradient(circle,var(--k-s),transparent)" }}/>
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage:"linear-gradient(var(--k-p40)1px,transparent 1px),linear-gradient(90deg,var(--k-p40)1px,transparent 1px)", backgroundSize:"56px 56px" }}/>
      </div>

      {/* Left hero */}
      <div className="hidden lg:flex flex-1 flex-col justify-center p-16 relative">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-14">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background:"linear-gradient(135deg,var(--k-p),var(--k-s))", boxShadow:"0 0 30px var(--k-p50)" }}>
            <Flame size={24} style={{ color:"var(--k-tx)" }}/>
          </div>
          <div>
            <p className="font-black text-2xl" style={{ color:"var(--k-tx)" }}>StockSense</p>
            <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color:"var(--k-p70)" }}>Analytics Pro</p>
          </div>
        </div>

        <h1 className="text-5xl font-black mb-4 leading-tight" style={{ color:"var(--k-tx)" }}>
          Smarter stock<br/>
          <span style={{ background:"linear-gradient(135deg,var(--k-p),var(--k-p),#ff6b35)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>
            decisions
          </span>
        </h1>
        <p className="text-base mb-12 leading-relaxed max-w-sm" style={{ color:"var(--k-t50)" }}>
          Professional-grade analytics for Indian NSE/BSE and global markets. AI predictions, live prices, and intelligent alerts.
        </p>

        <div className="space-y-3 max-w-sm">
          {[
            [TrendingUp,"Live NSE/BSE & Global Prices","Real-time via Socket.io"],
            [BarChart2, "AI Price Prediction","Multi-factor technical model"],
            [Shield,    "Technical Indicators","RSI, MACD, BB with guidance"],
            [Bell,      "Smart Price Alerts","Email + in-app notifications"],
          ].map(([Icon,t,s])=>(
            <div key={t} className="flex items-center gap-4 px-4 py-3 rounded-2xl"
              style={{ background:"var(--k-p06)", border:"1px solid var(--k-p12)" }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                style={{ background:"var(--k-p12)", border:"1px solid var(--k-p20)" }}>
                <Icon size={15} style={{ color:"var(--k-p)" }}/>
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color:"var(--k-tx)" }}>{t}</p>
                <p className="text-xs" style={{ color:"var(--k-t40)" }}>{s}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-6 relative">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background:"linear-gradient(135deg,var(--k-p),var(--k-s))" }}>
              <Flame size={20} style={{ color:"var(--k-tx)" }}/>
            </div>
            <p className="font-black text-xl" style={{ color:"var(--k-tx)" }}>StockSense</p>
          </div>

          <div className="p-8 rounded-3xl"
            style={{ background:"var(--k-b80)", backdropFilter:"blur(28px)", border:"1px solid var(--k-p20)", boxShadow:"0 32px 80px rgba(0,0,0,0.6), 0 0 40px var(--k-p05)" }}>
            <h2 className="text-2xl font-black mb-1" style={{ color:"var(--k-tx)" }}>Sign in</h2>
            <p className="text-sm mb-6" style={{ color:"var(--k-t40)" }}>
              No account?{" "}
              <Link to="/auth/register" className="font-bold transition-colors" style={{ color:"var(--k-p)" }}
                onMouseEnter={e=>e.target.style.color="var(--k-p)"} onMouseLeave={e=>e.target.style.color="var(--k-p)"}>
                Create one free
              </Link>
            </p>

            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest mb-2" style={{ color:"var(--k-p60)" }}>Email</label>
                <input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}
                  placeholder="you@email.com" className="input" autoComplete="email"/>
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest mb-2" style={{ color:"var(--k-p60)" }}>Password</label>
                <div className="relative">
                  <input type={show?"text":"password"} value={form.password} onChange={e=>setForm({...form,password:e.target.value})}
                    placeholder="••••••••" className="input pr-11" autoComplete="current-password"/>
                  <button type="button" onClick={()=>setShow(p=>!p)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color:"var(--k-t30)" }}>
                    {show?<EyeOff size={15}/>:<Eye size={15}/>}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3.5 text-base mt-2">
                {loading&&<Loader2 size={16} style={{ animation:"spin 1s linear infinite" }}/>}
                {loading?"Signing in…":"Sign In"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
