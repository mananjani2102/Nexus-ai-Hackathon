import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
    Zap, ArrowRight, Play, Shield, Brain, TrendingUp,
    CheckCircle, Star, ChevronRight, ChevronDown, ChevronLeft, Quote, X, Upload, Sparkles
} from 'lucide-react';
import PageWrapper from '../components/PageWrapper';
import DemoVideoPlayer from '../components/DemoVideoPlayer';
import heroGraphic from '../assets/nexus-ai = bg - 03.png';
/* 
  Landing Page - Bento Grid Components
  This array defines the feature cards shown in the hero section.
  Staggered entrance animations are controlled by containerVariants.
*/
const bentoItems = [
    {
        title: 'AI-Powered Analysis',
        meta: 'NLP Engine',
        description: 'Deep NLP analysis against modern hiring algorithms and ATS systems',
        icon: Brain,
        iconColor: 'text-[#33cc33]',
        status: 'Live',
        tags: ['NLP', 'ATS', 'AI'],
        cta: 'Analyze Now',
        link: '/upload',
        colSpan: 2,
        hasPersistentHover: true,
    },
    {
        title: 'ATS Optimization',
        meta: '98% Match Rate',
        description: 'Match keywords and structure for leading applicant tracking software',
        icon: Shield,
        iconColor: 'text-[#66d9ef]',
        status: 'Active',
        tags: ['Keywords', 'Structure'],
        cta: 'Optimize',
        link: '/upload',
        colSpan: 1,
    },
    {
        title: 'Score Improvement',
        meta: 'Avg +67 points',
        description: 'Track resume performance across iterations with a visual timeline',
        icon: TrendingUp,
        iconColor: 'text-[#87ceeb]',
        status: 'Tracking',
        tags: ['Analytics', 'History'],
        cta: 'View Score',
        link: '/history',
        colSpan: 1,
    },
    {
        title: 'STAR Bullet Rewriter',
        meta: '2.4x Impact',
        description: 'Transform weak bullet points into powerful STAR-method achievements automatically',
        icon: Sparkles,
        iconColor: 'text-[#33cc33]',
        status: 'New',
        tags: ['STAR', 'Bullets', 'Impact'],
        cta: 'Rewrite Now',
        link: '/bullet',
        colSpan: 2,
    },
];

const stats = [
    { value: "94%", label: "Interview Rate Boost" },
    { value: "2.4×", label: "More Callbacks" },
    { value: "50K+", label: "Resumes Optimized" },
    { value: "3 sec", label: "Avg Analysis Time" },
];
const ticker = ['ATS MATCHING', 'STAR BULLETS', 'CLARITY SCORE', 'IMPACT ANALYSIS', 'KEYWORD EXTRACTION'];

const containerVariants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.12 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 24 },
    show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
};

const heroHeadlineContainer = {
    hidden: {},
    show: {
        transition: { staggerChildren: 0.16, delayChildren: 0.12 },
    },
};

const heroHeadlineLine = {
    hidden: { opacity: 0, y: 48, filter: "blur(10px)" },
    show: {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] },
    },
};

const testimonials = [
    {
        quote: "Nexus AI completely transformed my job search. My interview rate went from 5% to over 40% in just two weeks.",
        name: "Sarah Chen",
        role: "Senior Software Engineer",
        company: "Google",
    },
    {
        quote: "The STAR bullet rewriter alone is worth it. Every bullet point now reads like an achievement, not a task list.",
        name: "Marcus Johnson",
        role: "Product Manager",
        company: "Meta",
    },
    {
        quote: "I was skeptical about AI resume tools, but Nexus actually understands context. It caught issues no human reviewer found.",
        name: "Priya Patel",
        role: "Data Scientist",
        company: "Amazon",
    },
    {
        quote: "After using Nexus, I received 3 interview invitations within the first week. The ATS optimization is incredibly precise.",
        name: "James Wilson",
        role: "UX Designer",
        company: "Apple",
    },
];

const faqs = [
    {
        question: "How does Nexus AI analyze my resume?",
        answer: "Nexus AI uses advanced NLP algorithms to parse your resume against thousands of successful job applications. It evaluates keyword density, ATS compatibility, bullet point impact, and overall structure to provide actionable insights.",
    },
    {
        question: "Is my resume data secure?",
        answer: "Absolutely. We use end-to-end encryption and never store your resume data permanently. All analysis is performed in real-time, and your documents are automatically purged from our servers within 24 hours. We are fully GDPR compliant.",
    },
    {
        question: "What file formats are supported?",
        answer: "Nexus AI supports PDF, DOCX, DOC, and TXT file formats. For best results, we recommend uploading your resume as a PDF to preserve formatting integrity during analysis.",
    },
    {
        question: "Can I use Nexus AI for free?",
        answer: "Yes! Our free tier includes 3 full resume analyses per month with complete ATS scoring, keyword optimization, and basic STAR bullet suggestions. Premium plans unlock unlimited analyses, advanced rewriting, and priority processing.",
    },
    {
        question: "How accurate is the ATS scoring?",
        answer: "Our ATS scoring algorithm has been validated against the top 15 applicant tracking systems used by Fortune 500 companies. In blind tests, our scores correlate with actual ATS pass rates at 94% accuracy.",
    },
];

