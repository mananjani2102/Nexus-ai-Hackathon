import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
function useParticleCanvas(canvasRef) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;
    let particles = [];
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);
    const COUNT = Math.min(40, Math.floor(window.innerWidth / 30));
    for (let i = 0; i < COUNT; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 1.5 + 0.5,
        opacity: Math.random() * 0.3 + 0.1,
        color: Math.random() > 0.5 ? "52, 168, 90" : "102, 217, 239",
      });
    }
    const CONNECTION_DIST = 120;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECTION_DIST) {
            const alpha = (1 - dist / CONNECTION_DIST) * 0.08;
            ctx.strokeStyle = `rgba(102, 217, 239, ${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color}, ${p.opacity})`;
        ctx.fill();
      }
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, [canvasRef]);
}
function NexusLogo() {
  return (
    <svg
      viewBox="0 0 80 80"
      className="w-16 h-16 sm:w-20 sm:h-20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <polygon
        points="40,4 72,22 72,58 40,76 8,58 8,22"
        stroke="url(#logoGrad)"
        strokeWidth="1.5"
        fill="none"
      />
      <polygon
        points="40,16 60,28 60,52 40,64 20,52 20,28"
        stroke="url(#logoGrad)"
        strokeWidth="1"
        fill="none"
        opacity="0.4"
      />
      <circle cx="40" cy="40" r="6" fill="url(#logoGrad)" />
      <circle
        cx="40"
        cy="40"
        r="10"
        stroke="url(#logoGrad)"
        strokeWidth="0.8"
        fill="none"
        opacity="0.3"
      />
      <defs>
        <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--primary, #34a85a)" />
          <stop offset="100%" stopColor="var(--accent, #66d9ef)" />
        </linearGradient>
      </defs>
    </svg>
  );
}
export default function BrandIntro({ children, onComplete }) {
  const [showIntro, setShowIntro] = useState(true);
  const canvasRef = useRef(null);
  useParticleCanvas(canvasRef);
  useEffect(() => {
    const timer = setTimeout(() => setShowIntro(false), 3000);
    return () => clearTimeout(timer);
  }, []);
  return (
    <>
      <AnimatePresence onExitComplete={() => onComplete?.()}>
        {showIntro && (
          <motion.div
            key="brand-intro"
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-background"
            exit={{ opacity: 0, scale: 1.04 }}
            transition={{ duration: 0.65, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/8 blur-[120px]" />
              <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] rounded-full bg-accent/6 blur-[100px]" />
            </div>
            <canvas
              ref={canvasRef}
              className="absolute inset-0 z-0 opacity-60"
            />
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{
                duration: 1.2,
                ease: [0.22, 1, 0.36, 1],
                delay: 0.1,
              }}
              className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/60 to-transparent origin-center z-20"
            />
            <div className="relative z-10 flex flex-col items-center px-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 200,
                  damping: 20,
                  delay: 0.15,
                }}
              >
                <NexusLogo />
              </motion.div>
              <div className="overflow-hidden mt-5">
                <motion.h1
                  initial={{ y: "120%" }}
                  animate={{ y: "0%" }}
                  transition={{
                    duration: 0.65,
                    ease: [0.22, 1, 0.36, 1],
                    delay: 0.4,
                  }}
                  className="text-[clamp(36px,7vw,64px)] font-black tracking-tight leading-none
                             bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent
                             font-sans select-none"
                >
                  Nexus AI
                </motion.h1>
              </div>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut", delay: 0.85 }}
                className="mt-3 uppercase tracking-[0.22em] text-muted-foreground text-xs sm:text-sm font-medium
                           font-sans select-none"
              >
                Resume Intelligence Platform
              </motion.p>
              <motion.div
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                transition={{
                  duration: 0.7,
                  ease: [0.22, 1, 0.36, 1],
                  delay: 0.7,
                }}
                className="mt-5 h-px w-48 bg-gradient-to-r from-transparent via-border to-transparent origin-center"
              />
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.1, duration: 0.4 }}
                className="mt-6 flex items-center gap-3"
              >
                <div className="flex gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-primary/60"
                      animate={{
                        opacity: [0.3, 1, 0.3],
                        scale: [0.8, 1.1, 0.8],
                      }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        delay: i * 0.2,
                        ease: "easeInOut",
                      }}
                    />
                  ))}
                </div>
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.55, 0.55, 0] }}
                  transition={{
                    duration: 1.8,
                    times: [0, 0.15, 0.75, 1],
                    delay: 1.1,
                  }}
                  className="font-mono text-[11px] text-muted-foreground/60 tracking-widest select-none"
                >
                  LOADING
                </motion.span>
              </motion.div>
            </div>
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{
                duration: 1.2,
                ease: [0.22, 1, 0.36, 1],
                delay: 0.1,
              }}
              className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-accent/40 to-transparent origin-center z-20"
            />
          </motion.div>
        )}
      </AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: showIntro ? 0 : 1 }}
        transition={{ duration: 0.5, delay: showIntro ? 0 : 0.15 }}
      >
        {children}
      </motion.div>
    </>
  );
}
