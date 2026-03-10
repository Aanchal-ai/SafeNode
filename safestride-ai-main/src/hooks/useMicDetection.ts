import { useState, useRef, useCallback, useEffect } from "react";

export type MicStatus = "idle" | "listening" | "alert" | "emergency";

interface UseMicDetectionReturn {
  status: MicStatus;
  isListening: boolean;
  volumeLevel: number;
  lastDetectedWord: string | null;
  startListening: () => Promise<void>;
  stopListening: () => void;
  dismissAlert: () => void;
  emergencyTriggered: boolean;
  cancelEmergency: () => void;
}

const DISTRESS_KEYWORDS = ["help", "stop", "no", "please", "emergency", "fire", "danger", "police"];
const VOLUME_THRESHOLD = 0.6; // High volume threshold for scream detection
const SUSTAINED_LOUD_FRAMES = 8; // Frames of sustained loud volume to trigger alert

export function useMicDetection(): UseMicDetectionReturn {
  const [status, setStatus] = useState<MicStatus>("idle");
  const [isListening, setIsListening] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [lastDetectedWord, setLastDetectedWord] = useState<string | null>(null);
  const [emergencyTriggered, setEmergencyTriggered] = useState(false);

  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const animFrameRef = useRef<number>(0);
  const recognitionRef = useRef<any>(null);
  const loudFrameCountRef = useRef(0);
  const emergencyTimerRef = useRef<number>(0);

  const dismissAlert = useCallback(() => {
    setStatus("listening");
    setLastDetectedWord(null);
    loudFrameCountRef.current = 0;
  }, []);

  const cancelEmergency = useCallback(() => {
    if (emergencyTimerRef.current) {
      clearTimeout(emergencyTimerRef.current);
      emergencyTimerRef.current = 0;
    }
    setEmergencyTriggered(false);
    setStatus("listening");
    setLastDetectedWord(null);
  }, []);

  const triggerAlert = useCallback((reason: string) => {
    setStatus("alert");
    setLastDetectedWord(reason);

    // Auto-escalate to emergency after 10 seconds if not dismissed
    emergencyTimerRef.current = window.setTimeout(() => {
      setStatus("emergency");
      setEmergencyTriggered(true);
    }, 10000);
  }, []);

  const analyzeVolume = useCallback(() => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Calculate RMS volume
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += (dataArray[i] / 255) ** 2;
    }
    const rms = Math.sqrt(sum / dataArray.length);
    setVolumeLevel(rms);

    // Scream detection: sustained high volume
    if (rms > VOLUME_THRESHOLD) {
      loudFrameCountRef.current++;
      if (loudFrameCountRef.current >= SUSTAINED_LOUD_FRAMES && status === "listening") {
        triggerAlert("Loud sound detected");
      }
    } else {
      loudFrameCountRef.current = Math.max(0, loudFrameCountRef.current - 1);
    }

    if (status !== "emergency") {
      animFrameRef.current = requestAnimationFrame(analyzeVolume);
    }
  }, [status, triggerAlert]);

  const startListening = useCallback(async () => {
    try {
      // Get microphone access - MUST be called directly in click handler
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });

      streamRef.current = stream;

      // Set up Web Audio API for volume analysis
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      analyserRef.current = analyser;

      setIsListening(true);
      setStatus("listening");

      // Start volume analysis
      animFrameRef.current = requestAnimationFrame(analyzeVolume);

      // Set up Speech Recognition for keyword detection
      const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognitionAPI) {
        const recognition = new SpeechRecognitionAPI();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onresult = (event: any) => {
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript.toLowerCase().trim();
            const words = transcript.split(/\s+/);

            for (const word of words) {
              if (DISTRESS_KEYWORDS.includes(word)) {
                triggerAlert(`"${word}" detected`);
                break;
              }
            }
          }
        };

        recognition.onerror = (event: any) => {
          console.warn("Speech recognition error:", event.error);
          if (event.error === "no-speech" || event.error === "aborted") {
            // Restart recognition
            try {
              recognition.start();
            } catch {
              // Already running
            }
          }
        };

        recognition.onend = () => {
          // Auto-restart if still listening
          if (isListening && status !== "emergency") {
            try {
              recognition.start();
            } catch {
              // Already running
            }
          }
        };

        recognition.start();
        recognitionRef.current = recognition;
      }
    } catch (error) {
      if (error instanceof Error && error.name === "NotAllowedError") {
        console.error("Microphone access denied");
      } else {
        console.error("Failed to start microphone:", error);
      }
      setStatus("idle");
      setIsListening(false);
    }
  }, [analyzeVolume, triggerAlert, isListening, status]);

  const stopListening = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (emergencyTimerRef.current) {
      clearTimeout(emergencyTimerRef.current);
    }

    setIsListening(false);
    setStatus("idle");
    setVolumeLevel(0);
    setLastDetectedWord(null);
    setEmergencyTriggered(false);
    loudFrameCountRef.current = 0;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  return {
    status,
    isListening,
    volumeLevel,
    lastDetectedWord,
    startListening,
    stopListening,
    dismissAlert,
    emergencyTriggered,
    cancelEmergency,
  };
}
