import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Checking for expired assistant assignments...");

    // Find assignments that are:
    // - Status = 'assigned'
    // - Not yet accepted (accepted_at IS NULL)
    // - Past the deadline (assigned_at + response_deadline_hours < now)
    const { data: expiredRequests, error: fetchError } = await supabase
      .from("assistant_requests")
      .select(`
        *,
        salon_services (name, duration_minutes)
      `)
      .eq("status", "assigned")
      .is("accepted_at", null)
      .not("assigned_at", "is", null)
      .not("assistant_id", "is", null);

    if (fetchError) {
      console.error("Error fetching requests:", fetchError);
      return new Response(
        JSON.stringify({ error: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const now = new Date();
    let reassignedCount = 0;
    const results: any[] = [];

    for (const request of expiredRequests || []) {
      const assignedAt = new Date(request.assigned_at);
      const deadlineHours = request.response_deadline_hours || 2;
      const deadline = new Date(assignedAt.getTime() + deadlineHours * 60 * 60 * 1000);

      if (now > deadline) {
        console.log(`Request ${request.id} has expired, reassigning...`);

        const declinedAssistant = request.assistant_id;

        // Get assistant info for logging
        const { data: assistantProfile } = await supabase
          .from("employee_profiles")
          .select("full_name, display_name")
          .eq("user_id", declinedAssistant)
          .single();

        const assistantName = assistantProfile?.display_name || assistantProfile?.full_name || "Assistant";

        // Get stylist info
        const { data: stylistProfile } = await supabase
          .from("employee_profiles")
          .select("full_name, display_name, email")
          .eq("user_id", request.stylist_id)
          .single();

        const stylistName = stylistProfile?.display_name || stylistProfile?.full_name || "Stylist";

        // Add to declined_by array
        const declinedByArray = [...(request.declined_by || []), declinedAssistant];

        // Get all assistants with the 'stylist_assistant' or legacy 'assistant' role
        const { data: assistantRoles } = await supabase
          .from("user_roles")
          .select("user_id")
          .in("role", ["stylist_assistant", "assistant"]);

        const assistantUserIds = (assistantRoles || []).map(r => r.user_id);
        const eligibleAssistants = assistantUserIds.filter(id => !declinedByArray.includes(id));

        // Check for conflicts
        const { data: conflicts } = await supabase
          .from("assistant_requests")
          .select("assistant_id")
          .eq("request_date", request.request_date)
          .eq("status", "assigned")
          .not("assistant_id", "is", null)
          .neq("id", request.id)
          .or(`and(start_time.lte.${request.start_time},end_time.gt.${request.start_time}),and(start_time.lt.${request.end_time},end_time.gte.${request.end_time}),and(start_time.gte.${request.start_time},end_time.lte.${request.end_time})`);

        const busyAssistants = new Set(conflicts?.map(c => c.assistant_id) || []);
        const availableAssistants = eligibleAssistants.filter(id => !busyAssistants.has(id));

        let newAssistantName = null;

        if (availableAssistants.length > 0) {
          // Get assignment records for round-robin
          const { data: assignments } = await supabase
            .from("assistant_assignments")
            .select("*")
            .in("assistant_id", availableAssistants)
            .order("total_assignments", { ascending: true })
            .order("last_assigned_at", { ascending: true });

          if (assignments?.length) {
            const selectedAssistant = assignments[0];

            // Update the request with new assistant
            await supabase
              .from("assistant_requests")
              .update({
                assistant_id: selectedAssistant.assistant_id,
                assigned_at: new Date().toISOString(),
                accepted_at: null,
                declined_by: declinedByArray,
              })
              .eq("id", request.id);

            // Update assignment tracking
            await supabase
              .from("assistant_assignments")
              .update({
                last_assigned_at: new Date().toISOString(),
                total_assignments: selectedAssistant.total_assignments + 1
              })
              .eq("id", selectedAssistant.id);

            // Get new assistant's info
            const { data: newAssistantProfile } = await supabase
              .from("employee_profiles")
              .select("email, full_name, display_name")
              .eq("user_id", selectedAssistant.assistant_id)
              .single();

            newAssistantName = newAssistantProfile?.display_name || newAssistantProfile?.full_name;

            // Send email to new assistant
            if (resendApiKey && newAssistantProfile?.email) {
              try {
                const resend = new Resend(resendApiKey);
                const formattedDate = new Date(request.request_date).toLocaleDateString('en-US', {
                  weekday: 'long', month: 'long', day: 'numeric'
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
                  to: [newAssistantProfile.email],
                  subject: `New Assistant Assignment - ${formattedDate}`,
                  html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                      <h2 style="color: #333;">You've Been Assigned!</h2>
                      <p>Hi ${newAssistantName},</p>
                      <p>You've been assigned to help with a client. Please respond within 2 hours.</p>
                      <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p><strong>Stylist:</strong> ${stylistName}</p>
                        <p><strong>Client:</strong> ${request.client_name}</p>
                        <p><strong>Service:</strong> ${request.salon_services?.name}</p>
                        <p><strong>Date:</strong> ${formattedDate}</p>
                        <p><strong>Time:</strong> ${formatTime(request.start_time)} - ${formatTime(request.end_time)}</p>
                      </div>
                      <p>Please accept or decline this assignment in your dashboard.</p>
                    </div>
                  `,
                });
              } catch (emailError) {
                console.error("Failed to send email to new assistant:", emailError);
              }
            }

            reassignedCount++;
          } else {
            // No available assistants, set to pending
            await supabase
              .from("assistant_requests")
              .update({
                assistant_id: null,
                status: "pending",
                assigned_at: null,
                declined_by: declinedByArray,
              })
              .eq("id", request.id);
          }
        } else {
          // No eligible assistants, set to pending
          await supabase
            .from("assistant_requests")
            .update({
              assistant_id: null,
              status: "pending",
              assigned_at: null,
              declined_by: declinedByArray,
            })
            .eq("id", request.id);
        }

        // Notify stylist about the timeout/reassignment
        if (resendApiKey && stylistProfile?.email) {
          try {
            const resend = new Resend(resendApiKey);
            const formattedDate = new Date(request.request_date).toLocaleDateString('en-US', {
              weekday: 'long', month: 'long', day: 'numeric'
            });

            const formatTime = (time: string) => {
              const [hours, minutes] = time.split(':');
              const hour = parseInt(hours);
              const ampm = hour >= 12 ? 'PM' : 'AM';
              const hour12 = hour % 12 || 12;
              return `${hour12}:${minutes} ${ampm}`;
            };

            const statusMessage = newAssistantName
              ? `The request has been automatically reassigned to <strong>${newAssistantName}</strong>.`
              : `The request is now pending and awaiting a new assistant to become available.`;

            await resend.emails.send({
              from: "Drop Dead 75 <onboarding@resend.dev>",
              to: [stylistProfile.email],
              subject: `Assistant Request Update - Response Timeout`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #333;">Assignment Update</h2>
                  <p>Hi ${stylistName},</p>
                  <p><strong>${assistantName}</strong> did not respond to your assistant request within the ${deadlineHours}-hour deadline.</p>
                  <p>${statusMessage}</p>
                  <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Client:</strong> ${request.client_name}</p>
                    <p><strong>Service:</strong> ${request.salon_services?.name}</p>
                    <p><strong>Date:</strong> ${formattedDate}</p>
                    <p><strong>Time:</strong> ${formatTime(request.start_time)} - ${formatTime(request.end_time)}</p>
                  </div>
                  <p>You can check the status in your dashboard.</p>
                </div>
              `,
            });
          } catch (emailError) {
            console.error("Failed to send email to stylist:", emailError);
          }
        }

        // Create in-app notification for stylist
        await supabase
          .from("notifications")
          .insert({
            user_id: request.stylist_id,
            type: "assistant_timeout",
            title: "Assistant Request Update",
            message: newAssistantName
              ? `${assistantName} didn't respond in time. Your request was reassigned to ${newAssistantName}.`
              : `${assistantName} didn't respond in time. Your request is now pending.`,
            link: "/dashboard/assistant-schedule",
          });

        results.push({
          request_id: request.id,
          previous_assistant: assistantName,
          new_assistant: newAssistantName,
          reassigned: !!newAssistantName,
        });
      }
    }

    console.log(`Processed ${results.length} expired assignments, reassigned ${reassignedCount}`);

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        reassigned: reassignedCount,
        results,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error in check-expired-assignments:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});