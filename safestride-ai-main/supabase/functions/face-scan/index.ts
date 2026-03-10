import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Face scan simulation - in production this would use a face recognition API
    // For now, we simulate scanning across platforms
    const platforms = [
      "Social Platform A",
      "Social Platform B", 
      "Image Board C",
      "Stock Photo Site D",
      "Dating Platform E",
      "Professional Network F",
      "Forum G",
      "Blog Platform H",
      "Video Platform I",
      "Community J",
      "Marketplace K",
      "Review Site L",
    ];

    // Simulate processing time
    await new Promise((r) => setTimeout(r, 2000));

    const results = platforms.map((platform, i) => ({
      id: `fs-${i}`,
      platform,
      matchConfidence: Math.floor(Math.random() * 15),
      url: `https://example.com/${platform.toLowerCase().replace(/\s/g, "-")}`,
      status: "verified_safe" as const,
    }));

    // Occasionally flag one as suspicious
    if (Math.random() > 0.7) {
      results[Math.floor(Math.random() * results.length)] = {
        ...results[0],
        matchConfidence: 72,
        status: "flagged" as const,
      };
    }

    return new Response(
      JSON.stringify({
        success: true,
        results,
        platformsScanned: platforms.length,
        scanTime: "3.2s",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Face scan error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Face scan failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
