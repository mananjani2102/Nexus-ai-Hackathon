import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  FileText,
  X,
  CheckCircle,
  Loader2,
  ShieldCheck,
  ChevronDown,
} from "lucide-react";
import PageWrapper from "../components/PageWrapper";
import ErrorBanner from "../components/ErrorBanner";
import { useResume } from "../context/ResumeContext";
import { analyzeResume } from "../services/api";
import { LabeledProgressIndicator } from "../components/Watermelon/LabeledProgressIndicator";
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
export default function UploadPage() {
  const navigate = useNavigate();
  const {
    setFile,
    jobRole,
    setJobRole,
    setAnalysisResult,
    setLoading,
    loading,
    error,
    setError,
    clearError,
  } = useResume();
  const [dragging, setDragging] = useState(false);
  const [localFile, setLocalFile] = useState(null);
  const [jdText, setJdText] = useState("");
  const inputRef = useRef(null);
  const validTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  const handleFile = useCallback(
    (f) => {
      if (!f) return;
      if (!validTypes.includes(f.type)) {
        setError("Please upload a PDF or DOCX file only.");
        return;
      }
      if (f.size > 5 * 1024 * 1024) {
        setError("File size must be under 5 MB.");
        return;
      }
      clearError();
      setLocalFile(f);
      setFile(f);
    },
    [setFile, setError, clearError],
  );
  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragging(false);
      handleFile(e.dataTransfer.files[0]);
    },
    [handleFile],
  );
  const onDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };
  const onDragLeave = (e) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget)) setDragging(false);
  };
  const openFilePicker = () => inputRef.current?.click();
  const removeFile = () => {
    setLocalFile(null);
    setFile(null);
    clearError();
  };
  const handleAnalyze = async () => {
    if (!localFile) {
      setError("Please upload a resume first.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await analyzeResume(localFile, jobRole, jdText);
      setAnalysisResult(result);
      navigate("/dashboard");
    } catch (err) {
      setError(
        err?.response?.data?.error ||
        "Analysis failed. Please try again later.",
      );
    } finally {
      setLoading(false);
    }
  };
  return (
    <PageWrapper>
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 text-center"
        >
          <span className="badge-cyan mb-4 inline-flex">
            <ShieldCheck size={11} /> Secure Data Ingest
          </span>
          <h1 className="text-4xl font-black text-nexus-text mb-3">
            Upload Your <span className="text-gradient-cyan">Resume</span>
          </h1>
          <p className="text-nexus-muted text-sm leading-relaxed">
            Your resume is analyzed locally and never stored. AES-256 encrypted
            in transit.
          </p>
        </motion.div>
        <ErrorBanner message={error} onDismiss={clearError} />
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="space-y-5 mt-5"
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="sr-only"
            aria-label="Choose resume file"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />

          <motion.div
            layout
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            role={localFile ? undefined : "button"}
            tabIndex={localFile ? undefined : 0}
            onKeyDown={(e) => {
              if (localFile) return;
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                openFilePicker();
              }
            }}
            onClick={() => !localFile && openFilePicker()}
            whileHover={!localFile ? { scale: 1.005 } : undefined}
            whileTap={!localFile ? { scale: 0.995 } : undefined}
            className={`relative rounded-2xl border-2 border-dashed transition-colors duration-300 outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950
              ${dragging
                ? "border-cyan-400 bg-cyan-500/10 shadow-[0_0_32px_-8px_rgba(34,211,238,0.35)]"
                : localFile
                  ? "border-emerald-400/45 bg-emerald-500/[0.06] cursor-default"
                  : "border-white/18 bg-white/[0.04] hover:border-cyan-400/45 hover:bg-cyan-500/[0.06] cursor-pointer"
              } p-8 sm:p-10 min-h-[200px] flex flex-col justify-center`}
          >
            <AnimatePresence mode="wait">
              {localFile ? (
                <motion.div
                  key="file"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col sm:flex-row sm:items-center gap-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
                    <FileText size={26} className="text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-nexus-text truncate text-base">
                      {localFile.name}
                    </p>
                    <p className="text-xs text-nexus-muted mt-1">
                      {(localFile.size / 1024).toFixed(1)} KB · {localFile.type.includes("pdf") ? "PDF" : "DOCX"} · Ready to analyze
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <CheckCircle size={22} className="text-emerald-400" />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile();
                      }}
                      className="rounded-xl px-3 py-2 text-sm font-medium text-nexus-muted hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <X size={16} /> Remove
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openFilePicker();
                      }}
                      className="rounded-xl px-3 py-2 text-sm font-medium text-primary border border-primary/30 hover:bg-primary/10 transition-colors"
                    >
                      Replace
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-center py-4"
                >
                  <motion.div
                    animate={dragging ? { y: [0, -4, 0] } : {}}
                    transition={{ duration: 0.6, repeat: dragging ? Infinity : 0 }}
                    className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/5 border border-white/10 mb-4"
                  >
                    <Upload
                      size={30}
                      className={dragging ? "text-cyan-400" : "text-nexus-muted"}
                    />
                  </motion.div>
                  <p className="font-semibold text-nexus-text text-lg mb-1">
                    {dragging ? "Release to upload" : "Drop your resume here"}
                  </p>
                  <p className="text-sm text-nexus-muted mb-5 max-w-xs mx-auto">
                    PDF or Word (.docx), up to 5 MB. Click anywhere in this box to browse.
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {["PDF", "DOCX", "Max 5 MB"].map((t) => (
                      <span
                        key={t}
                        className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[11px] font-medium text-nexus-muted"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
          <div>
            <label className="block text-sm font-semibold text-nexus-text mb-2">
              Target Job Role
            </label>
            <div className="relative">
              <select
                value={jobRole}
                onChange={(e) => setJobRole(e.target.value)}
                className="nexus-input appearance-none pr-10"
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
              We tailor keyword extraction and ATS matching to your target role.
            </p>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
              Paste Job Description (Optional)
              {jdText.length > 0 && (
                <span className="inline-flex items-center gap-1 bg-primary/10 border border-primary/25 text-primary text-xs rounded-full px-2 py-0.5">
                  <CheckCircle size={12} className="text-primary" />
                  JD Matched
                </span>
              )}
            </label>
            <textarea
              className="nexus-input w-full resize-none p-3"
              rows={5}
              placeholder="Paste the job description here for precise keyword matching..."
              value={jdText}
              onChange={(e) => setJdText(e.target.value.substring(0, 2000))}
            />
            <div className="text-xs text-muted-foreground mt-1 text-right">
              {jdText.length} / 2000 characters
            </div>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={loading || !localFile}
            className={`w-full btn-primary justify-center py-4 text-base transition-all ${!localFile || loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Analyzing with AI...
              </>
            ) : (
              <>
                <CheckCircle size={18} />
                Run Full Analysis
              </>
            )}
          </button>
          <div className="flex items-center justify-center gap-6 pt-2">
            {[
              "End-to-end encrypted",
              "Auto-deleted after analysis",
              "GDPR compliant",
            ].map((t) => (
              <span
                key={t}
                className="flex items-center gap-1.5 text-[11px] text-nexus-muted"
              >
                <ShieldCheck size={11} className="text-emerald-400" />
                {t}
              </span>
            ))}
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-navy-950/80 backdrop-blur-xl flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-card max-w-md w-full p-10 flex flex-col items-center"
            >
              <LabeledProgressIndicator
                labels={[
                  "Initializing AI Core...",
                  "Extracting Semantic Data...",
                  "Analyzing ATS Patterns...",
                  "Generating Insights...",
                  "Finalizing Response..."
                ]}
                progress="65%"
              />
              <p className="text-nexus-muted mt-8 text-sm animate-pulse text-center">
                Our AI is optimizing your profile for 152+ ATS parameters...
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageWrapper>
  );
}