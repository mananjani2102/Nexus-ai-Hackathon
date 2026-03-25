import { motion } from "framer-motion";

const TRANSITION_DURATION = 0.45;

const pageVariants = {
  initial: { opacity: 0, y: 18, filter: "blur(6px)" },
  animate: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: TRANSITION_DURATION, ease: [0.25, 0.46, 0.45, 0.94] },
  },
  exit: {
    opacity: 0,
    y: -12,
    filter: "blur(4px)",
    transition: { duration: TRANSITION_DURATION * 0.7, ease: "easeIn" },
  },
};
export default function PageWrapper({ children }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="min-h-screen pt-24 pb-16 px-4 sm:px-6 max-w-7xl mx-auto"
    >
      {children}
    </motion.div>
  );
}
