import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Phone, X, ShieldAlert, Volume2 } from "lucide-react";

type AcousticStatus = "idle" | "listening" | "alert" | "sos";

const DISTRESS_KEYWORDS = ["help", "emergency", "sos", "stop", "fire", "danger"];
const DB_THRESHOLD = 0.8;

const AcousticTab = () => {
  const [status, setStatus] = useState<AcousticStatus>("idle");
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [dbLevel, setDbLevel] = useState(0);
  const [detectedWord, setDetectedWord] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(5);
  const [isListening, setIsListening] = useState(false);

  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animRef = useRef<number>(0);
  const recognitionRef = useRef<any>(null);
  const countdownRef = useRef<number>(0);
  const sosTriggeredRef = useRef(false);

  const triggerSOS = useCallback((reason: string) => {
    if (sosTriggeredRef.current) return;
    sosTriggeredRef.current = true;
    setStatus("alert");
    setDetectedWord(reason);
    setCountdown(5);

    let count = 5;
    countdownRef.current = window.setInterval(() => {
      count--;
      setCountdown(count);
      if (count <= 0) {
        clearInterval(countdownRef.current);
        setStatus("sos");
        // Vibration
        if ("vibrate" in navigator) {
          navigator.vibrate([200, 100, 200, 100, 500]);
        }
      }
    }, 1000);
  }, []);

  const cancelSOS = useCallback(() => {
    clearInterval(countdownRef.current);
    sosTriggeredRef.current = false;
    setStatus("listening");
    setDetectedWord(null);
    setCountdown(5);
  }, []);

  const analyzeAudio = useCallback(() => {
    if (!analyserRef.current) return;
    const data = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(data);

    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += (data[i] / 255) ** 2;
    }
    const rms = Math.sqrt(sum / data.length);
    setVolumeLevel(rms);
    setDbLevel(Math.round(rms * 120)); // Approximate dB mapping

    if (rms > DB_THRESHOLD && !sosTriggeredRef.current) {
      triggerSOS("🔊 Scream Detected — High dB Spike");
    }

    animRef.current = requestAnimationFrame(analyzeAudio);
  }, [triggerSOS]);

  const startListening = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      streamRef.current = stream;

      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      analyserRef.current = analyser;

      setIsListening(true);
      setStatus("listening");
      animRef.current = requestAnimationFrame(analyzeAudio);

      // Speech recognition
      const SpeechAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechAPI) {
        const recognition = new SpeechAPI();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onresult = (event: any) => {
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript.toLowerCase().trim();
            for (const kw of DISTRESS_KEYWORDS) {
              if (transcript.includes(kw)) {
                triggerSOS(`"${kw.toUpperCase()}" keyword detected`);
                return;
              }
            }
          }
        };

        recognition.onerror = () => {};
        recognition.onend = () => {
          if (isListening) try { recognition.start(); } catch {}
        };
        recognition.start();
        recognitionRef.current = recognition;
      }
    } catch {
      setStatus("idle");
    }
  }, [analyzeAudio, triggerSOS, isListening]);

  const stopListening = useCallback(() => {
    cancelAnimationFrame(animRef.current);
    recognitionRef.current?.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    audioCtxRef.current?.close();
    clearInterval(countdownRef.current);
    sosTriggeredRef.current = false;
    setIsListening(false);
    setStatus("idle");
    setVolumeLevel(0);
    setDbLevel(0);
    setDetectedWord(null);
  }, []);

  useEffect(() => () => stopListening(), [stopListening]);

  // Waveform bars
  const bars = 32;

  return (
    <div className="px-4 py-4 space-y-6 relative min-h-[80vh]">
      {/* SOS Flash Overlay */}
      <AnimatePresence>
        {(status === "alert" || status === "sos") && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex flex-col items-center justify-center"
            style={{ background: "hsl(0 80% 50% / 0.08)" }}
          >
            <motion.div
              className="fixed inset-0"
              animate={{ opacity: [0, 0.15, 0] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              style={{ background: "hsl(0 80% 50%)" }}
            />

            <div className="relative z-50 flex flex-col items-center text-center px-6">
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              >
                <ShieldAlert className="w-20 h-20 text-destructive mb-4" />
              </motion.div>

              {status === "alert" ? (
                <>
                  <h2 className="font-rubik text-3xl font-bold text-foreground mb-2">
                    SOS ALERT
                  </h2>
                  <p className="font-mono-data text-sm text-destructive mb-2">{detectedWord}</p>
                  <p className="font-rubik text-6xl font-bold text-destructive mb-6">{countdown}</p>
                  <p className="font-mono-data text-xs text-muted-foreground mb-6">
                    Sending SOS to emergency contacts...
                  </p>
                  <button
                    onClick={cancelSOS}
                    className="flex items-center gap-3 px-8 py-4 rounded-2xl border-2 border-destructive bg-destructive/10 text-destructive font-rubik font-semibold text-lg"
                  >
                    <X className="w-6 h-6" />
                    CANCEL
                  </button>
                </>
              ) : (
                <>
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Phone className="w-16 h-16 text-destructive mb-4" />
                  </motion.div>
                  <h2 className="font-rubik text-2xl font-bold text-foreground mb-2">
                    SOS SENT
                  </h2>
                  <p className="font-mono-data text-sm text-muted-foreground mb-2">
                    Emergency contacts notified
                  </p>
                  <p className="font-mono-data text-xs text-primary mb-6">
                    📍 Location: 28.6139°N, 77.2090°E
                  </p>
                  <button
                    onClick={cancelSOS}
                    className="px-6 py-3 rounded-xl border border-border bg-card text-foreground font-rubik text-sm"
                  >
                    Dismiss
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status badge */}
      <div className="text-center">
        <motion.div
          animate={{
            color: status === "listening" ? "hsl(180, 100%, 50%)" : status === "alert" || status === "sos" ? "hsl(0, 80%, 50%)" : "hsl(215, 15%, 55%)",
          }}
          className="font-mono-data text-xs tracking-[0.3em] uppercase mb-2"
        >
          {status === "idle" ? "STANDBY" : status === "listening" ? "● ACTIVE MONITORING" : "⚠ THREAT DETECTED"}
        </motion.div>
      </div>

      {/* Waveform visualization */}
      <div className="flex items-end justify-center gap-[3px] h-32 px-4">
        {Array.from({ length: bars }).map((_, i) => {
          const offset = Math.sin(Date.now() / 300 + i * 0.5);
          const height = isListening
            ? Math.max(4, (volumeLevel * 100 + offset * 15) * (0.5 + Math.random() * 0.5))
            : 4;
          return (
            <motion.div
              key={i}
              className="rounded-full"
              animate={{
                height: `${Math.min(height, 100)}%`,
                backgroundColor:
                  volumeLevel > DB_THRESHOLD
                    ? "hsl(0, 80%, 50%)"
                    : volumeLevel > 0.4
                    ? "hsl(45, 100%, 50%)"
                    : "hsl(180, 100%, 50%)",
              }}
              transition={{ duration: 0.08 }}
              style={{ width: "6px", minHeight: "4px" }}
            />
          );
        })}
      </div>

      {/* dB meter */}
      <div className="text-center">
        <p className="font-mono-data text-4xl font-bold text-foreground">
          {dbLevel}
          <span className="text-lg text-muted-foreground ml-1">dB</span>
        </p>
        <p className="font-mono-data text-[10px] text-muted-foreground tracking-widest mt-1">
          {dbLevel > 95 ? "⚠ DANGEROUS LEVEL" : dbLevel > 70 ? "ELEVATED" : "NORMAL"}
        </p>
      </div>

      {/* Mic toggle */}
      <div className="flex justify-center">
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={isListening ? stopListening : startListening}
          className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
            isListening
              ? "bg-primary/15 border-2 border-primary glow-cyan-strong"
              : "bg-card border-2 border-border"
          }`}
        >
          {isListening ? (
            <Mic className="w-8 h-8 text-primary" />
          ) : (
            <MicOff className="w-8 h-8 text-muted-foreground" />
          )}
        </motion.button>
      </div>
      <p className="text-center font-mono-data text-xs text-muted-foreground">
        {isListening ? "Tap to stop monitoring" : "Tap to start acoustic monitoring"}
      </p>

      {/* Detection keywords */}
      <div className="bg-card rounded-xl border border-border p-4">
        <p className="font-mono-data text-[10px] text-muted-foreground tracking-[0.2em] uppercase mb-3">
          Monitored Keywords
        </p>
        <div className="flex flex-wrap gap-2">
          {DISTRESS_KEYWORDS.map((kw) => (
            <span
              key={kw}
              className="px-3 py-1.5 rounded-lg bg-muted font-mono-data text-xs text-foreground/70 uppercase tracking-wider"
            >
              {kw}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
          <Volume2 className="w-4 h-4 text-muted-foreground" />
          <p className="font-mono-data text-[10px] text-muted-foreground">
            Scream detection: Volume peaks above {Math.round(DB_THRESHOLD * 120)}dB
          </p>
        </div>
      </div>
    </div>
  );
};

export default AcousticTab;
