import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  FileCheck,
  Swords,
  Loader2,
  Trophy,
  Medal,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  ArrowRight,
  BarChart3,
} from "lucide-react";
import PageWrapper from "../components/PageWrapper";
import ScoreRing from "../components/ScoreRing";
import { battleResumes } from "../services/api";

const LOADING_TEXTS = [
  "Analyzing Challenger 1...",
  "Analyzing Challenger 2...",
  "Running comparison...",
  "Picking the winner...",
];

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};
const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

export default function BattlePage() {
  const [step, setStep] = useState(1);
  const [file1, setFile1] = useState(null);
  const [file2, setFile2] = useState(null);
  const [jobDesc, setJobDesc] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingIdx, setLoadingIdx] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading) return;
    const iv = setInterval(() => setLoadingIdx((i) => (i + 1) % LOADING_TEXTS.length), 1200);
    return () => clearInterval(iv);
  }, [loading]);

  const handleBattle = useCallback(async () => {
    if (!file1 || !file2) return;
    setError("");
    setLoading(true);
    setStep(2);
    setLoadingIdx(0);
    try {
      const data = await battleResumes(file1, file2, jobDesc);
      setResult(data);
      setStep(3);
    } catch (err) {
      setError(err?.response?.data?.error || err.message || "Battle failed");
      setStep(1);
    } finally {
      setLoading(false);
    }
  }, [file1, file2, jobDesc]);

  const reset = () => {
    setStep(1);
    setFile1(null);
    setFile2(null);
    setJobDesc("");
    setResult(null);
    setError("");
  };

  const handleDrop = (setter) => (e) => {
    e.preventDefault();
    const f = e.dataTransfer?.files?.[0];
    if (f) setter(f);
  };

  return (
    <PageWrapper>
      <div className="min-h-screen pt-24 pb-10 px-4">
        <div className="max-w-5xl mx-auto">
          <AnimatePresence mode="wait">

            {/* ─── STEP 1: UPLOAD ─── */}
            {step === 1 && (
              <motion.div
                key="upload"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                {/* Header — same pattern as Dashboard */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-8"
                >
                  <span className="badge-indigo mb-3 inline-flex">
                    <Swords size={11} /> Battle Mode
                  </span>
                  <h1 className="text-3xl font-black text-foreground">
                    Resume{" "}
                    <span className="text-gradient-cyan">Battle</span>
                  </h1>
                  <p className="text-muted-foreground text-sm mt-1">
                    Compare two resumes side-by-side · AI picks the stronger candidate
                  </p>
                </motion.div>

                {/* Upload cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                  {[
                    { file: file1, setFile: setFile1, label: "Resume 1", num: "1" },
                    { file: file2, setFile: setFile2, label: "Resume 2", num: "2" },
                  ].map(({ file, setFile, label, num }) => (
                    <label
                      key={label}
                      onDrop={handleDrop(setFile)}
                      onDragOver={(e) => e.preventDefault()}
                      className={`glass-card p-6 flex flex-col items-center justify-center gap-3 cursor-pointer
                        border-2 border-dashed transition-all duration-200 min-h-[160px]
                        ${file
                          ? "border-primary/40 bg-primary/5"
                          : "border-border hover:border-primary/30 hover:bg-primary/[0.02]"
                        }`}
                    >
                      <input
                        type="file"
                        accept=".pdf,.docx"
                        className="hidden"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                      />
                      {file ? (
                        <>
                          <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center">
                            <FileCheck size={20} className="text-primary" />
                          </div>
                          <span className="text-sm font-medium text-foreground truncate max-w-[200px]">
                            {file.name}
                          </span>
                          <span className="text-xs text-primary flex items-center gap-1 font-medium">
                            <CheckCircle size={12} /> Ready
                          </span>
                        </>
                      ) : (
                        <>
                          <div className="w-10 h-10 rounded-xl bg-muted/50 border border-border flex items-center justify-center">
                            <Upload size={20} className="text-muted-foreground" />
                          </div>
                          <span className="text-sm font-semibold text-foreground">{label}</span>
                          <span className="text-xs text-muted-foreground">
                            Drop PDF / DOCX or click to browse
                          </span>
                        </>
                      )}
                    </label>
                  ))}
                </div>

                {/* Job Description */}
                <div className="glass-card p-4 mb-5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                    Job Description (optional)
                  </label>
                  <textarea
                    rows={3}
                    value={jobDesc}
                    onChange={(e) => setJobDesc(e.target.value)}
                    placeholder="Paste the job description for role-specific comparison…"
                    className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 outline-none resize-none"
                  />
                </div>

                {error && (
                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-destructive/5 border border-destructive/15 mb-5">
                    <AlertTriangle size={14} className="text-destructive mt-0.5 shrink-0" />
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}

                <div className="text-center">
                  <button
                    onClick={handleBattle}
                    disabled={!file1 || !file2 || loading}
                    className="btn-primary px-8 py-3 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <Swords size={16} />}
                    {loading ? "Battling…" : "Start Battle"}
                  </button>
                </div>
              </motion.div>
            )}

            {/* ─── STEP 2: LOADING ─── */}
            {step === 2 && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center min-h-[60vh] gap-6"
              >
                <Loader2 size={40} className="animate-spin text-primary" />
                <AnimatePresence mode="wait">
                  <motion.p
                    key={loadingIdx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="text-lg font-semibold text-foreground"
                  >
                    {LOADING_TEXTS[loadingIdx]}
                  </motion.p>
                </AnimatePresence>
                <p className="text-xs text-muted-foreground">This may take a moment…</p>
              </motion.div>
            )}

            {/* ─── STEP 3: RESULTS ─── */}
            {step === 3 && result && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {/* Header */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
                >
                  <div>
                    <span className="badge-indigo mb-3 inline-flex">
                      <BarChart3 size={11} /> Battle Results
                    </span>
                    <h1 className="text-3xl font-black text-foreground">
                      {result.margin === "Landslide"
                        ? "Landslide "
                        : result.margin === "Clear Win"
                          ? "Clear "
                          : "Close "}
                      <span className="text-gradient-cyan">
                        {result.margin === "Landslide"
                          ? "Victory"
                          : result.margin === "Clear Win"
                            ? "Winner"
                            : "Fight"}
                      </span>
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                      Resume {result.winner} takes the lead · {result.margin}
                    </p>
                  </div>
                  <button onClick={reset} className="btn-secondary text-sm">
                    <RotateCcw size={14} /> New Battle
                  </button>
                </motion.div>

                {/* Results grid — mirroring Dashboard layout */}
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  className="grid lg:grid-cols-12 gap-5"
                >
                  {/* Winner card — larger */}
                  <ResumeCard
                    data={result.winner === 1 ? result.resume1 : result.resume2}
                    label={`Resume ${result.winner}`}
                    isWinner={true}
                    className="lg:col-span-7"
                  />

                  {/* Runner-up card */}
                  <ResumeCard
                    data={result.winner === 1 ? result.resume2 : result.resume1}
                    label={`Resume ${result.winner === 1 ? 2 : 1}`}
                    isWinner={false}
                    className="lg:col-span-5"
                  />

                  {/* Battle Summary card */}
                  <motion.div variants={cardVariants} className="lg:col-span-5 glass-card p-6">
                    <div className="flex items-center gap-2 mb-5">
                      <div className="w-7 h-7 rounded-lg bg-secondary/15 flex items-center justify-center border border-secondary/25">
                        <Swords size={14} className="text-secondary" />
                      </div>
                      <h2 className="font-bold text-foreground">Battle Summary</h2>
                      <span className={`ml-auto badge text-xs ${
                        result.margin === "Landslide"
                          ? "bg-primary/15 text-primary border border-primary/30"
                          : result.margin === "Clear Win"
                            ? "bg-secondary/15 text-secondary border border-secondary/30"
                            : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                      }`}>
                        {result.margin}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                      {result.battle_reason}
                    </p>

                    {result.keyword_edge?.length > 0 && (
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold mb-2">
                          Winner's Keyword Edge
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {result.keyword_edge.map((kw) => (
                            <span
                              key={kw}
                              className="px-2.5 py-1 rounded-lg bg-primary/8 border border-primary/20 text-primary text-xs font-medium"
                            >
                              {kw}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>

                  {/* Score Comparison card */}
                  <motion.div variants={cardVariants} className="lg:col-span-7 glass-card p-6">
                    <div className="flex items-center gap-2 mb-5">
                      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                        <BarChart3 size={14} className="text-primary" />
                      </div>
                      <h2 className="font-bold text-foreground">Score Comparison</h2>
                    </div>
                    <div className="flex items-center justify-around">
                      <ScoreRing
                        score={result.resume1.score}
                        label="Resume 1"
                        color={result.winner === 1 ? "emerald" : "amber"}
                        size={130}
                        thickness={10}
                      />
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">VS</span>
                        <div className="w-px h-12 bg-border" />
                      </div>
                      <ScoreRing
                        score={result.resume2.score}
                        label="Resume 2"
                        color={result.winner === 2 ? "emerald" : "amber"}
                        size={130}
                        thickness={10}
                      />
                    </div>
                  </motion.div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </PageWrapper>
  );
}

/* ─── Resume Card (Winner / Runner-up) ─── */
function ResumeCard({ data, label, isWinner, className = "" }) {
  const scoreColor = data.score >= 80 ? "emerald" : data.score >= 60 ? "amber" : "rose";
  const scoreLabel = data.score >= 80 ? "Excellent" : data.score >= 60 ? "Good" : "Needs Work";
  const scoreBadgeClass =
    data.score >= 80
      ? "badge-emerald"
      : data.score >= 60
        ? "badge-amber"
        : "badge bg-rose-500/20 text-rose-500 dark:text-rose-300 border-rose-500/30";

  return (
    <motion.div
      variants={cardVariants}
      className={`glass-card p-6 relative overflow-hidden ${className} ${
        isWinner ? "ring-2 ring-primary/40" : ""
      }`}
    >
      {/* Badge */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          {isWinner ? (
            <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center border border-primary/25">
              <Trophy size={14} className="text-primary" />
            </div>
          ) : (
            <div className="w-7 h-7 rounded-lg bg-muted/50 flex items-center justify-center border border-border">
              <Medal size={14} className="text-muted-foreground" />
            </div>
          )}
          <h2 className="font-bold text-foreground">{label}</h2>
        </div>
        <div className="flex items-center gap-2">
          {isWinner && (
            <span className="badge-emerald text-[10px]">
              <Trophy size={10} /> Winner
            </span>
          )}
          <span className={scoreBadgeClass}>{scoreLabel}</span>
        </div>
      </div>

      {/* Score */}
      <div className="flex justify-center mb-5">
        <ScoreRing
          score={data.score}
          label="Score"
          color={scoreColor}
          size={120}
          thickness={10}
        />
      </div>

      {/* Verdict */}
      <p className="text-sm text-muted-foreground leading-relaxed mb-5 text-center italic bg-muted/30 rounded-xl p-3 border border-border/50">
        "{data.verdict}"
      </p>

      {/* Strengths */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center border border-primary/20">
            <CheckCircle size={10} className="text-primary" />
          </div>
          <p className="text-xs uppercase tracking-wider text-primary font-semibold">
            Strengths
          </p>
        </div>
        <div className="space-y-2">
          {data.strengths?.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.07 }}
              className="flex items-start gap-2.5 p-2.5 rounded-xl bg-primary/5 border border-primary/15"
            >
              <CheckCircle size={13} className="text-primary mt-0.5 shrink-0" />
              <p className="text-sm text-foreground leading-snug">{s}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Weaknesses */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-5 h-5 rounded-md bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
            <AlertTriangle size={10} className="text-amber-500" />
          </div>
          <p className="text-xs uppercase tracking-wider text-amber-600 dark:text-amber-400 font-semibold">
            Weaknesses
          </p>
        </div>
        <div className="space-y-2">
          {data.weaknesses?.map((w, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.07 }}
              className="flex items-start gap-2.5 p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/15"
            >
              <AlertTriangle size={13} className="text-amber-500 dark:text-amber-400 mt-0.5 shrink-0" />
              <p className="text-sm text-foreground leading-snug">{w}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
