import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PHOREST_BASE_URL = "https://api-gateway-eu.phorest.com/third-party-api-server/api";

interface CreateClientRequest {
  branch_id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  notes?: string;
}

async function phorestRequest(
  endpoint: string, 
  businessId: string, 
  username: string, 
  password: string,
  method: string = "GET",
  body?: any
) {
  const formattedUsername = username.startsWith('global/') ? username : `global/${username}`;
  const basicAuth = btoa(`${formattedUsername}:${password}`);
  
  const url = `${PHOREST_BASE_URL}/business/${businessId}${endpoint}`;
  console.log(`Phorest ${method} request: ${url}`);
  
  const options: RequestInit = {
    method,
    headers: {
      "Authorization": `Basic ${basicAuth}`,
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
    console.log("Request body:", JSON.stringify(body, null, 2));
  }

  const response = await fetch(url, options);
  const responseText = await response.text();

  if (!response.ok) {
    console.error(`Phorest API error (${response.status}):`, responseText);
    
    try {
      const errorJson = JSON.parse(responseText);
      const errorCode = errorJson.errorCode || errorJson.code;
      
      if (errorCode === 'CLIENT_ALREADY_EXISTS' || errorCode === 'DUPLICATE_CLIENT') {
        throw new Error('A client with this email or phone already exists.');
      } else if (errorCode === 'INVALID_PHONE_NUMBER') {
        throw new Error('The phone number format is invalid.');
      } else if (errorCode === 'INVALID_EMAIL') {
        throw new Error('The email format is invalid.');
      }
      
      throw new Error(errorJson.message || `Phorest API error: ${response.status}`);
    } catch (e: any) {
      if (e.message.includes('already exists') || e.message.includes('invalid')) {
        throw e;
      }
      throw new Error(`Phorest API error: ${response.status} - ${responseText}`);
    }
  }

  return responseText ? JSON.parse(responseText) : {};
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get credentials from environment
    const phorestUsername = Deno.env.get("PHOREST_USERNAME");
    const phorestPassword = Deno.env.get("PHOREST_PASSWORD");
    const phorestBusinessId = Deno.env.get("PHOREST_BUSINESS_ID");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!phorestUsername || !phorestPassword || !phorestBusinessId) {
      throw new Error("Missing Phorest API credentials");
    }

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase credentials");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const body: CreateClientRequest = await req.json();
    
    const { branch_id, first_name, last_name, email, phone, notes } = body;

    if (!branch_id || !first_name || !last_name) {
      throw new Error("branch_id, first_name, and last_name are required");
    }

    // Require at least email or phone
    if (!email && !phone) {
      throw new Error("Either email or phone is required");
    }

    console.log(`Creating client: ${first_name} ${last_name} at branch ${branch_id}`);

    // Build the Phorest client object
    const phorestClient: Record<string, any> = {
      firstName: first_name,
      lastName: last_name,
    };

    if (email) {
      phorestClient.email = email;
    }

    if (phone) {
      // Clean phone number - remove non-numeric except + at start
      const cleanedPhone = phone.replace(/[^\d+]/g, '').replace(/^\+?/, '+1');
      phorestClient.mobile = cleanedPhone;
    }

    if (notes) {
      phorestClient.notes = notes;
    }

    // Create client in Phorest
    const phorestResponse = await phorestRequest(
      `/branch/${branch_id}/client`,
      phorestBusinessId,
      phorestUsername,
      phorestPassword,
      "POST",
      phorestClient
    );

    console.log("Phorest response:", JSON.stringify(phorestResponse, null, 2));

    const phorestClientId = phorestResponse.clientId || phorestResponse.id;
    
    if (!phorestClientId) {
      throw new Error("Failed to get client ID from Phorest response");
    }

    // Get the location for this branch
    const { data: location } = await supabase
      .from("locations")
      .select("id, name")
      .eq("phorest_branch_id", branch_id)
      .single();

    // Create local record in phorest_clients table
    const clientRecord = {
      phorest_client_id: phorestClientId,
      name: `${first_name} ${last_name}`,
      email: email || null,
      phone: phone || null,
      notes: notes || null,
      phorest_branch_id: branch_id,
      branch_name: location?.name || null,
      location_id: location?.id || null,
      visit_count: 0,
      total_spend: 0,
    };

    const { data: insertedClient, error: insertError } = await supabase
      .from("phorest_clients")
      .insert(clientRecord)
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting client locally:", insertError);
      // Don't fail - client was created in Phorest
    }

    return new Response(
      JSON.stringify({
        success: true,
        client: {
          id: insertedClient?.id || null,
          phorest_client_id: phorestClientId,
          name: `${first_name} ${last_name}`,
          email,
          phone,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error creating client:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
