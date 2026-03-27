import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  FileText,
  X,
  Loader2,
  ChevronDown,
  AlertCircle,
  BarChart3,
  Upload,
  RotateCcw,
  Award,
  Tag,
  Zap,
} from "lucide-react";
import PageWrapper from "../components/PageWrapper";
import { bulkAnalyzeResumes } from "../services/api";

const JOB_ROLES = [
  "Software Engineer",
  "Senior Software Engineer",
  "Full Stack Developer",
  "Frontend Developer",
  "Backend Developer",
  "Data Scientist",
  "Machine Learning Engineer",
  "DevOps Engineer",
  "Product Manager",
  "UX Designer",
  "Data Analyst",
  "Cloud Architect",
  "Cybersecurity Analyst",
  "Mobile Developer",
  "QA Engineer",
];

const scoreColor = (s) =>
  s >= 80 ? "text-emerald-400" : s >= 60 ? "text-amber-400" : "text-rose-400";
const scoreBg = (s) =>
  s >= 80
    ? "bg-emerald-400/15 border-emerald-400/30"
    : s >= 60
      ? "bg-amber-400/15 border-amber-400/30"
      : "bg-rose-400/15 border-rose-400/30";
const scoreBarColor = (s) =>
  s >= 80 ? "bg-emerald-400" : s >= 60 ? "bg-amber-400" : "bg-rose-400";

const rankColor = (rank) => {
  if (rank === 1) return "#f59e0b";
  if (rank === 2) return "#94a3b8";
  if (rank === 3) return "#cd7f32";
  return "#6e6e6e";
};

const rankBorder = (rank) => {
  if (rank === 1)
    return "border-amber-400/40 shadow-[0_0_24px_-4px_rgba(245,158,11,0.15)]";
  if (rank === 2) return "border-slate-400/30";
  if (rank === 3) return "border-orange-700/30";
  return "border-white/10";
};

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
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

