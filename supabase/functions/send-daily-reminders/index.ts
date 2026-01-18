import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");



const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface StylistWithIncomplete {
  user_id: string;
  current_day: number;
  email: string;
  full_name: string;
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting daily reminder check...");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get today's date
    const today = new Date().toISOString().split("T")[0];

    // Find active enrollments without today's completion
    const { data: enrollments, error: enrollmentError } = await supabase
      .from("stylist_program_enrollment")
      .select(`
        id,
        user_id,
        current_day,
        status
      `)
      .eq("status", "active");

    if (enrollmentError) {
      console.error("Error fetching enrollments:", enrollmentError);
      throw enrollmentError;
    }

    console.log(`Found ${enrollments?.length || 0} active enrollments`);

    const stylistsToRemind: StylistWithIncomplete[] = [];

    for (const enrollment of enrollments || []) {
      // Check if today's completion exists and is complete
      const { data: completion } = await supabase
        .from("daily_completions")
        .select("is_complete")
        .eq("enrollment_id", enrollment.id)
        .eq("day_number", enrollment.current_day)
        .maybeSingle();

      // If no completion or not complete, add to remind list
      if (!completion?.is_complete) {
        // Get user email from employee_profiles
        const { data: profile } = await supabase
          .from("employee_profiles")
          .select("email, full_name")
          .eq("user_id", enrollment.user_id)
          .single();

        if (profile?.email) {
          stylistsToRemind.push({
            user_id: enrollment.user_id,
            current_day: enrollment.current_day,
            email: profile.email,
            full_name: profile.full_name,
          });
        }
      }
    }

    console.log(`Sending reminders to ${stylistsToRemind.length} stylists`);

    const emailResults = [];

    for (const stylist of stylistsToRemind) {
      try {
        const emailRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "Drop Dead 75 <onboarding@resend.dev>",
            to: [stylist.email],
            subject: `⏰ Day ${stylist.current_day} Check-In Reminder`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="font-size: 24px; margin-bottom: 16px;">Hey ${stylist.full_name}!</h1>
                
                <p style="font-size: 16px; line-height: 1.6; color: #333;">
                  You haven't completed your <strong>Day ${stylist.current_day}</strong> check-in yet.
                </p>
                
                <p style="font-size: 16px; line-height: 1.6; color: #333;">
                  Remember, missing a day means restarting the entire 75-day program. Don't let today be that day!
                </p>
                
                <div style="margin: 32px 0;">
                  <a href="${Deno.env.get("SITE_URL") || "https://dropdeadgorgeous.com"}/dashboard" 
                     style="background: #000; color: #fff; padding: 16px 32px; text-decoration: none; font-weight: bold; display: inline-block;">
                    COMPLETE DAY ${stylist.current_day} NOW
                  </a>
                </div>
                
                <p style="font-size: 14px; color: #666;">
                  Today's tasks:
                </p>
                <ul style="font-size: 14px; color: #666; line-height: 1.8;">
                  <li>Post content (reel, story, or carousel)</li>
                  <li>Respond to all DMs within 2 hours</li>
                  <li>Follow up with 3 potential clients</li>
                  <li>Log your daily metrics</li>
                  <li>Upload proof of work</li>
                </ul>
                
                <p style="font-size: 14px; color: #999; margin-top: 32px;">
                  You've got this. No excuses. 💪
                </p>
              </div>
            `,
          }),
        });

        const result = await emailRes.json();
        console.log(`Email sent to ${stylist.email}:`, result);
        emailResults.push({ email: stylist.email, success: emailRes.ok, result });
      } catch (emailError) {
        console.error(`Failed to send email to ${stylist.email}:`, emailError);
        emailResults.push({ email: stylist.email, success: false, error: String(emailError) });
      }
    }

    return new Response(
      JSON.stringify({
        message: "Daily reminders processed",
        totalChecked: enrollments?.length || 0,
        remindersNeeded: stylistsToRemind.length,
        results: emailResults,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in send-daily-reminders:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
