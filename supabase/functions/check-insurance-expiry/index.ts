import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const today = new Date();
    const alertDays = [30, 14, 7, 0]; // Days before expiry to send alerts
    const results = {
      alerts_sent: [] as any[],
      expired: [] as any[],
    };

    for (const daysAhead of alertDays) {
      const targetDate = new Date(today);
      targetDate.setDate(targetDate.getDate() + daysAhead);
      const targetDateStr = targetDate.toISOString().split("T")[0];

      // Find renters with insurance expiring on this date
      const { data: expiringRenters, error } = await supabase
        .from("booth_renter_profiles")
        .select(`
          id,
          user_id,
          organization_id,
          business_name,
          insurance_provider,
          insurance_expiry_date,
          billing_email
        `)
        .eq("status", "active")
        .eq("insurance_expiry_date", targetDateStr);

      if (error) {
        console.error(`Error fetching renters with expiring insurance:`, error);
        continue;
      }

      for (const renter of expiringRenters || []) {
        // Get employee profile for name
        const { data: employee } = await supabase
          .from("employee_profiles")
          .select("full_name, display_name, email")
          .eq("user_id", renter.user_id)
          .single();

        const renterName = employee?.display_name || employee?.full_name || "Booth Renter";
        const renterEmail = renter.billing_email || employee?.email;

        if (daysAhead === 0) {
          // Insurance expired today
          results.expired.push({
            renter_id: renter.id,
            renter_name: renterName,
            organization_id: renter.organization_id,
          });

          // Create admin notification
          await supabase.from("platform_notifications").insert({
            type: "insurance_expired",
            severity: "error",
            title: "Renter Insurance Expired",
            message: `${renterName}'s liability insurance has expired. Immediate action required.`,
            metadata: {
              renter_id: renter.id,
              renter_name: renterName,
              expiry_date: renter.insurance_expiry_date,
            },
          });
        } else {
          // Expiring soon - send reminder
          results.alerts_sent.push({
            renter_id: renter.id,
            renter_name: renterName,
            days_until_expiry: daysAhead,
            email: renterEmail,
          });

          // Create notification
          await supabase.from("platform_notifications").insert({
            type: "insurance_expiring",
            severity: daysAhead <= 7 ? "warning" : "info",
            title: "Insurance Expiring Soon",
            message: `${renterName}'s liability insurance expires in ${daysAhead} days.`,
            metadata: {
              renter_id: renter.id,
              renter_name: renterName,
              days_until_expiry: daysAhead,
              expiry_date: renter.insurance_expiry_date,
            },
          });

          // TODO: Send email reminder to renter
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        alerts_sent: results.alerts_sent.length,
        expired_count: results.expired.length,
        details: results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error checking insurance expiry:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