/* ─── CTA NEURAL TREE ─── */
function CtaNeuralTree() {
    const canvasRef = useRef(null);
    const mouseRef = useRef({ x: 0.5, y: 0.5 });
    const growthRef = useRef(0);
    const sectionRef = useRef(null);
    const rafRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const section = sectionRef.current;
        if (!canvas || !section) return;
        const ctx = canvas.getContext('2d');

        const resize = () => {
            const rect = section.getBoundingClientRect();
            canvas.width = rect.width * window.devicePixelRatio;
            canvas.height = rect.height * window.devicePixelRatio;
            ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
            canvas.style.width = rect.width + 'px';
            canvas.style.height = rect.height + 'px';
        };
        resize();
        window.addEventListener('resize', resize);

        const handleMouse = (e) => {
            const rect = section.getBoundingClientRect();
            mouseRef.current = {
                x: (e.clientX - rect.left) / rect.width,
                y: (e.clientY - rect.top) / rect.height,
            };
        };
        section.addEventListener('mousemove', handleMouse);

        const maxDepth = 8;

        function drawBranch(x, y, len, angle, depth) {
            if (depth > growthRef.current || depth > maxDepth || len < 2) return;

            const mouseInfluence = (mouseRef.current.x - 0.5) * 0.3;
            const adjustedAngle = angle + mouseInfluence * (depth / maxDepth);

            const endX = x + len * Math.cos(adjustedAngle);
            const endY = y + len * Math.sin(adjustedAngle);

            const opacity = 1 - depth / maxDepth;
            const isLeaf = depth >= maxDepth - 2;

            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(endX, endY);
            ctx.strokeStyle = isLeaf
                ? `rgba(102, 217, 239, ${opacity * 0.5})`
                : `rgba(51, 204, 51, ${opacity * 0.4})`;
            ctx.lineWidth = Math.max(1, (maxDepth - depth) * 0.8);
            ctx.stroke();

            if (isLeaf && depth <= growthRef.current) {
                ctx.beginPath();
                ctx.arc(endX, endY, 1.5, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(102, 217, 239, ${opacity * 0.6})`;
                ctx.fill();
            }

            const shrink = 0.68;
            const spread = 0.4 + mouseInfluence * 0.15;
            drawBranch(endX, endY, len * shrink, adjustedAngle - spread, depth + 1);
            drawBranch(endX, endY, len * shrink, adjustedAngle + spread, depth + 1);
        }

        function animate() {
            const w = canvas.width / window.devicePixelRatio;
            const h = canvas.height / window.devicePixelRatio;
            ctx.clearRect(0, 0, w, h);

            if (growthRef.current < maxDepth) {
                growthRef.current += 0.04;
            }

            const startLen = h / 5;
            drawBranch(w * 0.3, h, startLen, -Math.PI / 2 - 0.2, 0);
            drawBranch(w * 0.7, h, startLen * 0.85, -Math.PI / 2 + 0.2, 0);
            drawBranch(w * 0.5, h, startLen * 0.65, -Math.PI / 2, 0);

            rafRef.current = requestAnimationFrame(animate);
        }
        rafRef.current = requestAnimationFrame(animate);

        return () => {
            window.removeEventListener('resize', resize);
            section.removeEventListener('mousemove', handleMouse);
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, []);

    return (
        <section
            ref={sectionRef}
            className="relative overflow-hidden rounded-3xl border border-border/60 bg-background min-h-[420px] flex items-center justify-center p-10 sm:p-16 mb-8"
        >
            {/* Canvas */}
            <canvas ref={canvasRef} className="absolute inset-0 z-0" />

            {/* Gradient overlay */}
            <div className="absolute inset-0 z-10 bg-gradient-to-t from-background via-background/60 to-transparent" />

            {/* Content */}
            <div className="relative z-20 text-center max-w-2xl mx-auto">
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-mono mb-6 backdrop-blur-sm"
                >
                    <Sparkles size={14} />
                    50,000+ Professionals Trust Nexus AI
                </motion.div>

                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="text-3xl sm:text-5xl font-black text-foreground mb-4"
                >
                    Ready to <span className="text-gradient-full">land your dream role?</span>
                </motion.h2>

                <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="text-muted-foreground text-sm max-w-md mx-auto mb-8"
                >
                    Join 50,000+ professionals who use Nexus AI to turn rejections into callbacks.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                >
                    <Link to="/upload">
                        <motion.span
                            whileHover={{ scale: 1.04, y: -2 }}
                            whileTap={{ scale: 0.97 }}
                            className="btn-primary mx-auto text-base py-4 px-10 inline-flex items-center gap-2"
                        >
                            Analyze My Resume Now
                            <ArrowRight size={18} />
                        </motion.span>
                    </Link>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                    className="flex flex-wrap gap-4 justify-center mt-6"
                >
                    {['No signup required', 'ATS-tested', 'GDPR compliant'].map((t) => (
                        <span key={t} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <CheckCircle size={12} className="text-primary" />
                            {t}
                        </span>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}

/* ─── RADIAL ORBITAL TIMELINE ─── */
const orbitalNodes = [
    {
        title: 'Upload Resume',
        desc: 'Simply drag and drop your PDF or DOCX file. Our intelligent parser instantly extracts your content while preserving formatting and structure for deep analysis.',
        icon: Upload,
        gradient: 'from-[#33cc33] to-[#66d9ef]',
        status: 'STEP 01',
        energy: 100,
    },
    {
        title: 'AI Deep Analysis',
        desc: 'Our advanced NLP engine evaluates ATS compatibility, keyword density, clarity metrics, STAR-method impact scores, and identifies critical gaps — all in under 3 seconds.',
        icon: Brain,
        gradient: 'from-[#66d9ef] to-[#87ceeb]',
        status: 'STEP 02',
        energy: 90,
    },
    {
        title: 'Collect Interviews',
        desc: 'Apply confidently with your AI-optimized resume. Our users report a 94% increase in interview callbacks and 2.4x more recruiter responses within the first week.',
        icon: TrendingUp,
        gradient: 'from-[#87ceeb] to-[#33cc33]',
        status: 'STEP 03',
        energy: 80,
    },
];

function RadialOrbitalTimeline() {
    const [rotationAngle, setRotationAngle] = useState(0);
    const [isRotating, setIsRotating] = useState(true);
    const [activeNode, setActiveNode] = useState(null);
    const intervalRef = useRef(null);

    useEffect(() => {
        if (isRotating) {
            intervalRef.current = setInterval(() => {
                setRotationAngle((prev) => (prev + 0.3) % 360);
            }, 50);
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isRotating]);

    const handleNodeClick = (index) => {
        setIsRotating(false);
        setActiveNode(activeNode === index ? null : index);
    };

    const handleBgClick = () => {
        setActiveNode(null);
        setIsRotating(true);
    };

    const radius = 180;

    return (
        <motion.section
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="mb-24 relative"
        >
            <div className="text-center mb-12 relative z-10">
                <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
                    Three Steps to{' '}
                    <span className="text-gradient-cyan">Interview-Ready</span>
                </h2>
                <p className="text-muted-foreground text-sm max-w-lg mx-auto">
                    A seamless, powerful workflow powered by enterprise AI.
                </p>
            </div>

            {/* Desktop Orbital */}
            <div
                className="relative w-full min-h-[520px] hidden md:flex items-center justify-center"
                onClick={handleBgClick}
            >
                {/* Center Orb */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                    {/* Outer ping ring 1 */}
                    <div className="absolute -inset-6 rounded-full border border-primary/20 animate-ping opacity-20" />
                    {/* Outer ping ring 2 */}
                    <div
                        className="absolute -inset-10 rounded-full border border-accent/10 animate-ping opacity-10"
                        style={{ animationDelay: '0.5s', animationDuration: '2s' }}
                    />
                    {/* Core */}
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#33cc33] via-[#66d9ef] to-[#87ceeb] flex items-center justify-center shadow-[0_0_30px_rgba(51,204,51,0.3)] animate-pulse">
                        <Zap size={24} className="text-background fill-background/20" />
                    </div>
                </div>

                {/* Orbit ring */}
                <div
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/15"
                    style={{ width: radius * 2, height: radius * 2 }}
                />
                {/* Second subtle ring */}
                <div
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-accent/8"
                    style={{ width: radius * 2 + 40, height: radius * 2 + 40 }}
                />

                {/* Orbital Nodes */}
                {orbitalNodes.map((node, index) => {
                    const angle = ((index / orbitalNodes.length) * 360 + rotationAngle) % 360;
                    const radian = (angle * Math.PI) / 180;
                    const x = radius * Math.cos(radian);
                    const y = radius * Math.sin(radian);
                    const zIndex = Math.round(100 + 50 * Math.cos(radian));
                    const nodeOpacity = 1;
                    const isActive = activeNode === index;
                    const Icon = node.icon;

                    return (
                        <div
                            key={node.title}
                            className="absolute flex flex-col items-center"
                            style={{
                                left: `calc(50% + ${x}px)`,
                                top: `calc(50% + ${y}px)`,
                                transform: 'translate(-50%, -50%)',
                                zIndex: isActive ? 200 : zIndex,
                                opacity: nodeOpacity,
                                transition: 'opacity 0.15s ease',
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleNodeClick(index);
                            }}
                        >
                            {/* Energy glow ring */}
                            <div
                                className="absolute rounded-full pointer-events-none"
                                style={{
                                    width: 24 + node.energy * 0.4,
                                    height: 24 + node.energy * 0.4,
                                    top: '50%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    background: `radial-gradient(circle, rgba(51,204,51,${isActive ? 0.25 : 0.12}) 0%, transparent 70%)`,
                                }}
                            />

                            {/* Node circle */}
                            <div
                                className={`w-12 h-12 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all duration-300 ${isActive
                                    ? 'bg-primary text-background scale-150 border-primary shadow-[0_0_20px_rgba(51,204,51,0.5)]'
                                    : 'bg-background border-primary/40 text-primary hover:border-primary/70 hover:shadow-[0_0_12px_rgba(51,204,51,0.2)]'
                                    }`}
                            >
                                <Icon size={isActive ? 18 : 20} />
                            </div>

                            {/* Node label */}
                            <span
                                className={`mt-2 text-xs font-semibold tracking-wider whitespace-nowrap transition-all duration-300 ${isActive ? 'text-primary scale-110' : 'text-foreground/70'
                                    }`}
                            >
                                {node.title}
                            </span>

                            {/* Expanded Card */}
                            <AnimatePresence>
                                {isActive && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -8, scale: 0.9 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -8, scale: 0.9 }}
                                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                                        className="absolute top-full mt-1 flex flex-col items-center"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {/* Connector line */}
                                        <div className="w-px h-4 bg-primary/40" />
                                        {/* Card */}
                                        <div
                                            className="glass-card border border-primary/30 p-4 w-56 shadow-[0_0_24px_rgba(51,204,51,0.15)]"
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="rounded-full bg-primary/15 border border-primary/30 text-primary text-xs px-2 py-0.5 font-mono">
                                                    {node.status}
                                                </span>
                                                <span className="text-xs font-mono text-muted-foreground">
                                                    {String(index + 1).padStart(2, '0')}
                                                </span>
                                            </div>
                                            <h4 className="text-sm font-bold text-foreground mb-1">{node.title}</h4>
                                            <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{node.desc}</p>
                                            {/* Energy bar */}
                                            <div className="flex justify-between text-xs font-mono text-muted-foreground mb-1.5">
                                                <span>Energy</span>
                                                <span>{node.energy}%</span>
                                            </div>
                                            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${node.energy}%` }}
                                                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                                                    className="h-full bg-gradient-to-r from-[#33cc33] to-[#66d9ef] rounded-full"
                                                />
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
            </div>

            {/* Mobile Fallback */}
            <div className="flex flex-col gap-5 md:hidden px-4">
                {orbitalNodes.map((node, idx) => {
                    const Icon = node.icon;
                    return (
                        <motion.div
                            key={node.title}
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: idx * 0.12 }}
                            className="glass-card p-6 relative pl-16 overflow-hidden border-primary/20"
                        >
                            <div className="absolute left-0 top-0 bottom-0 w-12 bg-primary/10 flex items-center justify-center border-r border-primary/20">
                                <span className="font-black text-primary -rotate-90 text-xl tracking-wider opacity-80">
                                    {String(idx + 1).padStart(2, '0')}
                                </span>
                            </div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${node.gradient} flex items-center justify-center`}>
                                    <Icon size={16} className="text-background" />
                                </div>
                                <h4 className="font-bold text-foreground">{node.title}</h4>
                                <span className="ml-auto rounded-full bg-primary/15 border border-primary/30 text-primary text-[10px] px-2 py-0.5 font-mono">
                                    {node.status}
                                </span>
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed">{node.desc}</p>
                            <div className="mt-3 w-full h-1 bg-white/10 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-[#33cc33] to-[#66d9ef] rounded-full"
                                    style={{ width: `${node.energy}%` }}
                                />
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </motion.section>
    );
}

/* ─── TESTIMONIALS SECTION ─── */
function TestimonialsSection() {
    const [active, setActive] = useState(0);
    const [direction, setDirection] = useState(1);
    const containerRef = useRef(null);
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const springX = useSpring(mouseX, { stiffness: 50, damping: 20 });
    const springY = useSpring(mouseY, { stiffness: 50, damping: 20 });

    const handleMouseMove = useCallback((e) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width - 0.5) * 40;
        const y = ((e.clientY - rect.top) / rect.height - 0.5) * 20;
        mouseX.set(x);
        mouseY.set(y);
    }, [mouseX, mouseY]);

    const go = useCallback((dir) => {
        setDirection(dir);
        setActive((prev) => (prev + dir + testimonials.length) % testimonials.length);
    }, []);

    useEffect(() => {
        const timer = setInterval(() => go(1), 6000);
        return () => clearInterval(timer);
    }, [go]);

    const t = testimonials[active];
    const words = t.quote.split(' ');
    const indexStr = String(active + 1).padStart(2, '0');

    return (
        <motion.section
            ref={containerRef}
            onMouseMove={handleMouseMove}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={containerVariants}
            className="mb-24 relative overflow-hidden"
        >
            <div className="flex min-h-[420px] lg:min-h-[480px]">
                {/* Left vertical sidebar */}
                <div className="hidden md:flex flex-col items-center justify-between py-8 pr-8 border-r border-border/40 relative">
                    <span
                        className="text-muted-foreground text-xs font-bold tracking-[0.35em] uppercase"
                        style={{ writingMode: 'vertical-rl' }}
                    >
                        Testimonials
                    </span>
                    <div className="relative w-[2px] flex-1 my-6 bg-border/30 rounded-full overflow-hidden">
                        <motion.div
                            className="absolute top-0 left-0 w-full bg-primary rounded-full"
                            animate={{ height: `${((active + 1) / testimonials.length) * 100}%` }}
                            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                        />
                    </div>
                    <span className="text-xs font-mono text-muted-foreground">
                        {indexStr} / {String(testimonials.length).padStart(2, '0')}
                    </span>
                </div>

                {/* Main content area */}
                <div className="flex-1 relative flex flex-col justify-center px-4 sm:px-8 lg:px-16 py-10">
                    {/* Giant background number with parallax */}
                    <motion.div
                        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden"
                        style={{ x: springX, y: springY }}
                    >
                        <AnimatePresence mode="wait">
                            <motion.span
                                key={active}
                                initial={{ opacity: 0, scale: 0.8, rotateY: -30 }}
                                animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                                exit={{ opacity: 0, scale: 1.1, rotateY: 30 }}
                                transition={{ duration: 0.5 }}
                                className="text-[12rem] sm:text-[16rem] lg:text-[20rem] font-black text-primary/[0.04] leading-none"
                            >
                                {indexStr}
                            </motion.span>
                        </AnimatePresence>
                    </motion.div>

                    {/* Quote icon */}
                    <motion.div variants={itemVariants} className="mb-6 relative z-10">
                        <Quote size={32} className="text-primary/20" />
                    </motion.div>

                    {/* Company badge */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={`badge-${active}`}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            transition={{ duration: 0.3 }}
                            className="mb-6 relative z-10"
                        >
                            <span className="inline-flex items-center gap-2 rounded-full border border-border/60 px-3 py-1 text-xs font-mono text-muted-foreground">
                                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                                {t.company}
                            </span>
                        </motion.div>
                    </AnimatePresence>

                    {/* Quote text — word-by-word reveal */}
                    <div className="relative z-10 min-h-[120px] sm:min-h-[100px]">
                        <AnimatePresence mode="wait">
                            <motion.p
                                key={active}
                                initial="hidden"
                                animate="show"
                                exit="exit"
                                variants={{
                                    hidden: {},
                                    show: { transition: { staggerChildren: 0.04 } },
                                    exit: { opacity: 0, y: -20, transition: { duration: 0.25 } },
                                }}
                                className="text-2xl sm:text-3xl lg:text-4xl font-light tracking-tight text-foreground leading-snug"
                            >
                                {words.map((word, i) => (
                                    <motion.span
                                        key={`${active}-${i}`}
                                        className="inline-block mr-[0.3em]"
                                        variants={{
                                            hidden: { opacity: 0, rotateX: 90, y: 20, filter: 'blur(4px)' },
                                            show: {
                                                opacity: 1, rotateX: 0, y: 0, filter: 'blur(0px)',
                                                transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
                                            },
                                        }}
                                        style={{ transformOrigin: 'bottom center' }}
                                    >
                                        {word}
                                    </motion.span>
                                ))}
                            </motion.p>
                        </AnimatePresence>
                    </div>

                    {/* Author row */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={`author-${active}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3, delay: 0.3 }}
                            className="mt-10 flex items-center gap-4 relative z-10"
                        >
                            <motion.div
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: 1 }}
                                transition={{ duration: 0.5, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
                                className="w-10 h-[2px] bg-primary origin-left"
                            />
                            <div>
                                <span className="font-medium text-foreground text-sm">{t.name}</span>
                                <span className="text-muted-foreground text-sm ml-2">{t.role}</span>
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    {/* Navigation buttons */}
                    <div className="mt-10 flex items-center gap-3 relative z-10">
                        <motion.button
                            whileHover={{ scale: 1.08 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => go(-1)}
                            className="w-12 h-12 rounded-full border border-border/60 flex items-center justify-center text-muted-foreground hover:text-primary-foreground hover:bg-primary hover:border-primary transition-all duration-300 group relative overflow-hidden"
                        >
                            <ChevronLeft size={18} className="relative z-10" />
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.08 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => go(1)}
                            className="w-12 h-12 rounded-full border border-border/60 flex items-center justify-center text-muted-foreground hover:text-primary-foreground hover:bg-primary hover:border-primary transition-all duration-300 group relative overflow-hidden"
                        >
                            <ChevronRight size={18} className="relative z-10" />
                        </motion.button>
                        {/* Dot indicators */}
                        <div className="flex items-center gap-2 ml-4">
                            {testimonials.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => { setDirection(i > active ? 1 : -1); setActive(i); }}
                                    className="relative w-2 h-2 rounded-full transition-all duration-300"
                                >
                                    <span className={`absolute inset-0 rounded-full transition-all duration-300 ${i === active ? 'bg-primary scale-125' : 'bg-border hover:bg-muted-foreground'}`} />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </motion.section>
    );
}

