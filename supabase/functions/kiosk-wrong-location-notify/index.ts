import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotifyRequest {
  appointment_id: string;
  stylist_user_id: string;
  client_name: string;
  service_name: string;
  scheduled_time: string;
  scheduled_location_id: string;
  arrived_location_id: string;
  organization_id: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: NotifyRequest = await req.json();
    const {
      appointment_id,
      stylist_user_id,
      client_name,
      service_name,
      scheduled_time,
      scheduled_location_id,
      arrived_location_id,
      organization_id,
    } = body;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get stylist info
    const { data: stylist, error: stylistError } = await supabase
      .from('employee_profiles')
      .select('display_name, phone, email, user_id')
      .eq('user_id', stylist_user_id)
      .single();

    if (stylistError) {
      console.error('Failed to fetch stylist:', stylistError);
    }

    // Get location names
    const { data: locations } = await supabase
      .from('locations')
      .select('id, name')
      .in('id', [scheduled_location_id, arrived_location_id]);

    const scheduledLocation = locations?.find(l => l.id === scheduled_location_id);
    const arrivedLocation = locations?.find(l => l.id === arrived_location_id);

    // Create a notification record for the stylist
    const { error: notifError } = await supabase
      .from('user_notifications')
      .insert({
        user_id: stylist_user_id,
        type: 'wrong_location_arrival',
        title: `${client_name} arrived at wrong location`,
        message: `Your ${scheduled_time} client for ${service_name} is at ${arrivedLocation?.name || 'another location'} instead of ${scheduledLocation?.name || 'the scheduled location'}. They need assistance.`,
        metadata: {
          appointment_id,
          client_name,
          service_name,
          scheduled_time,
          scheduled_location: scheduledLocation?.name,
          arrived_location: arrivedLocation?.name,
          scheduled_location_id,
          arrived_location_id,
        },
        is_read: false,
        is_actionable: true,
        action_type: 'wrong_location',
      });

    if (notifError) {
      console.error('Failed to create notification:', notifError);
    }

    // Log the wrong location event
    await supabase
      .from('kiosk_analytics')
      .insert({
        organization_id,
        location_id: arrived_location_id,
        event_type: 'wrong_location_arrival',
        appointment_id,
        metadata: {
          scheduled_location_id,
          client_name,
          stylist_user_id,
        },
      });

    // Try to send push notification if available
    const { data: pushTokens } = await supabase
      .from('push_subscriptions')
      .select('subscription')
      .eq('user_id', stylist_user_id);

    if (pushTokens && pushTokens.length > 0) {
      // Send web push notification
      for (const tokenRecord of pushTokens) {
        try {
          // In a real implementation, you'd send the push notification here
          // using the Web Push API with VAPID keys
          console.log('Would send push to:', tokenRecord.subscription);
        } catch (pushError) {
          console.error('Push notification failed:', pushError);
        }
      }
    }

    // Send email notification if email is available
    if (stylist?.email) {
      const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
      if (RESEND_API_KEY) {
        try {
          const emailResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${RESEND_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'notifications@dropdeadsalons.com',
              to: stylist.email,
              subject: `⚠️ ${client_name} arrived at wrong location`,
              html: `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <h2 style="color: #B8860B; margin-bottom: 20px;">Wrong Location Alert</h2>
                  <p style="font-size: 16px; line-height: 1.6; color: #333;">
                    <strong>${client_name}</strong> has arrived for their <strong>${scheduled_time}</strong> appointment 
                    (${service_name}) at <strong>${arrivedLocation?.name || 'another location'}</strong>.
                  </p>
                  <p style="font-size: 16px; line-height: 1.6; color: #333;">
                    Their appointment was scheduled at <strong>${scheduledLocation?.name || 'a different location'}</strong>.
                  </p>
                  <div style="background: #FFF3CD; border: 1px solid #FFE69C; border-radius: 8px; padding: 16px; margin: 20px 0;">
                    <p style="margin: 0; color: #856404; font-size: 14px;">
                      <strong>Action Required:</strong> Please contact the client to determine if they can travel to the correct location 
                      or if the appointment needs to be rescheduled.
                    </p>
                  </div>
                  <p style="font-size: 14px; color: #666; margin-top: 30px;">
                    — Drop Dead Salons Team
                  </p>
                </div>
              `,
            }),
          });

          if (!emailResponse.ok) {
            console.error('Email send failed:', await emailResponse.text());
          }
        } catch (emailError) {
          console.error('Email notification failed:', emailError);
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        stylist_name: stylist?.display_name,
        stylist_phone: stylist?.phone,
        message: 'Provider has been notified' 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
