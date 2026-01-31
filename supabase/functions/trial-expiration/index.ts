import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from 'https://esm.sh/resend@2.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TRIAL_WARNING_DAYS = [7, 3, 1]; // Days before expiration to send warnings

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const resend = resendApiKey ? new Resend(resendApiKey) : null;

    // Find organizations on trial
    const { data: trialOrgs, error: orgsError } = await adminClient
      .from('organizations')
      .select(`
        id,
        name,
        slug,
        billing_email,
        subscription_status,
        trial_ends_at,
        activated_at
      `)
      .eq('subscription_status', 'trialing')
      .not('trial_ends_at', 'is', null);

    if (orgsError) throw orgsError;

    const results = {
      processed: 0,
      warningsSent: 0,
      trialsExpired: 0,
      trialsConverted: 0,
      notifications: [] as string[],
    };

    const now = new Date();

    for (const org of trialOrgs || []) {
      results.processed++;

      const trialEnd = new Date(org.trial_ends_at);
      const daysUntilExpiry = Math.ceil(
        (trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Check if trial has expired
      if (daysUntilExpiry <= 0) {
        // Check if they have a payment method (stripe_subscription_id indicates conversion)
        const { data: hasPayment } = await adminClient
          .from('organizations')
          .select('stripe_subscription_id')
          .eq('id', org.id)
          .single();

        if (hasPayment?.stripe_subscription_id) {
          // Convert to active subscription
          await adminClient
            .from('organizations')
            .update({ subscription_status: 'active' })
            .eq('id', org.id);

          await adminClient.from('billing_changes').insert({
            organization_id: org.id,
            change_type: 'trial_converted',
            notes: 'Trial successfully converted to paid subscription',
            previous_value: { status: 'trialing' },
            new_value: { status: 'active' },
          });

          results.trialsConverted++;
          results.notifications.push(`${org.name} converted to paid`);
        } else {
          // Expire the trial
          await adminClient
            .from('organizations')
            .update({ subscription_status: 'expired' })
            .eq('id', org.id);

          await adminClient.from('billing_changes').insert({
            organization_id: org.id,
            change_type: 'trial_expired',
            notes: 'Trial period ended without conversion',
            previous_value: { status: 'trialing' },
            new_value: { status: 'expired' },
          });

          await adminClient.from('platform_notifications').insert({
            type: 'trial_expired',
            severity: 'warning',
            title: `Trial Expired: ${org.name}`,
            message: `${org.name}'s trial has expired without converting to a paid plan.`,
            metadata: { organization_id: org.id },
          });

          results.trialsExpired++;
          results.notifications.push(`${org.name} trial expired`);
        }
      } else if (TRIAL_WARNING_DAYS.includes(daysUntilExpiry)) {
        // Send warning email
        if (resend && org.billing_email) {
          try {
            await resend.emails.send({
              from: 'Platform <noreply@lovable.app>',
              to: [org.billing_email],
              subject: `Your trial expires in ${daysUntilExpiry} day${daysUntilExpiry > 1 ? 's' : ''}`,
              html: `
                <h1>Your Trial is Ending Soon</h1>
                <p>Hi ${org.name},</p>
                <p>Your trial will expire in <strong>${daysUntilExpiry} day${daysUntilExpiry > 1 ? 's' : ''}</strong>.</p>
                <p>To continue using all features without interruption, please add your payment information.</p>
                <p>If you have any questions, our support team is here to help!</p>
              `,
            });
            results.warningsSent++;
          } catch (emailError) {
            console.error('Failed to send trial warning email:', emailError);
          }
        }

        // Create in-app notification
        await adminClient.from('platform_notifications').insert({
          type: 'trial_warning',
          severity: daysUntilExpiry === 1 ? 'critical' : 'warning',
          title: `Trial Expiring: ${org.name}`,
          message: `${org.name}'s trial expires in ${daysUntilExpiry} day${daysUntilExpiry > 1 ? 's' : ''}.`,
          metadata: { 
            organization_id: org.id,
            days_remaining: daysUntilExpiry,
          },
        });
      }
    }

    // Log function execution
    await adminClient.from('edge_function_logs').insert({
      function_name: 'trial-expiration',
      status: 'success',
      metadata: results,
    });

    return new Response(
      JSON.stringify({ success: true, ...results }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Trial expiration error:', error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
