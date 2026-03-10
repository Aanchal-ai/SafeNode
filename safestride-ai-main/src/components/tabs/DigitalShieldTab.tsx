import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Search, Loader2, AlertTriangle, Check,
  Trash2, X, Terminal, ShieldCheck
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface LeakResult {
  id: string;
  source: string;
  type: string;
  severity: "high" | "medium" | "low";
  detail: string;
  status: "found" | "takedown_requested";
}

const SCAN_STEPS = [
  "Initializing privacy scan engine...",
  "Connecting to breach databases...",
  "Analyzing biometric data fingerprint...",
  "Crawling indexed social media platforms...",
  "Searching deep-web databases...",
  "Cross-referencing PII records...",
  "Scanning image reverse-search engines...",
  "Checking exposed API endpoints...",
  "Analyzing metadata signatures...",
  "Generating protection report...",
];

const MOCK_LEAKS: LeakResult[] = [
  {
    id: "1",
    source: "databroker-network.com",
    type: "Personal Data",
    severity: "high",
    detail: "Full name, email, and phone number listed on data broker aggregator",
    status: "found",
  },
  {
    id: "2",
    source: "social-archive.net",
    type: "Social Media",
    severity: "medium",
    detail: "Cached profile snapshot found on archival indexer",
    status: "found",
  },
  {
    id: "3",
    source: "image-search-db",
    type: "Photo",
    severity: "low",
    detail: "1 suspicious image match flagged for review",
    status: "found",
  },
];

