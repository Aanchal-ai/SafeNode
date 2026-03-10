import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, CameraOff, ScanFace, UserCheck, AlertTriangle, Plus, X, Shield } from "lucide-react";
import { toast } from "sonner";

interface TrustedFace {
  id: string;
  name: string;
  addedAt: string;
}

const IdentityVaultTab = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [scanStatus, setScanStatus] = useState<"idle" | "scanning" | "verified" | "unknown">("idle");
  const [faceCount, setFaceCount] = useState(0);
  const [trustList, setTrustList] = useState<TrustedFace[]>([
    { id: "1", name: "You (Owner)", addedAt: new Date().toISOString() },
  ]);
  const [newName, setNewName] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const scanIntervalRef = useRef<number>(0);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
      setScanStatus("scanning");

      // Simulate face detection cycle
      scanIntervalRef.current = window.setInterval(() => {
        const detected = Math.random();
        if (detected > 0.7) {
          // Simulate unknown face
          setFaceCount(2);
          setScanStatus("unknown");
          toast("⚠️ Unknown Person Detected", {
            description: "Face not in Trust List",
          });
          if ("vibrate" in navigator) navigator.vibrate(100);
        } else {
          setFaceCount(1);
          setScanStatus("verified");
        }
      }, 5000);
    } catch {
      toast.error("Camera access denied");
    }
  }, []);

  const stopCamera = useCallback(() => {
    clearInterval(scanIntervalRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
    setScanStatus("idle");
    setFaceCount(0);
  }, []);

  const addTrust = () => {
    if (!newName.trim()) return;
    setTrustList((prev) => [
      ...prev,
      { id: `t-${Date.now()}`, name: newName.trim(), addedAt: new Date().toISOString() },
    ]);
    setNewName("");
    setShowAddForm(false);
    toast.success(`${newName.trim()} added to Trust List`);
  };

  const removeTrust = (id: string) => {
    setTrustList((prev) => prev.filter((t) => t.id !== id));
  };

  useEffect(() => () => stopCamera(), [stopCamera]);

  return (
    <div className="px-4 py-4 space-y-5">
      {/* Header */}
      <div className="text-center">
        <ScanFace className="w-10 h-10 text-primary mx-auto mb-3 opacity-60" />
        <h2 className="font-rubik text-xl font-semibold text-foreground">Identity Vault</h2>
        <p className="font-mono-data text-xs text-muted-foreground mt-1">
          Proximity detection & face recognition
        </p>
      </div>

      {/* Camera feed */}
      <div className="relative rounded-2xl overflow-hidden border border-border bg-card" style={{ aspectRatio: "4/3" }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
          style={{ transform: "scaleX(-1)" }}
        />

        {!cameraActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-card">
            <CameraOff className="w-12 h-12 text-muted-foreground mb-3 opacity-40" />
            <p className="font-mono-data text-xs text-muted-foreground">Camera inactive</p>
          </div>
        )}

        {/* Scanning overlay */}
        {cameraActive && (
          <>
            {/* Scan frame corners */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-56 relative">
                {/* Top-left */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary rounded-tl-lg" />
                {/* Top-right */}
                <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary rounded-tr-lg" />
                {/* Bottom-left */}
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary rounded-bl-lg" />
                {/* Bottom-right */}
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary rounded-br-lg" />

                {/* Scan line */}
                <motion.div
                  className="absolute left-1 right-1 h-0.5 bg-primary/60"
                  animate={{ top: ["0%", "100%", "0%"] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  style={{ boxShadow: "0 0 10px hsl(180 100% 50% / 0.5)" }}
                />
              </div>
            </div>

            {/* Status label */}
            <div className="absolute bottom-3 left-3 right-3 z-10">
              <motion.div
                key={scanStatus}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`glass rounded-xl px-4 py-2.5 flex items-center gap-3 ${
                  scanStatus === "unknown" ? "border-destructive/30" : "border-primary/20"
                }`}
              >
                {scanStatus === "verified" ? (
                  <>
                    <UserCheck className="w-4 h-4 text-primary" />
                    <span className="font-mono-data text-xs text-primary">Identity Verified</span>
                  </>
                ) : scanStatus === "unknown" ? (
                  <>
                    <AlertTriangle className="w-4 h-4 text-destructive" />
                    <span className="font-mono-data text-xs text-destructive">Unknown Person Detected</span>
                  </>
                ) : (
                  <>
                    <ScanFace className="w-4 h-4 text-primary animate-pulse" />
                    <span className="font-mono-data text-xs text-muted-foreground">Scanning...</span>
                  </>
                )}
                <span className="ml-auto font-mono-data text-[10px] text-muted-foreground">
                  {faceCount} face{faceCount !== 1 ? "s" : ""}
                </span>
              </motion.div>
            </div>
          </>
        )}
      </div>

      {/* Camera toggle */}
      <div className="flex justify-center">
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={cameraActive ? stopCamera : startCamera}
          className={`flex items-center gap-3 px-6 py-3 rounded-xl font-rubik text-sm font-medium transition-all ${
            cameraActive
              ? "bg-destructive/15 border border-destructive/30 text-destructive"
              : "bg-primary text-primary-foreground glow-cyan"
          }`}
        >
          {cameraActive ? (
            <>
              <CameraOff className="w-4 h-4" />
              Stop Camera
            </>
          ) : (
            <>
              <Camera className="w-4 h-4" />
              Start Face Scan
            </>
          )}
        </motion.button>
      </div>

      {/* Trust List */}
      <div className="bg-card rounded-xl border border-border p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <p className="font-mono-data text-[10px] text-muted-foreground tracking-[0.2em] uppercase">
              Trust List
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-3"
            >
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Person's name..."
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addTrust()}
                  className="flex-1 px-3 py-2 rounded-lg bg-muted border border-border text-foreground font-mono-data text-xs outline-none focus:border-primary/40"
                />
                <button
                  onClick={addTrust}
                  className="px-3 py-2 rounded-lg bg-primary text-primary-foreground font-mono-data text-xs"
                >
                  Add
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-2">
          {trustList.map((face) => (
            <div
              key={face.id}
              className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <UserCheck className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-rubik text-sm text-foreground">{face.name}</p>
                  <p className="font-mono-data text-[9px] text-muted-foreground">Trusted</p>
                </div>
              </div>
              {face.id !== "1" && (
                <button
                  onClick={() => removeTrust(face.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default IdentityVaultTab;
