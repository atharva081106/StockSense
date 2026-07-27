import React, { useState, useEffect, useCallback } from "react";
import { Brain, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Info, Loader2, Zap, Star, Calendar, RefreshCw } from "lucide-react";
import api from "../services/api";

/* ── Reusable gauge ─────────────────────────────────────────── */
function ScoreGauge({ score, size = 120, label, sublabel, color }) {
  const r   = (size - 16) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ * 0.75; // 270° arc
  const offset = circ * 0.125;              // start at -135°

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width:size, height:size }}>
        <svg width={size} height={size} style={{ transform:"rotate(-225deg)" }}>
          {/* Track */}
          <circle cx={size/2} cy={size/2} r={r}
            fill="none" stroke="var(--k-p12)"
            strokeWidth={8} strokeDasharray={`${circ * 0.75} ${circ * 0.25}`}
            strokeDashoffset={0} strokeLinecap="round"/>
          {/* Progress */}
          <circle cx={size/2} cy={size/2} r={r}
            fill="none" stroke={color || "var(--k-p)"}
            strokeWidth={8} strokeDasharray={`${dash} ${circ - dash}`}
            strokeDashoffset={0} strokeLinecap="round"
            style={{ transition:"stroke-dasharray 1s ease", filter:`drop-shadow(0 0 6px ${color || "var(--k-p)"}60)` }}/>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-black text-xl leading-none" style={{ color: color || "var(--k-p)" }}>{score}</span>
          <span className="text-[10px] font-medium" style={{ color:"var(--k-t40)" }}>/100</span>
        </div>
      </div>
      {label    && <p className="text-sm font-bold text-center" style={{ color:"var(--k-tx)" }}>{label}</p>}
      {sublabel && <p className="text-xs text-center" style={{ color:"var(--k-t40)" }}>{sublabel}</p>}
    </div>
  );
}