/* ─── FAQ SECTION ─── */
function FaqSection() {
    const [openIndex, setOpenIndex] = useState(null);

    const toggle = (i) => {
        setOpenIndex(openIndex === i ? null : i);
    };

    return (
        <motion.section
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={containerVariants}
            className="mb-24 max-w-3xl mx-auto"
        >
            <motion.div variants={itemVariants} className="mb-14">
                <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3 tracking-tight">
                    Frequently Asked{' '}
                    <span className="text-gradient-cyan">Questions</span>
                </h2>
                <p className="text-muted-foreground text-sm max-w-lg">
                    Everything you need to know about Nexus AI.
                </p>
            </motion.div>

            <div className="space-y-0">
                {faqs.map((faq, i) => {
                    const isOpen = openIndex === i;
                    const indexLabel = String(i + 1).padStart(2, '0');
                    return (
                        <motion.div
                            key={i}
                            variants={itemVariants}
                            className="border-b border-border/40"
                        >
                            <button
                                onClick={() => toggle(i)}
                                className="w-full flex items-start gap-4 py-7 text-left group cursor-pointer"
                            >
                                <span className="text-xs font-mono text-muted-foreground mt-2 shrink-0 w-6">
                                    {indexLabel}
                                </span>
                                <span
                                    className={`flex-1 text-xl sm:text-2xl lg:text-3xl font-bold uppercase tracking-tight transition-all duration-300 ${isOpen
                                        ? 'text-primary'
                                        : 'text-foreground/30 group-hover:text-foreground'
                                        }`}
                                    style={isOpen ? { textShadow: '0 0 40px rgba(51,204,51,0.15)' } : {}}
                                >
                                    {faq.question}
                                </span>
                                <motion.div
                                    animate={{ rotate: isOpen ? 180 : 0 }}
                                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                                    className="mt-2 shrink-0"
                                >
                                    <ChevronDown
                                        size={20}
                                        className={`transition-colors duration-300 ${isOpen ? 'text-primary' : 'text-muted-foreground'
                                            }`}
                                    />
                                </motion.div>
                            </button>
                            <AnimatePresence initial={false}>
                                {isOpen && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                                        className="overflow-hidden"
                                    >
                                        <p className="text-muted-foreground text-sm leading-relaxed pb-7 pl-10 sm:pl-14 pr-10 max-w-2xl">
                                            {faq.answer}
                                        </p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                })}
            </div>
        </motion.section>
    );
}

export default function LandingPage() {
    const navigate = useNavigate();
    const [showDemo, setShowDemo] = useState(false);
    const [playing, setPlaying] = useState(false);
    const closeDemo = () => {
        setShowDemo(false);
        setTimeout(() => setPlaying(false), 300);
    };
    return (
        <PageWrapper>
            <motion.section
                initial={{ opacity: 0, y: 32 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="relative isolate min-h-[min(90vh,720px)] lg:min-h-[640px] overflow-hidden rounded-3xl border border-border/60 bg-background"
            >
                <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30" />
                    <motion.div
                        className="absolute -right-24 top-1/4 h-72 w-72 rounded-full bg-primary/15 blur-[100px]"
                        animate={{ opacity: [0.35, 0.6, 0.35], scale: [1, 1.15, 1] }}
                        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <motion.div
                        className="absolute -left-20 bottom-1/4 h-64 w-64 rounded-full bg-secondary/20 blur-[90px]"
                        animate={{ opacity: [0.25, 0.5, 0.25], x: [0, 12, 0] }}
                        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-background from-[0%] via-background/80 via-[48%] to-background/20 to-[100%]" />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/15" />
                </div>
                <div className="relative z-10 mx-auto flex max-w-7xl flex-col gap-10 px-4 pb-8 pt-10 sm:px-6 lg:grid lg:grid-cols-2 lg:items-center lg:gap-10 lg:py-14 lg:pb-10">
                    <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.85, y: 12 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ type: 'spring', stiffness: 380, damping: 22, delay: 0.05 }}
                            className="relative mb-6 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary"
                        >
                            <motion.div
                                className="pointer-events-none absolute inset-0 rounded-full"
                                aria-hidden
                                animate={{
                                    boxShadow: [
                                        '0 0 0 0 rgba(52,168,90,0)',
                                        '0 0 28px 4px rgba(52,168,90,0.22)',
                                        '0 0 0 0 rgba(52,168,90,0)',
                                    ],
                                }}
                                transition={{ duration: 2.8, repeat: Infinity }}
                            />
                            <motion.span
                                animate={{ rotate: [0, 14, -10, 0] }}
                                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                            >
                                <Zap size={12} className="fill-primary text-primary" />
                            </motion.span>
                            AI-Powered Resume Intelligence
                        </motion.div>
                        <motion.h1
                            className="text-balance text-4xl font-black uppercase leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl xl:text-[3.35rem]"
                            variants={heroHeadlineContainer}
                            initial="hidden"
                            animate="show"
                        >
                            <motion.span
                                variants={heroHeadlineLine}
                                className="block text-foreground"
                            >
                                FORGET THE RESUME.
                            </motion.span>
                            <motion.span
                                variants={heroHeadlineLine}
                                className="mt-1 block bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent"
                            >
                                DEMAND THE INTERVIEW.
                            </motion.span>
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 24 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
                            className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg"
                        >
                            Nexus AI analyzes your resume with enterprise-grade intelligence —
                            surfacing keyword gaps, ATS score, clarity metrics, and STAR-method
                            bullet improvements in under 3 seconds.
                        </motion.p>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.55, delay: 0.72, ease: [0.22, 1, 0.36, 1] }}
                            className="mt-9 flex flex-wrap items-center justify-center gap-3 lg:justify-start"
                        >
                            <motion.div whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.98 }}>
                                <Link to="/upload" className="btn-primary text-sm py-3.5 px-8 shadow-glow-cyan">
                                    Get Started Free
                                    <ArrowRight size={16} />
                                </Link>
                            </motion.div>
                            <motion.div whileHover={{ y: -3 }} whileTap={{ scale: 0.97 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
                                <button
                                    type="button"
                                    onClick={() => setShowDemo(true)}
                                    className="inline-flex items-center gap-3 px-8 py-3.5 rounded-xl font-semibold text-sm border border-border text-foreground bg-card/80 backdrop-blur-sm transition-all duration-300 hover:shadow-[0_6px_24px_rgba(0,0,0,0.12)] hover:border-primary/30 active:scale-95 group"
                                >
                                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 border border-primary/25 transition-all duration-300 group-hover:bg-primary group-hover:border-primary group-hover:shadow-[0_0_12px_rgba(52,168,90,0.4)]">
                                        <Play size={12} className="ml-0.5 fill-primary text-primary transition-colors duration-300 group-hover:fill-white group-hover:text-white" />
                                    </span>
                                    Watch Demo
                                </button>
                            </motion.div>
                        </motion.div>
                    </div>
                    <div className="relative flex w-full min-h-[300px] items-center justify-center lg:min-h-[500px] mt-8 lg:mt-0">
                        <motion.div
                            className="absolute z-0 h-[110%] w-[110%] rounded-full bg-primary/10 blur-[90px]"
                            animate={{ scale: [1, 1.05, 1], opacity: [0.5, 0.8, 0.5] }}
                            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                        />
                        <motion.div
                            className="relative z-10 w-full max-w-[620px] lg:max-w-none perspective-1000"
                            initial={{ opacity: 0, y: 40, rotateX: 5, rotateY: -10 }}
                            animate={{ opacity: 1, y: 0, rotateX: 0, rotateY: 0 }}
                            transition={{ duration: 1, type: "spring", bounce: 0.4 }}
                        >
                            <motion.div
                                animate={{ y: [-12, 12, -12] }}
                                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                                className="relative rounded-2xl border border-border/50 bg-card/20 p-2 shadow-2xl backdrop-blur-sm"
                            >
                                <img
                                    src={heroGraphic}
                                    alt="Nexus AI resume dashboard preview"
                                    className="h-auto w-full rounded-xl object-cover shadow-[0_0_50px_rgba(6,182,212,0.2)]"
                                    loading="eager"
                                    decoding="async"
                                />
                                <motion.div
                                    className="absolute -right-4 lg:-right-10 top-[20%] rounded-xl border border-border/80 bg-background/95 p-3 shadow-2xl backdrop-blur-md hidden sm:block"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0, y: [-4, 4, -4] }}
                                    transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-500 shadow-glow-cyan">
                                            <CheckCircle size={18} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-foreground">ATS Match: 94%</p>
                                            <p className="text-xs text-muted-foreground">Top 1% Candidate</p>
                                        </div>
                                    </div>
                                </motion.div>
                                <motion.div
                                    className="absolute -left-4 lg:-left-12 bottom-[25%] rounded-xl border border-border/80 bg-background/95 p-3 shadow-2xl backdrop-blur-md hidden sm:block"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0, y: [4, -4, 4] }}
                                    transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/20 text-amber-500">
                                            <Star size={18} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-foreground">STAR Enhanced</p>
                                            <p className="text-xs text-muted-foreground">Impact Improved 2.4x</p>
                                        </div>
                                    </div>
                                </motion.div>
                                <motion.div
                                    className="absolute left-0 right-0 h-[2px] bg-cyan-400/60 shadow-[0_0_15px_rgba(6,182,212,1)] z-20 pointer-events-none rounded-full"
                                    animate={{ top: ['0%', '100%', '0%'] }}
                                    transition={{ duration: 7, repeat: Infinity, ease: 'linear' }}
                                />
                            </motion.div>
                        </motion.div>
                    </div>
                </div>
            </motion.section>
            <div className="relative z-10 my-10 rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md py-5 overflow-hidden">
                <motion.div
                    className="flex w-max items-center"
                    animate={{ x: ["0%", "-50%"] }}
                    transition={{ ease: "linear", duration: 30, repeat: Infinity }}
                >
                    {[...ticker, ...ticker, ...ticker, ...ticker].map((label, i) => (
                        <span key={`ticker-${i}`} className="flex items-center">
                            <span className="mx-6 text-primary/50 text-lg sm:mx-10" aria-hidden>
                                ◆
                            </span>
                            <span className="text-xs font-bold uppercase tracking-[0.25em] text-foreground/70 sm:text-sm sm:tracking-[0.3em]">
                                {label}
                            </span>
                        </span>
                    ))}
                </motion.div>
            </div>
            <motion.section
                variants={containerVariants}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-24"
            >
                {stats.map(({ value, label }) => (
                    <motion.div
                        key={label}
                        variants={itemVariants}
                        whileHover={{ y: -6, scale: 1.03, transition: { type: 'spring', stiffness: 400, damping: 18 } }}
                        className="glass-card p-8 text-center group hover:border-primary/25 transition-colors"
                    >
                        <div className="text-4xl font-black text-gradient-cyan">{value}</div>
                        <div className="text-sm text-muted-foreground mt-2 font-medium">{label}</div>
                    </motion.div>
                ))}
            </motion.section>
            {/* ═══ BENTO GRID: INTELLIGENCE STACK ═══ */}
            <motion.section
                variants={containerVariants}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                className="mb-24"
            >
                <motion.div variants={itemVariants} className="text-center mb-14">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/10 text-primary text-xs font-bold mb-5">
                        <Zap size={14} className="fill-primary" /> Core Engine
                    </div>
                    <h2 className="text-3xl sm:text-5xl font-black text-foreground mb-4 tracking-tight">
                        The <span className="text-gradient-cyan">Intelligence Stack</span>
                    </h2>
                    <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
                        Enterprise-grade AI tools, purpose-built to transform your resume into an irresistible candidate profile.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-6xl mx-auto">
                    {bentoItems.map((item, i) => {
                        const Icon = item.icon;
                        const isWide = item.colSpan === 2;
                        const accentColors = [
                            { border: 'hover:border-[#33cc33]/40', shadow: 'hover:shadow-[0_4px_40px_rgba(51,204,51,0.15)]', gradient: 'from-[#33cc33]/8 via-transparent to-transparent', iconBg: 'bg-[#33cc33]/10 border-[#33cc33]/20 group-hover:bg-[#33cc33]/20', persistBorder: 'border-[#33cc33]/25 shadow-[0_0_30px_rgba(51,204,51,0.08)]' },
                            { border: 'hover:border-[#66d9ef]/40', shadow: 'hover:shadow-[0_4px_40px_rgba(102,217,239,0.15)]', gradient: 'from-[#66d9ef]/8 via-transparent to-transparent', iconBg: 'bg-[#66d9ef]/10 border-[#66d9ef]/20 group-hover:bg-[#66d9ef]/20', persistBorder: 'border-border' },
                            { border: 'hover:border-[#87ceeb]/40', shadow: 'hover:shadow-[0_4px_40px_rgba(135,206,235,0.15)]', gradient: 'from-[#87ceeb]/8 via-transparent to-transparent', iconBg: 'bg-[#87ceeb]/10 border-[#87ceeb]/20 group-hover:bg-[#87ceeb]/20', persistBorder: 'border-border' },
                            { border: 'hover:border-[#33cc33]/40', shadow: 'hover:shadow-[0_4px_40px_rgba(51,204,51,0.15)]', gradient: 'from-[#33cc33]/8 via-transparent to-transparent', iconBg: 'bg-[#33cc33]/10 border-[#33cc33]/20 group-hover:bg-[#33cc33]/20', persistBorder: 'border-border' },
                        ];
                        const ac = accentColors[i];
                        return (
                            <motion.div
                                key={item.title}
                                variants={itemVariants}
                                whileHover={{ y: -6, transition: { type: 'spring', stiffness: 300, damping: 20 } }}
                                onClick={() => navigate(item.link)}
                                className={`group relative glass-card p-7 rounded-2xl border transition-all duration-500 overflow-hidden cursor-pointer ${isWide ? 'md:col-span-2' : 'col-span-1'
                                    } ${item.hasPersistentHover ? ac.persistBorder : 'border-border/60'
                                    } ${ac.border} ${ac.shadow}`}
                            >
                                {/* Gradient overlay on hover */}
                                <div className={`absolute inset-0 bg-gradient-to-br ${ac.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none`} />



                                <div className="relative z-10">
                                    {/* Top row: icon + status */}
                                    <div className="flex items-start justify-between mb-5">
                                        <div className={`w-11 h-11 rounded-xl border flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:shadow-lg ${ac.iconBg}`}>
                                            <Icon size={20} className={item.iconColor} />
                                        </div>
                                        <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-primary/10 border border-primary/25 text-primary uppercase tracking-wider">
                                            {item.status}
                                        </span>
                                    </div>

                                    {/* Title + meta */}
                                    <div className="flex items-baseline gap-2 mb-2">
                                        <h3 className="font-bold text-foreground text-lg tracking-tight group-hover:text-primary transition-colors duration-300">
                                            {item.title}
                                        </h3>
                                        <span className="text-xs text-muted-foreground/60 font-mono">
                                            {item.meta}
                                        </span>
                                    </div>

                                    {/* Description */}
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {item.description}
                                    </p>

                                    {/* Tags + CTA */}
                                    <div className="flex items-center justify-between mt-6">
                                        <div className="flex flex-wrap gap-1.5">
                                            {item.tags.map((tag) => (
                                                <span
                                                    key={tag}
                                                    className="text-xs px-2.5 py-1 rounded-md bg-foreground/5 border border-border/50 text-muted-foreground group-hover:border-primary/30 group-hover:text-primary transition-all duration-300"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                        <Link
                                            to={item.link}
                                            onClick={(e) => e.stopPropagation()}
                                            className="text-xs text-primary font-semibold opacity-0 group-hover:opacity-100 transition-all duration-300 tracking-wide flex items-center gap-1.5 shrink-0 ml-3 translate-x-2 group-hover:translate-x-0 hover:underline"
                                        >
                                            {item.cta}
                                            <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform duration-300" />
                                        </Link>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </motion.section>
            {/* ═══ RADIAL ORBITAL TIMELINE ═══ */}
            <RadialOrbitalTimeline />
            {/* ═══ TESTIMONIALS — EDITORIAL CAROUSEL ═══ */}
            <TestimonialsSection />
            {/* ═══ FAQ — EDITORIAL ACCORDION ═══ */}
            <FaqSection />
            <CtaNeuralTree />
            {createPortal(
                <AnimatePresence>
                    {showDemo && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowDemo(false)}
                            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-sm"
                        >
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                                onClick={(e) => e.stopPropagation()}
                                className="relative w-full max-w-5xl aspect-video rounded-2xl overflow-hidden glass-card border border-cyan-500/20 shadow-glow-cyan bg-[#0f172a]"
                            >
                                <button
                                    onClick={closeDemo}
                                    className="absolute top-4 right-4 z-[60] w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 border border-white/10 flex items-center justify-center text-white transition-colors backdrop-blur-md"
                                >
                                    <X size={20} />
                                </button>
                                {playing ? (
                                    <div className="absolute inset-0">
                                        <DemoVideoPlayer />
                                    </div>
                                ) : (
                                    <div className="absolute inset-0 bg-navy-950 flex flex-col items-center justify-center">
                                        <div className="absolute inset-0 opacity-40">
                                            <img src="/demo-poster.png" alt="Nexus AI Demo" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-900/60 to-transparent" />
                                        </div>
                                        <div
                                            onClick={() => setPlaying(true)}
                                            className="relative flex flex-col items-center z-10 group cursor-pointer transition-transform hover:scale-105"
                                        >
                                            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-cyan-500/20 shadow-glow-cyan border border-cyan-400/30 flex items-center justify-center mb-6 group-hover:bg-cyan-500/30 group-hover:border-cyan-400/50 transition-all">
                                                <Play size={48} className="text-cyan-400 fill-cyan-400 ml-3 drop-shadow-[0_0_15px_rgba(6,182,212,0.8)]" />
                                            </div>
                                            <h3 className="text-2xl sm:text-3xl font-black text-white mb-2 drop-shadow-lg">Platform Overview</h3>
                                            <p className="text-cyan-400 font-mono text-sm tracking-widest bg-navy-900/80 px-4 py-1.5 rounded-full border border-cyan-500/20 shadow-xl">
                                                2 MINUTE TOUR
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </PageWrapper>
    );
}
