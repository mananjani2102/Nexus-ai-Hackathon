import { NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  Upload,
  LayoutDashboard,
  Lightbulb,
  Sparkles,
  History,
  Menu,
  X,
  LogOut,
  Users,
  Mic,
  ChevronDown,
  MoreHorizontal,
  MessageSquare,
  Swords,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import logoUrl from "../assets/nexus-logo-01.png";
import { useAuth } from "../context/AuthContext";
import { useResume } from "../context/ResumeContext";

const primaryNavItems = [
  { to: "/", label: "Home", icon: Zap },
  { to: "/upload", label: "Upload", icon: Upload },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
];

const moreGroups = [
  {
    label: "AI Tools",
    items: [
      { to: "/suggestions", label: "AI Fixes", icon: Lightbulb },
      { to: "/bullet", label: "Bullet Pro", icon: Sparkles },
      { to: "/voice-assistant", label: "Voice AI", icon: MessageSquare },
      { to: "/battle", label: "Battle", icon: Swords },
    ],
  },
  {
    label: "Practice",
    items: [
      { to: "/interview", label: "Mock Interview", icon: Mic },
    ],
  },
  {
    label: "Account",
    items: [
      { to: "/history", label: "History", icon: History },
      { to: "/recruiter", label: "Recruiter Hub", icon: Users },
    ],
  },
];

const allMoreItems = moreGroups.flatMap((g) => g.items);
const allNavItems = [...primaryNavItems, ...allMoreItems];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();
  const { history } = useResume();
  const moreRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (moreRef.current && !moreRef.current.contains(e.target)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (!dropdownOpen) return;
    const close = () => setDropdownOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [dropdownOpen]);

  const isMoreActive = allMoreItems.some((item) =>
    item.to === "/" ? location.pathname === "/" : location.pathname.startsWith(item.to),
  );

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <nav className="mt-3 glass-card px-4 py-3 flex items-center justify-between">
          <NavLink to="/" className="flex items-center gap-2 group">
            <img
              src={logoUrl}
              alt=""
              className="h-8 w-auto max-w-[120px] object-contain object-left shrink-0"
            />
            <span className="font-bold text-base tracking-tight">
              <span className="text-gradient-cyan">Nexus</span>
              <span className="text-nexus-text"> AI</span>
            </span>
          </NavLink>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1 relative">
            {primaryNavItems.map(({ to, label, icon: Icon }) => {
              const isActive =
                to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);
              return (
                <NavLink
                  key={to}
                  to={to}
                  end={to === "/"}
                  className={`nav-link relative ${isActive ? "active" : ""}`}
                >
                  <motion.span
                    className="inline-flex items-center gap-1.5"
                    initial={false}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Icon size={14} />
                    {label}
                  </motion.span>
                  {isActive && (
                    <motion.div
                      layoutId="navbar-active-dot"
                      className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </NavLink>
              );
            })}

            {/* More mega-dropdown */}
            <div className="relative" ref={moreRef}>
              <button
                type="button"
                onClick={() => setMoreOpen((prev) => !prev)}
                className={`nav-link relative flex items-center gap-1 ${isMoreActive ? "active" : ""}`}
              >
                <MoreHorizontal size={14} />
                More
                <ChevronDown
                  size={12}
                  className={`transition-transform duration-200 ${moreOpen ? "rotate-180" : ""}`}
                />
                {isMoreActive && (
                  <motion.div
                    layoutId="navbar-active-dot"
                    className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </button>

              <AnimatePresence>
                {moreOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.18 }}
                    className="absolute top-full right-0 mt-2 w-52 glass-card p-2 z-50 border border-border shadow-xl"
                  >
                    {moreGroups.map((group, gi) => (
                      <div key={group.label}>
                        {gi > 0 && <div className="border-t border-border/60 my-1.5" />}
                        <p className="px-3 pt-1.5 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                          {group.label}
                        </p>
                        {group.items.map(({ to, label, icon: Icon }) => {
                          const isActive = location.pathname.startsWith(to);
                          return (
                            <NavLink
                              key={to}
                              to={to}
                              onClick={() => setMoreOpen(false)}
                              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                                isActive
                                  ? "bg-primary/15 text-primary"
                                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                              }`}
                            >
                              <Icon size={15} className={isActive ? "text-primary" : ""} />
                              {label}
                              {to === "/history" && history?.length > 0 && (
                                <span className="ml-auto min-w-[20px] h-5 rounded-full bg-primary text-background flex items-center justify-center text-[10px] font-bold px-1">
                                  {history.length}
                                </span>
                              )}
                            </NavLink>
                          );
                        })}
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-nexus-muted mr-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              AI Online
            </div>

            {user ? (
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => setDropdownOpen((prev) => !prev)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/25 hover:bg-primary/15 transition-all"
                >
                  <div className="w-7 h-7 rounded-full bg-[#4ade80] flex items-center justify-center text-[#062c11] text-xs font-black">
                    {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                  </div>
                  <span className="text-sm font-medium text-foreground hidden sm:block max-w-[100px] truncate">
                    {user.name || user.email}
                  </span>
                </button>

                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full right-0 mt-2 w-56 bg-white border border-[#d4d4d4] rounded-2xl shadow-xl p-2 z-50"
                    >
                      <div className="px-3 py-2.5 mb-1 border-b border-[#f0f0f0]">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-full bg-[#4ade80] flex items-center justify-center text-[#062c11] font-black text-sm">
                            {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-[#333333] truncate">
                              {user.name || "User"}
                            </p>
                            <p className="text-xs text-[#6e6e6e] truncate">{user.email}</p>
                          </div>
                        </div>
                      </div>
                      <NavLink
                        to="/dashboard"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-[#333333] hover:bg-[#f5f5f5] rounded-xl transition-colors"
                      >
                        <LayoutDashboard size={14} className="text-[#33cc33]" />
                        Dashboard
                      </NavLink>
                      <NavLink
                        to="/history"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-[#333333] hover:bg-[#f5f5f5] rounded-xl transition-colors"
                      >
                        <History size={14} className="text-[#6e6e6e]" />
                        My History
                      </NavLink>
                      <div className="border-t border-[#f0f0f0] mt-1 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            logout();
                            setDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                        >
                          <LogOut size={14} />
                          Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <NavLink to="/login" className="btn-primary text-xs py-2 px-4">
                Sign In
              </NavLink>
            )}
          </div>

          <button
            type="button"
            className="md:hidden btn-ghost p-2"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </nav>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-2 glass-card px-4 py-3 flex flex-col gap-0.5 md:hidden border border-border shadow-xl">
                {/* Core */}
                <p className="px-2 pt-1 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                  Core
                </p>
                {primaryNavItems.map(({ to, label, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={to === "/"}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
                  >
                    <Icon size={14} />
                    {label}
                  </NavLink>
                ))}
                {/* Grouped sections */}
                {moreGroups.map((group) => (
                  <div key={group.label}>
                    <div className="border-t border-border/60 my-1.5" />
                    <p className="px-2 pt-1 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                      {group.label}
                    </p>
                    {group.items.map(({ to, label, icon: Icon }) => (
                      <NavLink
                        key={to}
                        to={to}
                        onClick={() => setMobileOpen(false)}
                        className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
                      >
                        <Icon size={14} />
                        {label}
                      </NavLink>
                    ))}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
