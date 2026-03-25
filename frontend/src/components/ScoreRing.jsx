import { motion } from "framer-motion";
export default function ScoreRing({
  score = 0,
  label = "",
  color = "cyan",
  size = 140,
  thickness = 10,
}) {
  const colors = {
    cyan: ["#06b6d4", "#14b8a6"],
    indigo: ["#6366f1", "#8b5cf6"],
    emerald: ["#10b981", "#34d399"],
    amber: ["#f59e0b", "#fbbf24"],
  };
  const [c1, c2] = colors[color] ?? colors.cyan;
  const gradId = `ring-${label.replace(/\s/g, "")}-${color}`;
  const r = (size - thickness) / 2;
  const cx = size / 2;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const gap = circ - dash;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={c1} />
              <stop offset="100%" stopColor={c2} />
            </linearGradient>
          </defs>
          <circle
            cx={cx}
            cy={cx}
            r={r}
            fill="none"
            stroke="var(--border)"
            strokeWidth={thickness}
            className="opacity-50"
          />
          <motion.circle
            cx={cx}
            cy={cx}
            r={r}
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth={thickness}
            strokeLinecap="round"
            strokeDasharray={`${circ}`}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: circ - dash }}
            transition={{ duration: 1.4, ease: "easeOut", delay: 0.2 }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="text-2xl font-bold"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, duration: 0.4 }}
            style={{ color: c1 }}
          >
            {score}
          </motion.span>
          <span className="text-[10px] text-muted-foreground font-medium tracking-wide uppercase">
            /100
          </span>
        </div>
      </div>
      <span className="text-[11px] text-muted-foreground font-bold tracking-wider uppercase mt-1">
        {label}
      </span>
    </div>
  );
}
