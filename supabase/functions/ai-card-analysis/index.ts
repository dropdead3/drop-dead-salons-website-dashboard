import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ROUTE_MAP = `
INTERNAL ROUTE REFERENCE — ONLY use these exact routes. NEVER invent or guess a route.
- Sales Analytics: /dashboard/admin/analytics?tab=sales
- Operations Analytics: /dashboard/admin/analytics?tab=operations
- Marketing Analytics: /dashboard/admin/analytics?tab=marketing
- Reports: /dashboard/admin/analytics?tab=reports
- Leaderboard: /dashboard/leaderboard
- Client Directory: /dashboard/clients
- Payroll Hub: /dashboard/admin/payroll
- Team Overview: /dashboard/admin/team
- Schedule: /dashboard/schedule
- Management Hub: /dashboard/admin/management
- Settings: /dashboard/admin/settings
- Command Center: /dashboard
- My Stats: /dashboard/stats
- Inventory: /dashboard/inventory
- Renter Hub: /dashboard/admin/booth-renters
- Help Center: /dashboard/help
- Team Chat: /dashboard/team-chat
- Training: /dashboard/training
`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { cardName, metricData, dateRange, locationName } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const metricSummary = Object.entries(metricData || {})
      .map(([k, v]) => `- ${k}: ${v}`)
      .join("\n");

    const systemPrompt = `You are Zura, an AI analytics advisor for salon and beauty businesses. You explain metrics in plain, non-technical language suitable for salon owners, managers, and stylists.

When analyzing a card, you MUST:
1. Explain what this metric means in 1-2 sentences
2. Assess current performance (strong / average / needs attention)
3. Compare to typical salon industry benchmarks when applicable
4. Provide 1-2 specific, actionable next steps

Keep responses concise: 150-250 words max. Use markdown formatting (bold for emphasis, bullet points for recommendations).

CRITICAL: If you include any internal links, you MUST only use routes from this reference. Never invent routes.
${ROUTE_MAP}

Salon industry context:
- Average ticket: $80-150 depending on services
- Healthy rebook rate: 60-80%
- No-show rate should be under 5%
- Retail attachment rate goal: 30%+ of service transactions
- Staff utilization target: 75-85%
- Client retention rate target: 60-70%`;

    const userMessage = `Analyze this analytics card:

**Card:** ${cardName}
${dateRange ? `**Date Range:** ${dateRange}` : ""}
${locationName ? `**Location:** ${locationName}` : ""}

**Current Metrics:**
${metricSummary || "No specific metric data provided"}

Provide a brief, insightful analysis.`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage },
          ],
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds in workspace settings." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "AI analysis unavailable" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const insight = data.choices?.[0]?.message?.content || "Unable to generate analysis.";

    return new Response(JSON.stringify({ insight }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-card-analysis error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
