import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are a friendly, helpful product consultant for Drop Dead Salon Software—a comprehensive salon management platform. Your role is to understand potential customers' challenges and show them exactly how our software solves their problems.

When users describe their challenges:
1. Acknowledge their specific pain point empathetically
2. Explain how our software solves this exact problem
3. Use the search_features tool to find relevant features
4. Present the top solution prominently with supporting context

Communication style:
- Be conversational and warm, not salesy or robotic
- Focus on genuine problem-solving
- Use "we" and "our" when referring to the software
- Keep responses concise but informative
- Highlight specific capabilities that address their exact concerns

If a user asks a general question like "what can you do?" or "tell me about your software", provide a brief overview and ask what specific challenges they're facing to give personalized recommendations.

Key product areas include:
- Scheduling & Appointments
- Team Management
- Payroll & Commissions  
- Client Management
- Analytics & Reporting
- Communication (Team Chat, Announcements)
- Training & Development
- Booth Renter Management`;

const tools = [
  {
    type: "function",
    function: {
      name: "search_features",
      description: "Search for product features that solve the user's described problem. Call this to find relevant features based on keywords and category.",
      parameters: {
        type: "object",
        properties: {
          keywords: {
            type: "array",
            items: { type: "string" },
            description: "Keywords extracted from the user's problem description (e.g., ['commission', 'pay', 'calculate'])"
          },
          category: {
            type: "string",
            description: "Optional category hint: scheduling, team, payroll, clients, analytics, communication, training, admin"
          }
        },
        required: ["keywords"]
      }
    }
  }
];

async function searchFeatures(supabase: any, keywords: string[], category?: string) {
  // Build query with keyword matching
  let query = supabase
    .from("product_features")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (category) {
    query = query.eq("category", category);
  }

  const { data: features, error } = await query;

  if (error) {
    console.error("Error fetching features:", error);
    return [];
  }

  // Score features based on keyword matches
  const scoredFeatures = features.map((feature: any) => {
    let score = 0;
    const lowerKeywords = keywords.map(k => k.toLowerCase());
    
    // Check problem_keywords array
    feature.problem_keywords?.forEach((pk: string) => {
      if (lowerKeywords.some(k => pk.toLowerCase().includes(k) || k.includes(pk.toLowerCase()))) {
        score += 3;
      }
    });

    // Check name and tagline
    lowerKeywords.forEach(keyword => {
      if (feature.name?.toLowerCase().includes(keyword)) score += 2;
      if (feature.tagline?.toLowerCase().includes(keyword)) score += 1;
      if (feature.description?.toLowerCase().includes(keyword)) score += 1;
    });

    return { ...feature, matchScore: score };
  });

  // Sort by score and return top matches
  return scoredFeatures
    .filter((f: any) => f.matchScore > 0)
    .sort((a: any, b: any) => b.matchScore - a.matchScore)
    .slice(0, 3);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);

    // First call to AI with tool definition
    const initialResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        tools,
        tool_choice: "auto",
      }),
    });

    if (!initialResponse.ok) {
      if (initialResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (initialResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI usage limit reached. Please contact support." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await initialResponse.text();
      console.error("AI gateway error:", initialResponse.status, errorText);
      throw new Error("AI service temporarily unavailable");
    }

    const initialData = await initialResponse.json();
    const assistantMessage = initialData.choices?.[0]?.message;

    // Check if there's a tool call
    if (assistantMessage?.tool_calls?.length > 0) {
      const toolCall = assistantMessage.tool_calls[0];
      
      if (toolCall.function?.name === "search_features") {
        const args = JSON.parse(toolCall.function.arguments || "{}");
        const features = await searchFeatures(supabase, args.keywords || [], args.category);

        // Make second call with tool result
        const followUpMessages = [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
          assistantMessage,
          {
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(features),
          },
        ];

        const followUpResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: followUpMessages,
            stream: true,
          }),
        });

        if (!followUpResponse.ok) {
          throw new Error("Failed to get follow-up response");
        }

        // Return streaming response along with features metadata
        const encoder = new TextEncoder();
        const featuresEvent = `data: ${JSON.stringify({ type: "features", features })}\n\n`;
        
        const transformStream = new TransformStream({
          start(controller) {
            controller.enqueue(encoder.encode(featuresEvent));
          },
          transform(chunk, controller) {
            controller.enqueue(chunk);
          },
        });

        return new Response(
          followUpResponse.body?.pipeThrough(transformStream),
          { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } }
        );
      }
    }

    // No tool call - stream response directly
    const streamResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!streamResponse.ok) {
      throw new Error("Failed to stream response");
    }

    return new Response(streamResponse.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });

  } catch (e) {
    console.error("Demo assistant error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
