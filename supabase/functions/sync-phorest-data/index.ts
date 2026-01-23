import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SyncRequest {
  sync_type: 'staff' | 'appointments' | 'clients' | 'reports' | 'sales' | 'all';
  date_from?: string;
  date_to?: string;
  quick?: boolean; // For lightweight syncs (e.g., appointments for next 7 days only)
}

// Phorest API configuration - Global endpoint works
const PHOREST_BASE_URL = "https://platform.phorest.com/third-party-api-server/api";

async function phorestRequest(endpoint: string, businessId: string, username: string, password: string) {
  // Ensure username has global/ prefix
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

async function syncStaff(supabase: any, businessId: string, username: string, password: string) {
  console.log("Syncing staff data...");
  
  try {
    let allStaff: any[] = [];
    
    // Get branches first - staff endpoints require branchId per the API docs
    const branchData = await phorestRequest("/branch", businessId, username, password);
    const branches = branchData._embedded?.branches || branchData.branches || 
                     (Array.isArray(branchData) ? branchData : []);
    console.log(`Found ${branches.length} branches`);
    
    for (const branch of branches) {
      const branchId = branch.branchId || branch.id;
      console.log(`Fetching staff for branch: ${branch.name} (${branchId})`);
      
      // Correct endpoint per API docs: /api/business/{businessId}/branch/{branchId}/staff
      try {
        const staffResponse = await phorestRequest(`/branch/${branchId}/staff`, businessId, username, password);
        console.log(`Staff response for ${branchId}:`, JSON.stringify(staffResponse).substring(0, 300));
        
        // API returns "staffs" (plural) in _embedded
        const staffList = staffResponse._embedded?.staffs || staffResponse._embedded?.staff || 
                         staffResponse.staffs || staffResponse.staff || 
                         staffResponse.page?.content || (Array.isArray(staffResponse) ? staffResponse : []);
        
        if (staffList.length > 0) {
          console.log(`Found ${staffList.length} staff in branch ${branch.name}`);
          // Add branchId to each staff member for reference
          const staffWithBranch = staffList.map((s: any) => ({ ...s, branchId, branchName: branch.name }));
          allStaff = [...allStaff, ...staffWithBranch];
        }
      } catch (e: any) {
        console.log(`Staff fetch failed for branch ${branchId}:`, e.message);
      }
    }
    
    // Deduplicate by staffId (staff may work at multiple branches)
    const uniqueStaff = Array.from(
      new Map(allStaff.map((s: any) => [s.staffId || s.id, s])).values()
    );
    
    console.log(`Found ${uniqueStaff.length} unique staff members total`);

    // Get existing mappings
    const { data: existingMappings } = await supabase
      .from("phorest_staff_mapping")
      .select("phorest_staff_id, user_id");

    const mappedIds = new Set(existingMappings?.map((m: any) => m.phorest_staff_id) || []);

    // Return staff that aren't mapped yet
    const unmappedStaff = uniqueStaff.filter((s: any) => !mappedIds.has(s.staffId || s.id));

    return {
      total_staff: uniqueStaff.length,
      mapped: mappedIds.size,
      unmapped: unmappedStaff.length,
      unmapped_staff: unmappedStaff.map((s: any) => ({
        phorest_id: s.staffId || s.id,
        name: `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Unknown',
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
  console.log("Syncing client data with branch/location info...");

  try {
    // Get branches first to fetch clients per-branch for location tracking
    const branchData = await phorestRequest("/branch", businessId, username, password);
    const branches = branchData._embedded?.branches || branchData.branches || 
                     (Array.isArray(branchData) ? branchData : []);
    console.log(`Found ${branches.length} branches for client sync`);

    // Get staff mappings for preferred stylist
    const { data: staffMappings } = await supabase
      .from("phorest_staff_mapping")
      .select("phorest_staff_id, user_id");

    const staffMap = new Map(staffMappings?.map((m: any) => [m.phorest_staff_id, m.user_id]) || []);

    // Fetch locations to map branch IDs to our location IDs
    const { data: locations } = await supabase
      .from("locations")
      .select("id, name");
    
    // Create a map of branch names to location IDs (case-insensitive matching)
    const locationMap = new Map<string, string>();
    locations?.forEach((loc: any) => {
      locationMap.set(loc.name.toLowerCase(), loc.id);
    });

    // Track all clients across branches (client may visit multiple branches)
    const clientDataMap = new Map<string, any>();

    // Fetch clients from each branch to get branch-specific data
    for (const branch of branches) {
      const branchId = branch.branchId || branch.id;
      const branchName = branch.name || 'Unknown';
      
      // Try to match branch to our locations table
      const locationId = locationMap.get(branchName.toLowerCase()) || null;
      
      console.log(`Fetching clients for branch: ${branchName} (${branchId}), mapped location: ${locationId}`);

      try {
        // Fetch clients for this branch
        const clientsData = await phorestRequest(
          `/branch/${branchId}/client?size=500`, 
          businessId, 
          username, 
          password
        );
        const clients = clientsData._embedded?.clients || clientsData.clients || [];
        
        console.log(`Found ${clients.length} clients in branch ${branchName}`);

        for (const client of clients) {
          const clientId = client.clientId || client.id;
          
          // If we've seen this client before, update only if this is more recent
          if (clientDataMap.has(clientId)) {
            const existing = clientDataMap.get(clientId);
            const existingLastVisit = existing.lastAppointmentDate ? new Date(existing.lastAppointmentDate) : null;
            const newLastVisit = client.lastAppointmentDate ? new Date(client.lastAppointmentDate) : null;
            
            // Keep the record with the most recent visit (this determines their "home" location)
            if (newLastVisit && (!existingLastVisit || newLastVisit > existingLastVisit)) {
              clientDataMap.set(clientId, {
                ...client,
                _branchId: branchId,
                _branchName: branchName,
                _locationId: locationId,
              });
            }
          } else {
            clientDataMap.set(clientId, {
              ...client,
              _branchId: branchId,
              _branchName: branchName,
              _locationId: locationId,
            });
          }
        }
      } catch (e: any) {
        console.log(`Failed to fetch clients for branch ${branchId}:`, e.message);
        // Fall back to global client endpoint if branch-specific fails
      }
    }

    // If no clients found via branch endpoints, fall back to global endpoint
    if (clientDataMap.size === 0) {
      console.log("Falling back to global client endpoint...");
      const clientsData = await phorestRequest("/client?size=500", businessId, username, password);
      const clients = clientsData._embedded?.clients || clientsData.clients || [];
      
      for (const client of clients) {
        clientDataMap.set(client.clientId || client.id, client);
      }
    }

    console.log(`Total unique clients to sync: ${clientDataMap.size}`);

    let synced = 0;
    for (const [clientId, client] of clientDataMap) {
      const preferredStylistId = client.preferredStaffId 
        ? staffMap.get(client.preferredStaffId) 
        : null;

      const clientRecord = {
        phorest_client_id: clientId,
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
        // New location fields
        location_id: client._locationId || null,
        phorest_branch_id: client._branchId || null,
        branch_name: client._branchName || null,
      };

      const { error } = await supabase
        .from("phorest_clients")
        .upsert(clientRecord, { onConflict: 'phorest_client_id' });

      if (!error) synced++;
      else console.log(`Failed to upsert client ${clientId}:`, error.message);
    }

    return { total: clientDataMap.size, synced };
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

async function syncSalesTransactions(
  supabase: any,
  businessId: string,
  username: string,
  password: string,
  dateFrom: string,
  dateTo: string
) {
  console.log(`Syncing sales transactions from ${dateFrom} to ${dateTo}...`);

  try {
    // Get branches first
    const branchData = await phorestRequest("/branch", businessId, username, password);
    const branches = branchData._embedded?.branches || branchData.branches || [];
    
    // Get staff mappings
    const { data: staffMappings } = await supabase
      .from("phorest_staff_mapping")
      .select("phorest_staff_id, user_id, phorest_branch_id");

    const staffMap = new Map(staffMappings?.map((m: any) => [m.phorest_staff_id, m.user_id]) || []);

    let totalTransactions = 0;
    let syncedTransactions = 0;
    const dailySummaries = new Map<string, any>();

    for (const branch of branches) {
      const branchId = branch.branchId || branch.id;
      const branchName = branch.name || 'Unknown';
      
      console.log(`Fetching sales for branch: ${branchName} (${branchId})`);

      try {
        // Try purchase/transaction endpoint
        const purchaseData = await phorestRequest(
          `/branch/${branchId}/purchase?startDate=${dateFrom}&endDate=${dateTo}&size=500`,
          businessId,
          username,
          password
        );

        const purchases = purchaseData._embedded?.purchases || purchaseData.purchases || 
                         purchaseData._embedded?.transactions || purchaseData.transactions || [];
        
        console.log(`Found ${purchases.length} transactions in ${branchName}`);
        totalTransactions += purchases.length;

        for (const purchase of purchases) {
          const staffId = purchase.staffId || purchase.staff?.staffId;
          const stylistUserId = staffId ? staffMap.get(staffId) : null;
          const transactionDate = purchase.purchaseDate?.split('T')[0] || purchase.createdAt?.split('T')[0];
          const transactionTime = purchase.purchaseDate?.split('T')[1]?.substring(0, 8) || null;

          // Process line items
          const items = purchase.items || purchase.lineItems || purchase.services || [];
          
          for (const item of items) {
            const itemType = item.type?.toLowerCase() || 
                           (item.productId ? 'product' : 'service');
            const itemName = item.name || item.description || 'Unknown Item';
            const transactionId = `${purchase.purchaseId || purchase.id}-${item.itemId || item.id || itemName}`;

            const transactionRecord = {
              phorest_transaction_id: transactionId,
              stylist_user_id: stylistUserId,
              phorest_staff_id: staffId,
              location_id: branchId,
              branch_name: branchName,
              transaction_date: transactionDate,
              transaction_time: transactionTime,
              client_name: purchase.clientName || `${purchase.client?.firstName || ''} ${purchase.client?.lastName || ''}`.trim() || null,
              client_phone: purchase.client?.mobile || purchase.client?.phone || null,
              item_type: itemType,
              item_name: itemName,
              item_category: item.category || item.categoryName || null,
              quantity: item.quantity || 1,
              unit_price: item.unitPrice || item.price || 0,
              discount_amount: item.discountAmount || item.discount || 0,
              tax_amount: item.taxAmount || item.tax || 0,
              total_amount: item.totalPrice || item.total || item.price || 0,
              payment_method: purchase.paymentMethod || purchase.payments?.[0]?.type || null,
            };

            const { error } = await supabase
              .from("phorest_sales_transactions")
              .upsert(transactionRecord, { onConflict: 'phorest_transaction_id,item_name' });

            if (!error) syncedTransactions++;

            // Aggregate for daily summary
            if (stylistUserId && transactionDate) {
              const summaryKey = `${stylistUserId}:${branchId}:${transactionDate}`;
              if (!dailySummaries.has(summaryKey)) {
                dailySummaries.set(summaryKey, {
                  user_id: stylistUserId,
                  location_id: branchId,
                  branch_name: branchName,
                  summary_date: transactionDate,
                  total_services: 0,
                  total_products: 0,
                  service_revenue: 0,
                  product_revenue: 0,
                  total_revenue: 0,
                  total_transactions: 0,
                  total_discounts: 0,
                });
              }
              
              const summary = dailySummaries.get(summaryKey);
              const amount = parseFloat(transactionRecord.total_amount) || 0;
              const discount = parseFloat(transactionRecord.discount_amount as any) || 0;
              
              if (itemType === 'product') {
                summary.total_products += transactionRecord.quantity;
                summary.product_revenue += amount;
              } else {
                summary.total_services += transactionRecord.quantity;
                summary.service_revenue += amount;
              }
              summary.total_revenue += amount;
              summary.total_transactions += 1;
              summary.total_discounts += discount;
            }
          }

          // If no line items, create a single transaction record
          if (items.length === 0) {
            const transactionRecord = {
              phorest_transaction_id: purchase.purchaseId || purchase.id,
              stylist_user_id: stylistUserId,
              phorest_staff_id: staffId,
              location_id: branchId,
              branch_name: branchName,
              transaction_date: transactionDate,
              transaction_time: transactionTime,
              client_name: purchase.clientName || null,
              client_phone: null,
              item_type: 'service',
              item_name: purchase.description || 'Transaction',
              item_category: null,
              quantity: 1,
              unit_price: purchase.total || purchase.amount || 0,
              discount_amount: purchase.discountAmount || 0,
              tax_amount: purchase.taxAmount || 0,
              total_amount: purchase.total || purchase.amount || 0,
              payment_method: purchase.paymentMethod || null,
            };

            const { error } = await supabase
              .from("phorest_sales_transactions")
              .upsert(transactionRecord, { onConflict: 'phorest_transaction_id,item_name' });

            if (!error) syncedTransactions++;
          }
        }
      } catch (e: any) {
        console.log(`Sales fetch failed for branch ${branchId}:`, e.message);
      }
    }

    // Upsert daily summaries
    let summariesSynced = 0;
    for (const summary of dailySummaries.values()) {
      // Calculate average ticket
      summary.average_ticket = summary.total_transactions > 0 
        ? summary.total_revenue / summary.total_transactions 
        : 0;

      const { error } = await supabase
        .from("phorest_daily_sales_summary")
        .upsert(summary, { onConflict: 'user_id,location_id,summary_date' });

      if (!error) summariesSynced++;
    }

    console.log(`Synced ${syncedTransactions} transaction items, ${summariesSynced} daily summaries`);

    return { 
      total_transactions: totalTransactions, 
      synced_items: syncedTransactions,
      daily_summaries: summariesSynced 
    };
  } catch (error) {
    console.error("Sales sync error:", error);
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
    const { sync_type, date_from, date_to, quick }: SyncRequest = await req.json();

    console.log(`Starting Phorest sync: ${sync_type}${quick ? ' (quick mode)' : ''}`);

    // Default date range for appointments
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    // Quick mode: only sync today + 7 days for appointments (for frequent syncs)
    // Full mode: use provided dates or default range
    let defaultFrom: string;
    let defaultTo: string;
    
    if (quick) {
      defaultFrom = todayStr;
      const weekFromNow = new Date(today);
      weekFromNow.setDate(weekFromNow.getDate() + 7);
      defaultTo = weekFromNow.toISOString().split('T')[0];
    } else {
      defaultFrom = date_from || todayStr;
      const defaultToDate = new Date(today);
      defaultToDate.setDate(defaultToDate.getDate() + 7);
      defaultTo = date_to || defaultToDate.toISOString().split('T')[0];
    }

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

    if (sync_type === 'sales' || sync_type === 'all') {
      try {
        // Quick mode: just today's sales
        // Full mode: last 30 days for sales
        let salesFrom: string;
        let salesTo: string;
        
        if (quick) {
          salesFrom = todayStr;
          salesTo = todayStr;
        } else {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          salesFrom = date_from || thirtyDaysAgo.toISOString().split('T')[0];
          salesTo = date_to || new Date().toISOString().split('T')[0];
        }
        
        results.sales = await syncSalesTransactions(supabase, businessId, username, password, salesFrom, salesTo);
        await logSync(supabase, 'sales', 'success', results.sales.synced_items, undefined, { quick });
      } catch (error: any) {
        results.sales = { error: error.message };
        await logSync(supabase, 'sales', 'failed', 0, error.message);
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