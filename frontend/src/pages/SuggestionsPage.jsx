import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Lightbulb,
  Copy,
  CheckCheck,
  Key,
  AlignLeft,
  BarChart3,
  ChevronRight,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import PageWrapper from "../components/PageWrapper";
import { useResume } from "../context/ResumeContext";
const ICON_MAP = {
  keywords: Key,
  formatting: AlignLeft,
  impact: BarChart3,
  default: Lightbulb,
};
const COLOR_MAP = {
  critical: {
    bg: "bg-rose-500/10 dark:bg-rose-500/10",
    border: "border-rose-500/20 dark:border-rose-500/20",
    badge: "bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/30",
    dot: "bg-rose-500 dark:bg-rose-400",
  },
  high: {
    bg: "bg-amber-500/10 dark:bg-amber-500/10",
    border: "border-amber-500/20 dark:border-amber-500/20",
    badge: "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30",
    dot: "bg-amber-500 dark:bg-amber-400",
  },
  medium: {
    bg: "bg-indigo-500/10 dark:bg-indigo-500/10",
    border: "border-indigo-500/20 dark:border-indigo-500/20",
    badge: "bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-500/30",
    dot: "bg-indigo-500 dark:bg-indigo-400",
  },
  low: {
    bg: "bg-muted/30 dark:bg-white/5",
    border: "border-border/50 dark:border-white/10",
    badge: "bg-muted text-muted-foreground border-border/50",
    dot: "bg-muted-foreground",
  },
};
function buildSuggestions(analysisResult) {
  const items = [];
  if (!analysisResult) return items;
  const { weaknesses = [], ats_keywords_missing = [] } = analysisResult;
  weaknesses.forEach((w, i) => {
    const priority = i === 0 ? "critical" : i < 2 ? "high" : "medium";
    items.push({
      id: `weakness-${i}`,
      type: "impact",
      title: `Fix: ${w.slice(0, 60)}${w.length > 60 ? "…" : ""}`,
      detail: w,
      priority,
      action:
        'Rewrite bullet points to quantify results (e.g., "Increased throughput by 40%").',
    });
  });
  if (ats_keywords_missing.length > 0) {
    items.push({
      id: "keywords",
      type: "keywords",
      title: `Add ${ats_keywords_missing.length} Missing ATS Keywords`,
      detail: `Your resume is missing: ${ats_keywords_missing.slice(0, 8).join(", ")}${ats_keywords_missing.length > 8 ? ` and ${ats_keywords_missing.length - 8} more…` : ""}`,
      priority: "critical",
      action: `Weave in these terms naturally: "${ats_keywords_missing.slice(0, 5).join('", "')}"`,
    });
  }
  items.push(
    {
      id: "format-1",
      type: "formatting",
      title: "Use Consistent Date Formats",
      detail:
        'ATS parsers fail when mixing formats (e.g., "Jan 2022" vs "2022-01"). Standardize to "Month YYYY".',
      priority: "medium",
      action: 'Audit all date entries and use "Mon YYYY" format throughout.',
    },
    {
      id: "format-2",
      type: "formatting",
      title: "Limit Resume to 1–2 Pages",
      detail: "Resumes beyond 2 pages are discarded by 73% of recruiters.",
      priority: "high",
      action:
        "Remove positions older than 10 years; consolidate early career entries.",
    },
    {
      id: "impact-1",
      type: "impact",
      title: "Add Quantified Results to Every Bullet",
      detail:
        "Bullets without metrics are 60% less impactful. Use the STAR method.",
      priority: "medium",
      action:
        "Use the Bullet Improver to upgrade each bullet with metrics and action verbs.",
    },
  );
  return items;
}
function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handle = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      onClick={handle}
      className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all shadow-sm
        ${copied ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "border-border bg-card/60 text-muted-foreground hover:text-foreground hover:border-primary/30"}`}
    >
      {copied ? <CheckCheck size={12} /> : <Copy size={12} />}
      {copied ? "Copied!" : "Copy fix"}
    </button>
  );
}
const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09 } },
};
const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0, transition: { duration: 0.4, ease: "easeOut" } },
};
export default function SuggestionsPage() {
  const navigate = useNavigate();
  const { analysisResult, jobRole } = useResume();
  const [filter, setFilter] = useState("all");
  if (!analysisResult) {
    return (
      <PageWrapper>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="w-16 h-16 bg-card/50 border border-border rounded-2xl flex items-center justify-center mb-6 shadow-sm">
            <Lightbulb size={28} className="text-muted-foreground" />
          </div>
          <h1 className="text-3xl font-black text-nexus-text mb-3">No AI Fixes Found</h1>
          <p className="text-nexus-muted mb-6">Please upload and analyze a resume to view actionable suggestions.</p>
          <Link to="/upload" className="btn-primary py-3 px-6">Upload Resume</Link>
        </div>
      </PageWrapper>
    );
  }
  const suggestions = buildSuggestions(analysisResult);
  const filtered =
    filter === "all"
      ? suggestions
      : suggestions.filter((s) => s.priority === filter);
  const counts = suggestions.reduce(
    (a, s) => ({ ...a, [s.priority]: (a[s.priority] || 0) + 1 }),
    {},
  );
  return (
    <PageWrapper>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <span className="badge-indigo mb-4 inline-flex">
          <Sparkles size={11} /> AI Suggestions
        </span>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-foreground">
              Optimization <span className="text-gradient-cyan">Roadmap</span>
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {suggestions.length} actionable fixes for{" "}
              <span className="text-primary font-semibold">{jobRole}</span>
            </p>
          </div>
          <Link to="/bullet" className="btn-primary text-sm shrink-0">
            Bullet Improver <ArrowRight size={14} />
          </Link>
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-wrap gap-2 mb-6"
      >
        {[
          { key: "all", label: `All (${suggestions.length})` },
          { key: "critical", label: `🔴 Critical (${counts.critical || 0})` },
          { key: "high", label: `🟠 High (${counts.high || 0})` },
          { key: "medium", label: `🔵 Medium (${counts.medium || 0})` },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold border transition-all shadow-sm
              ${
                filter === key
                  ? "bg-primary/10 border-primary/30 text-primary"
                  : "bg-card/40 border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
              }`}
          >
            {label}
          </button>
        ))}
      </motion.div>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="relative"
      >
        <div className="absolute left-[22px] top-6 bottom-6 w-px bg-gradient-to-b from-cyan-500/30 via-indigo-500/20 to-transparent" />
        <div className="space-y-4 ml-12">
          {filtered.map((item, i) => {
            const Icon = ICON_MAP[item.type] || ICON_MAP.default;
            const c = COLOR_MAP[item.priority] || COLOR_MAP.low;
            return (
              <motion.div
                key={item.id}
                variants={itemVariants}
                className={`relative glass-card-sm p-5 ${c.bg} ${c.border} hover:-translate-y-0.5 transition-transform`}
              >
                <div
                  className={`absolute -left-[49px] top-5 w-3 h-3 rounded-full ${c.dot} border-2 border-navy-900 ring-1 ring-current`}
                />
                <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                  <div className="flex items-center gap-3 flex-1">
                    <div
                      className={`w-8 h-8 rounded-lg bg-card/60 border ${c.border} flex items-center justify-center shrink-0 shadow-sm`}
                    >
                      <Icon size={15} className="text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-bold text-sm text-foreground">
                          {item.title}
                        </h3>
                        <span className={`badge text-[10px] ${c.badge}`}>
                          {item.priority}
                        </span>
                      </div>
                      <p className="text-xs text-nexus-muted leading-relaxed">
                        {item.detail}
                      </p>
                    </div>
                  </div>
                  <CopyButton text={item.action} />
                </div>
                <div className="mt-3 ml-11 flex items-start gap-2 p-3 rounded-lg bg-card border border-border/60 shadow-sm">
                  <ChevronRight
                    size={13}
                    className="text-primary mt-0.5 shrink-0"
                  />
                  <p className="text-xs text-foreground font-medium leading-relaxed">
                    {item.action}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </PageWrapper>
  );
}
