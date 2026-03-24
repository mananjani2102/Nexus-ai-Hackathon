import { motion } from "framer-motion";
import { AlertCircle, X } from "lucide-react";
export default function ErrorBanner({ message, onDismiss }) {
  if (!message) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="flex items-start gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300"
    >
      <AlertCircle size={18} className="shrink-0 mt-0.5" />
      <p className="text-sm flex-1">{message}</p>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-rose-400 hover:text-rose-200"
        >
          <X size={16} />
        </button>
      )}
    </motion.div>
  );
}
