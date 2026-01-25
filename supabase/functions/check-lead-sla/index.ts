import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Default SLA threshold in hours
const DEFAULT_SLA_HOURS = 4;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse optional body for custom SLA hours
    let slaHours = DEFAULT_SLA_HOURS;
    try {
      const body = await req.json();
      if (body?.sla_hours) {
        slaHours = parseInt(body.sla_hours, 10);
      }
    } catch {
      // No body or invalid JSON, use default
    }

    const slaThresholdMs = slaHours * 60 * 60 * 1000;
    const now = new Date();
    const thresholdTime = new Date(now.getTime() - slaThresholdMs);

    console.log(`Checking for leads uncontacted since ${thresholdTime.toISOString()} (SLA: ${slaHours}h)`);

    // Find leads that are still 'new' and were created before the SLA threshold
    const { data: overdueLeads, error: leadsError } = await supabase
      .from("salon_inquiries")
      .select("id, name, email, phone, source, preferred_location, created_at")
      .eq("status", "new")
      .lt("created_at", thresholdTime.toISOString());

    if (leadsError) {
      console.error("Error fetching overdue leads:", leadsError);
      throw leadsError;
    }

    if (!overdueLeads || overdueLeads.length === 0) {
      console.log("No overdue leads found");
      return new Response(
        JSON.stringify({ success: true, message: "No overdue leads", count: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${overdueLeads.length} overdue leads`);

    // Check which leads already have a recent SLA alert to avoid spam
    const leadIds = overdueLeads.map(l => l.id);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const { data: recentAlerts } = await supabase
      .from("notifications")
      .select("metadata")
      .eq("type", "lead_sla_breach")
      .gte("created_at", oneDayAgo.toISOString());

    const recentlyAlertedLeadIds = new Set(
      (recentAlerts || [])
        .map((n: any) => n.metadata?.lead_id)
        .filter(Boolean)
    );

    const newOverdueLeads = overdueLeads.filter(l => !recentlyAlertedLeadIds.has(l.id));

    if (newOverdueLeads.length === 0) {
      console.log("All overdue leads have already been alerted in the past 24h");
      return new Response(
        JSON.stringify({ success: true, message: "Already alerted", count: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get managers and admins to notify
    const { data: managers, error: managersError } = await supabase
      .from("user_roles")
      .select("user_id, role")
      .in("role", ["admin", "manager", "super_admin"]);

    if (managersError) {
      console.error("Error fetching managers:", managersError);
      throw managersError;
    }

    if (!managers || managers.length === 0) {
      console.log("No managers found to notify");
      return new Response(
        JSON.stringify({ success: true, message: "No managers to notify", count: newOverdueLeads.length }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get unique manager user IDs
    const managerUserIds = [...new Set(managers.map(m => m.user_id))];

    // Get location names for context
    const { data: locations } = await supabase
      .from("locations")
      .select("id, name");
    const locationMap = new Map((locations || []).map(l => [l.id, l.name]));

    // Create in-app notifications for each manager
    const notifications = managerUserIds.flatMap(userId =>
      newOverdueLeads.map(lead => {
        const ageHours = Math.round((now.getTime() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60));
        const locationName = lead.preferred_location ? locationMap.get(lead.preferred_location) : null;

        return {
          user_id: userId,
          type: "lead_sla_breach",
          title: `⚠️ Lead SLA Breach`,
          message: `${lead.name} has been waiting ${ageHours}h without contact${locationName ? ` (${locationName})` : ""}`,
          link: "/dashboard/admin/operational-analytics",
          metadata: {
            lead_id: lead.id,
            lead_name: lead.name,
            hours_waiting: ageHours,
            sla_threshold: slaHours,
          },
        };
      })
    );

    // Insert notifications in batches
    const BATCH_SIZE = 100;
    for (let i = 0; i < notifications.length; i += BATCH_SIZE) {
      const batch = notifications.slice(i, i + BATCH_SIZE);
      const { error: insertError } = await supabase.from("notifications").insert(batch);
      if (insertError) {
        console.error("Error inserting notifications:", insertError);
      }
    }

    console.log(`Created ${notifications.length} notifications for ${managerUserIds.length} managers`);

    // Send email summary if Resend is configured
    if (resendApiKey && newOverdueLeads.length > 0) {
      const resend = new Resend(resendApiKey);

      // Get manager emails
      const { data: managerProfiles } = await supabase
        .from("employee_profiles")
        .select("email")
        .in("user_id", managerUserIds)
        .not("email", "is", null);

      const managerEmails = (managerProfiles || [])
        .map((p: any) => p.email)
        .filter(Boolean);

      if (managerEmails.length > 0) {
        const leadRows = newOverdueLeads.map(lead => {
          const ageHours = Math.round((now.getTime() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60));
          const locationName = lead.preferred_location ? locationMap.get(lead.preferred_location) : "—";
          return `
            <tr>
              <td style="padding: 12px; border-bottom: 1px solid #e5e5e5;">${lead.name}</td>
              <td style="padding: 12px; border-bottom: 1px solid #e5e5e5;">${lead.phone || lead.email || "—"}</td>
              <td style="padding: 12px; border-bottom: 1px solid #e5e5e5;">${locationName}</td>
              <td style="padding: 12px; border-bottom: 1px solid #e5e5e5; color: #dc2626; font-weight: 600;">${ageHours}h</td>
            </tr>
          `;
        }).join("");

        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc2626;">⚠️ Lead Response Time Alert</h2>
            <p>${newOverdueLeads.length} lead${newOverdueLeads.length > 1 ? "s have" : " has"} been waiting <strong>over ${slaHours} hours</strong> without being contacted:</p>
            
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <thead>
                <tr style="background: #f5f5f5;">
                  <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e5e5;">Name</th>
                  <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e5e5;">Contact</th>
                  <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e5e5;">Location</th>
                  <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e5e5;">Waiting</th>
                </tr>
              </thead>
              <tbody>
                ${leadRows}
              </tbody>
            </table>
            
            <p style="margin-top: 24px;">
              <a href="https://dropdeadgorgeous.salon/dashboard/admin/operational-analytics" 
                 style="display: inline-block; background: #1a1a1a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                View Lead Inbox
              </a>
            </p>
            
            <p style="color: #737373; font-size: 14px; margin-top: 24px;">
              This alert was triggered because leads exceeded your ${slaHours}-hour response time SLA.
            </p>
          </div>
        `;

        try {
          await resend.emails.send({
            from: "Drop Dead Alerts <notifications@dropdeadgorgeous.salon>",
            to: managerEmails,
            subject: `⚠️ ${newOverdueLeads.length} Lead${newOverdueLeads.length > 1 ? "s" : ""} Waiting ${slaHours}+ Hours`,
            html: emailHtml,
          });
          console.log(`Email sent to ${managerEmails.length} managers`);
        } catch (emailError) {
          console.error("Failed to send email:", emailError);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        overdueLeads: newOverdueLeads.length,
        notificationsSent: notifications.length,
        managersNotified: managerUserIds.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in check-lead-sla:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
