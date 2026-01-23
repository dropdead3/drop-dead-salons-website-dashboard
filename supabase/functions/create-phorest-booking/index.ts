import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PHOREST_BASE_URL = "https://platform.phorest.com/third-party-api-server/api";

interface BookingRequest {
  branch_id: string;
  client_id: string;
  staff_id: string;
  service_ids: string[];
  start_time: string; // ISO 8601 format: 2024-01-15T09:00:00Z
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
  }

  const response = await fetch(url, options);
  const responseText = await response.text();

  if (!response.ok) {
    console.error(`Phorest API error (${response.status}):`, responseText);
    
    // Parse error for better messaging
    try {
      const errorJson = JSON.parse(responseText);
      const errorCode = errorJson.errorCode || errorJson.code;
      
      if (errorCode === 'STAFF_DOUBLE_BOOKED') {
        throw new Error('This time slot is already booked for the selected stylist.');
      } else if (errorCode === 'STAFF_UNQUALIFIED') {
        throw new Error('The selected stylist is not qualified to perform this service.');
      } else if (errorCode === 'CLIENT_ALREADY_BOOKED') {
        throw new Error('This client already has an appointment at this time.');
      } else if (errorCode === 'BRANCH_CLOSED') {
        throw new Error('The salon is closed at the requested time.');
      }
      
      throw new Error(errorJson.message || `Phorest API error: ${response.status}`);
    } catch (e: any) {
      if (e.message.includes('already booked') || e.message.includes('qualified')) {
        throw e;
      }
      throw new Error(`Phorest API error: ${response.status} - ${responseText}`);
    }
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

    const bookingData: BookingRequest = await req.json();
    const { branch_id, client_id, staff_id, service_ids, start_time, notes } = bookingData;

    if (!branch_id || !client_id || !staff_id || !service_ids?.length || !start_time) {
      throw new Error("Missing required fields: branch_id, client_id, staff_id, service_ids, start_time");
    }

    console.log(`Creating booking for client ${client_id} with staff ${staff_id} at ${start_time}`);

    // Build the booking request body
    const phorestBooking = {
      clientId: client_id,
      staffId: staff_id,
      startTime: start_time,
      services: service_ids.map(id => ({ serviceId: id })),
      notes: notes || undefined,
      status: 'CONFIRMED',
    };

    // Create booking in Phorest
    const response = await phorestRequest(
      `/branch/${branch_id}/appointment`,
      businessId,
      username,
      password,
      "POST",
      phorestBooking
    );

    console.log("Booking created in Phorest:", response);

    // Get service details for local record
    const { data: services } = await supabase
      .from("phorest_services")
      .select("name, duration_minutes, price")
      .in("phorest_service_id", service_ids);

    const totalDuration = services?.reduce((sum, s) => sum + (s.duration_minutes || 60), 0) || 60;
    const serviceName = services?.map(s => s.name).join(', ') || 'Service';

    // Get staff mapping
    const { data: staffMapping } = await supabase
      .from("phorest_staff_mapping")
      .select("user_id")
      .eq("phorest_staff_id", staff_id)
      .single();

    // Get client name
    const { data: client } = await supabase
      .from("phorest_clients")
      .select("name, phone")
      .eq("phorest_client_id", client_id)
      .single();

    // Calculate end time
    const startDate = new Date(start_time);
    const endDate = new Date(startDate.getTime() + totalDuration * 60000);
    const appointmentDate = start_time.split('T')[0];
    const startTimeLocal = start_time.split('T')[1]?.substring(0, 5) || '09:00';
    const endTimeLocal = endDate.toISOString().split('T')[1]?.substring(0, 5);

    // Create local record
    const appointmentId = response.appointmentId || response.id || `local-${Date.now()}`;
    
    const localRecord = {
      phorest_id: appointmentId,
      stylist_user_id: staffMapping?.user_id || null,
      phorest_staff_id: staff_id,
      client_name: client?.name || 'Client',
      client_phone: client?.phone || null,
      appointment_date: appointmentDate,
      start_time: startTimeLocal,
      end_time: endTimeLocal,
      service_name: serviceName,
      status: 'confirmed',
      notes: notes || null,
    };

    const { error: insertError } = await supabase
      .from("phorest_appointments")
      .upsert(localRecord, { onConflict: 'phorest_id' });

    if (insertError) {
      console.error("Failed to create local record:", insertError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        appointment_id: appointmentId,
        message: "Booking created successfully",
        appointment: localRecord,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Booking creation error:", error);
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
