import { motion, AnimatePresence } from 'framer-motion';
import React, { useState, useEffect } from 'react';

export const LabeledProgressIndicator = ({
    labels = ["Processing...", "Analyzing...", "Finalizing..."],
    progress = '55%',
    intervalMs = 2000,
}) => {
    const [labelIndex, setLabelIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setLabelIndex((prev) => (prev + 1) % labels.length);
        }, intervalMs);

        return () => clearInterval(interval);
    }, [labels.length, intervalMs]);

    return (
        <div className="flex flex-col items-center gap-8 w-full max-w-sm mx-auto">
            <div className="relative flex w-full items-center justify-center h-12" style={{ perspective: '800px' }}>
                <AnimatePresence mode="popLayout">
                    <motion.span
                        key={labelIndex}
                        initial={{
                            opacity: 0,
                            y: 10,
                            scale: 1.5,
                            filter: 'blur(4px)',
                            rotateX: -60,
                        }}
                        animate={{
                            opacity: 1,
                            y: 0,
                            scale: 1,
                            filter: 'blur(0px)',
                            rotateX: 0,
                        }}
                        exit={{
                            opacity: 0,
                            filter: 'blur(4px)',
                            rotateX: 90,
                            scale: 0.9,
                        }}
                        transition={{
                            type: 'spring',
                            stiffness: 400,
                            damping: 30,
                            mass: 1,
                        }}
                        className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-nexus-text text-center will-change-transform"
                    >
                        {labels[labelIndex]}
                    </motion.span>
                </AnimatePresence>
            </div>

            <div className="h-3 w-full overflow-hidden rounded-full border border-black/5 bg-gray-100 shadow-inner dark:border-white/5 dark:bg-zinc-900 mt-2">
                <motion.div
                    initial={{ width: '0%' }}
                    animate={{ width: progress }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                    className="relative h-full overflow-hidden rounded-full bg-primary"
                >
                    <motion.div
                        initial={{ x: '-100%' }}
                        animate={{ x: '200%' }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: 'linear',
                        }}
                        className="absolute inset-y-0 w-full bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    />
                </motion.div>
            </div>
        </div>
    );
};
