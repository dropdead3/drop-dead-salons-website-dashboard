import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExternalLeadPayload {
  source: 'google_business' | 'facebook_lead' | 'instagram_lead' | 'phone_call';
  webhook_secret?: string;
  data: {
    name?: string;
    email?: string;
    phone?: string;
    message?: string;
    location?: string;
    service?: string;
    // CallRail specific
    call_duration?: number;
    caller_number?: string;
    tracking_number?: string;
    // Meta specific
    form_id?: string;
    ad_id?: string;
    ad_name?: string;
    campaign_id?: string;
    // Google Business specific
    conversation_id?: string;
  };
}

function normalizeLeadData(source: string, data: ExternalLeadPayload['data']) {
  const normalized: Record<string, any> = {
    source,
    status: 'new',
    name: data.name || 'Unknown',
    email: data.email || null,
    phone: data.phone || data.caller_number || null,
    message: data.message || null,
    preferred_location: data.location || null,
    preferred_service: data.service || null,
    source_detail: null,
  };

  // Add source-specific details
  if (source === 'phone_call' && data.tracking_number) {
    normalized.source_detail = `Call from ${data.caller_number || 'unknown'} via ${data.tracking_number}`;
  }
  
  if ((source === 'facebook_lead' || source === 'instagram_lead') && data.ad_name) {
    normalized.source_detail = data.ad_name;
    normalized.utm_campaign = data.campaign_id || null;
  }

  if (source === 'google_business' && data.conversation_id) {
    normalized.source_detail = `Conversation: ${data.conversation_id}`;
  }

  return normalized;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: ExternalLeadPayload = await req.json();
    const { source, data, webhook_secret } = payload;

    // Validate source
    const validSources = ['google_business', 'facebook_lead', 'instagram_lead', 'phone_call'];
    if (!source || !validSources.includes(source)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid source' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // TODO: Add webhook secret verification per source
    // For production, you should verify:
    // - CallRail: Signature verification
    // - Meta: App secret verification
    // - Google: OAuth token verification

    if (!data) {
      return new Response(
        JSON.stringify({ success: false, error: 'No data provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Normalize the lead data
    const normalizedLead = normalizeLeadData(source, data);

    console.log(`Capturing ${source} lead:`, normalizedLead.name);

    // Insert into database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: insertedLead, error } = await supabase
      .from('salon_inquiries')
      .insert(normalizedLead)
      .select('id')
      .single();

    if (error) {
      console.error('Error inserting lead:', error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Lead captured successfully: ${insertedLead.id}`);

    // Log activity
    await supabase
      .from('inquiry_activity_log')
      .insert({
        inquiry_id: insertedLead.id,
        action: 'created',
        notes: `Lead captured from ${source}`,
      });

    // TODO: Send notification to front desk
    // await notifyFrontDesk(normalizedLead);

    return new Response(
      JSON.stringify({ success: true, lead_id: insertedLead.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing external lead:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to process lead' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
