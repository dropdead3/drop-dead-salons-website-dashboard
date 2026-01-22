import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PHOREST_BASE_URL = "https://api-gateway-eu.phorest.com/third-party-api-server/api";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const businessId = Deno.env.get("PHOREST_BUSINESS_ID");
    const apiKey = Deno.env.get("PHOREST_API_KEY");

    if (!businessId || !apiKey) {
      return new Response(
        JSON.stringify({ 
          connected: false, 
          error: "Phorest API credentials not configured",
          details: {
            has_business_id: !!businessId,
            has_api_key: !!apiKey,
          }
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Test connection by fetching business info
    const response = await fetch(`${PHOREST_BASE_URL}/business/${businessId}`, {
      headers: {
        "Authorization": `Basic ${btoa(`${businessId}:${apiKey}`)}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Phorest connection test failed (${response.status}):`, errorText);
      
      return new Response(
        JSON.stringify({ 
          connected: false, 
          error: `Connection failed: ${response.status}`,
          details: errorText,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const businessData = await response.json();

    // Also try to fetch staff count
    let staffCount = 0;
    try {
      const staffResponse = await fetch(`${PHOREST_BASE_URL}/business/${businessId}/staff`, {
        headers: {
          "Authorization": `Basic ${btoa(`${businessId}:${apiKey}`)}`,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
      });
      
      if (staffResponse.ok) {
        const staffData = await staffResponse.json();
        staffCount = staffData._embedded?.staff?.length || staffData.staff?.length || 0;
      }
    } catch (e) {
      console.log("Could not fetch staff count:", e);
    }

    return new Response(
      JSON.stringify({ 
        connected: true,
        business: {
          name: businessData.name || businessData.businessName,
          id: businessId,
        },
        staff_count: staffCount,
        api_version: "v1",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error testing Phorest connection:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ connected: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});