import React, { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Star, Briefcase, Bell, GitCompare,
  Globe, LogOut, Sun, Moon, Menu, X, TrendingUp, Flame, MessageSquare, Brain,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import SearchBar from "./SearchBar";
import clsx from "clsx";

const NAV = [
  { to:"/",           icon:LayoutDashboard, label:"Dashboard",  end:true },
  { to:"/market",     icon:Globe,           label:"Market"              },
  { to:"/ask",        icon:MessageSquare,   label:"Stock Q&A"           },
  { to:"/watchlist",  icon:Star,            label:"Watchlist"           },
  { to:"/portfolio",  icon:Briefcase,       label:"Portfolio"           },
  { to:"/psychology", icon:Brain,           label:"Psychology"          },
  { to:"/alerts",     icon:Bell,            label:"Alerts"              },
  { to:"/compare",    icon:GitCompare,      label:"Compare"             },
];

const NavItem = ({ to, icon:Icon, label, end, mini }) => (
  <NavLink to={to} end={end} className={({ isActive }) => clsx(
    "flex items-center gap-3 px-3 py-2.5 transition-all duration-200 relative group",
    mini ? "justify-center rounded-2xl" : "rounded-2xl",
    isActive
      ? "text-[var(--k-tx)]"
      : "text-[var(--k-t50)] hover:text-[var(--k-t80)]"
  )}>
    {({ isActive }) => (
      <>
        {isActive && (
          <span className="absolute inset-0 rounded-2xl"
            style={{ background:"linear-gradient(135deg,var(--k-p20),var(--k-s10))", border:"1px solid var(--k-p25)", boxShadow:"0 0 12px var(--k-p10)" }}/>
        )}
        <Icon size={17} className="shrink-0 relative z-10" />
        {!mini && <span className="text-sm font-semibold relative z-10 tracking-tight">{label}</span>}
        {!mini && isActive && (
          <span className="ml-auto w-1.5 h-1.5 rounded-full relative z-10"
            style={{ background:"var(--k-p)", boxShadow:"0 0 8px var(--k-p70)" }}/>
        )}
      </>
    )}
  </NavLink>
);

export default function Layout() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [open,   setOpen]   = useState(true);
  const [mobile, setMobile] = useState(false);

  const Sidebar = ({ mini }) => (
    <div style={{
      width: mini ? 64 : 220,
      background: "linear-gradient(180deg, var(--k-bg2) 0%, var(--k-bg) 100%)",
      backdropFilter: "blur(24px)",
      borderRight: "1px solid var(--k-p12)",
      height: "100vh",
      display: "flex", flexDirection: "column",
      position: "relative", transition: "width 0.3s cubic-bezier(0.16,1,0.3,1)",
    }}>
      {/* Ambient orb */}
      <div className="absolute top-0 left-0 w-40 h-40 pointer-events-none"
        style={{ background:"radial-gradient(circle, var(--k-p08), transparent)", borderRadius:"50%" }}/>

      {/* Logo */}
      <div className={clsx("flex items-center gap-3 px-4 py-6 relative", mini && "justify-center px-2")}>
        <div className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background:"linear-gradient(135deg,var(--k-p),var(--k-s))", boxShadow:"0 0 20px var(--k-p50), 0 4px 12px rgba(0,0,0,0.4)" }}>
          <Flame size={18} className="text-cream" />
        </div>
        {!mini && (
          <div>
            <p className="font-black text-base tracking-tight" style={{ color:"var(--k-tx)" }}>StockSense</p>
            <p className="text-[9px] font-bold uppercase tracking-[0.2em]" style={{ color:"var(--k-p70)" }}>Analytics Pro</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className={clsx("flex-1 overflow-y-auto space-y-0.5 pb-4", mini ? "px-2" : "px-3")}>
        {NAV.map(n => <NavItem key={n.to} {...n} mini={mini} />)}
      </nav>

      {/* Bottom */}
      <div className={clsx("pb-4 space-y-0.5 border-t", mini ? "px-2" : "px-3")}
        style={{ borderColor:"var(--k-p10)" }}>
        <button onClick={toggleTheme} className="btn-ghost w-full justify-start text-xs" style={mini?{justifyContent:"center"}:{}}>
          {isDark ? <Sun size={15}/> : <Moon size={15}/>}
          {!mini && <span>Toggle Theme</span>}
        </button>
        <button onClick={logout} className="btn-ghost w-full justify-start text-xs" style={mini?{justifyContent:"center",color:"var(--color-loss)"}:{color:"var(--color-loss)"}}>
          <LogOut size={15}/>{!mini && <span>Logout</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button onClick={() => setOpen(p => !p)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full flex items-center justify-center z-50 text-xs"
        style={{ background:"var(--k-bg3)", border:"1px solid var(--k-p25)", color:"var(--k-t60)", boxShadow:"0 2px 8px rgba(0,0,0,0.4)" }}>
        {mini ? "›" : "‹"}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen flex" style={{ color:"var(--k-tx)" }}>
      {/* Mobile overlay */}
      {mobile && (
        <div className="fixed inset-0 z-30 md:hidden" onClick={() => setMobile(false)}
          style={{ background:"rgba(0,0,0,0.7)", backdropFilter:"blur(4px)" }}/>
      )}

      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden md:flex h-screen">
        <Sidebar mini={!open} />
      </aside>

      {/* Mobile drawer */}
      <aside className={clsx("fixed left-0 top-0 h-screen z-40 md:hidden transition-transform duration-300", mobile?"translate-x-0":"-translate-x-full")}>
        <div className="h-full w-56 flex flex-col relative"
          style={{ background:"var(--k-b97)", backdropFilter:"blur(24px)", borderRight:"1px solid var(--k-p15)" }}>
          <button onClick={() => setMobile(false)} className="absolute top-4 right-4 btn-ghost p-1"><X size={17}/></button>
          <div className="flex items-center gap-3 px-4 py-6">
            <div className="w-9 h-9 rounded-2xl flex items-center justify-center" style={{ background:"linear-gradient(135deg,var(--k-p),var(--k-s))" }}>
              <Flame size={18} className="text-cream"/>
            </div>
            <p className="font-black text-base" style={{ color:"var(--k-tx)" }}>StockSense</p>
          </div>
          <nav className="flex-1 px-3 space-y-0.5">
            {NAV.map(n => <NavItem key={n.to} {...n} mini={false}/>)}
          </nav>
          <div className="px-3 pb-4 border-t" style={{ borderColor:"var(--k-p10)" }}>
            <button onClick={logout} className="btn-ghost w-full justify-start text-xs mt-2" style={{ color:"var(--color-loss)" }}>
              <LogOut size={15}/><span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-h-screen transition-all duration-300" style={{ marginLeft: open ? 220 : 64 }}>
        {/* Topbar */}
        <header className="sticky top-0 z-20 flex items-center gap-3 px-4 md:px-6 py-3"
          style={{ background:"var(--k-b85)", backdropFilter:"blur(24px)", borderBottom:"1px solid var(--k-p10)" }}>
          <button className="md:hidden btn-ghost p-2" onClick={() => setMobile(true)}><Menu size={19}/></button>
          <div className="flex-1 max-w-xl"><SearchBar /></div>
          <div className="flex items-center gap-2 ml-auto">
            <button onClick={toggleTheme} className="btn-ghost p-2">
              {isDark ? <Sun size={16} style={{ color:"#fbbf24" }}/> : <Moon size={16}/>}
            </button>
            <div className="flex items-center gap-2.5 pl-3" style={{ borderLeft:"1px solid var(--k-p15)" }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center font-black text-sm relative"
                style={{ background:"linear-gradient(135deg,var(--k-p25),var(--k-s15))", border:"1px solid var(--k-p30)" }}>
                <span style={{ color:"var(--k-tx)" }}>{user?.name?.[0]?.toUpperCase()}</span>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2"
                  style={{ background:"#4ade80", borderColor:"var(--k-bg)", boxShadow:"0 0 8px rgba(74,222,128,0.6)" }}/>
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-bold leading-tight" style={{ color:"var(--k-tx)" }}>{user?.name}</p>
                <p className="text-xs" style={{ color:"var(--k-p70)" }}>{user?.defaultMarket}</p>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 p-4 md:p-6 animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
