import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from 'https://esm.sh/resend@2.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WeeklyKPIs {
  mrr: number;
  mrrChange: number;
  arr: number;
  totalOrganizations: number;
  newOrganizations: number;
  churnedOrganizations: number;
  activeUsers: number;
  newUsers: number;
  totalAppointments: number;
  appointmentsChange: number;
  paymentFailures: number;
  openSupportTickets: number;
}

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

    const now = new Date();
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const twoWeeksAgo = new Date(now);
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    // Calculate KPIs
    const kpis: WeeklyKPIs = {
      mrr: 0,
      mrrChange: 0,
      arr: 0,
      totalOrganizations: 0,
      newOrganizations: 0,
      churnedOrganizations: 0,
      activeUsers: 0,
      newUsers: 0,
      totalAppointments: 0,
      appointmentsChange: 0,
      paymentFailures: 0,
      openSupportTickets: 0,
    };

    // Total active orgs
    const { count: totalOrgs } = await adminClient
      .from('organizations')
      .select('id', { count: 'exact', head: true })
      .in('subscription_status', ['active', 'trialing']);
    kpis.totalOrganizations = totalOrgs || 0;

    // New orgs this week
    const { count: newOrgs } = await adminClient
      .from('organizations')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', oneWeekAgo.toISOString());
    kpis.newOrganizations = newOrgs || 0;

    // Churned orgs this week
    const { count: churnedOrgs } = await adminClient
      .from('organizations')
      .select('id', { count: 'exact', head: true })
      .eq('subscription_status', 'cancelled')
      .gte('cancelled_at', oneWeekAgo.toISOString());
    kpis.churnedOrganizations = churnedOrgs || 0;

    // Calculate MRR
    const { data: activeOrgsWithPricing } = await adminClient
      .from('organizations')
      .select('monthly_price, price_per_user')
      .in('subscription_status', ['active']);

    let totalMRR = 0;
    for (const org of activeOrgsWithPricing || []) {
      totalMRR += org.monthly_price || 0;
    }
    kpis.mrr = totalMRR;
    kpis.arr = totalMRR * 12;

    // Active users
    const { count: activeUsers } = await adminClient
      .from('employee_profiles')
      .select('id', { count: 'exact', head: true })
      .gte('last_sign_in_at', oneWeekAgo.toISOString());
    kpis.activeUsers = activeUsers || 0;

    // New users
    const { count: newUsers } = await adminClient
      .from('employee_profiles')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', oneWeekAgo.toISOString());
    kpis.newUsers = newUsers || 0;

    // Appointments this week
    const { count: appointmentsThisWeek } = await adminClient
      .from('appointments')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', oneWeekAgo.toISOString());
    kpis.totalAppointments = appointmentsThisWeek || 0;

    // Appointments last week (for comparison)
    const { count: appointmentsLastWeek } = await adminClient
      .from('appointments')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', twoWeeksAgo.toISOString())
      .lt('created_at', oneWeekAgo.toISOString());
    
    if (appointmentsLastWeek && appointmentsLastWeek > 0) {
      kpis.appointmentsChange = Math.round(
        (((appointmentsThisWeek || 0) - appointmentsLastWeek) / appointmentsLastWeek) * 100
      );
    }

    // Payment failures
    const { count: paymentFailures } = await adminClient
      .from('platform_notifications')
      .select('id', { count: 'exact', head: true })
      .eq('type', 'payment_failed')
      .gte('created_at', oneWeekAgo.toISOString());
    kpis.paymentFailures = paymentFailures || 0;

    // Open support tickets
    const { count: openTickets } = await adminClient
      .from('platform_notifications')
      .select('id', { count: 'exact', head: true })
      .eq('type', 'support_request')
      .is('resolved_at', null);
    kpis.openSupportTickets = openTickets || 0;

    // Get platform admins to send digest to
    const { data: platformAdmins } = await adminClient
      .from('platform_roles')
      .select('user_id')
      .in('role', ['platform_owner', 'platform_admin']);

    const adminEmails: string[] = [];
    for (const admin of platformAdmins || []) {
      const { data: profile } = await adminClient
        .from('employee_profiles')
        .select('email')
        .eq('user_id', admin.user_id)
        .single();
      
      if (profile?.email) {
        adminEmails.push(profile.email);
      }
    }

    // Send email digest
    if (resend && adminEmails.length > 0) {
      const weekOf = oneWeekAgo.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const weekEnd = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

      try {
        await resend.emails.send({
          from: 'Platform Weekly Digest <digest@lovable.app>',
          to: adminEmails,
          subject: `Weekly Platform Digest: ${weekOf} - ${weekEnd}`,
          html: generateDigestEmail(kpis, weekOf, weekEnd),
        });
      } catch (emailError) {
        console.error('Failed to send weekly digest:', emailError);
      }
    }

    // Store digest record
    await adminClient.from('weekly_digests').insert({
      week_start: oneWeekAgo.toISOString(),
      week_end: now.toISOString(),
      kpis: kpis,
      recipients: adminEmails,
    });

    // Log function execution
    await adminClient.from('edge_function_logs').insert({
      function_name: 'weekly-digest',
      status: 'success',
      metadata: {
        kpis,
        recipients_count: adminEmails.length,
      },
    });

    return new Response(
      JSON.stringify({ success: true, kpis, recipients: adminEmails.length }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Weekly digest error:', error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function generateDigestEmail(kpis: WeeklyKPIs, weekOf: string, weekEnd: string): string {
  const formatCurrency = (n: number) => `$${n.toLocaleString()}`;
  const formatChange = (n: number) => n >= 0 ? `+${n}%` : `${n}%`;
  const changeColor = (n: number) => n >= 0 ? '#22c55e' : '#ef4444';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #eee; }
        .kpi-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
        .kpi-card { background: #f8fafc; border-radius: 8px; padding: 15px; }
        .kpi-value { font-size: 24px; font-weight: bold; color: #1e293b; }
        .kpi-label { font-size: 12px; color: #64748b; text-transform: uppercase; }
        .kpi-change { font-size: 12px; margin-top: 4px; }
        .section { margin: 25px 0; }
        .section-title { font-size: 14px; font-weight: 600; color: #64748b; margin-bottom: 10px; text-transform: uppercase; }
        .alert { background: #fef2f2; border-left: 4px solid #ef4444; padding: 12px; margin: 10px 0; border-radius: 4px; }
        .success { background: #f0fdf4; border-left: 4px solid #22c55e; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; color: #1e293b;">Weekly Platform Digest</h1>
          <p style="margin: 5px 0 0; color: #64748b;">${weekOf} - ${weekEnd}</p>
        </div>

        <div class="section">
          <div class="section-title">Revenue</div>
          <div class="kpi-grid">
            <div class="kpi-card">
              <div class="kpi-value">${formatCurrency(kpis.mrr)}</div>
              <div class="kpi-label">Monthly Recurring Revenue</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-value">${formatCurrency(kpis.arr)}</div>
              <div class="kpi-label">Annual Run Rate</div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Organizations</div>
          <div class="kpi-grid">
            <div class="kpi-card">
              <div class="kpi-value">${kpis.totalOrganizations}</div>
              <div class="kpi-label">Total Active</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-value" style="color: #22c55e;">+${kpis.newOrganizations}</div>
              <div class="kpi-label">New This Week</div>
            </div>
          </div>
          ${kpis.churnedOrganizations > 0 ? `
            <div class="alert">
              <strong>${kpis.churnedOrganizations} organization(s) churned</strong> this week.
            </div>
          ` : `
            <div class="alert success">
              <strong>No churn this week!</strong> Great retention.
            </div>
          `}
        </div>

        <div class="section">
          <div class="section-title">Engagement</div>
          <div class="kpi-grid">
            <div class="kpi-card">
              <div class="kpi-value">${kpis.activeUsers}</div>
              <div class="kpi-label">Active Users</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-value">${kpis.totalAppointments}</div>
              <div class="kpi-label">Appointments</div>
              <div class="kpi-change" style="color: ${changeColor(kpis.appointmentsChange)};">
                ${formatChange(kpis.appointmentsChange)} vs last week
              </div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Attention Needed</div>
          ${kpis.paymentFailures > 0 ? `
            <div class="alert">
              <strong>${kpis.paymentFailures} payment failure(s)</strong> this week require attention.
            </div>
          ` : ''}
          ${kpis.openSupportTickets > 0 ? `
            <div class="alert">
              <strong>${kpis.openSupportTickets} open support ticket(s)</strong> awaiting response.
            </div>
          ` : ''}
          ${kpis.paymentFailures === 0 && kpis.openSupportTickets === 0 ? `
            <div class="alert success">
              <strong>All clear!</strong> No urgent items this week.
            </div>
          ` : ''}
        </div>

        <div style="text-align: center; padding: 20px; color: #64748b; font-size: 12px; border-top: 1px solid #eee; margin-top: 30px;">
          This is an automated weekly digest from your platform.
        </div>
      </div>
    </body>
    </html>
  `;
}
