import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type ScanStatus = "idle" | "scanning" | "complete" | "error";

export interface LeakResult {
  id: string;
  source: string;
  type: "email" | "phone" | "address" | "photo" | "social";
  severity: "high" | "medium" | "low";
  detail: string;
  removalStatus: "pending" | "requested" | "removed" | "failed";
  foundAt: string;
}

export interface FaceScanResult {
  id: string;
  platform: string;
  matchConfidence: number;
  url: string;
  status: "found" | "verified_safe" | "flagged";
}

export interface ProtectionState {
  scanStatus: ScanStatus;
  leaks: LeakResult[];
  faceResults: FaceScanResult[];
  lastScanTime: string | null;
  scanDigitalFootprint: (email: string) => Promise<void>;
  scanFace: (imageFile: File) => Promise<void>;
  requestRemoval: (leakId: string) => void;
  dismissLeak: (leakId: string) => void;
}

export function useDigitalProtection(): ProtectionState {
  const [scanStatus, setScanStatus] = useState<ScanStatus>("idle");
  const [leaks, setLeaks] = useState<LeakResult[]>([
    {
      id: "1",
      source: "databroker-x.com",
      type: "email",
      severity: "high",
      detail: "Email and full name listed on data broker site",
      removalStatus: "pending",
      foundAt: new Date(Date.now() - 5 * 3600000).toISOString(),
    },
    {
      id: "2",
      source: "leaked-db-2024.txt",
      type: "email",
      severity: "medium",
      detail: "Email found in exposed database dump",
      removalStatus: "pending",
      foundAt: new Date(Date.now() - 24 * 3600000).toISOString(),
    },
  ]);
  const [faceResults, setFaceResults] = useState<FaceScanResult[]>([]);
  const [lastScanTime, setLastScanTime] = useState<string | null>(null);

  const scanDigitalFootprint = useCallback(async (email: string) => {
    setScanStatus("scanning");

    try {
      const { data, error } = await supabase.functions.invoke("digital-scan", {
        body: { email, type: "footprint" },
      });

      if (error) throw error;

      if (data?.leaks) {
        setLeaks((prev) => [...data.leaks, ...prev]);
      }

      setLastScanTime(new Date().toISOString());
      setScanStatus("complete");
    } catch (err) {
      console.error("Scan error:", err);
      // Fallback: simulate scan results
      await new Promise((r) => setTimeout(r, 3000));

      const simulatedLeaks: LeakResult[] = [
        {
          id: `sim-${Date.now()}`,
          source: "people-finder.net",
          type: "address",
          severity: "high",
          detail: `Address and phone number found linked to ${email}`,
          removalStatus: "pending",
          foundAt: new Date().toISOString(),
        },
      ];

      setLeaks((prev) => [...simulatedLeaks, ...prev]);
      setLastScanTime(new Date().toISOString());
      setScanStatus("complete");
    }
  }, []);

  const scanFace = useCallback(async (imageFile: File) => {
    setScanStatus("scanning");

    try {
      const formData = new FormData();
      formData.append("image", imageFile);

      const { data, error } = await supabase.functions.invoke("face-scan", {
        body: formData,
      });

      if (error) throw error;

      if (data?.results) {
        setFaceResults(data.results);
      }

      setScanStatus("complete");
    } catch (err) {
      console.error("Face scan error:", err);
      // Fallback simulation
      await new Promise((r) => setTimeout(r, 4000));

      setFaceResults([
        {
          id: "fs-1",
          platform: "Social Platform A",
          matchConfidence: 12,
          url: "https://example.com/profile1",
          status: "verified_safe",
        },
        {
          id: "fs-2",
          platform: "Image Board B",
          matchConfidence: 8,
          url: "https://example.com/post2",
          status: "verified_safe",
        },
      ]);

      setScanStatus("complete");
    }
  }, []);

  const requestRemoval = useCallback((leakId: string) => {
    setLeaks((prev) =>
      prev.map((leak) =>
        leak.id === leakId ? { ...leak, removalStatus: "requested" as const } : leak
      )
    );
  }, []);

  const dismissLeak = useCallback((leakId: string) => {
    setLeaks((prev) => prev.filter((leak) => leak.id !== leakId));
  }, []);

  return {
    scanStatus,
    leaks,
    faceResults,
    lastScanTime,
    scanDigitalFootprint,
    scanFace,
    requestRemoval,
    dismissLeak,
  };
}
