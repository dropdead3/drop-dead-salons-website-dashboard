import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface StaffingAlertSettings {
  percentage: number;
  email_enabled: boolean;
  in_app_enabled: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch alert settings
    const { data: settingsData } = await supabase
      .from("site_settings")
      .select("value")
      .eq("id", "staffing_alert_threshold")
      .maybeSingle();

    const settings: StaffingAlertSettings = settingsData?.value as StaffingAlertSettings || {
      percentage: 70,
      email_enabled: true,
      in_app_enabled: true,
    };

    if (!settings.email_enabled && !settings.in_app_enabled) {
      return new Response(
        JSON.stringify({ message: "All staffing alerts are disabled" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch locations with capacity settings
    const { data: locations, error: locError } = await supabase
      .from("locations")
      .select("id, name, stylist_capacity, assistant_ratio")
      .eq("is_active", true)
      .not("stylist_capacity", "is", null);

    if (locError) throw locError;

    if (!locations || locations.length === 0) {
      return new Response(
        JSON.stringify({ message: "No locations with capacity configured" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch employees and roles
    const { data: employees } = await supabase
      .from("employee_profiles")
      .select("user_id, location_ids")
      .eq("is_active", true)
      .eq("is_approved", true);

    const employeeUserIds = employees?.map((e) => e.user_id) || [];
    const { data: roles } = employeeUserIds.length > 0
      ? await supabase
          .from("user_roles")
          .select("user_id, role")
          .in("user_id", employeeUserIds)
          .in("role", ["stylist", "stylist_assistant"])
      : { data: [] };

    // Check each location's staffing level
    const alertLocations: { name: string; currentStaff: number; targetStaff: number; percentage: number }[] = [];

    for (const location of locations) {
      const locationEmployees = employees?.filter(
        (e) => e.location_ids?.includes(location.id)
      ) || [];
      const locationUserIds = locationEmployees.map((e) => e.user_id);
      const locationRoles = roles?.filter((r) => locationUserIds.includes(r.user_id)) || [];

      const stylistCount = locationRoles.filter((r) => r.role === "stylist").length;
      const assistantCount = locationRoles.filter((r) => r.role === "stylist_assistant").length;
      const currentStaff = stylistCount + assistantCount;

      const assistantTarget = Math.ceil(
        (location.stylist_capacity || 0) * (location.assistant_ratio || 0.5)
      );
      const targetStaff = (location.stylist_capacity || 0) + assistantTarget;

      if (targetStaff > 0) {
        const percentage = Math.round((currentStaff / targetStaff) * 100);
        if (percentage < settings.percentage) {
          alertLocations.push({
            name: location.name,
            currentStaff,
            targetStaff,
            percentage,
          });
        }
      }
    }

    if (alertLocations.length === 0) {
      return new Response(
        JSON.stringify({ message: "All locations are above threshold" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch admin users for notifications
    const { data: adminProfiles } = await supabase
      .from("employee_profiles")
      .select("user_id, email, full_name")
      .eq("is_active", true)
      .eq("is_approved", true);

    const adminUserIds = adminProfiles?.map((p) => p.user_id) || [];
    const { data: adminRoles } = adminUserIds.length > 0
      ? await supabase
          .from("user_roles")
          .select("user_id, role")
          .in("user_id", adminUserIds)
          .in("role", ["admin", "super_admin", "manager"])
      : { data: [] };

    const adminEmails = adminProfiles?.filter(
      (p) => adminRoles?.some((r) => r.user_id === p.user_id)
    ).map((p) => p.email).filter(Boolean) || [];

    const adminIds = adminRoles?.map((r) => r.user_id) || [];

    let notificationsSent = 0;
    let emailsSent = 0;

    // Create in-app notifications
    if (settings.in_app_enabled) {
      const notifications = alertLocations.flatMap((loc) =>
        adminIds.map((userId) => ({
          user_id: userId,
          type: "staffing_alert",
          title: `⚠️ Staffing Alert: ${loc.name}`,
          message: `${loc.name} is at ${loc.percentage}% staffing capacity (${loc.currentStaff}/${loc.targetStaff}). Consider prioritizing hiring.`,
          link: "/dashboard/admin/operational-analytics",
          is_read: false,
        }))
      );

      if (notifications.length > 0) {
        const { error: notifError } = await supabase
          .from("notifications")
          .insert(notifications);

        if (!notifError) {
          notificationsSent = notifications.length;
        }
      }
    }

    // Send emails using fetch to Resend API
    if (settings.email_enabled && resendApiKey && adminEmails.length > 0) {
      const locationList = alertLocations
        .map((loc) => `• ${loc.name}: ${loc.percentage}% (${loc.currentStaff}/${loc.targetStaff})`)
        .join("<br>");

      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Drop Dead Gorgeous <notifications@dropdeadgorgeous.salon>",
          to: adminEmails,
          subject: `⚠️ Staffing Alert: ${alertLocations.length} location(s) below ${settings.percentage}% capacity`,
          html: `
            <h2>Staffing Capacity Alert</h2>
            <p>The following locations are below your configured threshold of ${settings.percentage}%:</p>
            <p>${locationList}</p>
            <p><a href="https://dropdeadgorgeous.salon/dashboard/admin/operational-analytics">View Hiring Capacity Dashboard</a></p>
          `,
        }),
      });

      if (emailResponse.ok) {
        emailsSent = adminEmails.length;
      }
    }

    console.log(`Staffing alert: ${alertLocations.length} locations below threshold, ${notificationsSent} notifications, ${emailsSent} emails`);

    return new Response(
      JSON.stringify({
        success: true,
        alertLocations,
        notificationsSent,
        emailsSent,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error checking staffing levels:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
