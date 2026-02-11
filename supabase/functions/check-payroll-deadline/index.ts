import { createClient } from "@supabase/supabase-js";
import { sendEmail, formatEmailDate } from "../_shared/email-sender.ts";
import { sendSms } from "../_shared/sms-sender.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PayrollSettings {
  organization_id: string;
  pay_schedule_type: string;
  semi_monthly_first_day: number;
  semi_monthly_second_day: number;
  bi_weekly_day_of_week: number;
  bi_weekly_start_date: string | null;
  weekly_day_of_week: number;
  monthly_pay_day: number;
  days_until_check: number;
}

function getCurrentPeriodEnd(settings: PayrollSettings, today: Date): Date | null {
  const year = today.getFullYear();
  const month = today.getMonth();
  const day = today.getDate();

  switch (settings.pay_schedule_type) {
    case "semi_monthly": {
      const { semi_monthly_first_day, semi_monthly_second_day } = settings;
      if (day <= semi_monthly_first_day) {
        // End of previous period
        return new Date(year, month, semi_monthly_first_day - 1);
      }
      if (day <= semi_monthly_second_day) {
        return new Date(year, month, semi_monthly_second_day - 1);
      }
      // End of month
      return new Date(year, month + 1, 0);
    }
    case "monthly":
      return new Date(year, month + 1, 0); // Last day of month
    case "weekly": {
      // Period ends on day_of_week
      const todayDow = today.getDay();
      const diff = (settings.weekly_day_of_week - todayDow + 7) % 7;
      const end = new Date(today);
      end.setDate(day + diff);
      return end;
    }
    default:
      return null;
  }
}

