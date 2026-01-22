import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Phorest API base URLs for different regions
const PHOREST_BASE_URLS = [
  { name: "Global", url: "https://platform.phorest.com/third-party-api-server/api" },
  { name: "US", url: "https://platform-us.phorest.com/third-party-api-server/api" },
  { name: "EU", url: "https://api-gateway-eu.phorest.com/third-party-api-server/api" },
];

// Different endpoints to test connection - try staff first since business endpoint may not exist
const TEST_ENDPOINTS = [
  { path: "/staff", description: "staff list" },
  { path: "", description: "business info" },
  { path: "/branch", description: "branches" },
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

    let successfulConfig: { baseUrl: string; regionName: string; username: string } | null = null;
    let responseData: any = null;

    // Try each base URL, endpoint, and username combination
    outer: for (const region of PHOREST_BASE_URLS) {
      for (const endpoint of TEST_ENDPOINTS) {
        for (const usernameAttempt of usernamesToTry) {
          const basicAuth = btoa(`${usernameAttempt}:${password}`);
          const url = `${region.url}/business/${businessId}${endpoint.path}`;
          
          console.log(`Trying ${region.name} - ${endpoint.description}: ${url}`);
          
          try {
            const response = await fetch(url, {
              headers: {
                "Authorization": `Basic ${basicAuth}`,
                "Content-Type": "application/json",
                "Accept": "application/json",
              },
            });

            console.log(`Response: ${response.status}`);

            if (response.ok) {
              responseData = await response.json();
              successfulConfig = { 
                baseUrl: region.url, 
                regionName: region.name,
                username: usernameAttempt 
              };
              console.log(`SUCCESS with ${region.name} using ${endpoint.description}!`);
              break outer;
            } else {
              const errorText = await response.text();
              console.log(`${response.status}: ${errorText.substring(0, 100)}`);
            }
          } catch (e) {
            console.log(`Connection error:`, e);
          }
        }
      }
    }

    if (!successfulConfig) {
      return new Response(
        JSON.stringify({ 
          connected: false, 
          error: "Could not connect to Phorest with any endpoint. Please verify your credentials.",
          details: "Tried Global, US, and EU endpoints with multiple API paths.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // We already have staff data if that endpoint worked, otherwise fetch it
    let staffList: Array<{ id: string; name: string; email?: string }> = [];
    let staffCount = 0;
    
    // Check if responseData is staff list
    const rawStaff = responseData?._embedded?.staff || responseData?.staff || responseData?.data || 
                     (Array.isArray(responseData) ? responseData : null);
    
    if (rawStaff && Array.isArray(rawStaff)) {
      staffCount = rawStaff.length;
      staffList = rawStaff.map((s: any) => ({
        id: s.staffId || s.id,
        name: `${s.firstName || ''} ${s.lastName || ''}`.trim() || s.name || 'Unknown',
        email: s.email,
      }));
    } else {
      // Try to fetch staff separately
      try {
        const basicAuth = btoa(`${successfulConfig.username}:${password}`);
        const staffResponse = await fetch(`${successfulConfig.baseUrl}/business/${businessId}/staff`, {
          headers: {
            "Authorization": `Basic ${basicAuth}`,
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
        });
        
        if (staffResponse.ok) {
          const staffData = await staffResponse.json();
          const staffArray = staffData._embedded?.staff || staffData.staff || staffData.data || [];
          if (Array.isArray(staffArray)) {
            staffCount = staffArray.length;
            staffList = staffArray.map((s: any) => ({
              id: s.staffId || s.id,
              name: `${s.firstName || ''} ${s.lastName || ''}`.trim() || s.name || 'Unknown',
              email: s.email,
            }));
          }
        }
      } catch (e) {
        console.log("Could not fetch staff:", e);
      }
    }

    return new Response(
      JSON.stringify({ 
        connected: true,
        business: {
          name: responseData?.name || responseData?.businessName || "Drop Dead Hair Studios",
          id: businessId,
        },
        region: successfulConfig.regionName,
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