export default function RecruiterPage() {
  const [files, setFiles] = useState([]);
  const [jobRole, setJobRole] = useState("Software Engineer");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);
  const [analysisInfo, setAnalysisInfo] = useState(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const validTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  const addFiles = useCallback(
    (newFiles) => {
      const validFiles = [];
      for (const f of newFiles) {
        if (!validTypes.includes(f.type)) {
          setError(`"${f.name}" is not a PDF or DOCX file.`);
          return;
        }
        if (f.size > 5 * 1024 * 1024) {
          setError(`"${f.name}" exceeds 5 MB limit.`);
          return;
        }
        validFiles.push(f);
      }
      setError(null);
      setFiles((prev) => {
        const combined = [...prev, ...validFiles];
        if (combined.length > 50) {
          setError("Maximum 50 resumes allowed.");
          return prev;
        }
        return combined;
      });
    },
    [setError],
  );

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setError(null);
  };

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragging(false);
      if (e.dataTransfer.files.length > 0) {
        addFiles(Array.from(e.dataTransfer.files));
      }
    },
    [addFiles],
  );

  const onDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };
  const onDragLeave = () => setDragging(false);

  const handleAnalyze = async () => {
    if (files.length < 2) {
      setError("Please upload at least 2 resumes.");
      return;
    }
    if (files.length > 50) {
      setError("Maximum 50 resumes allowed.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await bulkAnalyzeResumes(files, jobRole);
      setResults(data.results);
      setAnalysisInfo({ jobRole: data.jobRole, total: data.totalAnalyzed });
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          "Bulk analysis failed. Please try again later.",
      );
    } finally {
      setLoading(false);
    }
  };

  const resetAll = () => {
    setFiles([]);
    setResults(null);
    setAnalysisInfo(null);
    setError(null);
  };

  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto">
        {/* ── PAGE HEADER ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 text-center"
        >
          <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/25">
            <Users size={28} className="text-emerald-400" />
          </div>
          <div className="flex items-center justify-center gap-3 mb-3">
            <h1 className="text-4xl font-black text-nexus-text">
              <span className="text-gradient-cyan">Recruiter</span> Mode
            </h1>
            <span className="inline-flex items-center rounded-full bg-amber-400/15 border border-amber-400/30 px-2.5 py-0.5 text-[10px] font-bold text-amber-400 tracking-wider uppercase">
              BETA
            </span>
          </div>
          <p className="text-nexus-muted text-sm leading-relaxed max-w-lg mx-auto">
            Upload up to 50 resumes and instantly rank candidates by AI score
          </p>
        </motion.div>

        {/* ── ERROR BANNER ── */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-5 flex items-center gap-3 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-sm"
            >
              <AlertCircle size={16} className="shrink-0" />
              <span className="flex-1">{error}</span>
              <button
                onClick={() => setError(null)}
                className="text-rose-400/60 hover:text-rose-400 transition-colors"
              >
                <X size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── UPLOAD SECTION ── */}
        {!results && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="space-y-5"
          >
            <div className="glass-card p-6">
              {/* Drop Zone */}
              <div
                onDrop={onDrop}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onClick={() => inputRef.current?.click()}
                className={`relative rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer p-10
                  ${
                    dragging
                      ? "border-cyan-400 bg-cyan-500/8 scale-[1.01] shadow-glow-cyan"
                      : files.length > 0
                        ? "border-emerald-400/50 bg-emerald-500/5"
                        : "border-white/15 bg-white/3 hover:border-cyan-400/40 hover:bg-cyan-500/4"
                  }`}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept=".pdf,.docx"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files.length > 0) {
                      addFiles(Array.from(e.target.files));
                    }
                    e.target.value = "";
                  }}
                />
                <div className="text-center">
                  <div
                    className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center border transition-all ${
                      dragging
                        ? "border-cyan-400 bg-cyan-500/15"
                        : "border-white/10 bg-white/5"
                    }`}
                  >
                    <Upload
                      size={26}
                      className={`transition-colors ${dragging ? "text-cyan-400" : "text-nexus-muted"}`}
                    />
                  </div>
                  <p className="font-semibold text-nexus-text mb-1">
                    {dragging
                      ? "Drop resumes here!"
                      : "Drag & drop multiple resumes"}
                  </p>
                  <p className="text-sm text-nexus-muted mb-4">
                    or click to browse files (2–50 resumes)
                  </p>
                  <div className="flex gap-2 justify-center">
                    <span className="badge bg-white/5 text-nexus-muted border-white/10 text-[10px]">
                      PDF
                    </span>
                    <span className="badge bg-white/5 text-nexus-muted border-white/10 text-[10px]">
                      DOCX
                    </span>
                    <span className="badge bg-white/5 text-nexus-muted border-white/10 text-[10px]">
                      Max 5MB each
                    </span>
                  </div>
                </div>
              </div>

              {/* Selected Files Count */}
              {files.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="inline-flex items-center gap-2 bg-emerald-400/15 border border-emerald-400/30 text-emerald-400 text-xs font-semibold rounded-full px-3 py-1">
                      <FileText size={12} />
                      {files.length} resume{files.length !== 1 ? "s" : ""}{" "}
                      selected
                    </span>
                    <button
                      onClick={() => {
                        setFiles([]);
                        setError(null);
                      }}
                      className="text-xs text-nexus-muted hover:text-rose-400 transition-colors"
                    >
                      Clear all
                    </button>
                  </div>

                  {/* File List */}
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {files.map((f, idx) => (
                      <motion.div
                        key={`${f.name}-${idx}`}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/3 border border-white/8 group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                          <FileText size={14} className="text-emerald-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-nexus-text truncate">
                            {f.name}
                          </p>
                          <p className="text-[10px] text-nexus-muted">
                            {(f.size / 1024).toFixed(0)} KB ·{" "}
                            {f.type.includes("pdf") ? "PDF" : "DOCX"}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile(idx);
                          }}
                          className="text-nexus-muted hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <X size={14} />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Job Role Selector */}
            <div className="glass-card p-6">
              <label className="block text-sm font-semibold text-nexus-text mb-2">
                Target Job Role
              </label>
              <div className="relative">
                <select
                  value={jobRole}
                  onChange={(e) => setJobRole(e.target.value)}
                  className="nexus-input appearance-none pr-10 w-full"
                >
                  {JOB_ROLES.map((r) => (
                    <option key={r} value={r} className="bg-navy-800">
                      {r}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-nexus-muted pointer-events-none"
                />
              </div>
              <p className="text-xs text-nexus-muted mt-1.5">
                All resumes will be ranked for this specific role.
              </p>
            </div>

            {/* Analyze Button */}
            <button
              onClick={handleAnalyze}
              disabled={loading || files.length < 2}
              className={`w-full btn-primary justify-center py-4 text-base transition-all ${
                files.length < 2 || loading
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Analyzing {files.length} resumes with AI...
                </>
              ) : (
                <>
                  <BarChart3 size={18} />
                  Analyze All Resumes
                </>
              )}
            </button>
          </motion.div>
        )}

        {/* ── RESULTS SECTION ── */}
        {results && analysisInfo && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center">
                  <BarChart3 size={18} className="text-cyan-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-nexus-text">
                      Candidate Rankings
                    </h2>
                    <span className="inline-flex items-center bg-emerald-400/15 border border-emerald-400/30 text-emerald-400 text-[10px] font-bold rounded-full px-2 py-0.5">
                      {analysisInfo.total} analyzed
                    </span>
                  </div>
                  <p className="text-xs text-nexus-muted mt-0.5">
                    Ranked for:{" "}
                    <span className="text-cyan-400 font-medium">
                      {analysisInfo.jobRole}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Candidate Cards */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="space-y-3"
            >
              {results.map((candidate) => (
                <motion.div
                  key={candidate.rank}
                  variants={cardVariants}
                  className={`glass-card p-5 border ${rankBorder(candidate.rank)} transition-all hover:scale-[1.005]`}
                >
                  <div className="flex items-center gap-5">
                    {/* LEFT: Rank */}
                    <div className="shrink-0 text-center w-14">
                      {candidate.rank <= 3 && (
                        <Award
                          size={16}
                          className="mx-auto mb-1"
                          style={{ color: rankColor(candidate.rank) }}
                        />
                      )}
                      <span
                        className="text-2xl font-black"
                        style={{ color: rankColor(candidate.rank) }}
                      >
                        #{candidate.rank}
                      </span>
                    </div>

                    {/* CENTER: Info + Scores */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-nexus-text truncate mb-2">
                        {candidate.filename}
                      </p>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg border ${scoreBg(candidate.overall_score)}`}
                        >
                          <span className="text-nexus-muted">Overall:</span>
                          <span className={`font-bold ${scoreColor(candidate.overall_score)}`}>
                            {candidate.overall_score}
                          </span>
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg border ${scoreBg(candidate.ats_score)}`}
                        >
                          <span className="text-nexus-muted">ATS:</span>
                          <span className={`font-bold ${scoreColor(candidate.ats_score)}`}>
                            {candidate.ats_score}
                          </span>
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg border ${scoreBg(candidate.clarity_score)}`}
                        >
                          <span className="text-nexus-muted">Clarity:</span>
                          <span className={`font-bold ${scoreColor(candidate.clarity_score)}`}>
                            {candidate.clarity_score}
                          </span>
                        </span>
                      </div>

                      {/* Bottom row: keyword + strength chips */}
                      <div className="flex flex-wrap gap-2">
                        {candidate.top_keyword_missing && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-full px-2 py-0.5">
                            <Tag size={9} />
                            Missing: {candidate.top_keyword_missing}
                          </span>
                        )}
                        {candidate.strengths?.[0] && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5">
                            <Zap size={9} />
                            {candidate.strengths[0]}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* RIGHT: Progress Bar */}
                    <div className="hidden sm:flex flex-col items-end gap-1 shrink-0 w-28">
                      <span
                        className={`text-lg font-black ${scoreColor(candidate.overall_score)}`}
                      >
                        {candidate.overall_score}
                      </span>
                      <div className="w-full h-2 rounded-full bg-white/8 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${candidate.overall_score}%` }}
                          transition={{
                            duration: 0.8,
                            delay: candidate.rank * 0.08,
                            ease: "easeOut",
                          }}
                          className={`h-full rounded-full ${scoreBarColor(candidate.overall_score)}`}
                        />
                      </div>
                      <span className="text-[9px] text-nexus-muted">
                        Overall Score
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Reset Button */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-8 text-center"
            >
              <button onClick={resetAll} className="btn-ghost px-6 py-3">
                <RotateCcw size={16} />
                Analyze Another Batch
              </button>
            </motion.div>
          </motion.div>
        )}

        {/* ── EMPTY STATE ── */}
        {!results && files.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-12 text-center"
          >
            <div className="w-20 h-20 rounded-3xl mx-auto mb-4 bg-white/3 border border-white/8 flex items-center justify-center">
              <Users size={32} className="text-nexus-muted/50" />
            </div>
            <p className="text-nexus-muted text-sm">
              Upload resumes above to see rankings
            </p>
          </motion.div>
        )}
      </div>
    </PageWrapper>
  );
}
