import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface ReportRequest {
  reportId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { reportId }: ReportRequest = await req.json();

    if (!reportId) {
      throw new Error("Report ID is required");
    }

    // Fetch the report with related data
    const { data: report, error: reportError } = await supabase
      .from("meeting_reports")
      .select("*")
      .eq("id", reportId)
      .single();

    if (reportError || !report) {
      throw new Error("Report not found");
    }

    // Fetch team member profile for email
    const { data: teamMember, error: memberError } = await supabase
      .from("employee_profiles")
      .select("email, full_name, display_name")
      .eq("user_id", report.team_member_id)
      .single();

    if (memberError || !teamMember || !teamMember.email) {
      throw new Error("Team member email not found");
    }

    // Fetch coach profile
    const { data: coach } = await supabase
      .from("employee_profiles")
      .select("full_name, display_name")
      .eq("user_id", report.coach_id)
      .single();

    const coachName = coach?.display_name || coach?.full_name || "Your Coach";
    const memberName = teamMember.display_name || teamMember.full_name || "Team Member";

    // Convert markdown to simple HTML for email
    const htmlContent = report.report_content
      .replace(/^# (.*$)/gm, '<h1 style="color: #1a1a1a; margin-bottom: 16px;">$1</h1>')
      .replace(/^## (.*$)/gm, '<h2 style="color: #333; margin-top: 24px; margin-bottom: 12px;">$1</h2>')
      .replace(/^### (.*$)/gm, '<h3 style="color: #444; margin-top: 16px; margin-bottom: 8px;">$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/^- (.*$)/gm, '<li style="margin-left: 20px;">$1</li>')
      .replace(/\n\n/g, '</p><p style="margin: 12px 0;">')
      .replace(/\n/g, '<br>');

    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from: "Coaching <noreply@lovable.app>",
      to: [teamMember.email],
      subject: `Check-in Report from ${coachName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 24px; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Check-in Report</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0;">From ${coachName}</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 24px; border: 1px solid #e9ecef; border-top: none; border-radius: 0 0 12px 12px;">
            <p style="margin-top: 0;">Hi ${memberName},</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e9ecef; margin: 16px 0;">
              ${htmlContent}
            </div>
            
            <p style="margin-bottom: 0; color: #666; font-size: 14px;">
              Please review this report and reach out if you have any questions.
            </p>
          </div>
          
          <div style="text-align: center; padding: 16px; color: #999; font-size: 12px;">
            <p>This email was sent from your coaching platform.</p>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Report email sent:", emailResponse);

    // Create in-app notification
    await supabase.from("notifications").insert({
      user_id: report.team_member_id,
      type: "meeting_report_received",
      title: "New Check-in Report",
      message: `${coachName} sent you a check-in report.`,
      metadata: { report_id: reportId },
    });

    return new Response(
      JSON.stringify({ success: true, emailResponse }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error sending meeting report:", error);
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