function getCurrentPeriodStart(settings: PayrollSettings, today: Date): Date | null {
  const year = today.getFullYear();
  const month = today.getMonth();
  const day = today.getDate();

  switch (settings.pay_schedule_type) {
    case "semi_monthly": {
      const { semi_monthly_first_day, semi_monthly_second_day } = settings;
      if (day >= semi_monthly_second_day) {
        return new Date(year, month, semi_monthly_second_day);
      }
      if (day >= semi_monthly_first_day) {
        return new Date(year, month, semi_monthly_first_day);
      }
      // Previous month second period
      return new Date(year, month - 1, semi_monthly_second_day);
    }
    case "monthly":
      return new Date(year, month, 1);
    case "weekly": {
      const todayDow = today.getDay();
      const startDow = (settings.weekly_day_of_week + 1) % 7;
      const diff = (todayDow - startDow + 7) % 7;
      const start = new Date(today);
      start.setDate(day - diff);
      return start;
    }
    default:
      return null;
  }
}

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function formatDisplayDate(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function buildDeadlineTodayEmail(periodRange: string, checkDate: string, actionUrl: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f9fafb;padding:40px 20px;">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;border:1px solid #e5e7eb;">
    <h1 style="font-size:20px;margin:0 0 8px;color:#111827;">Payroll Submission Due Today</h1>
    <p style="font-size:14px;color:#6b7280;margin:0 0 20px;">Period: ${periodRange} · Check Date: ${checkDate}</p>
    <p style="font-size:14px;color:#374151;margin:0 0 24px;">
      Your payroll submission for this period is due today. Please review and submit before end of day to ensure timely processing.
    </p>
    <a href="${actionUrl}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">
      Run Payroll →
    </a>
  </div>
</body>
</html>`;
}

function buildDeadlineMissedEmail(periodRange: string, deadlineDate: string, actionUrl: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#fef2f2;padding:40px 20px;">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;border:1px solid #fca5a5;">
    <div style="background:#fef2f2;border-radius:8px;padding:12px 16px;margin:0 0 20px;display:flex;align-items:center;gap:8px;">
      <span style="font-size:18px;">⚠️</span>
      <span style="font-size:14px;font-weight:600;color:#991b1b;">URGENT: Payroll Deadline Missed</span>
    </div>
    <p style="font-size:14px;color:#374151;margin:0 0 8px;">
      Payroll for <strong>${periodRange}</strong> was due on <strong>${deadlineDate}</strong> and has not been submitted.
    </p>
    <p style="font-size:14px;color:#374151;margin:0 0 24px;">
      Please submit payroll immediately to avoid delays in employee pay.
    </p>
    <a href="${actionUrl}" style="display:inline-block;background:#dc2626;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">
      Run Payroll Now →
    </a>
  </div>
</body>
</html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const today = new Date();
    const todayStr = formatDate(today);

    console.log(`[check-payroll-deadline] Running for date: ${todayStr}`);

    // Fetch all orgs with payroll settings
    const { data: allSettings, error: settingsError } = await supabase
      .from("organization_payroll_settings")
      .select("*");

    if (settingsError) {
      throw new Error(`Failed to fetch payroll settings: ${settingsError.message}`);
    }

    if (!allSettings?.length) {
      console.log("[check-payroll-deadline] No organizations with payroll settings");
      return new Response(JSON.stringify({ processed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let notificationsSent = 0;

    for (const settings of allSettings) {
      const periodEnd = getCurrentPeriodEnd(settings as PayrollSettings, today);
      const periodStart = getCurrentPeriodStart(settings as PayrollSettings, today);

      if (!periodEnd || !periodStart) {
        console.log(`[check-payroll-deadline] Could not calculate period for org ${settings.organization_id}`);
        continue;
      }

      const periodEndStr = formatDate(periodEnd);
      const periodStartStr = formatDate(periodStart);

      // Determine notification type
      const isDeadlineDay = todayStr === periodEndStr;

      // Check if today is 1 day after deadline
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = formatDate(yesterday);
      const isMissedDeadline = yesterdayStr === periodEndStr;

      if (!isDeadlineDay && !isMissedDeadline) {
        continue; // Not a notification day for this org
      }

      // Check if payroll has been submitted for this period
      const { data: existingRuns } = await supabase
        .from("payroll_runs")
        .select("id")
        .eq("organization_id", settings.organization_id)
        .eq("pay_period_start", periodStartStr)
        .eq("pay_period_end", periodEndStr)
        .in("status", ["submitted", "processing", "processed", "completed"])
        .limit(1);

      if (existingRuns && existingRuns.length > 0) {
        console.log(`[check-payroll-deadline] Payroll already submitted for org ${settings.organization_id}`);
        continue;
      }

      console.log(`[check-payroll-deadline] ${isDeadlineDay ? "Deadline today" : "Missed deadline"} for org ${settings.organization_id}`);

      // Find users with manage_payroll permission
      const { data: payrollPermission } = await supabase
        .from("permissions")
        .select("id")
        .eq("name", "manage_payroll")
        .single();

      if (!payrollPermission) {
        console.log("[check-payroll-deadline] manage_payroll permission not found");
        continue;
      }

      // Get roles that have this permission
      const { data: rolePerms } = await supabase
        .from("role_permissions")
        .select("role")
        .eq("permission_id", payrollPermission.id);

      const roles = rolePerms?.map((rp) => rp.role) || [];

      if (roles.length === 0) {
        console.log("[check-payroll-deadline] No roles have manage_payroll permission");
        continue;
      }

      // Get users with those roles in this org
      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .in("role", roles);

      const userIds = [...new Set(userRoles?.map((ur) => ur.user_id) || [])];

      if (userIds.length === 0) continue;

      // Filter to users in this org and check notification preferences
      const { data: orgUsers } = await supabase
        .from("employee_profiles")
        .select("user_id, email")
        .eq("organization_id", settings.organization_id)
        .in("user_id", userIds)
        .eq("is_active", true);

      if (!orgUsers?.length) continue;

      const orgUserIds = orgUsers.map((u) => u.user_id);

      // Check notification preferences
      const { data: prefs } = await supabase
        .from("notification_preferences")
        .select("user_id, payroll_deadline_enabled, email_notifications_enabled")
        .in("user_id", orgUserIds);

      const prefsMap = new Map(prefs?.map((p) => [p.user_id, p]) || []);

      const periodRange = `${formatDisplayDate(periodStart)} – ${formatDisplayDate(periodEnd)}`;
      const deadlineDate = formatDisplayDate(periodEnd);
      const actionUrl = `${supabaseUrl.replace(".supabase.co", ".lovable.app")}/dashboard/admin/payroll`;
      const checkDate = formatDisplayDate(
        new Date(periodEnd.getTime() + settings.days_until_check * 86400000)
      );

      for (const user of orgUsers) {
        const userPref = prefsMap.get(user.user_id);
        // Default to enabled if no preference exists
        const isEnabled = userPref?.payroll_deadline_enabled !== false;

        if (!isEnabled) {
          console.log(`[check-payroll-deadline] Notifications disabled for user ${user.user_id}`);
          continue;
        }

        // Send email
        if (user.email) {
          const html = isDeadlineDay
            ? buildDeadlineTodayEmail(periodRange, checkDate, actionUrl)
            : buildDeadlineMissedEmail(periodRange, deadlineDate, actionUrl);

          await sendEmail({
            to: [user.email],
            subject: isDeadlineDay
              ? `Payroll submission due today – ${periodRange}`
              : `URGENT: Payroll deadline missed – ${periodRange}`,
            html,
          });
        }

        // Send push notification
        try {
          await supabase.functions.invoke("send-push-notification", {
            body: {
              user_id: user.user_id,
              title: isDeadlineDay ? "Payroll Due Today" : "⚠️ Payroll Overdue",
              body: isDeadlineDay
                ? `Payroll for ${periodRange} is due today. Submit before end of day.`
                : `Payroll for ${periodRange} was due ${deadlineDate} and has not been submitted.`,
              url: "/dashboard/admin/payroll",
            },
          });
        } catch (pushErr) {
          console.error(`[check-payroll-deadline] Push notification failed for ${user.user_id}:`, pushErr);
        }

        // Send SMS only for missed deadline (escalation)
        if (isMissedDeadline) {
          await sendSms(supabase, {
            to: user.email, // placeholder: would use phone number when available
            templateKey: "payroll_deadline_missed",
            variables: { period_range: periodRange, deadline_date: deadlineDate, action_url: actionUrl },
          });
        }

        notificationsSent++;
      }
    }

    console.log(`[check-payroll-deadline] Done. Notifications sent: ${notificationsSent}`);

    return new Response(
      JSON.stringify({ success: true, notificationsSent }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("[check-payroll-deadline] Error:", msg);
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
