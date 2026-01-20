import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  request_id: string;
  action: 'accepted' | 'declined';
  assistant_id: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      console.log("RESEND_API_KEY not configured, skipping email notification");
      return new Response(
        JSON.stringify({ success: true, message: "Email notifications not configured" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = new Resend(resendApiKey);

    const { request_id, action, assistant_id }: NotificationRequest = await req.json();
    console.log(`Processing ${action} notification for request:`, request_id);

    // Get the request details
    const { data: request, error: requestError } = await supabase
      .from("assistant_requests")
      .select(`
        *,
        salon_services (name, duration_minutes)
      `)
      .eq("id", request_id)
      .single();

    if (requestError || !request) {
      console.error("Request not found:", requestError);
      return new Response(
        JSON.stringify({ error: "Request not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get stylist profile and email
    const { data: stylistProfile } = await supabase
      .from("employee_profiles")
      .select("full_name, display_name, email")
      .eq("user_id", request.stylist_id)
      .single();

    // Get assistant profile
    const { data: assistantProfile } = await supabase
      .from("employee_profiles")
      .select("full_name, display_name, email")
      .eq("user_id", assistant_id)
      .single();

    const stylistName = stylistProfile?.display_name || stylistProfile?.full_name || "Stylist";
    const assistantName = assistantProfile?.display_name || assistantProfile?.full_name || "Assistant";

    const formattedDate = new Date(request.request_date).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });

    const formatTime = (time: string) => {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      return `${hour12}:${minutes} ${ampm}`;
    };

    // Send notification to stylist
    if (stylistProfile?.email) {
      try {
        if (action === 'accepted') {
          await resend.emails.send({
            from: "Drop Dead 75 <onboarding@resend.dev>",
            to: [stylistProfile.email],
            subject: `✅ Assistant Confirmed - ${formattedDate}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #22c55e;">Assistant Confirmed!</h2>
                <p>Hi ${stylistName},</p>
                <p><strong>${assistantName}</strong> has confirmed they will assist you with your client.</p>
                <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #22c55e;">
                  <p style="margin: 0 0 8px 0;"><strong>Client:</strong> ${request.client_name}</p>
                  <p style="margin: 0 0 8px 0;"><strong>Service:</strong> ${request.salon_services?.name}</p>
                  <p style="margin: 0 0 8px 0;"><strong>Date:</strong> ${formattedDate}</p>
                  <p style="margin: 0;"><strong>Time:</strong> ${formatTime(request.start_time)} - ${formatTime(request.end_time)}</p>
                </div>
                <p>Your assistant will be ready at the scheduled time.</p>
                <p>Best,<br>Drop Dead 75 Team</p>
              </div>
            `,
          });
          console.log("Acceptance email sent to stylist:", stylistProfile.email);
        } else if (action === 'declined') {
          await resend.emails.send({
            from: "Drop Dead 75 <onboarding@resend.dev>",
            to: [stylistProfile.email],
            subject: `⚠️ Assistant Change - ${formattedDate}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #f59e0b;">Assignment Update</h2>
                <p>Hi ${stylistName},</p>
                <p><strong>${assistantName}</strong> was unable to take this assignment and has declined.</p>
                <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                  <p style="margin: 0 0 8px 0;"><strong>Client:</strong> ${request.client_name}</p>
                  <p style="margin: 0 0 8px 0;"><strong>Service:</strong> ${request.salon_services?.name}</p>
                  <p style="margin: 0 0 8px 0;"><strong>Date:</strong> ${formattedDate}</p>
                  <p style="margin: 0;"><strong>Time:</strong> ${formatTime(request.start_time)} - ${formatTime(request.end_time)}</p>
                </div>
                <p>We're automatically looking for another available assistant. You'll receive a notification when a new assistant is assigned.</p>
                <p>Best,<br>Drop Dead 75 Team</p>
              </div>
            `,
          });
          console.log("Decline email sent to stylist:", stylistProfile.email);
        }
      } catch (emailError) {
        console.error("Failed to send stylist email:", emailError);
      }
    }

    // Create in-app notification for the stylist
    const notificationTitle = action === 'accepted' 
      ? `${assistantName} confirmed your request`
      : `${assistantName} declined - reassigning`;
    
    const notificationMessage = action === 'accepted'
      ? `Your assistant request for ${request.client_name} on ${formattedDate} has been confirmed.`
      : `${assistantName} was unable to assist with ${request.client_name} on ${formattedDate}. We're finding a replacement.`;

    await supabase.from("notifications").insert({
      user_id: request.stylist_id,
      type: action === 'accepted' ? 'assignment_accepted' : 'assignment_declined',
      title: notificationTitle,
      message: notificationMessage,
      link: '/dashboard/assistant-schedule',
      metadata: { request_id, assistant_id, action }
    });

    // Send push notification to stylist
    try {
      await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({
          user_id: request.stylist_id,
          title: action === 'accepted' ? "Assistant Confirmed ✅" : "Assignment Update ⚠️",
          body: notificationMessage,
          url: "/dashboard/assistant-schedule",
          tag: "assignment-response",
        }),
      });
    } catch (pushError) {
      console.error("Failed to send push notification:", pushError);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error in notify-assignment-response:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
