import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Upload,
  Zap,
  Lightbulb,
  Sparkles,
  History,
  Play,
  Pause,
  RotateCcw,
} from "lucide-react";
const SCENES = [
  {
    id: "intro",
    title: "Nexus AI Optimizer",
    subtitle: "Enterprise Resume Intelligence",
    icon: Zap,
    color: "from-cyan-500 to-indigo-500",
    desc: "A complete 6-page suite designed to beat ATS algorithms and land interviews.",
  },
  {
    id: "upload",
    title: "Secure Data Ingest",
    subtitle: "Upload Page",
    icon: Upload,
    color: "from-emerald-400 to-teal-500",
    desc: "Drag & Drop your PDF. We extract the text locally and tailor the analysis to your specific Target Job Role.",
  },
  {
    id: "dashboard",
    title: "The Command Center",
    subtitle: "Analysis Dashboard",
    icon: LayoutDashboard,
    color: "from-indigo-500 to-violet-500",
    desc: "View your Overall, ATS, and Clarity scores via animated rings. Immediately spot your missing critical keywords.",
  },
  {
    id: "fixes",
    title: "Actionable Insights",
    subtitle: "AI Fixes Roadmap",
    icon: Lightbulb,
    color: "from-amber-400 to-orange-500",
    desc: "A prioritized timeline of fixes. See exactly what structural and phrasing weaknesses are holding you back.",
  },
  {
    id: "bullet",
    title: "STAR Method Engine",
    subtitle: "Bullet Pro",
    icon: Sparkles,
    color: "from-cyan-400 to-blue-500",
    desc: "A side-by-side diff tool translating weak bullet points into metric-driven power statements instantly.",
  },
  {
    id: "history",
    title: "Performance Tracking",
    subtitle: "History Page",
    icon: History,
    color: "from-rose-400 to-pink-500",
    desc: "Keep track of all past analyses with inline sparkline charts charting your resume's improvement over time.",
  },
];
const SCENE_DURATION = 5000;
export default function DemoVideoPlayer() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    let interval;
    let progressInterval;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentIndex((prev) => {
          if (prev === SCENES.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
        setProgress(0);
      }, SCENE_DURATION);
      progressInterval = setInterval(() => {
        setProgress((p) => Math.min(p + 100 / (SCENE_DURATION / 50), 100));
      }, 50);
    }
    return () => {
      clearInterval(interval);
      clearInterval(progressInterval);
    };
  }, [isPlaying, currentIndex]);
  const handleRestart = () => {
    setCurrentIndex(0);
    setProgress(0);
    setIsPlaying(true);
  };
  const scene = SCENES[currentIndex];
  const Icon = scene.icon;
  return (
    <div className="relative w-full h-full bg-navy-950 flex flex-col overflow-hidden select-none">
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={scene.id}
            initial={{ scale: 1.2, opacity: 0, rotate: -5 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className={`absolute inset-0 bg-gradient-to-br ${scene.color}`}
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-navy-950/80 to-navy-950" />
      </div>
      <div className="flex-1 relative flex flex-col items-center justify-center p-8 text-center z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={scene.id}
            initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -30, filter: "blur(10px)" }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center max-w-2xl"
          >
            <div
              className={`w-20 h-20 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-br ${scene.color} p-0.5 mb-8 shadow-2xl`}
            >
              <div className="w-full h-full bg-navy-950/90 rounded-[22px] flex items-center justify-center backdrop-blur-md">
                <Icon size={46} className="text-white drop-shadow-md" />
              </div>
            </div>
            <h4 className="text-cyan-400 font-mono text-sm tracking-[0.2em] uppercase mb-3">
              {scene.subtitle}
            </h4>
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-6 tracking-tight drop-shadow-lg">
              {scene.title}
            </h2>
            <p className="text-lg sm:text-xl text-nexus-muted leading-relaxed font-medium">
              {scene.desc}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="h-16 bg-navy-900/80 backdrop-blur-md border-t border-white/10 flex items-center px-6 z-20 gap-4">
        <button
          onClick={() =>
            isPlaying
              ? setIsPlaying(false)
              : currentIndex === SCENES.length - 1
                ? handleRestart()
                : setIsPlaying(true)
          }
          className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center text-white transition-colors"
        >
          {currentIndex === SCENES.length - 1 ? (
            <RotateCcw size={20} />
          ) : isPlaying ? (
            <Pause size={20} />
          ) : (
            <Play size={20} className="ml-1" />
          )}
        </button>
        <div className="flex-1 flex gap-2 h-1.5 items-center">
          {SCENES.map((_, idx) => (
            <div
              key={idx}
              className="flex-1 h-full bg-navy-950 rounded-full overflow-hidden relative cursor-pointer"
              onClick={() => {
                setCurrentIndex(idx);
                setProgress(0);
                setIsPlaying(true);
              }}
            >
              {idx < currentIndex && (
                <div className="absolute inset-0 bg-cyan-500" />
              )}
              {idx === currentIndex && (
                <div
                  className="absolute top-0 left-0 bottom-0 bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]"
                  style={{ width: `${progress}%` }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
      {!isPlaying && currentIndex === SCENES.length - 1 && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-navy-950/60 backdrop-blur-sm">
          <button
            onClick={handleRestart}
            className="btn-primary py-4 px-10 shadow-glow-cyan flex items-center gap-3"
          >
            <RotateCcw size={20} />
            Restart Demo Tour
          </button>
        </div>
      )}
    </div>
  );
}
