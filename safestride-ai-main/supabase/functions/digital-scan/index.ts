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
    const { email, type } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (type === "footprint" && LOVABLE_API_KEY) {
      // Use AI to generate realistic scan results
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: `You are a digital footprint scanner. Given an email address, generate realistic but fictional data leak findings. Return a JSON array of leak objects. Each object should have: id (string), source (string - website name), type (one of: email, phone, address, photo, social), severity (high/medium/low), detail (string describing what was found), removalStatus ("pending"), foundAt (ISO date string within last 7 days). Generate 1-4 results. Make them realistic - data broker sites, people finder sites, etc.`,
            },
            {
              role: "user",
              content: `Scan digital footprint for: ${email}`,
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "report_leaks",
                description: "Report discovered data leaks",
                parameters: {
                  type: "object",
                  properties: {
                    leaks: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          source: { type: "string" },
                          type: { type: "string", enum: ["email", "phone", "address", "photo", "social"] },
                          severity: { type: "string", enum: ["high", "medium", "low"] },
                          detail: { type: "string" },
                          removalStatus: { type: "string", enum: ["pending"] },
                          foundAt: { type: "string" },
                        },
                        required: ["id", "source", "type", "severity", "detail", "removalStatus", "foundAt"],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["leaks"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "report_leaks" } },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("AI gateway error:", response.status, errorText);

        if (response.status === 429) {
          return new Response(
            JSON.stringify({ error: "Rate limited, please try again later." }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        if (response.status === 402) {
          return new Response(
            JSON.stringify({ error: "AI credits exhausted." }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        throw new Error("AI gateway error");
      }

      const data = await response.json();
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

      if (toolCall?.function?.arguments) {
        const parsed = JSON.parse(toolCall.function.arguments);
        return new Response(
          JSON.stringify({ success: true, leaks: parsed.leaks }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Fallback: generate basic results without AI
    const leaks = [
      {
        id: `leak-${Date.now()}`,
        source: "people-search.net",
        type: "email",
        severity: "high",
        detail: `Email and associated accounts found for ${email}`,
        removalStatus: "pending",
        foundAt: new Date().toISOString(),
      },
    ];

    return new Response(
      JSON.stringify({ success: true, leaks }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Digital scan error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Scan failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
