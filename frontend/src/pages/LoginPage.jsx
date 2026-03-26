import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, ShieldCheck, Sparkles, Brain } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import logoUrl from "../assets/nexus-logo-01.png";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await login(email.trim(), password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f9f9fa] relative overflow-hidden flex items-center justify-center py-12 px-6">
      {/* Subtle Background Effects */}
      <div className="absolute top-0 left-0 w-[800px] h-[800px] bg-[rgba(51,204,51,0.06)] rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-[rgba(102,217,239,0.05)] rounded-full blur-[100px] translate-x-1/2 translate-y-1/2 pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#33cc3308_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none mix-blend-multiply" />

      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center relative z-10 mx-auto">
        
        {/* Left Side: Branding */}
        <div className="hidden md:flex flex-col gap-6 w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
            className="flex flex-col mt-4"
          >
            <h1 className="text-5xl font-black leading-tight tracking-tight">
              <span className="text-[#333333] block">Your Resume,</span>
              <span className="bg-gradient-to-r from-[#33cc33] to-[#66d9ef] bg-clip-text text-transparent block pb-1">Supercharged</span>
            </h1>
            <p className="text-[#6e6e6e] text-base mt-4 max-w-sm font-medium">
              Unlock your career potential with advanced AI analysis. Join the platform built for your success.
            </p>
          </motion.div>

          <div className="flex flex-col gap-4 mt-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white border border-[#d4d4d4] rounded-xl p-4 flex items-center gap-4 shadow-sm"
            >
              <div className="w-10 h-10 rounded-full bg-[#33cc33]/10 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-[#33cc33]" />
              </div>
              <div className="flex flex-col">
                <span className="text-[#333333] font-bold text-sm">ATS Score Analysis</span>
                <span className="text-[#6e6e6e] text-xs font-medium">Instant compliance checks</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-white border border-[#d4d4d4] rounded-xl p-4 flex items-center gap-4 shadow-sm"
            >
              <div className="w-10 h-10 rounded-full bg-[#66d9ef]/10 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-[#66d9ef]" />
              </div>
              <div className="flex flex-col">
                <span className="text-[#333333] font-bold text-sm">STAR Bullet Rewriter</span>
                <span className="text-[#6e6e6e] text-xs font-medium">AI-powered achievement framing</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-white border border-[#d4d4d4] rounded-xl p-4 flex items-center gap-4 shadow-sm"
            >
              <div className="w-10 h-10 rounded-full bg-[#87ceeb]/10 flex items-center justify-center shrink-0">
                <Brain className="w-5 h-5 text-[#87ceeb]" />
              </div>
              <div className="flex flex-col">
                <span className="text-[#333333] font-bold text-sm">Interview Prep AI</span>
                <span className="text-[#6e6e6e] text-xs font-medium">Predictive question mapping</span>
              </div>
            </motion.div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-[#e5e5e5]">
            {[
              { val: "50K+", label: "Resumes Analyzed" },
              { val: "94%", label: "Interview Rate" },
              { val: "3 sec", label: "Analysis Time" },
            ].map(({ val, label }) => (
              <div key={label} className="text-center">
                <div className="text-2xl font-black bg-gradient-to-r from-[#33cc33] to-[#66d9ef] bg-clip-text text-transparent">{val}</div>
                <div className="text-xs text-[#6e6e6e] mt-1 font-medium">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Login Form */}
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
          className="w-full max-w-md mx-auto"
        >
          {/* Mobile Logo Fallback */}
          <div className="flex md:hidden flex-col items-center mb-8 gap-3">
            <img src={logoUrl} alt="Nexus AI Logo" className="h-10 w-auto" />
            <span className="font-bold text-2xl tracking-tight">
              <span className="text-gradient-cyan">Nexus</span>
              <span className="text-[#333333]"> AI</span>
            </span>
          </div>

          <div className="bg-white border border-[#d4d4d4] rounded-2xl p-8 shadow-xl shadow-black/5 relative overflow-hidden">
            {/* Top accent line */}
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#33cc33] to-[#66d9ef]" />

            <div className="mb-8">
              <h2 className="text-2xl font-black text-[#333333] tracking-tight">Welcome back</h2>
              <p className="text-sm font-medium text-[#6e6e6e] mt-1">Sign in to your Nexus AI account</p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: "auto", marginBottom: 16 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl flex items-start gap-3 text-sm font-medium">
                      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Email Field */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold tracking-widest text-[#6e6e6e] uppercase ml-1">
                  Email Address
                </label>
                <motion.div 
                  className="relative rounded-xl bg-white border border-[#d4d4d4] flex items-center transition-colors"
                  animate={focusedInput === 'email' ? { boxShadow: "0 0 0 3px rgba(51,204,51,0.15)", borderColor: "#33cc33" } : {}}
                >
                  <div className="pl-4 pr-2 text-[#6e6e6e]">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocusedInput('email')}
                    onBlur={() => setFocusedInput(null)}
                    className="w-full bg-transparent border-none text-[#333333] placeholder-[#a3a3a3] py-3 pr-4 outline-none font-medium text-sm rounded-r-xl"
                    placeholder="you@example.com"
                  />
                </motion.div>
              </div>

              {/* Password Field */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-[10px] font-bold tracking-widest text-[#6e6e6e] uppercase">
                    Password
                  </label>
                </div>
                <motion.div 
                  className="relative rounded-xl bg-white border border-[#d4d4d4] flex items-center transition-colors"
                  animate={focusedInput === 'password' ? { boxShadow: "0 0 0 3px rgba(51,204,51,0.15)", borderColor: "#33cc33" } : {}}
                >
                  <div className="pl-4 pr-2 text-[#6e6e6e]">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedInput('password')}
                    onBlur={() => setFocusedInput(null)}
                    className="w-full bg-transparent border-none text-[#333333] placeholder-[#a3a3a3] py-3 pr-10 outline-none font-medium text-sm rounded-r-xl"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6e6e6e] hover:text-[#333333] transition-colors p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </motion.div>
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="w-full h-12 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 bg-[#4ade80] hover:bg-[#22c55e] text-[#062c11] shadow-[0_4px_14px_rgba(74,222,128,0.35)] hover:shadow-[0_6px_20px_rgba(34,197,94,0.45)]"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign In to Nexus &rarr;</span>
                )}
              </motion.button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-[#d4d4d4]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#6e6e6e] bg-white px-2">
                or
              </span>
              <div className="flex-1 h-px bg-[#d4d4d4]" />
            </div>

            {/* Register Link */}
            <Link
              to="/register"
              className="w-full h-12 rounded-xl bg-white border border-[#d4d4d4] text-[#333333] font-bold flex items-center justify-center hover:bg-[#f5f5f5] transition-colors"
            >
              Create Free Account
            </Link>

            {/* Security Badge */}
            <div className="mt-8 flex items-center justify-center gap-2 text-[11px] font-semibold text-[#6e6e6e]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#33cc33]" />
              Secured with JWT &middot; AES-256 encrypted
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}