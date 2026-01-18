import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AssignmentRequest {
  request_id: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { request_id }: AssignmentRequest = await req.json();
    console.log("Processing assignment for request:", request_id);

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

    // Get stylist info
    const { data: stylistProfile } = await supabase
      .from("employee_profiles")
      .select("full_name, display_name")
      .eq("user_id", request.stylist_id)
      .single();

    const stylistName = stylistProfile?.display_name || stylistProfile?.full_name || "A stylist";

    // Get all assistants with the 'assistant' role
    const { data: assistantRoles, error: rolesError } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "assistant");

    if (rolesError || !assistantRoles?.length) {
      console.error("No assistants found:", rolesError);
      return new Response(
        JSON.stringify({ error: "No assistants available", assigned: false }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const assistantUserIds = assistantRoles.map(r => r.user_id);
    console.log("Found assistants:", assistantUserIds.length);

    // Check for conflicts - assistants already booked during this time slot
    const { data: conflicts } = await supabase
      .from("assistant_requests")
      .select("assistant_id")
      .eq("request_date", request.request_date)
      .eq("status", "assigned")
      .not("assistant_id", "is", null)
      .or(`and(start_time.lte.${request.start_time},end_time.gt.${request.start_time}),and(start_time.lt.${request.end_time},end_time.gte.${request.end_time}),and(start_time.gte.${request.start_time},end_time.lte.${request.end_time})`);

    const busyAssistants = new Set(conflicts?.map(c => c.assistant_id) || []);
    const availableAssistants = assistantUserIds.filter(id => !busyAssistants.has(id));

    if (availableAssistants.length === 0) {
      console.log("No available assistants for this time slot");
      return new Response(
        JSON.stringify({ error: "No assistants available for this time slot", assigned: false }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get or create assignment records for round-robin
    const { data: assignments } = await supabase
      .from("assistant_assignments")
      .select("*")
      .in("assistant_id", availableAssistants);

    // Find assistants without assignment records and create them
    const existingAssistantIds = new Set(assignments?.map(a => a.assistant_id) || []);
    const newAssistants = availableAssistants.filter(id => !existingAssistantIds.has(id));

    if (newAssistants.length > 0) {
      await supabase
        .from("assistant_assignments")
        .insert(newAssistants.map(id => ({ assistant_id: id, total_assignments: 0 })));
    }

    // Re-fetch all assignments for available assistants
    const { data: allAssignments } = await supabase
      .from("assistant_assignments")
      .select("*")
      .in("assistant_id", availableAssistants)
      .order("total_assignments", { ascending: true })
      .order("last_assigned_at", { ascending: true });

    if (!allAssignments?.length) {
      console.error("Could not get assignment records");
      return new Response(
        JSON.stringify({ error: "Assignment error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Pick the assistant with fewest assignments (round-robin)
    const selectedAssistant = allAssignments[0];
    console.log("Selected assistant:", selectedAssistant.assistant_id);

    // Update the request with the assigned assistant
    const { error: updateError } = await supabase
      .from("assistant_requests")
      .update({
        assistant_id: selectedAssistant.assistant_id,
        status: "assigned"
      })
      .eq("id", request_id);

    if (updateError) {
      console.error("Failed to update request:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to assign assistant" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update assignment tracking
    await supabase
      .from("assistant_assignments")
      .update({
        last_assigned_at: new Date().toISOString(),
        total_assignments: selectedAssistant.total_assignments + 1
      })
      .eq("id", selectedAssistant.id);

    // Get assistant's email for notification
    const { data: assistantProfile } = await supabase
      .from("employee_profiles")
      .select("email, full_name, display_name")
      .eq("user_id", selectedAssistant.assistant_id)
      .single();

    // Send email notification if Resend is configured
    if (resendApiKey && assistantProfile?.email) {
      try {
        const resend = new Resend(resendApiKey);
        
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

        await resend.emails.send({
          from: "Drop Dead 75 <onboarding@resend.dev>",
          to: [assistantProfile.email],
          subject: `New Assistant Assignment - ${formattedDate}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">You've Been Assigned!</h2>
              <p>Hi ${assistantProfile.display_name || assistantProfile.full_name},</p>
              <p>You've been assigned to help with a client. Here are the details:</p>
              <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Stylist:</strong> ${stylistName}</p>
                <p><strong>Client:</strong> ${request.client_name}</p>
                <p><strong>Service:</strong> ${request.salon_services?.name}</p>
                <p><strong>Date:</strong> ${formattedDate}</p>
                <p><strong>Time:</strong> ${formatTime(request.start_time)} - ${formatTime(request.end_time)}</p>
                ${request.notes ? `<p><strong>Notes:</strong> ${request.notes}</p>` : ''}
              </div>
              <p>Please be ready at your station before the scheduled time.</p>
              <p>Best,<br>Drop Dead 75 Team</p>
            </div>
          `,
        });
        console.log("Email notification sent to:", assistantProfile.email);
      } catch (emailError) {
        console.error("Failed to send email:", emailError);
        // Don't fail the whole request if email fails
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        assigned: true,
        assistant_id: selectedAssistant.assistant_id,
        assistant_name: assistantProfile?.display_name || assistantProfile?.full_name
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error in assign-assistant:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});