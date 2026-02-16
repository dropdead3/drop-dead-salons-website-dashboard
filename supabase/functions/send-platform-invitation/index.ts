import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { sendEmail } from "../_shared/email-sender.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface InvitationRequest {
  email: string;
  role: string;
  token: string;
  inviter_name: string;
  base_url: string;
}

const roleDescriptions: Record<string, { title: string; description: string }> = {
  platform_admin: { title: "Platform Admin", description: "Full access to manage all organizations, users, and platform settings." },
  platform_support: { title: "Platform Support", description: "View all organizations, assist users, and perform migrations." },
  platform_developer: { title: "Platform Developer", description: "Access for testing, debugging, and development purposes." },
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, role, token, inviter_name, base_url }: InvitationRequest = await req.json();

    if (!email || !role || !token || !base_url) {
      throw new Error("Missing required fields: email, role, token, base_url");
    }

    const roleInfo = roleDescriptions[role] || {
      title: role.replace("platform_", "").replace("_", " "),
      description: "Access to the Platform Administration Hub.",
    };

    const signupUrl = `${base_url}/platform-login?invitation=${token}`;

    await sendEmail({
      to: [email],
      subject: `You're invited to join the Zura Platform Team as ${roleInfo.title}`,
      html: `
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; padding: 16px; background: linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%); border-radius: 12px;">
            <span style="font-size: 24px;">🔐</span>
          </div>
          <h1 style="margin: 16px 0 0; font-size: 24px;">Platform Team Invitation</h1>
        </div>
        
        <p>Hi there,</p>
        <p><strong>${inviter_name}</strong> has invited you to join the Zura Platform Administration team.</p>
        
        <div style="background: #f8fafc; border-radius: 12px; padding: 16px; margin: 24px 0; border: 1px solid #e2e8f0;">
          <p style="margin: 0 0 8px; color: #7c3aed; font-size: 12px; text-transform: uppercase; font-weight: 500;">Your Role</p>
          <p style="margin: 0 0 8px; font-size: 18px; font-weight: 600;">${roleInfo.title}</p>
          <p style="margin: 0; color: #64748b; font-size: 14px;">${roleInfo.description}</p>
        </div>
        
        <div style="text-align: center; margin: 24px 0;">
          <a href="${signupUrl}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 500; border-radius: 12px;">
            Accept Invitation & Create Account
          </a>
        </div>
        
        <p style="color: #64748b; font-size: 13px; text-align: center;">
          This invitation expires in 7 days.
        </p>
        <p style="color: #94a3b8; font-size: 12px; text-align: center;">
          If you didn't expect this invitation, you can safely ignore this email.
        </p>
      `,
    });

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error sending platform invitation:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
