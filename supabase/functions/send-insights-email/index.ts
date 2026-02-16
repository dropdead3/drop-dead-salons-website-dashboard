import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendEmail } from "../_shared/email-sender.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── Frequency helpers ──────────────────────────────────────────────
function calculateNextAt(frequency: string): string {
  const now = new Date();
  switch (frequency) {
    case "daily": {
      const next = new Date(now);
      next.setDate(next.getDate() + 1);
      next.setHours(7, 0, 0, 0); // 7 AM next day
      return next.toISOString();
    }
    case "monday": {
      const next = new Date(now);
      const dayOfWeek = next.getDay(); // 0=Sun
      const daysUntilMon = dayOfWeek === 0 ? 1 : dayOfWeek === 1 ? 7 : 8 - dayOfWeek;
      next.setDate(next.getDate() + daysUntilMon);
      next.setHours(7, 0, 0, 0);
      return next.toISOString();
    }
    case "weekly":
    default: {
      const next = new Date(now);
      next.setDate(next.getDate() + 7);
      next.setHours(7, 0, 0, 0);
      return next.toISOString();
    }
  }
}

// ── Sentiment helpers ──────────────────────────────────────────────
function sentimentColor(sentiment: string): string {
  switch (sentiment) {
    case "positive": return "#16a34a";
    case "concerning": return "#dc2626";
    default: return "#ca8a04";
  }
}

function sentimentEmoji(sentiment: string): string {
  switch (sentiment) {
    case "positive": return "🟢";
    case "concerning": return "🔴";
    default: return "🟡";
  }
}

function categoryEmoji(category: string): string {
  const map: Record<string, string> = {
    "revenue": "💰", "performance": "📊", "clients": "👥", "schedule": "📅",
    "staff": "🧑‍💼", "growth": "📈", "retention": "🔄", "operations": "⚙️",
    "My Performance": "📊", "My Clients": "👥", "My Schedule": "📅", "Growth Tips": "🌱",
  };
  return map[category] || "💡";
}

function priorityBadge(priority: string): string {
  switch (priority) {
    case "high": return '<span style="display:inline-block;background:#fef2f2;color:#dc2626;font-size:11px;padding:2px 8px;border-radius:12px;font-weight:600;margin-right:6px;">HIGH</span>';
    case "medium": return '<span style="display:inline-block;background:#fefce8;color:#ca8a04;font-size:11px;padding:2px 8px;border-radius:12px;font-weight:600;margin-right:6px;">MED</span>';
    default: return '<span style="display:inline-block;background:#f0fdf4;color:#16a34a;font-size:11px;padding:2px 8px;border-radius:12px;font-weight:600;margin-right:6px;">LOW</span>';
  }
}

