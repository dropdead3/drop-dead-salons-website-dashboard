import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReassignRequest {
  request_id: string;
  declined_by: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { request_id, declined_by }: ReassignRequest = await req.json();
    console.log("Reassigning request:", request_id, "declined by:", declined_by);

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

    // Add the declining assistant to the declined_by array
    const declinedByArray = [...(request.declined_by || []), declined_by];

    // Get stylist info
    const { data: stylistProfile } = await supabase
      .from("employee_profiles")
      .select("full_name, display_name, email")
      .eq("user_id", request.stylist_id)
      .single();

    const stylistName = stylistProfile?.display_name || stylistProfile?.full_name || "A stylist";

    // Get declining assistant's info
    const { data: decliningAssistantProfile } = await supabase
      .from("employee_profiles")
      .select("full_name, display_name")
      .eq("user_id", declined_by)
      .single();

    const decliningAssistantName = decliningAssistantProfile?.display_name || decliningAssistantProfile?.full_name || "An assistant";

    // Get all assistants with the 'stylist_assistant' or legacy 'assistant' role
    const { data: assistantRoles, error: rolesError } = await supabase
      .from("user_roles")
      .select("user_id")
      .in("role", ["stylist_assistant", "assistant"]);

    if (rolesError || !assistantRoles?.length) {
      console.error("No assistants found:", rolesError);
      // Update request to pending with no assistant
      await supabase
        .from("assistant_requests")
        .update({
          assistant_id: null,
          status: "pending",
          declined_by: declinedByArray,
        })
        .eq("id", request_id);

      return new Response(
        JSON.stringify({ error: "No assistants available", reassigned: false }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const assistantUserIds = assistantRoles.map(r => r.user_id);

    // Filter out assistants who have already declined this request
    const eligibleAssistants = assistantUserIds.filter(id => !declinedByArray.includes(id));

    if (eligibleAssistants.length === 0) {
      console.log("All assistants have declined this request");
      await supabase
        .from("assistant_requests")
        .update({
          assistant_id: null,
          status: "pending",
          declined_by: declinedByArray,
        })
        .eq("id", request_id);

      return new Response(
        JSON.stringify({ error: "All assistants have declined", reassigned: false }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check for conflicts - assistants already booked during this time slot
    const { data: conflicts } = await supabase
      .from("assistant_requests")
      .select("assistant_id")
      .eq("request_date", request.request_date)
      .eq("status", "assigned")
      .not("assistant_id", "is", null)
      .neq("id", request_id) // Exclude current request
      .or(`and(start_time.lte.${request.start_time},end_time.gt.${request.start_time}),and(start_time.lt.${request.end_time},end_time.gte.${request.end_time}),and(start_time.gte.${request.start_time},end_time.lte.${request.end_time})`);

    const busyAssistants = new Set(conflicts?.map(c => c.assistant_id) || []);
    const availableAssistants = eligibleAssistants.filter(id => !busyAssistants.has(id));

    if (availableAssistants.length === 0) {
      console.log("No available assistants for this time slot");
      await supabase
        .from("assistant_requests")
        .update({
          assistant_id: null,
          status: "pending",
          declined_by: declinedByArray,
        })
        .eq("id", request_id);

      return new Response(
        JSON.stringify({ error: "No assistants available for this time slot", reassigned: false }),
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
    console.log("Reassigned to assistant:", selectedAssistant.assistant_id);

    // Update the request with the new assigned assistant
    const { error: updateError } = await supabase
      .from("assistant_requests")
      .update({
        assistant_id: selectedAssistant.assistant_id,
        status: "assigned",
        accepted_at: null,
        declined_by: declinedByArray,
        assigned_at: new Date().toISOString(),
      })
      .eq("id", request_id);

    if (updateError) {
      console.error("Failed to update request:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to reassign assistant" }),
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

    // Get new assistant's email for notification
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
              <p>Please accept or decline this assignment in your dashboard.</p>
              <p>Best,<br>Drop Dead 75 Team</p>
            </div>
          `,
        });
        console.log("Email notification sent to:", assistantProfile.email);
      } catch (emailError) {
        console.error("Failed to send email:", emailError);
      }
    }

    // Notify stylist about the decline and reassignment
    if (resendApiKey && stylistProfile?.email) {
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

        const newAssistantName = assistantProfile?.display_name || assistantProfile?.full_name;

        await resend.emails.send({
          from: "Drop Dead 75 <onboarding@resend.dev>",
          to: [stylistProfile.email],
          subject: `Assistant Request Reassigned`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Assignment Update</h2>
              <p>Hi ${stylistName},</p>
              <p><strong>${decliningAssistantName}</strong> has declined your assistant request.</p>
              <p>Your request has been automatically reassigned to <strong>${newAssistantName}</strong>.</p>
              <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Client:</strong> ${request.client_name}</p>
                <p><strong>Service:</strong> ${request.salon_services?.name}</p>
                <p><strong>Date:</strong> ${formattedDate}</p>
                <p><strong>Time:</strong> ${formatTime(request.start_time)} - ${formatTime(request.end_time)}</p>
                <p><strong>New Assistant:</strong> ${newAssistantName}</p>
              </div>
              <p>You can check the status in your dashboard.</p>
              <p>Best,<br>Drop Dead 75 Team</p>
            </div>
          `,
        });
        console.log("Stylist notification sent to:", stylistProfile.email);
      } catch (emailError) {
        console.error("Failed to send stylist notification:", emailError);
      }
    }

    // Create in-app notification for stylist
    await supabase
      .from("notifications")
      .insert({
        user_id: request.stylist_id,
        type: "assistant_declined",
        title: "Assistant Request Reassigned",
        message: `${decliningAssistantName} declined. Your request was reassigned to ${assistantProfile?.display_name || assistantProfile?.full_name || 'another assistant'}.`,
        link: "/dashboard/assistant-schedule",
      });

    return new Response(
      JSON.stringify({
        success: true,
        reassigned: true,
        assistant_id: selectedAssistant.assistant_id,
        assistant_name: assistantProfile?.display_name || assistantProfile?.full_name
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error in reassign-assistant:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});