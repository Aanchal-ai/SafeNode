import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck, Eye, Trash2, ScanFace, AlertTriangle,
  Search, Upload, X, Check, Loader2, Mail
} from "lucide-react";
import { toast } from "sonner";
import { LeakResult, ScanStatus } from "@/hooks/useDigitalProtection";

interface PastZoneProps {
  leaks: LeakResult[];
  scanStatus: ScanStatus;
  onScanEmail: (email: string) => void;
  onScanFace: (file: File) => void;
  onRequestRemoval: (id: string) => void;
  onDismissLeak: (id: string) => void;
}

const iconMap = {
  email: Mail,
  phone: Eye,
  address: Eye,
  photo: ScanFace,
  social: AlertTriangle,
};

const PastZone = ({
  leaks = [],
  scanStatus = "idle",
  onScanEmail,
  onScanFace,
  onRequestRemoval,
  onDismissLeak,
}: PastZoneProps) => {
  const [email, setEmail] = useState("");
  const [showEmailInput, setShowEmailInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleEmailScan = () => {
    if (!email.includes("@")) {
      toast.error("Enter a valid email address");
      return;
    }
    onScanEmail(email);
    setShowEmailInput(false);
    setEmail("");
    toast.success("Digital footprint scan started");
  };

  const handleFaceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file");
        return;
      }
      onScanFace(file);
      toast.success("Face scan initiated across platforms");
    }
  };

  const getTimeSince = (isoDate: string) => {
    const diff = Date.now() - new Date(isoDate).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.4 }}
      className="px-6 py-8 pb-32"
    >
      <div className="flex items-center gap-2 mb-4">
        <ShieldCheck className="w-4 h-4 text-muted-foreground" />
        <p className="font-mono-data text-[10px] text-muted-foreground tracking-[0.3em] uppercase">
          Digital Protection
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 mb-4">
        <button
          onClick={() => setShowEmailInput(!showEmailInput)}
          disabled={scanStatus === "scanning"}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-border bg-card text-foreground font-rubik text-sm hover:border-primary/30 transition-colors disabled:opacity-50"
        >
          <Search className="w-4 h-4 text-primary" />
          Scan Leaks
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={scanStatus === "scanning"}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-border bg-card text-foreground font-rubik text-sm hover:border-primary/30 transition-colors disabled:opacity-50"
        >
          <ScanFace className="w-4 h-4 text-primary" />
          Face Scan
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFaceUpload}
          className="hidden"
        />
      </div>

      {/* Email input */}
      <AnimatePresence>
        {showEmailInput && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-4"
          >
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Enter your email to scan..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleEmailScan()}
                className="flex-1 px-4 py-3 rounded-xl bg-card border border-border text-foreground font-mono-data text-sm placeholder:text-muted-foreground outline-none focus:border-primary/40"
              />
              <button
                onClick={handleEmailScan}
                className="px-4 py-3 rounded-xl bg-primary text-primary-foreground font-mono-data text-sm"
              >
                Scan
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scanning indicator */}
      <AnimatePresence>
        {scanStatus === "scanning" && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-center gap-3"
          >
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
            <div>
              <p className="font-rubik text-sm text-foreground">Scanning...</p>
              <p className="font-mono-data text-xs text-muted-foreground">
                Checking databases and platforms
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Leak results */}
      <div className="space-y-3">
        <AnimatePresence>
          {leaks.map((leak, i) => {
            const Icon = iconMap[leak.type] || Eye;
            return (
              <motion.div
                key={leak.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ delay: i * 0.05 }}
                className="bg-card rounded-xl border border-border p-4 group hover:border-primary/20 transition-colors duration-300"
              >
                <div className="flex gap-3">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      leak.severity === "high"
                        ? "bg-accent/10 text-accent"
                        : leak.severity === "medium"
                        ? "bg-accent/5 text-accent/70"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-rubik text-sm text-foreground font-medium">
                        {leak.source}
                      </h3>
                      <span className="font-mono-data text-[10px] text-muted-foreground shrink-0 ml-2">
                        {getTimeSince(leak.foundAt)}
                      </span>
                    </div>
                    <p className="font-mono-data text-xs text-muted-foreground mt-1 truncate">
                      {leak.detail}
                    </p>

                    {/* Action buttons */}
                    <div className="flex gap-2 mt-3">
                      {leak.removalStatus === "pending" ? (
                        <button
                          onClick={() => onRequestRemoval(leak.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary font-mono-data text-xs hover:bg-primary/20 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                          Request Removal
                        </button>
                      ) : leak.removalStatus === "requested" ? (
                        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/10 text-accent font-mono-data text-xs">
                          <Check className="w-3 h-3" />
                          Removal Requested
                        </span>
                      ) : leak.removalStatus === "removed" ? (
                        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary font-mono-data text-xs">
                          <Check className="w-3 h-3" />
                          Removed
                        </span>
                      ) : null}
                      <button
                        onClick={() => onDismissLeak(leak.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted text-muted-foreground font-mono-data text-xs hover:bg-muted/80 transition-colors"
                      >
                        <X className="w-3 h-3" />
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {leaks.length === 0 && scanStatus !== "scanning" && (
          <div className="text-center py-8">
            <ShieldCheck className="w-8 h-8 text-primary mx-auto mb-3 opacity-40" />
            <p className="font-rubik text-sm text-muted-foreground">No leaks detected</p>
            <p className="font-mono-data text-xs text-muted-foreground mt-1">
              Run a scan to check your digital footprint
            </p>
          </div>
        )}
      </div>
    </motion.section>
  );
};

export default PastZone;