/* ── Metric bar ─────────────────────────────────────────────── */
function MetricBar({ label, score, scoreLabel, description, invertColor }) {
  const good  = invertColor ? score < 40 : score > 60;
  const warn  = score >= 40 && score <= 60;
  const color = good ? "#4ade80" : warn ? "#fbbf24" : "#f87171";

  return (
    <div className="p-4 rounded-2xl" style={{ background:"var(--k-b50)", border:"1px solid var(--k-p12)" }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-bold" style={{ color:"var(--k-tx)" }}>{label}</span>
        <span className="text-xs font-black px-2.5 py-1 rounded-full"
          style={{ background:`${color}15`, color, border:`1px solid ${color}25` }}>
          {scoreLabel}
        </span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden mb-2" style={{ background:"var(--k-p10)" }}>
        <div className="h-full rounded-full transition-all duration-1000"
          style={{ width:`${score}%`, background:`linear-gradient(90deg, ${color}80, ${color})` }}/>
      </div>
      <p className="text-xs leading-relaxed" style={{ color:"var(--k-t45)" }}>{description}</p>
    </div>
  );
}

/* ── Trait card ─────────────────────────────────────────────── */
function TraitCard({ trait }) {
  const icons = { warning: AlertTriangle, good: CheckCircle, info: Info };
  const colors= { warning:"#fbbf24", good:"#4ade80", info:"#60a5fa" };
  const Icon  = icons[trait.type] || Info;
  const color = colors[trait.type] || "#60a5fa";

  return (
    <div className="flex items-start gap-3 p-4 rounded-2xl"
      style={{ background:`${color}07`, border:`1px solid ${color}20` }}>
      <Icon size={16} style={{ color, flexShrink:0, marginTop:2 }}/>
      <div>
        <p className="text-sm font-bold mb-0.5" style={{ color:"var(--k-tx)" }}>{trait.name}</p>
        <p className="text-xs leading-relaxed" style={{ color:"var(--k-t50)" }}>{trait.desc}</p>
      </div>
    </div>
  );
}

/* ── Day-of-week bar chart ─────────────────────────────────── */
function DayChart({ dowStats }) {
  if (!dowStats?.length) return null;
  const maxPnl = Math.max(...dowStats.map(d => Math.abs(d.pnl || 0)), 1);

  return (
    <div className="p-4 rounded-2xl" style={{ background:"var(--k-b50)", border:"1px solid var(--k-p12)" }}>
      <p className="text-sm font-bold mb-4" style={{ color:"var(--k-tx)" }}>Performance by Day of Week</p>
      <div className="space-y-2">
        {dowStats.map(d => {
          const pos   = (d.pnl || 0) >= 0;
          const width = Math.abs(d.pnl) / maxPnl * 100;
          return (
            <div key={d.label} className="flex items-center gap-3">
              <span className="text-xs font-mono w-8 shrink-0" style={{ color:"var(--k-t50)" }}>{d.label}</span>
              <div className="flex-1 h-5 rounded-lg overflow-hidden relative" style={{ background:"var(--k-p06)" }}>
                <div className="h-full rounded-lg transition-all duration-700"
                  style={{
                    width:`${width}%`,
                    background: pos
                      ? "linear-gradient(90deg,rgba(74,222,128,0.4),rgba(74,222,128,0.7))"
                      : "linear-gradient(90deg,rgba(248,113,113,0.4),rgba(248,113,113,0.7))",
                  }}/>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-bold w-10 text-right" style={{ color: pos ? "#4ade80" : "#f87171" }}>
                  {d.winRate}%
                </span>
                <span className="text-[10px]" style={{ color:"var(--k-t30)" }}>({d.total})</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Main component ─────────────────────────────────────────── */
export default function Psychology() {
  const [data,       setData]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [aiLoading,  setAiLoading]  = useState(false);
  const [aiDone,     setAiDone]     = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const { data: res } = await api.get("/psychology");
      if (res.empty) { setError(res.message); setLoading(false); return; }
      setData(res);
    } catch (e) {
      setError(e.response?.data?.error || "Failed to load psychology data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const runAIAnalysis = async () => {
    if (!data) return;
    setAiLoading(true); setAiAnalysis(""); setAiDone(false);
    try {
      const { data: res } = await api.post("/psychology/ai-roast", { metrics: data });
      setAiAnalysis(res.analysis || "Analysis unavailable.");
      setAiDone(true);
    } catch (e) {
      setAiAnalysis("⚠️ " + (e.response?.data?.error || "AI analysis failed."));
      setAiDone(true);
    } finally {
      setAiLoading(false);
    }
  };

  const healthColor = (score) =>
    score >= 75 ? "#4ade80" : score >= 50 ? "#fbbf24" : "#f87171";

  const healthLabel = (score) =>
    score >= 75 ? "Healthy" : score >= 50 ? "Needs Work" : "At Risk";

  /* ── Loading ── */
  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{ background:"var(--k-p08)", border:"1px solid var(--k-p20)" }}>
        <Brain size={28} style={{ color:"var(--k-p)", animation:"pulse 2s ease-in-out infinite" }}/>
      </div>
      <div className="text-center">
        <p className="font-bold" style={{ color:"var(--k-tx)" }}>Analyzing your trading behavior…</p>
        <p className="text-sm mt-1" style={{ color:"var(--k-t40)" }}>Computing 5 psychological metrics from your trade history</p>
      </div>
    </div>
  );

  /* ── Empty / Error ── */
  if (error) return (
    <div className="flex flex-col items-center justify-center py-20 gap-5">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{ background:"var(--k-p06)", border:"1px solid var(--k-p15)" }}>
        <Brain size={28} style={{ color:"var(--k-p50)" }}/>
      </div>
      <div className="text-center max-w-sm">
        <p className="font-bold mb-2" style={{ color:"var(--k-tx)" }}>No trade data yet</p>
        <p className="text-sm leading-relaxed" style={{ color:"var(--k-t40)" }}>{error}</p>
        <p className="text-xs mt-3" style={{ color:"var(--k-p50)" }}>
          Go to Portfolio → Add Trade to record some buy/sell pairs. Psychology analysis needs at least one completed trade.
        </p>
      </div>
      <a href="/portfolio" className="btn-primary text-sm">Go to Portfolio</a>
    </div>
  );

  const { summary, scores, patterns, traits, recommendations } = data;
  const hc = healthColor(summary.healthScore);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black flex items-center gap-2" style={{ color:"var(--k-tx)" }}>
            <Brain size={20} style={{ color:"var(--k-p)" }}/>
            Trading Psychology
          </h1>
          <p className="text-xs mt-0.5" style={{ color:"var(--k-p60)" }}>
            Based on {summary.totalTrades} completed trades
          </p>
        </div>
        <button onClick={fetchData} className="btn-secondary text-xs gap-1.5">
          <RefreshCw size={12}/>Refresh
        </button>
      </div>

      {/* ── Hero: overall score ── */}
      <div className="rounded-3xl overflow-hidden relative p-7"
        style={{
          background:"linear-gradient(135deg,var(--k-d20),var(--k-p10))",
          border:"1px solid var(--k-p20)",
        }}>
        {/* Ambient */}
        <div className="absolute top-0 right-0 w-64 h-64 pointer-events-none blur-[80px] opacity-20"
          style={{ background:`radial-gradient(circle,${hc},transparent)`, transform:"translate(30%,-30%)" }}/>

        <div className="relative flex flex-col sm:flex-row items-center gap-8">
          <ScoreGauge
            score={summary.healthScore}
            size={140}
            label={healthLabel(summary.healthScore)}
            sublabel="Overall health"
            color={hc}
          />

          <div className="flex-1">
            <p className="text-2xl font-black mb-3" style={{ color:"var(--k-tx)" }}>
              Your Trading Score:{" "}
              <span style={{ color: hc }}>{summary.healthScore}/100</span>
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {[
                { l:"Win Rate",       v:`${summary.winRate}%`,         c: summary.winRate > 55 ? "#4ade80" : summary.winRate > 40 ? "#fbbf24" : "#f87171" },
                { l:"Risk/Reward",    v:`${summary.riskReward}:1`,     c: summary.riskReward >= 1.5 ? "#4ade80" : summary.riskReward >= 1.0 ? "#fbbf24" : "#f87171" },
                { l:"Avg Win",        v:`+${summary.avgWinRet}%`,      c:"#4ade80" },
                { l:"Avg Loss",       v:`${summary.avgLossRet}%`,      c:"#f87171" },
              ].map(s => (
                <div key={s.l} className="p-3 rounded-2xl text-center"
                  style={{ background:"var(--k-b40)", border:"1px solid var(--k-p10)" }}>
                  <p className="text-xs mb-1" style={{ color:"var(--k-t40)" }}>{s.l}</p>
                  <p className="text-base font-black font-mono" style={{ color:s.c }}>{s.v}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-3 text-xs" style={{ color:"var(--k-t40)" }}>
              <span>📊 {summary.totalTrades} total trades</span>
              <span>📅 {summary.tradesPerMonth}/month avg</span>
              <span>🏆 Best streak: {summary.maxWinStreak} wins</span>
              <span>📉 Worst streak: {summary.maxLossStreak} losses</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 5 behavioral scores ── */}
      <section>
        <p className="section-label mb-3">Behavioral Metrics</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <MetricBar
            label="Loss Aversion"
            score={scores.lossAversion.score}
            scoreLabel={scores.lossAversion.label}
            description={`You hold losing trades ${scores.lossAversion.ratio}× longer than winning ones. ${scores.lossAversion.score > 60 ? "This is the #1 account killer." : "This is manageable."}`}
            invertColor={true}
          />
          <MetricBar
            label="Overtrading"
            score={scores.overtrading.score}
            scoreLabel={scores.overtrading.label}
            description={`${scores.overtrading.tpm} trades/month. ${scores.overtrading.score > 60 ? "High frequency increases costs and emotional decisions." : "Frequency looks healthy."}`}
            invertColor={true}
          />
          <MetricBar
            label="Impulsivity"
            score={scores.impulsivity.score}
            scoreLabel={scores.impulsivity.label}
            description={`${scores.impulsivity.rate}% of trades closed in under 3 days. ${scores.impulsivity.score > 50 ? "May indicate FOMO entries or panic exits." : "Good patience shown."}`}
            invertColor={true}
          />
          <MetricBar
            label="Disposition Effect"
            score={scores.disposition.score}
            scoreLabel={scores.disposition.label}
            description={`Tendency to sell winners too early while holding losers. ${scores.disposition.score > 50 ? "Classic retail trader error — emotionally driven exits." : "Reasonably controlled."}`}
            invertColor={true}
          />
          <MetricBar
            label="Risk Discipline"
            score={scores.riskDiscipline.score}
            scoreLabel={scores.riskDiscipline.label}
            description={`Risk/Reward ratio: ${scores.riskDiscipline.rr}:1. ${scores.riskDiscipline.score > 60 ? "Winning trades are bigger than losing ones." : "Aim for at least 1.5:1 R:R."}`}
            invertColor={false}
          />
          {/* Hold times comparison */}
          <div className="p-4 rounded-2xl" style={{ background:"var(--k-b50)", border:"1px solid var(--k-p12)" }}>
            <p className="text-sm font-bold mb-3" style={{ color:"var(--k-tx)" }}>Avg Hold Time</p>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-xs w-20 shrink-0" style={{ color:"rgba(74,222,128,0.7)" }}>Winners</span>
                <div className="flex-1 h-4 rounded-lg overflow-hidden" style={{ background:"rgba(74,222,128,0.08)" }}>
                  <div className="h-full rounded-lg" style={{ width:`${Math.min(100,(summary.avgWinDays/Math.max(summary.avgWinDays,summary.avgLossDays))*100)}%`, background:"rgba(74,222,128,0.5)" }}/>
                </div>
                <span className="text-xs font-mono font-bold w-14 text-right" style={{ color:"#4ade80" }}>{summary.avgWinDays}d</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs w-20 shrink-0" style={{ color:"rgba(248,113,113,0.7)" }}>Losers</span>
                <div className="flex-1 h-4 rounded-lg overflow-hidden" style={{ background:"rgba(248,113,113,0.08)" }}>
                  <div className="h-full rounded-lg" style={{ width:`${Math.min(100,(summary.avgLossDays/Math.max(summary.avgWinDays,summary.avgLossDays))*100)}%`, background:"rgba(248,113,113,0.5)" }}/>
                </div>
                <span className="text-xs font-mono font-bold w-14 text-right" style={{ color:"#f87171" }}>{summary.avgLossDays}d</span>
              </div>
            </div>
            <p className="text-[10px] mt-2" style={{ color:"var(--k-t30)" }}>
              {summary.avgLossDays > summary.avgWinDays
                ? `⚠️ Holding losers ${(summary.avgLossDays/Math.max(summary.avgWinDays,0.1)).toFixed(1)}× longer than winners`
                : `✅ Winners held longer than losers — good discipline`}
            </p>
          </div>
        </div>
      </section>

      {/* ── Patterns & traits ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Behavioral traits */}
        {traits.length > 0 && (
          <section>
            <p className="section-label mb-3">Detected Patterns</p>
            <div className="space-y-2">
              {traits.map((t, i) => <TraitCard key={i} trait={t}/>)}
            </div>
          </section>
        )}

        {/* Day of week */}
        <section>
          <p className="section-label mb-3">Trading Patterns</p>
          <DayChart dowStats={patterns.dowStats}/>
          {(patterns.bestDay || patterns.worstDay) && (
            <div className="grid grid-cols-2 gap-2 mt-3">
              {patterns.bestDay && (
                <div className="p-3 rounded-2xl" style={{ background:"rgba(74,222,128,0.06)", border:"1px solid rgba(74,222,128,0.15)" }}>
                  <p className="text-[10px] font-bold uppercase" style={{ color:"rgba(74,222,128,0.6)" }}>Best Day</p>
                  <p className="text-base font-black mt-0.5" style={{ color:"#4ade80" }}>{patterns.bestDay.label}</p>
                  <p className="text-xs" style={{ color:"rgba(74,222,128,0.6)" }}>{patterns.bestDay.winRate}% win rate</p>
                </div>
              )}
              {patterns.worstDay && (
                <div className="p-3 rounded-2xl" style={{ background:"rgba(248,113,113,0.06)", border:"1px solid rgba(248,113,113,0.15)" }}>
                  <p className="text-[10px] font-bold uppercase" style={{ color:"rgba(248,113,113,0.6)" }}>Worst Day</p>
                  <p className="text-base font-black mt-0.5" style={{ color:"#f87171" }}>{patterns.worstDay.label}</p>
                  <p className="text-xs" style={{ color:"rgba(248,113,113,0.6)" }}>{patterns.worstDay.winRate}% win rate</p>
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {/* ── Recommendations ── */}
      {recommendations?.length > 0 && (
        <section>
          <p className="section-label mb-3">Action Plan</p>
          <div className="space-y-2">
            {recommendations.map((r, i) => (
              <div key={i} className="flex items-start gap-3 p-4 rounded-2xl"
                style={{ background:"var(--k-p05)", border:"1px solid var(--k-p12)" }}>
                <span className="text-sm font-black shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px]"
                  style={{ background:"var(--k-p15)", color:"var(--k-p)" }}>{i+1}</span>
                <p className="text-sm leading-relaxed" style={{ color:"var(--k-t65)" }}>{r}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── AI Deep Analysis ── */}
      <section>
        <p className="section-label mb-3">AI Deep Analysis</p>
        <div className="rounded-3xl overflow-hidden"
          style={{
            background:"linear-gradient(135deg,var(--k-d20),var(--k-p08))",
            border:"1px solid var(--k-p20)",
          }}>
          {!aiDone && !aiLoading && (
            <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <div className="flex-1">
                <p className="font-black text-base mb-1" style={{ color:"var(--k-tx)" }}>Get your personalized trading coach report</p>
                <p className="text-sm" style={{ color:"var(--k-t45)" }}>
                  Claude AI will analyze your specific numbers and give you a direct, actionable behavioral assessment — not generic advice.
                </p>
              </div>
              <button onClick={runAIAnalysis} className="btn-primary gap-2 shrink-0">
                <Zap size={15}/>Run AI Analysis
              </button>
            </div>
          )}

          {aiLoading && (
            <div className="p-8 flex flex-col items-center gap-4">
              <div className="relative w-14 h-14">
                <div className="absolute inset-0 rounded-2xl animate-spin-slow"
                  style={{ border:"2px solid transparent", borderTopColor:"var(--k-p60)" }}/>
                <div className="absolute inset-2 rounded-xl flex items-center justify-center" style={{ background:"var(--k-p08)" }}>
                  <Brain size={20} style={{ color:"var(--k-p)" }}/>
                </div>
              </div>
              <p className="text-sm" style={{ color:"var(--k-t50)" }}>Analyzing your behavioral patterns…</p>
            </div>
          )}

          {aiDone && aiAnalysis && (
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Brain size={16} style={{ color:"var(--k-p)" }}/>
                <p className="text-sm font-bold" style={{ color:"var(--k-tx)" }}>Your Trading Coach Report</p>
              </div>
              <div className="text-sm leading-relaxed whitespace-pre-wrap"
                style={{ color:"var(--k-t65)" }}>
                {aiAnalysis}
              </div>
              <button onClick={() => { setAiDone(false); setAiAnalysis(""); }}
                className="mt-4 text-xs font-bold transition-colors"
                style={{ color:"var(--k-p50)" }}
                onMouseEnter={e => e.currentTarget.style.color = "var(--k-p)"}
                onMouseLeave={e => e.currentTarget.style.color = "var(--k-p50)"}>
                ↺ Re-run analysis
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
