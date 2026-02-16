import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { verifySignedPayload } from "../_shared/signed-url.ts";

serve(async (req: Request): Promise<Response> => {
  try {
    const url = new URL(req.url);
    const payload = url.searchParams.get("payload");
    const sig = url.searchParams.get("sig");

    if (!payload || !sig) {
      return new Response(renderPage("Invalid Link", "This unsubscribe link is missing required parameters.", null), {
        status: 400,
        headers: { "Content-Type": "text/html" },
      });
    }

    let decoded: Record<string, unknown>;
    try {
      decoded = await verifySignedPayload(payload, sig);
    } catch {
      return new Response(renderPage("Invalid Link", "This unsubscribe link is invalid or has been tampered with.", null), {
        status: 403,
        headers: { "Content-Type": "text/html" },
      });
    }

    const clientId = decoded.cid as string;
    const organizationId = decoded.oid as string;

    if (!clientId || !organizationId) {
      return new Response(renderPage("Error", "Could not identify the subscription from this link.", null), {
        status: 400,
        headers: { "Content-Type": "text/html" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Upsert opt-out preference
    await supabase
      .from("client_email_preferences")
      .upsert(
        {
          organization_id: organizationId,
          client_id: clientId,
          marketing_opt_out: true,
          opt_out_at: new Date().toISOString(),
        },
        { onConflict: "organization_id,client_id" }
      );

    // Fetch org name for the confirmation page
    let orgName = "your salon";
    const { data: org } = await supabase
      .from("organizations")
      .select("name, email_social_links")
      .eq("id", organizationId)
      .single();

    if (org?.name) orgName = org.name;
    const websiteUrl = (org?.email_social_links as any)?.website || null;

    return new Response(
      renderPage("Unsubscribed", `You've been removed from marketing emails from ${orgName}.`, websiteUrl),
      { status: 200, headers: { "Content-Type": "text/html" } }
    );
  } catch (error: any) {
    console.error("[unsubscribe-client-email] Error:", error);
    return new Response(
      renderPage("Error", "Something went wrong. Please try again later.", null),
      { status: 500, headers: { "Content-Type": "text/html" } }
    );
  }
});

function renderPage(title: string, message: string, websiteUrl: string | null): string {
  const websiteLink = websiteUrl
    ? `<a href="${websiteUrl}" style="display:inline-block;margin-top:24px;color:#7c3aed;text-decoration:underline;font-size:14px;">Visit our website</a>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${title}</title></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;">
  <div style="max-width:480px;margin:0 auto;text-align:center;padding:40px 24px;">
    <div style="background:linear-gradient(135deg,#7c3aed,#a855f7);width:64px;height:64px;border-radius:16px;display:flex;align-items:center;justify-content:center;margin:0 auto 24px;">
      <span style="font-size:28px;">✉️</span>
    </div>
    <h1 style="font-size:24px;color:#111827;margin:0 0 12px;">${title}</h1>
    <p style="font-size:15px;color:#6b7280;line-height:1.6;margin:0 0 20px;">${message}</p>
    
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px 20px;text-align:left;">
      <p style="margin:0 0 4px;font-size:14px;font-weight:600;color:#166534;">📅 Appointment notifications are not affected</p>
      <p style="margin:0;font-size:13px;color:#15803d;line-height:1.5;">You'll continue to receive appointment confirmations, reminders, and booking updates — no action needed.</p>
    </div>
    
    ${websiteLink}
  </div>
</body>
</html>`;
}
