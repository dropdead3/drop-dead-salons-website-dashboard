import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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
  platform_admin: {
    title: "Platform Admin",
    description: "Full access to manage all organizations, users, and platform settings.",
  },
  platform_support: {
    title: "Platform Support",
    description: "View all organizations, assist users, and perform migrations.",
  },
  platform_developer: {
    title: "Platform Developer",
    description: "Access for testing, debugging, and development purposes.",
  },
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
    const expirationDays = 7;

    const emailResponse = await resend.emails.send({
      from: "Platform <noreply@dropdeadsalons.com>",
      to: [email],
      subject: `You're invited to join the Platform Team as ${roleInfo.title}`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0f172a;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 520px; width: 100%; border-collapse: collapse;">
          <!-- Header -->
          <tr>
            <td style="padding: 32px; background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%); border-radius: 16px 16px 0 0; text-align: center;">
              <div style="display: inline-block; padding: 16px; background: linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%); border-radius: 12px; margin-bottom: 16px;">
                <span style="font-size: 24px;">🔐</span>
              </div>
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 500; letter-spacing: -0.025em;">
                Platform Team Invitation
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 32px; background-color: #1e293b; border-left: 1px solid #334155; border-right: 1px solid #334155;">
              <p style="margin: 0 0 20px; color: #e2e8f0; font-size: 16px; line-height: 1.6;">
                Hi there,
              </p>
              <p style="margin: 0 0 24px; color: #e2e8f0; font-size: 16px; line-height: 1.6;">
                <strong style="color: #a78bfa;">${inviter_name}</strong> has invited you to join the Platform Administration team.
              </p>
              
              <!-- Role Badge -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 16px; background-color: #0f172a; border-radius: 12px; border: 1px solid #334155;">
                    <p style="margin: 0 0 8px; color: #a78bfa; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 500;">
                      Your Role
                    </p>
                    <p style="margin: 0 0 8px; color: #ffffff; font-size: 18px; font-weight: 600;">
                      ${roleInfo.title}
                    </p>
                    <p style="margin: 0; color: #94a3b8; font-size: 14px; line-height: 1.5;">
                      ${roleInfo.description}
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 8px 0;">
                    <a href="${signupUrl}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 500; border-radius: 12px; box-shadow: 0 4px 14px rgba(124, 58, 237, 0.4);">
                      Accept Invitation & Create Account
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 24px 0 0; color: #64748b; font-size: 13px; text-align: center;">
                This invitation expires in ${expirationDays} days.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #0f172a; border-radius: 0 0 16px 16px; border: 1px solid #334155; border-top: none;">
              <p style="margin: 0 0 8px; color: #64748b; font-size: 12px; text-align: center;">
                If you didn't expect this invitation, you can safely ignore this email.
              </p>
              <p style="margin: 0; color: #475569; font-size: 11px; text-align: center;">
                © ${new Date().getFullYear()} Platform Administration • Internal Use Only
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
    });

    console.log("Platform invitation email sent:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, email_id: emailResponse.data?.id }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error sending platform invitation:", message);
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
