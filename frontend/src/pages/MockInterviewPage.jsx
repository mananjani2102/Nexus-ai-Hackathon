import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic, MicOff, Brain, Trophy, ChevronRight, ChevronDown, ChevronUp,
  SkipForward, Clock, Sparkles, CheckCircle2, RotateCcw,
  Target, TrendingUp, Volume2,
} from "lucide-react";
import PageWrapper from "../components/PageWrapper";
import ErrorBanner from "../components/ErrorBanner";
import ScoreRing from "../components/ScoreRing";
import { useResume } from "../context/ResumeContext";
import { generateMockQuestions, evaluateInterview, transcribeInterviewAudio } from "../services/api";

/* ─── Constants ─── */
const FILLER_WORDS = ["um","uh","like","basically","literally","actually","you know","i mean","sort of","kind of","right"];
const QUESTION_TIME = 90;
const JOB_ROLES = ["Software Engineer","Frontend Developer","Backend Developer","Full Stack Developer","Data Scientist","DevOps Engineer","Product Manager","UI/UX Designer","Mobile Developer","QA Engineer"];

function countFillers(text) {
  const lower = text.toLowerCase();
  let count = 0;
  FILLER_WORDS.forEach(f => {
    const regex = new RegExp(`\\b${f}\\b`, "gi");
    const matches = lower.match(regex);
    if (matches) count += matches.length;
  });
  return count;
}

function calcConfidence(fillerCount, wpm) {
  let score = 100;
  score -= fillerCount * 3;
  if (wpm > 180) score -= 5;
  if (wpm < 80) score -= 5;
  return Math.max(0, Math.min(100, score));
}

function scoreColor(val, thresholds) {
  if (val >= thresholds[0]) return "#10b981";
  if (val >= thresholds[1]) return "#f59e0b";
  return "#ef4444";
}

function pickAudioMimeType() {
  const types = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
  for (const t of types) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t)) return t;
  }
  return "";
}

