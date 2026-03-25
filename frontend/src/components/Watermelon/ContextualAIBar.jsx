import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Sparkles, Music, Wand2, Type, Zap } from 'lucide-react';

export const ContextualAIBar = ({
    defaultExpanded = false,
    placeholder = 'Refine with AI',
    tools = [],
    musicIcon = <Wand2 size={18} />,
    sparkleIcon = <Sparkles size={18} />,
    onSend,
    onToolClick
}) => {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);
    const [inputValue, setInputValue] = useState('');

    const spring = {
        type: 'spring',
        stiffness: 220,
        damping: 16,
        mass: 1.2,
    };

    const handleSend = () => {
        if (inputValue.trim() && onSend) {
            onSend(inputValue);
            setInputValue('');
        }
    };

    return (
        <motion.div
            layout
            transition={spring}
            className="relative flex w-full max-w-[calc(100vw-32px)] items-center justify-between overflow-hidden rounded-full border border-white/10 bg-neutral-100 p-1 shadow-sm sm:max-w-md dark:bg-neutral-900/60 backdrop-blur-md"
        >
            <motion.div
                layout
                className="flex shrink-0 items-center gap-1 rounded-full bg-white p-1 shadow-md dark:bg-neutral-800"
            >
                <motion.button
                    onClick={() => setIsExpanded(false)}
                    whileTap={{ scale: 0.9 }}
                    className="relative rounded-full p-2.5 outline-none"
                >
                    {!isExpanded && (
                        <motion.div
                            layoutId="active-pill"
                            transition={spring}
                            className="absolute inset-0 rounded-full bg-neutral-200 dark:bg-neutral-700"
                        />
                    )}

                    <div className="relative z-10 text-neutral-600 dark:text-neutral-300">{musicIcon}</div>
                </motion.button>

                <motion.button
                    onClick={() => setIsExpanded(true)}
                    whileTap={{ scale: 0.9 }}
                    className="relative rounded-full p-2.5 outline-none"
                >
                    {isExpanded && (
                        <motion.div
                            layoutId="active-pill"
                            transition={spring}
                            className="absolute inset-0 rounded-full bg-neutral-200 dark:bg-neutral-700"
                        />
                    )}

                    <motion.div
                        className="relative z-10 text-emerald-500"
                        animate={{
                            scale: [1, 1.15, 1],
                            filter: ["drop-shadow(0 0 0px rgba(16, 185, 129, 0))", "drop-shadow(0 0 4px rgba(16, 185, 129, 0.4))", "drop-shadow(0 0 0px rgba(16, 185, 129, 0))"]
                        }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                    >
                        {sparkleIcon}
                    </motion.div>
                </motion.button>
            </motion.div>

            <AnimatePresence mode="popLayout" initial={false}>
                {!isExpanded ? (
                    <motion.div
                        key="tools"
                        initial={{ opacity: 0, filter: 'blur(4px)', x: 22 }}
                        animate={{ opacity: 1, filter: 'blur(0px)', x: 0 }}
                        exit={{ opacity: 0, filter: 'blur(4px)', x: 30 }}
                        transition={spring}
                        className="flex flex-1 items-center justify-end gap-3 px-4 sm:gap-5"
                    >
                        {tools.map((tool, index) => (
                            <ToolIcon key={index} onClick={() => onToolClick && onToolClick(tool.id)}>
                                {tool.icon}
                            </ToolIcon>
                        ))}
                    </motion.div>
                ) : (
                    <motion.div
                        key="input"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={spring}
                        className="flex flex-1 items-center gap-1 pl-2 sm:gap-2 sm:pl-4"
                    >
                        <input
                            autoFocus
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder={placeholder}
                            className="w-full flex-1 border-none bg-transparent text-base text-gray-800 placeholder-gray-400 outline-none dark:text-neutral-100 dark:placeholder-neutral-500"
                        />

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.92 }}
                            transition={spring}
                            onClick={handleSend}
                            className="shrink-0 rounded-full border border-gray-100 bg-[#fcfcfc] p-2 text-black shadow-md hover:bg-gray-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700"
                        >
                            <ArrowRight
                                size={18}
                                strokeWidth={2.5}
                            />
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

const ToolIcon = ({ children, onClick }) => (
    <motion.button
        whileHover={{ scale: 1.1, y: -2 }}
        whileTap={{ scale: 0.9 }}
        onClick={onClick}
        transition={{
            type: 'spring',
            stiffness: 300,
            damping: 26,
            mass: 1.1,
        }}
        className="cursor-pointer text-neutral-500 hover:text-indigo-500 dark:text-neutral-400 dark:hover:text-indigo-400"
    >
        {children}
    </motion.button>
);
