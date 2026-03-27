import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Copy,
  CheckCheck,
  Loader2,
  RotateCcw,
  ChevronRight,
  Zap,
  Type,
  Wand2,
} from "lucide-react";
import PageWrapper from "../components/PageWrapper";
import ErrorBanner from "../components/ErrorBanner";
import { useResume } from "../context/ResumeContext";
import { improveBullet } from "../services/api";
import { ContextualAIBar } from "../components/Watermelon/ContextualAIBar";

const EXAMPLES = [
  "Worked on the new website front-end.",
  "Helped with customer support tasks.",
  "Maintained the database.",
  "Did some machine learning stuff for the team.",
  "Was responsible for testing the application.",
];

const STAR_ORDER = ["situation", "task", "action", "result"];

function normalizeWord(w) {
  return w.replace(/[^a-zA-Z0-9%]/g, "").toLowerCase();
}

/** Consume original word multiset in order so duplicate words match correctly. */
function buildWordBag(text) {
  const bag = new Map();
  const tokens = text.match(/\S+/g) || [];
  for (const t of tokens) {
    const k = normalizeWord(t);
    if (!k) continue;
    bag.set(k, (bag.get(k) || 0) + 1);
  }
  return bag;
}

function diffParts(original, improved) {
  if (!improved) return { parts: [], newCount: 0, wordCount: 0 };
  const bag = buildWordBag(original || "");
  const chunks = improved.match(/\S+|\s+/g) || [];
  let newCount = 0;
  let wordCount = 0;
  const parts = chunks.map((chunk) => {
    if (/^\s+$/.test(chunk)) return { type: "space", text: chunk };
    wordCount += 1;
    const k = normalizeWord(chunk);
    const available = k ? bag.get(k) || 0 : 0;
    const fromOriginal = k && available > 0;
    if (fromOriginal) bag.set(k, available - 1);
    const isNew = !fromOriginal;
    if (isNew) newCount += 1;
    return { type: "word", text: chunk, isNew };
  });
  return { parts, newCount, wordCount };
}

/** If most words are "new", per-word pills make the whole line unreadable — show plain text. */
const NEW_WORD_RATIO_PLAIN = 0.32;

function DiffHighlight({ original, improved }) {
  const { parts, newCount, wordCount, mostlyRewritten } = useMemo(() => {
    const d = diffParts(original, improved);
    const ratio = d.wordCount ? d.newCount / d.wordCount : 0;
    return {
      ...d,
      mostlyRewritten: ratio >= NEW_WORD_RATIO_PLAIN || d.wordCount === 0,
    };
  }, [original, improved]);

  if (!improved) return null;

  if (mostlyRewritten) {
    return (
      <div className="space-y-2">
        <p className="text-base sm:text-lg leading-relaxed font-medium text-neutral-900 dark:text-white">
          {improved}
        </p>
        <p className="text-xs text-neutral-600 dark:text-nexus-muted leading-relaxed">
          This version rewrites most of your original wording for stronger impact. Compare with{" "}
          <span className="font-semibold text-neutral-800 dark:text-nexus-text">Original</span> below.
        </p>
      </div>
    );
  }

  return (
    <p className="text-base sm:text-[1.05rem] leading-relaxed font-medium text-neutral-900 dark:text-white">
      {parts.map((p, i) =>
        p.type === "space" ? (
          <span key={i}>{p.text}</span>
        ) : (
          <span
            key={i}
            className={
              p.isNew
                ? "rounded-md px-1 py-0.5 mx-0.5 border font-semibold bg-amber-100 text-neutral-900 border-amber-700 shadow-sm dark:bg-emerald-600 dark:text-white dark:border-emerald-400 dark:shadow-none"
                : "text-neutral-800 dark:text-white/95"
            }
          >
            {p.text}
          </span>
        ),
      )}
    </p>
  );
}

function CopyBtn({ text }) {
  const [c, setC] = useState(false);
  const go = () => {
    navigator.clipboard.writeText(text);
    setC(true);
    setTimeout(() => setC(false), 2000);
  };
  return (
    <button
      type="button"
      onClick={go}
      className={`flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl border transition-all shrink-0
      ${c ? "border-emerald-600 bg-emerald-100 text-emerald-900 dark:border-emerald-500/50 dark:bg-emerald-500/15 dark:text-emerald-200" : "border-neutral-300 bg-neutral-100 text-neutral-900 hover:bg-neutral-200 dark:border-white/15 dark:bg-white/10 dark:text-nexus-text dark:hover:bg-white/15"}`}
    >
      {c ? <CheckCheck size={14} /> : <Copy size={14} />}
      {c ? "Copied" : "Copy"}
    </button>
  );
}

