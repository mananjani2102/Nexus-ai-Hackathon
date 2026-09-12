import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Copy, CheckCheck, Download, Loader2, Sparkles, X } from "lucide-react";
import { generateCoverLetter } from "../services/api";

export default function CoverLetterModal({ isOpen, onClose, resumeText, jobRole }) {
  const [companyName, setCompanyName] = useState("");
  const [tone, setTone] = useState("professional");
  const [loading, setLoading] = useState(false);
  const [coverLetterData, setCoverLetterData] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await generateCoverLetter({
        resumeText: resumeText || "",
        jobRole: jobRole || "Software Engineer",
        companyName: companyName.trim() || "Target Company",
        tone,
      });
      setCoverLetterData(data);
    } catch (err) {
      setError(err?.response?.data?.error || err.userMessage || "Failed to generate cover letter.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!coverLetterData?.coverLetter) return;
    navigator.clipboard.writeText(coverLetterData.coverLetter).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownload = () => {
    if (!coverLetterData?.coverLetter) return;
    const blob = new Blob([coverLetterData.coverLetter], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Cover_Letter_${(jobRole || "Role").replace(/\s+/g, "_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center border border-primary/20 text-primary">
              <Sparkles size={16} />
            </div>
            <div>
              <h2 className="font-bold text-base text-foreground">AI Cover Letter Generator</h2>
              <p className="text-xs text-muted-foreground">Tailored to your analyzed resume highlights</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-sm">
          {error && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs">
              {error}
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Target Company (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Acme Corp, Stripe, Google"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-card/60 border border-border focus:border-primary/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Writing Tone
              </label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-card/60 border border-border focus:border-primary/50 focus:outline-none"
              >
                <option value="professional">Professional & Polished</option>
                <option value="confident">Bold & High-Impact</option>
                <option value="conversational">Warm & Authentic</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full btn-primary py-2.5 justify-center text-xs"
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin mr-1.5" /> Drafting Cover Letter...
              </>
            ) : (
              <>
                <Sparkles size={14} className="mr-1.5" /> Generate Personalized Cover Letter
              </>
            )}
          </button>

          {coverLetterData && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">Generated Draft:</span>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border border-border bg-card/80 hover:bg-muted/50 transition-colors"
                  >
                    {copied ? <CheckCheck size={12} className="text-emerald-500" /> : <Copy size={12} />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border border-border bg-card/80 hover:bg-muted/50 transition-colors"
                  >
                    <Download size={12} /> Download
                  </button>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-muted/20 border border-border text-xs leading-relaxed font-sans whitespace-pre-wrap max-h-60 overflow-y-auto text-foreground">
                {coverLetterData.coverLetter}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
