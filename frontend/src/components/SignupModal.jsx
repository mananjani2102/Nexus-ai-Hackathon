import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Mail,
  Lock,
  User,
  AlertCircle,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Modal from "./Modal";

export default function SignupModal({ isOpen, onClose, onSwitchToLogin }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { signup } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await signup(name, email, password);
      onClose();
    } catch (err) {
      console.error("Registration error:", err);
      setError(err.message || "Failed to create account");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Account"
      maxWidth="max-w-md"
    >
      <div className="space-y-6 pt-2">
        <div className="text-center mb-2">
          <p className="text-nexus-muted text-sm">
            Join Nexus AI to unlock unlimited resume optimizations
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
              htmlFor="signup-name"
            >
              Full Name
            </label>
            <div className="relative">
              <User
                className="absolute left-4 top-1/2 -translate-y-1/2 text-nexus-muted"
                size={16}
              />
              <input
                id="signup-name"
                type="text"
                placeholder="John Doe"
                className="nexus-input pl-11 py-3.5"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label
              className="text-xs font-semibold text-nexus-muted uppercase tracking-wider ml-1"
              htmlFor="signup-email"
            >
              Email Address
            </label>
            <div className="relative">
              <Mail
                className="absolute left-4 top-1/2 -translate-y-1/2 text-nexus-muted"
                size={16}
              />
              <input
                id="signup-email"
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
            <label
              className="text-xs font-semibold text-nexus-muted uppercase tracking-wider ml-1"
              htmlFor="signup-password"
            >
              Password
            </label>
            <div className="relative">
              <Lock
                className="absolute left-4 top-1/2 -translate-y-1/2 text-nexus-muted"
                size={16}
              />
              <input
                id="signup-password"
                type="password"
                placeholder="Minimum 8 characters"
                className="nexus-input pl-11 py-3.5"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
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
                <span>Create My Account</span>
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
            Already have an account?{" "}
            <button
              onClick={onSwitchToLogin}
              className="text-cyan-400 font-bold hover:underline"
            >
              Log in
            </button>
          </p>
        </div>
      </div>
    </Modal>
  );
}
