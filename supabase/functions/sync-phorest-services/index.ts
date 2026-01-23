import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PHOREST_BASE_URL = "https://platform.phorest.com/third-party-api-server/api";

async function phorestRequest(endpoint: string, businessId: string, username: string, password: string) {
  const formattedUsername = username.startsWith('global/') ? username : `global/${username}`;
  const basicAuth = btoa(`${formattedUsername}:${password}`);
  
  const url = `${PHOREST_BASE_URL}/business/${businessId}${endpoint}`;
  console.log(`Phorest request: ${url}`);
  
  const response = await fetch(url, {
    headers: {
      "Authorization": `Basic ${basicAuth}`,
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Phorest API error (${response.status}):`, errorText);
    throw new Error(`Phorest API error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const businessId = Deno.env.get("PHOREST_BUSINESS_ID");
    const username = Deno.env.get("PHOREST_USERNAME");
    const password = Deno.env.get("PHOREST_API_KEY");

    if (!businessId || !username || !password) {
      throw new Error("Missing Phorest credentials");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Syncing services from Phorest...");

    // Get all branches
    const branchData = await phorestRequest("/branch", businessId, username, password);
    const branches = branchData._embedded?.branches || branchData.branches || [];
    console.log(`Found ${branches.length} branches`);

    let totalServices = 0;
    let syncedServices = 0;

    for (const branch of branches) {
      const branchId = branch.branchId || branch.id;
      console.log(`Fetching services for branch: ${branch.name} (${branchId})`);

      try {
        // Fetch services for this branch
        const servicesData = await phorestRequest(
          `/branch/${branchId}/service?size=500`,
          businessId,
          username,
          password
        );
        
        const services = servicesData._embedded?.services || servicesData.services || 
                        servicesData.page?.content || [];
        
        console.log(`Found ${services.length} services in branch ${branch.name}`);
        totalServices += services.length;

        for (const service of services) {
          const serviceId = service.serviceId || service.id;
          
          const serviceRecord = {
            phorest_service_id: serviceId,
            phorest_branch_id: branchId,
            name: service.name || 'Unknown Service',
            category: service.category || service.categoryName || null,
            duration_minutes: service.durationMins || service.duration || 60,
            price: service.price || service.defaultPrice || null,
            requires_qualification: service.requiresQualification || false,
            is_active: service.active !== false,
          };

          const { error } = await supabase
            .from("phorest_services")
            .upsert(serviceRecord, { 
              onConflict: 'phorest_service_id',
              ignoreDuplicates: false 
            });

          if (!error) {
            syncedServices++;
          } else {
            console.log(`Failed to upsert service ${serviceId}:`, error.message);
          }
        }
      } catch (e: any) {
        console.log(`Failed to fetch services for branch ${branchId}:`, e.message);
      }
    }

    console.log(`Services sync complete: ${syncedServices}/${totalServices}`);

    return new Response(
      JSON.stringify({
        success: true,
        total: totalServices,
        synced: syncedServices,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Services sync error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
