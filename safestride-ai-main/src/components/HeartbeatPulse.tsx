import { motion } from "framer-motion";
import { MicStatus } from "@/hooks/useMicDetection";

interface HeartbeatPulseProps {
  active: boolean;
  status: MicStatus;
  volumeLevel: number;
}

const HeartbeatPulse = ({ active, status, volumeLevel }: HeartbeatPulseProps) => {
  if (!active) return null;

  const pulseSpeed = status === "alert" ? 0.4 : status === "emergency" ? 0.25 : 1;
  const pulseColor =
    status === "alert"
      ? "bg-accent/60"
      : status === "emergency"
      ? "bg-destructive/60"
      : "bg-primary/60";

  const ringColor =
    status === "alert"
      ? "bg-accent/20"
      : status === "emergency"
      ? "bg-destructive/20"
      : "bg-primary/20";

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
      {/* Outer pulse ring */}
      <motion.div
        className={`absolute inset-0 w-5 h-5 rounded-full ${ringColor}`}
        animate={{ scale: [1, 2.5], opacity: [0.4, 0] }}
        transition={{ duration: pulseSpeed * 2, repeat: Infinity, ease: "easeOut" }}
      />
      {/* Core pulse */}
      <motion.div
        className={`w-5 h-5 rounded-full ${pulseColor}`}
        animate={{
          scale: [1, 1.15 + volumeLevel * 0.3, 1, 1.1 + volumeLevel * 0.2, 1],
          opacity: [0.6, 1, 0.6, 0.9, 0.6],
        }}
        transition={{
          duration: pulseSpeed,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
};

export default HeartbeatPulse;