function SectionLabel({ children }) {
  return (
    <p className="text-[11px] font-bold text-nexus-text uppercase tracking-[0.12em] mb-2">
      {children}
    </p>
  );
}

function formatStarEntry([k, v]) {
  const label = k.charAt(0).toUpperCase() + k.slice(1);
  const text = v == null ? "" : typeof v === "string" ? v : String(v);
  return { key: k, label, text };
}

export default function BulletImproverPage() {
  const { jobRole, analysisResult } = useResume();
  const [bullet, setBullet] = useState("");
  const [result, setResult] = useState(null);
  const [localLoading, setLocalLoading] = useState(false);
  const [error, setError] = useState(null);
  const starBullets = analysisResult?.star_bullets || {};
  const preloaded = Object.entries(starBullets).slice(0, 4);

  const improve = async () => {
    if (!bullet.trim()) {
      setError("Please enter a bullet point to improve.");
      return;
    }
    setLocalLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await improveBullet(bullet, jobRole);
      setResult(data);
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          "Backend unavailable. Please try again later.",
      );
    } finally {
      setLocalLoading(false);
    }
  };

  const orderedMetrics = useMemo(() => {
    if (!result?.metrics || typeof result.metrics !== "object") return [];
    const m = result.metrics;
    const rows = [];
    for (const key of STAR_ORDER) {
      if (m[key] != null && String(m[key]).trim())
        rows.push(formatStarEntry([key, m[key]]));
    }
    for (const [k, v] of Object.entries(m)) {
      if (STAR_ORDER.includes(k)) continue;
      if (v != null && String(v).trim()) rows.push(formatStarEntry([k, v]));
    }
    return rows;
  }, [result]);

  return (
    <PageWrapper>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <span className="badge-cyan mb-4 inline-flex">
          <Sparkles size={11} /> STAR Bullet Engine
        </span>
        <h1 className="text-3xl font-black text-nexus-text">
          Bullet <span className="text-gradient-cyan">Improver</span>
        </h1>
        <p className="text-nexus-muted text-sm mt-1">
          Transform vague bullets into STAR-method impact statements with
          quantifiable metrics.
        </p>
      </motion.div>
      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          <div className="glass-card p-5">
            <label className="block text-sm font-semibold text-nexus-text mb-3">
              Original Bullet Point
            </label>
            <textarea
              value={bullet}
              onChange={(e) => setBullet(e.target.value)}
              placeholder="e.g. Worked on the new website front-end."
              rows={5}
              className="nexus-input resize-none text-sm leading-relaxed"
            />
            <div className="flex items-center justify-between mt-3">
              <button
                type="button"
                onClick={() => setBullet("")}
                className="btn-ghost text-xs py-1.5"
              >
                <RotateCcw size={12} /> Clear
              </button>
              <span className="text-xs text-nexus-muted">{bullet.length} chars</span>
            </div>

            <div className="mt-6 flex justify-center">
              <ContextualAIBar
                placeholder="Ask AI to refine this bullet..."
                onSend={(val) => {
                  setBullet((prev) => prev + " " + val);
                  improve();
                }}
                tools={[
                  { id: "shorten", icon: <Zap size={16} /> },
                  { id: "professional", icon: <Type size={16} /> },
                  { id: "action", icon: <Wand2 size={16} /> },
                ]}
                onToolClick={(id) => {
                  if (id === "shorten") setBullet((prev) => prev + " (make it concise)");
                  if (id === "professional")
                    setBullet((prev) => prev + " (make it more professional)");
                  if (id === "action")
                    setBullet((prev) => prev + " (add stronger action verbs)");
                  improve();
                }}
              />
            </div>
          </div>
          <ErrorBanner message={error} onDismiss={() => setError(null)} />
          <button
            type="button"
            onClick={improve}
            disabled={localLoading || !bullet.trim()}
            className={`w-full btn-primary justify-center py-4 text-sm ${!bullet.trim() || localLoading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {localLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Rewriting with AI...
              </>
            ) : (
              <>
                <Sparkles size={16} /> Improve This Bullet
              </>
            )}
          </button>
          <div className="glass-card-sm p-4 border border-white/10">
            <p className="text-xs font-bold text-nexus-text mb-3 uppercase tracking-wide">
              Try an example
            </p>
            <div className="space-y-1.5">
              {EXAMPLES.map((ex, i) => (
                <button
                  type="button"
                  key={i}
                  onClick={() => {
                    setBullet(ex);
                    setResult(null);
                    setError(null);
                  }}
                  className="w-full text-left text-sm text-nexus-muted hover:text-nexus-text px-3 py-2.5 rounded-xl hover:bg-white/5 transition-all flex items-center gap-2 border border-transparent hover:border-white/10"
                >
                  <ChevronRight size={12} className="text-primary shrink-0" />
                  {ex}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
          className="space-y-4"
        >
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="rounded-2xl border border-white/15 bg-white/80 dark:bg-white/[0.06] dark:border-white/12 p-5 sm:p-6 shadow-md">
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 border border-emerald-700 px-3 py-1.5 text-xs font-bold text-emerald-900 dark:bg-emerald-500/25 dark:text-emerald-100 dark:border-emerald-400/60">
                      <Sparkles size={12} className="text-emerald-800 dark:text-emerald-200" />
                      AI Enhanced
                    </span>
                    <CopyBtn text={result.improved || ""} />
                  </div>
                  <DiffHighlight
                    original={bullet}
                    improved={result.improved || ""}
                  />
                  <p className="text-xs text-neutral-600 dark:text-nexus-muted mt-4 pt-3 border-t border-neutral-200 dark:border-white/10 leading-relaxed">
                    <span className="font-semibold text-neutral-800 dark:text-emerald-400">Tip:</span>{" "}
                    When only part of the bullet changes, new words show as high-contrast chips. Full
                    rewrites show as plain text so everything stays readable.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/12 bg-white/[0.04] p-5">
                  <SectionLabel>Original</SectionLabel>
                  <p className="text-sm text-nexus-text leading-relaxed font-normal">
                    {bullet || "—"}
                  </p>
                </div>

                {orderedMetrics.length > 0 && (
                  <div className="rounded-2xl border border-white/12 bg-white/[0.04] p-5">
                    <SectionLabel>STAR analysis</SectionLabel>
                    <dl className="space-y-4">
                      {orderedMetrics.map(({ key, label, text }) => (
                        <div key={key} className="border-b border-white/8 pb-4 last:border-0 last:pb-0">
                          <dt className="text-xs font-bold text-primary mb-1.5">{label}</dt>
                          <dd className="text-sm text-nexus-text/95 leading-relaxed">{text}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-10 flex flex-col items-center justify-center text-center min-h-[240px]"
              >
                <Sparkles size={36} className="text-nexus-muted mb-4 opacity-80" />
                <p className="text-nexus-text font-medium">Your improved bullet will appear here</p>
                <p className="text-nexus-muted text-sm mt-2 max-w-xs">
                  Run Improve to see STAR breakdown and highlighted changes.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {preloaded.length > 0 && (
            <div className="rounded-2xl border border-white/12 bg-white/[0.04] p-5">
              <SectionLabel>From your resume analysis</SectionLabel>
              <p className="text-xs text-nexus-muted mb-4 leading-relaxed">
                Suggested rewrites from your last upload. Tap an improved line to use it as your
                input.
              </p>
              <div className="space-y-4">
                {preloaded.map(([orig, imp], i) => {
                  const improvedStr =
                    typeof imp === "string"
                      ? imp
                      : imp != null && typeof imp === "object"
                        ? imp.improved || imp.text || JSON.stringify(imp)
                        : String(imp ?? "");
                  const origStr = typeof orig === "string" ? orig : String(orig ?? "");
                  return (
                    <div
                      key={i}
                      className="rounded-xl border border-white/10 bg-navy-900/40 p-4 space-y-3"
                    >
                      <div>
                        <p className="text-[10px] font-bold text-nexus-muted uppercase tracking-wider mb-1">
                          Original
                        </p>
                        <p className="text-sm text-nexus-text/80 line-through decoration-white/25">
                          {origStr}
                        </p>
                      </div>
                      <div className="h-px bg-white/10" />
                      <div>
                        <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-1">
                          Improved
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setBullet(improvedStr);
                            setResult(null);
                            setError(null);
                          }}
                          className="text-left w-full text-sm text-nexus-text leading-relaxed font-medium rounded-lg hover:bg-white/5 p-2 -m-2 transition-colors"
                        >
                          {improvedStr || "—"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </PageWrapper>
  );
}
