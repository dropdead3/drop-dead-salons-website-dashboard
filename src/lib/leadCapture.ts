import { supabase } from '@/integrations/supabase/client';

// Helper to get UTM parameters from URL
export function getUTMParam(param: string): string | null {
  if (typeof window === 'undefined') return null;
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

// Map referral source to inquiry source
export function mapReferralToSource(referralSource: string): 'website_form' | 'referral' | 'walk_in' | 'other' {
  const lowerSource = referralSource.toLowerCase();
  
  if (lowerSource.includes('walk') || lowerSource.includes('in')) {
    return 'walk_in';
  }
  if (lowerSource.includes('friend') || lowerSource.includes('family') || lowerSource.includes('referral') || lowerSource.includes('stylist')) {
    return 'referral';
  }
  
  // All other sources (Instagram, TikTok, Google, Yelp, etc.) are still website form submissions
  // but we capture the detail in source_detail
  return 'website_form';
}

interface LeadData {
  name: string;
  email?: string;
  phone?: string;
  location?: string;
  service?: string;
  stylist?: string;
  referralSource?: string;
  message?: string;
}

export async function captureWebsiteLead(data: LeadData): Promise<{ success: boolean; error?: string }> {
  try {
    const source = data.referralSource ? mapReferralToSource(data.referralSource) : 'website_form';
    
    const { error } = await supabase
      .from('salon_inquiries')
      .insert({
        source,
        source_detail: data.referralSource || null,
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        preferred_location: data.location || null,
        preferred_service: data.service || null,
        preferred_stylist: data.stylist || null,
        message: data.message || null,
        status: 'new',
        utm_source: getUTMParam('utm_source'),
        utm_medium: getUTMParam('utm_medium'),
        utm_campaign: getUTMParam('utm_campaign'),
      });

    if (error) {
      console.error('Error capturing lead:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('Error capturing lead:', err);
    return { success: false, error: 'Failed to submit inquiry' };
  }
}
