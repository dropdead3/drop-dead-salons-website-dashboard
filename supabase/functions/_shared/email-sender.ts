/**
 * Multi-Tenant Email Infrastructure
 * 
 * Two entry points:
 *  - sendEmail()    → Platform-level emails (Zura branding)
 *  - sendOrgEmail() → Org-branded emails (dynamic branding from organizations table)
 * 
 * All emails route through a single Resend account.
 * Organizations never need their own Resend account.
 */

export interface EmailPayload {
  to: string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface OrgEmailPayload {
  to: string[];
  subject: string;
  html: string;
  replyTo?: string;
}

interface OrgBranding {
  name: string;
  email_sender_name: string | null;
  email_reply_to: string | null;
  email_logo_url: string | null;
  email_accent_color: string | null;
  logo_url: string | null;
  primary_contact_email: string | null;
}

const PLATFORM_DOMAIN = "mail.getzura.com";
const PLATFORM_FROM = `Zura <notifications@${PLATFORM_DOMAIN}>`;

/**
 * Send a platform-level email (Zura branding).
 * Use for billing, trials, platform invitations, weekly digests, etc.
 */
export async function sendEmail(payload: EmailPayload): Promise<EmailResult> {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  
  if (!resendApiKey) {
    console.log("[email-sender] RESEND_API_KEY not configured - email skipped");
    return { success: false, error: "RESEND_API_KEY not configured" };
  }

  if (!payload.to || payload.to.length === 0) {
    console.log("[email-sender] No recipients provided - email skipped");
    return { success: false, error: "No recipients provided" };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: payload.from || PLATFORM_FROM,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        reply_to: payload.replyTo,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[email-sender] Email send failed:", errorText);
      return { success: false, error: errorText };
    }

    const result = await response.json();
    console.log("[email-sender] Email sent successfully:", result.id);
    return { success: true, messageId: result.id };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[email-sender] Exception sending email:", errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Send an org-branded email.
 * Fetches org branding, wraps content in branded template, and sends.
 * Use for all staff/client notifications within an organization.
 */
export async function sendOrgEmail(
  supabase: any,
  organizationId: string,
  payload: OrgEmailPayload,
): Promise<EmailResult> {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");

  if (!resendApiKey) {
    console.log("[email-sender] RESEND_API_KEY not configured - email skipped");
    return { success: false, error: "RESEND_API_KEY not configured" };
  }

  if (!payload.to || payload.to.length === 0) {
    console.log("[email-sender] No recipients provided - email skipped");
    return { success: false, error: "No recipients provided" };
  }

  // Fetch org branding
  let branding: OrgBranding | null = null;
  if (organizationId) {
    try {
      const { data, error } = await supabase
        .from("organizations")
        .select("name, email_sender_name, email_reply_to, email_logo_url, email_accent_color, logo_url, primary_contact_email")
        .eq("id", organizationId)
        .single();
      
      if (!error && data) {
        branding = data as OrgBranding;
      } else {
        console.warn("[email-sender] Could not fetch org branding:", error?.message);
      }
    } catch (e) {
      console.warn("[email-sender] Error fetching org branding:", e);
    }
  }

  const senderName = branding?.email_sender_name || branding?.name || "Zura";
  const fromAddress = `${senderName} <notifications@${PLATFORM_DOMAIN}>`;
  const replyTo = payload.replyTo || branding?.email_reply_to || branding?.primary_contact_email || undefined;
  const brandedHtml = buildBrandedTemplate(branding, payload.html);

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: fromAddress,
        to: payload.to,
        subject: payload.subject,
        html: brandedHtml,
        reply_to: replyTo,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[email-sender] Org email send failed:", errorText);
      return { success: false, error: errorText };
    }

    const result = await response.json();
    console.log("[email-sender] Org email sent successfully:", result.id);
    return { success: true, messageId: result.id };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[email-sender] Exception sending org email:", errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Wrap inner HTML content in a branded email template.
 */
function buildBrandedTemplate(branding: OrgBranding | null, innerHtml: string): string {
  const orgName = branding?.name || "Zura";
  const accentColor = branding?.email_accent_color || "#000000";
  const logoUrl = branding?.email_logo_url || branding?.logo_url || null;

  const logoHtml = logoUrl
    ? `<img src="${logoUrl}" alt="${orgName}" style="max-height: 48px; max-width: 200px; margin-bottom: 8px;" />`
    : `<span style="font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: -0.025em;">${orgName}</span>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px 16px;">
    <!-- Header -->
    <div style="background-color: ${accentColor}; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
      ${logoHtml}
    </div>

    <!-- Accent bar -->
    <div style="height: 4px; background: linear-gradient(90deg, ${accentColor}, ${accentColor}88);"></div>

    <!-- Content -->
    <div style="background-color: #ffffff; padding: 32px 24px; border-left: 1px solid #e4e4e7; border-right: 1px solid #e4e4e7;">
      ${innerHtml}
    </div>

    <!-- Footer -->
    <div style="background-color: #fafafa; padding: 20px 24px; border-radius: 0 0 12px 12px; border: 1px solid #e4e4e7; border-top: none; text-align: center;">
      <p style="margin: 0; font-size: 12px; color: #a1a1aa;">
        Sent via <a href="https://getzura.com" style="color: #a1a1aa; text-decoration: underline;">Zura</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Format a date for display in emails
 */
export function formatEmailDate(date: Date, format: 'short' | 'long' = 'long'): string {
  if (format === 'short') {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}

/**
 * Format currency for display in emails
 */
export function formatEmailCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}
