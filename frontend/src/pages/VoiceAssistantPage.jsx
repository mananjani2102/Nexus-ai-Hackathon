import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Send, Loader2, Volume2, VolumeX, Bot, User } from "lucide-react";
import PageWrapper from "../components/PageWrapper";
import { useResume } from "../context/ResumeContext";
import { useAuth } from "../context/AuthContext";
import { chatWithVoiceAssistant } from "../services/api";

const SUGGESTIONS = [
  "How can I improve my ATS score?",
  "What keywords am I missing?",
  "Rewrite my professional summary",
  "Am I ready for this role?",
  "What are my biggest weaknesses?",
  "Give me 3 quick wins",
];

export default function VoiceAssistantPage() {
  const { analysisResult, jobRole } = useResume();
  const { user } = useAuth();
  const resumeText = analysisResult?.resumeText || "";

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `Hey${user?.name ? ` ${user.name}` : ""}! 👋 I'm Nexus, your AI resume coach. Ask me anything about your resume, career strategy, or interview prep.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [speakEnabled, setSpeakEnabled] = useState(true);
  const [error, setError] = useState("");

  const conversationHistory = useRef([]);
  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const chatContainerRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 80);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, scrollToBottom]);

  const speak = useCallback(
    (text) => {
      if (!speakEnabled || !window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    },
    [speakEnabled],
  );

  const sendMessage = useCallback(
    async (text) => {
      const trimmed = (text || "").trim();
      if (!trimmed || loading) return;

      setError("");
      setInput("");

      const userMsg = { role: "user", content: trimmed };
      setMessages((prev) => [...prev, userMsg]);
      conversationHistory.current = [...conversationHistory.current, userMsg].slice(-12);

      setLoading(true);
      try {
        const { reply } = await chatWithVoiceAssistant(
          trimmed,
          resumeText,
          jobRole || "Software Engineer",
          conversationHistory.current.slice(-6),
        );
        const aiMsg = { role: "assistant", content: reply };
        setMessages((prev) => [...prev, aiMsg]);
        conversationHistory.current = [...conversationHistory.current, aiMsg].slice(-12);
        speak(reply);
      } catch (err) {
        const errMsg = err?.response?.data?.error || err.message || "Something went wrong";
        setError(errMsg);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Sorry, I couldn't process that. Please try again." },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [loading, resumeText, jobRole, speak],
  );

  const toggleMic = useCallback(() => {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Speech recognition is not supported in this browser. Try Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setListening(false);
      if (transcript.trim()) {
        sendMessage(transcript);
      }
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setListening(false);
      if (event.error === "not-allowed") {
        setError("Microphone access denied. Please allow mic permissions.");
      } else {
        setError(`Speech error: ${event.error}`);
      }
    };

    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
    setError("");
  }, [listening, sendMessage]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const noResume = !resumeText;

  return (
    <PageWrapper>
      <div className="min-h-screen pt-24 pb-10 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">
              <span className="text-gradient-cyan">Voice</span>{" "}
              <span className="text-nexus-text">Resume Assistant</span>
            </h1>
            <p className="text-nexus-muted text-sm sm:text-base">
              Ask anything about your resume — by voice or by typing
            </p>
          </motion.div>

          {/* Chat Window */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-4 sm:p-6 mb-4"
          >
            <div
              ref={chatContainerRef}
              className="min-h-[380px] max-h-[420px] overflow-y-auto pr-2 space-y-4 scrollbar-thin"
              style={{ scrollbarWidth: "thin" }}
            >
              <AnimatePresence initial={false}>
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.25 }}
                    className={`flex items-end gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.role === "assistant" && (
                      <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mb-1">
                        <Bot size={14} className="text-primary" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] px-4 py-2.5 text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "bg-[#7C3AED] text-white rounded-2xl rounded-br-sm"
                          : "bg-white/5 border border-white/10 text-nexus-text rounded-2xl rounded-bl-sm"
                      }`}
                    >
                      {msg.content}
                    </div>
                    {msg.role === "user" && (
                      <div className="w-7 h-7 rounded-full bg-[#7C3AED]/20 flex items-center justify-center shrink-0 mb-1">
                        <User size={14} className="text-[#7C3AED]" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {loading && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-end gap-2 justify-start"
                >
                  <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mb-1">
                    <Bot size={14} className="text-primary" />
                  </div>
                  <div className="bg-white/5 border border-white/10 text-nexus-muted rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin" />
                    Thinking...
                  </div>
                </motion.div>
              )}

              <div ref={chatEndRef} />
            </div>
          </motion.div>

          {/* Suggestion Chips */}
          <AnimatePresence>
            {messages.length <= 1 && !loading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: 0.2 }}
                className="flex flex-wrap gap-2 mb-4 justify-center"
              >
                {SUGGESTIONS.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    disabled={noResume}
                    onClick={() => sendMessage(chip)}
                    className="rounded-full px-3.5 py-1.5 text-xs font-medium border border-white/15 text-nexus-muted
                      hover:bg-[#7C3AED]/15 hover:text-[#7C3AED] hover:border-[#7C3AED]/30
                      transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {chip}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-rose-400 text-xs text-center mb-3"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          {/* No Resume Warning */}
          {noResume && (
            <p className="text-amber-400/80 text-xs text-center mb-3">
              ⚠️ Upload a resume first on the Upload page to get personalized advice.
            </p>
          )}

          {/* Bottom Controls */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex items-center gap-3"
          >
            {/* Mic Button */}
            <div className="relative">
              {listening && (
                <span className="absolute inset-0 rounded-full border-2 border-rose-500 animate-ping" />
              )}
              <button
                type="button"
                onClick={toggleMic}
                disabled={noResume || loading}
                className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200
                  disabled:opacity-40 disabled:cursor-not-allowed
                  ${
                    listening
                      ? "bg-rose-500 text-white shadow-lg shadow-rose-500/30"
                      : "bg-[#7C3AED] text-white hover:bg-[#6D28D9] shadow-lg shadow-[#7C3AED]/25"
                  }`}
                aria-label={listening ? "Stop listening" : "Start voice input"}
              >
                {listening ? <MicOff size={20} /> : <Mic size={20} />}
              </button>
            </div>

            {/* Text Input */}
            <div className="flex-1 glass-card flex items-center gap-2 px-4 py-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={noResume || loading}
                placeholder={noResume ? "Upload a resume first..." : "Ask about your resume..."}
                className="flex-1 bg-transparent text-sm text-nexus-text placeholder:text-nexus-muted/50 outline-none disabled:cursor-not-allowed"
              />
              <button
                type="button"
                onClick={() => sendMessage(input)}
                disabled={noResume || loading || !input.trim()}
                className="text-[#7C3AED] hover:text-[#6D28D9] disabled:text-nexus-muted/30 disabled:cursor-not-allowed transition-colors"
                aria-label="Send message"
              >
                <Send size={18} />
              </button>
            </div>

            {/* Speaker Toggle */}
            <button
              type="button"
              onClick={() => {
                setSpeakEnabled((prev) => !prev);
                if (speakEnabled) window.speechSynthesis?.cancel();
              }}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 border
                ${
                  speakEnabled
                    ? "border-primary/30 bg-primary/10 text-primary hover:bg-primary/20"
                    : "border-white/10 bg-white/5 text-nexus-muted hover:bg-white/10"
                }`}
              aria-label={speakEnabled ? "Disable voice output" : "Enable voice output"}
            >
              {speakEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
          </motion.div>
        </div>
      </div>
    </PageWrapper>
  );
}
