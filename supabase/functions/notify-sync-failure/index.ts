import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SyncFailureNotification {
  sync_type: string;
  error_message: string;
  timestamp?: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resend = new Resend(resendApiKey);
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { sync_type, error_message, timestamp }: SyncFailureNotification = await req.json();
    const failureTime = timestamp || new Date().toISOString();

    console.log(`Processing sync failure alert for: ${sync_type}`);

    // Get admin users to notify (super admins and account owners)
    const { data: admins, error: adminError } = await supabase
      .from("employee_profiles")
      .select("email, full_name, user_id")
      .or("is_super_admin.eq.true,is_primary_owner.eq.true")
      .eq("is_active", true)
      .not("email", "is", null);

    if (adminError) {
      console.error("Error fetching admins:", adminError);
      throw new Error("Failed to fetch admin users");
    }

    if (!admins || admins.length === 0) {
      console.log("No admin users to notify");
      return new Response(
        JSON.stringify({ success: true, message: "No admins to notify" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${admins.length} admins to notify`);

    // Format the failure time nicely
    const formattedTime = new Date(failureTime).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });

    // Send email to each admin
    const emailPromises = admins.map(async (admin) => {
      try {
        const result = await resend.emails.send({
          from: "Drop Dead Alerts <alerts@dropdeadgorgeous.salon>",
          to: [admin.email],
          subject: `⚠️ Phorest Sync Failure: ${sync_type}`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">⚠️ Sync Failure Alert</h1>
              </div>
              
              <div style="background: #fff; border: 1px solid #e5e7eb; border-top: none; padding: 30px; border-radius: 0 0 12px 12px;">
                <p style="margin-top: 0;">Hi ${admin.full_name?.split(' ')[0] || 'Admin'},</p>
                
                <p>A scheduled Phorest sync has failed and requires your attention:</p>
                
                <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                  <p style="margin: 0 0 8px 0;"><strong>Sync Type:</strong> ${sync_type.charAt(0).toUpperCase() + sync_type.slice(1)}</p>
                  <p style="margin: 0 0 8px 0;"><strong>Failed At:</strong> ${formattedTime}</p>
                  <p style="margin: 0;"><strong>Error:</strong> ${error_message}</p>
                </div>
                
                <p>Please investigate the issue and ensure the Phorest integration is working correctly. You can:</p>
                
                <ul style="padding-left: 20px;">
                  <li>Check the Phorest API credentials in Settings</li>
                  <li>Verify the Phorest service is available</li>
                  <li>Try a manual sync from the dashboard</li>
                </ul>
                
                <div style="text-align: center; margin-top: 30px;">
                  <a href="https://dropdeadgorgeous.salon/dashboard/admin/phorest-settings" 
                     style="display: inline-block; background: #0f172a; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">
                    Go to Phorest Settings
                  </a>
                </div>
                
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                
                <p style="color: #6b7280; font-size: 14px; margin-bottom: 0;">
                  This is an automated alert from your Drop Dead dashboard. If syncs continue to fail, please contact support.
                </p>
              </div>
            </body>
            </html>
          `,
        });
        
        console.log(`Email sent to ${admin.email}:`, result);
        return { email: admin.email, success: true };
      } catch (emailError: any) {
        console.error(`Failed to send email to ${admin.email}:`, emailError);
        return { email: admin.email, success: false, error: emailError.message };
      }
    });

    const emailResults = await Promise.all(emailPromises);
    const successCount = emailResults.filter(r => r.success).length;

    // Also create an in-app notification for visibility
    const notificationPromises = admins.map(async (admin) => {
      await supabase.from("notifications").insert({
        user_id: admin.user_id,
        type: "sync_failure",
        title: `Phorest Sync Failed: ${sync_type}`,
        message: `The ${sync_type} sync failed at ${formattedTime}. Error: ${error_message}`,
        link: "/dashboard/admin/phorest-settings",
      });
    });

    await Promise.all(notificationPromises);

    return new Response(
      JSON.stringify({ 
        success: true, 
        emails_sent: successCount,
        total_admins: admins.length,
        results: emailResults 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error in notify-sync-failure:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
