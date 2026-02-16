/**
 * Shared Email Sending Utility
 * 
 * Provides consistent email sending across all edge functions using Resend API.
 * Uses environment variable RESEND_API_KEY for authentication.
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

const DEFAULT_FROM = "Drop Dead <noreply@dropdeadsalon.com>";

/**
 * Send an email using the Resend API
 * 
 * @param payload - Email configuration
 * @returns Result object with success status
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
        from: payload.from || DEFAULT_FROM,
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
