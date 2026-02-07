import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface TrainingAssignment {
  id: string;
  video_id: string;
  user_id: string;
  due_date: string;
  is_required: boolean;
  training_videos: {
    title: string;
    description: string | null;
  };
}

interface UserProfile {
  user_id: string;
  email: string;
  full_name: string | null;
  display_name: string | null;
}

interface NotificationPreference {
  user_id: string;
  task_reminder_enabled: boolean;
  email_notifications_enabled: boolean;
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

    const now = new Date();
    const threeDaysFromNow = new Date(now);
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    // Fetch all training assignments with due dates
    const { data: assignments, error: assignmentsError } = await supabase
      .from("training_assignments")
      .select(`
        id,
        video_id,
        user_id,
        due_date,
        is_required,
        training_videos (
          title,
          description
        )
      `)
      .not("due_date", "is", null)
      .lte("due_date", threeDaysFromNow.toISOString());

    if (assignmentsError) {
      console.error("Error fetching assignments:", assignmentsError);
      throw assignmentsError;
    }

    if (!assignments || assignments.length === 0) {
      console.log("No assignments with upcoming or overdue due dates");
      return new Response(
        JSON.stringify({ message: "No reminders to send", sent: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch training progress to filter out completed trainings
    const videoIds = [...new Set(assignments.map((a) => a.video_id))];
    const userIds = [...new Set(assignments.map((a) => a.user_id))];

    const { data: completedProgress, error: progressError } = await supabase
      .from("training_progress")
      .select("user_id, video_id")
      .in("video_id", videoIds)
      .in("user_id", userIds)
      .not("completed_at", "is", null);

    if (progressError) {
      console.error("Error fetching progress:", progressError);
      throw progressError;
    }

    // Create a set of completed user-video pairs
    const completedSet = new Set(
      (completedProgress || []).map((p) => `${p.user_id}-${p.video_id}`)
    );

    // Filter to only incomplete assignments
    const incompleteAssignments = assignments.filter(
      (a) => !completedSet.has(`${a.user_id}-${a.video_id}`)
    );

    if (incompleteAssignments.length === 0) {
      console.log("All assignments are completed");
      return new Response(
        JSON.stringify({ message: "No incomplete assignments", sent: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch user profiles
    const { data: profiles, error: profilesError } = await supabase
      .from("employee_profiles")
      .select("user_id, email, full_name, display_name")
      .in("user_id", userIds);

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      throw profilesError;
    }

    const profileMap = new Map<string, UserProfile>(
      (profiles || []).map((p) => [p.user_id, p])
    );

    // Fetch notification preferences
    const { data: preferences, error: prefsError } = await supabase
      .from("notification_preferences")
      .select("user_id, task_reminder_enabled, email_notifications_enabled")
      .in("user_id", userIds);

    if (prefsError) {
      console.error("Error fetching preferences:", prefsError);
    }

    const prefsMap = new Map<string, NotificationPreference>(
      (preferences || []).map((p) => [p.user_id, p])
    );

    // Fetch email templates
    const { data: templates, error: templatesError } = await supabase
      .from("email_templates")
      .select("template_key, subject, html_body")
      .in("template_key", ["training_reminder", "training_overdue"]);

    if (templatesError) {
      console.error("Error fetching templates:", templatesError);
    }

    const templateMap = new Map(
      (templates || []).map((t) => [t.template_key, t])
    );

    const resend = resendApiKey ? new Resend(resendApiKey) : null;
    let notificationsSent = 0;
    let emailsSent = 0;

    // Group assignments by user
    const userAssignments = new Map<string, TrainingAssignment[]>();
    for (const assignment of incompleteAssignments) {
      const existing = userAssignments.get(assignment.user_id) || [];
      existing.push(assignment as TrainingAssignment);
      userAssignments.set(assignment.user_id, existing);
    }

    // Process each user
    for (const [userId, userTrainings] of userAssignments) {
      const profile = profileMap.get(userId);
      if (!profile) continue;

      const prefs = prefsMap.get(userId);
      const taskRemindersEnabled = prefs?.task_reminder_enabled !== false;
      const emailEnabled = prefs?.email_notifications_enabled === true;

      // Determine which trainings are overdue vs due soon
      const overdueTrainings = userTrainings.filter(
        (t) => new Date(t.due_date) < now
      );
      const dueSoonTrainings = userTrainings.filter(
        (t) => new Date(t.due_date) >= now
      );

      const userName = profile.display_name || profile.full_name || "Team Member";

      // Send overdue notifications
      if (overdueTrainings.length > 0 && taskRemindersEnabled) {
        const trainingTitles = overdueTrainings
          .map((t) => t.training_videos?.title || "Training")
          .join(", ");

        // Insert in-app notification
        const { error: notifError } = await supabase
          .from("notifications")
          .insert({
            user_id: userId,
            type: "training_overdue",
            title: "Overdue Training",
            message: `You have ${overdueTrainings.length} overdue training(s): ${trainingTitles}`,
            metadata: {
              training_ids: overdueTrainings.map((t) => t.video_id),
              due_dates: overdueTrainings.map((t) => t.due_date),
            },
          });

        if (notifError) {
          console.error("Error inserting notification:", notifError);
        } else {
          notificationsSent++;
        }

        // Send email if enabled
        if (emailEnabled && resend && profile.email) {
          const template = templateMap.get("training_overdue");
          if (template) {
            const htmlBody = template.html_body
              .replace(/\{\{user_name\}\}/g, userName)
              .replace(/\{\{training_titles\}\}/g, trainingTitles)
              .replace(/\{\{count\}\}/g, String(overdueTrainings.length));

            try {
              await resend.emails.send({
                from: "Training <noreply@dropdeadsalons.com>",
                to: [profile.email],
                subject: template.subject.replace(
                  /\{\{count\}\}/g,
                  String(overdueTrainings.length)
                ),
                html: htmlBody,
              });
              emailsSent++;
            } catch (emailError) {
              console.error("Error sending email:", emailError);
            }
          }
        }
      }

      // Send due soon notifications
      if (dueSoonTrainings.length > 0 && taskRemindersEnabled) {
        const trainingTitles = dueSoonTrainings
          .map((t) => t.training_videos?.title || "Training")
          .join(", ");

        // Insert in-app notification
        const { error: notifError } = await supabase
          .from("notifications")
          .insert({
            user_id: userId,
            type: "training_due_soon",
            title: "Training Due Soon",
            message: `You have ${dueSoonTrainings.length} training(s) due soon: ${trainingTitles}`,
            metadata: {
              training_ids: dueSoonTrainings.map((t) => t.video_id),
              due_dates: dueSoonTrainings.map((t) => t.due_date),
            },
          });

        if (notifError) {
          console.error("Error inserting notification:", notifError);
        } else {
          notificationsSent++;
        }

        // Send email if enabled
        if (emailEnabled && resend && profile.email) {
          const template = templateMap.get("training_reminder");
          if (template) {
            const htmlBody = template.html_body
              .replace(/\{\{user_name\}\}/g, userName)
              .replace(/\{\{training_titles\}\}/g, trainingTitles)
              .replace(/\{\{count\}\}/g, String(dueSoonTrainings.length));

            try {
              await resend.emails.send({
                from: "Training <noreply@dropdeadsalons.com>",
                to: [profile.email],
                subject: template.subject.replace(
                  /\{\{training_title\}\}/g,
                  dueSoonTrainings[0].training_videos?.title || "Training"
                ),
                html: htmlBody,
              });
              emailsSent++;
            } catch (emailError) {
              console.error("Error sending email:", emailError);
            }
          }
        }
      }
    }

    console.log(
      `Sent ${notificationsSent} notifications and ${emailsSent} emails`
    );

    return new Response(
      JSON.stringify({
        message: "Training reminders sent",
        notificationsSent,
        emailsSent,
        usersProcessed: userAssignments.size,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in send-training-reminders:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
