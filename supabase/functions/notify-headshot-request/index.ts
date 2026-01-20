import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface HeadshotRequestNotification {
  requester_name: string;
  requester_email: string;
  requested_at: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { requester_name, requester_email, requested_at }: HeadshotRequestNotification = await req.json();

    // Fetch all admin users
    const { data: adminRoles, error: rolesError } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    if (rolesError) {
      console.error("Error fetching admin roles:", rolesError);
      throw new Error("Failed to fetch admin users");
    }

    if (!adminRoles || adminRoles.length === 0) {
      console.log("No admin users found to notify");
      return new Response(JSON.stringify({ message: "No admins to notify" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Fetch admin emails
    const adminUserIds = adminRoles.map((r) => r.user_id);
    const { data: adminProfiles, error: profilesError } = await supabase
      .from("employee_profiles")
      .select("email, display_name, full_name")
      .in("user_id", adminUserIds)
      .not("email", "is", null);

    if (profilesError) {
      console.error("Error fetching admin profiles:", profilesError);
      throw new Error("Failed to fetch admin profiles");
    }

    if (!adminProfiles || adminProfiles.length === 0) {
      console.log("No admin emails found");
      return new Response(JSON.stringify({ message: "No admin emails found" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const adminEmails = adminProfiles.map((p) => p.email).filter(Boolean) as string[];
    const formattedDate = new Date(requested_at).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

    // Send email to all admins using Resend API
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #1a1a1a; color: #fff; padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; letter-spacing: 2px; }
          .content { padding: 30px; background-color: #f9f9f9; }
          .info-card { background: #fff; border-radius: 8px; padding: 20px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .info-row { display: flex; margin-bottom: 12px; }
          .info-label { font-weight: 600; color: #666; min-width: 120px; }
          .info-value { color: #333; }
          .cta-button { display: inline-block; background-color: #1a1a1a; color: #fff !important; padding: 14px 28px; text-decoration: none; border-radius: 4px; font-weight: 600; letter-spacing: 1px; margin-top: 20px; }
          .footer { text-align: center; padding: 20px; color: #999; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>NEW HEADSHOT REQUEST</h1>
          </div>
          <div class="content">
            <p>A team member has requested a professional headshot session.</p>
            
            <div class="info-card">
              <div class="info-row">
                <span class="info-label">Name:</span>
                <span class="info-value">${requester_name}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Email:</span>
                <span class="info-value">${requester_email}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Requested:</span>
                <span class="info-value">${formattedDate}</span>
              </div>
            </div>
            
            <p>Please schedule their headshot session at your earliest convenience.</p>
            
            <center>
              <a href="https://dropdeadgorgeoussalon.lovable.app/dashboard/admin/headshot-requests" class="cta-button">
                VIEW REQUEST
              </a>
            </center>
          </div>
          <div class="footer">
            <p>This is an automated notification from Drop Dead Gorgeous Salon.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Drop Dead Gorgeous <notifications@dropdeadgorgeous.salon>",
        to: adminEmails,
        subject: `📸 New Headshot Request from ${requester_name}`,
        html: emailHtml,
      }),
    });

    const emailData = await emailResponse.json();

    console.log("Headshot request notification sent:", emailData);

    return new Response(JSON.stringify({ success: true, emailData }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in notify-headshot-request:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
