import React, { useState, useEffect } from "react";
import { Newspaper, ExternalLink, Loader2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import api from "../services/api";
import { formatDistanceToNow } from "date-fns";
import clsx from "clsx";

const SentimentBadge = ({ sentiment }) => {
  if (!sentiment) return null;
  const map = {
    POSITIVE: { cls: "badge-green", icon: <TrendingUp  size={10}/>, label:"Positive" },
    NEGATIVE: { cls: "badge-red",   icon: <TrendingDown size={10}/>, label:"Negative" },
    NEUTRAL:  { cls: "badge-yellow",icon: <Minus size={10}/>,        label:"Neutral"  },
  };
  const s = map[sentiment.label] || map.NEUTRAL;
  return <span className={`badge ${s.cls}`}>{s.icon}{s.label}</span>;
};

export default function NewsPanel({ symbol }) {
  const [articles, setArticles] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  useEffect(() => {
    if (!symbol) return;
    setLoading(true); setError(null);
    api.get(`/news/${symbol}?limit=12`)
      .then(r  => setArticles(r.data.articles || []))
      .catch(() => setError("News unavailable"))
      .finally(() => setLoading(false));
  }, [symbol]);

  if (loading) return (
    <div className="card p-5 space-y-3">
      {[...Array(4)].map((_,i) => (
        <div key={i} className="flex gap-3">
          <div className="skeleton w-16 h-16 rounded-lg shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-3 w-3/4" />
            <div className="skeleton h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );

  if (error) return (
    <div className="card p-6 text-center text-slate-400 text-sm">
      <Newspaper size={28} className="mx-auto mb-2 opacity-40" />
      {error}
    </div>
  );

  if (!articles.length) return (
    <div className="card p-6 text-center text-slate-400 text-sm">
      <Newspaper size={28} className="mx-auto mb-2 opacity-40" />
      No recent news found
    </div>
  );

  // Sentiment breakdown
  const pos = articles.filter(a => a.sentiment?.label === "POSITIVE").length;
  const neg = articles.filter(a => a.sentiment?.label === "NEGATIVE").length;
  const neu = articles.length - pos - neg;

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Newspaper size={16} className="text-brand-400" />
          Latest News
        </h3>
        <div className="flex gap-2">
          <span className="badge-green badge text-xs">{pos} pos</span>
          <span className="badge-red   badge text-xs">{neg} neg</span>
          <span className="badge-yellow badge text-xs">{neu} neu</span>
        </div>
      </div>

      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
        {articles.map(a => (
          <a key={a.id || a.url} href={a.url} target="_blank" rel="noopener noreferrer"
            className="flex gap-3 p-3 rounded-xl dark:hover:bg-white/[0.04] hover:bg-slate-50 transition-colors group block">
            {a.thumbnail ? (
              <img src={a.thumbnail} alt="" className="w-16 h-14 object-cover rounded-lg shrink-0 dark:opacity-80" />
            ) : (
              <div className="w-16 h-14 rounded-lg bg-brand-500/10 flex items-center justify-center shrink-0">
                <Newspaper size={20} className="text-brand-400/50" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium dark:text-white text-slate-900 line-clamp-2 group-hover:text-brand-400 transition-colors leading-snug">
                {a.title}
              </p>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                {a.source && <span className="text-xs dark:text-slate-500 text-slate-400">{a.source}</span>}
                {a.publishedAt && (
                  <span className="text-xs dark:text-slate-600 text-slate-400">
                    {formatDistanceToNow(new Date(a.publishedAt * 1000), { addSuffix: true })}
                  </span>
                )}
                <SentimentBadge sentiment={a.sentiment} />
              </div>
            </div>
            <ExternalLink size={13} className="shrink-0 mt-1 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          </a>
        ))}
      </div>
    </div>
  );
}