// ── HTML Email Template ────────────────────────────────────────────
function buildEmailHtml(
  insights: any,
  userName: string,
  frequency: string,
  unsubscribeUrl: string,
  dashboardUrl: string,
): string {
  const summary = insights.summary || "Here are your latest insights.";
  const sentiment = insights.overallSentiment || "neutral";
  const items = insights.insights || [];
  const actions = insights.actionItems || [];

  const insightCards = items.map((item: any) => `
    <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin-bottom:12px;">
      <div style="display:flex;align-items:center;margin-bottom:8px;">
        <span style="font-size:20px;margin-right:8px;">${categoryEmoji(item.category || "")}</span>
        <span style="font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#6b7280;font-weight:600;">${item.category || ""}</span>
      </div>
      <h3 style="margin:0 0 6px 0;font-size:16px;color:#111827;font-weight:600;">${item.title || ""}</h3>
      <p style="margin:0;font-size:14px;color:#4b5563;line-height:1.5;">${item.description || ""}</p>
    </div>
  `).join("");

  const actionList = actions.length > 0
    ? `<div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin-bottom:12px;">
        <h3 style="margin:0 0 12px 0;font-size:16px;color:#111827;font-weight:600;">🎯 Action Items</h3>
        <ol style="margin:0;padding-left:20px;">
          ${actions.map((a: any, i: number) => `
            <li style="margin-bottom:10px;font-size:14px;color:#374151;line-height:1.5;">
              ${priorityBadge(a.priority || "low")}${a.title || a.action || ""}
              ${a.description ? `<br/><span style="color:#6b7280;font-size:13px;">${a.description}</span>` : ""}
            </li>
          `).join("")}
        </ol>
      </div>`
    : "";

  const frequencyLabel = frequency === "daily" ? "Daily Digest" : frequency === "monday" ? "Monday Briefing" : "Weekly Summary";

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#f3f4f6;padding:20px 16px;">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#7c3aed,#a855f7,#c084fc);border-radius:16px 16px 0 0;padding:32px 24px;text-align:center;">
      <h1 style="margin:0;font-size:28px;color:#ffffff;font-weight:700;letter-spacing:0.5px;">✨ Zura Insights</h1>
      <p style="margin:8px 0 0;font-size:14px;color:rgba(255,255,255,0.85);">${frequencyLabel} for ${userName}</p>
    </div>

    <!-- Sentiment Summary -->
    <div style="background:#ffffff;padding:20px 24px;border-left:4px solid ${sentimentColor(sentiment)};">
      <p style="margin:0;font-size:15px;color:#374151;line-height:1.6;">
        ${sentimentEmoji(sentiment)} <strong style="color:${sentimentColor(sentiment)};">${sentiment.charAt(0).toUpperCase() + sentiment.slice(1)}</strong> — ${summary}
      </p>
    </div>

    <!-- Insights -->
    <div style="padding:16px 0;">
      ${insightCards}
      ${actionList}
    </div>

    <!-- CTA -->
    <div style="text-align:center;padding:8px 0 24px;">
      <a href="${dashboardUrl}" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#a855f7);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:12px;font-size:15px;font-weight:600;letter-spacing:0.3px;">Open Dashboard</a>
    </div>

    <!-- Footer -->
    <div style="text-align:center;padding:24px 16px;border-top:1px solid #e5e7eb;">
      <p style="margin:0 0 8px;font-size:12px;color:#9ca3af;">Powered by Zura AI · Drop Dead Gorgeous</p>
      <a href="${unsubscribeUrl}" style="font-size:12px;color:#9ca3af;text-decoration:underline;">Unsubscribe from insights emails</a>
    </div>
  </div>
</body>
</html>`;
}

// ── Main Handler ───────────────────────────────────────────────────
serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let userId: string | null = null;
    let isTestSend = false;

    // Check if this is an on-demand test send (authenticated user)
    const authHeader = req.headers.get("Authorization");
    const body = await req.json().catch(() => ({}));

    if (body.userId && authHeader?.startsWith("Bearer ")) {
      // On-demand: verify user is requesting their own email
      const token = authHeader.replace("Bearer ", "");
      const { data: userData, error: authError } = await supabase.auth.getUser(token);
      if (authError || !userData.user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (userData.user.id !== body.userId) {
        return new Response(JSON.stringify({ error: "Can only send test emails to yourself" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      userId = body.userId;
      isTestSend = true;
    }

    // Determine which users to process
    let usersToProcess: any[] = [];

    if (isTestSend && userId) {
      // Single user test send
      const { data: prefs } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      if (prefs) usersToProcess = [prefs];
    } else {
      // Scheduled: find all users due for delivery
      const { data: dueUsers } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("insights_email_enabled", true)
        .lte("insights_email_next_at", new Date().toISOString());
      usersToProcess = dueUsers || [];
    }

    console.log(`[send-insights-email] Processing ${usersToProcess.length} users (test=${isTestSend})`);

    let sent = 0;
    let failed = 0;

    for (const prefs of usersToProcess) {
      try {
        const uid = prefs.user_id;

        // Get user email
        const { data: authUser } = await supabase.auth.admin.getUserById(uid);
        if (!authUser?.user?.email) {
          console.log(`[send-insights-email] No email for user ${uid}, skipping`);
          failed++;
          continue;
        }

        // Get user name from employee_profiles
        const { data: profile } = await supabase
          .from("employee_profiles")
          .select("first_name, last_name")
          .eq("user_id", uid)
          .maybeSingle();
        const userName = profile
          ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim()
          : authUser.user.email.split("@")[0];

        // Determine role tier
        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", uid);
        const roleList = (roles || []).map((r: any) => r.role);
        const isLeadership = roleList.some((r: string) =>
          ["super_admin", "admin", "manager"].includes(r)
        );

        // Fetch cached insights
        let insights: any = null;
        if (isLeadership) {
          // Get org for the user
          const { data: ep } = await supabase
            .from("employee_profiles")
            .select("organization_id")
            .eq("user_id", uid)
            .maybeSingle();
          if (ep?.organization_id) {
            const { data: bi } = await supabase
              .from("ai_business_insights")
              .select("insights")
              .eq("organization_id", ep.organization_id)
              .order("generated_at", { ascending: false })
              .limit(1);
            if (bi?.[0]) insights = bi[0].insights;
          }
        } else {
          const { data: pi } = await supabase
            .from("ai_personal_insights")
            .select("insights")
            .eq("user_id", uid)
            .order("generated_at", { ascending: false })
            .limit(1);
          if (pi?.[0]) insights = pi[0].insights;
        }

        if (!insights) {
          console.log(`[send-insights-email] No insights for user ${uid}, skipping`);
          failed++;
          continue;
        }

        // Build unsubscribe URL with simple signed token
        const jwtSecret = Deno.env.get("SUPABASE_JWT_SECRET") || Deno.env.get("JWT_SECRET") || "fallback";
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
          "raw",
          encoder.encode(jwtSecret),
          { name: "HMAC", hash: "SHA-256" },
          false,
          ["sign"]
        );
        const tokenPayload = btoa(JSON.stringify({ uid, ts: Date.now() }));
        const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(tokenPayload));
        const sig = btoa(String.fromCharCode(...new Uint8Array(signature)));
        const unsubscribeUrl = `${supabaseUrl}/functions/v1/unsubscribe-insights-email?payload=${encodeURIComponent(tokenPayload)}&sig=${encodeURIComponent(sig)}`;

        const dashboardUrl = "https://dropdeadsalon.com/dashboard";
        const frequency = prefs.insights_email_frequency || "weekly";
        const subjectPrefix = isTestSend ? "[TEST] " : "";
        const subject = `${subjectPrefix}Your ${frequency === "daily" ? "Daily" : frequency === "monday" ? "Monday" : "Weekly"} Zura Insights`;

        const html = buildEmailHtml(insights, userName, frequency, unsubscribeUrl, dashboardUrl);

        const result = await sendEmail({
          to: [authUser.user.email],
          subject,
          html,
        });

        if (result.success) {
          sent++;
          // Update timestamps
          await supabase
            .from("notification_preferences")
            .update({
              insights_email_last_sent: new Date().toISOString(),
              insights_email_next_at: calculateNextAt(frequency),
            })
            .eq("user_id", uid);
        } else {
          console.error(`[send-insights-email] Failed for ${uid}:`, result.error);
          failed++;
        }
      } catch (userErr) {
        console.error(`[send-insights-email] Error processing user:`, userErr);
        failed++;
      }
    }

    return new Response(
      JSON.stringify({ success: true, sent, failed, total: usersToProcess.length }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[send-insights-email] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
