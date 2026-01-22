import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SyncRequest {
  sync_type: 'staff' | 'appointments' | 'clients' | 'reports' | 'all';
  date_from?: string;
  date_to?: string;
}

// Phorest API configuration - Global endpoint works
const PHOREST_BASE_URL = "https://platform.phorest.com/third-party-api-server/api";

async function phorestRequest(endpoint: string, businessId: string, username: string, password: string) {
  const basicAuth = btoa(`${username}:${password}`);
  const response = await fetch(`${PHOREST_BASE_URL}/business/${businessId}${endpoint}`, {
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

async function syncStaff(supabase: any, businessId: string, username: string, password: string) {
  console.log("Syncing staff data...");
  
  try {
    // Fetch staff from Phorest
    const staffData = await phorestRequest("/staff", businessId, username, password);
    const staffList = staffData._embedded?.staff || staffData.staff || [];
    
    console.log(`Found ${staffList.length} staff members in Phorest`);

    // Get existing mappings
    const { data: existingMappings } = await supabase
      .from("phorest_staff_mapping")
      .select("phorest_staff_id, user_id");

    const mappedIds = new Set(existingMappings?.map((m: any) => m.phorest_staff_id) || []);

    // Return staff that aren't mapped yet for admin to map
    const unmappedStaff = staffList.filter((s: any) => !mappedIds.has(s.staffId));

    return {
      total_staff: staffList.length,
      mapped: mappedIds.size,
      unmapped: unmappedStaff.length,
      unmapped_staff: unmappedStaff.map((s: any) => ({
        phorest_id: s.staffId,
        name: `${s.firstName} ${s.lastName}`,
        email: s.email,
      })),
    };
  } catch (error) {
    console.error("Staff sync error:", error);
    throw error;
  }
}

async function syncAppointments(
  supabase: any, 
  businessId: string, 
  username: string,
  password: string,
  dateFrom: string,
  dateTo: string
) {
  console.log(`Syncing appointments from ${dateFrom} to ${dateTo}...`);

  try {
    // Fetch appointments from Phorest
    const appointmentsData = await phorestRequest(
      `/appointment?startDate=${dateFrom}&endDate=${dateTo}`,
      businessId,
      username,
      password
    );
    
    const appointments = appointmentsData._embedded?.appointments || appointmentsData.appointments || [];
    console.log(`Found ${appointments.length} appointments`);

    // Get staff mappings
    const { data: staffMappings } = await supabase
      .from("phorest_staff_mapping")
      .select("phorest_staff_id, user_id");

    const staffMap = new Map(staffMappings?.map((m: any) => [m.phorest_staff_id, m.user_id]) || []);

    let synced = 0;
    for (const apt of appointments) {
      const stylistUserId = staffMap.get(apt.staffId) || null;
      
      const appointmentRecord = {
        phorest_id: apt.appointmentId,
        stylist_user_id: stylistUserId,
        phorest_staff_id: apt.staffId,
        client_name: apt.clientName || `${apt.client?.firstName || ''} ${apt.client?.lastName || ''}`.trim(),
        client_phone: apt.client?.mobile || apt.client?.phone || null,
        appointment_date: apt.startTime?.split('T')[0],
        start_time: apt.startTime?.split('T')[1]?.substring(0, 5) || '09:00',
        end_time: apt.endTime?.split('T')[1]?.substring(0, 5) || '10:00',
        service_name: apt.services?.[0]?.name || apt.serviceName || 'Unknown Service',
        service_category: apt.services?.[0]?.category || null,
        status: mapPhorestStatus(apt.status),
        total_price: apt.totalPrice || apt.price || null,
        notes: apt.notes || null,
      };

      const { error } = await supabase
        .from("phorest_appointments")
        .upsert(appointmentRecord, { onConflict: 'phorest_id' });

      if (!error) synced++;
    }

    return { total: appointments.length, synced };
  } catch (error) {
    console.error("Appointments sync error:", error);
    throw error;
  }
}

function mapPhorestStatus(phorestStatus: string): string {
  const statusMap: Record<string, string> = {
    'CONFIRMED': 'confirmed',
    'CHECKED_IN': 'checked_in',
    'STARTED': 'in_progress',
    'COMPLETED': 'completed',
    'CANCELLED': 'cancelled',
    'NO_SHOW': 'no_show',
  };
  return statusMap[phorestStatus] || phorestStatus?.toLowerCase() || 'unknown';
}

async function syncClients(
  supabase: any, 
  businessId: string, 
  username: string,
  password: string
) {
  console.log("Syncing client data...");

  try {
    // Fetch recently updated clients
    const clientsData = await phorestRequest("/client?size=500", businessId, username, password);
    const clients = clientsData._embedded?.clients || clientsData.clients || [];
    
    console.log(`Found ${clients.length} clients`);

    // Get staff mappings for preferred stylist
    const { data: staffMappings } = await supabase
      .from("phorest_staff_mapping")
      .select("phorest_staff_id, user_id");

    const staffMap = new Map(staffMappings?.map((m: any) => [m.phorest_staff_id, m.user_id]) || []);

    let synced = 0;
    for (const client of clients) {
      const preferredStylistId = client.preferredStaffId 
        ? staffMap.get(client.preferredStaffId) 
        : null;

      const clientRecord = {
        phorest_client_id: client.clientId,
        name: `${client.firstName || ''} ${client.lastName || ''}`.trim() || 'Unknown',
        email: client.email || null,
        phone: client.mobile || client.phone || null,
        visit_count: client.appointmentCount || 0,
        last_visit: client.lastAppointmentDate || null,
        first_visit: client.createdAt || null,
        preferred_stylist_id: preferredStylistId,
        total_spend: client.totalSpend || 0,
        is_vip: client.isVip || client.vipStatus === 'VIP' || false,
        notes: client.notes || null,
      };

      const { error } = await supabase
        .from("phorest_clients")
        .upsert(clientRecord, { onConflict: 'phorest_client_id' });

      if (!error) synced++;
    }

    return { total: clients.length, synced };
  } catch (error) {
    console.error("Clients sync error:", error);
    throw error;
  }
}

async function syncPerformanceReports(
  supabase: any,
  businessId: string,
  username: string,
  password: string,
  weekStart: string
) {
  console.log(`Syncing performance reports for week starting ${weekStart}...`);

  try {
    // Calculate week end
    const startDate = new Date(weekStart);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);
    const weekEnd = endDate.toISOString().split('T')[0];

    // Fetch staff performance report
    const reportData = await phorestRequest(
      `/report/staff-performance?startDate=${weekStart}&endDate=${weekEnd}`,
      businessId,
      username,
      password
    );

    const staffPerformance = reportData._embedded?.staffPerformance || reportData.staffPerformance || [];
    console.log(`Found performance data for ${staffPerformance.length} staff`);

    // Get staff mappings
    const { data: staffMappings } = await supabase
      .from("phorest_staff_mapping")
      .select("phorest_staff_id, user_id");

    const staffMap = new Map(staffMappings?.map((m: any) => [m.phorest_staff_id, m.user_id]) || []);

    let synced = 0;
    for (const perf of staffPerformance) {
      const userId = staffMap.get(perf.staffId);
      if (!userId) continue;

      const metricsRecord = {
        user_id: userId,
        week_start: weekStart,
        new_clients: perf.newClientCount || 0,
        retention_rate: perf.clientRetentionRate || 0,
        retail_sales: perf.retailSales || 0,
        extension_clients: perf.extensionClientCount || 0,
        total_revenue: perf.totalRevenue || perf.serviceRevenue || 0,
        service_count: perf.appointmentCount || perf.serviceCount || 0,
        average_ticket: perf.averageTicket || 0,
        rebooking_rate: perf.rebookingRate || 0,
      };

      const { error } = await supabase
        .from("phorest_performance_metrics")
        .upsert(metricsRecord, { onConflict: 'user_id,week_start' });

      if (!error) synced++;
    }

    return { total: staffPerformance.length, synced };
  } catch (error) {
    console.error("Performance reports sync error:", error);
    throw error;
  }
}

async function logSync(
  supabase: any,
  syncType: string,
  status: string,
  recordsSynced: number,
  errorMessage?: string,
  metadata?: any
) {
  await supabase.from("phorest_sync_log").insert({
    sync_type: syncType,
    status,
    records_synced: recordsSynced,
    completed_at: new Date().toISOString(),
    error_message: errorMessage,
    metadata: metadata || {},
  });
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const businessId = Deno.env.get("PHOREST_BUSINESS_ID")!;
    const username = Deno.env.get("PHOREST_USERNAME")!;
    const password = Deno.env.get("PHOREST_API_KEY")!;

    if (!businessId || !username || !password) {
      return new Response(
        JSON.stringify({ error: "Phorest API credentials not configured" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { sync_type, date_from, date_to }: SyncRequest = await req.json();

    console.log(`Starting Phorest sync: ${sync_type}`);

    // Default date range: today + next 7 days for appointments
    const today = new Date();
    const defaultFrom = date_from || today.toISOString().split('T')[0];
    const defaultTo = date_to || new Date(today.setDate(today.getDate() + 7)).toISOString().split('T')[0];

    // Get the Monday of this week for performance reports
    const thisMonday = new Date();
    thisMonday.setDate(thisMonday.getDate() - thisMonday.getDay() + 1);
    const weekStart = thisMonday.toISOString().split('T')[0];

    const results: any = {};

    if (sync_type === 'staff' || sync_type === 'all') {
      try {
        results.staff = await syncStaff(supabase, businessId, username, password);
        await logSync(supabase, 'staff', 'success', results.staff.mapped);
      } catch (error: any) {
        results.staff = { error: error.message };
        await logSync(supabase, 'staff', 'failed', 0, error.message);
      }
    }

    if (sync_type === 'appointments' || sync_type === 'all') {
      try {
        results.appointments = await syncAppointments(supabase, businessId, username, password, defaultFrom, defaultTo);
        await logSync(supabase, 'appointments', 'success', results.appointments.synced);
      } catch (error: any) {
        results.appointments = { error: error.message };
        await logSync(supabase, 'appointments', 'failed', 0, error.message);
      }
    }

    if (sync_type === 'clients' || sync_type === 'all') {
      try {
        results.clients = await syncClients(supabase, businessId, username, password);
        await logSync(supabase, 'clients', 'success', results.clients.synced);
      } catch (error: any) {
        results.clients = { error: error.message };
        await logSync(supabase, 'clients', 'failed', 0, error.message);
      }
    }

    if (sync_type === 'reports' || sync_type === 'all') {
      try {
        results.reports = await syncPerformanceReports(supabase, businessId, username, password, weekStart);
        await logSync(supabase, 'reports', 'success', results.reports.synced);
      } catch (error: any) {
        results.reports = { error: error.message };
        await logSync(supabase, 'reports', 'failed', 0, error.message);
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error in sync-phorest-data:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});