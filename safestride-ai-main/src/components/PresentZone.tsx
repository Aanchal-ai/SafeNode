import { motion, AnimatePresence } from "framer-motion";
import { Shield, Mic, MicOff, AlertTriangle, Phone, X, ShieldAlert } from "lucide-react";
import { MicStatus } from "@/hooks/useMicDetection";

interface PresentZoneProps {
  micActive: boolean;
  onToggleMic: () => void;
  status: MicStatus;
  volumeLevel: number;
  lastDetectedWord: string | null;
  onDismissAlert: () => void;
  emergencyTriggered: boolean;
  onCancelEmergency: () => void;
  leakCount: number;
}

const PresentZone = ({
  micActive = false,
  onToggleMic,
  status = "idle",
  volumeLevel = 0,
  lastDetectedWord = null,
  onDismissAlert,
  emergencyTriggered = false,
  onCancelEmergency,
  leakCount = 0,
}: PresentZoneProps) => {
  const statusText = {
    idle: { word: "inactive", color: "text-muted-foreground" },
    listening: { word: "safe", color: "text-primary text-glow-cyan" },
    alert: { word: "alert", color: "text-accent" },
    emergency: { word: "EMERGENCY", color: "text-destructive" },
  };

  const currentStatus = statusText[status] || statusText.idle;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="relative min-h-[50vh] flex flex-col items-center justify-center px-6 py-12"
    >
      {/* Background glow - changes color based on status */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div
          className="w-[300px] h-[300px] rounded-full"
          animate={{
            opacity: status === "alert" ? 0.08 : status === "emergency" ? 0.15 : 0.04,
          }}
          style={{
            background:
              status === "alert"
                ? "radial-gradient(circle, hsl(45 100% 50%) 0%, transparent 70%)"
                : status === "emergency"
                ? "radial-gradient(circle, hsl(0 80% 50%) 0%, transparent 70%)"
                : "radial-gradient(circle, hsl(180 100% 50%) 0%, transparent 70%)",
          }}
        />
      </div>

      {/* Emergency overlay */}
      <AnimatePresence>
        {emergencyTriggered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-background/95 rounded-2xl"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <Phone className="w-16 h-16 text-accent mb-4" />
            </motion.div>
            <h2 className="font-rubik text-2xl text-foreground font-semibold mb-2">
              Emergency Call in 10s
            </h2>
            <p className="font-mono-data text-sm text-muted-foreground mb-6">
              Calling emergency services...
            </p>
            <button
              onClick={onCancelEmergency}
              className="flex items-center gap-2 px-6 py-3 rounded-full border border-accent bg-accent/10 text-accent font-rubik font-medium"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Alert banner */}
      <AnimatePresence>
        {status === "alert" && !emergencyTriggered && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-4 left-4 right-4 z-10 bg-accent/10 border border-accent/30 rounded-xl p-4"
          >
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 text-accent shrink-0" />
              <div className="flex-1">
                <p className="font-rubik text-sm text-foreground font-medium">
                  Distress Detected
                </p>
                <p className="font-mono-data text-xs text-accent mt-1">
                  {lastDetectedWord}
                </p>
              </div>
              <button
                onClick={onDismissAlert}
                className="px-3 py-1.5 rounded-lg border border-accent/30 text-accent font-mono-data text-xs"
              >
                I'm OK
              </button>
            </div>
            <p className="font-mono-data text-[10px] text-muted-foreground mt-2">
              Emergency call in 10s if not dismissed
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Shield icon with volume ring */}
      <div className="relative mb-8">
        <motion.div
          className="w-24 h-24 rounded-full border-2 flex items-center justify-center"
          animate={{
            borderColor:
              status === "alert"
                ? "hsl(45 100% 50% / 0.6)"
                : status === "emergency"
                ? "hsl(0 80% 50% / 0.6)"
                : micActive
                ? [
                    "hsl(180 100% 50% / 0.3)",
                    "hsl(180 100% 50% / 0.6)",
                    "hsl(180 100% 50% / 0.3)",
                  ]
                : "hsl(220 30% 18% / 0.5)",
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          {status === "alert" ? (
            <AlertTriangle className="w-10 h-10 text-accent" />
          ) : (
            <Shield className="w-10 h-10 text-primary" />
          )}
        </motion.div>

        {/* Volume indicator ring */}
        {micActive && status === "listening" && (
          <motion.div
            className="absolute inset-0 rounded-full border border-primary/20"
            animate={{
              scale: 1 + volumeLevel * 0.8,
              opacity: Math.min(volumeLevel * 2, 0.6),
            }}
            transition={{ duration: 0.1 }}
          />
        )}
      </div>

      {/* Status text */}
      <AnimatePresence mode="wait">
        <motion.div
          key={status}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="text-center"
        >
          <h1 className="text-3xl font-rubik font-light tracking-wide text-foreground mb-2">
            You are{" "}
            <span className={`font-medium ${currentStatus.color}`}>
              {currentStatus.word}
            </span>
          </h1>
          <p className="font-mono-data text-sm text-muted-foreground tracking-wider">
            {status === "idle"
              ? "TAP TO ACTIVATE"
              : status === "listening"
              ? "ALL SYSTEMS NOMINAL"
              : status === "alert"
              ? "ANALYZING SITUATION"
              : "CONTACTING HELP"}
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Volume bar */}
      {micActive && (
        <div className="mt-4 w-48 h-1 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            animate={{
              width: `${Math.min(volumeLevel * 100 * 3, 100)}%`,
              backgroundColor:
                volumeLevel > 0.6
                  ? "hsl(45 100% 50%)"
                  : volumeLevel > 0.3
                  ? "hsl(180 100% 50%)"
                  : "hsl(180 100% 50% / 0.5)",
            }}
            transition={{ duration: 0.05 }}
          />
        </div>
      )}

      {/* Mic toggle */}
      <motion.button
        onClick={onToggleMic}
        whileTap={{ scale: 0.95 }}
        className={`mt-6 flex items-center gap-3 px-5 py-3 rounded-full border transition-all duration-300 ${
          micActive
            ? "border-primary/40 bg-primary/10 text-primary"
            : "border-border bg-muted text-muted-foreground"
        }`}
      >
        {micActive ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
        <span className="font-mono-data text-xs tracking-wider uppercase">
          {micActive ? "Listening" : "Tap to Start"}
        </span>
      </motion.button>

      {/* Data readout */}
      <div className="mt-8 flex gap-6">
        {[
          { label: "THREATS", value: status === "alert" ? "1" : "0" },
          { label: "LEAKS", value: String(leakCount) },
          { label: "MIC", value: micActive ? "ON" : "OFF" },
        ].map((item) => (
          <div key={item.label} className="text-center">
            <p className="font-mono-data text-lg text-primary font-medium">{item.value}</p>
            <p className="font-mono-data text-[10px] text-muted-foreground tracking-widest mt-1">
              {item.label}
            </p>
          </div>
        ))}
      </div>
    </motion.section>
  );
};

export default PresentZone;