/* ─── Main Component ─── */
export default function MockInterviewPage() {
  const { analysisResult, jobRole: ctxJobRole } = useResume();

  /* shared state */
  const [stage, setStage] = useState("setup");
  const [error, setError] = useState(null);

  /* setup */
  const [resumeText, setResumeText] = useState("");
  const [jobRole, setJobRole] = useState("Software Engineer");
  const [hasAutoLoaded, setHasAutoLoaded] = useState(false);

  /* interview */
  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [answerText, setAnswerText] = useState("");
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);

  /* speech stats (per-question, live) */
  const [liveWPM, setLiveWPM] = useState(0);
  const [liveFillers, setLiveFillers] = useState(0);
  const [liveConfidence, setLiveConfidence] = useState(100);
  const recordStartRef = useRef(null);

  /* results */
  const [results, setResults] = useState(null);
  const [expandedQ, setExpandedQ] = useState(null);
  const [dotsCount, setDotsCount] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);

  /* refs */
  const timerRef = useRef(null);
  const answerTextRef = useRef("");
  const recordingBaseRef = useRef("");
  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const chunksRef = useRef([]);
  const handleNextQuestionRef = useRef(null);
  const advancingRef = useRef(false);

  /* ─── Auto-load resume from context ─── */
  useEffect(() => {
    if (analysisResult?.resumeText) {
      setResumeText(analysisResult.resumeText);
      setHasAutoLoaded(true);
    }
    if (ctxJobRole) setJobRole(ctxJobRole);
  }, [analysisResult, ctxJobRole]);

  useEffect(() => {
    answerTextRef.current = answerText;
  }, [answerText]);

  /* ─── Timer logic (ref avoids stale handleNextQuestion) ─── */
  useEffect(() => {
    if (stage !== "interview") return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          void handleNextQuestionRef.current?.();
          return QUESTION_TIME;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [stage, currentQ]);

  /* ─── Cleanup recorder on unmount / stage change ─── */
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        try { mediaRecorderRef.current.stop(); } catch {}
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
      }
      mediaRecorderRef.current = null;
      chunksRef.current = [];
      clearInterval(timerRef.current);
    };
  }, [stage]);

  /* ─── Evaluating dots animation ─── */
  useEffect(() => {
    if (stage !== "evaluating") return;
    setDotsCount(0);
    const iv = setInterval(() => setDotsCount(p => Math.min(p + 1, 5)), 700);
    return () => clearInterval(iv);
  }, [stage]);

  /* ─── Mic recording → server Whisper (avoids Chrome Web Speech / Google network errors) ─── */
  const stopRecording = useCallback(async ({ discard = false } = {}) => {
    const rec = mediaRecorderRef.current;
    const stream = mediaStreamRef.current;

    const cleanupStream = () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
      }
    };

    if (!rec || rec.state === "inactive") {
      cleanupStream();
      mediaRecorderRef.current = null;
      chunksRef.current = [];
      setIsRecording(false);
      setIsTranscribing(false);
      return answerTextRef.current;
    }

    return new Promise((resolve) => {
      rec.onstop = async () => {
        if (discard) {
          cleanupStream();
          mediaRecorderRef.current = null;
          chunksRef.current = [];
          setIsTranscribing(false);
          resolve(answerTextRef.current);
          return;
        }

        setIsTranscribing(true);
        const base = recordingBaseRef.current;
        try {
          const blob = new Blob(chunksRef.current, { type: rec.mimeType || "audio/webm" });
          let piece = "";
          if (blob.size > 0) {
            const data = await transcribeInterviewAudio(blob, rec.mimeType || "audio/webm");
            piece = (data.text || "").trim();
          }
          const merged = piece ? (base ? `${base} ${piece}` : piece) : base;
          if (blob.size > 0 && !piece) {
            setError("No speech was detected in that clip. Speak a little longer, closer to the mic, or type your answer.");
          }
          const words = merged.trim().split(/\s+/).filter(Boolean).length;
          const elapsed = recordStartRef.current ? (Date.now() - recordStartRef.current) / 60000 : 1;
          const wpm = elapsed > 0.05 ? Math.round(words / elapsed) : 0;
          const fillers = countFillers(merged);
          const confidence = calcConfidence(fillers, wpm);
          setLiveWPM(wpm);
          setLiveFillers(fillers);
          setLiveConfidence(confidence);
          answerTextRef.current = merged;
          setAnswerText(merged);
          if (piece) setError(null);
        } catch (err) {
          console.error(err);
          setError(err.response?.data?.error || err.message || "Could not transcribe audio. Try again or type your answer.");
        } finally {
          cleanupStream();
          mediaRecorderRef.current = null;
          chunksRef.current = [];
          setIsTranscribing(false);
          resolve(answerTextRef.current);
        }
      };

      setIsRecording(false);
      try {
        if (rec.state === "recording") rec.requestData();
      } catch {}
      rec.stop();
    });
  }, []);

  const startRecording = useCallback(async () => {
    if (typeof MediaRecorder === "undefined") {
      setError("This browser cannot record audio. Try Chrome or Edge.");
      return;
    }
    if (isTranscribing) return;

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (permErr) {
      if (permErr.name === "NotAllowedError" || permErr.name === "PermissionDeniedError") {
        setError("Microphone access denied. Allow the microphone in your browser settings and try again.");
      } else {
        setError("Could not access the microphone. Check your device and browser settings.");
      }
      return;
    }

    try {
      recordingBaseRef.current = answerTextRef.current;
      recordStartRef.current = Date.now();
      chunksRef.current = [];

      const mimeType = pickAudioMimeType();
      const rec = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      mediaStreamRef.current = stream;
      mediaRecorderRef.current = rec;
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.start(250);
      setError(null);
      setIsRecording(true);
    } catch (e) {
      stream.getTracks().forEach((t) => t.stop());
      setError("Could not start recording. Try again.");
    }
  }, [isTranscribing]);

  /* ─── Start Interview ─── */
  const handleStart = async () => {
    if (!resumeText.trim()) { setError("Please paste your resume text."); return; }
    setError(null);
    setLoading(true);
    try {
      const data = await generateMockQuestions(resumeText, jobRole);
      setQuestions(data.questions || []);
      setAnswers([]);
      setCurrentQ(0);
      setTimeLeft(QUESTION_TIME);
      setStage("interview");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to generate questions.");
    } finally {
      setLoading(false);
    }
  };

  /* ─── Evaluate (declared before Next so deps stay correct) ─── */
  const handleEvaluate = useCallback(async (finalAnswers) => {
    setStage("evaluating");
    setError(null);

    const n = Math.max(1, finalAnswers.length);
    const avgWPM = Math.round(finalAnswers.reduce((s, a) => s + a.wpm, 0) / n);
    const totalFillers = finalAnswers.reduce((s, a) => s + a.fillerCount, 0);
    const avgConfidence = Math.round(finalAnswers.reduce((s, a) => s + a.confidenceScore, 0) / n);

    try {
      const data = await evaluateInterview(jobRole, finalAnswers, { avgWPM, totalFillers, avgConfidence });
      setResults(data);
      setStage("results");
    } catch (err) {
      setError(err.response?.data?.error || "Evaluation failed.");
      setStage("interview");
    }
  }, [jobRole]);

  /* ─── Next Question / Submit ─── */
  const handleNextQuestion = useCallback(async ({ skip = false } = {}) => {
    if (advancingRef.current) return;
    advancingRef.current = true;
    try {
      await stopRecording({ discard: skip });
      clearInterval(timerRef.current);

      const text = skip ? "" : answerTextRef.current.trim();
      const words = text.split(/\s+/).filter(Boolean).length;
      const elapsed = recordStartRef.current ? (Date.now() - recordStartRef.current) / 60000 : 1;
      const wpm = elapsed > 0.05 ? Math.round(words / elapsed) : 0;
      const fillers = countFillers(text);
      const confidence = calcConfidence(fillers, wpm);

      const answer = {
        question: questions[currentQ]?.question || "",
        type: questions[currentQ]?.type || "",
        answer: text,
        fillerCount: fillers,
        wpm,
        confidenceScore: confidence,
      };

      setAnswers((prev) => {
        const updated = [...prev, answer];
        if (currentQ >= questions.length - 1) {
          void handleEvaluate(updated);
        }
        return updated;
      });

      if (currentQ < questions.length - 1) {
        setCurrentQ((p) => p + 1);
        setAnswerText("");
        answerTextRef.current = "";
        setTimeLeft(QUESTION_TIME);
        setLiveWPM(0);
        setLiveFillers(0);
        setLiveConfidence(100);
        recordStartRef.current = null;
      }
    } finally {
      advancingRef.current = false;
    }
  }, [currentQ, questions, stopRecording, handleEvaluate]);

  handleNextQuestionRef.current = handleNextQuestion;

  /* ─── Reset ─── */
  const handleReset = (full = false) => {
    void stopRecording({ discard: true });
    clearInterval(timerRef.current);
    advancingRef.current = false;
    setQuestions([]);
    setAnswers([]);
    setResults(null);
    setCurrentQ(0);
    setAnswerText("");
    answerTextRef.current = "";
    setTimeLeft(QUESTION_TIME);
    setError(null);
    setLiveWPM(0);
    setLiveFillers(0);
    setLiveConfidence(100);
    setDotsCount(0);
    if (full) { setResumeText(""); setJobRole("Software Engineer"); }
    setStage("setup");
  };

  /* ═══════════════════════════════════════
     RENDER
     ═══════════════════════════════════════ */
  return (
    <PageWrapper>
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-semibold mb-4">
          <Mic size={14} /> Mock Interview
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-nexus-text">
          AI <span className="text-gradient-cyan">Mock Interview</span>
        </h1>
        <p className="text-nexus-muted mt-2 max-w-xl mx-auto text-sm">
          Practice with AI-generated questions, get real-time speech analysis, and receive detailed performance feedback.
        </p>
      </div>

      <ErrorBanner message={error} onDismiss={() => setError(null)} />

      <AnimatePresence mode="wait">
        {/* ═══ STAGE 1: SETUP ═══ */}
        {stage === "setup" && (
          <motion.div key="setup" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-2xl mx-auto space-y-6">
            {hasAutoLoaded && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-sm">
                <CheckCircle2 size={16} /> Resume auto-loaded from your last analysis
              </div>
            )}

            <div className="glass-card p-6 space-y-4">
              <label className="block text-sm font-semibold text-nexus-text">Resume Text</label>
              <textarea
                rows={6}
                value={resumeText}
                onChange={e => setResumeText(e.target.value)}
                placeholder="Paste your resume content here..."
                className="w-full rounded-xl bg-white/5 border border-white/10 p-4 text-sm text-nexus-text placeholder:text-nexus-muted/50 focus:outline-none focus:border-primary/50 resize-none"
              />
            </div>

            <div className="glass-card p-6 space-y-4">
              <label className="block text-sm font-semibold text-nexus-text">Job Role</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {JOB_ROLES.map(role => (
                  <button
                    key={role}
                    onClick={() => setJobRole(role)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium transition-all border ${
                      jobRole === role
                        ? "bg-primary/20 border-primary text-primary"
                        : "bg-white/5 border-white/10 text-nexus-muted hover:border-primary/30 hover:text-nexus-text"
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={handleStart} disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3">
              {loading ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating Questions...</>
              ) : (
                <><Mic size={16} /> Start Interview</>
              )}
            </button>
          </motion.div>
        )}

        {/* ═══ STAGE 2: INTERVIEW ═══ */}
        {stage === "interview" && questions.length > 0 && (
          <motion.div key="interview" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-3xl mx-auto space-y-6">
            {/* Progress bar */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-nexus-muted font-medium">Q{currentQ + 1}/{questions.length}</span>
              <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                <motion.div className="h-full rounded-full bg-primary" animate={{ width: `${((currentQ + 1) / questions.length) * 100}%` }} transition={{ duration: 0.4 }} />
              </div>
              <div className={`flex items-center gap-1 text-sm font-mono font-bold ${timeLeft <= 15 ? "text-red-400 animate-pulse" : "text-nexus-muted"}`}>
                <Clock size={14} /> {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
              </div>
            </div>

            {/* Question card */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQ}
                initial={{ opacity: 0, x: 60 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -60 }}
                transition={{ duration: 0.3 }}
                className="glass-card p-6 space-y-4"
              >
                <div className="flex items-center gap-2">
                  <span className="badge text-[10px]">{questions[currentQ]?.type}</span>
                </div>
                <p className="text-lg font-semibold text-nexus-text leading-relaxed">{questions[currentQ]?.question}</p>
                <p className="text-xs text-nexus-muted flex items-center gap-1"><Sparkles size={12} className="text-amber-400" /> Tip: {questions[currentQ]?.tip}</p>
              </motion.div>
            </AnimatePresence>

            {/* Answer area */}
            <div className="glass-card p-6 space-y-4">
              <textarea
                rows={4}
                value={answerText}
                onChange={e => setAnswerText(e.target.value)}
                placeholder="Type your answer or use the mic button to speak..."
                className="w-full rounded-xl bg-white/5 border border-white/10 p-4 text-sm text-nexus-text placeholder:text-nexus-muted/50 focus:outline-none focus:border-primary/50 resize-none"
              />

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => (isRecording ? void stopRecording() : void startRecording())}
                  disabled={isTranscribing}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 disabled:pointer-events-none ${
                    isRecording
                      ? "bg-red-500/20 border border-red-500 text-red-400 hover:bg-red-500/30"
                      : "bg-primary/20 border border-primary text-primary hover:bg-primary/30"
                  }`}
                >
                  {isTranscribing ? (
                    <><span className="w-4 h-4 border-2 border-primary/40 border-t-primary rounded-full animate-spin" /> Transcribing…</>
                  ) : isRecording ? (
                    <><MicOff size={16} /> Stop</>
                  ) : (
                    <><Mic size={16} /> Speak</>
                  )}
                </button>

                <button type="button" onClick={() => void handleNextQuestion()} disabled={isTranscribing} className="btn-primary flex items-center gap-2 py-2.5 px-5 disabled:opacity-50 disabled:pointer-events-none">
                  {currentQ >= questions.length - 1 ? "Submit" : "Next"} <ChevronRight size={16} />
                </button>

                <button
                  type="button"
                  onClick={() => void handleNextQuestion({ skip: true })}
                  disabled={isTranscribing}
                  className="ml-auto btn-ghost flex items-center gap-1 text-xs text-nexus-muted disabled:opacity-50 disabled:pointer-events-none"
                >
                  <SkipForward size={14} /> Skip
                </button>
              </div>
            </div>

            {/* ─── LIVE SPEECH INTELLIGENCE ─── */}
            <AnimatePresence>
              {isRecording && (
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.95 }}
                  className="glass-card p-6 border border-primary/30"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Volume2 size={16} className="text-primary animate-pulse" />
                    <span className="text-sm font-semibold text-nexus-text">Live Speech Intelligence</span>
                    <span className="ml-auto text-[10px] text-nexus-muted max-w-[12rem] text-right hidden sm:inline">Stop sends audio to the server for text.</span>
                    {/* Waveform bars */}
                    <div className="flex items-end gap-0.5 ml-auto h-5">
                      {[0.6, 1, 0.4, 0.8, 0.5].map((h, i) => (
                        <motion.div
                          key={i}
                          className="w-1 rounded-full bg-primary"
                          animate={{ height: [h * 20, h * 8, h * 20] }}
                          transition={{ duration: 0.5 + i * 0.1, repeat: Infinity, ease: "easeInOut" }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    {/* WPM */}
                    <div className="text-center">
                      <p className="text-3xl font-mono font-bold" style={{ color: scoreColor(liveWPM, [80, 80]) === "#10b981" ? (liveWPM > 180 ? "#ef4444" : "#10b981") : liveWPM < 80 ? "#f59e0b" : "#10b981" }}>
                        {liveWPM}
                      </p>
                      <p className="text-[10px] text-nexus-muted uppercase tracking-wider mt-1">WPM</p>
                      <div className="mt-2 h-1 rounded-full bg-white/10 overflow-hidden">
                        <motion.div className="h-full rounded-full" style={{ backgroundColor: liveWPM >= 80 && liveWPM <= 180 ? "#10b981" : liveWPM > 180 ? "#ef4444" : "#f59e0b" }} animate={{ width: `${Math.min(100, (liveWPM / 200) * 100)}%` }} transition={{ duration: 0.3 }} />
                      </div>
                    </div>

                    {/* Fillers */}
                    <div className="text-center">
                      <p className="text-3xl font-mono font-bold" style={{ color: liveFillers === 0 ? "#10b981" : liveFillers <= 2 ? "#f59e0b" : "#ef4444" }}>
                        {liveFillers}
                      </p>
                      <p className="text-[10px] text-nexus-muted uppercase tracking-wider mt-1">Fillers</p>
                      <div className="mt-2 h-1 rounded-full bg-white/10 overflow-hidden">
                        <motion.div className="h-full rounded-full" style={{ backgroundColor: liveFillers === 0 ? "#10b981" : liveFillers <= 2 ? "#f59e0b" : "#ef4444" }} animate={{ width: `${Math.min(100, liveFillers * 15)}%` }} transition={{ duration: 0.3 }} />
                      </div>
                    </div>

                    {/* Confidence */}
                    <div className="text-center">
                      <p className="text-3xl font-mono font-bold" style={{ color: liveConfidence >= 80 ? "#10b981" : liveConfidence >= 60 ? "#f59e0b" : "#ef4444" }}>
                        {liveConfidence}
                      </p>
                      <p className="text-[10px] text-nexus-muted uppercase tracking-wider mt-1">Confidence</p>
                      <div className="mt-2 h-1 rounded-full bg-white/10 overflow-hidden">
                        <motion.div className="h-full rounded-full" style={{ backgroundColor: liveConfidence >= 80 ? "#10b981" : liveConfidence >= 60 ? "#f59e0b" : "#ef4444" }} animate={{ width: `${liveConfidence}%` }} transition={{ duration: 0.3 }} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ═══ STAGE 3: EVALUATING ═══ */}
        {stage === "evaluating" && (
          <motion.div key="evaluating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center gap-6 py-20">
            <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
              <Brain size={64} className="text-primary" />
            </motion.div>
            <p className="text-lg font-semibold text-nexus-text">Analyzing your performance...</p>
            <div className="flex items-center gap-2">
              {[0, 1, 2, 3, 4].map(i => (
                <motion.div
                  key={i}
                  className={`w-3 h-3 rounded-full ${i < dotsCount ? "bg-primary" : "bg-white/10"}`}
                  animate={i < dotsCount ? { scale: [0, 1.3, 1] } : {}}
                  transition={{ duration: 0.4 }}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* ═══ STAGE 4: RESULTS ═══ */}
        {stage === "results" && results && (
          <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-3xl mx-auto space-y-6">
            {/* Hero score */}
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-card p-8 text-center">
              <Trophy size={48} className={`mx-auto mb-3 ${results.overall_score >= 75 ? "text-emerald-400" : results.overall_score >= 50 ? "text-amber-400" : "text-red-400"}`} />
              <h2 className="text-2xl font-extrabold text-nexus-text mb-2">Interview Complete</h2>

              <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-bold ${
                results.hire_recommendation === "Strong Yes" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" :
                results.hire_recommendation === "Yes" ? "bg-green-500/20 text-green-400 border border-green-500/30" :
                results.hire_recommendation === "Maybe" ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" :
                "bg-red-500/20 text-red-400 border border-red-500/30"
              }`}>
                {results.hire_recommendation}
              </span>
              {results.overall_score === 0 && (
                <p className="mt-4 text-sm text-amber-400/95 max-w-md mx-auto leading-relaxed">
                  Overall score is 0 because no question had a real answer (we need at least ~8 words per answer to score content). Try again and type or speak a short paragraph for each question.
                </p>
              )}
            </motion.div>

            {/* Score rings */}
            <div className="grid grid-cols-3 gap-4">
              {results.evaluations && (() => {
                const evs = results.evaluations;
                const n = Math.max(1, evs.length);
                const avgContent = Math.round(evs.reduce((s, e) => s + (Number(e.content_score) || 0), 0) / n);
                const avgDelivery = Math.round(evs.reduce((s, e) => s + (Number(e.delivery_score) || 0), 0) / n);
                return (
                  <>
                    <ScoreRing score={results.overall_score || 0} label="Overall" color="emerald" />
                    <ScoreRing score={avgContent} label="Content" color="cyan" />
                    <ScoreRing score={avgDelivery} label="Delivery" color="amber" />
                  </>
                );
              })()}
            </div>

            {/* Speech stats */}
            <div className="glass-card p-6">
              <h3 className="text-sm font-semibold text-nexus-text mb-4 flex items-center gap-2"><Volume2 size={16} className="text-primary" /> Speech Analytics</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-mono font-bold text-cyan-400">{answers.length ? Math.round(answers.reduce((s, a) => s + a.wpm, 0) / answers.length) : 0}</p>
                  <p className="text-[10px] text-nexus-muted uppercase">Avg WPM</p>
                </div>
                <div>
                  <p className="text-2xl font-mono font-bold text-amber-400">{answers.reduce((s, a) => s + a.fillerCount, 0)}</p>
                  <p className="text-[10px] text-nexus-muted uppercase">Total Fillers</p>
                </div>
                <div>
                  <p className="text-2xl font-mono font-bold text-emerald-400">{answers.length ? Math.round(answers.reduce((s, a) => s + a.confidenceScore, 0) / answers.length) : 0}</p>
                  <p className="text-[10px] text-nexus-muted uppercase">Avg Confidence</p>
                </div>
              </div>
              {results.speech_verdict && <p className="text-xs text-nexus-muted mt-4 text-center italic">{results.speech_verdict}</p>}
            </div>

            {/* Overall feedback */}
            <p className="text-sm text-nexus-muted text-center">{results.overall_feedback}</p>

            {/* Strength / Improvement */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {results.top_strength && results.top_strength !== "—" && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
                  <p className="text-xs font-bold text-emerald-400 uppercase mb-1 flex items-center gap-1"><TrendingUp size={12} /> Top Strength</p>
                  <p className="text-sm text-nexus-text">{results.top_strength}</p>
                </div>
              )}
              {results.top_improvement && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25">
                  <p className="text-xs font-bold text-amber-400 uppercase mb-1 flex items-center gap-1"><Target size={12} /> Improve</p>
                  <p className="text-sm text-nexus-text">{results.top_improvement}</p>
                </div>
              )}
            </div>

            {/* Per-question breakdown */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-nexus-text">Question Breakdown</h3>
              {results.evaluations?.map((ev, idx) => (
                <motion.div
                  key={ev.id || idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="glass-card-sm p-4"
                >
                  <button onClick={() => setExpandedQ(expandedQ === idx ? null : idx)} className="w-full flex items-center justify-between text-left">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="badge text-[10px]">{questions[idx]?.type}</span>
                        <span className="text-xs text-nexus-muted">Q{idx + 1}</span>
                      </div>
                      <p className="text-sm text-nexus-text truncate">{questions[idx]?.question}</p>
                    </div>
                    <div className="flex items-center gap-3 ml-3 shrink-0">
                      <div className="text-right">
                        <p className="text-lg font-bold" style={{ color: ev.overall_score >= 70 ? "#10b981" : ev.overall_score >= 40 ? "#f59e0b" : "#ef4444" }}>{ev.overall_score}</p>
                        <p className="text-[9px] text-nexus-muted">Score</p>
                      </div>
                      {expandedQ === idx ? <ChevronUp size={16} className="text-nexus-muted" /> : <ChevronDown size={16} className="text-nexus-muted" />}
                    </div>
                  </button>

                  <AnimatePresence>
                    {expandedQ === idx && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="pt-4 mt-4 border-t border-white/10 space-y-3">
                          <div className="flex items-center gap-4 text-xs">
                            <span className="text-nexus-muted">Content: <b className="text-nexus-text">{ev.content_score}</b></span>
                            <span className="text-nexus-muted">Delivery: <b className="text-nexus-text">{ev.delivery_score}</b></span>
                          </div>
                          <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                            <p className="text-[10px] uppercase text-nexus-muted font-bold mb-1">Your answer (submitted)</p>
                            <p className="text-sm text-nexus-text whitespace-pre-wrap leading-relaxed">
                              {(answers[idx]?.answer || "").trim() ? answers[idx].answer : "(skipped or empty)"}
                            </p>
                          </div>
                          <p className="text-sm text-nexus-text">{ev.feedback}</p>
                          
                          <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                            <p className="text-[10px] uppercase text-nexus-muted font-bold mb-1">Ideal Answer</p>
                            <p className="text-xs text-nexus-muted leading-relaxed">{ev.ideal_answer}</p>
                          </div>

                          {ev.keyword_hits?.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {ev.keyword_hits.map((kw, ki) => (
                                <span key={ki} className="px-2 py-0.5 rounded-full bg-primary/10 border border-primary/25 text-primary text-[10px] font-medium">{kw}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 justify-center pt-4">
              <button onClick={() => handleReset(false)} className="btn-primary flex items-center gap-2 px-6 py-3">
                <RotateCcw size={16} /> Try Again
              </button>
              <button onClick={() => handleReset(true)} className="btn-ghost flex items-center gap-2 px-6 py-3 text-nexus-muted">
                New Role
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageWrapper>
  );
}
