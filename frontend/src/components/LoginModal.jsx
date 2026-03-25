import React, { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, AlertCircle, Loader2, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Modal from "./Modal";

export default function LoginModal({ isOpen, onClose, onSwitchToSignup }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await login(email, password);
      onClose();
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message || "Failed to login");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Sign In"
      maxWidth="max-w-md"
    >
      <div className="space-y-6 pt-2">
        <div className="text-center mb-2">
          <p className="text-nexus-muted text-sm">
            Sign in to sync your resume history across devices
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3.5 rounded-xl flex items-center gap-3 text-sm"
            >
              <AlertCircle size={18} />
              {error}
            </motion.div>
          )}

          <div className="space-y-2">
            <label
              className="text-xs font-semibold text-nexus-muted uppercase tracking-wider ml-1"
              htmlFor="modal-email"
            >
              Email Address
            </label>
            <div className="relative">
              <Mail
                className="absolute left-4 top-1/2 -translate-y-1/2 text-nexus-muted"
                size={16}
              />
              <input
                id="modal-email"
                type="email"
                placeholder="name@example.com"
                className="nexus-input pl-11 py-3.5"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center ml-1">
              <label
                className="text-xs font-semibold text-nexus-muted uppercase tracking-wider"
                htmlFor="modal-password"
              >
                Password
              </label>
              <a
                href="#"
                className="text-[10px] uppercase font-bold text-nexus-cyan hover:text-cyan-300 transition-colors"
              >
                Forgot?
              </a>
            </div>
            <div className="relative">
              <Lock
                className="absolute left-4 top-1/2 -translate-y-1/2 text-nexus-muted"
                size={16}
              />
              <input
                id="modal-password"
                type="password"
                placeholder="••••••••"
                className="nexus-input pl-11 py-3.5"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full justify-center group py-4 h-14"
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                <span>Sign In to Nexus</span>
                <ArrowRight
                  className="group-hover:translate-x-1 transition-transform"
                  size={18}
                />
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-2">
          <p className="text-nexus-muted text-sm">
            New to Nexus?{" "}
            <button
              onClick={onSwitchToSignup}
              className="text-cyan-400 font-bold hover:underline"
            >
              Create account
            </button>
          </p>
        </div>
      </div>
    </Modal>
  );
}
