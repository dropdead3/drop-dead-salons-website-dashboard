import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmployeeWithPending {
  user_id: string;
  email: string;
  full_name: string;
  pending_handbooks: string[];
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting handbook acknowledgment reminder check...");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all active handbooks
    const { data: handbooks, error: handbooksError } = await supabase
      .from("handbooks")
      .select("id, title, visible_to_roles")
      .eq("is_active", true);

    if (handbooksError) {
      console.error("Error fetching handbooks:", handbooksError);
      throw handbooksError;
    }

    if (!handbooks || handbooks.length === 0) {
      return new Response(
        JSON.stringify({ message: "No active handbooks found" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get all employee profiles with their user IDs
    const { data: employees, error: employeesError } = await supabase
      .from("employee_profiles")
      .select("user_id, email, full_name")
      .eq("is_active", true);

    if (employeesError) {
      console.error("Error fetching employees:", employeesError);
      throw employeesError;
    }

    if (!employees || employees.length === 0) {
      return new Response(
        JSON.stringify({ message: "No active employees found" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get all user roles
    const { data: userRoles, error: rolesError } = await supabase
      .from("user_roles")
      .select("user_id, role");

    if (rolesError) {
      console.error("Error fetching user roles:", rolesError);
      throw rolesError;
    }

    // Get all acknowledgments
    const { data: acknowledgments, error: ackError } = await supabase
      .from("handbook_acknowledgments")
      .select("user_id, handbook_id");

    if (ackError) {
      console.error("Error fetching acknowledgments:", ackError);
      throw ackError;
    }

    const employeesToRemind: EmployeeWithPending[] = [];

    for (const employee of employees) {
      if (!employee.email) continue;

      // Get this user's roles
      const roles = userRoles
        ?.filter(r => r.user_id === employee.user_id)
        .map(r => r.role) || [];

      if (roles.length === 0) continue;

      // Find handbooks visible to this user's roles
      const visibleHandbooks = handbooks.filter(h => {
        const visibleRoles = h.visible_to_roles || [];
        return roles.some(role => visibleRoles.includes(role));
      });

      // Find which handbooks haven't been acknowledged
      const userAcks = acknowledgments
        ?.filter(a => a.user_id === employee.user_id)
        .map(a => a.handbook_id) || [];

      const pendingHandbooks = visibleHandbooks.filter(h => !userAcks.includes(h.id));

      if (pendingHandbooks.length > 0) {
        employeesToRemind.push({
          user_id: employee.user_id,
          email: employee.email,
          full_name: employee.full_name,
          pending_handbooks: pendingHandbooks.map(h => h.title),
        });
      }
    }

    console.log(`Found ${employeesToRemind.length} employees with pending handbooks`);

    const emailResults = [];

    for (const employee of employeesToRemind) {
      try {
        const handbookList = employee.pending_handbooks
          .map(title => `<li style="margin-bottom: 8px;">${title}</li>`)
          .join("");

        const emailRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "Drop Dead 75 <onboarding@resend.dev>",
            to: [employee.email],
            subject: `📋 ${employee.pending_handbooks.length} handbook${employee.pending_handbooks.length > 1 ? 's' : ''} pending your acknowledgment`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="font-size: 24px; margin-bottom: 16px;">
                  Hey ${employee.full_name}! 👋
                </h1>
                
                <p style="font-size: 16px; line-height: 1.6; color: #333;">
                  You have <strong>${employee.pending_handbooks.length} handbook${employee.pending_handbooks.length > 1 ? 's' : ''}</strong> 
                  that still need${employee.pending_handbooks.length === 1 ? 's' : ''} your acknowledgment:
                </p>
                
                <ul style="font-size: 14px; color: #666; line-height: 1.8; padding-left: 20px;">
                  ${handbookList}
                </ul>
                
                <p style="font-size: 16px; line-height: 1.6; color: #333;">
                  Please review and acknowledge these documents to complete your onboarding.
                </p>
                
                <div style="margin: 32px 0;">
                  <a href="${Deno.env.get("SITE_URL") || "https://dropdeadgorgeous.com"}/dashboard/onboarding" 
                     style="background: #000; color: #fff; padding: 16px 32px; text-decoration: none; font-weight: bold; display: inline-block;">
                    REVIEW HANDBOOKS
                  </a>
                </div>
                
                <p style="font-size: 14px; color: #999; margin-top: 32px;">
                  Questions? Reply to this email or reach out to your manager.
                </p>
              </div>
            `,
          }),
        });

        const result = await emailRes.json();
        console.log(`Email sent to ${employee.email}:`, result);
        emailResults.push({ 
          email: employee.email, 
          success: emailRes.ok, 
          pendingCount: employee.pending_handbooks.length,
          result 
        });
      } catch (emailError) {
        console.error(`Failed to send email to ${employee.email}:`, emailError);
        emailResults.push({ 
          email: employee.email, 
          success: false, 
          error: String(emailError) 
        });
      }
    }

    return new Response(
      JSON.stringify({
        message: "Handbook reminders processed",
        totalEmployees: employees.length,
        employeesWithPending: employeesToRemind.length,
        results: emailResults,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in send-handbook-reminders:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
