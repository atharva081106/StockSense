import React, { useEffect, useRef } from "react";
import { TrendingUp, TrendingDown, Radio } from "lucide-react";
import useLivePrice from "../hooks/useLivePrice";

export default function PriceTicker({ symbol, initialPrice, initialChange, initialChangePct, currency="INR" }) {
  const live  = useLivePrice(symbol);
  const elRef = useRef(null);
  const price     = live?.price         ?? initialPrice;
  const change    = live?.change        ?? initialChange;
  const changePct = live?.changePercent ?? initialChangePct;
  const dir = live?._dir || "neutral";
  const curr = currency==="INR"?"₹":"$";
  const pos  = (change??0) >= 0;

  useEffect(() => {
    if (!live||!elRef.current) return;
    const el = elRef.current;
    const c = dir==="up"?"rgba(74,222,128,0.4)":dir==="down"?"rgba(248,113,113,0.4)":"";
    if (!c) return;
    el.style.textShadow = `0 0 20px ${c}`;
    const t = setTimeout(()=>{ el.style.textShadow="none"; },600);
    return ()=>clearTimeout(t);
  },[live]);

  return (
    <div className="space-y-2">
      <div ref={elRef} className="flex items-end gap-3 transition-all duration-500">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-bold" style={{ color:"var(--k-t40)" }}>{curr}</span>
            {live && (
              <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest" style={{ color:"var(--k-p)" }}>
                <Radio size={9} style={{ animation:"pulse 1.5s ease-in-out infinite" }}/>LIVE
              </span>
            )}
          </div>
          <p ref={elRef} className="font-black tabular-nums leading-none transition-all duration-300"
            style={{ fontSize:"clamp(2rem,5vw,3.5rem)", color:"var(--k-tx)" }}>
            {price!=null ? price.toLocaleString("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2}) : "—"}
          </p>
        </div>
      </div>
      {change!=null && (
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl font-bold text-sm"
          style={{
            background: pos ? "rgba(74,222,128,0.08)" : "rgba(248,113,113,0.08)",
            border: pos ? "1px solid rgba(74,222,128,0.2)" : "1px solid rgba(248,113,113,0.2)",
            color: pos ? "#4ade80" : "#f87171",
          }}>
          {pos?<TrendingUp size={15}/>:<TrendingDown size={15}/>}
          <span>{pos?"+":""}{change.toLocaleString("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2})}</span>
          <span className="opacity-70 text-xs">({pos?"+":""}{changePct?.toFixed(2)}%)</span>
        </div>
      )}
    </div>
  );
}
