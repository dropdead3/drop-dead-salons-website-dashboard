import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Phorest uses different regional gateways and API versions
const PHOREST_ENDPOINTS = [
  // Try v3 API first (from their docs URL)
  { name: "Global-v3", baseUrl: "https://platform.phorest.com/third-party-api-server/api/business" },
  { name: "US-v3", baseUrl: "https://platform-us.phorest.com/third-party-api-server/api/business" },
  { name: "EU-v3", baseUrl: "https://api-gateway-eu.phorest.com/third-party-api-server/api/business" },
  // Try alternative path structure
  { name: "Global-alt", baseUrl: "https://platform.phorest.com/api/business" },
  { name: "US-alt", baseUrl: "https://platform-us.phorest.com/api/business" },
];

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const businessId = Deno.env.get("PHOREST_BUSINESS_ID");
    const username = Deno.env.get("PHOREST_USERNAME");
    const password = Deno.env.get("PHOREST_API_KEY");

    if (!businessId || !username || !password) {
      return new Response(
        JSON.stringify({ 
          connected: false, 
          error: "Phorest API credentials not configured",
          details: {
            has_business_id: !!businessId,
            has_username: !!username,
            has_password: !!password,
          }
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Try username with and without global/ prefix
    const usernamesToTry = [
      username,
      username.startsWith('global/') ? username : `global/${username}`,
    ];

    let successfulEndpoint: { name: string; baseUrl: string } | null = null;
    let businessData = null;

    // Try each endpoint and username combination
    for (const endpoint of PHOREST_ENDPOINTS) {
      for (const usernameAttempt of usernamesToTry) {
        const basicAuth = btoa(`${usernameAttempt}:${password}`);
        
        try {
          // Try direct business ID path
          const url = `${endpoint.baseUrl}/${businessId}`;
          console.log(`Trying: ${url}`);
          
          const response = await fetch(url, {
            headers: {
              "Authorization": `Basic ${basicAuth}`,
              "Content-Type": "application/json",
              "Accept": "application/json",
            },
          });

          if (response.ok) {
            businessData = await response.json();
            successfulEndpoint = endpoint;
            console.log(`Success with ${endpoint.name} and username ${usernameAttempt}`);
            break;
          } else {
            const errorText = await response.text();
            console.log(`${endpoint.name} with ${usernameAttempt}: ${response.status} - ${errorText.substring(0, 150)}`);
          }
        } catch (e) {
          console.log(`${endpoint.name} connection error:`, e);
        }
      }
      if (successfulEndpoint) break;
    }

    if (!successfulEndpoint || !businessData) {
      return new Response(
        JSON.stringify({ 
          connected: false, 
          error: "Could not connect to Phorest with any endpoint. Please verify your credentials.",
          details: "Tried multiple API endpoints and username variations.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch full staff list using successful endpoint
    let staffCount = 0;
    let staffList: Array<{ id: string; name: string; email?: string }> = [];
    try {
      const workingUsername = username.startsWith('global/') ? username : `global/${username}`;
      const basicAuth = btoa(`${workingUsername}:${password}`);
      
      const staffResponse = await fetch(`${successfulEndpoint.baseUrl}/${businessId}/staff`, {
        headers: {
          "Authorization": `Basic ${basicAuth}`,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
      });
      
      if (staffResponse.ok) {
        const staffData = await staffResponse.json();
        const rawStaff = staffData._embedded?.staff || staffData.staff || staffData.data || [];
        staffCount = Array.isArray(rawStaff) ? rawStaff.length : 0;
        
        // Map to simplified structure
        if (Array.isArray(rawStaff)) {
          staffList = rawStaff.map((s: any) => ({
            id: s.staffId || s.id,
            name: `${s.firstName || ''} ${s.lastName || ''}`.trim() || s.name || 'Unknown',
            email: s.email,
          }));
        }
      } else {
        const staffError = await staffResponse.text();
        console.log(`Staff fetch failed: ${staffResponse.status} - ${staffError.substring(0, 100)}`);
      }
    } catch (e) {
      console.log("Could not fetch staff list:", e);
    }

    return new Response(
      JSON.stringify({ 
        connected: true,
        business: {
          name: businessData.name || businessData.businessName || businessData.companyName,
          id: businessId,
        },
        endpoint: successfulEndpoint.name,
        staff_count: staffCount,
        staff_list: staffList,
        api_version: "v3",
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