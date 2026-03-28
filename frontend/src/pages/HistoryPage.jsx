import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  History,
  TrendingUp,
  FileText,
  Calendar,
  Award,
  RefreshCw,
  BarChart3,
} from "lucide-react";
import PageWrapper from "../components/PageWrapper";
import { useResume } from "../context/ResumeContext";
import { getHistory } from "../services/api";
function Sparkline({ data, color = "#06b6d4" }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 120,
    h = 40,
    pad = 4;
  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return `${x},${y}`;
  });
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      className="overflow-visible"
    >
      <defs>
        <linearGradient
          id={`sg-${color.replace("#", "")}`}
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {pts.map((pt, i) => {
        const [x, y] = pt.split(",").map(Number);
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r="2.5"
            fill={color}
            fillOpacity="0.9"
          />
        );
      })}
    </svg>
  );
}
const scoreColor = (s) =>
  s >= 80 ? "text-emerald-400" : s >= 60 ? "text-amber-400" : "text-rose-400";
const scoreBg = (s) =>
  s >= 80
    ? "bg-emerald-500/10 border-emerald-500/20"
    : s >= 60
      ? "bg-amber-500/10 border-amber-500/20"
      : "bg-rose-500/10 border-rose-500/20";
const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const rowVariants = {
  hidden: { opacity: 0, x: -16 },
  show: { opacity: 1, x: 0, transition: { duration: 0.4, ease: "easeOut" } },
};
export default function HistoryPage() {
  const { history, setHistory } = useResume();
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (history.length === 0) {
      setLoading(true);
      getHistory()
        .then((d) => setHistory(d))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, []);
  const refresh = () => {
    setLoading(true);
    getHistory()
      .then((d) => setHistory(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  return (
    <PageWrapper>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <span className="badge-indigo mb-4 inline-flex">
          <History size={11} /> Analysis Log
        </span>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-nexus-text">
              Resume <span className="text-gradient-indigo">History</span>
            </h1>
            <p className="text-nexus-muted text-sm mt-1">
              Track your score improvements across iterations
            </p>
          </div>
          <button
            onClick={refresh}
            className="btn-secondary text-sm"
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </motion.div>

      <div className="glass-card p-6 mb-8">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="text-primary w-5 h-5" />
          <h2 className="font-bold text-foreground text-lg">Score Progress Over Time</h2>
          <span className="ml-auto badge bg-primary/10 text-primary border-primary/25 text-xs">
            {history.length} analyses
          </span>
        </div>
        
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6">
            <BarChart3 className="text-muted-foreground/30 w-12 h-12 mb-3" />
            <p className="text-sm text-muted-foreground">No history yet — analyze your first resume</p>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((item, i) => (
              <div key={item.id || i} className="flex items-center gap-4">
                <div className="text-xs font-mono text-muted-foreground w-20 shrink-0">
                  {new Date(item.date || Date.now()).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" })}
                </div>
                <div className="text-xs text-muted-foreground truncate w-28 shrink-0">
                  {item.job_role || item.filename || "Unknown"}
                </div>
                <div className="flex-1 h-2 bg-muted/30 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.overall_score || 0}%` }}
                    transition={{ duration: 1, ease: "easeOut", delay: i * 0.1 }}
                    className="h-full bg-gradient-to-r from-[#33cc33] to-[#66d9ef] rounded-full"
                  />
                </div>
                <div className="text-xs font-bold text-primary w-8 text-right shrink-0">
                  {item.overall_score || 0}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {history.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8"
        >
          {[
            {
              icon: FileText,
              label: "Total Analyses",
              value: history.length,
              color: "text-cyan-400",
            },
            {
              icon: TrendingUp,
              label: "Avg Score",
              value: Math.round(
                history.reduce((a, h) => a + (h.overall_score || 0), 0) /
                  history.length,
              ),
              color: "text-indigo-400",
            },
            {
              icon: Award,
              label: "Best Score",
              value: Math.max(...history.map((h) => h.overall_score || 0)),
              color: "text-emerald-400",
            },
            {
              icon: Calendar,
              label: "Days Active",
              value:
                Math.ceil(
                  (new Date() -
                    new Date(history[history.length - 1]?.date || Date.now())) /
                    86400000,
                ) || 1,
              color: "text-amber-400",
            },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="glass-card-sm p-4">
              <div className={`text-2xl font-black ${color} mb-1`}>{value}</div>
              <div className="text-xs text-nexus-muted flex items-center gap-1">
                <Icon size={11} /> {label}
              </div>
            </div>
          ))}
        </motion.div>
      )}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-nexus-muted gap-3">
          <RefreshCw size={20} className="animate-spin text-nexus-cyan" />
          <span>Loading history...</span>
        </div>
      ) : history.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <History
            size={40}
            className="text-nexus-muted mx-auto mb-4 opacity-40"
          />
          <p className="text-nexus-muted">
            No analysis history yet. Upload a resume to get started.
          </p>
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          <div className="hidden md:block glass-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  {[
                    "File / Role",
                    "Date",
                    "Scores",
                    "Progress Timeline",
                    "ATS Keywords Missing",
                    "Status",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left text-xs font-semibold text-nexus-muted px-5 py-4 uppercase tracking-wide"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map((item, i) => (
                  <motion.tr
                    key={item.id || i}
                    variants={rowVariants}
                    className="border-b border-white/4 hover:bg-white/3 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center shrink-0">
                          <FileText size={14} className="text-indigo-400" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-nexus-text truncate max-w-[140px]">
                            {item.filename}
                          </p>
                          <p className="text-xs text-nexus-muted">
                            {item.job_role}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm text-nexus-muted">
                        {new Date(item.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1">
                        <span
                          className={`text-lg font-black ${scoreColor(item.overall_score)}`}
                        >
                          {item.overall_score}
                        </span>
                        <div className="flex gap-1 text-[10px] text-nexus-muted">
                          <span>ATS: {item.ats_score}</span>
                          <span>·</span>
                          <span>Clarity: {item.clarity_score}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <Sparkline
                        data={item.score_history || [item.overall_score]}
                      />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1 max-w-[160px]">
                        {(item.keywords_missing || []).slice(0, 3).map((k) => (
                          <span
                            key={k}
                            className="px-1.5 py-0.5 rounded text-[10px] bg-rose-500/10 text-rose-300 border border-rose-500/15"
                          >
                            {k}
                          </span>
                        ))}
                        {(item.keywords_missing || []).length > 3 && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-white/5 text-nexus-muted">
                            +{(item.keywords_missing || []).length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`badge text-[10px] border ${scoreBg(item.overall_score)} ${scoreColor(item.overall_score)}`}
                      >
                        {item.overall_score >= 80
                          ? "⬤ Excellent"
                          : item.overall_score >= 60
                            ? "⬤ Good"
                            : "⬤ Needs Work"}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="md:hidden space-y-4">
            {history.map((item, i) => (
              <motion.div
                key={item.id || i}
                variants={rowVariants}
                className="glass-card p-5"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-nexus-text">
                      {item.filename}
                    </p>
                    <p className="text-xs text-nexus-muted">{item.job_role}</p>
                  </div>
                  <span
                    className={`text-2xl font-black ${scoreColor(item.overall_score)}`}
                  >
                    {item.overall_score}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <Sparkline
                    data={item.score_history || [item.overall_score]}
                  />
                  <span
                    className={`badge text-[10px] border ${scoreBg(item.overall_score)} ${scoreColor(item.overall_score)}`}
                  >
                    {item.overall_score >= 80
                      ? "Excellent"
                      : item.overall_score >= 60
                        ? "Good"
                        : "Needs Work"}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </PageWrapper>
  );
}
