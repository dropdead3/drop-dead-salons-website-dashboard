import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PHOREST_BASE_URL = "https://platform.phorest.com/third-party-api-server/api";

interface UpdateRequest {
  appointment_id: string;
  status?: 'CONFIRMED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  notes?: string;
  rebooked_at_checkout?: boolean;
}

// Map our local status names to Phorest status names
const statusToPhorest: Record<string, string> = {
  'confirmed': 'CONFIRMED',
  'checked_in': 'CHECKED_IN',
  'completed': 'COMPLETED',
  'cancelled': 'CANCELLED',
  'no_show': 'NO_SHOW',
};

// Map Phorest status names to our local status names
const statusFromPhorest: Record<string, string> = {
  'CONFIRMED': 'confirmed',
  'CHECKED_IN': 'checked_in',
  'COMPLETED': 'completed',
  'CANCELLED': 'cancelled',
  'NO_SHOW': 'no_show',
};

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
  }

  const response = await fetch(url, options);
  const responseText = await response.text();

  if (!response.ok) {
    console.error(`Phorest API error (${response.status}):`, responseText);
    throw new Error(`Phorest API error: ${response.status} - ${responseText}`);
  }

  return responseText ? JSON.parse(responseText) : {};
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

    const updateData: UpdateRequest = await req.json();
    const { appointment_id, status, notes, rebooked_at_checkout } = updateData;

    if (!appointment_id) {
      throw new Error("Missing required field: appointment_id");
    }

    if (!status && notes === undefined && rebooked_at_checkout === undefined) {
      throw new Error("At least one of status, notes, or rebooked_at_checkout must be provided");
    }

    console.log(`Updating appointment ${appointment_id}: status=${status}, notes=${notes ? 'yes' : 'no'}`);

    // Build update body for Phorest
    const updateBody: Record<string, any> = {};
    
    if (status) {
      // Convert local status to Phorest status if needed
      updateBody.status = statusToPhorest[status.toLowerCase()] || status;
    }
    
    if (notes !== undefined) {
      updateBody.notes = notes;
    }

    // Update in Phorest
    try {
      await phorestRequest(
        `/appointment/${appointment_id}`,
        businessId,
        username,
        password,
        "PUT",
        updateBody
      );
      console.log("Appointment updated in Phorest");
    } catch (e: any) {
      console.error("Failed to update in Phorest:", e.message);
      // Continue to update local record even if Phorest fails
      // This allows for offline-first behavior
    }

    // Update local record
    const localUpdate: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (status) {
      localUpdate.status = statusFromPhorest[status] || status.toLowerCase();
    }
    
    if (notes !== undefined) {
      localUpdate.notes = notes;
    }

    if (rebooked_at_checkout !== undefined) {
      localUpdate.rebooked_at_checkout = rebooked_at_checkout;
    }

    const { error: updateError, data: updatedAppointment } = await supabase
      .from("phorest_appointments")
      .update(localUpdate)
      .eq("phorest_id", appointment_id)
      .select()
      .single();

    if (updateError) {
      console.error("Failed to update local record:", updateError);
      throw new Error("Failed to update appointment locally");
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Appointment updated successfully",
        appointment: updatedAppointment,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Appointment update error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