const DigitalShieldTab = () => {
  const [scanState, setScanState] = useState<"idle" | "scanning" | "complete">("idle");
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [leaks, setLeaks] = useState<LeakResult[]>([]);
  const [privacyScore, setPrivacyScore] = useState<number | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  const startScan = () => {
    setScanState("scanning");
    setProgress(0);
    setCurrentStep(0);
    setLogs([]);
    setLeaks([]);
    setPrivacyScore(null);
  };

  useEffect(() => {
    if (scanState !== "scanning") return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 1;
        if (next >= 100) {
          clearInterval(interval);
          setScanState("complete");
          setLeaks(MOCK_LEAKS);
          setPrivacyScore(72);
          return 100;
        }
        return next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [scanState]);

  useEffect(() => {
    if (scanState !== "scanning") return;
    const stepIndex = Math.floor((progress / 100) * SCAN_STEPS.length);
    if (stepIndex !== currentStep && stepIndex < SCAN_STEPS.length) {
      setCurrentStep(stepIndex);
      setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${SCAN_STEPS[stepIndex]}`]);
    }
  }, [progress, scanState, currentStep]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const requestTakedown = (id: string) => {
    setLeaks((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status: "takedown_requested" as const } : l))
    );
  };

  const dismissLeak = (id: string) => {
    setLeaks((prev) => prev.filter((l) => l.id !== id));
  };

  return (
    <div className="px-4 py-4 space-y-5">
      {/* Header */}
      <div className="text-center">
        <Shield className="w-10 h-10 text-primary mx-auto mb-3 opacity-60" />
        <h2 className="font-rubik text-xl font-semibold text-foreground">Digital Shield</h2>
        <p className="font-mono-data text-xs text-muted-foreground mt-1">
          Deep-web privacy scanner & data leak detector
        </p>
      </div>

      {/* Start scan button */}
      {scanState === "idle" && (
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={startScan}
          className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-rubik text-base font-semibold glow-cyan flex items-center justify-center gap-3"
        >
          <Search className="w-5 h-5" />
          Start Deep-Web Scan
        </motion.button>
      )}

      {/* Scanning state */}
      <AnimatePresence>
        {scanState === "scanning" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Progress */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-primary animate-spin" />
                  <span className="font-mono-data text-xs text-primary">Scanning...</span>
                </div>
                <span className="font-mono-data text-xs text-muted-foreground">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Status text */}
            <AnimatePresence mode="wait">
              <motion.p
                key={currentStep}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="font-mono-data text-sm text-foreground/80"
              >
                {SCAN_STEPS[currentStep]}
              </motion.p>
            </AnimatePresence>

            {/* Terminal log */}
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2 border-b border-border">
                <Terminal className="w-3 h-3 text-primary" />
                <span className="font-mono-data text-[10px] text-muted-foreground tracking-widest uppercase">
                  Live Log
                </span>
              </div>
              <div className="p-3 h-40 overflow-y-auto">
                {logs.map((log, i) => (
                  <motion.p
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="font-mono-data text-[11px] text-primary/70 leading-relaxed"
                  >
                    {log}
                  </motion.p>
                ))}
                <div ref={logEndRef} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <AnimatePresence>
        {scanState === "complete" && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
          >
            {/* Privacy score */}
            <div className="bg-card rounded-2xl border border-border p-6 text-center">
              <p className="font-mono-data text-[10px] text-muted-foreground tracking-[0.3em] uppercase mb-3">
                Privacy Health Score
              </p>
              <div className="relative inline-flex items-center justify-center w-28 h-28">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(220, 30%, 18%)" strokeWidth="6" />
                  <motion.circle
                    cx="50" cy="50" r="42" fill="none"
                    stroke={privacyScore! >= 80 ? "hsl(140, 70%, 45%)" : privacyScore! >= 60 ? "hsl(45, 100%, 50%)" : "hsl(0, 80%, 50%)"}
                    strokeWidth="6" strokeLinecap="round"
                    strokeDasharray={264}
                    initial={{ strokeDashoffset: 264 }}
                    animate={{ strokeDashoffset: 264 - (264 * (privacyScore || 0)) / 100 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                  />
                </svg>
                <span className="absolute font-rubik text-3xl font-bold text-foreground">
                  {privacyScore}
                </span>
              </div>
              <p className="font-rubik text-sm text-accent mt-3">Needs Improvement</p>
            </div>

            {/* Leaks */}
            <div>
              <p className="font-mono-data text-[10px] text-muted-foreground tracking-[0.2em] uppercase mb-3">
                {leaks.length} Issue{leaks.length !== 1 ? "s" : ""} Found
              </p>
              <div className="space-y-3">
                {leaks.map((leak, i) => (
                  <motion.div
                    key={leak.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-card rounded-xl border border-border p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        leak.severity === "high" ? "bg-destructive/15 text-destructive" :
                        leak.severity === "medium" ? "bg-accent/15 text-accent" :
                        "bg-muted text-muted-foreground"
                      }`}>
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-rubik text-sm text-foreground font-medium">{leak.source}</h3>
                          <span className={`font-mono-data text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            leak.severity === "high" ? "bg-destructive/10 text-destructive" :
                            leak.severity === "medium" ? "bg-accent/10 text-accent" :
                            "bg-muted text-muted-foreground"
                          }`}>{leak.severity}</span>
                        </div>
                        <p className="font-mono-data text-xs text-muted-foreground mt-1">{leak.detail}</p>
                        <div className="flex gap-2 mt-3">
                          {leak.status === "found" ? (
                            <button
                              onClick={() => requestTakedown(leak.id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary font-mono-data text-xs"
                            >
                              <Trash2 className="w-3 h-3" />
                              Request AI Takedown
                            </button>
                          ) : (
                            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary font-mono-data text-xs">
                              <Check className="w-3 h-3" />
                              Takedown Requested
                            </span>
                          )}
                          <button
                            onClick={() => dismissLeak(leak.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted text-muted-foreground font-mono-data text-xs"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {leaks.length === 0 && (
                  <div className="text-center py-6">
                    <ShieldCheck className="w-8 h-8 text-primary mx-auto mb-2 opacity-40" />
                    <p className="font-rubik text-sm text-muted-foreground">All clear — no active leaks</p>
                  </div>
                )}
              </div>
            </div>

            {/* Re-scan */}
            <button
              onClick={startScan}
              className="w-full py-3 rounded-xl border border-border bg-card text-foreground font-rubik text-sm hover:border-primary/30 transition-colors"
            >
              Run Another Scan
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DigitalShieldTab;
