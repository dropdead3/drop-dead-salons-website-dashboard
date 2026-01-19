import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmployeeProfile {
  id: string;
  user_id: string;
  full_name: string;
  display_name: string | null;
  email: string | null;
  birthday: string | null;
  photo_url: string | null;
}

interface LeadershipMember {
  user_id: string;
  email: string;
  full_name: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body for configuration (optional)
    let daysBeforeBirthday = 3; // Default to 3 days before
    try {
      const body = await req.json();
      if (body.days_before) {
        daysBeforeBirthday = parseInt(body.days_before, 10);
      }
    } catch {
      // No body provided, use defaults
    }

    // Get today's date components
    const today = new Date();
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + daysBeforeBirthday);
    
    const targetMonth = targetDate.getMonth() + 1; // 1-12
    const targetDay = targetDate.getDate();

    console.log(`Checking for birthdays on ${targetMonth}/${targetDay} (${daysBeforeBirthday} days from now)`);

    // Find employees with birthdays on the target date
    const { data: employees, error: employeesError } = await supabase
      .from("employee_profiles")
      .select("id, user_id, full_name, display_name, email, birthday, photo_url")
      .eq("is_active", true)
      .not("birthday", "is", null);

    if (employeesError) {
      console.error("Error fetching employees:", employeesError);
      throw employeesError;
    }

    // Filter employees whose birthday matches the target date
    const upcomingBirthdays = (employees || []).filter((emp: EmployeeProfile) => {
      if (!emp.birthday) return false;
      const [year, month, day] = emp.birthday.split("-").map(Number);
      return month === targetMonth && day === targetDay;
    });

    if (upcomingBirthdays.length === 0) {
      console.log("No upcoming birthdays found for the target date");
      return new Response(
        JSON.stringify({ message: "No upcoming birthdays", date: `${targetMonth}/${targetDay}` }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Found ${upcomingBirthdays.length} upcoming birthday(s)`);

    // Get leadership team members (admin and manager roles)
    const { data: leadershipRoles, error: rolesError } = await supabase
      .from("user_roles")
      .select("user_id, role")
      .in("role", ["admin", "manager"]);

    if (rolesError) {
      console.error("Error fetching leadership roles:", rolesError);
      throw rolesError;
    }

    const leadershipUserIds = [...new Set((leadershipRoles || []).map(r => r.user_id))];

    if (leadershipUserIds.length === 0) {
      console.log("No leadership team members found");
      return new Response(
        JSON.stringify({ message: "No leadership members to notify" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get leadership profiles with emails
    const { data: leadershipProfiles, error: profilesError } = await supabase
      .from("employee_profiles")
      .select("user_id, full_name, email")
      .in("user_id", leadershipUserIds)
      .eq("is_active", true)
      .not("email", "is", null);

    if (profilesError) {
      console.error("Error fetching leadership profiles:", profilesError);
      throw profilesError;
    }

    const leadershipEmails = (leadershipProfiles || [])
      .filter((p: LeadershipMember) => p.email)
      .map((p: LeadershipMember) => p.email);

    if (leadershipEmails.length === 0) {
      console.log("No leadership emails found");
      return new Response(
        JSON.stringify({ message: "No leadership emails configured" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Sending reminders to ${leadershipEmails.length} leadership member(s)`);

    // Build email content
    const birthdayList = upcomingBirthdays
      .map((emp: EmployeeProfile) => {
        const name = emp.display_name || emp.full_name;
        return `<li style="margin-bottom: 8px;">🎂 <strong>${name}</strong></li>`;
      })
      .join("");

    const dateFormatted = targetDate.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });

    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #ec4899, #8b5cf6); padding: 24px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🎉 Upcoming Birthday Reminder</h1>
        </div>
        <div style="background: #fdf2f8; padding: 24px; border-radius: 0 0 12px 12px;">
          <p style="color: #374151; font-size: 16px; margin-bottom: 16px;">
            The following team member${upcomingBirthdays.length > 1 ? "s have" : " has"} a birthday coming up on <strong>${dateFormatted}</strong>:
          </p>
          <ul style="list-style: none; padding: 0; margin: 0 0 24px 0;">
            ${birthdayList}
          </ul>
          <p style="color: #6b7280; font-size: 14px; margin: 0;">
            Don't forget to wish them a happy birthday! 🎈
          </p>
        </div>
        <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 16px;">
          This is an automated reminder from Drop Dead Gorgeous.
        </p>
      </div>
    `;

    // Send email to all leadership members using Resend API directly
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Drop Dead Gorgeous <onboarding@resend.dev>",
        to: leadershipEmails,
        subject: `🎂 Birthday Reminder: ${upcomingBirthdays.length} upcoming birthday${upcomingBirthdays.length > 1 ? "s" : ""} on ${dateFormatted}`,
        html: emailHtml,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text();
      console.error("Resend API error:", errorData);
      throw new Error(`Failed to send email: ${errorData}`);
    }

    const emailResult = await emailResponse.json();
    console.log("Email sent successfully:", emailResult);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Birthday reminders sent for ${upcomingBirthdays.length} team member(s)`,
        recipients: leadershipEmails.length,
        birthdays: upcomingBirthdays.map((e: EmployeeProfile) => e.display_name || e.full_name),
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-birthday-reminders function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
