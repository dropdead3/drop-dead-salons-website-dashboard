import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Phorest uses different regional gateways
const PHOREST_REGIONS = [
  { name: "US", url: "https://platform-us.phorest.com/third-party-api-server/api" },
  { name: "EU", url: "https://api-gateway-eu.phorest.com/third-party-api-server/api" },
  { name: "Global", url: "https://platform.phorest.com/third-party-api-server/api" },
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

    let successfulRegion = null;
    let businessData = null;

    // Try each region and username combination
    for (const region of PHOREST_REGIONS) {
      for (const usernameAttempt of usernamesToTry) {
        const basicAuth = btoa(`${usernameAttempt}:${password}`);
        
        try {
          const response = await fetch(`${region.url}/business/${businessId}`, {
            headers: {
              "Authorization": `Basic ${basicAuth}`,
              "Content-Type": "application/json",
              "Accept": "application/json",
            },
          });

          if (response.ok) {
            businessData = await response.json();
            successfulRegion = region;
            console.log(`Success with region ${region.name} and username ${usernameAttempt}`);
            break;
          } else {
            const errorText = await response.text();
            console.log(`${region.name} with ${usernameAttempt}: ${response.status} - ${errorText.substring(0, 100)}`);
          }
        } catch (e) {
          console.log(`${region.name} connection error:`, e);
        }
      }
      if (successfulRegion) break;
    }

    if (!successfulRegion || !businessData) {
      return new Response(
        JSON.stringify({ 
          connected: false, 
          error: "Could not connect to Phorest with any region. Please verify your credentials.",
          details: "Tried US, EU, and Global endpoints with username variations.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch full staff list using successful region
    let staffCount = 0;
    let staffList: Array<{ id: string; name: string; email?: string }> = [];
    try {
      const workingUsername = username.startsWith('global/') ? username : `global/${username}`;
      const basicAuth = btoa(`${workingUsername}:${password}`);
      
      const staffResponse = await fetch(`${successfulRegion.url}/business/${businessId}/staff`, {
        headers: {
          "Authorization": `Basic ${basicAuth}`,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
      });
      
      if (staffResponse.ok) {
        const staffData = await staffResponse.json();
        const rawStaff = staffData._embedded?.staff || staffData.staff || [];
        staffCount = rawStaff.length;
        
        // Map to simplified structure
        staffList = rawStaff.map((s: any) => ({
          id: s.staffId || s.id,
          name: `${s.firstName || ''} ${s.lastName || ''}`.trim() || s.name || 'Unknown',
          email: s.email,
        }));
      }
    } catch (e) {
      console.log("Could not fetch staff list:", e);
    }

    return new Response(
      JSON.stringify({ 
        connected: true,
        business: {
          name: businessData.name || businessData.businessName,
          id: businessId,
        },
        region: successfulRegion.name,
        staff_count: staffCount,
        staff_list: staffList,
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