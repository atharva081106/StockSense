import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2, Flame } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ name:"", email:"", password:"", defaultMarket:"NSE" });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async e => {
    e.preventDefault();
    if (!form.name||!form.email||!form.password) return toast.error("Fill in all fields");
    if (form.password.length<6) return toast.error("Password needs 6+ characters");
    setLoading(true);
    try { await register(form.name,form.email,form.password,form.defaultMarket); toast.success("Account created! 🔥"); nav("/"); }
    catch (err) { toast.error(err.response?.data?.error||"Registration failed"); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden" style={{ background:"var(--k-bg)" }}>
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute w-80 h-80 rounded-full opacity-18 blur-[100px] top-1/4 right-1/4"
          style={{ background:"radial-gradient(circle,var(--k-s),transparent)" }}/>
        <div className="absolute w-64 h-64 rounded-full opacity-12 blur-[80px] bottom-1/4 left-1/4"
          style={{ background:"radial-gradient(circle,var(--k-p),transparent)" }}/>
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage:"linear-gradient(var(--k-p40)1px,transparent 1px),linear-gradient(90deg,var(--k-p40)1px,transparent 1px)", backgroundSize:"56px 56px" }}/>
      </div>

      <div className="w-full max-w-sm relative">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background:"linear-gradient(135deg,var(--k-p),var(--k-s))", boxShadow:"0 0 20px var(--k-p40)" }}>
            <Flame size={20} style={{ color:"var(--k-tx)" }}/>
          </div>
          <p className="font-black text-xl" style={{ color:"var(--k-tx)" }}>StockSense</p>
        </div>

        <div className="p-8 rounded-3xl" style={{ background:"var(--k-b80)", backdropFilter:"blur(28px)", border:"1px solid var(--k-p20)", boxShadow:"0 32px 80px rgba(0,0,0,0.6)" }}>
          <h2 className="text-2xl font-black mb-1" style={{ color:"var(--k-tx)" }}>Create account</h2>
          <p className="text-sm mb-6" style={{ color:"var(--k-t40)" }}>
            Have one?{" "}
            <Link to="/auth/login" className="font-bold transition-colors" style={{ color:"var(--k-p)" }}>Sign in</Link>
          </p>

          <form onSubmit={submit} className="space-y-4">
            {[
              { label:"Full Name", key:"name",  type:"text",  ph:"Atharva Joshi"   },
              { label:"Email",     key:"email", type:"email", ph:"you@email.com"   },
            ].map(f=>(
              <div key={f.key}>
                <label className="block text-xs font-black uppercase tracking-widest mb-2" style={{ color:"var(--k-p60)" }}>{f.label}</label>
                <input type={f.type} value={form[f.key]} onChange={e=>setForm({...form,[f.key]:e.target.value})} placeholder={f.ph} className="input"/>
              </div>
            ))}
            <div>
              <label className="block text-xs font-black uppercase tracking-widest mb-2" style={{ color:"var(--k-p60)" }}>Password</label>
              <div className="relative">
                <input type={show?"text":"password"} value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="Min. 6 characters" className="input pr-11"/>
                <button type="button" onClick={()=>setShow(p=>!p)} className="absolute right-3.5 top-1/2 -translate-y-1/2" style={{ color:"var(--k-t30)" }}>
                  {show?<EyeOff size={15}/>:<Eye size={15}/>}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest mb-2" style={{ color:"var(--k-p60)" }}>Default Market</label>
              <select value={form.defaultMarket} onChange={e=>setForm({...form,defaultMarket:e.target.value})} className="input">
                <option value="NSE">🇮🇳 NSE — India (₹)</option>
                <option value="BSE">🇮🇳 BSE — India (₹)</option>
                <option value="GLOBAL">🌐 Global — NYSE/NASDAQ ($)</option>
              </select>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3.5 text-base mt-2">
              {loading&&<Loader2 size={16} style={{ animation:"spin 1s linear infinite" }}/>}
              {loading?"Creating…":"Create Account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
