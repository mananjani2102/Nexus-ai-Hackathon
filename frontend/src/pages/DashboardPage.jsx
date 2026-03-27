import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  Target,
  Eye,
  Zap,
  Key,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  Lightbulb,
  MessageSquare,
  Brain,
  Loader2,
  RefreshCw,
  Wand2,
  Copy,
  CheckCheck,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowRightLeft,
  Download,
} from "lucide-react";
import PageWrapper from "../components/PageWrapper";
import ErrorBanner from "../components/ErrorBanner";
import ScoreRing from "../components/ScoreRing";
import { useResume } from "../context/ResumeContext";
import { useAuth } from "../context/AuthContext";
import { generateInterviewQuestions, rewriteResume } from "../services/api";

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

// Helper: decode HTML entities in case content is double-encoded
function decodeHtmlEntities(str) {
  try {
    const txt = document.createElement("textarea");
    txt.innerHTML = str;
    return txt.value;
  } catch {
    return str;
  }
}

// Helper: detect if string contains HTML tags
function containsHtml(str) {
  return /<([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/i.test(str);
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { analysisResult, jobRole } = useResume();
  const [questions, setQuestions] = useState([]);
  const [loadingQ, setLoadingQ] = useState(false);
  const [rewritten, setRewritten] = useState(null);
  const [docxBase64, setDocxBase64] = useState(null);
  const [isRewriting, setIsRewriting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [step, setStep] = useState(0);
  const [rewriteError, setRewriteError] = useState(null);
  const [changes, setChanges] = useState([]);
  const [showChanges, setShowChanges] = useState(false);

  if (!analysisResult) {
    return (
      <PageWrapper>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mb-6">
            <BarChart3 size={28} className="text-nexus-muted" />
          </div>
          <h1 className="text-3xl font-black text-nexus-text mb-3">No Resume Data Found</h1>
          <p className="text-nexus-muted mb-6">Please upload and analyze a resume to view your detailed dashboard.</p>
          <Link to="/upload" className="btn-primary py-3 px-6">Upload Resume</Link>
        </div>
      </PageWrapper>
    );
  }

  const {
    overall_score = 72,
    ats_score = 68,
    clarity_score = 81,
    strengths = [],
    weaknesses = [],
    ats_keywords_missing = [],
    star_bullets = {},
  } = analysisResult;

  const handleGenerateQuestions = async () => {
    setLoadingQ(true);
    try {
      const result = await generateInterviewQuestions({ jobRole, strengths, weaknesses, ats_keywords_missing });
      if (result && result.questions) {
        setQuestions(result.questions);
      } else {
        throw new Error("Invalid response");
      }
    } catch (err) {
      setQuestions([
        `Could you elaborate on your experience as a ${jobRole || 'professional'}?`,
        "Based on your resume, what do you consider your greatest strength?",
        "Can you share an example of a difficult challenge you overcame in a previous role?",
        "Can you describe your ideal team environment?",
        "Where do you see your career heading in the next 3 to 5 years?",
      ]);
    } finally {
      setLoadingQ(false);
    }
  };

  const handleRewriteResume = async () => {
    setIsRewriting(true);
    setRewritten(null);
    setDocxBase64(null);
    setRewriteError(null);
    setChanges([]);
    setShowChanges(false);

    if (!analysisResult?.resumeText) {
      setRewriteError("Old session detected! Please re-upload your resume to unlock the Rewrite feature.");
      setIsRewriting(false);
      return;
    }

    setStep(1);

    const interval = setInterval(() => {
      setStep((prev) => {
        if (prev < 3) return prev + 1;
        clearInterval(interval);
        return prev;
      });
    }, 800);

    try {
      const result = await rewriteResume({
        resumeText: analysisResult.resumeText,
        resumeFormat: analysisResult.resumeFormat,
        resumeHtml: analysisResult.resumeHtml,
        docxId: analysisResult.docxId,
        jobRole,
        weaknesses: analysisResult.weaknesses,
        ats_keywords_missing: analysisResult.ats_keywords_missing,
      });
      clearInterval(interval);
      setStep(3);
      if (result && result.rewritten) {
        setRewritten(result.rewritten);
        if (result.docxBase64) {
          setDocxBase64(result.docxBase64);
        }
        if (result.changes && result.changes.length > 0) {
          setChanges(result.changes);
        }
      } else {
        throw new Error("Invalid response");
      }
    } catch (err) {
      clearInterval(interval);
      setRewriteError(err?.response?.data?.error || "AI failed to respond. Please re-upload your resume.");
      setStep(0);
    } finally {
      setIsRewriting(false);
    }
  };

  const handleCopy = async () => {
    if (!rewritten) return;
    try {
      if (rewrittenIsHtml) {
        // Copy as rich text so it can be pasted into Word/Docs with formatting
        const blob = new Blob([rewritten], { type: 'text/html' });
        const textBlob = new Blob([rewritten.replace(/<[^>]*>/g, '')], { type: 'text/plain' });
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/html': blob,
            'text/plain': textBlob,
          }),
        ]);
      } else {
        await navigator.clipboard.writeText(rewritten);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      navigator.clipboard.writeText(rewritten);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadResume = () => {
    if (!rewritten) return;

    let blob, filename;

    if (docxBase64) {
      // DOCX: download as .docx (preserves all original formatting perfectly)
      const byteCharacters = atob(docxBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      blob = new Blob([byteArray], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
      filename = "Nexus_Rewritten_Resume.docx";
    } else if (rewrittenIsHtml) {
      // HTML resume: wrap in a full HTML doc so colors, fonts, layout are preserved
      const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Nexus AI - Rewritten Resume</title>
<style>
  body { margin: 0; padding: 40px; font-family: Arial, Helvetica, sans-serif; background: #fff; color: #000; }
  @media print { body { padding: 0; } }
</style>
</head>
<body>
${rewritten}
</body>
</html>`;
      blob = new Blob([fullHtml], { type: "text/html;charset=utf-8" });
      filename = "Nexus_Rewritten_Resume.html";
    } else {
      // Plain text resume
      blob = new Blob([rewritten], { type: "text/plain;charset=utf-8" });
      filename = "Nexus_Rewritten_Resume.txt";
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const scoreColor =
    overall_score >= 80 ? "emerald" : overall_score >= 60 ? "amber" : "rose";
  const scoreLabel =
    overall_score >= 80
      ? "Excellent"
      : overall_score >= 60
        ? "Good — Room to grow"
        : "Needs Work";
  const scoreBadgeClass =
    overall_score >= 80
      ? "badge-emerald"
      : overall_score >= 60
        ? "badge-amber"
        : "badge bg-rose-500/20 text-rose-300 border-rose-500/30";

  // Determine if rewritten content is HTML (DOCX) or plain text (PDF)
  const rewrittenIsHtml = rewritten && containsHtml(rewritten);
  const htmlToRender = rewrittenIsHtml ? decodeHtmlEntities(rewritten) : rewritten;

  return (
    <PageWrapper>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
      >
        <div>
          <span className="badge-indigo mb-3 inline-flex">
            <BarChart3 size={11} /> Analysis Dashboard
          </span>
          <h1 className="text-3xl font-black text-nexus-text">
            {user?.name ? `Welcome, ${user.name.split(' ')[0]}!` : "Resume "}
            <span className="text-gradient-cyan">Intelligence Report</span>
          </h1>
          <p className="text-nexus-muted text-sm mt-1">
            Analyzed for{" "}
            <span className="text-nexus-cyan font-medium">{jobRole}</span> ·{" "}
            {new Date().toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="flex gap-3">
          <Link to="/suggestions" className="btn-primary text-sm">
            View AI Fixes <ArrowRight size={14} />
          </Link>
          <Link to="/upload" className="btn-secondary text-sm">
            Re-upload
          </Link>
        </div>
      </motion.div>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid lg:grid-cols-12 gap-5"
      >
        <motion.div
          variants={cardVariants}
          className="lg:col-span-5 glass-card p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bold text-nexus-text">Performance Scores</h2>
            <span className={scoreBadgeClass}>{scoreLabel}</span>
          </div>
          <div className="flex flex-wrap gap-6 justify-around">
            <ScoreRing
              score={overall_score}
              label="Overall Score"
              color={scoreColor}
              size={148}
              thickness={12}
            />
            <ScoreRing
              score={ats_score}
              label="ATS Match"
              color="indigo"
              size={120}
              thickness={10}
            />
            <ScoreRing
              score={clarity_score}
              label="Clarity"
              color="cyan"
              size={120}
              thickness={10}
            />
          </div>
          <div className="mt-6 pt-5 border-t border-white/5 grid grid-cols-3 gap-3 text-center">
            {[
              {
                label: "Overall Score",
                val: overall_score,
                color: "text-emerald-400",
              },
              { label: "ATS Match", val: ats_score, color: "text-indigo-400" },
              { label: "Clarity", val: clarity_score, color: "text-cyan-400" },
            ].map(({ label, val, color }) => (
              <div key={label}>
                <div className={`text-xl font-black ${color}`}>{val}</div>
                <div className="text-xs text-nexus-muted mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </motion.div>
        <motion.div
          variants={cardVariants}
          className="lg:col-span-4 glass-card p-6"
        >
          <div className="flex items-center gap-2 mb-5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/15 flex items-center justify-center border border-emerald-500/25">
              <TrendingUp size={14} className="text-emerald-400" />
            </div>
            <h2 className="font-bold text-nexus-text">Performance Strengths</h2>
          </div>
          <div className="space-y-3">
            {strengths.length > 0 ? (
              strengths.map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.07 }}
                  className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15"
                >
                  <CheckCircle
                    size={14}
                    className="text-emerald-400 mt-0.5 shrink-0"
                  />
                  <p className="text-sm text-nexus-text leading-snug">{s}</p>
                </motion.div>
              ))
            ) : (
              <p className="text-nexus-muted text-sm">
                Upload a resume to see strengths.
              </p>
            )}
          </div>
        </motion.div>
        <motion.div
          variants={cardVariants}
          className="lg:col-span-3 glass-card p-6"
        >
          <div className="flex items-center gap-2 mb-5">
            <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center border border-amber-500/25">
              <AlertTriangle size={14} className="text-amber-400" />
            </div>
            <h2 className="font-bold text-nexus-text">Optimized Weaknesses</h2>
          </div>
          <div className="space-y-3">
            {weaknesses.length > 0 ? (
              weaknesses.map((w, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.07 }}
                  className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/5 border border-amber-500/15"
                >
                  <AlertTriangle
                    size={13}
                    className="text-amber-400 mt-0.5 shrink-0"
                  />
                  <p className="text-sm text-nexus-text leading-snug">{w}</p>
                </motion.div>
              ))
            ) : (
              <p className="text-nexus-muted text-sm">
                No critical weaknesses found!
              </p>
            )}
          </div>
        </motion.div>
        <motion.div
          variants={cardVariants}
          className="lg:col-span-5 glass-card p-6"
        >
          <div className="flex items-center gap-2 mb-5">
            <div className="w-7 h-7 rounded-lg bg-rose-500/15 flex items-center justify-center border border-rose-500/25">
              <Key size={14} className="text-rose-400" />
            </div>
            <h2 className="font-bold text-nexus-text">Missing ATS Keywords</h2>
            <span className="ml-auto badge bg-rose-500/15 text-rose-300 border-rose-500/25 text-[10px]">
              {ats_keywords_missing.length} gaps
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {ats_keywords_missing.length > 0 ? (
              ats_keywords_missing.map((kw, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + i * 0.04 }}
                  className="px-3 py-1.5 rounded-lg bg-rose-500/8 border border-rose-500/20 text-rose-300 text-xs font-mono font-medium"
                >
                  {kw}
                </motion.span>
              ))
            ) : (
              <p className="text-emerald-400 text-sm flex items-center gap-2">
                <CheckCircle size={14} /> All key ATS terms present!
              </p>
            )}
          </div>
        </motion.div>

        <motion.div
          variants={cardVariants}
          className="lg:col-span-5 glass-card p-6"
        >
          <div className="flex items-center gap-2 mb-5">
            <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center border border-accent/25">
              <MessageSquare size={14} className="text-[#66d9ef]" />
            </div>
            <h2 className="font-bold text-nexus-text">Interview Prep AI</h2>
            <span className="ml-auto badge bg-accent/10 text-accent border-accent/25 text-xs">
              Powered by AI
            </span>
          </div>

          {!loadingQ && questions.length === 0 && (
            <div className="flex flex-col items-center justify-center py-4">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl border border-primary/20 text-primary mx-auto mb-3 flex items-center justify-center">
                <Brain size={24} />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Generate likely interview questions based on your resume and target role
              </p>
              <button
                onClick={handleGenerateQuestions}
                className="btn-primary w-full justify-center mt-4"
              >
                Generate Questions
              </button>
            </div>
          )}

          {loadingQ && (
            <div className="flex flex-col items-center justify-center py-4">
              <div className="space-y-3 w-full">
                <div className="h-10 w-full shimmer rounded-xl" />
                <div className="h-10 w-full shimmer rounded-xl" />
                <div className="h-10 w-full shimmer rounded-xl" />
              </div>
              <p className="text-xs text-muted-foreground text-center mt-4">
                Analyzing your profile...
              </p>
            </div>
          )}

          {!loadingQ && questions.length > 0 && (
            <div className="flex flex-col h-full">
              <div className="space-y-2 mb-3">
                {questions.map((q, idx) => (
                  <div key={idx} className="flex gap-3 p-3 rounded-xl bg-card/50 border border-border">
                    <div className="w-6 h-6 rounded-full bg-primary/15 text-primary text-xs font-mono flex items-center justify-center shrink-0">
                      {idx + 1}
                    </div>
                    <p className="text-sm text-foreground leading-snug">{q}</p>
                  </div>
                ))}
              </div>
              <button
                onClick={handleGenerateQuestions}
                className="btn-secondary text-xs mt-auto w-full justify-center"
              >
                <RefreshCw size={14} className="mr-1" /> Regenerate
              </button>
            </div>
          )}
        </motion.div>

        <motion.div
          variants={cardVariants}
          className="lg:col-span-7 glass-card p-6"
        >
          <div className="flex items-center gap-2 mb-5">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/15 flex items-center justify-center border border-indigo-500/25">
              <Lightbulb size={14} className="text-indigo-400" />
            </div>
            <h2 className="font-bold text-nexus-text">Next Steps</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              {
                icon: Lightbulb,
                label: "View AI Suggestions",
                desc: "Actionable fixes ranked by impact",
                to: "/suggestions",
                color: "from-indigo-500 to-violet-500",
              },
              {
                icon: Zap,
                label: "Bullet Improver",
                desc: "STAR-method bullet rewriting",
                to: "/bullet",
                color: "from-cyan-500 to-teal-500",
              },
              {
                icon: Target,
                label: "ATS Deep Dive",
                desc: `${ats_keywords_missing.length} keywords to add`,
                to: "/suggestions",
                color: "from-rose-500 to-pink-500",
              },
              {
                icon: Eye,
                label: "View History",
                desc: "Track score improvements",
                to: "/history",
                color: "from-amber-500 to-orange-500",
              },
            ].map(({ icon: Icon, label, desc, to, color }) => (
              <Link
                key={label}
                to={to}
                className="flex items-center gap-3 p-3.5 rounded-xl bg-white/3 border border-white/5 
                           hover:bg-white/6 hover:border-white/10 transition-all group"
              >
                <div
                  className={`w-9 h-9 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center shrink-0 opacity-80 group-hover:opacity-100 transition-opacity`}
                >
                  <Icon size={16} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-nexus-text">
                    {label}
                  </p>
                  <p className="text-xs text-nexus-muted">{desc}</p>
                </div>
                <ArrowRight
                  size={14}
                  className="ml-auto text-nexus-muted group-hover:text-nexus-cyan transition-colors"
                />
              </Link>
            ))}
          </div>
        </motion.div>

        <motion.div
          variants={cardVariants}
          className="lg:col-span-7 glass-card p-6"
        >
          <div className="flex items-center gap-2 mb-5">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
              <Wand2 size={14} className="text-primary" />
            </div>
            <h2 className="font-bold text-nexus-text">AI Resume Rewrite</h2>
            <span className="ml-auto badge bg-primary/15 text-primary border-primary/30 text-xs font-mono rounded-full">
              NEW
            </span>
          </div>

          {!isRewriting && !rewritten && (
            <div>
              <p className="text-sm text-muted-foreground mb-4">
                Apply all AI suggestions automatically. Get a fully rewritten, ATS-optimized version of your resume in seconds.
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                {["ATS Optimized", "STAR Bullets", "Keyword Rich"].map(pill => (
                  <span key={pill} className="inline-flex items-center gap-1.5 bg-card/60 border border-border rounded-full px-3 py-1 text-xs text-muted-foreground">
                    <CheckCircle size={12} className="text-primary" /> {pill}
                  </span>
                ))}
              </div>
              {rewriteError && <ErrorBanner message={rewriteError} onDismiss={() => setRewriteError(null)} />}
              <button onClick={handleRewriteResume} className="w-full btn-primary justify-center py-3.5 mt-4">
                <Wand2 size={16} className="mr-2" /> Rewrite My Resume
              </button>
            </div>
          )}

          {isRewriting && (
            <div className="flex flex-col items-center justify-center py-8 space-y-3">
              <Loader2 size={24} className="animate-spin text-primary mb-3" />
              <div className="space-y-3 w-full max-w-xs mx-auto">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: step >= 1 ? 1 : 0 }} className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-primary" />
                  <span className="text-xs font-medium text-foreground">Applying ATS keywords...</span>
                </motion.div>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: step >= 2 ? 1 : 0 }} className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-primary" />
                  <span className="text-xs font-medium text-foreground">Rewriting bullet points...</span>
                </motion.div>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: step >= 3 ? 1 : 0 }} className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-primary" />
                  <span className="text-xs font-medium text-foreground">Optimizing structure...</span>
                </motion.div>
              </div>
            </div>
          )}

          {!isRewriting && rewritten && (
            <div className="flex flex-col h-full gap-3">
              {rewrittenIsHtml ? (
                // DOCX: render HTML with full styling preserved
                <div
                  className="resume-preview-container w-full max-h-[700px] overflow-y-auto rounded-xl border border-gray-200 bg-white"
                  spellCheck={false}
                >
                  <div
                    className="resume-html-content p-6"
                    spellCheck={false}
                    dangerouslySetInnerHTML={{ __html: htmlToRender }}
                  />
                </div>
              ) : (
                // PDF: plain text
                <textarea
                  className="w-full h-48 nexus-input font-mono text-xs resize-none p-4"
                  value={rewritten}
                  readOnly
                />
              )}
              {/* Changes Summary Toggle */}
              {changes.length > 0 && (
                <div className="rounded-xl border border-white/10 bg-white/3 overflow-hidden">
                  <button
                    onClick={() => setShowChanges(!showChanges)}
                    className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-nexus-text hover:bg-white/5 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Sparkles size={14} className="text-emerald-400" />
                      {changes.length} Improvement{changes.length !== 1 ? 's' : ''} Made
                    </span>
                    {showChanges ? <ChevronUp size={16} className="text-nexus-muted" /> : <ChevronDown size={16} className="text-nexus-muted" />}
                  </button>
                  <AnimatePresence>
                    {showChanges && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 space-y-3 max-h-[300px] overflow-y-auto">
                          {changes.map((c, idx) => (
                            <div key={idx} className="rounded-lg bg-white/3 border border-white/5 p-3">
                              <div className="flex items-start gap-2 mb-2">
                                <span className="shrink-0 mt-0.5 w-5 h-5 rounded-full bg-rose-500/15 text-rose-400 flex items-center justify-center text-[10px] font-bold">✕</span>
                                <p className="text-xs text-rose-300/80 leading-relaxed line-through decoration-rose-400/40">{c.original}</p>
                              </div>
                              <div className="flex items-start gap-2">
                                <span className="shrink-0 mt-0.5 w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center text-[10px] font-bold">✓</span>
                                <p className="text-xs text-emerald-300 leading-relaxed font-medium">{c.improved}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
              <div className="flex gap-2 mt-auto">
                <button
                  onClick={handleCopy}
                  className="flex-1 btn-secondary text-xs justify-center py-3"
                >
                  {copied ? <CheckCheck size={14} className="mr-1" /> : <Copy size={14} className="mr-1" />}
                  {copied ? "Copied!" : "Copy Text"}
                </button>
                <button
                  onClick={handleDownloadResume}
                  className="flex-1 btn-primary text-xs justify-center py-3"
                  style={{ background: 'linear-gradient(135deg, #06b6d4, #3b82f6)' }}
                >
                  <Download size={14} className="mr-1" /> Download Resume
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </PageWrapper>
  );
}