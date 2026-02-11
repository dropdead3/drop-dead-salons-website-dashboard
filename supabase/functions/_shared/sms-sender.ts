/**
 * Shared SMS Sending Utility
 * 
 * Resolves SMS templates from the sms_templates table and sends via
 * a configurable provider. Currently logs messages (no provider connected).
 * Wire to Twilio/etc. later by implementing the actual send call.
 */

import { createClient } from "@supabase/supabase-js";

export interface SmsPayload {
  to: string;
  templateKey: string;
  variables: Record<string, string>;
}

export interface SmsResult {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Resolve a template from sms_templates and interpolate variables.
 */
async function resolveTemplate(
  supabase: ReturnType<typeof createClient>,
  templateKey: string,
  variables: Record<string, string>
): Promise<string | null> {
  const { data, error } = await supabase
    .from("sms_templates")
    .select("message_body, is_active")
    .eq("template_key", templateKey)
    .eq("is_active", true)
    .single();

  if (error || !data) {
    console.error(`[sms-sender] Template "${templateKey}" not found or inactive:`, error);
    return null;
  }

  let body = data.message_body as string;
  for (const [key, value] of Object.entries(variables)) {
    body = body.replaceAll(`{{${key}}}`, value);
  }
  return body;
}

/**
 * Send an SMS using a template.
 * Currently a placeholder — logs the message and returns success.
 */
export async function sendSms(
  supabase: ReturnType<typeof createClient>,
  payload: SmsPayload
): Promise<SmsResult> {
  const message = await resolveTemplate(supabase, payload.templateKey, payload.variables);

  if (!message) {
    return { success: false, error: `Template "${payload.templateKey}" could not be resolved` };
  }

  // TODO: Replace with actual SMS provider (Twilio, etc.)
  console.log(`[sms-sender] SMS to ${payload.to}: ${message}`);

  return { success: true, message };
}
